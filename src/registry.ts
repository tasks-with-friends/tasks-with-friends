import { Registry } from 'ts-registry';

import { InvitationService, UserService, TaskService } from './domain/v1/api.g';
import { Pool } from 'pg';
import { SqlUserService } from './services/sql-user-service';
import { SqlInvitationService } from './services/sql-invitation-service';
import { SqlTaskService } from './services/sql-task-service';
import { StatusCalculator } from './services/status-calculator';

export type ServiceMap = {
  'current-user-id': string | undefined;
  'invitation-service': InvitationService;
  'task-service': TaskService;
  'user-service': UserService;
  'status-calculator': StatusCalculator;
  pool: Pool;
};

export const registry = new Registry<ServiceMap>();

registry.for('current-user-id').use(() => undefined);

registry
  .for('invitation-service')
  .use(
    (get) =>
      new SqlInvitationService(
        get('pool'),
        process.env['DB_SCHEMA'] || '',
        get('current-user-id'),
      ),
  );

registry
  .for('task-service')
  .use(
    (get) =>
      new SqlTaskService(
        get('pool'),
        process.env['DB_SCHEMA'] || '',
        get('status-calculator'),
        get('current-user-id'),
      ),
  );

registry
  .for('user-service')
  .use(
    (get) =>
      new SqlUserService(
        get('pool'),
        process.env['DB_SCHEMA'] || '',
        get('status-calculator'),
        get('current-user-id'),
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

registry.for('pool').use(
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
