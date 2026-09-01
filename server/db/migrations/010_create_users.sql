-- Real user accounts, backed by Google Sign-In (REQ: real authentication,
-- 2026-09-01 decision — supersedes the "no accounts" note in migration 008).
--
-- role starts NULL: a user picks it once after their first Google sign-in
-- (see server/src/modules/auth) and can change it afterwards from their own
-- account settings, which is how one Google account can demo all three
-- roles without three separate Google accounts. It is a real, authenticated,
-- server-persisted update — not a client-side simulation.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('customer', 'dealer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links a checkout to the real signed-in customer who made it (nullable:
-- dealer-initiated checkouts and pre-auth seed/test data have none). When
-- present, self-return ownership is checked against this instead of the
-- free-text customer_name — see checkouts.service.js.
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_checkouts_user_id ON checkouts (user_id);
