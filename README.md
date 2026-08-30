# Citadel

Domain-agnostic hackathon starter and command center for a 4-person team's
Caterpillar campus hackathon (Sept 1–3, 2026). No fake domain logic — this
is a clean foundation to adapt once the real problem statement is
revealed.

**Picking this project up — human or AI agent?** Start at
[`.ai/AGENTS.md`](.ai/AGENTS.md). It's the entrypoint for current project
state, phase, decisions, and what to do next — this README only covers
running the code.

## Stack

- **Frontend**: React 18 + Vite, React Router, plain CSS
- **Backend**: Node.js + Express, layered as routes → controller → service → repository
- **Database**: PostgreSQL (raw SQL via `pg`, no ORM), plain-file migrations
- **Validation**: Zod
- **Testing**: Node's built-in test runner + Supertest
- **Docker**: optional, for teammates without local Postgres

Chosen because it's the stack the whole team already knows — see
[`.ai/DECISIONS.md`](.ai/DECISIONS.md) for the reasoning.

## Repository structure

```
client/     React app (Vite)
server/     Express API
  src/      app code (config, middleware, routes, modules, utils)
  db/       migrations + migration runner + seed script
  tests/    backend tests
.ai/        project state, decisions, architecture, phases — start here
scripts/    setup.sh — one-shot local bootstrap
docker-compose.yml   optional full-stack spin-up
PROBLEM-STATEMENT.md  the real Caterpillar problem statement goes here
```

## Local setup

Prerequisites: Node.js >= 18, npm, a running PostgreSQL instance (or Docker).

```bash
./scripts/setup.sh
```

This installs both apps' dependencies and creates `server/.env` and
`client/.env` from their `.env.example` files. Edit `server/.env` and set
`DATABASE_URL` to point at a real Postgres database, then:

```bash
cd server && npm run migrate   # create tables
cd server && npm run dev       # API on http://localhost:4000
cd client && npm run dev       # app on http://localhost:5173
```

The Vite dev server proxies `/api` to the backend, so the frontend never
needs to know the backend's URL in development.

### Without local Postgres

```bash
docker compose up
docker compose exec server npm run migrate
```

This starts Postgres, the API, and the client together. See
`docker-compose.yml` for the (non-secret, dev-only) default credentials.

## Environment variables

Real values live only in `.env` files, which are git-ignored. Never commit
credentials — see `server/.env.example` and `client/.env.example` for the
variables each app expects.

## Database

One PostgreSQL database, no ORM. Schema changes are plain `.sql` files in
`server/db/migrations/`, applied in order by `server/db/migrate.js`
(tracked in a `schema_migrations` table). Add a new file, run
`npm run migrate`. `server/db/seed.js` adds a little sample data for local
dev — safe to delete once real data exists.

## Git workflow

Branch off `main`, open a PR, get one review, merge. Full details —
naming, commit style, checkpoints, conflict handling — in
[`.ai/GIT-WORKFLOW.md`](.ai/GIT-WORKFLOW.md).

## Replacing the starter with the real solution

The `items` module (`server/src/modules/items/`, `client/src/pages/Items.jsx`,
`client/src/api/items.js`) is a working end-to-end reference — not a real
feature. Once the problem statement lands, follow
[`.ai/PLAYBOOK.md`](.ai/PLAYBOOK.md) to scope the MVP, then copy or
delete that module as your starting point.

## What's intentionally not included

No auth, no AI integration, no dashboards, no ORM, no state-management
library, no CI pipeline. Adding any of these later is meant to be
straightforward — see [`.ai/ARCHITECTURE.md`](.ai/ARCHITECTURE.md) for how
each one plugs in without restructuring the app.
