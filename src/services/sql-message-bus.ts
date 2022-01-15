import { Pool } from 'pg';
import { TaskStatus, UserStatus } from '../domain/v1/api.g';
import { MessageBus } from './message-bus';
import { EventMap, RealTime } from './real-time';

export class SqlMessageBus implements MessageBus {
  constructor(
    private readonly pool: Pool,
    private readonly schema: string,
    private readonly realTime: RealTime,
  ) {}
  private readonly taskStatus: Map<string, TaskStatus> = new Map();
  private readonly userStatus: Map<string, UserStatus> = new Map();

  onTaskStatusChanged(statusByTaskId: Record<string, TaskStatus>) {
    for (const taskId of Object.keys(statusByTaskId)) {
      this.taskStatus.set(taskId, statusByTaskId[taskId]);
    }
  }

  onUserStatusChanged(statusByUserId: Record<string, UserStatus>) {
    for (const userId of Object.keys(statusByUserId)) {
      this.userStatus.set(userId, statusByUserId[userId]);
    }
  }

  private async computeTaskMessages(): Promise<
    Map<string, Map<string, TaskStatus>>
  > {
    const statusByTaskByRecipient: Map<
      string,
      Map<string, TaskStatus>
    > = new Map();
    const taskIds = Array.from(this.taskStatus.keys());
    if (!taskIds.length) return statusByTaskByRecipient;

    const userTasks = (
      await this.pool.query<{
        user_external_id: string;
        task_external_id: string;
      }>(
        `SELECT user_external_id, task_external_id FROM ${
          this.schema
        }.participants WHERE task_external_id IN (${taskIds.map(
          (_, i) => `$${i + 1}`,
        )})`,
        taskIds,
      )
    ).rows;

    const usersToUpdate = userTasks.reduce<Record<string, Set<string>>>(
      (acc, item) => {
        acc[item.user_external_id] ||= new Set();
        acc[item.user_external_id].add(item.task_external_id);
        return acc;
      },
      {},
    );

    for (const userId of Object.keys(usersToUpdate)) {
      const taskIdsForUser = usersToUpdate[userId];
      if (taskIdsForUser.size) {
        const x: Map<string, TaskStatus> = new Map();
        for (const taskId of taskIdsForUser) {
          const status = this.taskStatus.get(taskId);

          if (status) x.set(taskId, status);
        }
        statusByTaskByRecipient.set(userId, x);
      }
    }
    return statusByTaskByRecipient;
  }

  private async computeUserMessages(): Promise<
    Map<string, Map<string, UserStatus>>
  > {
    const statusByUserByRecipient: Map<
      string,
      Map<string, UserStatus>
    > = new Map();
    const userIds = Array.from(this.userStatus.keys());
    if (!userIds.length) return statusByUserByRecipient;

    const userFriends = (
      await this.pool.query<{
        user_external_id: string;
        friend_user_external_id: string;
      }>(
        `SELECT user_external_id, friend_user_external_id FROM ${
          this.schema
        }.friends WHERE user_external_id IN (${userIds.map(
          (_, i) => `$${i + 1}`,
        )})`,
        userIds,
      )
    ).rows;

    const usersByRecipient = userFriends.reduce<Record<string, Set<string>>>(
      (acc, item) => {
        acc[item.user_external_id] ||= new Set();
        acc[item.user_external_id].add(item.user_external_id);

        acc[item.friend_user_external_id] ||= new Set();
        acc[item.friend_user_external_id].add(item.user_external_id);
        return acc;
      },
      {},
    );

    for (const recipient of Object.keys(usersByRecipient)) {
      const userIdsForRecipient = usersByRecipient[recipient];
      if (userIdsForRecipient.size) {
        const x: Map<string, UserStatus> = new Map();
        for (const userId of userIdsForRecipient) {
          const status = this.userStatus.get(userId);

          if (status) x.set(userId, status);
        }
        statusByUserByRecipient.set(recipient, x);
      }
    }

    return statusByUserByRecipient;
  }

  async drain(): Promise<void> {
    const [taskMessages, userMessages] = await Promise.all([
      this.computeTaskMessages(),
      this.computeUserMessages(),
    ]);

    const recipients: Set<string> = new Set([
      ...taskMessages.keys(),
      ...userMessages.keys(),
    ]);

    for (const recipient of recipients) {
      const message: EventMap['multi-payload:v1'] = {};

      const t = taskMessages.get(recipient);
      if (t) {
        message.taskStatus = toRecord(t);
      }

      const u = userMessages.get(recipient);
      if (u) {
        message.userStatus = toRecord(u);
      }

      await this.realTime.trigger(recipient, 'multi-payload:v1', message);
    }
  }
}

function toRecord<T>(map: Map<string, T>): Record<string, T> {
  const record: Record<string, T> = {};

  for (const [key, value] of map) {
    record[key] = value;
  }

  return record;
}
