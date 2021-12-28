import { Client, query as q } from 'faunadb';

import { IUsersService, NewUser, User, UserStatus } from '../domain';
import { Page, Pagination } from '../domain/utils';
import { BaseFaunaService, FaunaResponse } from './base-fauna-service';

export class FaunaUsersService
  extends BaseFaunaService<User>
  implements IUsersService
{
  constructor(
    private readonly fauna: Client,
    private readonly currentUserId?: string,
  ) {
    super('users', 25);
  }

  getCursor(obj: User | null | undefined): string {
    return obj?.id || '';
  }

  async getFriends(): Promise<Page<User>> {
    const result = await this.fauna.query<User[]>(
      q.Map(
        q.Select(
          ['data', 'friends'],
          q.Get(q.Ref(q.Collection('users'), this.currentUserId)),
        ),

        q.Lambda(
          'ref',
          q.Let(
            {
              userDoc: q.Get(q.Var('ref')),
            },
            {
              id: q.Select(['ref', 'id'], q.Var('userDoc')),
              name: q.Select(['data', 'name'], q.Var('userDoc')),
              email: q.Select(['data', 'email'], q.Var('userDoc')),
              avatarUrl: q.Select(['data', 'avatarUrl'], q.Var('userDoc'), ''),
              provider: q.Select(['data', 'provider'], q.Var('userDoc')),
              providerUserId: q.Select(
                ['data', 'providerUserId'],
                q.Var('userDoc'),
              ),
            },
          ),
        ),
      ),
    );

    // TODO: simulate pagination
    return {
      items: result,
      hasPreviousPage: false,
      startCursor: this.getCursor(result[0]),
      endCursor: this.getCursor(result[result.length - 1]),
      hasNextPage: false,
    };
  }

  async addFriend(userId: string): Promise<User | undefined> {
    try {
      return await this.fauna.query<User>(
        q.Let(
          {
            me: q.Get(q.Ref(q.Collection('users'), this.currentUserId)),
            them: q.Get(q.Ref(q.Collection('users'), userId)),
          },
          q.Do(
            q.Update(q.Select('ref', q.Var('me')), {
              data: {
                friends: q.Union(
                  q.Select(['data', 'friends'], q.Var('me'), []),
                  [q.Select('ref', q.Var('them'))],
                ),
              },
            }),
            q.Let(
              {
                updated: q.Update(q.Select('ref', q.Var('them')), {
                  data: {
                    friends: q.Union(
                      q.Select(['data', 'friends'], q.Var('them'), []),
                      [q.Select('ref', q.Var('me'))],
                    ),
                  },
                }),
              },
              {
                id: q.Select(['ref', 'id'], q.Var('updated')),
                name: q.Select(['data', 'name'], q.Var('updated')),
                email: q.Select(['data', 'email'], q.Var('updated')),
                avatarUrl: q.Select(
                  ['data', 'avatarUrl'],
                  q.Var('updated'),
                  '',
                ),
                provider: q.Select(['data', 'provider'], q.Var('updated')),
                providerUserId: q.Select(
                  ['data', 'providerUserId'],
                  q.Var('updated'),
                ),
              },
            ),
          ),
        ),
      );
    } catch {
      return undefined;
    }
  }

  async removeFriend(userId: string): Promise<boolean> {
    try {
      await this.fauna.query<User>(
        q.Let(
          {
            me: q.Get(q.Ref(q.Collection('users'), this.currentUserId)),
            them: q.Get(q.Ref(q.Collection('users'), userId)),
          },
          q.Do(
            q.Update(q.Select('ref', q.Var('me')), {
              data: {
                friends: q.Difference(
                  q.Select(['data', 'friends'], q.Var('me'), []),
                  [q.Select('ref', q.Var('them'))],
                ),
              },
            }),
            q.Update(q.Select('ref', q.Var('them')), {
              data: {
                friends: q.Difference(
                  q.Select(['data', 'friends'], q.Var('them'), []),
                  [q.Select('ref', q.Var('me'))],
                ),
              },
            }),
          ),
        ),
      );
      return true;
    } catch {
      return false;
    }
  }

  async getUsers(ids: string[]): Promise<User[]> {
    return this.fauna.query<User[]>(
      q.Map(
        ids,
        q.Lambda(
          'id',
          q.Let(
            {
              userDoc: q.Get(q.Ref(q.Collection('users'), q.Var('id'))),
            },
            {
              id: q.Select(['ref', 'id'], q.Var('userDoc')),
              name: q.Select(['data', 'name'], q.Var('userDoc')),
              email: q.Select(['data', 'email'], q.Var('userDoc')),
              avatarUrl: q.Select(['data', 'avatarUrl'], q.Var('userDoc'), ''),
              provider: q.Select(['data', 'provider'], q.Var('userDoc')),
              providerUserId: q.Select(
                ['data', 'providerUserId'],
                q.Var('userDoc'),
              ),
            },
          ),
        ),
      ),
    );
  }

  async getOrCreate(newUser: NewUser): Promise<User> {
    const users = await this.fauna.query<{ data: User[] }>(
      q.Map(
        q.Paginate(
          q.Match(
            q.Index('users_by_provider_and_providerUserId'),
            newUser.provider,
            newUser.providerUserId,
          ),
        ),
        q.Lambda(
          'userRef',
          q.Let(
            {
              userDoc: q.Get(q.Var('userRef')),
            },
            {
              id: q.Select(['ref', 'id'], q.Var('userDoc')),
              name: q.Select(['data', 'name'], q.Var('userDoc')),
              email: q.Select(['data', 'email'], q.Var('userDoc')),
              avatarUrl: q.Select(['data', 'avatarUrl'], q.Var('userDoc'), ''),
              provider: q.Select(['data', 'provider'], q.Var('userDoc')),
              providerUserId: q.Select(
                ['data', 'providerUserId'],
                q.Var('userDoc'),
              ),
            },
          ),
        ),
      ),
    );

    if (users.data[0]) return users.data[0];

    return this.fauna.query<User>(
      q.Let(
        {
          userDoc: q.Create(q.Collection('users'), {
            data: {
              name: newUser.name,
              email: newUser.email,
              avatarUrl: newUser.avatarUrl,
              provider: newUser.provider,
              providerUserId: newUser.providerUserId,
            },
          }),
        },
        {
          id: q.Select(['ref', 'id'], q.Var('userDoc')),
          name: q.Select(['data', 'name'], q.Var('userDoc')),
          email: q.Select(['data', 'email'], q.Var('userDoc')),
          avatarUrl: q.Select(['data', 'avatarUrl'], q.Var('userDoc'), ''),
          provider: q.Select(['data', 'provider'], q.Var('userDoc')),
          providerUserId: q.Select(
            ['data', 'providerUserId'],
            q.Var('userDoc'),
          ),
        },
      ),
    );
  }

  async setStatus(status: UserStatus): Promise<User> {
    throw new Error('Method not implemented.');
  }
}
