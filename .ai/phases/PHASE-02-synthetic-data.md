# Phase 02 — Synthetic operational data

**Status:** `NOT_STARTED`
**Owner:** unassigned — see `../PLAYBOOK.md` team table
**Started:** — · **Closed:** —

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

`server/db/seed.js` extended (or a new `server/db/seed-rental.js`) that
populates, in two layers:

1. **The official sample, reproduced exactly** — the 7 equipment IDs
   `EQX1001`–`EQX1007` from `../../PROBLEM-STATEMENT.md` Source A, each
   as a completed historical checkout, with daily `usage_logs` generated
   to average out to that row's exact `Engine Hours/Day` / `Idle
   Hours/Day` over its `Operating Days` (see `DECISIONS.md`'s
   reconciliation entry). `EQX1002`/`EQX1007` keep their `NULL` site and
   operator, matching the handout.
2. **Additional synthetic volume** — more sites/operators/equipment and
   checkouts on top, including a few currently-**active** checkouts (with
   `expected_return_at` set) covering: one overdue, one upcoming-return,
   and enough trailing weekly history per equipment-type/site pair for
   Phase 06 to have 3-4 periods to average over.

## Dependencies

Depends on Phase 01 (schema must exist). Independent of Phases 03-07's
code — seed data is inserted directly, not through the API — so this can
run in parallel with Phase 03 once Phase 01 lands.

## Tasks

- [ ] 02.1 — Seed the 7 official equipment IDs as historical checkouts, generating daily `usage_logs` that average to the handout's exact figures
- [ ] 02.2 — Design and seed the additional synthetic layer (more sites/operators/equipment, trailing weekly history per type/site)
- [ ] 02.3 — Write the generator with deterministic seeding (same output every run, for demo reproducibility)
- [ ] 02.4 — Deliberately seed the live-demo edge cases: one active overdue checkout, one active upcoming-return checkout
- [ ] 02.5 — Verify row counts and spot-check relationships in psql; confirm the 7 official rows' computed daily averages match the handout

## Files / systems affected

`server/db/seed.js` (or new seed file), no schema changes.

## Risks

Data that's too clean produces a boring demo (nothing to flag); data
that's too random isn't believable and can't be explained if a judge asks
"why does this asset look like this." Mitigation: hand-design the edge
cases explicitly (02.3) rather than relying on randomness to produce them.

## Acceptance criteria

- Re-running the seed script is safe (matches the existing `items` seed's skip-if-populated pattern, or a documented reset step).
- At least one real instance of each anomaly type (Phase 05) and each alert type (Phase 04) exists in the seeded data.
- At least one equipment type/site pair has enough history for Phase 06's forecast to run.

## Tests

Not yet run. Expected: run seed, query row counts per table, manually verify the deliberate edge cases exist.

## Exit criteria (phase gate)

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build passes
- [ ] Critical edge cases checked (the deliberately-seeded ones, present and correct)
- [ ] Requirements mapped (REQ-015 → `IMPLEMENTED`)
- [ ] Known issues reviewed
- [ ] Documentation updated
- [ ] Architecture still coherent
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created
- [ ] `git status` clean
