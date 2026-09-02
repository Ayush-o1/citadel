# Project state

## Final local verification pass — 32/32 tests, deployment live, product complete (2026-09-02, later)

Since the entry below (2026-09-01), a lot changed that this file hadn't
caught up to yet — see `HANDOFF.md`'s two 2026-09-02 entries for the full
narrative; this is the corrected snapshot:

- **Auth is now Firebase Authentication**, not the manual OAuth flow
  described below — `client/src/firebase.js`, `server/src/config/firebaseAdmin.js`,
  `auth.service.js`'s `completeFirebaseSignIn`. The `users` table/schema was
  deliberately left unchanged (explicit constraint honored).
- **Deployment is live**: `https://citadel-silk.vercel.app` (Vercel) +
  `https://citadel-96hb.onrender.com` (Render, Dockerfile-deployed) + Neon
  Postgres — see `ISSUES.md` `RISK-004`, now RESOLVED.
- **A real race condition was found and fixed** (duplicate anomaly/alert/
  recommendation rows under concurrent access) — migration `011`,
  `ISSUES.md` `BUG-003`, RESOLVED, reconfirmed zero-duplicates again in this
  session's local testing.
- **Role switching was found removed by a teammate commit and restored** —
  `ISSUES.md` `BUG-004`, RESOLVED.
- **A full local end-to-end verification pass ran 2026-09-02** (not a code
  review — a real running stack, Playwright-driven, every role, screenshots
  + direct DB checks): **32/32 backend tests passing**, clean frontend
  build, 14/15 official requirements PASS with fresh evidence (the 15th —
  Google's own OAuth popup — can't be scripted, verified live in production
  instead). Full report: `FINAL_HACKATHON_VERIFICATION/` (start with
  `FINAL_VERDICT.md` — verdict: **READY WITH SMALL FIXES**).
- **One real bug found and fixed this pass**: seeded demo data drifts with
  real wall-clock time (`ISSUES.md` `BUG-001`, recurring — reseed before
  presenting). **One new finding, not fixed**: mobile Action Queue is very
  long with no pagination (`ISSUES.md` `BUG-005`, OPEN).
- Server-side authorization remains narrow (`ISSUES.md` `RISK-005`,
  ACCEPTED) — unchanged, reconfirmed still accurate.

**Overall: product implementation is complete and verified working end to
end, locally, today.** Not yet done: reseeding immediately before the
actual demo slot (drift will have recurred by then — see `ISSUES.md`
`BUG-001`), and a human click-through on the actual presenting
device/browser.

---

## Real Google auth landed + Admin Control Tower added (2026-09-01, late)

Two things changed since the last entry below, both verified live against
the running app, not just by reading code:

1. **Real Google OAuth is live**, not the earlier client-simulated role
   model. Migration `010_create_users.sql` (a real `users` table,
   `checkouts.user_id`), `server/src/modules/auth/` (manual OAuth
   Authorization Code flow, JWT session cookie, no auth library
   dependency), `client/src/app/RoleContext.jsx`/`RoleGate.jsx` rewritten
   around it. Role now lives on the authenticated account (nullable until
   first chosen, changeable afterward via `/switch-role`) instead of
   `localStorage`. Checkout self-return ownership now checks the real
   `user_id` first, falling back to the old free-text `customer_name`
   match only for unauthenticated/legacy callers. **Confirmed working
   with a real Google account** — a genuine row exists in `users`
   (`ayushh.ofc10@gmail.com`, role `admin`), not just a code review. See
   `.ai/DECISIONS.md`'s "Full product/UX audit, second pass" entry for
   the fuller verification (a scripted DB-backed test customer exercised
   checkout → ownership-rejected-for-a-stranger → real-owner-check-in,
   live against Postgres, then cleaned up — baseline still 21/26/257).
2. **Admin's landing page is now a real Control Tower**
   (`client/src/pages/admin/ControlTower.jsx`, mounted at `/admin`),
   leading with the ranked recommendation queue instead of static tables
   — closes the gap where Dealer got the problem statement's "the
   dashboard should recommend" principle and Admin didn't. Old
   `FleetOverview` content moved to `/admin/fleet`, still reachable from
   nav. Full reasoning and known tradeoff (Admin/Dealer queues share the
   same unscoped backend data for now) in `.ai/DECISIONS.md`.

