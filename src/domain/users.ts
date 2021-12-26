import { Page, Pagination } from './utils';

export interface IUsersService {
  getOrCreate(user: NewUser): Promise<User>;
  getUsers(ids: string[]): Promise<User[]>;
  getFriends(page?: Pagination): Promise<Page<User>>;
  setStatus(status: UserStatus): Promise<User>;
}

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: string;
  providerUserId: string;
};

export type NewUser = Omit<User, 'id'>;

export type UserStatus = 'idle' | 'flow' | 'away';
