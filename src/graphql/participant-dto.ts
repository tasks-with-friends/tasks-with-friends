import * as domain from '../domain/v1/api.g';
import * as schema from '../domain/v1/graph.g';
import { CursorProvider } from '../domain/cursor-provider';
import { Page } from '../domain/utils';
import { resolveTaskById } from './task-dto';
import { resolveUserById } from './user-dto';
import { pageInfo, paginate } from './utils';

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
  (
    taskId: string,
  ): schema.Resolver<
    schema.ParticipantConnection,
    {
      first: number | null;
      last: number | null;
      after: string | null;
      before: string | null;
    }
  > =>
  async (args, { registry }) => {
    const service = registry.get('task-service');
    const participants = await service.getParticipants({
      taskId,
      ...paginate(args),
    });

    return participantConnection(participants);
  };

export function participantConnection(
  page: Page<domain.Participant>,
): schema.ParticipantConnection {
  return {
    edges: () =>
      page.items.map((item) => ({
        cursor: item.id,
        node: participantDto(item),
      })),
    nodes: () => page.items.map(participantDto),
    pageInfo: () => pageInfo(page),
  };
}

// function convertArgs(args: {
//   first: number | null;
//   last: number | null;
//   after: string | null;
//   before: string | null;
// }): {
//   first?: number;
//   last?: number;
//   after?: string;
//   before?: string;
// } {
//   const res: any = {};
//   if (typeof args.first === 'number') res.first = args.first;
//   if (typeof args.last === 'number') res.last = args.last;
//   if (typeof args.after === 'string') res.after = args.after;
//   if (typeof args.before === 'string') res.before = args.before;
//   return res;
// }
