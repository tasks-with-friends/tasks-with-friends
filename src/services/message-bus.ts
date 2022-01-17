import { Task, TaskStatus, UserStatus } from '../domain/v1/api.g';

export interface MessageBus {
  onTaskStatusChanged(data: Record<string, TaskStatus>): void;
  onUserStatusChanged(data: Record<string, UserStatus>): void;
  onUserCurrentTaskChanged(data: Record<string, Task['id'] | null>): void;
  onAddedToTask(data: Record<string, Task['id']>): void;
  onRemovedFromTask(data: Record<string, Task['id']>): void;

  drain(): Promise<void>;
}
