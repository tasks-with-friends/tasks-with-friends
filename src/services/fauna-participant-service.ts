import { Client, query as q } from 'faunadb';
import {
  Participant,
  ParticipantResponse,
  ParticipantService,
} from '../domain';
import { Pagination, Page } from '../domain/utils';
import {
  BaseFaunaService,
  FaunaResponse,
  SelectExpr,
} from './base-fauna-service';

export class FaunaParticipantService
  extends BaseFaunaService<Participant>
  implements ParticipantService
{
  constructor(
    private readonly client: Client,
    private readonly currentUserId: string,
  ) {
    super('paticipants', 25);
  }

  getCursor(obj: Participant | null | undefined): string {
    return obj?.id || '';
  }

  async getParticipants(ids: string[]): Promise<Participant[]> {
    const result = await this.client.query<DbParticipant[]>(
      q.Map(
        ids,
        q.Lambda(
          'id',
          q.Let(
            {
              t: q.Get(q.Ref(q.Collection(this.collection), q.Var('id'))),
            },
            selectExpr,
          ),
        ),
      ),
    );

    return result.map(toParticipant);
  }

  async getParticipantsByTask(
    taskId: string,
    page?: Pagination,
  ): Promise<Page<Participant>> {
    const pagingExpr = this.pagingExpr(page);
    const result = await this.client.query<FaunaResponse<DbParticipant>>(
      q.Let(
        {
          page: q.Paginate(
            q.Match(
              q.Index('participants_by_task'),
              q.Ref(q.Collection('tasks'), taskId),
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

    return this.toPage(page, {
      ...result,
      data: result.data.map(toParticipant),
    });
  }

  async getParticipantsByUser(
    userId: string,
    page?: Pagination,
  ): Promise<Page<Participant>> {
    const pagingExpr = this.pagingExpr(page);
    const result = await this.client.query<FaunaResponse<DbParticipant>>(
      q.Let(
        {
          page: q.Paginate(
            q.Match(
              q.Index('participants_by_user'),
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

    return this.toPage(page, {
      ...result,
      data: result.data.map(toParticipant),
    });
  }

  async setResponse(
    id: string,
    response: ParticipantResponse,
  ): Promise<Participant | undefined> {
    try {
      const result = await this.client.query<Participant[]>(
        q.Let(
          {
            doc: q.Get(q.Ref(q.Collection(this.collection), id)),
          },
          q.If(
            q.Equals(
              q.Select(['data', 'user', 'id'], q.Var('doc')),
              this.currentUserId,
            ),
            [
              q.Let(
                {
                  t: q.Update(q.Ref(q.Collection(this.collection), id), {
                    data: { response },
                  }),
                },
                selectExpr,
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

  async clearResponse(id: string): Promise<Participant | undefined> {
    try {
      const result = await this.client.query<Participant[]>(
        q.Let(
          {
            doc: q.Get(q.Ref(q.Collection(this.collection), id)),
          },
          q.If(
            q.Equals(
              q.Select(['data', 'user', 'id'], q.Var('doc')),
              this.currentUserId,
            ),
            [
              q.Let(
                {
                  t: q.Update(q.Ref(q.Collection(this.collection), id), {
                    data: { response: null },
                  }),
                },
                selectExpr,
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

type DbParticipant = Omit<Participant, 'response'> & { response: string };

function toParticipant(obj: DbParticipant): Participant {
  const { response, ...rest } = obj;

  switch (response) {
    case 'yes':
    case 'no':
      return { ...rest, response };
    default:
      return rest;
  }
}

const selectExpr: SelectExpr<DbParticipant> = {
  id: q.Select(['ref', 'id'], q.Var('t')),
  userId: q.Select(['data', 'user', 'id'], q.Var('t')),
  taskId: q.Select(['data', 'task', 'id'], q.Var('t')),
  response: q.Select(['data', 'response'], q.Var('t'), ''),
};
