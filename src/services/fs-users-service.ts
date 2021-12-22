import fs from 'fs/promises';

import { v4 } from 'uuid';

import { IUsersService, NewUser, User } from '../domain';

export class FsUsersService implements IUsersService {
  constructor(private readonly filepath: string) {}

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
  async getUser(id: string): Promise<User | undefined> {
    return (await this.read())[id];
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
