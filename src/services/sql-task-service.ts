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
    if (!this.currentUserId) throw new Error('Unauthorized');

    const { name, description, durationMinutes, groupSize } = params.task;

    const row = (
      await this.pool.query<{ id: number; external_id: string }>(
        `INSERT INTO ${this.schema}.tasks (owner_external_id, name, description, duration_minutes, group_size, status)
        VALUES ($1, $2, $3, $4, $5, 'ready')
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
    first?: number | undefined;
    after?: string | undefined;
    last?: number | undefined;
    before?: string | undefined;
  }): Promise<TaskPage> {
    if (!this.currentUserId) throw new Error('Unauthorized');

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
        `SELECT id, external_id, owner_external_id, name, description, duration_minutes, group_size, status
          FROM ${this.schema}.tasks
          WHERE external_id IN (${taskIds.map((_, i) => `$${i + 1}`)})`,
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
        `SELECT id, external_id, owner_external_id, name, description, duration_minutes, group_size, status
          FROM ${this.schema}.tasks
          WHERE owner_external_id = $1
          
          ${sortValue ? `AND (id, external_id) ${operator} ($3, $4)` : ''}
          ORDER BY id ${orderBy}, external_id ${orderBy}
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
        `SELECT t.id, t.external_id, t.owner_external_id, t.name, t.description, t.duration_minutes, t.group_size, t.status
          FROM ${this.schema}.tasks t
          JOIN ${
            this.schema
          }.participants p on t.external_id = p.task_external_id
          WHERE p.user_external_id = $1
          
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

    if (typeof response !== 'undefined') {
      UNSANITIZED_fields.push('response');
      values.push(response);
    }

    if (!UNSANITIZED_fields.length) throw new Error('Bad Request');

    const updated = (
      await this.pool.query<DbParticipant>(
        `UPDATE ${this.schema}.participants
      SET ${UNSANITIZED_fields.map((f, i) => `${f} = $${i + 1}`).join(', ')}
      WHERE task_external_id = $1 AND external_id = $2
      RETURNING id, external_id, task_external_id, user_external_id, response`,
        [params.taskId, params.participantId, ...values],
      )
    ).rows.map(using(dbParticipantToParticipant))[0];

    if (!updated) throw new Error('Not Found');

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

    return deleted;
  }

  async clearParticipantResponse(params: {
    taskId: string;
    participantId: string;
  }): Promise<void> {
    if (!this.currentUserId) throw new Error('Unauthorized');
    if (params.participantId !== this.currentUserId) {
      throw new Error('Forbidden');
    }

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
