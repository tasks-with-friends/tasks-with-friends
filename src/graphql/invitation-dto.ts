import * as domain from '../domain/v1/api.g';
import * as schema from '../domain/v1/graph.g';
import { CursorProvider } from '../domain/cursor-provider';
import { Page } from '../domain/utils';
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
): schema.InvitationConnection {
  return {
    edges: () =>
      page.items.map((item) => ({
        cursor: item.id,
        node: invitationDto(item),
      })),
    nodes: () => page.items.map(invitationDto),
    pageInfo: () => pageInfo(page),
  };
}
