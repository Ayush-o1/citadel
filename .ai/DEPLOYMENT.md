# Deployment

**Status as of 2026-09-01: NOT YET LIVE.** Configuration for all three
services is prepared and committed to the repository, but no Vercel,
Render, or Neon account has actually been created/connected yet, so there
is no public URL. Don't tell a judge or teammate "it's deployed" until
this file's status line has been updated to say otherwise. Local
development (`README.md`) remains the fallback and the only currently-
running environment.

## Architecture

```
GitHub (main branch)
   │
   ├─→ Vercel  ──builds──→  client/ (Vite/React static build)   [public]
   │
   └─→ Render  ──builds──→  server/ (Express API)                [public]
                                  │
                                  └─→ Neon (managed PostgreSQL)   [private]
```

Both hosts deploy straight from the GitHub repo — push a verified change
to `main`, the host detects it, builds, and deploys automatically. No
custom CI pipeline.

## Provider choice and why

| Layer | Provider | Why |
|---|---|---|
| Frontend | Vercel (Hobby/free) | Zero-config for Vite, GitHub-integrated auto-deploy, generous free limits (100GB transfer/mo, 1M requests/mo as of 2026-09) for a hackathon demo's traffic. Non-commercial-use restriction is fine — this isn't a commercial product. |
| Backend | Render (Free web service) | GitHub-integrated auto-deploy, supports a plain `npm install` / `npm start` Node service with no Docker required, has a Blueprint (`render.yaml`) for reproducible one-click setup. |
| Database | **Neon** (free tier), not Render's free Postgres | Render's free Postgres **expires 30 days after creation** (14-day grace period, then deleted) — unacceptable for a project that needs to survive past the hackathon dates for interviews/follow-up. Neon's free tier has no expiration, no credit card, allows commercial use, and gives 0.5GB storage / 100 CU-hours/month, which is more than enough at this data volume (21 equipment / 26 checkouts / 257 usage_logs). |

Recorded as a real decision in `DECISIONS.md` (2026-09-01 entry) with
sources.

## Known free-tier limitations — documented, not hidden

- **Render free web service spins down after 15 minutes of inactivity.**
  The next request triggers a cold start (~30-60s). Acceptable for a
  demo where the presenter loads the page a minute before presenting;
  not acceptable for a judge randomly checking the app at 2am unannounced.
- **Render free tier grants 750 instance-hours/workspace/month** — fine
  for one service running continuously within a month, but be aware if
  other free services share the workspace.
- **Neon free tier**: 0.5GB storage, 100 compute-hours/month, scale-to-
  zero (a cold query after idle can add latency, similar in spirit to
  Render's spin-down but shorter).
- **Vercel Hobby plan is licensed for personal/non-commercial use only**
  — fine for a hackathon/portfolio project, would need a Pro plan if this
  ever became a paid product.
- None of these require a credit card to set up.

## Environment variables (names only — real values live in each host's dashboard, never in this repo)

**Backend (Render):**
| Variable | Purpose |
|---|---|
| `NODE_ENV` | Set to `production` — enables SSL for the Neon connection (see `server/src/config/db.js`) and hides internal error details. |
| `DATABASE_URL` | Neon connection string, must include `?sslmode=require`. |
| `CLIENT_ORIGIN` | The deployed Vercel URL (e.g. `https://citadel-xyz.vercel.app`) — CORS only allows this one origin, never `*`. |
| `PORT` | Provided automatically by Render at runtime — do not set manually. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From the same Google Cloud OAuth client used locally (`server/.env.example`) — real Google Sign-In needs these set on Render too, not just locally. |
| `GOOGLE_REDIRECT_URI` | Must be the real deployed callback URL (`<render-url>/api/auth/google/callback`), and that exact URL must also be added to the OAuth client's Authorized redirect URIs in Google Cloud Console — see step 3 below. |
| `SESSION_SECRET` | A long random string signing session JWTs (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) — without it the app falls back to a secret generated fresh per process start, meaning every Render restart signs out all users. Set a real one for production. |

**Frontend (Vercel):**
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | The deployed Render backend's base URL (e.g. `https://citadel-api.onrender.com`). Leave empty for local dev (uses the Vite proxy instead — see `vite.config.js`). |

See `server/.env.example` and `client/.env.example` for the full list including local-dev-only variables.

## How to actually go live (one-time, manual — needs a human's browser/login)

Account creation and GitHub-app authorization can't be done headlessly by
an AI agent — this is the one part of this file that requires a person:

1. **Neon**: sign up at neon.tech (GitHub login works), create a project
   named `citadel`, copy the pooled connection string (ends in
   `?sslmode=require`).
2. **Render**: sign up at render.com (GitHub login), New → Blueprint,
   select this repo — it reads `render.yaml` at the repo root and creates
   the `citadel-api` web service. Set `DATABASE_URL` (from step 1) and
   `CLIENT_ORIGIN` (from step 3, can circle back) in the Render dashboard's
   environment tab — `render.yaml` deliberately leaves these `sync: false`
   so they're never committed.
3. **Vercel**: sign up at vercel.com (GitHub login), Import Project, pick
   this repo, set **Root Directory** to `client`. It auto-detects Vite
   (build command `npm run build`, output `dist`) and reads
   `client/vercel.json` for the SPA rewrite rule (needed because the app
   uses `react-router-dom`'s `BrowserRouter` — without it, refreshing
   `/dealer/assets` in production 404s). Also set `GOOGLE_REDIRECT_URI`
   on Render to the real `<render-url>/api/auth/google/callback`, and add
   that same URL plus the Vercel origin to the OAuth client's Authorized
   redirect URIs / JavaScript origins in Google Cloud Console — real
   Google Sign-In won't work on the deployed URL until this is done (it's
   currently only configured for `localhost`). Set `VITE_API_URL` to the
   Render URL from step 2.
