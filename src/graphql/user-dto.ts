import * as domain from '../domain';
import { CursorProvider } from '../domain/cursor-provider';
import { Page } from '../domain/utils';
import * as schema from './server-types.g';
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
    const users = await registry.get('users-service').getUsers([userId]);

    return userDto(users[0]);
  };

export function userConnection(
  page: Page<domain.User>,
  cursorProvider: CursorProvider<domain.User>,
): schema.UserConnection {
  return {
    edges: () =>
      page.items.map((item) => ({
        cursor: cursorProvider.getCursor(item),
        node: userDto(item),
      })),
    nodes: () => page.items.map(userDto),
    pageInfo: () => pageInfo(page),
  };
}
