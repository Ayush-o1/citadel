# Phase 07 — Recommendations & Action Queue

**Status:** `VERIFIED`
**Owner:** Souharda (per `TEAM-EXECUTION-PLAN.md`) — implemented this session by AI agent, pending Souharda's review once their GitHub invite is accepted (`RISK-002`)
**Started:** 2026-09-01 · **Closed:** 2026-09-01

## Objective

Unify alerts, anomalies, and forecasts into one ranked feed of
`signal → reason → recommended action → expected impact` — the module the
differentiation strategy hinges on (`problem-statement/ANALYSIS.md` §12).

## Why

REQ-010, REQ-017. The literal answer to "the dashboard should not only
report, it should recommend." Every other analytics phase feeds this one.

## Inputs

Phase 04's alerts, Phase 05's anomalies, Phase 06's forecasts.

## Dependencies

Depended on Phases 04, 05, 06 all existing with real data — all three did.

## Signal → action mapping (as implemented)

| Source | Condition | Action | Expected impact (labeled simulated) |
|---|---|---|---|
| Alert `overdue` | always | `return` | Avoid further rental cost / free up equipment |
| Alert `upcoming_return` | — | *(no recommendation — informational only, per the original mapping table)* | — |
| Anomaly `excessive_idle` | always | `reassign` | Improve utilization toward the 65-75% healthy band |
| Anomaly `zero_runtime` | always | `investigate` | Recover unused rental cost |
| Anomaly `missing_assignment` | always | `investigate` | Restore who/what/where/when visibility |
| Anomaly `unusual_movement` | always | `investigate` | Confirm whether the asset is at an unexpected location |
| Forecast | `insufficient_history: false` and `trend === 'up'` | `extend` | Avoid a stockout via extension/pre-positioning |

Every `expected_impact` string starts with `"Simulated:"` (REQ-016 —
verified as a test assertion, not just a convention).

## Outputs

`server/src/modules/recommendations/` — `GET /api/recommendations`
(syncs fresh alerts/anomalies/forecasts, inserts a `pending` row for any
signal without one yet, returns all `pending` rows ranked
alert/anomaly-first then forecast-last, oldest-surfaced-first within each
tier) and `PATCH /api/recommendations/:id` (`{ status: 'actioned' |
'dismissed' }`, 409 if it's already been actioned/dismissed).

## Tasks

- [x] 07.1 — Mapping table implemented as one function per source type (`buildAlertCandidates`/`buildAnomalyCandidates`/`buildForecastCandidates`), not a giant if/else
- [x] 07.2 — Ranking: alert/anomaly tier before forecast tier, then oldest-first
- [x] 07.3 — `GET /api/recommendations`
- [x] 07.4 — `PATCH /api/recommendations/:id`
- [x] 07.5 — Tests: mapping shape, ranking, actioned/dismissed persistence and exclusion

## Files / systems affected

`server/src/modules/recommendations/`, one line in
`server/src/routes/index.js`, `server/tests/recommendations.test.js`.
Also touched Phase 06's `forecasts.repository.js` (delete-then-insert →
upsert, so a forecast's id is stable — see Phase 06's Addendum and
`DECISIONS.md`), and `server/package.json` (`test` script:
`--test-concurrency=1` — see `DECISIONS.md`'s "Phase 07..." entry for why).

## A deliberate architecture exception, documented

`recommendations.service.js` imports the other three modules' public
service functions directly — the one intentional exception to
`ARCHITECTURE.md`'s "no module imports another" rule, since
recommendations is the aggregation layer by design and this avoids
re-deriving any detection rule. Full reasoning in `DECISIONS.md`.

## Risks

Reading like a generic "list of problems" instead of worded
recommendations would undermine the differentiation strategy —
mitigated: every `reason`/`expected_impact` reuses the exact human-readable
strings Phase 04/05/06 already produce (not regenerated here), and a test
asserts every recommendation has all four required fields non-empty.

## Acceptance criteria

- [x] Every open alert (except informational `upcoming_return`)/anomaly/qualifying forecast produces exactly one recommendation, correctly ranked.
- [x] Marking a recommendation actioned/dismissed persists and is reflected on the next fetch (excluded from the active queue).
- [x] No expected-impact text reads as an unlabeled factual claim — every one is prefixed `"Simulated:"`.

## Tests

Actually run against the local `citadel` database:

1. `npm test` (server) — **23/23 pass** (19 from Phases 03-06 + 4 new).
   Verified via the real API: the seeded `EQX3001` overdue alert and
   `EQX1002`/`EQX1007` anomalies all surface as recommendations; the
   `Excavator`/`S003` upward forecast surfaces with `action: 'extend'`;
   every recommendation across the full 19-item real queue has a
   non-empty `signal`/`reason`/`action`/`expected_impact`, and every
   `expected_impact` starts with `"Simulated:"`; forecast-sourced items
   rank after every alert/anomaly item; re-syncing twice in a row produces
   the identical 19-item set (no duplicates — the insert-once rule holds).
2. A fixture-based mutation test (not touching seeded data): checked out
   a disposable equipment row overdue → its `return` recommendation
   appears → marked `actioned` → confirmed it disappears from the active
   queue → confirmed a second status change on the same id is rejected
   with 409.
3. Malformed-body (400) and nonexistent-id (404) PATCH cases.
4. **Found and fixed a real cross-file test-concurrency bug** (see
   `DECISIONS.md`) — `npm test` was intermittently failing 1-in-3 runs
   with a raw connection-level error, not a logic bug, caused by Node's
   test runner defaulting to concurrent test-file execution against one
   shared real database. Fixed via `--test-concurrency=1`; reran the full
   suite 3 consecutive times clean after the fix.
5. Post-test database check: `equipment: 17, checkouts: 22, usage_logs:
   192`, `0` leftover test fixtures (cleaned up 3 stale fixtures left over
   from the *pre-fix* flaky runs, confirming they were a test-isolation
   artifact, not seeded-data corruption). `recommendations` table holds
   exactly 19 rows matching the full expected signal set.
6. `npm run build` (client) — clean, unaffected.

## Exit criteria (phase gate)

- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass (23/23, reliably across repeated runs)
- [x] Build passes
- [x] Critical edge cases checked (dismissed/actioned items don't reappear; no source produces zero or duplicate recommendations; re-sync is idempotent)
- [x] Requirements mapped (REQ-010 → `VERIFIED`, REQ-017 → `VERIFIED`, REQ-016 → `VERIFIED`)
- [x] Known issues reviewed (test-concurrency bug found and fixed, not deferred)
- [x] Documentation updated (this file, Phase 06's addendum, `DECISIONS.md`, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, `HANDOFF.md`)
- [x] Architecture still coherent (one documented, justified exception to module isolation — see `DECISIONS.md`)
- [x] No blocking regression (Phase 00-06 tests/build all still pass; seeded data counts unchanged)
- [x] `STATE.md` updated
- [x] Checkpoint created (`checkpoint/phase-07-recommendations`)
- [x] `git status` clean
