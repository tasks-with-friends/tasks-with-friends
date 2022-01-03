import * as domain from '../domain/v1/api.g';
import * as schema from '../domain/v1/graph.g';
import { Page } from '../domain/utils';
import { resolveParticipantsByTaskId } from './participant-dto';
import { resolveUserById, userDto } from './user-dto';
import { nullable, pageInfo } from './utils';

export function taskDto(task: domain.Task): schema.Task {
  const { ownerId, status, description, ...rest } = task;

  return {
    ...rest,
    description: nullable(description),
    owner: resolveUserById(ownerId),
    status: () => {
      switch (status) {
        case 'waiting':
          return schema.TaskStatus.WAITING;
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
    const tasks = await registry
      .get('task-service')
      .getTasks({ taskIds: [taskId] });

    return taskDto(tasks.items[0]);
  };

export function taskConnection(page: Page<domain.Task>): schema.TaskConnection {
  return {
    edges: () =>
      page.items.map((item) => ({
        cursor: item.id,
        node: taskDto(item),
      })),
    nodes: () => page.items.map(taskDto),
    pageInfo: () => pageInfo(page),
  };
}
