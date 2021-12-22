import { IUsersService, NewUser, User } from '../domain';

import { Client, query as q } from 'faunadb';

export class FaunaUsersService implements IUsersService {
  constructor(private readonly fauna: Client) {}

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
              avatarUrl: newUser.avatarUrl,
              provider: newUser.provider,
              providerUserId: newUser.providerUserId,
            },
          }),
        },
        {
          id: q.Select(['ref', 'id'], q.Var('userDoc')),
          name: q.Select(['data', 'name'], q.Var('userDoc')),
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

  async getUser(id: string): Promise<User | undefined> {
    return this.fauna.query<User>(
      q.Let(
        {
          userDoc: q.Get(q.Ref(q.Collection('users'), id)),
        },
        {
          id: q.Select(['ref', 'id'], q.Var('userDoc')),
          name: q.Select(['data', 'name'], q.Var('userDoc')),
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
