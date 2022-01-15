import { Registry, singleton } from 'ts-registry';
import { Pool } from 'pg';
import Pusher from 'pusher';
import DataLoader from 'dataloader';

import {
  InvitationService,
  UserService,
  TaskService,
  User,
  Task,
} from './domain/v1/api.g';
import { SqlUserService } from './services/sql-user-service';
import { SqlInvitationService } from './services/sql-invitation-service';
import { SqlTaskService } from './services/sql-task-service';
import { StatusCalculator } from './services/status-calculator';
import { SqlStatusCalculator } from './services/sql-status-calculator';
import { MessageBus, RealTime, SqlMessageBus } from './services/real-time';

export type ServiceMap = {
  'current-user-id': string | undefined;
  'invitation-service': InvitationService;
  'task-service': TaskService;
  'user-service': UserService;
  'status-calculator': StatusCalculator;
  'real-time': RealTime;
  'message-bus': MessageBus;
  pool: Pool;
  'db-schema': string;
  'user-loader': DataLoader<string, User | undefined>;
  'task-loader': DataLoader<string, Task | undefined>;
};

export const registry = new Registry<ServiceMap>();

registry.for('current-user-id').use(() => undefined);

registry.for('db-schema').use(() => process.env['DB_SCHEMA'] || '');

registry
  .for('user-loader')
  .withScope(singleton)
  .use(
    (get) =>
      new DataLoader(async (userIds: string[]) => {
        const users = (await get('user-service').getUsers({ userIds })).items;
        return userIds.map((userId) =>
          users.find((user) => user.id === userId),
        );
      }),
  );

registry
  .for('task-loader')
  .withScope(singleton)
  .use(
    (get) =>
      new DataLoader(async (taskIds: string[]) => {
        const tasks = (await get('task-service').getTasks({ taskIds })).items;
        return taskIds.map((taskId) =>
          tasks.find((task) => task.id === taskId),
        );
      }),
  );

registry
  .for('invitation-service')
  .use(
    (get) =>
      new SqlInvitationService(
        get('pool'),
        get('db-schema'),
        get('current-user-id'),
      ),
  );

registry
  .for('task-service')
  .use(
    (get) =>
      new SqlTaskService(
        get('pool'),
        get('db-schema'),
        get('status-calculator'),
        get('message-bus'),
        get('current-user-id'),
      ),
  );

registry
  .for('user-service')
  .use(
    (get) =>
      new SqlUserService(
        get('pool'),
        get('db-schema'),
        get('status-calculator'),
        get('message-bus'),
        get('current-user-id'),
      ),
  );

registry
  .for('status-calculator')
  .use(
    (get) =>
      new SqlStatusCalculator(
        get('pool'),
        get('db-schema'),
        get('message-bus'),
      ),
  );

// registry.for('pool').use(
//   () =>
//     new Pool({
//       user: process.env['POSTGRES_USER'],
//       host: process.env['DB_HOST'] || '127.0.0.1',
//       database: process.env['POSTGRES_DB'],
//       password: process.env['POSTGRES_PASSWORD'],
//       port: 5432,
//     }),
// );

registry
  .for('pool')
  .withScope(singleton)
  .use(
    () =>
      new Pool({
        user: process.env['COCKROACH_DB_USERNAME'],
        host: process.env['COCKROACH_DB_HOST'] || '127.0.0.1',
        database: process.env['COCKROACH_DB_DATABASE'],
        password: process.env['COCKROACH_DB_PASSWORD'],
        port: Number(process.env['COCKROACH_DB_PORT']),
        ssl: true,
      }),
  );

// registry.for('fauna').use(
//   () =>
//     new Client({
//       secret: process.env.FAUNA_DB_SECRET || '',
//       domain: process.env.FAUNA_DB_DOMAIN || '',
//       scheme: 'https',
//     }),
// );

registry
  .for('real-time')
  .withScope(singleton)
  .use(
    () =>
      new Pusher({
        appId: process.env['PUSHER_APP_ID'] || '',
        key: process.env['PUSHER_KEY'] || '',
        secret: process.env['PUSHER_SECRET'] || '',
        cluster: process.env['PUSHER_CLUSTER'] || '',
        useTLS: true,
      }),
  );

registry
  .for('message-bus')
  .withScope(singleton)
  .use(
    (get) => new SqlMessageBus(get('pool'), get('db-schema'), get('real-time')),
  );
