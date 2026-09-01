# Project state

**Last updated:** 2026-09-01, AI agent — frontend rebuild (role experiences
+ capacity-aware optimization), phases RB-1..RB-5 in progress. See below;
the Phase 00-11 history that follows is unchanged/historical.
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
- **RB-6 (capacity-aware optimization):** `NOT_STARTED`. Design is written
  (`FRONTEND-REBUILD-PLAN.md` section 4) — new `capacity` backend module,
  migration extending `recommendations.source_type`, surfaced across all
  three roles. Not yet implemented.
- **RB-7 (QA pass, doc sync):** `NOT_STARTED`. No live-browser manual QA
  done yet on the new role UIs (verification so far: client build passes,
  backend tests pass, and the Customer checkout/filter/check-in cycle was
  verified live via `curl`, not through the actual browser UI). Don't
  claim RB-2..RB-5 "browser-verified" until that's actually done.

**Verification honesty note:** this session did not open the app in a
browser. Build success and API-level `curl` verification are real but are
not a substitute for the live-browser walkthroughs the original Phase
08-11 work did — that's outstanding before calling any of RB-2..RB-5
`VERIFIED` rather than `DONE`.

---

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
- [x] Tests pass (26/26); build passes (client)
- [x] Demo path works (2 clean rehearsals, identical results)
- [x] Representative data intact (17 equipment / 22 checkouts / 192 usage_logs / 19 pending recommendations — the exact Phase 02/07 baseline, reconfirmed after every manual test this session)
- [x] Documentation reflects reality (updated continuously, phase by phase, not backfilled)
- [x] Known issues explicitly documented (`ISSUES.md`, `PANEL-DEFENSE.md`'s limitations section — nothing hidden)
- [x] No critical blockers remain
- [ ] **Partially honest gaps, not swept under the rug:**
  - `RISK-001` (Docker Compose end-to-end) is still unverified this session — the app was run directly via `node`/`vite`, not through Docker Compose. Flag before relying on Docker for the actual demo machine.
  - `RISK-002` — only Ayush's GitHub invite is accepted; Astik/Eklavya/Souharda haven't joined yet, so `TEAM-EXECUTION-PLAN.md`'s ownership map is a plan for when they do, not evidence of real multi-person execution.
  - A truly clean-machine bootstrap (fresh `git clone` → install → migrate → seed) was not re-run this session end-to-end — migration idempotency and seed-skip behavior were reconfirmed directly, but not from an empty database on a separate machine. Do this once before the real event, not for the first time on the demo machine.
- Final git state: clean, all checkpoints pushed and verified on remote (see Checkpoint log below).

## Next recommended action

**No further autonomous phase work.** Before presenting: (1) close
`RISK-001` by actually running `docker compose up` end-to-end once, (2)
do one real fresh-clone bootstrap on a second machine if possible, (3)
resolve `RISK-002` if the other three teammates can still join, (4) run
`DEMO-SCRIPT.md`'s pre-flight reset and do one more live rehearsal on the
actual presentation machine, per `PANEL-DEFENSE.md`'s own limitations
list — none of this changes application code, all of it is
verification/logistics.

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
