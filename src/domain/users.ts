import { CursorProvider } from './cursor-provider';
import { Page, Pagination } from './utils';

export interface IUsersService extends CursorProvider<User> {
  getOrCreate(user: NewUser): Promise<User>;
  getUsers(ids: string[]): Promise<User[]>;
  getFriends(page?: Pagination): Promise<Page<User>>;
  addFriend(userId: string): Promise<User | undefined>;
  removeFriend(userId: string): Promise<boolean>;
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
