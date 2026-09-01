import { query } from '../../config/db.js';

export async function findAll() {
  const { rows } = await query('SELECT id, code, name, location FROM sites ORDER BY code');
  return rows;
}
