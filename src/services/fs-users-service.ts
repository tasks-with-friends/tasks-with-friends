import fs from 'fs/promises';

import { v4 } from 'uuid';

import { IUsersService, NewUser, User, UserStatus } from '../domain';
import { Pagination, Page } from '../domain/utils';

export class FsUsersService implements IUsersService {
  constructor(private readonly filepath: string) {}

  getCursor(obj: User): string {
    return obj.id;
  }

  async getUsers(ids: string[]): Promise<User[]> {
    const data = await this.read();
    return ids.map((id) => data[id]).filter((x) => x);
  }

  getFriends(page?: Pagination): Promise<Page<User>> {
    throw new Error('Method not implemented.');
  }

  setStatus(status: UserStatus): Promise<User> {
    throw new Error('Method not implemented.');
  }

  async getOrCreate(newUser: NewUser): Promise<User> {
    const users = await this.read();
    for (const id in users) {
      const user = users[id];

      if (
        user.provider === newUser.provider &&
        user.providerUserId === user.providerUserId
      ) {
        return user;
      }
    }

    const createdUser: User = {
      id: v4(),
      ...newUser,
    };

    users[createdUser.id] = createdUser;

    await this.write(users);

    return createdUser;
  }

  private async read(): Promise<Record<string, User>> {
    try {
      return JSON.parse((await fs.readFile(this.filepath)).toString());
    } catch {
      return {};
    }
  }

  private async write(data: Record<string, User>): Promise<void> {
    fs.writeFile(this.filepath, JSON.stringify(data));
  }
}
