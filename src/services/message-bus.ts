import { Task, TaskStatus, User, UserStatus } from '../domain/v1/api.g';

export interface MessageBus {
  onTaskStatusChanged(statusByTaskId: Record<Task['id'], TaskStatus>): void;
  onUserStatusChanged(statusByUserId: Record<User['id'], UserStatus>): void;
  onUserCurrentTaskChanged(
    TaskIdByUserId: Record<User['id'], Task['id'] | null>,
  ): void;
  onAddedToTask(userIdByTaskId: Record<Task['id'], User['id']>): void;
  onRemovedFromTask(userIdByTaskId: Record<Task['id'], User['id']>): void;

  drain(): Promise<void>;
}
