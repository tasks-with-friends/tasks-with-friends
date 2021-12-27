import * as domain from '../domain';
import { CursorProvider } from '../domain/cursor-provider';
import { Page } from '../domain/utils';
import * as schema from './server-types.g';
import { resolveTaskById } from './task-dto';
import { resolveUserById } from './user-dto';
import { pageInfo } from './utils';

export function participantDto(
  participant: domain.Participant,
): schema.Participant {
  const { userId, taskId, response, ...rest } = participant;

  return {
    ...participant,
    user: resolveUserById(userId),
    task: resolveTaskById(taskId),
    response: () => {
      switch (response) {
        case 'yes':
          return schema.ParticipantResponse.YES;
        case 'no':
          return schema.ParticipantResponse.NO;
        default:
          return null;
      }
    },
  };
}

export const resolveParticipantsByTaskId =
  (taskId: string): schema.Resolver<schema.ParticipantConnection> =>
  async (_, { registry }) => {
    const service = registry.get('participant-service');
    const participants = await service.getParticipantsByTask(taskId);

    return participantConnection(participants, service);
  };

export function participantConnection(
  page: Page<domain.Participant>,
  cursorProvider: CursorProvider<domain.Participant>,
): schema.ParticipantConnection {
  return {
    edges: () =>
      page.items.map((item) => ({
        cursor: cursorProvider.getCursor(item),
        node: participantDto(item),
      })),
    nodes: () => page.items.map(participantDto),
    pageInfo: () => pageInfo(page),
  };
}
