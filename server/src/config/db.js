import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export function query(text, params) {
  return pool.query(text, params);
}

export async function checkConnection() {
  const result = await pool.query('SELECT NOW() AS now');
  return result.rows[0].now;
}
