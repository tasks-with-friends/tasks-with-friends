import { CursorProvider } from './cursor-provider';
import { IdCollection, Page, Pagination } from './utils';

export interface TaskService extends CursorProvider<Task> {
  getTasks(ids: string[]): Promise<Task[]>;
  getTasksByOwnerId(ownerId: string, page?: Pagination): Promise<Page<Task>>;
  getTasksByParticipatingUserId(
    userId: string,
    page?: Pagination,
  ): Promise<Page<Task>>;
  createTask(task: NewTask): Promise<Task>;
  editTask(task: TaskUpdate): Promise<Task>;
  removeTask(id: string): Promise<Task | undefined>;
}

export type Task = {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  groupSize: number;
  status: TaskStatus;
};

export type NewTask = {
  name: string;
  description?: string;
  durationMinutes: number;
  groupSize: number;
};

export type TaskUpdate = {
  id: string;
  name?: string;
  description?: string | null;
  durationMinutes?: number;
  groupSize?: number;
  status?: TaskStatus;
};

export type TaskStatus = 'ready' | 'in-progress' | 'done' | 'canceled';
