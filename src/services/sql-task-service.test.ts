import { Pool } from 'pg';
import { Task, TaskPage } from '../domain/v1/api.g';
import { SqlTaskService } from './sql-task-service';
import { SqlUserService } from './sql-user-service';

const schema = process.env['DB_SCHEMA'] || '';
let pool: Pool;
describe.skip('SqlTaskService', () => {
  beforeAll(() => {
    pool = new Pool({
      user: process.env['POSTGRES_USER'],
      host: process.env['DB_HOST'] || '127.0.0.1',
      database: process.env['POSTGRES_DB'],
      password: process.env['POSTGRES_PASSWORD'],
      port: 5432,
    });
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

  describe('createTask', () => {
    it('works', async () => {
      // ARRANGE
      const me = await new SqlUserService(pool, schema).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const service = new SqlTaskService(pool, schema, me.id);

      // ACT
      const result = await service.createTask({
        task: {
          name: 'my task',
          durationMinutes: 15,
          groupSize: 2,
        },
      });

      // ARRANGE
      expect(result).toBeTruthy();
    });
  });

  describe('getTasks', () => {
    it('gets tasks by task IDs', async () => {
      // ARRANGE
      const me = await new SqlUserService(pool, schema).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const service = new SqlTaskService(pool, schema, me.id);

      const a = await service.createTask({
        task: {
          name: 'task a',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const b = await service.createTask({
        task: {
          name: 'task b',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const c = await service.createTask({
        task: {
          name: 'task c',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const d = await service.createTask({
        task: {
          name: 'task d',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const e = await service.createTask({
        task: {
          name: 'task e',
          durationMinutes: 15,
          groupSize: 2,
        },
      });

      // ACT
      const result = await service.getTasks({ taskIds: [a.id, c.id, d.id] });

      // ASSERT
      expect(result.items).toEqual([a, c, d]);
    });

    it('gets tasks by owner ID', async () => {
      // ARRANGE
      const me = await new SqlUserService(pool, schema).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const service = new SqlTaskService(pool, schema, me.id);

      const a = await service.createTask({
        task: {
          name: 'task a',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const b = await service.createTask({
        task: {
          name: 'task b',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const c = await service.createTask({
        task: {
          name: 'task c',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const d = await service.createTask({
        task: {
          name: 'task d',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const e = await service.createTask({
        task: {
          name: 'task e',
          durationMinutes: 15,
          groupSize: 2,
        },
      });

      // ACT
      const result = await service.getTasks({
        ownerId: me.id,
        after: b.id,
        first: 2,
      });

      // ARRANGE
      expect(result).toEqual<TaskPage>({
        hasPreviousPage: true,
        startCursor: c.id,
        items: [c, d],
        endCursor: d.id,
        hasNextPage: true,
      });
    });

    it('gets tasks by participant ID', async () => {
      // TODO: create as a different user and then add me as a pariticipant

      // ARRANGE
      const me = await new SqlUserService(pool, schema).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const service = new SqlTaskService(pool, schema, me.id);

      const a = await service.createTask({
        task: {
          name: 'task a',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const b = await service.createTask({
        task: {
          name: 'task b',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const c = await service.createTask({
        task: {
          name: 'task c',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const d = await service.createTask({
        task: {
          name: 'task d',
          durationMinutes: 15,
          groupSize: 2,
        },
      });
      const e = await service.createTask({
        task: {
          name: 'task e',
          durationMinutes: 15,
          groupSize: 2,
        },
      });

      // ACT
      const result = await service.getTasks({
        participantId: me.id,
        after: b.id,
        first: 2,
      });

      // ARRANGE
      expect(result).toEqual<TaskPage>({
        hasPreviousPage: true,
        startCursor: c.id,
        items: [c, d],
        endCursor: d.id,
        hasNextPage: true,
      });
    });
  });

  describe('getTask', () => {
    it('works', async () => {
      // ARRANGE
      const me = await new SqlUserService(pool, schema).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const service = new SqlTaskService(pool, schema, me.id);
      const task = await service.createTask({
        task: {
          name: 'task',
          durationMinutes: 15,
          groupSize: 2,
        },
      });

      // ACT
      const result = await service.getTask({ taskId: task.id });

      // ASSERT
      expect(result).toEqual(task);
    });
  });
});
