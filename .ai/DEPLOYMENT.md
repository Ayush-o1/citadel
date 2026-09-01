# Deployment

**Status as of 2026-09-02: LIVE, but not yet fully working.** Real
accounts exist now:
- Frontend: **https://citadel-silk.vercel.app**
- Backend: **https://citadel-96hb.onrender.com** (health confirmed:
  `database: "connected"`; CORS confirmed correctly allowing the Vercel
  origin)
- Database: Neon, connected (confirmed via the health check above)

**Known broken right now, real cause identified, code-level fix shipped
this session — two dashboard values still need to be set/confirmed by a
human before Google Sign-In will actually work end to end:**
1. `VITE_API_URL` was not present in Vercel's last build (confirmed
   empirically — the deployed JS bundle contained no reference to the
   Render URL at all), so `/api/auth/google` resolved against Vercel's
   own origin and 404'd instead of reaching the backend. **Action:** in
   Vercel → Project → Settings → Environment Variables, confirm
   `VITE_API_URL=https://citadel-96hb.onrender.com` is set for
   Production, then trigger a redeploy (a new push to `main`, including
   this fix, does this automatically — but the env var itself must
   already be saved in Vercel before that build runs, or it still won't
   be picked up).
2. `GET https://citadel-96hb.onrender.com/api/auth/status` currently
   returns `googleConfigured: false` — `GOOGLE_CLIENT_ID`/
   `GOOGLE_CLIENT_SECRET` aren't set on Render yet. **Action:** add both
   in Render's Environment tab (same values as `server/.env` locally),
   plus `GOOGLE_REDIRECT_URI=https://citadel-96hb.onrender.com/api/auth/google/callback`
   and a real `SESSION_SECRET`, then confirm that exact callback URL and
   the Vercel origin are both registered on the OAuth client in Google
   Cloud Console.

Once both are done, re-run the "Final verification" checklist below on
the real URLs.

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
   the `citadel-api` web service, and (since 2026-09-02) prompts you to
   fill in all six `sync: false` variables during setup: `DATABASE_URL`
   (from step 1), `CLIENT_ORIGIN` (from step 3, can circle back),
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI`, and
   `SESSION_SECRET`. None are committed to the repo. If you set up the
   service before this file's variables list grew, add the four auth ones
   manually in the dashboard's Environment tab — Render won't do it for
   you retroactively.
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

## Cross-origin cookies (why sign-in wouldn't have worked without a real fix)

The frontend (Vercel) and backend (Render) are on genuinely different
domains in the hosted environment — not just different `localhost`
ports like local dev, where they count as the same "site" and cookies
just work. A session cookie set with `SameSite=Lax` (the safe default,
and what this app used before 2026-09-02) is **never sent on a
cross-site `fetch()`/XHR request** — only on a top-level navigation. The
Google OAuth callback is a real navigation (Lax allows it, so the cookie
gets set fine), but every API call the React app makes afterward is a
cross-site `fetch(..., {credentials:'include'})` — which would have
silently dropped the cookie, making the app look permanently signed-out
immediately after a successful sign-in. This would not have shown up in
any local testing, only after a real deploy.

Fixed: `server/src/modules/auth/auth.controller.js`'s cookie options are
now `sameSite: isProduction ? 'none' : 'lax'` (and `secure` follows the
same flag — `SameSite=None` requires `Secure`, which requires HTTPS,
true for both Vercel and Render, never true for local HTTP dev). No env
var or manual step needed — this is automatic based on `NODE_ENV`.

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

## Deployment checklist

Work top to bottom — each section depends on the one above it.

**Database (Neon)**
- [ ] Project created, pooled connection string copied (ends `?sslmode=require`)
- [ ] `DATABASE_URL` set on Render from that connection string

**Backend (Render)**
- [ ] `citadel-api` service created via Blueprint (`render.yaml`)
- [ ] All six env vars set: `DATABASE_URL`, `CLIENT_ORIGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `SESSION_SECRET`
- [ ] First deploy succeeds (`npm run migrate && npm start` — check the deploy log for "Applied N migration(s)" or "No pending migrations")
- [ ] `GET <render-url>/api/health` returns `"database":"connected"`
- [ ] Seed run once (`npm run seed` from a local shell with the production `DATABASE_URL`, or a Render Shell command)

**Frontend (Vercel)**
- [ ] Project imported, Root Directory set to `client`
- [ ] `VITE_API_URL` set to the Render URL
- [ ] Build succeeds, `client/vercel.json`'s SPA rewrite picked up automatically
- [ ] Opening a deep link directly (e.g. `<vercel-url>/dealer/assets`) loads the app, not a 404

