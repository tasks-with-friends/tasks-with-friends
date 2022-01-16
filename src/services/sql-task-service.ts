import { Pool } from 'pg';
import {
  GetTasksStatus,
  NewParticipant,
  NewTask,
  Participant,
  ParticipantList,
  ParticipantPage,
  ParticipantUpdate,
  Task,
  TaskPage,
  TaskService,
  TaskUpdate,
} from '../domain/v1/api.g';
import { MessageBus } from './message-bus';
import { StatusCalculator } from './status-calculator';
import { buildInClause, buildPage, Mapping, parsePage, using } from './utils';

const afterInProgress = 'ready';

export class SqlTaskService implements TaskService {
  constructor(
    private readonly pool: Pool,
    private readonly schema: string,
    private readonly statusCalculator: StatusCalculator,
    private readonly messages: MessageBus,
    private readonly currentUserId?: string,
  ) {}
  async leaveTask({ taskId }: { taskId: string }): Promise<Task> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    const { rowCount } = await this.pool.query(
      `UPDATE ${this.schema}.users
        SET status = 'idle', current_task_external_id = NULL
        WHERE external_id = $1`,
      [this.currentUserId],
    );
    if (!rowCount) throw new Error('Not found');
    this.messages.onUserStatusChanged({ [this.currentUserId]: 'idle' });
    this.messages.onUserCurrentTaskChanged({ [this.currentUserId]: null });

    const { rowCount: remainingParticipants } = await this.pool.query<{
      id: number;
    }>(
      `SELECT p.id FROM ${this.schema}.participants p
          JOIN ${this.schema}.users u ON p.user_external_id = u.external_id
          WHERE p.task_external_id = $1 AND u.status = 'flow'`,
      [taskId],
    );

    if (remainingParticipants === 0) {
      await this.pool.query<{ flow_count: number }>(
        `UPDATE ${this.schema}.tasks
          SET status = '${afterInProgress}'
          WHERE external_id = $1`,
        [taskId],
      );
      this.messages.onTaskStatusChanged({ [taskId]: afterInProgress });
    }

    await this.statusCalculator.recalculateTaskStatusForUsers([
      this.currentUserId,
    ]);

