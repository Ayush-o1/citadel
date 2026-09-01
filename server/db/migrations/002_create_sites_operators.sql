-- Sites and operators referenced by equipment/checkouts.
-- `code` holds Caterpillar's own short identifiers (e.g. "S003", "OP101")
-- as seen on the official sample dataset — kept separate from `name` so
-- the official codes are never fabricated or renamed.

-- `name` is nullable: the official sample only supplies codes, never real
-- site/operator names — a NOT NULL constraint here would force fabricating
-- a name for every official row.
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT,
  site_id UUID REFERENCES sites(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
