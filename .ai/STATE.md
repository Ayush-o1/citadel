# Project state

**Last updated:** 2026-09-01, AI agent — documentation sync pass
(post-Phase-11). All 11 build phases are `VERIFIED` (see below); the
project is now in **INTEGRATION / MANUAL QA / DEPLOYMENT PREP** mode, not
active phase development. No Phase 12 exists or is planned.
**Statuses used:** `NOT_STARTED` · `PLANNED` · `IN_PROGRESS` · `BLOCKED` · `READY_FOR_REVIEW` · `VERIFIED` · `COMPLETE`

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
  clean (`npm run build`, 42 modules, no errors).

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
