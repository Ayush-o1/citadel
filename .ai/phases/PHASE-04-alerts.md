# Phase 04 — Alerts engine

**Status:** `NOT_STARTED`
**Owner:** unassigned — see `../PLAYBOOK.md` team table
**Started:** — · **Closed:** —

## Objective

Detect and surface the three required alert types: upcoming return,
overdue, and missing info.

## Why

REQ-006. This is the simplest analytics module (date/field comparisons,
no statistics) — a good first analytics phase to establish the pattern
that Phases 05-07 follow.

## Inputs

Phase 01 schema (`alerts` table), Phase 03's `checkouts` data.

## Outputs

`server/src/modules/alerts/` — a service that computes current alerts
(on read, or via a periodic recompute — see Tasks) and an API to list
them.

## Dependencies

Depends on Phase 03 (`checkouts` must exist and be populated — via Phase
02's seed data containing an overdue and an upcoming-return example, per
Phase 02's Outputs). Independent of Phases 05/06 — can run in parallel
with them once Phase 03 lands.

## Tasks

- [ ] 04.1 — Decide compute strategy: computed on-demand from `checkouts` (simplest, no staleness) vs. a stored/recomputed `alerts` table row per detected condition. Recommendation: compute on-demand for `upcoming_return`/`overdue` (pure date comparison, cheap); persist to the `alerts` table only when it needs a `status` (resolved/dismissed) a user can change.
- [ ] 04.2 — `upcoming_return`: `expected_return_at` within a configurable window (default 24-48h) and not yet checked in
- [ ] 04.3 — `overdue`: `expected_return_at` in the past and not yet checked in
- [ ] 04.4 — `missing_info`: active checkout with no `operator_id` or no `site_id` — **note:** this overlaps with Phase 05's `missing_assignment` anomaly; decide the one place this rule lives (recommend: this counts as `missing_info` here at the alert level, `missing_assignment` in Phase 05 is the same underlying condition surfaced as an anomaly for the Action Queue — document as one shared rule function called from both, not duplicated logic)
- [ ] 04.5 — `GET /api/alerts` endpoint

## Files / systems affected

`server/src/modules/alerts/`, one line in `server/src/routes/index.js`.

## Risks

Duplicated logic between this phase's `missing_info` and Phase 05's
`missing_assignment` if not deliberately shared (04.4). Mitigation: write
the shared rule once, referenced from both.

## Acceptance criteria

- The seeded overdue and upcoming-return assets (Phase 02) both appear correctly.
- No alert for a checkout that's already checked in.

## Tests

Not yet run. Expected: `server/tests/alerts.test.js` against seeded data.

## Exit criteria (phase gate)

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build passes
- [ ] Critical edge cases checked (checked-in checkout produces no alert)
- [ ] Requirements mapped (REQ-006 → `VERIFIED`)
- [ ] Known issues reviewed
- [ ] Documentation updated
- [ ] Architecture still coherent
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created
- [ ] `git status` clean
