# Test results — this session, 2026-09-02

All commands run locally in `/Users/ayush/Desktop/citadel`. Full raw output
saved under `tests/`.

## Environment

- **Postgres:** 18.6 (Homebrew, `postgresql@18` service — already running,
  not Docker), local, `DATABASE_URL` from `server/.env`.
- **Node:** as configured in the repo (`node -v` not overridden this session).
- **Backend:** `cd server && npm run dev` — nodemon, port 4000.
- **Frontend:** `cd client && npm run dev` — Vite, port 5173.
- Both dev servers were confirmed live via `GET /api/health` (`database:
  "connected"`) and `curl -I http://localhost:5173/` (`200`) before any
  browser testing began.

## Git state

```
$ git rev-parse HEAD
d13bd57e6711b778daa258214c3346008a00d753
$ git status
On branch main, up to date with 'origin/main', working tree clean
```
(Confirmed clean again at the end of this session too — see `README.md`.)

## Database migrations

```
$ psql ... -c "select name from schema_migrations order by applied_at"
001_create_items_table.sql
002_create_sites_operators.sql
003_create_equipment.sql
004_create_checkouts.sql
005_create_usage_logs.sql
006_create_analytics_tables.sql
007_drop_items_table.sql
008_add_customer_name.sql
009_add_capacity_source_type.sql
010_create_users.sql
011_dedupe_and_lock_analytics_sync.sql
```
All 11 migrations applied, matching production exactly (confirmed against
`ISSUES.md`'s record of the live Render deploy).

## Backend automated tests — `cd server && npm test`

**First run (before reseeding):** `tests/backend/npm-test-output.txt` —
**31/32 passing**, 1 real failure (seed-data time drift, see `BUGS_FIXED.md` #1).

**After reseeding:** `tests/backend/npm-test-output-after-reseed.txt` —
**32/32 passing**, 0 failures.

```
# tests 32
# suites 0
# pass 32
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

## Frontend build — `cd client && npm run build`

`tests/frontend/npm-run-build-output.txt`:

```
✓ 74 modules transformed.
dist/index.html                   1.23 kB │ gzip:   0.66 kB
dist/assets/index-1xseOyuL.css   24.83 kB │ gzip:   5.21 kB
dist/assets/index-Bv-ztAWv.js   324.12 kB │ gzip: 100.00 kB
✓ built in 87ms
```
Clean, zero errors, zero warnings.

## Live browser testing — Playwright (Chromium)

Playwright was already present in this environment (`npx playwright
--version` → 1.62.1, chromium cached). Two scripts were written and run
against the live local dev stack (not a mock, not the production build):

- A full multi-role journey script driving Entry/Customer/Dealer/Admin,
  desktop (1440×900) and mobile (390×844) viewports, with console/network
  error watchers attached to every page.
- A focused re-test for one specific interaction (new-user role selection)
  after the first script's locator for it turned out to be imprecise (see
  `USER_JOURNEY_TESTS.md` for the full explanation — a script bug, not an
  app bug, caught and corrected in the same pass).

**Console/network errors found across the entire run:** two, both expected
and correct — a `404` when deliberately navigating to a nonexistent
equipment ID (error-state test) and a `409` when deliberately attempting a
duplicate checkout (edge-case test). **Zero unexplained errors** on any
real user-facing flow. Full raw log: `logs/browser-console.log`.

**32 screenshots captured**, organized under `screenshots/`, each tied to a
specific requirement in `REQUIREMENTS_AUDIT.md` and indexed in
`EVIDENCE_INDEX.md`.

## Direct database verification (not trusting the UI alone)

Every state-changing action taken through the browser was cross-checked
directly against Postgres via `psql`, not assumed from what the UI showed:

- Customer checkout/return of `EQX1001` → confirmed `checked_out_at`/
  `checked_in_at` timestamps and `equipment.status` transitions.
- Dealer checkout/check-in of `EQX1001` (second round trip) → same.
- Usage log write → confirmed the row existed in `usage_logs`, then
  confirmed its deletion (test cleanup) actually removed it.
- Recommendation actioned/dismissed → confirmed `status`/`actioned_at`
  changed, then confirmed the revert-to-pending worked.
- Anomaly duplicate check → confirmed via a live `(checkout_id, type)`
  grouping query against the fresh `GET /api/anomalies` response: **0
  duplicate keys** out of 19 open anomalies.
- New-user role selection → confirmed via `SELECT role FROM users WHERE
  email = ...` before (`NULL`) and after (`'dealer'`) clicking "Identify as
  Dealer" in the real browser.

## What was NOT run this session

- `docker compose up` end-to-end (local Postgres was already running via
  Homebrew, not Docker — same unverified state as `ISSUES.md` `RISK-001`,
  unchanged by this session).
- A true clean-machine bootstrap (fresh clone → install → migrate → seed on
  an empty database) — this session reused the existing local checkout and
  its already-installed `node_modules`.
- Any request against the live Vercel/Render/Neon deployment — this pass was
  scoped to local-only per your explicit instruction. See
  `DEPLOYMENT_STATUS.md` for what was verified live in the prior session and
  what that means for today's findings (in particular: the seed-drift bug
  found here is a local-only symptom of a pattern that could equally affect
  the production Neon database if it hasn't been reseeded recently — worth
  checking before presenting).
