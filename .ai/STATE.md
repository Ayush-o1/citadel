# Project state

**Last updated:** 2026-09-01, AI agent, Phase 03 implementation session
(autonomous Phase 03→11 run, authorized after the `TEAM-EXECUTION-PLAN.md`
planning checkpoint).
**Statuses used:** `NOT_STARTED` · `PLANNED` · `IN_PROGRESS` · `BLOCKED` · `READY_FOR_REVIEW` · `VERIFIED` · `COMPLETE`

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

**Phases 08-11:** `NOT_STARTED`. 08 (Asset Dashboard UI) unblocked since
Phase 03. 09 (Control Tower UI) now unblocked — 07's API contract exists.

## Next recommended action

Continuing the authorized autonomous Phase 03→11 run: **Phase 08 (Asset
Dashboard UI)** next — `phases/PHASE-08-asset-dashboard-ui.md`, the first
frontend phase, independent of 09 so either order is fine, but 08 has
been unblocked the longest.

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
| Requirements | `IMPLEMENTED` (partial) | REQ-001–005, REQ-018 `VERIFIED`; REQ-015 `IMPLEMENTED`; rest `NOT_STARTED` |
| Phase plan | `VERIFIED` | 11 phases in `ROADMAP.md`; work division in `TEAM-EXECUTION-PLAN.md` |
| Core backend APIs (equipment/checkouts/usage-logs) | `VERIFIED` | Phase 03 — 14/14 tests pass |
| Alerts engine | `VERIFIED` | Phase 04 — 16/16 tests pass |
| Anomaly detection | `VERIFIED` | Phase 05 — 17/17 tests pass, threshold reconfirmed in production code |
| Demand forecasting | `VERIFIED` | Phase 06 — 19/19 tests pass, both RISK-003 halves resolved |
| Recommendations & Action Queue | `VERIFIED` | Phase 07 — 23/23 tests pass |
| Product implementation | `IN_PROGRESS` | Phases 00-07 done (backend complete); Phases 08-11 not started (frontend + integration + demo remain) |

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

## What must not be changed without a documented reason

- The core stack choice (React/Express/PostgreSQL, no ORM).
- Rule-based analytics over a trained ML model — see `DECISIONS.md`.
- The schema's nullable `checkouts.site_id`/`checkouts.operator_id`.
- The 0.40 idle-ratio anomaly threshold — now validated against real data (`DECISIONS.md`); don't casually retune it without new evidence.
- The seeded data's deliberate edge cases (`EQX3001`–`EQX3005`, the `Grader`/`S001` sparse-history pair) — Phase 04/05/06/09 tests and demo depend on these existing exactly as seeded. Don't overwrite them by re-running seed against a wiped-then-different dataset without updating this state.
- `server/.env` — real local DB credentials, never commit it.
