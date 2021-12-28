import { Client, query as q } from 'faunadb';

import { NewTask, Task, TaskService, TaskUpdate } from '../domain';
import { Pagination, Page } from '../domain/utils';
import {
  BaseFaunaService,
  FaunaResponse,
  SelectExpr,
} from './base-fauna-service';

export class FaunaTaskService
  extends BaseFaunaService<Task>
  implements TaskService
{
  constructor(
    private readonly client: Client,
    private readonly currentUserId: string,
  ) {
    super('tasks', 25);
  }

  getCursor(obj: Task | null | undefined): string {
    return obj?.id || '';
  }

  getTasks(ids: string[]): Promise<Task[]> {
    return this.client.query<Task[]>(
      q.Map(
        ids,
        q.Lambda(
          'id',
          q.Let(
            {
              t: q.Get(q.Ref(q.Collection(this.collection), q.Var('id'))),
            },
            {
              id: q.Select(['ref', 'id'], q.Var('t')),
              ownerId: q.Select(['data', 'owner', 'id'], q.Var('t')),
              name: q.Select(['data', 'name'], q.Var('t')),
              description: q.Select(
                ['data', 'description'],
                q.Var('t'),
                undefined,
              ),
              durationMinutes: q.Select(
                ['data', 'durationMinutes'],
                q.Var('t'),
              ),
              groupSize: q.Select(['data', 'groupSize'], q.Var('t')),
              status: q.Select(['data', 'status'], q.Var('t')),
            },
          ),
        ),
      ),
    );
  }

  async getTasksByOwnerId(
    ownerId: string,
    page?: Pagination,
  ): Promise<Page<Task>> {
    const pagingExpr = this.pagingExpr(page);
    const result = await this.client.query<FaunaResponse<Task>>(
      q.Let(
        {
          page: q.Paginate(
            q.Match(
              q.Index('tasks_by_owner'),
              q.Ref(q.Collection('users'), ownerId),
            ),
            pagingExpr,
          ),
        },
        {
          before: q.Select(['before', 0, 'id'], q.Var('page'), ''),
          after: q.Select(['after', 0, 'id'], q.Var('page'), ''),
          take: pagingExpr.size,
          data: q.Map(
            q.Select(['data'], q.Var('page')),
            q.Lambda(
              'ref',
              q.Let(
                {
                  t: q.Get(q.Var('ref')),
                },
                selectExpr,
              ),
            ),
          ),
        },
      ),
    );

    return this.toPage(page, result);
  }

  async getTasksByParticipatingUserId(
    userId: string,
    page?: Pagination,
  ): Promise<Page<Task>> {
    const pagingExpr = this.pagingExpr(page);
    const result = await this.client.query<FaunaResponse<Task>>(
      q.Let(
        {
          page: q.Paginate(
            q.Match(
              q.Index('participants_by_user_with_task'),
              q.Ref(q.Collection('users'), userId),
            ),
            pagingExpr,
          ),
        },
        {
          before: q.Select(['before', 0, 'id'], q.Var('page'), ''),
          after: q.Select(['after', 0, 'id'], q.Var('page'), ''),
          take: pagingExpr.size,
          data: q.Map(
            q.Select(['data'], q.Var('page')),
            q.Lambda(
              'ref',
              q.Let(
                {
                  t: q.Get(q.Var('ref')),
                },
                selectExpr,
              ),
            ),
          ),
        },
      ),
    );

    return this.toPage(page, result);
  }

  createTask(task: NewTask): Promise<Task> {
    // TODO: also create self-participant
    return this.client.query<Task>(
      q.Let(
        {
          t: q.Create(q.Collection(this.collection), {
            data: {
              owner: q.Ref(q.Collection('users'), this.currentUserId),
              name: task.name,
              description: task.description,
              durationMinutes: task.durationMinutes,
              groupSize: task.groupSize,
              status: 'ready',
            },
          }),
        },
        {
          id: q.Select(['ref', 'id'], q.Var('t')),
          ownerId: q.Select(['data', 'owner', 'id'], q.Var('t')),
          name: q.Select(['data', 'name'], q.Var('t')),
          description: q.Select(['data', 'description'], q.Var('t'), ''),
          durationMinutes: q.Select(['data', 'durationMinutes'], q.Var('t')),
          groupSize: q.Select(['data', 'groupSize'], q.Var('t')),
          status: q.Select(['data', 'status'], q.Var('t')),
        },
      ),
    );
  }

  editTask(task: TaskUpdate): Promise<Task> {
    // TODO: AuthN
    const { name, description, durationMinutes, groupSize, status } = task;
    const data: Omit<TaskUpdate, 'id'> = {};
    if (present(name)) data.name = name;
    if (defined(description)) data.description = description;
    if (present(durationMinutes)) data.durationMinutes = durationMinutes;
    if (present(groupSize)) data.groupSize = groupSize;
    if (present(status)) data.status = status;

    return this.client.query<Task>(
      q.Let(
        {
          t: q.Update(q.Ref(q.Collection(this.collection), task.id), { data }),
        },
        {
          id: q.Select(['ref', 'id'], q.Var('t')),
          ownerId: q.Select(['data', 'owner', 'id'], q.Var('t')),
          name: q.Select(['data', 'name'], q.Var('t')),
          description: q.Select(['data', 'description'], q.Var('t'), ''),
          durationMinutes: q.Select(['data', 'durationMinutes'], q.Var('t')),
          groupSize: q.Select(['data', 'groupSize'], q.Var('t')),
          status: q.Select(['data', 'status'], q.Var('t')),
        },
      ),
    );
  }

  async removeTask(id: string): Promise<Task | undefined> {
    // TODO: also remove participants in a transaction
    try {
      const result = await this.client.query<Task[]>(
        q.Let(
          {
            doc: q.Get(q.Ref(q.Collection(this.collection), id)),
          },
          q.If(
            q.Equals(
              q.Select(['data', 'owner', 'id'], q.Var('doc')),
              this.currentUserId,
            ),
            [
              q.Let(
                { t: q.Delete(q.Select('ref', q.Var('doc'))) },
                {
                  id: q.Select(['ref', 'id'], q.Var('t')),
                  ownerId: q.Select(['data', 'owner', 'id'], q.Var('t')),
                  name: q.Select(['data', 'name'], q.Var('t')),
                  description: q.Select(
                    ['data', 'description'],
                    q.Var('t'),
                    '',
                  ),
                  durationMinutes: q.Select(
                    ['data', 'durationMinutes'],
                    q.Var('t'),
                  ),
                  groupSize: q.Select(['data', 'groupSize'], q.Var('t')),
                  status: q.Select(['data', 'status'], q.Var('t')),
                },
              ),
            ],
            [],
          ),
        ),
      );

      return result[0];
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }
}

function present<T>(value: T | null | undefined): value is T {
  return value !== null && typeof value !== 'undefined';
}

function defined<T>(value: T | null | undefined): value is T | null {
  return typeof value !== 'undefined';
}

const selectExpr: SelectExpr<Task> = {
  id: q.Select(['ref', 'id'], q.Var('t')),
  ownerId: q.Select(['data', 'owner', 'id'], q.Var('t')),
  name: q.Select(['data', 'name'], q.Var('t')),
  description: q.Select(['data', 'description'], q.Var('t'), ''),
  durationMinutes: q.Select(['data', 'durationMinutes'], q.Var('t')),
  groupSize: q.Select(['data', 'groupSize'], q.Var('t')),
  status: q.Select(['data', 'status'], q.Var('t'), 'ready'),
};
