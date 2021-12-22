export interface IUsersService {
  getOrCreate(user: NewUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
}

export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  provider: string;
  providerUserId: string;
};

export type NewUser = Omit<User, 'id'>;
