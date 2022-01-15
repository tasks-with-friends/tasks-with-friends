import { Task, TaskStatus, UserStatus } from '../domain/v1/api.g';

export interface MessageBus {
  onTaskStatusChanged(data: Record<string, TaskStatus>): void;
  onUserStatusChanged(data: Record<string, UserStatus>): void;
  onUserCurrentTaskChanged(data: Record<string, Task['id'] | null>): void;

  drain(): Promise<void>;
}
