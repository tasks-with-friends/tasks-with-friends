import { CursorProvider } from './cursor-provider';
import { IdCollection, Page, Pagination } from './utils';

export interface TaskService extends CursorProvider<Task> {
  getTasks(ids: string[]): Promise<Task[]>;
  getTasksByUserId(userId: string, page?: Pagination): Promise<Page<Task>>;
  createTask(task: NewTask): Promise<Task>;
  editTask(task: TaskUpdate): Promise<Task>;
  removeTask(id: string): Promise<Task>;
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
  participants: IdCollection;
};

export type TaskUpdate = {
  name?: string;
  description?: string;
  durationMinutes?: number;
  groupSize?: number;
  status?: TaskStatus;
  participants?: IdCollection;
};

export type TaskStatus = 'ready' | 'in-progress' | 'done' | 'canceled';
