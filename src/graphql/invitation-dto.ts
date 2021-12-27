import * as domain from '../domain';
import { CursorProvider } from '../domain/cursor-provider';
import { Page } from '../domain/utils';
import * as schema from './server-types.g';
import { resolveUserById } from './user-dto';
import { pageInfo } from './utils';

export function invitationDto(
  invitation: domain.Invitation,
): schema.Invitation {
  const { fromUserId, ...rest } = invitation;

  return {
    ...rest,
    from: resolveUserById(fromUserId),
  };
}

export function invitationConnection(
  page: Page<domain.Invitation>,
  cursorProvider: CursorProvider<domain.Invitation>,
): schema.InvitationConnection {
  return {
    edges: () =>
      page.items.map((item) => ({
        cursor: cursorProvider.getCursor(item),
        node: invitationDto(item),
      })),
    nodes: () => page.items.map(invitationDto),
    pageInfo: () => pageInfo(page),
  };
}
