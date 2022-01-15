import { TaskStatus, UserStatus } from '../domain/v1/api.g';

export interface MessageBus {
  onTaskStatusChanged(data: Record<string, TaskStatus>): void;
  onUserStatusChanged(data: Record<string, UserStatus>): void;

  drain(): Promise<void>;
}
