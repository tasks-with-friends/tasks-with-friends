import { Pool } from 'pg';
import {
  ParticipantResponse,
  TaskPage,
  TaskStatus,
  UserStatus,
} from '../domain/v1/api.g';
import { SqlStatusCalculator } from './sql-status-calculator';
import { SqlTaskService } from './sql-task-service';
import { TestUtility } from './sql-test-utility';
import { SqlUserService } from './sql-user-service';
import { StatusCalculator } from './status-calculator';

const schema = 'public';
let pool: Pool;
let statusCalculator: StatusCalculator;
let db: TestUtility;
describe.skip('SqlTaskService', () => {
  beforeAll(() => {
    pool = new Pool({
      user: process.env['POSTGRES_USER'],
      host: process.env['DB_HOST'] || '127.0.0.1',
      database: process.env['POSTGRES_DB'],
      password: process.env['POSTGRES_PASSWORD'],
      port: 5432,
    });
    statusCalculator = new SqlStatusCalculator(pool, schema);
    db = new TestUtility(pool, schema);
  });

  beforeEach(async () => {
    await pool.query(
      `DELETE FROM public.friends where 1=1;
      DELETE FROM public.participants where 1=1;
      UPDATE public.users SET current_task_external_id = NULL;
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
      const me = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
      ).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const service = new SqlTaskService(pool, schema, statusCalculator, me.id);

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
      const me = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
      ).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const service = new SqlTaskService(pool, schema, statusCalculator, me.id);

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
      const me = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
      ).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const service = new SqlTaskService(pool, schema, statusCalculator, me.id);

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
      const me = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
      ).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const service = new SqlTaskService(pool, schema, statusCalculator, me.id);

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
      const me = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
      ).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      const service = new SqlTaskService(pool, schema, statusCalculator, me.id);
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

  describe('updateParticipant', () => {
    it('works', async () => {
      // ARRANGE
      const me = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
      ).getOrCreateUser({
        user: {
          name: 'me',
          email: 'me@example.com',
          provider: 'test',
          providerUserId: '2893674528967345',
        },
      });
      await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        me.id,
      ).updateUser({
        userId: me.id,
        userUpdate: { status: 'idle' },
      });
      const them = await new SqlUserService(
        pool,
        schema,
        statusCalculator,
      ).getOrCreateUser({
        user: {
          name: 'them',
          email: 'them@example.com',
          provider: 'test',
          providerUserId: 'kjlafsdhkljadlhjfkflhjak',
        },
      });
      await new SqlUserService(
        pool,
        schema,
        statusCalculator,
        them.id,
      ).updateUser({
        userId: them.id,
        userUpdate: { status: 'idle' },
      });

      const service = new SqlTaskService(pool, schema, statusCalculator, me.id);

      const task = await service.createTask({
        task: {
          name: 'test task',
          durationMinutes: 15,
          groupSize: 2,
        },
      });

      const { items } = await service.createParticipants({
        taskId: task.id,
        participants: [{ userId: them.id }],
      });

      // ACT
      const result = await service.updateParticipant({
        taskId: task.id,
        participantId: items[0].id,
        participant: { response: 'yes' },
      });

      // ASSERT
      const resultingTask = await service.getTask({ taskId: task.id });
      expect(task.status).toEqual<TaskStatus>('waiting');
      expect(resultingTask.status).toEqual<TaskStatus>('ready');
    });
  });

  describe('various state machine logic', () => {
    it('works when participant responses change', async () => {
      // Create two users, me and them
      let [me, them] = await db.createUsers(2);

      // Ensure that I am idle
      me = await db.as(me).setStatus('idle');
      expect(me.status).toEqual<UserStatus>('idle');

      // Ensure that they are idle
      them = await db.as(them).setStatus('idle');
      expect(them.status).toEqual<UserStatus>('idle');

      // Create a tasks with a group size of two
      let t1 = await db.as(me).createTask({ groupSize: 2 });

      // Ensure the task is in a waiting state
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // Add them as a participant to the task
      await db.as(me).addParticipant(t1, them);
      let [p1, p2] = await db.as(me).getParticipants(t1);
      // Ensure I have responded yes and they have not responded
      expect(p1.response).toEqual<ParticipantResponse>('yes'); // me
      expect(p2.response).toBeUndefined(); // them

      // Ensure the task is still in a waiting state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // They respond yes
      p2 = await db.as(them).respond(t1, 'yes');
      // Ensure the task is now in a ready state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('ready');

      // They respond no
      p2 = await db.as(them).respond(t1, 'no');
      // Ensure the task is back in a waiting state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // I respond no
      p1 = await db.as(me).respond(t1, 'no');
      // Ensure the task is still in a waiting state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // They respond yes
      p2 = await db.as(them).respond(t1, 'yes');
      // Ensure the task is still in a waiting state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // I respond yes
      p1 = await db.as(me).respond(t1, 'yes');
      // Ensure the task is now in a ready state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('ready');
    });

    it('works when user statuses change', async () => {
      // Create two users, me and them
      let [me, them] = await db.createUsers(2);

      // Ensure that I am away
      me = await db.as(me).setStatus('away');
      expect(me.status).toEqual<UserStatus>('away');

      // Ensure that they are away
      them = await db.as(them).setStatus('away');
      expect(them.status).toEqual<UserStatus>('away');

      // Create a tasks with a group size of two
      let t1 = await db.as(me).createTask({ groupSize: 2 });

      // Ensure the task is in a waiting state
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // Add them as a participant to the task
      await db.as(me).addParticipant(t1, them);
      let [p1, p2] = await db.as(me).getParticipants(t1);
      // Ensure I have responded yes and they have not responded
      expect(p1.response).toEqual<ParticipantResponse>('yes'); // me
      expect(p2.response).toBeUndefined(); // them

      // Ensure the task is still in a waiting state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // They respond yes
      p2 = await db.as(them).respond(t1, 'yes');
      // Ensure the task is still in a waiting state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // I move to idle
      me = await db.as(me).setStatus('idle');
      // Ensure the task is still in a waiting state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // They move to idle
      them = await db.as(them).setStatus('idle');
      // Ensure the task is now in a ready state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('ready');
    });

    it('works when task status changes', async () => {
      // Create two users, me and them
      let [me, them] = await db.createUsers(2);

      // Ensure that I am away
      me = await db.as(me).setStatus('idle');
      expect(me.status).toEqual<UserStatus>('idle');

      // Ensure that they are away
      them = await db.as(them).setStatus('away');
      expect(them.status).toEqual<UserStatus>('away');

      // Create a tasks with a group size of two
      let t1 = await db.as(me).createTask({ groupSize: 2 });

      // Ensure the task is in a waiting state
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // Add them as a participant to the task
      await db.as(me).addParticipant(t1, them);
      let [p1, p2] = await db.as(me).getParticipants(t1);
      // Ensure I have responded yes and they have not responded
      expect(p1.response).toEqual<ParticipantResponse>('yes'); // me
      expect(p2.response).toBeUndefined(); // them

      // Ensure the task is still in a waiting state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // They respond yes
      p2 = await db.as(them).respond(t1, 'yes');
      // Ensure the task is still in a waiting state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // I move to idle
      me = await db.as(me).setStatus('idle');
      // Ensure the task is still in a waiting state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('waiting');

      // They move to idle
      them = await db.as(them).setStatus('idle');
      // Ensure the task is now in a ready state
      t1 = await db.as(me).getTask(t1.id);
      expect(t1.status).toEqual<TaskStatus>('ready');
    });

    it('works when starting a task', async () => {
      // ARRANGE
      let [me, them] = await db.createUsers(2);
      me = await db.as(me).setStatus('idle');
      them = await db.as(them).setStatus('idle');
      let t1 = await db.as(me).createTask({ groupSize: 2 });
      let t2 = await db.as(me).createTask({ groupSize: 2 });
      await db.as(me).addParticipant(t1, them);
      await db.as(me).addParticipant(t2, them);
      await db.as(them).respond(t1, 'yes');
      await db.as(them).respond(t2, 'yes');
      t1 = await db.as(me).getTask(t1.id);
      t2 = await db.as(me).getTask(t2.id);
      expect(t1.status).toEqual<TaskStatus>('ready');
      expect(t2.status).toEqual<TaskStatus>('ready');

      // ACT
      t1 = await db.as(me).startTask(t1);

      // ASSERT
      t2 = await db.as(me).getTask(t2.id);
      me = await db.getUser(me.id);
      them = await db.getUser(them.id);
      expect(t1.status).toEqual<TaskStatus>('in-progress');
      expect(t2.status).toEqual<TaskStatus>('waiting');
      expect(me.status).toEqual<UserStatus>('flow');
      expect(me.currentTaskId).toEqual<string>(t1.id);
      expect(them.status).toEqual<UserStatus>('idle');
      expect(them.currentTaskId).toBeUndefined();
    });

    it('works when joining a task', async () => {
      // ARRANGE
      let [me, them] = await db.createUsers(2);
      me = await db.as(me).setStatus('idle');
      them = await db.as(them).setStatus('idle');
      let t1 = await db.as(me).createTask({ groupSize: 2 });
      let t2 = await db.as(me).createTask({ groupSize: 2 });
      await db.as(me).addParticipant(t1, them);
      await db.as(me).addParticipant(t2, them);
      await db.as(them).respond(t1, 'yes');
      await db.as(them).respond(t2, 'yes');
      t1 = await db.as(me).getTask(t1.id);
      t2 = await db.as(me).getTask(t2.id);
      expect(t1.status).toEqual<TaskStatus>('ready');
      expect(t2.status).toEqual<TaskStatus>('ready');
      t1 = await db.as(me).startTask(t1);

      // ACT
      t1 = await db.as(them).joinTask(t1);

      // ASSERT
      t1 = await db.as(me).getTask(t1.id);
      t2 = await db.as(me).getTask(t2.id);
      me = await db.getUser(me.id);
      them = await db.getUser(them.id);
      expect(t1.status).toEqual<TaskStatus>('in-progress');
      expect(t2.status).toEqual<TaskStatus>('waiting');
      expect(me.status).toEqual<UserStatus>('flow');
      expect(me.currentTaskId).toEqual<string>(t1.id);
      expect(them.status).toEqual<UserStatus>('flow');
      expect(them.currentTaskId).toEqual<string>(t1.id);
    });

    it('works when ending a task', async () => {
      // ARRANGE
      let [me, them] = await db.createUsers(2);
      me = await db.as(me).setStatus('idle');
      them = await db.as(them).setStatus('idle');
      let t1 = await db.as(me).createTask({ groupSize: 2 });
      let t2 = await db.as(me).createTask({ groupSize: 2 });
      await db.as(me).addParticipant(t1, them);
      await db.as(me).addParticipant(t2, them);
      await db.as(them).respond(t1, 'yes');
      await db.as(them).respond(t2, 'yes');
      t1 = await db.as(me).getTask(t1.id);
      t2 = await db.as(me).getTask(t2.id);
      expect(t1.status).toEqual<TaskStatus>('ready');
      expect(t2.status).toEqual<TaskStatus>('ready');
      t1 = await db.as(me).startTask(t1);
      t2 = await db.as(me).getTask(t2.id);
      expect(t1.status).toEqual<TaskStatus>('in-progress');
      expect(t2.status).toEqual<TaskStatus>('waiting');

      // ACT
      t1 = await db.as(me).endTask(t1);

      // ASSERT
      t1 = await db.as(me).getTask(t1.id);
      t2 = await db.as(me).getTask(t2.id);
      me = await db.getUser(me.id);
      them = await db.getUser(them.id);
      expect(t1.status).toEqual<TaskStatus>('ready');
      expect(t2.status).toEqual<TaskStatus>('ready');
      expect(me.status).toEqual<UserStatus>('idle');
      expect(me.currentTaskId).toBeUndefined();
      expect(them.status).toEqual<UserStatus>('idle');
      expect(them.currentTaskId).toBeUndefined();
    });

    it('works when leaving a task NOT as the last participant', async () => {
      // ARRANGE
      let [me, them] = await db.createUsers(2);
      me = await db.as(me).setStatus('idle');
      them = await db.as(them).setStatus('idle');
      let t1 = await db.as(me).createTask({ groupSize: 2 });
      let t2 = await db.as(me).createTask({ groupSize: 2 });
      await db.as(me).addParticipant(t1, them);
      await db.as(me).addParticipant(t2, them);
      await db.as(them).respond(t1, 'yes');
      await db.as(them).respond(t2, 'yes');
      t1 = await db.as(me).getTask(t1.id);
      t2 = await db.as(me).getTask(t2.id);
      expect(t1.status).toEqual<TaskStatus>('ready');
      expect(t2.status).toEqual<TaskStatus>('ready');
      t1 = await db.as(me).startTask(t1);
      t1 = await db.as(them).joinTask(t1);

      // ACT
      t1 = await db.as(me).leaveTask(t1);

      // ASSERT
      t1 = await db.as(me).getTask(t1.id);
      t2 = await db.as(me).getTask(t2.id);
      me = await db.getUser(me.id);
      them = await db.getUser(them.id);
      expect(t1.status).toEqual<TaskStatus>('in-progress');
      expect(t2.status).toEqual<TaskStatus>('waiting');
      expect(me.status).toEqual<UserStatus>('idle');
      expect(me.currentTaskId).toBeUndefined();
      expect(them.status).toEqual<UserStatus>('flow');
      expect(them.currentTaskId).toEqual<string>(t1.id);
    });

    it('works when leaving a task as the last participant', async () => {
      // ARRANGE
      let [me, them] = await db.createUsers(2);
      me = await db.as(me).setStatus('idle');
      them = await db.as(them).setStatus('idle');
      let t1 = await db.as(me).createTask({ groupSize: 2 });
      let t2 = await db.as(me).createTask({ groupSize: 2 });
      await db.as(me).addParticipant(t1, them);
      await db.as(me).addParticipant(t2, them);
      await db.as(them).respond(t1, 'yes');
      await db.as(them).respond(t2, 'yes');
      t1 = await db.as(me).getTask(t1.id);
      t2 = await db.as(me).getTask(t2.id);
      expect(t1.status).toEqual<TaskStatus>('ready');
      expect(t2.status).toEqual<TaskStatus>('ready');
      t1 = await db.as(me).startTask(t1);
      t1 = await db.as(them).joinTask(t1);

      // ACT
      t1 = await db.as(me).leaveTask(t1);
      t1 = await db.as(them).leaveTask(t1);

      // ASSERT
      t1 = await db.as(me).getTask(t1.id);
      t2 = await db.as(me).getTask(t2.id);
      me = await db.getUser(me.id);
      them = await db.getUser(them.id);
      expect(t1.status).toEqual<TaskStatus>('ready');
      expect(t2.status).toEqual<TaskStatus>('ready');
      expect(me.status).toEqual<UserStatus>('idle');
      expect(me.currentTaskId).toBeUndefined();
      expect(them.status).toEqual<UserStatus>('idle');
      expect(them.currentTaskId).toBeUndefined();
    });
  });
});
