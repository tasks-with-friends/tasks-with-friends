import { Pool } from 'pg';
import { User, UserPage } from '../domain/v1/api.g';
import { NullMessageBus } from './null-message-bus';
import { SqlStatusCalculator } from './sql-status-calculator';
import { SqlUserService } from './sql-user-service';
import { StatusCalculator } from './status-calculator';

const schema = 'public'; // process.env['DB_SCHEMA'] || '';
let pool: Pool;
let statusCalculator: StatusCalculator;
describe.skip('SqlUserService', () => {
  beforeAll(() => {
    pool = new Pool({
      user: process.env['POSTGRES_USER'],
      host: process.env['DB_HOST'] || '127.0.0.1',
      database: process.env['POSTGRES_DB'],
      password: process.env['POSTGRES_PASSWORD'],
      port: 5432,
    });
    statusCalculator = new SqlStatusCalculator(
      pool,
      schema,
      new NullMessageBus(),
    );
  });

  beforeEach(async () => {
    await pool.query(
      `DELETE FROM public.friends where 1=1;
      DELETE FROM public.participants where 1=1;
      DELETE FROM public.tasks where 1=1;
      DELETE FROM public.invitations where 1=1;
      DELETE FROM public.users where 1=1;`,
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('getOrCreateUser', () => {
    it('returns the same user when passed the same params', async () => {
      // ARRANGE
      const service = new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
      );

      // ACT
      const me = await service.getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const alsoMe = await service.getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const them = await service.getOrCreateUser({
        user: {
          name: 'them',
          email: 'them@example.com',
          provider: 'test',
          providerUserId: 'kjlafsdhkljadlhjfkflhjak',
        },
      });

      // ASSERT
      expect(me).toEqual(alsoMe);
      expect(me).not.toEqual(them);
    });
  });

  describe('getUsers', () => {
    it('gets list of users by id', async () => {
      // ARRANGE
      const service = new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
      );
      const me = await service.getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const them = await service.getOrCreateUser({
        user: {
          name: 'them',
          email: 'them@example.com',
          provider: 'test',
          providerUserId: 'kjlafsdhkljadlhjfkflhjak',
        },
      });
      expect(me).toBeTruthy();
      expect(them).toBeTruthy();

      // ACT
      const users = await service.getUsers({ userIds: [me.id, them.id] });

      // ASSERT
      expect(users.items.sort((a, b) => a.id.localeCompare(b.id))).toEqual<
        User[]
      >([me, them].sort((a, b) => a.id.localeCompare(b.id)));
    });
  });

  describe('updateUser', () => {
    it('updates the user', async () => {
      // ARRANGE
      const { id } = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
      ).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const service = new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
        id,
      );
      const me = await service.updateUser({
        userId: id,
        userUpdate: { status: 'away' },
      });

      // ACT
      const updatedMe = await service.updateUser({
        userId: me.id,
        userUpdate: { status: 'flow' },
      });

      // ASSERT
      expect(me).not.toEqual(updatedMe);
    });
  });

  describe('addFriendToUser', () => {
    it('works', async () => {
      // ARRANGE
      const me = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
      ).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const them = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
      ).getOrCreateUser({
        user: {
          name: 'them',
          email: 'them@example.com',
          provider: 'test',
          providerUserId: 'kjlafsdhkljadlhjfkflhjak',
        },
      });
      const service = new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
        me.id,
      );

      // ACT
      const result = await service.addFriendToUser({
        userId: me.id,
        friendId: them.id,
      });

      // ASSERT
      expect(result).toEqual(them);
    });

    describe('pagination', () => {
      let users: User[];
      let me: User;

      beforeEach(async () => {
        me = await new SqlUserService(
          pool,
          schema,
          statusCalculator,
          new NullMessageBus(),
        ).getOrCreateUser({
          user: {
            name: 'me',
            email: 'me@example.com',
            provider: 'test',
            providerUserId: '2893674528967345',
          },
        });
        const svc = new SqlUserService(
          pool,
          schema,
          statusCalculator,
          new NullMessageBus(),
        );
        users = [
          await svc.getOrCreateUser({
            user: {
              name: 'a',
              email: 'a@example.com',
              provider: 'test',
              providerUserId: 't4d38ny778do3wbt',
            },
          }),
          await svc.getOrCreateUser({
            user: {
              name: 'b',
              email: 'b@example.com',
              provider: 'test',
              providerUserId: 'n78got4dt5w8no7g',
            },
          }),
          await svc.getOrCreateUser({
            user: {
              name: 'c',
              email: 'c@example.com',
              provider: 'test',
              providerUserId: 'f4de8goqf4degi8o',
            },
          }),
          await svc.getOrCreateUser({
            user: {
              name: 'd',
              email: 'd@example.com',
              provider: 'test',
              providerUserId: '8odtnoq78dgt34',
            },
          }),
          await svc.getOrCreateUser({
            user: {
              name: 'e',
              email: 'e@example.com',
              provider: 'test',
              providerUserId: 'o89gm73x8oq3gn',
            },
          }),
        ];

        await Promise.all(
          users.map((user) =>
            new SqlUserService(
              pool,
              schema,
              statusCalculator,
              new NullMessageBus(),
              me.id,
            ).addFriendToUser({
              userId: me.id,
              friendId: user.id,
            }),
          ),
        );
      });

      it('works without count or cursors', async () => {
        // ARRANGE
        const service = new SqlUserService(
          pool,
          schema,
          statusCalculator,
          new NullMessageBus(),
          me.id,
        );

        // ACT
        const result = await service.getFriendsByUserId({ userId: me.id });

        // ASSERT
        expect(result).toEqual<UserPage>({
          hasPreviousPage: false,
          startCursor: users[0].id,
          items: users,
          endCursor: users[4].id,
          hasNextPage: false,
        });
      });

      it('takes from start without cursor', async () => {
        // ARRANGE
        const service = new SqlUserService(
          pool,
          schema,
          statusCalculator,
          new NullMessageBus(),
          me.id,
        );
        const [a, b, c] = users;

        // ACT
        const result = await service.getFriendsByUserId({
          userId: me.id,
          first: 3,
        });

        // ASSERT
        expect(result).toEqual<UserPage>({
          hasPreviousPage: false,
          startCursor: a.id,
          items: [a, b, c],
          endCursor: c.id,
          hasNextPage: true,
        });
      });

      it('takes after cursor with some remaining', async () => {
        // ARRANGE
        const service = new SqlUserService(
          pool,
          schema,
          statusCalculator,
          new NullMessageBus(),
          me.id,
        );
        const [a, b, c, d, e] = users;

        // ACT
        const result = await service.getFriendsByUserId({
          userId: me.id,
          after: b.id,
          first: 2,
        });

        // ASSERT
        expect(result).toEqual<UserPage>({
          hasPreviousPage: true,
          startCursor: c.id,
          items: [c, d],
          endCursor: d.id,
          hasNextPage: true,
        });
      });

      it('takes after cursor without any remaining', async () => {
        // ARRANGE
        const service = new SqlUserService(
          pool,
          schema,
          statusCalculator,
          new NullMessageBus(),
          me.id,
        );
        const [a, b, c, d, e] = users;

        // ACT
        const result = await service.getFriendsByUserId({
          userId: me.id,
          after: b.id,
          first: 25,
        });

        // ASSERT
        expect(result).toEqual<UserPage>({
          hasPreviousPage: true,
          startCursor: c.id,
          items: [c, d, e],
          endCursor: e.id,
          hasNextPage: false,
        });
      });
    });
  });

  describe('getFriendsByUserId', () => {
    it('works', async () => {
      // ARRANGE
      const me = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
      ).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const them = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
      ).getOrCreateUser({
        user: {
          name: 'them',
          email: 'them@example.com',
          provider: 'test',
          providerUserId: 'kjlafsdhkljadlhjfkflhjak',
        },
      });
      const other = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
      ).getOrCreateUser({
        user: {
          name: 'other',
          email: 'other@example.com',
          provider: 'test',
          providerUserId: 'akfjl973t4ny7t4donygtd',
        },
      });
      const service = new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
        me.id,
      );

      await service.addFriendToUser({
        userId: me.id,
        friendId: them.id,
      });

      // ACT
      const mine = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
        me.id,
      ).getFriendsByUserId({
        userId: me.id,
      });
      const theirs = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
        them.id,
      ).getFriendsByUserId({
        userId: them.id,
      });
      const others = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
        other.id,
      ).getFriendsByUserId({
        userId: other.id,
      });

      // ASSERT
      expect(mine.items).toEqual([them]);
      expect(theirs.items).toEqual([me]);
      expect(others.items).toEqual([]);
    });
  });

  describe('removeFriendFromUser', () => {
    it('works', async () => {
      // ARRANGE
      const me = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
      ).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const them = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
      ).getOrCreateUser({
        user: {
          name: 'them',
          email: 'them@example.com',
          provider: 'test',
          providerUserId: 'kjlafsdhkljadlhjfkflhjak',
        },
      });
      const service = new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
        me.id,
      );

      await service.addFriendToUser({
        userId: me.id,
        friendId: them.id,
      });

      // ACT
      await service.removeFriendFromUser({ userId: me.id, friendId: them.id });

      // ASSERT
      const mine = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
        me.id,
      ).getFriendsByUserId({
        userId: me.id,
      });
      const theirs = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        new NullMessageBus(),
        them.id,
      ).getFriendsByUserId({
        userId: them.id,
      });
      expect(mine.items).toEqual([]);
      expect(theirs.items).toEqual([]);
    });
  });
});
