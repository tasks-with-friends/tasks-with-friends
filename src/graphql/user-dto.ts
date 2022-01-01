import * as domain from '../domain/v1/api.g';
import * as schema from '../domain/v1/graph.g';
import { CursorProvider } from '../domain/cursor-provider';
import { Page } from '../domain/utils';
import { pageInfo } from './utils';

export function userDto(object: domain.User): schema.User {
  return {
    ...object,
    avatarUrl: typeof object.avatarUrl === 'string' ? object.avatarUrl : null,
    status: schema.UserStatus.IDLE,
  };
}

export const resolveUserById =
  (userId: string): schema.Resolver<schema.User> =>
  async (_, { registry }) => {
    const users = await registry
      .get('user-service')
      .getUsers({ userIds: [userId] });

    const user = users.items[0];

    console.log({ userId, users, user });

    return userDto(users.items[0]);
  };

export function userConnection(page: Page<domain.User>): schema.UserConnection {
  return {
    edges: () =>
      page.items.map((item) => ({
        cursor: item.id,
        node: userDto(item),
      })),
    nodes: () => page.items.map(userDto),
    pageInfo: () => pageInfo(page),
  };
}
