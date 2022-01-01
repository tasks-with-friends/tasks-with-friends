import { Pool } from 'pg';
import {
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
import { buildPage, Mapping, parsePage, using } from './utils';

export class SqlTaskService implements TaskService {
  constructor(
    private readonly pool: Pool,
    private readonly schema: string,
    private readonly currentUserId?: string,
  ) {}

  async createTask(params: { task: NewTask }): Promise<Task> {
    const { name, description, durationMinutes, groupSize } = params.task;

    const row = (
      await this.pool.query<{ id: number; external_id: string }>(
        `INSERT INTO ${this.schema}.tasks (owner_id, name, description, duration_minutes, group_size, status)
        SELECT id, $2, $3, $4, $5, 'ready' from ${this.schema}.users WHERE external_id = $1
        RETURNING id, external_id`,
        [this.currentUserId, name, description, durationMinutes, groupSize],
      )
    ).rows[0];

    if (!row) throw new Error('Not Found');

    const { id, external_id } = row;

    await this.pool.query(
      `
        INSERT INTO ${this.schema}.participants (task_id, user_id, response)
        SELECT $1, id, 'yes' FROM ${this.schema}.users WHERE external_id = $2
    `,
      [id, this.currentUserId],
    );

    return this.getTask({ taskId: external_id });
  }

  getTasks(params?: {
    taskIds?: string[] | undefined;
    ownerId?: string | undefined;
    participantId?: string | undefined;
    first?: number | undefined;
    after?: string | undefined;
    last?: number | undefined;
    before?: string | undefined;
  }): Promise<TaskPage> {
    if (params?.taskIds) {
      return this.getTasksById(params?.taskIds);
    } else if (params?.ownerId) {
      return this.getTasksByOwnerId(params?.ownerId, params);
    } else if (params?.participantId) {
      return this.getTasksByParticipantId(params?.participantId, params);
    }

    throw new Error('Bad Request');
  }

  private async getTasksById(taskIds: string[]): Promise<TaskPage> {
    const items = (
      await this.pool.query<DbTask>(
        `SELECT t.id, t.external_id, t.owner_id, u.external_id owner_external_id, t.name, t.description, t.duration_minutes, t.group_size, t.status
          FROM ${this.schema}.tasks t
          JOIN ${this.schema}.users u
          ON t.owner_id = u.id
          WHERE t.external_id IN (${taskIds.map((_, i) => `$${i + 1}`)})`,
        [...taskIds],
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

    const items = (
      await this.pool.query<DbTask>(
        `SELECT t.id, t.external_id, t.owner_id, u.external_id owner_external_id, t.name, t.description, t.duration_minutes, t.group_size, t.status
          FROM ${this.schema}.tasks t
          JOIN ${this.schema}.users u ON t.owner_id = u.id
          WHERE u.external_id = $1
          
          ${sortValue ? `AND (t.id, t.external_id) ${operator} ($3, $4)` : ''}
          ORDER BY t.id ${orderBy}, t.external_id ${orderBy}
          limit $2`,
        sortValue ? [ownerId, limit, sortValue, uniqueId] : [ownerId, limit],
      )
    ).rows.map(using(dbTaskToTask));

    return buildPage(items, count, !!sortValue, direction, (x) => x?.id || '');
  }

  private async getTasksByParticipantId(
    participantId: string,
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

    const items = (
      await this.pool.query<DbTask>(
        `SELECT t.id, t.external_id, t.owner_id, u.external_id owner_external_id, t.name, t.description, t.duration_minutes, t.group_size, t.status
          FROM ${this.schema}.tasks t
          JOIN ${this.schema}.participants p on t.id = p.task_id
          JOIN ${this.schema}.users u ON p.user_id = u.id
          WHERE u.external_id = $1
          
          ${sortValue ? `AND (t.id, t.external_id) ${operator} ($3, $4)` : ''}
          ORDER BY t.id ${orderBy}, t.external_id ${orderBy}
          limit $2`,
        sortValue
          ? [participantId, limit, sortValue, uniqueId]
          : [participantId, limit],
      )
    ).rows.map(using(dbTaskToTask));

    return buildPage(items, count, !!sortValue, direction, (x) => x?.id || '');
  }

  async getTask(params: { taskId: string }): Promise<Task> {
    return (await this.getTasksById([params.taskId])).items[0];
  }

  async updateTask(params: {
    taskId: string;
    taskUpdate: TaskUpdate;
  }): Promise<Task> {
    const UNSANITIZED_fields: string[] = [];
    const values: any[] = [];

    const { name, description, durationMinutes, groupSize, status } =
      params.taskUpdate;

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
    }
    if (typeof status !== 'undefined') {
      UNSANITIZED_fields.push('status');
      values.push(status);
    }

    if (!UNSANITIZED_fields.length) throw new Error('Bad Request');

    await this.pool.query(
      `UPDATE ${this.schema}.tasks
      SET ${UNSANITIZED_fields.map((f, i) => `${f} = $${i + 2}`).join(', ')}
      WHERE external_id = $1`,
      [params.taskId, ...values],
    );

    return this.getTask({ taskId: params.taskId });
  }

  async removeTask(params: { taskId: string }): Promise<Task> {
    await this.pool.query<DbTask>(
      `DELETE FROM ONLY ${this.schema}.participants p
        USING ${this.schema}.tasks t
        WHERE p.task_id = t.id AND t.external_id = $1`,
      [params.taskId],
    );

    const deleted = (
      await this.pool.query<DbTask>(
        `DELETE FROM ONLY ${this.schema}.tasks t
        USING ${this.schema}.users u
        WHERE t.owner_id = u.id
          AND t.external_id = $1
        RETURNING t.id, t.external_id, t.owner_id, u.external_id owner_external_id, t.name, t.description, t.duration_minutes, t.group_size, t.status`,
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
    const userIds = params.participants.map((p) => p.userId);
    const createdIds = (
      await this.pool.query<{ id: number }>(
        `INSERT INTO ${this.schema}.participants (task_id, user_id)
          SELECT t.id, u.id FROM ${this.schema}.users u
          JOIN ${this.schema}.tasks t ON t.external_id = $1
          WHERE u.external_id IN (${userIds.map((_, i) => `$${i + 2}`)})
          RETURNING id`,
        [params.taskId, ...userIds],
      )
    ).rows;

    const items = (
      await this.pool.query<DbParticipant>(
        `SELECT p.id, p.external_id, t.external_id task_external_id, u.external_id user_external_id, p.response FROM ${
          this.schema
        }.participants p
        JOIN ${this.schema}.users u ON p.user_id = u.id
        JOIN ${this.schema}.tasks t IN p.task_id = t.id
        WHERE p.id IN (${createdIds.map((_, i) => `$${i + 1}`)})`,
        [...createdIds],
      )
    ).rows.map(using(dbParticipantToParticipant));

    return { items };
  }

  async getParticipants(params: {
    taskId: string;
    first?: number | undefined;
    after?: string | undefined;
    last?: number | undefined;
    before?: string | undefined;
  }): Promise<ParticipantPage> {
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
        `SELECT p.id, p.external_id, t.external_id task_external_id, u.external_id user_external_id, p.response FROM ${
          this.schema
        }.participants p
        JOIN ${this.schema}.users u ON p.user_id = u.id
        JOIN ${this.schema}.tasks t ON p.task_id = t.id
        WHERE t.external_id = $1
        
        ${sortValue ? `AND (p.id, p.external_id) ${operator} ($3, $4)` : ''}
        ORDER BY p.id ${orderBy}, p.external_id ${orderBy}
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
    const UNSANITIZED_fields: string[] = [];
    const values: any[] = [];

    const { response } = params.participant;

    if (typeof response !== 'undefined') {
      UNSANITIZED_fields.push('response');
      values.push(response);
    }

    if (!UNSANITIZED_fields.length) throw new Error('Bad Request');

    await this.pool.query(
      `UPDATE ${this.schema}.participants
      SET ${UNSANITIZED_fields.map((f, i) => `${f} = $${i + 1}`).join(', ')}
      WHERE external_id = $1`,
      [params.participantId, ...values],
    );

    const updated = (
      await this.pool.query<DbParticipant>(
        `SELECT p.id, p.external_id, t.external_id task_external_id, u.external_id user_external_id, p.response FROM ${this.schema}.participants p
        JOIN ${this.schema}.users u ON p.user_id = u.id
        JOIN ${this.schema}.tasks t IN p.task_id = t.id
        WHERE p.external_id = $1`,
        [params.participantId],
      )
    ).rows.map(using(dbParticipantToParticipant))[0];

    if (!updated) throw new Error('Not Found');

    return updated;
  }

  async removeParticipant(params: {
    taskId: string;
    participantId: string;
  }): Promise<Participant> {
    const deleted = (
      await this.pool.query<DbParticipant>(
        `DELETE FROM ONLY ${this.schema}.participants p
        USING ${this.schema}.users u
        USING ${this.schema}.users owner
        USING ${this.schema}.tasks t
        WHERE p.user_id = u.id
          AND p.task_id = t.id
          AND t.owner_user_id = owner_id
          AND owner.external_id = $1
          AND t.external_id = $2
          AND p.external_id = $3
        RETURNING p.id, p.external_id, t.external_id task_external_id, u.external_id user_external_id, p.response`,
        [this.currentUserId, params.taskId, params.participantId],
      )
    ).rows.map(using(dbParticipantToParticipant))[0];

    if (!deleted) throw new Error('Not Found');

    return deleted;
  }

  async clearParticipantResponse(params: {
    taskId: string;
    participantId: string;
  }): Promise<void> {
    await this.pool.query(
      `UPDATE ${this.schema}.participants
      SET response = NULL
      WHERE external_id = $1`,
      [params.participantId],
    );

    const updated = (
      await this.pool.query<DbParticipant>(
        `SELECT p.id, p.external_id, t.external_id task_external_id, u.external_id user_external_id, p.response FROM ${this.schema}.participants p
        JOIN ${this.schema}.users u ON p.user_id = u.id
        JOIN ${this.schema}.tasks t IN p.task_id = t.id
        WHERE p.external_id = $1`,
        [params.participantId],
      )
    ).rows.map(using(dbParticipantToParticipant))[0];

    if (!updated) throw new Error('Not Found');
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
  owner_id: number;
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
      case 'ready':
      case 'in-progress':
      case 'done':
      case 'canceled':
        return src.status;
      default:
        return 'canceled';
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