Not yet done: `SESSION_SECRET`/`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
in `server/.env` are real, working local values — confirm they're also
set in whatever hosts the deployed instance before relying on Google
sign-in there (`DEPLOYMENT.md`). This session did not touch deployment.

---

## Second launch pass — this session's own independent re-verification (2026-09-01)

Pulled 9 new commits from `origin/main` (the rebuild below, pushed by
`Souharda6996`) via fast-forward — no conflicts, nothing overwritten.
Independently re-verified from scratch rather than trusting the prior
session's report: found the real local Postgres (port 5432, the one
`server/.env` actually points at and the one used for a persistent
launch) still had the old pre-rebuild seed data, and that a Docker-based
verification attempt in this sandboxed session had only applied
migrations `008`/`009` to a throwaway container Postgres that then got
torn down between tool calls — not the real database. Cleared the real
local DB's rows (FK-safe deletes, schema untouched), re-ran all 9
migrations against it, reseeded (21/26/257, matches RB-6 exactly), and
got a first `npm test` result of **20/28 passing** — the missing
migrations were the actual cause (`column "customer_name" does not
exist`), not a new regression. Re-ran migrate, then **28/28 passing**,
confirmed twice. `ISSUES.md` `BUG-001` marked `RESOLVED` with this root
cause recorded. `RISK-001` updated to `IN_PROGRESS`: Docker Postgres
itself is now genuinely verified (starts healthy, takes migrations
cleanly); the full 3-container stack remains unverified because this
agent sandbox tears down Docker containers between tool calls — a
limitation of this session's environment, not of `docker-compose.yml`.

Backend + frontend launched fresh (`node src/server.js`, `npm run dev`),
confirmed live: health check connected, frontend/backend/proxy all 200,
`EQX1002`/`EQX1007` confirmed via live API to still produce the exact
official `zero_runtime`/`missing_assignment`/`excessive_idle` triad, and
the capacity endpoint/recommendation for `EQX3006` confirmed live and
correctly worded ("Simulated:", action `investigate`, never a command).
`.ai/MANUAL-QA.md` (already rewritten by the previous session for the
three-role app) checked against this live state and found accurate — no
changes needed. New `.ai/CATERPILLAR-DAY01-FINAL.md`: verified copy-paste
answers for the Day-01 form, written only from facts confirmed this
session, not assumed from either prior session's claims.

Deployment: still not live (`DEPLOYMENT.md` is authoritative) — unchanged
this session, no tokens were provided to proceed with account setup.

---

## Final integration + launch pass (2026-09-01)

Re-verified the merged `main` from a clean slate (not assumed from prior
sessions): fresh Docker Postgres → `npm run migrate` (9/9 migrations,
clean) → `npm run seed` (21 equipment / 26 checkouts / 257 usage_logs,
matches RB-6's documented baseline exactly) → `npm test` (**28/28
passing**) → `npm run build` (client, clean, 58 modules) → live Playwright
pass across all three roles + the capacity feature (zero console errors)
→ confirmed `EQX1002`/`EQX1007` still produce the exact official
zero_runtime/missing_assignment/excessive_idle triad via a direct API
check. Security check: only `.env.example` files tracked, no secrets in
source, `.gitignore` covers `.env`.

**The database currently running for manual QA is this session's fresh
seed** — it does **not** have `ISSUES.md` `BUG-001`'s drift (that bug
describes a *different*, previously-persisted database from an earlier
manual-testing session). If you're QA-ing against the instance this
session left running, `BUG-001` does not apply to what you're looking at;
if you later point at a different/older database, check `ISSUES.md`
first. `.ai/MANUAL-QA.md` was rewritten for the current three-role app
(URLs, routes, and a Customer/Dealer/Admin/Capacity test breakdown) —
the previous version was written for the pre-rebuild single-persona app
and is now superseded, not merely annotated.

Deployment: still **not live** (`DEPLOYMENT.md`'s own status line is
authoritative) — no Vercel/Render/Neon account exists yet, so there is no
public URL to give out. Local is the only running environment.

---

**Last updated:** 2026-09-01, AI agent — merge of two parallel sessions:
(1) the frontend rebuild below (role experiences + capacity-aware
optimization, RB-1..RB-7, all verified) and (2) a documentation-sync +
deployment-prep pass (`DEPLOYMENT.md`, `ISSUES.md` `BUG-001`/`RISK-004`,
`GIT-WORKFLOW.md`). Both are real, non-overlapping work — merged by hand,
nothing dropped. See "Documentation sync + deployment prep" further down
for the second session's own status section, kept intact.
**Statuses used:** `NOT_STARTED` · `PLANNED` · `IN_PROGRESS` · `BLOCKED` · `READY_FOR_REVIEW` · `VERIFIED` · `COMPLETE`

## Frontend rebuild status (current work, see `.ai/FRONTEND-REBUILD-PLAN.md`)

The Phase 00-11 build below is `COMPLETE` and remains the verified backend.
New direction (2026-09-01) reverses the earlier "no roles" decision — see
`.ai/DECISIONS.md`'s "Reversed 'no auth/multi-user roles'" entry — and adds
three role experiences plus a capacity-aware rental optimization feature.

- **RB-1 (planning docs):** `DONE`. `.ai/FRONTEND-REBUILD-PLAN.md`,
  `.ai/FRONTEND-ROLE-MATRIX.md`, `.ai/FRONTEND-UX-PLAN.md` written.
- **RB-2 (design tokens + AppShell + Entry + routing skeleton):** `DONE`.
  `client/src/styles/tokens.css`, `client/src/app/{RoleContext,RoleGate}.jsx`,
  `client/src/components/layout/AppShell.jsx`, `client/src/pages/Entry.jsx`,
  rewritten `client/src/App.jsx`. Client build verified passing
  (`npm run build`, 56 modules, no errors).
- **RB-3 (Dealer restyle):** `DONE` (structural). `ControlTower.jsx`/
  `AssetDashboard.jsx` moved to `client/src/pages/dealer/`, now served at
  `/dealer` and `/dealer/assets`, no functional change. Backend 26/26
  tests reconfirmed passing after the move (`npm test` in `server/`).
  Still needs a deeper visual restyle pass against the new tokens (colors
  work today via inherited CSS vars, but Dealer-specific polish is
  deferred).
- **RB-4 (Customer experience):** `DONE`. Migration `008_add_customer_name.sql`
  applied and verified against a real Postgres instance (via
  `docker compose up postgres`); `checkouts.customer_name` wired through
  schema/repository/service/controller and a new
  `GET /checkouts?customer_name=` filter. `Discover.jsx`,
  `EquipmentDetail.jsx`, `MyRentals.jsx` built and manually verified via
  live `curl` against the running API (checkout-with-customer-name →
  filtered list → check-in, full cycle, real DB rows, not mocked).
- **RB-5 (Admin experience):** `DONE`. `FleetOverview.jsx`,
  `Utilization.jsx`, `Anomalies.jsx`, `Forecasts.jsx`,
  `Recommendations.jsx` built under `/admin/*`, reusing existing
  `utilization`/`anomalies`/`forecasts`/`recommendations` endpoints (new
  dedicated `alerts.js`/`anomalies.js` frontend API clients added — those
  backend endpoints existed but had no frontend consumer before).
- **RB-6 (capacity-aware optimization):** `VERIFIED`. Migration 009
  extends `recommendations.source_type` to include `'capacity'`; new
  `server/src/modules/capacity/` module (rule-based, same
  sync-on-read/honest-degradation style as alerts/anomalies/forecasts —
  see the 2026-09-01 "RB-6" `DECISIONS.md` entry for the full method).
  Wired into `recommendations.service.js` as a fourth signal source
  alongside alerts/anomalies/forecasts. Surfaced in all three roles:
  Dealer's Action Queue and Admin's Recommendations (both via the shared
  `ActionQueueItem`, new `success`/green tone), a dedicated Admin
  `/admin/capacity` page (flagged vs. below-capacity-but-insufficient-
  history sections), and a Customer equipment-fit hint on
  `EquipmentDetail` (type-level baseline only, since an unrented machine
  has no observed rate yet).

  Required one seed-data addition (`server/db/seed.js` Layer 3, see
  `DECISIONS.md`) — the existing seeded Excavator history didn't happen
  to contain a real 65-75%-band sample for the baseline to compute from,
  so the feature could only ever show its "insufficient history"
  fallback. Added 3 historical healthy-band Excavator rentals +
  1 new active checkout (EQX3006, a 60-day-window/light-usage flagship
  case) — purely additive, no existing row touched. **New seed baseline:
  21 equipment / 26 checkouts / 257 usage_logs** (was 17/22/192 through
  Phase 11 — see `DECISIONS.md` for why this changed and why the
  original phase docs were left as historical record rather than edited).

  Verified for real: 28/28 backend tests pass (26 previous + 2 new
  `server/tests/capacity.test.js` cases asserting the exact flagged/
  not-flagged outcomes computed from the seeded numbers), and live in a
  browser (Admin Capacity page, Admin/Dealer Recommendations/Action
  Queue showing the EQX3006 capacity item, Customer equipment-fit hint
  on an Excavator) — zero console errors.
- **RB-7 (QA pass — live browser, not just build/API checks):** `VERIFIED`
  for RB-2..RB-5. No `chromium-cli`/Playwright was preinstalled in this
  environment, so it was installed fresh into the scratchpad
  (`npm install playwright` + `npx playwright install chromium`) and used
  to drive the actual app end-to-end against a real Postgres instance
  (`docker compose up postgres`, migrated, seeded to the documented
  17/22/192 baseline). Verified, with screenshots inspected (not just
  "no exception thrown"):
  - Entry landing renders all three role cards; "Switch role" correctly
    returns to Entry from each role.
  - Dealer: Control Tower (Action Queue/Live Status/Utilization/Forecast)
    and Asset Dashboard both render real seeded data at `/dealer` and
    `/dealer/assets`.
  - Customer: Discover grid, type filter (tested "Crane"), equipment
    detail, and a **full live round trip** — rent EQX1002 with a real
    return date -> appears in My Rentals as "Checked out" -> Return
    equipment -> flips to "Returned" — confirmed against real DB writes,
    not mocked.
  - Admin: Fleet Overview, Utilization, Anomalies (new dedicated view),
    Forecasts, Recommendations all render real data at `/admin/*`.
  - Mobile viewport (390x844): Entry and Customer Discover reflow to a
    clean single column; Dealer's Asset Dashboard table correctly falls
    back to horizontal scroll (existing Phase 10 pattern, by design).
  - **Zero console/page errors** across every screen in both desktop and
    mobile passes.
  - One real bug found and fixed: `Forecasts.jsx` printed "1
    checkouts/week" (bad pluralization) — corrected to singular/plural
    based on the value.
  - Docker container and volume torn down after verification — this
    environment had no persistent local Postgres before this session and
    none is left running now; a real teammate machine's local DB (if any)
    was never touched.

**What's still not done:** `REQUIREMENTS.md`/`MANUAL-QA.md` role-specific
additions beyond what's noted above; a human (not just Playwright) has
not clicked through the new role UIs. RB-1 through RB-7 are otherwise
implemented and verified — see `MANUAL-QA.md`'s own updated notice for
exactly what RB-7 covered.

**Note on the test-count discrepancy below:** the parallel doc-sync
session found the *persisted* local DB at 22/26 passing (`ISSUES.md`
`BUG-001` — real manual-testing residue, not a code defect). This
session's RB-6 work ran against a **freshly migrated + seeded** database
each time (`docker compose up postgres` → `migrate` → `seed`, never a
carried-over DB) and got a clean **28/28** (26 + 2 new capacity tests) —
consistent with BUG-001's own diagnosis that "re-seeding fresh data
would pass all [tests]." The two findings don't conflict; they're
describing different DB states. `BUG-001` remains open for whichever
persisted database the team demos from.

---

## Documentation sync + deployment prep (parallel session, 2026-09-01)

All 11 build phases are `VERIFIED` (see below); the project is in
**INTEGRATION / MANUAL QA / DEPLOYMENT PREP** mode for that track. No
Phase 12 exists or is planned.

## Current work mode

- **Build:** complete. All 11 phases `VERIFIED`, all 20 requirements `VERIFIED`.
- **Manual QA:** `.ai/MANUAL-QA.md` exists (66 tests, A-O). **0 of 66 have
  actually been manually confirmed by a human** as of this update — only
  automated tests and AI-scripted browser walkthroughs (Puppeteer) have
  run. Don't read "all phases VERIFIED" as "manually QA'd" — those are
  different kinds of verification; see `MANUAL-QA.md`'s own rule that only
  a human's actual click-through counts as PASS.
- **Deployment:** configured, **not live**. See `DEPLOYMENT.md` — its
  status line is the source of truth, not this bullet.
- **Automated tests, right now:** `server`: **22/26 passing** (not 26/26
  — see `ISSUES.md` `BUG-001`; this is seeded-data drift from a prior
  manual-testing session, not an application defect). `client`: build
  clean (`npm run build`, 42 modules, no errors) as of that session —
  this session's client build (with the role rebuild + capacity feature
  added) is separately confirmed clean above (58 modules, no errors).

## Current phase

**Phase 00 — Foundation.** Status: `VERIFIED`.
**Phase 01 — Data model & migrations.** Status: `VERIFIED`.
**Phase 02 — Synthetic operational data.** Status: `VERIFIED`. Database
holds 17 equipment / 22 checkouts / 192 usage_logs across the exact
official 7-row Caterpillar sample plus a synthetic trailing-history and
live-active-checkout layer. See
[`phases/PHASE-02-synthetic-data.md`](phases/PHASE-02-synthetic-data.md).

**Planning checkpoint (between Phase 02 and 03)** — `TEAM-EXECUTION-PLAN.md`
+ `CITADEL-ARCHITECTURE-TEAM-PLAN.pdf`: final architecture diagrams,
4-person work division, phase/dependency map, presentation split, panel
defense prep. No architecture or schema change.

**Phase 03 — Core backend APIs.** Status: `VERIFIED`. `equipment/`,
`checkouts/`, `usage-logs/` modules built, tested (14/14 tests pass), and
manually verified against the running server. Database counts confirmed
unchanged after tests (17/22/192 — test fixtures are created and deleted
per-test, never touching the seeded rows). See
[`phases/PHASE-03-core-apis.md`](phases/PHASE-03-core-apis.md).

**Phase 04 — Alerts engine.** Status: `VERIFIED`. `GET /api/alerts`
recomputes and syncs `overdue`/`upcoming_return`/`missing_info` from live
`checkouts` data on every read (16/16 tests pass, incl. Phase 03's).
Seeded `EQX3001`/`EQX3002`/`EQX3003` each produce exactly the expected
alert. See [`phases/PHASE-04-alerts.md`](phases/PHASE-04-alerts.md).

**Phase 05 — Anomaly detection.** Status: `VERIFIED`. `GET /api/anomalies`
implements `excessive_idle`/`zero_runtime`/`missing_assignment`/
`unusual_movement` against real seeded data (17/17 tests pass). The
0.40 idle threshold, already calibrated in Phase 02, is now confirmed in
production code: `EQX1002`/`EQX1007` flagged exactly as Caterpillar's own
worked example intends, `EQX1003`/`EQX1005` correctly clean. See
[`phases/PHASE-05-anomaly-detection.md`](phases/PHASE-05-anomaly-detection.md).

**Phase 06 — Demand forecasting.** Status: `VERIFIED`. `GET /api/forecasts`
produces real forecasts for `Excavator`/`S003` and `Bulldozer`/`S002`
(trailing-window average, ≥3 checkouts/28 days) and an honest
`insufficient_history` fallback for `Grader`/`S001` (Phase 02's
deliberately sparse pair) — exactly as designed (19/19 tests pass).
`RISK-003` and `Q-002` are now both fully resolved. See
[`phases/PHASE-06-forecasting.md`](phases/PHASE-06-forecasting.md).

**Phase 07 — Recommendations & Action Queue.** Status: `VERIFIED`.
`GET /api/recommendations` unifies alerts/anomalies/forecasts into one
ranked, worded feed (23/23 tests pass). Found and fixed a real
cross-file test-concurrency bug along the way (`server/package.json`'s
`test` script now runs files sequentially — see `DECISIONS.md`) and a
forecast-id-stability bug in Phase 06 (delete-then-insert → upsert). See
[`phases/PHASE-07-recommendations.md`](phases/PHASE-07-recommendations.md).

**Phase 08 — Asset Dashboard UI.** Status: `VERIFIED`. Sortable equipment
table, check-out modal (operator/site pickers), check-in action, all
verified working live in a browser (Puppeteer against the real running
dev server + backend), not just by reading the code. Added two small
missing backend endpoints along the way (`GET /api/sites`,
`GET /api/operators`) that the check-out form needed. See
[`phases/PHASE-08-asset-dashboard-ui.md`](phases/PHASE-08-asset-dashboard-ui.md).

**Phase 09 — Control Tower UI.** Status: `VERIFIED`. Now the default `/`
route (the placeholder `Home.jsx` was deleted). Action Queue, Live
Status, Utilization, and Forecast panels all verified live in a browser
against real seeded data — including a live mark-actioned interaction
that visibly closed the loop. Found and fixed two real bugs along the way
(duplicate signal/reason text; stale pending-recommendation wording) —
see [`phases/PHASE-09-control-tower-ui.md`](phases/PHASE-09-control-tower-ui.md).

**Phase 10 — Integration, testing, and polish.** Status: `VERIFIED`. Ran
the full CHECK OUT → LOG USAGE → anomaly → Action Queue → mark-actioned →
CHECK IN chain live through the actual app (not per-phase in isolation) —
found and fixed a real gap (no usage-log UI existed) along the way.
Responsive behavior confirmed numerically at 420px on both screens. The
one optional stretch feature (REQ-020, a rule-driven top-priority
summary) is implemented and verified. See
[`phases/PHASE-10-integration-and-polish.md`](phases/PHASE-10-integration-and-polish.md).

**Phase 11 — Demo and panel-defense prep.** Status: `VERIFIED`. Demo
scripted (`DEMO-SCRIPT.md`) and rehearsed live, twice consecutively,
identical results both times. Panel-defense answers to all 12 of the
problem statement's own "Important Expectation" questions written and
sourced (`PANEL-DEFENSE.md`). **All 20 requirements are now `VERIFIED`.**

## PROJECT STATUS: all 11 phases (00-11) VERIFIED. The build is complete.

No further phases exist in `ROADMAP.md`. Anything from here is
maintenance, a real bug report, or the team's own presentation rehearsal
— not another numbered phase. See the Final Phase 11 Gate checklist below
before treating this as done for a live presentation.

## Final Phase 11 gate — checked honestly, not rubber-stamped

- [x] All phases 03-11 completed and verified
- [x] All requirements audited (`REQUIREMENTS.md` — 20/20 `VERIFIED`)
- [x] Core user journey works end-to-end (Phase 10's live walkthrough + Phase 11's 2 rehearsals)
- [x] Frontend verified (both screens, live browser testing, not just build success)
- [x] Backend verified (26 automated tests + extensive manual `curl`/live verification)
- [x] Database verified (schema, seed, migration idempotency, and row counts double-checked after every phase)
- [x] Analytics/anomalies/forecasting/recommendations verified against real seeded data, not synthetic assertions
- [x] Validation verified (Zod on every write endpoint, tested)
- [x] Error states verified (400/404/409 paths tested at the API; surfaced inline in the UI)
- [x] Security baseline verified (CORS scoped, parameterized queries throughout, no secrets committed, prod errors redacted)
- [x] Responsive behavior reviewed (measured, not eyeballed, at 420px on both screens)
- [ ] Tests pass — **currently 22/26**, not 26/26; see `ISSUES.md` `BUG-001` (seed-data drift, not a code defect). Build passes (client) — reconfirmed 2026-09-01.
- [x] Demo path works (2 clean rehearsals, identical results — as of when last rehearsed; re-verify after fixing `BUG-001`'s underlying data drift before presenting)
- [ ] Representative data intact — **currently drifted**: `equipment`/`checkouts`/`usage_logs` counts are still 17/22/192, but `EQX3001`/`EQX3002` are no longer active checkouts and pending recommendations are 16, not 19. See `ISSUES.md` `BUG-001`.
- [x] Documentation reflects reality (this file, `ISSUES.md`, `DEPLOYMENT.md`, `MANUAL-QA.md`, `README.md` re-audited and corrected 2026-09-01)
- [x] Known issues explicitly documented (`ISSUES.md`, `PANEL-DEFENSE.md`'s limitations section — nothing hidden)
- [ ] No critical blockers remain — `BUG-001` should be resolved (baseline restored) before the next live demo or full test run
- [ ] **Partially honest gaps, not swept under the rug:**
  - `RISK-001` (Docker Compose end-to-end) is still unverified. Flag before relying on Docker for the actual demo machine.
  - `RISK-002` — only Ayush's GitHub invite is accepted; Astik/Eklavya/Souharda haven't joined yet, so `TEAM-EXECUTION-PLAN.md`'s ownership map is a plan for when they do, not evidence of real multi-person execution. All 29 commits to date are authored by `Ayush-o1` alone.
  - `RISK-004` — deployment is configured (`render.yaml`, `client/vercel.json`, `DEPLOYMENT.md`) but not live; no Vercel/Render/Neon account exists yet.
  - A truly clean-machine bootstrap (fresh `git clone` → install → migrate → seed) was not re-run this session end-to-end — migration idempotency and seed-skip behavior were reconfirmed directly, but not from an empty database on a separate machine. Do this once before the real event, not for the first time on the demo machine.
- Final git state: clean at last commit; deployment-prep and documentation changes from this session are being committed now (see git log for the actual current SHA — don't trust a hardcoded hash in this file over `git log`).

## Next recommended action

No further phase work — Phase 11 was the last phase. Before presenting:

1. **Restore the demo baseline** (`ISSUES.md` `BUG-001`): reset `EQX3001`/`EQX3002` to active checkouts and the 3 drifted recommendations back to `pending`, then re-run `npm test` and confirm 26/26.
2. **Actually deploy** (`DEPLOYMENT.md`): create the Neon/Render/Vercel accounts, connect GitHub, set the documented env vars, verify the public URL end-to-end — this is a manual, human-only step (browser/OAuth login).
3. **Run real manual QA**: a human works through `.ai/MANUAL-QA.md`'s 66 tests and marks each PASS/FAIL — currently 0/66 are human-confirmed.
4. Close `RISK-001` (`docker compose up` end-to-end once), do a real fresh-clone bootstrap if possible, and resolve `RISK-002` if the other three teammates can still join.
5. Run `DEMO-SCRIPT.md`'s pre-flight reset and do one more live rehearsal on the actual presentation machine after step 1.

None of this is new application code — all verification/logistics/deployment-config, consistent with `QUALITY.md`.

## Overall progress

| Area | Status | Notes |
|---|---|---|
| Team access | `VERIFIED` | 1 of 3 invites accepted (`eklavaya008`); 2 pending — `RISK-002` |
| Foundation | `VERIFIED` | Phase 00 |
| Docker Compose | `READY_FOR_REVIEW` | Still not run end-to-end — `RISK-001` |
| AI-agent operating system | `VERIFIED` | Phase 00 |
| Problem statement received & analyzed | `VERIFIED` | 2 sources, both confirmed authoritative |
| Data model | `VERIFIED` | Phase 01 |
| Synthetic data | `VERIFIED` | Phase 02 — 17 equipment, 22 checkouts, 192 usage_logs seeded and verified |
| Anomaly threshold calibration | `RESOLVED` | 0.40 idle-ratio threshold validated against real seeded data — `DECISIONS.md` |
| Forecasting method calibration | `RESOLVED` | Plain trailing-window average chosen over exponential smoothing, validated against real seeded data — `DECISIONS.md`, `Q-002` |
| Requirements | `VERIFIED` | All 20 requirements `VERIFIED` — see `REQUIREMENTS.md` |
| Phase plan | `VERIFIED` | 11 phases in `ROADMAP.md`; work division in `TEAM-EXECUTION-PLAN.md` |
| Core backend APIs (equipment/checkouts/usage-logs) | `VERIFIED` | Phase 03 — 14/14 tests pass |
| Alerts engine | `VERIFIED` | Phase 04 — 16/16 tests pass |
| Anomaly detection | `VERIFIED` | Phase 05 — 17/17 tests pass, threshold reconfirmed in production code |
| Demand forecasting | `VERIFIED` | Phase 06 — 19/19 tests pass, both RISK-003 halves resolved |
| Recommendations & Action Queue | `VERIFIED` | Phase 07 — 23/23 tests pass |
| Asset Dashboard UI | `VERIFIED` | Phase 08 — 25/25 backend tests pass, live browser walkthrough verified |
| Control Tower UI | `VERIFIED` | Phase 09 — 26/26 backend tests pass, live browser walkthrough incl. mark-actioned interaction |
| Integration, testing, polish | `VERIFIED` | Phase 10 — full E2E chain walked live; found and fixed missing usage-log UI; stretch feature (REQ-020) done |
| Demo and panel-defense prep | `VERIFIED` | Phase 11 — 2 clean live rehearsals; all 12 "Important Expectation" questions answered and sourced |
| Product implementation | `COMPLETE` | All 11 phases (00-11) `VERIFIED`. See the Final Phase 11 Gate above for honest remaining logistics (Docker, fresh-clone bootstrap, teammate invites). |
| Deployment | `IN_PROGRESS` | Config prepared and committed (`render.yaml`, `client/vercel.json`, `DEPLOYMENT.md`) — `RISK-004`, not yet live. |
| Manual QA (human-verified) | `NOT_STARTED` | `.ai/MANUAL-QA.md` exists (66 tests); 0/66 marked PASS by an actual human so far. |

## Known bugs

None open. See `ISSUES.md`.

## Known risks

- `RISK-001`: Docker Compose stack untested end-to-end.
- `RISK-002`: 2 of 3 invited teammates haven't accepted GitHub access yet.
- `RISK-003`: **Resolved.** Both halves confirmed against real seeded
  data — anomaly/idle threshold (Phase 05) and forecasting method
  (Phase 06, plain average over exponential smoothing). See `DECISIONS.md`.

## Checkpoint log

| Checkpoint | Date | Phase | Commit | Verified |
|---|---|---|---|---|
| `checkpoint/phase-00-foundation` | 2026-08-30 | Phase 00 | `2dfc243` | Yes |
| `checkpoint/phase-01-data-model` | 2026-09-01 | Phase 01 | `56e1a9d` | Yes |
| `checkpoint/phase-02-synthetic-data` | 2026-09-01 | Phase 02 | `a61aa90` | Yes — see Phase 02 doc's "Tests" section |
| `checkpoint/phase-03-core-apis` | 2026-09-01 | Phase 03 | `92d71b5` | Yes — see Phase 03 doc's "Tests" section |
| `checkpoint/phase-04-alerts` | 2026-09-01 | Phase 04 | `2052ec1` | Yes — see Phase 04 doc's "Tests" section |
| `checkpoint/phase-05-anomaly-detection` | 2026-09-01 | Phase 05 | `3f59f3d` | Yes — see Phase 05 doc's "Tests" section |
| `checkpoint/phase-06-forecasting` | 2026-09-01 | Phase 06 | `16b1e5f` | Yes — see Phase 06 doc's "Tests" section |
| `checkpoint/phase-07-recommendations` | 2026-09-01 | Phase 07 | `d6f1479` | Yes — see Phase 07 doc's "Tests" section |
| `checkpoint/phase-08-asset-dashboard-ui` | 2026-09-01 | Phase 08 | `2b298bb` | Yes — see Phase 08 doc's "Tests" section |
| `checkpoint/phase-09-control-tower-ui` | 2026-09-01 | Phase 09 | `32ed4e3` | Yes — see Phase 09 doc's "Tests" section |
| `checkpoint/phase-10-integration-and-polish` | 2026-09-01 | Phase 10 | `81ff470` | Yes — see Phase 10 doc's "Tests" section |
| `checkpoint/phase-11-demo-and-defense` | 2026-09-01 | Phase 11 | `017dfce` | Yes — see Phase 11 doc's "Tests" section |

## What must not be changed without a documented reason

- The core stack choice (React/Express/PostgreSQL, no ORM).
- Rule-based analytics over a trained ML model — see `DECISIONS.md`.
- The schema's nullable `checkouts.site_id`/`checkouts.operator_id`.
- The 0.40 idle-ratio anomaly threshold — now validated against real data (`DECISIONS.md`); don't casually retune it without new evidence.
- The seeded data's deliberate edge cases (`EQX3001`–`EQX3005`, the `Grader`/`S001` sparse-history pair) — Phase 04/05/06/09 tests and demo depend on these existing exactly as seeded. Don't overwrite them by re-running seed against a wiped-then-different dataset without updating this state.
- `server/.env` — real local DB credentials, never commit it.
