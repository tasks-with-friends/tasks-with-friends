import { Registry } from 'ts-registry';
import { request } from 'ts-registry-express';
import { FsUsersService } from './services/fs-users-service';

import { join } from 'path';

import { IUsersService } from './domain';
import { Client } from 'faunadb';
import { FaunaUsersService } from './services/fauna-users-service';

export type ServiceMap = {
  'current-user-id': string;
  'users-service': IUsersService;
  fauna: Client;
};

export const registry = new Registry<ServiceMap>();

registry
  .for('current-user-id')
  .withScope(request)
  .use((_, req) => req.session?.passport?.user?.id);

registry
  .for('users-service')
  // .use(() => new FsUsersService(join(__dirname, '_temp_users.json')));
  .use((get) => new FaunaUsersService(get('fauna')));

registry.for('fauna').use(
  () =>
    new Client({
      secret: process.env.FAUNA_DB_SECRET || '',
      domain: process.env.FAUNA_DB_DOMAIN || '',
      scheme: 'https',
    }),
);
