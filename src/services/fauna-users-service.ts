import { IUsersService, NewUser, User, UserStatus } from '../domain';

import { Client, query as q } from 'faunadb';
import { Page, Pagination } from '../domain/utils';

export class FaunaUsersService implements IUsersService {
  constructor(private readonly fauna: Client) {}

  getCursor(obj: User): string {
    return obj.id;
  }

  async getFriends(page?: Pagination): Promise<Page<User>> {
    throw new Error('Method not implemented.');
  }
  async setStatus(status: UserStatus): Promise<User> {
    throw new Error('Method not implemented.');
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
}
