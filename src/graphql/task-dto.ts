import * as domain from '../domain';
import { CursorProvider } from '../domain/cursor-provider';
import { Page } from '../domain/utils';
import { resolveParticipantsByTaskId } from './participant-dto';
import * as schema from './server-types.g';
import { userDto } from './user-dto';
import { nullable, pageInfo } from './utils';

export function taskDto(task: domain.Task): schema.Task {
  const { ownerId, status, description, ...rest } = task;

  return {
    ...rest,
    description: nullable(description),
    owner: (_, { registry }) => {
      const users = registry.get('users-service').getUsers([ownerId]);

      return userDto(users[0]);
    },
    status: () => {
      switch (status) {
        case 'canceled':
          return schema.TaskStatus.CANCELED;
        case 'done':
          return schema.TaskStatus.DONE;
        case 'in-progress':
          return schema.TaskStatus.IN_PROGRESS;
        case 'ready':
          return schema.TaskStatus.READY;
      }
    },
    participants: resolveParticipantsByTaskId(task.id),
  };
}

export const resolveTaskById =
  (taskId: string): schema.Resolver<schema.Task> =>
  async (_, { registry }) => {
    const tasks = await registry.get('task-service').getTasks([taskId]);

    return taskDto(tasks[0]);
  };

export function taskConnection(
  page: Page<domain.Task>,
  cursorProvider: CursorProvider<domain.Task>,
): schema.TaskConnection {
  return {
    edges: () =>
      page.items.map((item) => ({
        cursor: cursorProvider.getCursor(item),
        node: taskDto(item),
      })),
    nodes: () => page.items.map(taskDto),
    pageInfo: () => pageInfo(page),
  };
}
