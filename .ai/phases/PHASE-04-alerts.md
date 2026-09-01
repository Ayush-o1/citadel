# Phase 04 — Alerts engine

**Status:** `VERIFIED`
**Owner:** Eklavya (per `TEAM-EXECUTION-PLAN.md`) — implemented this session by AI agent, pending Eklavya's review once their GitHub invite is accepted (`RISK-002`)
**Started:** 2026-09-01 · **Closed:** 2026-09-01

## Objective

Detect and surface the three required alert types: upcoming return,
overdue, and missing info.

## Why

REQ-006. The simplest analytics module (date/field comparisons, no
statistics) — establishes the pattern Phases 05-06 follow.

## Inputs

Phase 01 schema (`alerts` table), Phase 03's `checkouts` data, Phase 02's
seeded overdue/upcoming-return/missing-info examples.

## Outputs

`server/src/modules/alerts/` — a service that recomputes current alerts
from live `checkouts` data on every read and syncs the result into the
`alerts` table (see `DECISIONS.md`'s "Phase 04: alerts synced on read"
entry for why this, not pure in-memory or a background job), plus
`GET /api/alerts`. Shared detection logic
(`isOverdue`/`isUpcomingReturn`/`hasMissingAssignment`) lives in
`server/src/utils/checkoutRules.js` so Phase 05's `missing_assignment`
anomaly reuses the exact same `hasMissingAssignment` rule as this phase's
`missing_info` alert — one rule, not two copies (task 04.4).

## Dependencies

Depended on Phase 03 (checkouts) and Phase 02 (seeded overdue/upcoming/
missing examples to verify against). Independent of Phases 05/06.

## Tasks

- [x] 04.1 — Compute strategy decided: recompute on every read, sync into `alerts` table (insert new, resolve stale) — see `DECISIONS.md`
- [x] 04.2 — `upcoming_return`: `expected_return_at` within 48h and not yet checked in
- [x] 04.3 — `overdue`: `expected_return_at` in the past and not yet checked in
- [x] 04.4 — `missing_info`: shared `hasMissingAssignment` rule in `server/src/utils/checkoutRules.js`, used by both this phase and Phase 05
- [x] 04.5 — `GET /api/alerts` endpoint

## Files / systems affected

`server/src/modules/alerts/`, `server/src/utils/checkoutRules.js` (new,
shared with Phase 05), one line in `server/src/routes/index.js`,
`server/tests/alerts.test.js`.

## Risks

Duplicated logic between this phase's `missing_info` and Phase 05's
`missing_assignment` — mitigated exactly as planned: one shared
`hasMissingAssignment` function in `utils/checkoutRules.js`, imported by
both, not reimplemented.

## Acceptance criteria

- [x] The seeded overdue (`EQX3001`) and upcoming-return (`EQX3002`) assets both appear correctly.
- [x] No alert for a checkout that's already checked in — verified with a fixture: an alert appears while its checkout is active, then disappears (resolved) immediately after check-in.

## Tests

Actually run against the local `citadel` database:

1. `npm test` (server) — **16/16 pass** (2 new alert tests + the 14 from
   Phase 03, all still green). `GET /api/alerts` correctly surfaces the
   seeded `EQX3001` (`overdue`, `high` severity), `EQX3002`
   (`upcoming_return`), and `EQX3003` (`missing_info`) — one alert of each
   type, matching Phase 02's documented seed design exactly (verified via
   direct SQL: `type | status | count` → `missing_info|open|1`,
   `overdue|open|1`, `upcoming_return|open|1`, no extras).
2. A fixture-based test: check out a disposable equipment row with an
   `expected_return_at` 3 hours in the past → `GET /api/alerts` shows it
   `overdue` → check it in → `GET /api/alerts` again shows **no** alert
   for that equipment (the sync's resolve path actually fires, not just
   exists in code).
3. Post-test database check: `equipment: 17, checkouts: 22, usage_logs:
   192` — Phase 02's exact seeded counts, unchanged. `alerts` table has
   exactly 3 open rows (one per seeded case), zero leftover `TEST-EQX-`
   fixture rows or their alerts.
4. `npm run build` (client) — clean, unaffected.

## Exit criteria (phase gate)

- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass (16/16)
- [x] Build passes
- [x] Critical edge cases checked (checked-in checkout produces no alert; a previously-open alert actually resolves, not just stops being computed)
- [x] Requirements mapped (REQ-006 → `VERIFIED`)
- [x] Known issues reviewed (none introduced)
- [x] Documentation updated (this file, `DECISIONS.md`, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, `HANDOFF.md`)
- [x] Architecture still coherent (alerts persisted, matching `ARCHITECTURE.md`'s stated one-way analytics dependency — see `DECISIONS.md`)
- [x] No blocking regression (Phase 00-03 tests/build all still pass; seeded data counts unchanged)
- [x] `STATE.md` updated
- [x] Checkpoint created (`checkpoint/phase-04-alerts`)
- [x] `git status` clean
