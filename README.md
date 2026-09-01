# Citadel — Smart Rental Tracking System

A 4-person team's submission for the Caterpillar campus hackathon (Sept
1–3, 2026): a rental-equipment tracking system covering the full asset
lifecycle (check out → assign/track → log usage → check in), with rule-
based alerts, anomaly detection, demand forecasting, and a ranked
recommendation feed that turns each signal into a plain-language
action. Built on top of a domain-agnostic starter foundation.

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

## What's actually built

The starter's placeholder `items` reference module has been fully removed
and replaced with the real domain modules (each following the same
routes → controller → service → repository shape it demonstrated):
`equipment`, `checkouts`, `usage-logs`, `alerts`, `anomalies`, `forecasts`,
`recommendations`, `sites`, `operators`, `utilization`, `capacity` (all
under `server/src/modules/`).

The frontend has **three role-gated experiences**, entered at `/` via real
Google Sign-In (OAuth 2.0 authorization code flow, `server/src/modules/auth`,
migration `010_create_users.sql`) — a signed-in user picks a role once
(server-persisted, changeable anytime from "Switch role") rather than
picking from an unauthenticated list, see `.ai/FRONTEND-REBUILD-PLAN.md`:
- **Customer** (`/customer/...`) — discover available equipment, view a
  rental-fit hint, rent, and track/return from "My Rentals."
- **Dealer** (`/dealer`, `/dealer/assets`) — the original Control Tower
  (ranked Action Queue + live status/utilization/forecast panels) and
  Asset Dashboard (check-out/check-in/log-usage), now under `/dealer/*`.
- **Caterpillar Admin** (`/admin/*`) — a Control Tower home page leading
  with the fleet-wide ranked recommendations queue plus exception counts
  (anomalies, capacity flags, unassigned equipment), with fleet
  allocation (`/admin/fleet`), utilization, capacity, anomalies, and
  forecasts as supporting deep-dive views — strategic altitude, no
  per-asset actions, unlike Dealer.

See [`.ai/REQUIREMENTS.md`](.ai/REQUIREMENTS.md) for the full
requirement-to-code trace, [`.ai/ARCHITECTURE.md`](.ai/ARCHITECTURE.md)
for the backend system design, and
[`.ai/FRONTEND-REBUILD-PLAN.md`](.ai/FRONTEND-REBUILD-PLAN.md)/
[`.ai/FRONTEND-ROLE-MATRIX.md`](.ai/FRONTEND-ROLE-MATRIX.md) for the
frontend/role architecture.

## Deployment

Frontend → Vercel, backend → Render, database → Neon (managed
PostgreSQL), auto-deploying from `main` on push. Configuration is
committed (`render.yaml`, `client/vercel.json`) but **no account has been
connected yet** — there is no live public URL as of this writing. Full
setup steps, environment variables, rollback, and free-tier limitations:
[`.ai/DEPLOYMENT.md`](.ai/DEPLOYMENT.md) (its status line is the current
source of truth).

## What's intentionally not included

No AI integration, no ORM, no state-management library, no CI pipeline.
Real Google Sign-In exists (see above) but role-based **authorization** is
partial by design: the API enforces true identity-based ownership on the
one place it matters most (a customer returning their own rental —
`checkouts.service.js`'s `user_id` check), while most read endpoints are
not yet role-restricted server-side. Adding any of the above later is
meant to be straightforward — see
[`.ai/ARCHITECTURE.md`](.ai/ARCHITECTURE.md) for how each one plugs in
without restructuring the app.
