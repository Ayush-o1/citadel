import { query } from '../../config/db.js';

export async function findByGoogleId(googleId) {
  const { rows } = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return rows[0] ?? null;
}

export async function findById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function createUser({ googleId, email, name, avatarUrl }) {
  const { rows } = await query(
    `INSERT INTO users (google_id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *`,
    [googleId, email, name, avatarUrl ?? null]
  );
  return rows[0];
}

export async function touchLogin(id) {
  await query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
}

export async function updateProfile(id, { name, avatarUrl }) {
  const { rows } = await query(
    'UPDATE users SET name = $2, avatar_url = $3 WHERE id = $1 RETURNING *',
    [id, name, avatarUrl ?? null]
  );
  return rows[0];
}

export async function updateRole(id, role) {
  const { rows } = await query('UPDATE users SET role = $2 WHERE id = $1 RETURNING *', [id, role]);
  return rows[0] ?? null;
}
