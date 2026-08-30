#!/usr/bin/env bash
# One-shot local dev bootstrap: installs deps and prepares .env files.
# Does NOT touch the database — run `npm run migrate` in server/ yourself
# once DATABASE_URL in server/.env points at a real Postgres database.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Installing server dependencies"
(cd "$ROOT_DIR/server" && npm install)

echo "==> Installing client dependencies"
(cd "$ROOT_DIR/client" && npm install)

if [ ! -f "$ROOT_DIR/server/.env" ]; then
  echo "==> Creating server/.env from server/.env.example"
  cp "$ROOT_DIR/server/.env.example" "$ROOT_DIR/server/.env"
  echo "    Edit server/.env and set DATABASE_URL before running the server."
fi

if [ ! -f "$ROOT_DIR/client/.env" ]; then
  echo "==> Creating client/.env from client/.env.example"
  cp "$ROOT_DIR/client/.env.example" "$ROOT_DIR/client/.env"
fi

cat <<'EOF'

Setup complete. Next steps:
  1. Make sure server/.env has a working DATABASE_URL.
  2. cd server && npm run migrate
  3. cd server && npm run dev      (in one terminal)
  4. cd client && npm run dev      (in another terminal)

Or, without local Postgres installed:
  docker compose up
  docker compose exec server npm run migrate
EOF
