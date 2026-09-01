import { query } from '../../config/db.js';

export async function findById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

// Single atomic upsert instead of findByGoogleId -> branch -> createUser /
// touchLogin+updateProfile. That check-then-act pattern had a real,
// reproduced race: the OAuth callback is a full-page navigation with no
// loading feedback, so a double-click, a slow-network retry, or a
// re-fired redirect sends two (or more) concurrent requests for the same
// brand-new Google user. All of them see "no existing user" from a
// separate SELECT, all attempt INSERT, and every loser gets a 23505
// unique_violation -- reproduced locally with 10 concurrent calls to the
// old createUser.
//
// ON CONFLICT (google_id) alone is not sufficient: this table also has a
// UNIQUE constraint on email, and ON CONFLICT only arbitrates the
// constraint it names. A losing transaction whose MVCC snapshot doesn't
// yet see the winner's commit can still be rejected on the email
// constraint before Postgres ever reaches the google_id conflict path --
// reproduced locally too (9/10 succeeded, 1/10 failed on
// users_email_key, even with ON CONFLICT (google_id) in place). Since a
// real Google account has exactly one email, any unique-constraint
// collision on this table during this specific operation means another
// concurrent request for the same identity already won -- so the
// correct recovery is to re-read that row and return it, not to fail.
export async function upsertGoogleUser({ googleId, email, name, avatarUrl }) {
  try {
    const { rows } = await query(
      `INSERT INTO users (google_id, email, name, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_id) DO UPDATE SET
         name = EXCLUDED.name,
         avatar_url = EXCLUDED.avatar_url,
         last_login_at = now()
       RETURNING *`,
      [googleId, email, name, avatarUrl ?? null]
    );
    return rows[0];
  } catch (err) {
    if (err.code !== '23505') throw err;
    const { rows } = await query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email]);
    if (rows[0]) return rows[0];
    throw err;
  }
}

export async function updateRole(id, role) {
  const { rows } = await query('UPDATE users SET role = $2 WHERE id = $1 RETURNING *', [id, role]);
  return rows[0] ?? null;
}