4. Go back to Render, set `CLIENT_ORIGIN` to the real Vercel URL, redeploy.
5. Verify: open the Vercel URL, confirm Google Sign-In completes and
   lands you in a role workspace with real data, confirm no CORS errors
   in the console, confirm `<render-url>/api/health` returns
   `database: "connected"`.
6. Update this file's status line at the top from "NOT YET LIVE" to the
   actual public URLs and today's date.

## Migration / seed process

- Render's `startCommand` (in `render.yaml`) runs `npm run migrate` before
  `npm start` on every deploy — safe because `server/db/migrate.js` is
  idempotent (tracks applied migrations in `schema_migrations`, a no-op
  if nothing's pending).
- Seeding is **not** automatic on deploy (`npm run seed` is also
  idempotent — skips if `equipment` already has rows — but running it
  isn't necessary after the first time, and keeping it out of
  `startCommand` keeps restarts fast). Run it once manually after the
  first successful deploy: from a local machine with the production
  `DATABASE_URL` in the environment, run `cd server && npm run seed`, or
  add a one-off Render Shell command.
- The official Caterpillar sample rows (`EQX1001`-`EQX1007`) and the
  deliberately-edge-case rows (`EQX3001`-`EQX3005`, the sparse
  Grader/S001 pair) come from this same seed script — reproducible from
  the repo, not hand-created in any dashboard.

## Health check

`GET /api/health` — returns `{"success":true,"data":{"status":"ok","uptimeSeconds":...,"database":"connected"|"unreachable"}}`.
Render's `render.yaml` sets `healthCheckPath: /api/health`, so Render
itself uses this to decide if a deploy is healthy.

## Rollback

1. Render and Vercel both keep a history of previous deploys tied to
   specific commits — each dashboard has a "Redeploy" / "Promote to
   Production" action on any prior successful deploy. This is the
   fastest rollback path; no CLI or git operation needed.
2. Equivalently from git: `git log --oneline` to find the last known-good
   commit (checkpoint tags like `checkpoint/phase-11-demo-and-defense`
   are good candidates), then `git revert` the bad commit(s) (never
   force-push) and push — both hosts auto-deploy the revert.
3. Verify recovery the same way as a fresh deploy: health check, load the
   frontend, confirm no console/CORS errors.

## Branch policy

Both Render and Vercel should be configured to auto-deploy only from
`main` (each host's dashboard has a "Production Branch" setting — leave
it at `main`, do not add other branches). This matches `GIT-WORKFLOW.md`:
`main` is always demo-able, so it's the only branch that should ever
reach the public URLs.

## Local vs. hosted

| | Local (fallback, always available) | Hosted (public demo/team-test) |
|---|---|---|
| Frontend | `cd client && npm run dev` → http://localhost:5173 | Vercel URL (once live) |
| Backend | `cd server && npm run dev` → http://localhost:4000 | Render URL (once live) |
| Database | Local Postgres or `docker compose up` | Neon |

Local development is not a fallback-of-last-resort — it's the primary
way this project has been built and verified so far (see `STATE.md`).
Treat the hosted environment as an additional public/team-access surface,
not a replacement.

## What was verified this session (2026-09-01) vs. what wasn't

**Verified:**
- `server/src/config/db.js` now enables SSL only when `NODE_ENV=production` (local dev, which has no SSL listener, is unaffected — confirmed by re-running the full backend test suite locally after the change).
- `client/vercel.json`'s SPA rewrite is the standard, documented Vercel pattern for a client-side-routed React app.
- `render.yaml` was reviewed for correct build/start commands and health check path against the actual `package.json` scripts.
- Current free-tier facts above were checked against 2026-09 sources (see `DECISIONS.md`), not assumed from memory or an old tutorial.

**Not verified (can't be, without the manual account-creation step above):**
- That Render/Vercel/Neon actually build and run this exact repo without a surprise (e.g., a build-time environment difference).
- That the "push to main → auto-deploy" loop works in practice.
- Actual cold-start latency, actual free-tier ceiling behavior under real use.

Do not upgrade this file's status to "LIVE" until someone has actually
done the manual setup above and re-verified end to end.
