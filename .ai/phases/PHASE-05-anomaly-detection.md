# Phase 05 — Anomaly detection

**Status:** `VERIFIED`
**Owner:** Eklavya (per `TEAM-EXECUTION-PLAN.md`) — implemented this session by AI agent, pending Eklavya's review once their GitHub invite is accepted (`RISK-002`)
**Started:** 2026-09-01 · **Closed:** 2026-09-01

## Objective

Detect excessive idle, zero runtime, missing assignment, and (should-have)
unusual movement — each with a plain-language stated reason.

## Why

REQ-007/REQ-008. One of the two highest-judging-weight modules (AI &
Analytics 15%, feeding Innovation 25% and Business Impact 25% via Phase
07's recommendations).

## Inputs

`RESEARCH.md` R-002 (industry thresholds, already calibrated against real
data in Phase 02 — `DECISIONS.md`'s "RISK-003 calibration result"). The
official sample data itself: `EQX1002`/`EQX1007` are Caterpillar's own
worked example of exactly the anomalies this phase must catch.

## Dependencies

Depended on Phase 02 (real seeded `usage_logs`) and Phase 03 (checkout
state). Independent of Phase 04 and Phase 06 — shares
`hasMissingAssignment` from `server/src/utils/checkoutRules.js` with
Phase 04 rather than duplicating it (per Phase 04 task 04.4).

## Rules (as implemented, verified against real seeded data)

| Anomaly | Rule | Verified against |
|---|---|---|
| `EXCESSIVE_IDLE` | `idle_ratio = SUM(idle_hours) / SUM(engine_hours + idle_hours)` across a checkout's `usage_logs`, exceeds 0.40 | `EQX1001` (0.87), `EQX1004` (0.82), `EQX1006` (0.67) flagged; `EQX1003` (0.0625), `EQX1005` (0.0) not flagged — the exact split `DECISIONS.md`'s calibration predicted |
| `ZERO_RUNTIME` | Any logged day with `engine_hours = 0` while checked out (`bool_or` over the checkout's logs — covers both a single bad day and the official summary rows where every day is zero) | `EQX1002`, `EQX1007` (all engine hours 0 across the board) |
| `MISSING_ASSIGNMENT` | `operator_id IS NULL` or `site_id IS NULL`, on **any** checkout regardless of active/returned — not status-gated, unlike Phase 04's `missing_info` | `EQX1002`, `EQX1007` (historical), `EQX3003` (active) |
| `UNUSUAL_MOVEMENT` (should-have) | A checkout has an assigned site, and at least one `usage_logs.location` doesn't contain that site's code (location is free text, e.g. `"Site S002 yard"` — matched by substring, not equality) | `EQX3004` (logged `"Site S002 yard"` against assigned site `S004`) |

## Outputs

`server/src/modules/anomalies/` — same sync-on-read pattern as Phase 04's
alerts (see `DECISIONS.md`): `GET /api/anomalies` recomputes signals from
live `checkouts`/`usage_logs` on every call and syncs them into the
`anomalies` table.

## Tasks

- [x] 05.1 — Idle ratios confirmed against all 7 official rows via direct SQL before writing the rule (see the table above) — threshold not recalibrated, already validated in Phase 02
- [x] 05.2 — Implemented `EXCESSIVE_IDLE`, `ZERO_RUNTIME`, `MISSING_ASSIGNMENT`
- [x] 05.3 — Implemented `UNUSUAL_MOVEMENT`
- [x] 05.4 — `GET /api/anomalies` with each item's stated reason
- [x] 05.5 — Tests against the known official examples

## Files / systems affected

`server/src/modules/anomalies/`, `server/src/utils/checkoutRules.js`
(shared, unchanged interface — `hasMissingAssignment` generalized to not
require `status === 'active'`, since Phase 05 must also catch it on
historical checkouts; Phase 04 is unaffected because its query already
pre-filters to active checkouts only), one line in
`server/src/routes/index.js`, `server/tests/anomalies.test.js`.

## Risks

A miscalibrated threshold either floods the queue or misses the obvious
cases. Mitigated: 05.1's real numbers (table above) show a clean split
with no boundary-ambiguous checkout, and 05.5's test asserts both
directions (flagged AND not-flagged) against the client's own worked
examples, not just the positive case.

## Acceptance criteria

- [x] `EQX1002` and `EQX1007` are flagged for both `ZERO_RUNTIME` and `MISSING_ASSIGNMENT`.
- [x] `EQX1003` and `EQX1005` are not flagged at all.
- [x] Every anomaly has a human-readable `reason` (verified in the test, not just assumed from the code).

## Tests

Actually run against the local `citadel` database:

1. `npm test` (server) — **17/17 pass** (16 from Phases 03-04 + 1 new,
   comprehensive anomalies test). Verified via the real API: `EQX1002`/
   `EQX1007` flagged `zero_runtime` + `missing_assignment` (and, correctly,
   `excessive_idle` too — 0 engine hours makes idle ratio 100% by
   definition, a true additional signal, not a bug); `EQX1003`/`EQX1005`
   flagged nothing; `EQX1001`/`EQX1004`/`EQX1006` flagged `excessive_idle`;
   `EQX3004` flagged `unusual_movement` with the expected reason string;
   `EQX3005` (healthy baseline) flagged nothing.
2. Direct SQL cross-check of the 7 official rows' aggregated engine/idle
   hours, run *before* writing the rule (not after, to avoid fitting the
   rule to a wrong assumption) — confirmed the exact idle ratios in the
   Rules table above.
3. Post-test database check: `equipment: 17, checkouts: 22, usage_logs:
   192`, `0` leftover test fixtures — seeded data unchanged. `anomalies`
   table holds exactly 17 open rows matching the full expected set
   (including the 5 volume-checkout equipment `EQX2001`-`EQX2005`, whose
   deliberately-mixed utilization profiles from Phase 02 mostly produce a
   flaggable idle ratio by design).
4. `npm run build` (client) — clean, unaffected.

## Exit criteria (phase gate)

- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass (17/17)
- [x] Build passes
- [x] Critical edge cases checked (threshold calibration verified against real seeded numbers before implementation, not assumed after)
- [x] Requirements mapped (REQ-007 → `VERIFIED`, REQ-008 → `VERIFIED`)
- [x] Known issues reviewed (none introduced)
- [x] Documentation updated (this file, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, `HANDOFF.md`)
- [x] Architecture still coherent (same sync-on-read pattern as Phase 04, same layering)
- [x] No blocking regression (Phase 00-04 tests/build all still pass; seeded data counts unchanged)
- [x] `STATE.md` updated
- [x] Checkpoint created (`checkpoint/phase-05-anomaly-detection`)
- [x] `git status` clean
