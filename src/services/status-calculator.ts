import { TaskStatus } from '../domain/v1/api.g';

export interface StatusCalculator {
  recalculateTaskStatus(
    taskIds: string[],
  ): Promise<{ taskId: string; status: TaskStatus }[]>;

  recalculateTaskStatusForUsers(
    userIds: string[],
  ): Promise<{ taskId: string; status: TaskStatus }[]>;
}