    return this.getTask({ taskId });
  }
  async endTask({ taskId }: { taskId: string; body?: any }): Promise<Task> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    // TODO: ensure that the current user is a flow participant and the task is in progress

    // Set task to done
    const { rowCount: affected } = await this.pool.query(
      `UPDATE ${this.schema}.tasks
          SET status = '${afterInProgress}'
          WHERE status = 'in-progress' AND external_id = $1`,
      [taskId],
    );
    if (!affected) throw new Error('Not found');
    this.messages.onTaskStatusChanged({ [taskId]: afterInProgress });

    // Set all flow participants to idle
    const userIds = (
      await this.pool.query<{ external_id: string }>(
        `UPDATE ${this.schema}.users
        SET status = 'idle', current_task_external_id = NULL
        WHERE current_task_external_id = $1
        RETURNING external_id`,
        [taskId],
      )
    ).rows.map((r) => r.external_id);
    const statusByUser: Record<string, 'idle'> = {};
    const currentTaskByUser: Record<string, null> = {};
    userIds.forEach((id) => {
      statusByUser[id] = 'idle';
      currentTaskByUser[id] = null;
    });
    this.messages.onUserStatusChanged(statusByUser);
    this.messages.onUserCurrentTaskChanged(currentTaskByUser);

    // recalculate status
    await this.statusCalculator.recalculateTaskStatusForUsers(userIds);

    return this.getTask({ taskId });
  }

  async joinTask({ taskId }: { taskId: string }): Promise<Task> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    // TODO: ensure that the current user is a idle participant and the task is in progress

    const { rowCount } = await this.pool.query(
      `UPDATE ${this.schema}.users
        SET status = 'flow', current_task_external_id = $2
        WHERE external_id = $1`,
      [this.currentUserId, taskId],
    );
    if (!rowCount) throw new Error('Not found');
    this.messages.onUserStatusChanged({ [this.currentUserId]: 'flow' });
    this.messages.onUserCurrentTaskChanged({ [this.currentUserId]: taskId });

    await this.statusCalculator.recalculateTaskStatusForUsers([
      this.currentUserId,
    ]);

    return this.getTask({ taskId });
  }
  async startTask({ taskId }: { taskId: string }): Promise<Task> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    // TODO: ensure that the current user is a idle participant

    // Set the task to 'in-progress'
    const { rowCount: affected } = await this.pool.query(
      `UPDATE ${this.schema}.tasks
          SET status = 'in-progress'
          WHERE status = 'ready' AND external_id = $1
          RETURNING *`,
      [taskId],
    );
    if (!affected) throw new Error('Not found');
    this.messages.onTaskStatusChanged({ [taskId]: 'in-progress' });

    await this.pool.query(
      `UPDATE ${this.schema}.users
        SET status = 'flow', current_task_external_id = $2
        WHERE external_id = $1`,
      [this.currentUserId, taskId],
    );
    this.messages.onUserStatusChanged({ [this.currentUserId]: 'flow' });
    this.messages.onUserCurrentTaskChanged({ [this.currentUserId]: taskId });

    await this.statusCalculator.recalculateTaskStatusForUsers([
      this.currentUserId,
    ]);

    return this.getTask({ taskId });
  }

  async createTask(params: { task: NewTask }): Promise<Task> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    const { name, description, durationMinutes, groupSize } = params.task;

    const row = (
      await this.pool.query<{ id: number; external_id: string }>(
        `INSERT INTO ${this.schema}.tasks (owner_external_id, name, description, duration_minutes, group_size, status)
        VALUES ($1, $2, $3, $4, $5, 'waiting')
        RETURNING id, external_id`,
        [this.currentUserId, name, description, durationMinutes, groupSize],
      )
    ).rows[0];

    if (!row) throw new Error('Not Found');

    const { external_id } = row;

    await this.pool.query(
      `INSERT INTO ${this.schema}.participants (task_external_id, user_external_id, response)
        VALUES ($1, $2, 'yes')`,
      [external_id, this.currentUserId],
    );

    return this.getTask({ taskId: external_id });
  }

  getTasks(params?: {
    taskIds?: string[] | undefined;
    ownerId?: string | undefined;
    participantId?: string | undefined;
    status?: GetTasksStatus[];
    first?: number | undefined;
    after?: string | undefined;
    last?: number | undefined;
    before?: string | undefined;
  }): Promise<TaskPage> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    if (params?.taskIds) {
      return this.getTasksById(params?.taskIds);
    } else if (params?.ownerId) {
      return this.getTasksByOwnerId(params?.ownerId, params.status, params);
    } else if (params?.participantId) {
      return this.getTasksByParticipantId(
        params?.participantId,
        params.status,
        params,
      );
    }

    throw new Error('Bad Request');
  }

  private async getTasksById(
    taskIds: string[],
    status?: GetTasksStatus[],
  ): Promise<TaskPage> {
    const { in: idClause, values: idValues } = buildInClause(taskIds || []);
    const { in: statusClause, values: statusValues } = buildInClause(
      status || [],
      idValues.length,
    );
    const items = (
      await this.pool.query<DbTask>(
        `SELECT id, external_id, owner_external_id, name, description, duration_minutes, group_size, status
          FROM ${this.schema}.tasks
          WHERE external_id IN (${idClause})
          ${statusValues?.length ? `AND status IN (${statusClause})` : ''}`,
        [...idValues, ...statusValues],
      )
    ).rows.map(using(dbTaskToTask));

    return {
      hasPreviousPage: false,
      startCursor: items[0]?.id || '',
      items,
      endCursor: items[items.length - 1]?.id || '',
      hasNextPage: false,
    };
  }

  private async getTasksByOwnerId(
    ownerId: string,
    status: GetTasksStatus[] = [],
    params: {
      first?: number | undefined;
      after?: string | undefined;
      last?: number | undefined;
      before?: string | undefined;
    },
  ): Promise<TaskPage> {
    if (ownerId !== this.currentUserId) throw new Error('Forbidden');

    const { uniqueId, count, limit, direction } = parsePage(25, params);
    const orderBy = direction === 'forward' ? 'ASC' : 'DESC';
    const operator = direction === 'forward' ? '>=' : '<=';
    const sortValue = await this.getSortValue<number>(
      `${this.schema}.tasks`,
      'id',
      uniqueId,
    );

    const { in: statusClause, values: statusValues } = buildInClause(
      status || [],
      sortValue ? 5 : 3,
    );

    const items = (
      await this.pool.query<DbTask>(
        `SELECT id, external_id, owner_external_id, name, description, duration_minutes, group_size, status
          FROM ${this.schema}.tasks
          WHERE owner_external_id = $1
          ${status.length ? `AND status IN (${statusClause})` : ''}
          
          ${sortValue ? `AND (id, external_id) ${operator} ($3, $4)` : ''}
          ORDER BY id ${orderBy}, external_id ${orderBy}
          limit $2`,
        sortValue
          ? [ownerId, limit, sortValue, uniqueId, ...statusValues]
          : [ownerId, limit, ...statusValues],
      )
    ).rows.map(using(dbTaskToTask));

    return buildPage(items, count, !!sortValue, direction, (x) => x?.id || '');
  }

  private async getTasksByParticipantId(
    participantId: string,
    status: GetTasksStatus[] = [],
    params: {
      first?: number | undefined;
      after?: string | undefined;
      last?: number | undefined;
      before?: string | undefined;
    },
  ): Promise<TaskPage> {
    if (participantId !== this.currentUserId) throw new Error('Forbidden');

    const { uniqueId, count, limit, direction } = parsePage(25, params);
    const orderBy = direction === 'forward' ? 'ASC' : 'DESC';
    const operator = direction === 'forward' ? '>=' : '<=';
    const sortValue = await this.getSortValue<number>(
      `${this.schema}.tasks`,
      'id',
      uniqueId,
    );

    const { in: statusClause, values: statusValues } = buildInClause(
      status || [],
      sortValue ? 5 : 3,
    );

    const items = (
      await this.pool.query<DbTask>(
        `SELECT t.id, t.external_id, t.owner_external_id, t.name, t.description, t.duration_minutes, t.group_size, t.status
          FROM ${this.schema}.tasks t
          JOIN ${
            this.schema
          }.participants p on t.external_id = p.task_external_id
          WHERE p.user_external_id = $1
          ${status.length ? `AND status IN (${statusClause})` : ''}
          
          ${sortValue ? `AND (t.id, t.external_id) ${operator} ($3, $4)` : ''}
          ORDER BY t.id ${orderBy}, t.external_id ${orderBy}
          limit $2`,
        sortValue
          ? [participantId, limit, sortValue, uniqueId, ...statusValues]
          : [participantId, limit, ...statusValues],
      )
    ).rows.map(using(dbTaskToTask));

    return buildPage(items, count, !!sortValue, direction, (x) => x?.id || '');
  }

  async getTask(params: { taskId: string }): Promise<Task> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    return (await this.getTasksById([params.taskId])).items[0];
  }

  async updateTask(params: {
    taskId: string;
    taskUpdate: TaskUpdate;
  }): Promise<Task> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    // TODO: implement participant set
    if (params.taskUpdate.participants?.set) {
      throw new Error('Method not implemented');
    }

    const UNSANITIZED_fields: string[] = [];
    const values: any[] = [];

    const { taskId } = params;
    const {
      name,
      description,
      durationMinutes,
      groupSize,
      status,
      participants,
    } = params.taskUpdate;

    let recalculate = false;

    if (typeof name !== 'undefined') {
      UNSANITIZED_fields.push('name');
      values.push(name);
    }
    if (typeof description !== 'undefined') {
      UNSANITIZED_fields.push('description');
      values.push(description);
    }
    if (typeof durationMinutes !== 'undefined') {
      UNSANITIZED_fields.push('duration_minutes');
      values.push(durationMinutes);
    }
    if (typeof groupSize !== 'undefined') {
      UNSANITIZED_fields.push('group_size');
      values.push(groupSize);
      recalculate = true;
    }
    if (typeof status !== 'undefined') {
      UNSANITIZED_fields.push('status');
      values.push(status);

      // TODO: dont allow this

      // TODO: get user IDs for all participants for this task
      // TODO: run await this.statusCalculator.recalculateTaskStatusForUsers(user IDs); after the update
    }

    if (
      !UNSANITIZED_fields.length &&
      !participants?.add &&
      !participants?.remove &&
      !participants?.set
    ) {
      throw new Error('Bad Request');
    }

    if (UNSANITIZED_fields.length) {
      const affected = (
        await this.pool.query(
          `UPDATE ${this.schema}.tasks
      SET ${UNSANITIZED_fields.map((f, i) => `${f} = $${i + 3}`).join(', ')}
      WHERE owner_external_id = $1 AND external_id = $2`,
          [this.currentUserId, params.taskId, ...values],
        )
      ).rowCount;

      if (!affected) throw new Error('Not found');
    }

    if (participants?.add) {
      await this.createParticipants({
        taskId,
        participants: participants.add.map((userId) => ({ userId })),
      });
    }

    if (participants?.remove) {
      await this.pool.query<DbParticipant>(
        `DELETE FROM ONLY ${this.schema}.participants
          WHERE task_external_id = $1 AND user_external_id IN (${participants?.remove.map(
            (_, i) => `$${i + 2}`,
          )})`,
        [params.taskId, ...participants?.remove],
      );
    }

    if (recalculate) {
      await this.statusCalculator.recalculateTaskStatus([params.taskId]);
    }

    // TODO: implement participant set

    return this.getTask({ taskId: params.taskId });
  }

  async removeTask(params: { taskId: string }): Promise<Task> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    await this.pool.query<DbTask>(
      `DELETE FROM ONLY ${this.schema}.participants
        WHERE task_external_id = $1`,
      [params.taskId],
    );

    const deleted = (
      await this.pool.query<DbTask>(
        `DELETE FROM ONLY ${this.schema}.tasks
        WHERE external_id = $1
        RETURNING id, external_id, owner_external_id, name, description, duration_minutes, group_size, status`,
        [params.taskId],
      )
    ).rows.map(using(dbTaskToTask))[0];

    if (!deleted) throw new Error('Not Found');

    return deleted;
  }

  async createParticipants(params: {
    taskId: string;
    participants: NewParticipant[];
  }): Promise<ParticipantList> {
    if (!this.currentUserId) throw new Error('Unauthorized');
    if (!params.participants.length) return { items: [] };

    const userIds = params.participants.map((p) => p.userId);

    const items = (
      await this.pool.query<DbParticipant>(
        `INSERT INTO ${
          this.schema
        }.participants (task_external_id, user_external_id)
          VALUES ${userIds.map((_, i) => `($1, $${i + 2})`).join(',')}
          RETURNING id, external_id, task_external_id, user_external_id, response`,
        [params.taskId, ...userIds],
      )
    ).rows.map(using(dbParticipantToParticipant));

    // consider recalculating task status if a participant status of 'YES' is added

    const data: Record<string, string> = {};
    for (const item of items) {
      data[item.userId] = params.taskId;
    }
    this.messages.onAddedToTask(data);

    return { items };
  }

  async getParticipants(params: {
    taskId: string;
    first?: number | undefined;
    after?: string | undefined;
    last?: number | undefined;
    before?: string | undefined;
  }): Promise<ParticipantPage> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    const { uniqueId, count, limit, direction } = parsePage(25, params);
    const orderBy = direction === 'forward' ? 'ASC' : 'DESC';
    const operator = direction === 'forward' ? '>=' : '<=';
    const sortValue = await this.getSortValue<number>(
      `${this.schema}.participants`,
      'id',
      uniqueId,
    );

    const items = (
      await this.pool.query<DbParticipant>(
        `SELECT id, external_id, task_external_id, user_external_id, response FROM ${
          this.schema
        }.participants p
        WHERE task_external_id = $1
        
        ${sortValue ? `AND (id, external_id) ${operator} ($3, $4)` : ''}
        ORDER BY id ${orderBy}, external_id ${orderBy}
        limit $2`,
        sortValue
          ? [params.taskId, limit, sortValue, uniqueId]
          : [params.taskId, limit],
      )
    ).rows.map(using(dbParticipantToParticipant));

    return buildPage(items, count, !!sortValue, direction, (x) => x?.id || '');
  }

  async updateParticipant(params: {
    taskId: string;
    participantId: string;
    participant: ParticipantUpdate;
  }): Promise<Participant> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    const UNSANITIZED_fields: string[] = [];
    const values: any[] = [];

    const { response } = params.participant;

    let recalculate = false;
    if (typeof response !== 'undefined') {
      UNSANITIZED_fields.push('response');
      values.push(response);
      recalculate = true;
    }

    if (!UNSANITIZED_fields.length) throw new Error('Bad Request');

    const updated = (
      await this.pool.query<DbParticipant>(
        `UPDATE ${this.schema}.participants
      SET ${UNSANITIZED_fields.map((f, i) => `${f} = $${i + 3}`).join(', ')}
      WHERE task_external_id = $1 AND external_id = $2
      RETURNING id, external_id, task_external_id, user_external_id, response`,
        [params.taskId, params.participantId, ...values],
      )
    ).rows.map(using(dbParticipantToParticipant))[0];

    if (!updated) throw new Error('Not Found');

    if (recalculate) {
      await this.statusCalculator.recalculateTaskStatus([params.taskId]);
    }

    return updated;
  }

  async removeParticipant(params: {
    taskId: string;
    participantId: string;
  }): Promise<Participant> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    // TODO: ensure the current user is the owner
    const deleted = (
      await this.pool.query<DbParticipant>(
        `DELETE FROM ONLY ${this.schema}.participants
          WHERE task_external_id = $1 AND external_id = $2
          RETURNING id, external_id, task_external_id, user_external_id, response`,
        [params.taskId, params.participantId],
      )
    ).rows.map(using(dbParticipantToParticipant))[0];

    if (!deleted) throw new Error('Not Found');

    await this.statusCalculator.recalculateTaskStatus([params.taskId]);

    return deleted;
  }

  async clearParticipantResponse(params: {
    taskId: string;
    participantId: string;
  }): Promise<Participant> {
    if (!this.currentUserId) throw new Error('Unauthorized');

    const updated = (
      await this.pool.query(
        `UPDATE ${this.schema}.participants
          SET response = NULL
          WHERE task_external_id = $1 AND external_id = $2
          RETURNING id, external_id, task_external_id, user_external_id, response`,
        [params.taskId, params.participantId],
      )
    ).rows.map(using(dbParticipantToParticipant))[0];

    if (!updated) throw new Error('Not Found');

    await this.statusCalculator.recalculateTaskStatus([params.taskId]);

    return updated;
  }

  private async getSortValue<T>(
    UNSANITIZED_table: string,
    UNSANITIZED_field: string,
    external_id: string | undefined,
  ): Promise<T | null> {
    if (!external_id) return null;
    const row = (
      await this.pool.query(
        `SELECT ${UNSANITIZED_field} FROM ${UNSANITIZED_table} WHERE external_id = $1 LIMIT 1`,
        [external_id],
      )
    ).rows[0];

    return !row ? null : row[UNSANITIZED_field];
  }
}

type DbTask = {
  id: number;
  external_id: string;
  owner_external_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  group_size: number;
  status: string;
};

const dbTaskToTask: Mapping<DbTask, Task> = {
  id: 'external_id',
  ownerId: 'owner_external_id',
  name: 'name',
  description: 'description',
  durationMinutes: 'duration_minutes',
  groupSize: 'group_size',
  status: (src) => {
    switch (src.status) {
      case 'waiting':
      case 'ready':
      case 'in-progress':
      case 'done':
        return src.status;
      default:
        return 'waiting';
    }
  },
};

type DbParticipant = {
  id: number;
  external_id: string;
  user_external_id: string;
  task_external_id: string;
  response: string;
};

const dbParticipantToParticipant: Mapping<DbParticipant, Participant> = {
  id: 'external_id',
  userId: 'user_external_id',
  taskId: 'task_external_id',
  response: (src) => {
    switch (src.response) {
      case 'yes':
      case 'no':
        return src.response;
      default:
        return undefined;
    }
  },
};
