import { Pool } from 'pg';
import Pusher from 'pusher';
import { TaskStatus } from '../domain/v1/api.g';
import { RealTime } from './real-time';
import { StatusCalculator } from './status-calculator';

export class SqlStatusCalculator implements StatusCalculator {
  constructor(
    private readonly pool: Pool,
    private readonly schema: string,
    private readonly realTime: RealTime,
  ) {}
  async recalculateTaskStatus(
    taskIds: string[],
  ): Promise<{ taskId: string; status: TaskStatus }[]> {
    if (!taskIds.length) return [];

    const result = await this.pool.query<DbResult>(
      `SELECT t.external_id, t.group_size, COUNT(u.id) count FROM ${
        this.schema
      }.tasks t
        LEFT JOIN ${
          this.schema
        }.participants p ON p.task_external_id = t.external_id AND p.response = 'yes'
        LEFT JOIN ${
          this.schema
        }.users u on p.user_external_id = u.external_id AND u.status = 'idle'
        WHERE t.external_id IN (${taskIds.map(
          (_, i) => `$${i + 1}`,
        )}) AND (t.status = 'waiting' OR t.status = 'ready') 
        GROUP BY t.external_id, t.group_size`,
      taskIds,
    );

    return this.doUpdate(result.rows);
  }

  async recalculateTaskStatusForUsers(
    userIds: string[],
  ): Promise<{ taskId: string; status: TaskStatus }[]> {
    if (!userIds.length) return [];

    const taskIds = (
      await this.pool.query<{ external_id: string }>(
        `SELECT DISTINCT(t.external_id) FROM ${this.schema}.tasks t
          JOIN ${
            this.schema
          }.participants p ON t.external_id = p.task_external_id
          WHERE p.user_external_id IN (${userIds.map((_, i) => `$${i + 1}`)})`,
        userIds,
      )
    ).rows.map((x) => x.external_id);

    return this.recalculateTaskStatus(taskIds);
  }

  private async doUpdate(
    results: DbResult[],
  ): Promise<{ taskId: string; status: TaskStatus }[]> {
    const waiting = results
      .filter((r) => Number(r.count) < r.group_size)
      .map((r) => r.external_id);

    const ready = results
      .filter((r) => Number(r.count) >= r.group_size)
      .map((r) => r.external_id);

    if (waiting.length) {
      await this.pool.query(
        `UPDATE ${this.schema}.tasks
          SET status = 'waiting'
          WHERE status <> 'waiting' AND external_id IN (${waiting.map(
            (_, i) => `$${i + 1}`,
          )})`,
        waiting,
      );
    }

    if (ready.length) {
      await this.pool.query(
        `UPDATE ${this.schema}.tasks
          SET status = 'ready'
          WHERE status <> 'ready' AND external_id IN (${ready.map(
            (_, i) => `$${i + 1}`,
          )})`,
        ready,
      );
    }

    try {
      const changed = [...ready, ...waiting];
      if (changed.length) {
        console.log({ changed });
        const userTasks = (
          await this.pool.query<{
            user_external_id: string;
            task_external_id: string;
          }>(
            `SELECT user_external_id, task_external_id FROM ${
              this.schema
            }.participants WHERE task_external_id IN (${changed.map(
              (_, i) => `$${i + 1}`,
            )})`,
            changed,
          )
        ).rows;
        console.log({ userTasks });

        const usersToUpdate = userTasks.reduce<Record<string, Set<string>>>(
          (acc, item) => {
            acc[item.user_external_id] ||= new Set();
            acc[item.user_external_id].add(item.task_external_id);
            return acc;
          },
          {},
        );
        console.log({ usersToUpdate });

        Object.keys(usersToUpdate).forEach((userId) =>
          this.realTime.trigger(userId, 'task-status:v1', {
            taskIds: Array.from(usersToUpdate[userId]),
          }),
        );
      }
    } catch (ex) {
      console.error('cannot send real-time notifications', ex);
    }

    return [
      ...ready.map((taskId) => ({ taskId, status: 'ready' as const })),
      ...waiting.map((taskId) => ({ taskId, status: 'waiting' as const })),
    ];
  }
}

type DbResult = {
  external_id: string;
  group_size: number;
  count: string;
};
