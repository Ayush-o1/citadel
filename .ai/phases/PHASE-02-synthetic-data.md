# Phase 02 — Synthetic operational data

**Status:** `VERIFIED`
**Owner:** Ayush + AI agent
**Started:** 2026-09-01 · **Closed:** 2026-09-01

## Objective

Generate realistic, related synthetic data (sites, operators, equipment,
checkout history, usage logs) so every later phase has real signals to
compute against — alerts, anomalies, and forecasts are meaningless
against empty or random tables.

## Why

The problem statement explicitly permits simulated telemetry/history but
warns against "random fake numbers" — relationships must be believable
(problem statement, "DATA" section; `problem-statement/ANALYSIS.md` §16).
Forecasting (Phase 06) specifically needs enough trailing history per
equipment type/site to produce a real trailing-window result, not just
enough rows to not crash.

## Inputs

Phase 01's schema. The official sample dataset shape (7 example equipment
IDs `EQX1001`–`EQX1007`, fields: equipment ID, type, site, engine
hours/day, idle hours/day, operator) as a starting shape to extend, not
copy verbatim.

## Outputs

`server/db/seed.js`, populating three layers:

1. **The official sample, reproduced exactly** — the 7 equipment IDs
   `EQX1001`–`EQX1007` from `../../PROBLEM-STATEMENT.md` Source A, each
   as a completed historical checkout, with daily `usage_logs` generated
   to average out to that row's exact `Engine Hours/Day` / `Idle
   Hours/Day` over its `Operating Days`. `EQX1002`/`EQX1007` keep their
   `NULL` site and operator, matching the handout exactly.
2. **Trailing weekly history** — 5 additional equipment
   (`EQX2001`–`EQX2005`) building up rich history for `Excavator`/`S003`
   (5 total checkouts) and `Bulldozer`/`S002` (4 total), while leaving
   `Grader`/`S001` deliberately sparse (2 total) for Phase 06's
   insufficient-history fallback to exercise.
3. **Live active checkouts** — 5 more equipment (`EQX3001`–`EQX3005`)
   covering, one each and cleanly isolated (no confounding idle-anomaly
   noise): overdue, upcoming-return, missing-assignment (on an *active*
   checkout, not just historically), unusual-movement, and a healthy
   baseline.

## Dependencies

Depended on Phase 01 (schema). Independent of Phase 03's code — seed
data is inserted directly via `pg`, not through the API.

## Tasks

- [x] 02.1 — Seed the 7 official equipment IDs as historical checkouts, generating daily `usage_logs` that average to the handout's exact figures
- [x] 02.2 — Design and seed the additional synthetic layer (more sites/operators/equipment, trailing weekly history per type/site)
- [x] 02.3 — Write the generator with deterministic seeding (no `Math.random()` anywhere — every value is formula/lookup-driven, so reruns against a fresh DB always produce identical data)
- [x] 02.4 — Deliberately seed the live-demo edge cases: overdue, upcoming-return, missing-assignment (active), unusual-movement, healthy baseline
- [x] 02.5 — Verify row counts and spot-check relationships in psql; confirmed the 7 official rows' computed daily averages match the handout exactly

## Files / systems affected

`server/db/seed.js` (full rewrite, replacing the Phase 01 stub). No schema changes.

## Assumptions (documented, not silent — see `DECISIONS.md` for full reasoning)

- Six of the seven official rows' stated `Operating Days` matches
  `(check-in − check-out)` exactly; `EQX1003` instead matches
  `(check-in − check-out + 1)`. Treated `Operating Days` as authoritative
  for the number of `usage_logs` rows generated, without altering any
  stated date or count to reconcile the inconsistency.
- `condition_out`/`condition_in` default to `'Good'` for synthetic rows
  only (never fabricated for the 7 official rows, which have no condition
  data in the handout and are left `NULL`).
- The 3 volume-checkout utilization profiles (`well-utilized`,
  `moderate`, `poor-utilization`) were deliberately chosen so most
  produce a flaggable anomaly — a fleet that's uniformly healthy makes for
  a boring, undemonstrable Action Queue (see Risks below and the original
  Phase 02 risk note).

## Risks

Data that's too clean produces a boring demo (nothing to flag); data
that's too random isn't believable. Mitigated by hand-designed profiles
and edge cases rather than randomness — see Tests below for the resulting
signal distribution actually achieved.

## Acceptance criteria

- [x] Re-running the seed script is safe — confirmed: second run prints "equipment table already has data, skipping seed." and makes no changes.
- [x] At least one real instance of each anomaly type exists: `excessive_idle` (e.g. `EQX1001`, ratio 0.87), `zero_runtime` (`EQX1002`/`EQX1007`), `missing_assignment` (`EQX1002`/`EQX1007` historical, `EQX3003` active), `unusual_movement` (`EQX3004`, logged location ≠ assigned site).
- [x] At least one real instance of each alert type: `overdue` (`EQX3001`), `upcoming_return` (`EQX3002`), `missing_info` (`EQX3003`).
- [x] At least one equipment-type/site pair has enough history for Phase 06's forecast to run (`Excavator`/`S003`: 5 checkouts; `Bulldozer`/`S002`: 4), and at least one has deliberately insufficient history for the fallback (`Grader`/`S001`: 2).

## Tests

Actually run against the local `citadel` database:

1. `npm run seed` — seeded `sites: 6, operators: 13, equipment: 17, checkouts: 22, usage_logs: 192`.
2. `npm run seed` (again) — "equipment table already has data, skipping seed." (idempotency confirmed).
3. Queried all 7 official rows joined against their `usage_logs` averages — **exact match** against the handout for site code, operator code, checkout/check-in dates, average engine/idle hours, and log-day count, including `EQX1002`/`EQX1007`'s `NULL` site/operator.
4. Computed idle_ratio for all 17 historical checkout-rows for RISK-003 calibration: 10 exceed the 0.40 threshold, 7 sit clearly below (0.0–0.2), no boundary-ambiguous cases — see `DECISIONS.md`'s "RISK-003 calibration result" entry (threshold confirmed, not changed).
5. Queried the 5 active checkouts — confirmed `EQX3001` overdue, `EQX3002` upcoming-return (within 48h), `EQX3003` has `NULL` site and operator, `EQX3004`'s logged `location` mismatches its assigned site for 2 of 3 days, `EQX3005`'s idle ratio (0.146) is well below threshold (clean baseline).
6. Queried historical-checkout counts grouped by equipment type + site — confirmed `Excavator`/`S003` (5) and `Bulldozer`/`S002` (4) are rich, `Grader`/`S001` (2) is sparse, as designed.
7. `npm test` (server) — 2/2 pass, unaffected.
8. `npm run build` (client) — clean build, unaffected.

## Exit criteria (phase gate)

- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Build passes
- [x] Critical edge cases checked (all 5 deliberately-seeded active-checkout cases confirmed isolated and correct)
- [x] Requirements mapped (REQ-015 → `IMPLEMENTED` in `REQUIREMENTS.md`)
- [x] Known issues reviewed (`RISK-003` partially resolved — anomaly-threshold half; `ISSUES.md` updated)
- [x] Documentation updated (this file, `DECISIONS.md`, `ISSUES.md`, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, `HANDOFF.md`)
- [x] Architecture still coherent (no schema changes; seed script follows existing `pg`-direct, no-ORM convention)
- [x] No blocking regression (server tests + client build both verified)
- [x] `STATE.md` updated
- [x] Checkpoint created (`checkpoint/phase-02-synthetic-data`)
- [x] `git status` clean
