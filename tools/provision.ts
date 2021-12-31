import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool, PoolConfig } from 'pg';

const options: PoolConfig = {
  user: process.env['COCKROACH_DB_USERNAME'],
  host: process.env['COCKROACH_DB_HOST'] || '127.0.0.1',
  database: process.env['COCKROACH_DB_DATABASE'],
  password: process.env['COCKROACH_DB_PASSWORD'],
  port: Number(process.env['COCKROACH_DB_PORT']),
  ssl: true,
};

const pool = new Pool(options);

const script = readFileSync(join('db', 'init', '01_seed.sql')).toString();

(async () => {
  await pool.query(script);
  console.log('success!');
})();
