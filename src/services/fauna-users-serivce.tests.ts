import { Client } from 'faunadb';

import { Invitation, User } from '../domain';
import { Page } from '../domain/utils';
import { FaunaUsersService } from './fauna-users-service';
import { FaunaUtils } from './fauna-utils';

let client: Client;
describe.skip('fauna-users-service', () => {
  beforeAll(async () => {
    client = new Client({
      secret: process.env.FAUNA_DB_SECRET_TEST || '',
      domain: process.env.FAUNA_DB_DOMAIN || '',
      scheme: 'https',
    });

    const db = new FaunaUtils(client);
    await db.clearAll();
    await db.provision();
  });

  afterEach(async () => {
    const db = new FaunaUtils(client);
    await db.clearAll();
  });

  describe('addFriend', () => {
    const myEmail = 'test@example.com';
    let users: User[] = [];

    describe('where there is data', () => {
      beforeEach(async () => {
        const a = await new FaunaUsersService(client).getOrCreate({
          email: '101@example.com',
          name: '101',
          provider: 'test',
          providerUserId: '101',
        });
        const b = await new FaunaUsersService(client).getOrCreate({
          email: '102@example.com',
          name: '102',
          provider: 'test',
          providerUserId: '102',
        });
        const c = await new FaunaUsersService(client).getOrCreate({
          email: '103@example.com',
          name: '103',
          provider: 'test',
          providerUserId: '103',
        });
        const d = await new FaunaUsersService(client).getOrCreate({
          email: '104@example.com',
          name: '104',
          provider: 'test',
          providerUserId: '104',
        });
        const e = await new FaunaUsersService(client).getOrCreate({
          email: '105@example.com',
          name: '105',
          provider: 'test',
          providerUserId: '105',
        });

        users = [a, b, c, d, e];
      });

      it('works', async () => {
        // ARRANGE
        const [a, b] = users;

        const me = new FaunaUsersService(client, a.id);
        const them = new FaunaUsersService(client, b.id);

        // ACT
        const result = await me.addFriend(b.id);
        const myFriends = await me.getFriends();
        const thierFriends = await them.getFriends();

        // ASSERT
        expect(result).toEqual(b);
        expect(myFriends.items).toEqual([b]);
        expect(thierFriends.items).toEqual([a]);
      });
    });

    describe('where there is no data', () => {
      beforeEach(() => (users = []));
    });
  });
});