**Cross-service wiring**
- [ ] Render's `CLIENT_ORIGIN` set to the real Vercel URL (redeploy after setting)
- [ ] Google Cloud Console OAuth client has the Vercel URL as an Authorized JavaScript origin and `<render-url>/api/auth/google/callback` as an Authorized redirect URI
- [ ] Render's `GOOGLE_REDIRECT_URI` set to that same real callback URL (not the localhost default — the server logs a warning at startup if this is wrong, check the Render logs)

**Final verification (a human, in a real browser, on the Vercel URL)**
- [ ] Entry screen loads, no console errors
- [ ] Google Sign-In completes and returns to the app signed in (tests the cross-origin cookie fix above)
- [ ] Choosing each of Customer/Dealer/Admin lands in that role's workspace with real data
- [ ] Customer: rent an item, see it in My Rentals, return it
- [ ] Dealer: check an item out, log usage, check it back in
- [ ] Admin: Control Tower loads the recommendation queue, marking one actioned works
- [ ] Sign out, then sign in again — session behaves correctly both times
- [ ] This file's status line at the top updated with the real URLs and date

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

## What was verified this session vs. what wasn't

**2026-09-02 pass — a genuine deployment-readiness audit, not just docs:**
- Found and fixed a real, deployment-blocking bug: `server/db/migrate.js`
  and `server/db/seed.js` each created their own `pg.Pool` with no SSL
  config, inconsistent with `db.js`'s production SSL handling — and
  `migrate.js` is the first thing Render's `startCommand` runs, so a
  failure there would have failed the entire deploy before the app ever
  started. Fixed to match `db.js` exactly.
- Found and fixed a real, severe bug that would have made Google
  Sign-In appear completely broken in production while working
  perfectly locally: the session cookie's `SameSite=Lax` setting is
  invisible to local testing (both sides are `localhost`, same-site) but
  fails silently in the real cross-domain hosted setup. See "Cross-origin
  cookies" above.
- Found and fixed a real gap: `render.yaml` didn't declare the Google
  OAuth/session env vars, so Render's Blueprint setup wouldn't have
  prompted for them at all — now it does.
- Added a fail-loud-not-silent guard: `CLIENT_ORIGIN` is now a hard
  startup requirement in production (was a silent `localhost` fallback,
  which would have broken CORS for the real deployed frontend with no
  clear error) — see `server/src/config/env.js`.
- Added a startup warning (not a hard failure) if `GOOGLE_REDIRECT_URI`
  is still the localhost default while Google credentials are configured
  in production — a real, easy-to-make mistake that otherwise fails
  silently (Google still shows a valid consent screen, then redirects
  users to their own machine).
- Re-verified migration + seed reproducibility **from a genuinely empty
  database** (not assumed): created a throwaway local Postgres database,
  ran `migrate` then `seed` against it from nothing, confirmed the exact
  documented baseline (21/26/257), re-ran both to confirm idempotency,
  started the app against that database on an alternate port, and hit
  real API endpoints (`/api/health`, `/api/equipment`) successfully —
  then dropped the throwaway database.
- Checked git history for accidentally committed secrets (none found;
  `.env` was never committed).
- Backend test suite: 32/32 passing, reconfirmed after all of the above
  changes. One transient failure during this session traced to real,
  documented demo-state drift (two seeded recommendations had been
  marked `actioned` via real interaction with the running app, not a
  code defect) — restored via the project's own documented reset
  command (`MANUAL-QA.md`), not a test or code change.
- `client/vercel.json`'s SPA rewrite is the standard, documented Vercel
  pattern for a client-side-routed React app.
- Current free-tier facts in this file were checked against 2026-09
  sources (see `DECISIONS.md`), not assumed from memory or an old
  tutorial.

**Not verified (can't be, without the manual account-creation step above):**
- That Render/Vercel/Neon actually build and run this exact repo without a surprise (e.g., a build-time environment difference).
- That the "push to main → auto-deploy" loop works in practice.
- Actual cold-start latency, actual free-tier ceiling behavior under real use.
- The cross-origin cookie fix above is verified by code/protocol reasoning (how `SameSite`/`Secure` actually behave per the relevant browser spec) and by confirming it doesn't break local dev — it has not been observed working against two genuinely different real hosted domains, because none exist yet.

Do not upgrade this file's status to "LIVE" until someone has actually
done the manual setup above and re-verified end to end.
