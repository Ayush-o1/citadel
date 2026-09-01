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

// Runs fn with a single client wrapped in BEGIN/COMMIT, rolling back on any
// thrown error. Use this whenever a request must update more than one table
// atomically (e.g. a checkout row plus the equipment row's status) — see
// checkouts.service.js.
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
