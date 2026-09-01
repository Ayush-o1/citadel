# Phase 06 — Demand forecasting

**Status:** `VERIFIED`
**Owner:** Eklavya (per `TEAM-EXECUTION-PLAN.md`) — implemented this session by AI agent, pending Eklavya's review once their GitHub invite is accepted (`RISK-002`)
**Started:** 2026-09-01 · **Closed:** 2026-09-01

## Objective

Predict equipment demand by type, site, and time, answering "what
equipment is likely to be needed, where, and when" with stated factors —
not just rendering a chart.

## Why

REQ-009. The single riskiest phase (`problem-statement/ANALYSIS.md` §24)
— has to stay honest and explainable on genuinely small data.

## Inputs

`RESEARCH.md` R-001 (method choice). Phase 02's checkout history, grouped
by equipment type + site over a 28-day trailing window.

## Dependencies

Depended on Phase 02 (trailing history volume) and Phase 03 (checkouts
API/schema). Independent of Phases 04/05.

## Method (as decided against real data — see `DECISIONS.md`)

Trailing-window **plain average**, not exponential smoothing: for a given
`(equipment_type, site)`, count checkouts in the last 28 days; if the
count is ≥ 3, `predicted_demand = count / 4` (checkouts/week), with a
`factors` string stating the sample size, the rate, and a trend direction
(recent 14 days vs. previous 14 days). Below 3 checkouts:
`insufficient_history: true` with the real count — never a fabricated
number (REQ-019). Zero checkouts in the window: not reported at all (no
signal to report).

## Outputs

`server/src/modules/forecasts/` — `GET /api/forecasts`, upserting one row
per `(equipment_type, site)` into the `forecasts` table for every group
that clears the threshold (insufficient-history entries are computed and
returned live, not persisted — the table has no field to represent that
state).

## Tasks

- [x] 06.1 — Moving-average vs. exponential smoothing decided against real seeded data — plain average chosen; see `DECISIONS.md`
- [x] 06.2 — Minimum trailing-period threshold defined: ≥ 3 checkouts in a 28-day window (REQ-019)
- [x] 06.3 — Forecast computation + `factors` string implemented
- [x] 06.4 — `GET /api/forecasts` endpoint
- [x] 06.5 — Tests: a well-supported pair produces a number + factors; an under-supported one returns `insufficient_history`, not a number

## Files / systems affected

`server/src/modules/forecasts/`, one line in `server/src/routes/index.js`,
`server/tests/forecasts.test.js`.

## Risks

Overclaiming precision on small-sample data. Mitigated: `factors` is
mandatory on every real forecast (sample count + rate + trend, not a bare
number), and the insufficient-history path is a tested, real code path
(verified to actually trigger for `Grader`/`S001`), not just a fallback
that exists in theory.

## A real bug caught before it shipped

Initial design judged sufficiency by counting distinct 7-day buckets with
activity, not raw checkout count. Manually walking the real seeded dates
found this fragile at this sample size: a checkout landing hours on
either side of an exact 7-day boundary flips which bucket it falls into —
this nearly misclassified the deliberately-sparse `Grader`/`S001` pair as
"sufficient" purely from boundary luck. Switched to a fixed 28-day window
with a raw checkout-count threshold (≥ 3), which has no such boundary
sensitivity. See `DECISIONS.md` for the full reasoning.

## Acceptance criteria

- [x] At least one equipment-type/site pair produces a real forecast with stated factors — `Excavator`/`S003` (5 checkouts, trending up, ~1.25/week) and `Bulldozer`/`S002` (4 checkouts, flat, ~1/week).
- [x] At least one produces "insufficient history" rather than a fabricated number — `Grader`/`S001` (2 checkouts, Phase 02's deliberately sparse pair, exactly as designed).

## Tests

Actually run against the local `citadel` database:

1. `npm test` (server) — **19/19 pass** (17 from Phases 03-05 + 2 new).
   `GET /api/forecasts` returns real forecasts for `Excavator`/`S003` and
   `Bulldozer`/`S002` (non-zero `predicted_demand`, non-empty `factors`
   and `method`) and `insufficient_history: true` (no `predicted_demand`
   field at all) for `Grader`/`S001`. A second test confirms a real
   forecast's `period_start`/`period_end` are well-formed ISO dates with
   `period_end > period_start`.
2. Manual verification via `curl` against a running server, before
   writing the rigid test assertions: confirmed the full 5-group output
   (2 real forecasts, 3 insufficient-history) matched a by-hand SQL
   analysis of the actual seeded `checked_out_at` dates, run *before*
   implementing the rule.
3. Caught and fixed a real serialization bug: `forecast.period_start`
   read back from Postgres's `DATE` column round-tripped through node-pg
   as a JS `Date` at local midnight, which serialized a day off in this
   environment's timezone. Fixed by returning the already-correct
   date-only strings computed before the insert, not the round-tripped
   DB values — verified via `psql` showing the correct stored dates
   (`2026-09-01`/`2026-09-07`) against the API's now-matching response.
4. Post-test database check: `equipment: 17, checkouts: 22, usage_logs:
   192`, `0` leftover test fixtures — unchanged. `forecasts` table holds
   exactly 2 rows (one per qualifying group), matching the "one row per
   group, replaced not accumulated" design.
5. `npm run build` (client) — clean, unaffected.

## Exit criteria (phase gate)

- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass (19/19)
- [x] Build passes
- [x] Critical edge cases checked (insufficient-history fallback verified to actually trigger for a real group, not just coded; a near-miss boundary bug caught and fixed before shipping)
- [x] Requirements mapped (REQ-009 → `VERIFIED`, REQ-019 → `VERIFIED`)
- [x] Known issues reviewed (none introduced)
- [x] Documentation updated (this file, `DECISIONS.md`, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, `HANDOFF.md`)
- [x] Architecture still coherent (same layering; forecasts table treated as a replace-on-recompute cache, documented as a deliberate deviation from alerts/anomalies' sync-with-resolve pattern since forecasts has no status column)
- [x] No blocking regression (Phase 00-05 tests/build all still pass; seeded data counts unchanged)
- [x] `STATE.md` updated
- [x] Checkpoint created (`checkpoint/phase-06-forecasting`)
- [x] `git status` clean
