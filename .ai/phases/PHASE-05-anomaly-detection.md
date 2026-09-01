# Phase 05 — Anomaly detection

**Status:** `NOT_STARTED`
**Owner:** unassigned — see `../PLAYBOOK.md` team table
**Started:** — · **Closed:** —

## Objective

Detect excessive idle, zero runtime, missing assignment, and (should-have)
unusual movement — each with a plain-language stated reason.

## Why

REQ-007/REQ-008. This is one of the two highest-judging-weight modules
(AI & Analytics 15%, feeding Innovation 25% and Business Impact 25% via
Phase 07's recommendations) — worth getting genuinely right, not rushed.

## Inputs

`RESEARCH.md` R-002 (industry thresholds). The official sample data
itself: `EQX1002` and `EQX1007` (both `Site ID = NULL`, `Last Operator ID
= NULL`, `0` Engine Hours/Day) are Caterpillar's own worked example of
exactly the anomalies this phase must catch — see `DECISIONS.md`'s
reconciliation entry.

## Dependencies

Depends on Phase 02 (needs real seeded/historical `usage_logs` to compute
against) and Phase 03 (checkout state). Independent of Phase 04 and
Phase 06 — can run in parallel with either once Phase 02/03 land, but see
Phase 04's task 04.4 re: shared `missing_assignment`/`missing_info` logic.

## Rules (from `RESEARCH.md` R-002 and the official sample)

| Anomaly | Rule | Reference |
|---|---|---|
| `EXCESSIVE_IDLE` | idle_ratio = idle_hours / (engine_hours + idle_hours) over the checkout's `usage_logs` exceeds 0.40 | Industry idle-threshold research (R-002); confirm calibration against the 7 official rows once real numbers are computed (05.1) |
| `ZERO_RUNTIME` | Any logged day (or the whole checkout, for the historical summary rows) with `engine_hours = 0` while checked out | Matches `EQX1002`/`EQX1007` exactly |
| `MISSING_ASSIGNMENT` | Active or historical checkout with `operator_id IS NULL` or `site_id IS NULL` | Matches `EQX1002`/`EQX1007` exactly; shares its rule function with Phase 04's `missing_info` alert (see Phase 04 task 04.4) |
| `UNUSUAL_MOVEMENT` (should-have) | `usage_logs.location` for a checkout doesn't match its assigned `site_id` | Lower priority — needs richer location data than the official sample provides |

## Outputs

`server/src/modules/anomalies/` — a service computing the above against
real data, storing/returning each with its `reason` as a human-readable
sentence (e.g., "Idle 87% of logged hours over 15 operating days"), not
just a type code.

## Tasks

- [ ] 05.1 — Compute idle ratios for all 7 official equipment rows once seeded (Phase 02); confirm the 0.40 threshold produces a sensible split (not flagging everything or nothing) — adjust and document in `DECISIONS.md` if it doesn't
- [ ] 05.2 — Implement `EXCESSIVE_IDLE`, `ZERO_RUNTIME`, `MISSING_ASSIGNMENT` rules
- [ ] 05.3 — Implement `UNUSUAL_MOVEMENT` (should-have — only after 05.2 is solid)
- [ ] 05.4 — `GET /api/anomalies` with each item's stated reason
- [ ] 05.5 — Tests against the known official examples (`EQX1002`, `EQX1007` must be flagged; `EQX1003`/`EQX1005`, the best-utilized rows, must not be)

## Files / systems affected

`server/src/modules/anomalies/`, one line in `server/src/routes/index.js`.

## Risks

A threshold that's miscalibrated against real seeded data either floods
the Action Queue (everything flagged, useless) or misses the obvious cases
(nothing flagged, looks broken). Mitigation: 05.1 explicitly checks this
against real numbers before committing to the rule, and 05.5 tests against
the two examples the client itself provided as the expected positive case.

## Acceptance criteria

- `EQX1002` and `EQX1007` (or their seeded equivalents) are flagged for both `ZERO_RUNTIME` and `MISSING_ASSIGNMENT`.
- The best-utilized official rows (`EQX1003`, `EQX1005`) are not flagged.
- Every anomaly has a human-readable `reason`, not just a type code.

## Tests

Not yet run. Expected: `server/tests/anomalies.test.js` asserting the acceptance criteria above against seeded data.

## Exit criteria (phase gate)

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build passes
- [ ] Critical edge cases checked (threshold calibration verified against real seeded numbers, not assumed)
- [ ] Requirements mapped (REQ-007 → `VERIFIED`, REQ-008 → `VERIFIED` or `DEFERRED`)
- [ ] Known issues reviewed
- [ ] Documentation updated
- [ ] Architecture still coherent
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created
- [ ] `git status` clean
