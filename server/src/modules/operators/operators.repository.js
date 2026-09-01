import { query } from '../../config/db.js';

export async function findAll() {
  const { rows } = await query('SELECT id, code, name, site_id FROM operators ORDER BY code');
  return rows;
}
