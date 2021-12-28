import { Client } from 'faunadb';

import { Task } from '../domain';
import { FaunaTaskService } from './fauna-task-service';
import { FaunaUsersService } from './fauna-users-service';
import { FaunaUtils } from './fauna-utils';

let client: Client;
describe.skip('fauna-task-service', () => {
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

  it('works', async () => {
    // ARRANGE
    const me = await new FaunaUsersService(client).getOrCreate({
      email: '101@example.com',
      name: '101',
      provider: 'test',
      providerUserId: '101',
    });

    const service = new FaunaTaskService(client, me.id);

    // ACT
    const task = await service.createTask({
      name: 'test task',
      description: 'its just a test',
      durationMinutes: 15,
      groupSize: 2,
    });
    expect(task).toEqual<Task>({
      id: task.id,
      ownerId: me.id,
      name: 'test task',
      description: 'its just a test',
      durationMinutes: 15,
      groupSize: 2,
      status: 'ready',
    });

    const editedTask = await service.editTask({
      id: task.id,
      name: 'experimental task',
      description: null,
    });
    expect(editedTask).toEqual<Task>({
      id: task.id,
      ownerId: me.id,
      name: 'experimental task',
      description: '',
      durationMinutes: 15,
      groupSize: 2,
      status: 'ready',
    });

    const removedTask = await service.removeTask(task.id);
    expect(removedTask).toEqual<Task>(editedTask);
  });

  it.only('works', async () => {
    // ARRANGE
    const myUser = await new FaunaUsersService(client).getOrCreate({
      email: '101@example.com',
      name: '101',
      provider: 'test',
      providerUserId: '101',
    });
    const theirUser = await new FaunaUsersService(client).getOrCreate({
      email: '102@example.com',
      name: '102',
      provider: 'test',
      providerUserId: '102',
    });

    const me = new FaunaTaskService(client, myUser.id);
    const them = new FaunaTaskService(client, theirUser.id);

    await Promise.all([
      me.createTask({
        name: 'A',
        description: 'its just a test',
        durationMinutes: 15,
        groupSize: 2,
      }),
      them.createTask({
        name: 'B',
        description: 'its just a test',
        durationMinutes: 15,
        groupSize: 2,
      }),
      me.createTask({
        name: 'C',
        description: 'its just a test',
        durationMinutes: 15,
        groupSize: 2,
      }),
      them.createTask({
        name: 'D',
        description: 'its just a test',
        durationMinutes: 15,
        groupSize: 2,
      }),
      me.createTask({
        name: 'E',
        description: 'its just a test',
        durationMinutes: 15,
        groupSize: 2,
      }),
      me.createTask({
        name: 'F',
        description: 'its just a test',
        durationMinutes: 15,
        groupSize: 2,
      }),
    ]);

    // ACT
    const myTasks = await me.getTasksByOwnerId(myUser.id, { take: 2 });

    console.log(myTasks);
  });
});
