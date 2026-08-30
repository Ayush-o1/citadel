# Architecture

## Overview

```
client (React, Vite)  --/api proxy-->  server (Express)  -->  PostgreSQL
```

Two independent apps, no monorepo tooling, no shared build step. They talk
over HTTP through a versionless `/api` prefix. Either side can be replaced
without touching the other, as long as the HTTP contract holds.

## Backend layering

```
routes/modules/<name>/<name>.routes.js       HTTP verbs + paths, wires middleware
                       .controller.js         req/res only, no business logic
                       .service.js             business logic, calls repository
                       .repository.js          the only file that knows SQL
```

Each feature is a self-contained folder under `server/src/modules/`. To add
a feature: copy the `items/` folder, rename it, and add one line to
`server/src/routes/index.js`. To remove a feature: delete the folder and
that one line. No feature module imports another directly — if two features
need to share logic, put it in `server/src/utils/`.

Cross-cutting concerns live outside modules:
- `config/` — environment loading, database pool
- `middleware/` — error handling, 404, request validation
- `utils/` — response helpers, the async error wrapper

## Why no ORM

Raw SQL in the repository layer, plain `.sql` migration files, a ~50-line
migration runner (`server/db/migrate.js`). One dependency (`pg`) instead of
an ORM's query builder, model layer, and migration DSL. For a 2-day
hackathon with a small, evolving schema, this is faster to change and
easier for the whole team to read than learning an ORM's abstractions.
Tradeoff: no auto-generated types, no schema-from-code. Acceptable at this
scale.

## How to add things later

**Authentication** — not included by default; most hackathon judging
criteria don't require it, and it's easy to add if the problem statement
needs it. Add `jsonwebtoken` + `bcrypt`, a `server/src/middleware/auth.js`
that reads a `Bearer` token and attaches `req.user`, and a `users` table +
module following the existing pattern. Apply the middleware only to the
routers that need it.

**AI / external APIs** — add a `server/src/services/` folder (sibling to
`modules/`) for cross-cutting integrations like an LLM client or a
third-party API wrapper. Modules call into it the same way they call the
database — through a service, not directly from the controller.

**Real-time** — add `socket.io` (or plain WebSockets) in `app.js` and a
`server/src/sockets/` folder for event handlers, following the same
routes-style organization.

**File uploads** — add `multer` as route-level middleware on the one route
that needs it; store files locally in dev, swap for S3-compatible storage
later without touching other routes.

**Role-based access** — once auth exists, a small `requireRole('admin')`
middleware placed after `auth` on the routes that need it.

**A second database (MongoDB)** — only if the domain genuinely needs
document storage the relational model can't express well. Add a
`server/src/config/mongo.js` mirroring `db.js`, and give document-shaped
features their own repository backed by Mongo instead of Postgres. Don't
split a single feature across both databases.

**Dashboards / analytics** — a read-heavy page is just another frontend
page calling a read-only backend route; no new architecture needed unless
query volume genuinely requires a separate reporting datastore.

## Frontend structure

```
src/
  api/          one file per backend module, thin wrappers over fetch
  components/   shared UI (Layout, loading/error/empty states)
  pages/        one file per route
  hooks/        shared stateful logic (useApi)
```

State is local `useState`/`useEffect` via the `useApi` hook — no Redux, no
React Query. Fine for the data volume and page count of a 2-day hackathon.
If server state genuinely gets complex (caching, pagination, optimistic
updates across many pages), reach for `@tanstack/react-query` then, not
before.

## Deliberately excluded

TypeScript, ESLint/Prettier config, CI pipeline, a component library,
global state management, microservices, an event bus. Each is a real
option later if the problem statement and remaining time justify it — see
`docs/DECISIONS.md` for how to record that choice when it's made.
