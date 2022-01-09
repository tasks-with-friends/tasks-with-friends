import { Pool } from 'pg';
import {
  NewUser,
  User,
  UserList,
  UserPage,
  UserService,
  UserUpdate,
} from '../domain/v1/api.g';
import { StatusCalculator } from './status-calculator';
import { buildPage, Mapping, parsePage, using } from './utils';

export class SqlUserService implements UserService {
  constructor(
    private readonly pool: Pool,
    private readonly schema: string,
    private readonly statusCalculator: StatusCalculator,
    private readonly currentUserId?: string,
  ) {}

  async getUsers(params: { userIds: string[] }): Promise<UserList> {
    const items = (
      await this.pool.query<DbUser>(
        `SELECT * FROM ${
          this.schema
        }.users u WHERE u.external_id IN (${params.userIds.map(
          (_, i) => `$${i + 1}`,
        )})`,
        [...params.userIds],
      )
    ).rows.map(using(dbUserToUser));

    return { items };
  }

  async getOrCreateUser(params: { user: NewUser }): Promise<User> {
    const existingUser = (
      await this.pool.query<DbUser>(
        `SELECT * FROM ${this.schema}.users u WHERE u.provider = $1 AND u.provider_user_id = $2`,
        [params.user.provider, params.user.providerUserId],
      )
    ).rows.map(using(dbUserToUser))[0];

    if (existingUser) return existingUser;

    const { name, email, avatarUrl, provider, providerUserId } = params.user;
    const newUser = (
      await this.pool.query<DbUser>(
        `INSERT INTO ${this.schema}.users (name, email, avatar_url, provider, provider_user_id, status)
      VALUES ($1, $2, $3, $4, $5, 'away') RETURNING *`,
        [name, email, avatarUrl, provider, providerUserId],
      )
    ).rows.map(using(dbUserToUser))[0];
    return newUser;
  }

  async getUser(params: { userId: string }): Promise<User> {
    return (await this.getUsers({ userIds: [params.userId] })).items[0];
  }

  async updateUser(params: {
    userId: string;
    userUpdate: UserUpdate;
  }): Promise<User> {
    const { userId } = params;
    if (userId !== this.currentUserId) throw new Error('Forbidden');

    const UNSANITIZED_fields: string[] = [];
    const values: any[] = [];
    const { status, currentTaskId } = params.userUpdate;

    UNSANITIZED_fields.push('status');
    values.push(status);

    if (status === 'flow') {
      if (currentTaskId) {
        UNSANITIZED_fields.push('current_task_external_id');
        values.push(currentTaskId);
      }
    } else {
      UNSANITIZED_fields.push('current_task_external_id');
      values.push(null);
    }

    const updatedUser = (
      await this.pool.query<DbUser>(
        `UPDATE ${this.schema}.users
        SET ${UNSANITIZED_fields.map((f, i) => `${f} = $${i + 2}`).join(', ')}
        WHERE external_id = $1
        RETURNING *`,
        [userId, ...values],
      )
    ).rows.map(using(dbUserToUser))[0];

    if (!updatedUser) throw new Error('Not Found');

    await this.statusCalculator.recalculateTaskStatusForUsers([params.userId]);

    return this.getUser({ userId: params.userId });
  }

  private async getSortValue<T>(
    UNSANITIZED_field: string,
    external_id: string | undefined,
  ): Promise<T | null> {
    if (!external_id) return null;
    const row = (
      await this.pool.query(
        `SELECT ${UNSANITIZED_field} FROM ${this.schema}.users WHERE external_id = $1 LIMIT 1`,
        [external_id],
      )
    ).rows[0];

    return !row ? null : row[UNSANITIZED_field];
  }

  async getFriendsByUserId(params: {
    userId: string;
    first?: number | undefined;
    after?: string | undefined;
    last?: number | undefined;
    before?: string | undefined;
  }): Promise<UserPage> {
    const { userId } = params;
    if (userId !== this.currentUserId) throw new Error('Forbidden');

    const { uniqueId, count, limit, direction } = parsePage(25, params);
    const orderBy = direction === 'forward' ? 'ASC' : 'DESC';
    const operator = direction === 'forward' ? '>=' : '<=';
    const name = await this.getSortValue('name', uniqueId);

    const items = (
      await this.pool.query<DbUser>(
        `SELECT u.* FROM ${this.schema}.friends f
        JOIN ${this.schema}.users u
        ON f.friend_user_external_id = u.external_id
        WHERE f.user_external_id = $1
        
        ${name ? `AND (u.name, u.external_id) ${operator} ($3, $4)` : ''}
        ORDER BY u.name ${orderBy}, u.external_id ${orderBy}
        limit $2`,
        name ? [userId, limit, name, uniqueId] : [userId, limit],
      )
    ).rows.map(using(dbUserToUser));

    return buildPage(items, count, !!name, direction, (x) => x?.id || '');
  }

  async addFriendToUser(params: {
    userId: string;
    friendId: string;
  }): Promise<User> {
    const { userId, friendId } = params;
    if (userId !== this.currentUserId) throw new Error('Forbidden');
    if (userId === friendId) throw new Error('Bad Request');

    await this.pool.query(
      `INSERT INTO ${this.schema}.friends (user_external_id, friend_user_external_id)
      VALUES ($1, $2), ($2, $1)`,
      [userId, friendId],
    );

    const friend = await this.getUser({ userId: friendId });

    if (!friend) throw new Error('Not Found');

    return friend;
  }

  async removeFriendFromUser(params: {
    userId: string;
    friendId: string;
  }): Promise<User> {
    const { userId, friendId } = params;
    if (userId !== this.currentUserId) throw new Error('Forbidden');
    if (userId === friendId) throw new Error('Bad Request');

    await this.pool.query(
      `DELETE FROM ${this.schema}.friends
        WHERE (user_external_id = $1 AND friend_user_external_id = $2)
        OR (user_external_id = $2 AND friend_user_external_id = $1)`,
      [userId, friendId],
    );

    const friend = await this.getUser({ userId: friendId });

    if (!friend) throw new Error('Not Found');

    return friend;
  }
}

type DbUser = {
  id: number;
  external_id: string;
  name: string;
  email: string;
  avatar_url: string;
  provider: string;
  provider_user_id: string;
  status: string;
  current_task_external_id?: string;
};

const dbUserToUser: Mapping<DbUser, User> = {
  id: 'external_id',
  name: 'name',
  email: 'email',
  avatarUrl: 'avatar_url',
  provider: 'provider',
  providerUserId: 'provider_user_id',
  currentTaskId: 'current_task_external_id',
  status: (src) => {
    switch (src.status) {
      case 'idle':
      case 'flow':
      case 'away':
        return src.status;
      default:
        return 'away';
    }
  },
};
