import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool, PoolConfig } from 'pg';

// const options: PoolConfig = {
//   user: process.env['COCKROACH_DB_USERNAME'],
//   host: process.env['COCKROACH_DB_HOST'] || '127.0.0.1',
//   database: process.env['COCKROACH_DB_DATABASE'],
//   password: process.env['COCKROACH_DB_PASSWORD'],
//   port: Number(process.env['COCKROACH_DB_PORT']),
//   ssl: true,
// };

const options: PoolConfig = {
  user: process.env['POSTGRES_USER'],
  host: process.env['DB_HOST'] || '127.0.0.1',
  database: process.env['POSTGRES_DB'],
  password: process.env['POSTGRES_PASSWORD'],
  port: 5432,
};

const schema = process.env['DB_SCHEMA'];

const pool = new Pool(options);

const script = readFileSync(
  join('db', 'migrations', '02_add_current_task.sql'),
).toString();

(async () => {
  await pool.query(`
  USE ${schema};

  ${script}`);
  console.log('success!');
})();
