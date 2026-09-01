# Phase 03 — Core backend APIs

**Status:** `NOT_STARTED`
**Owner:** unassigned — see `../PLAYBOOK.md` team table
**Started:** — · **Closed:** —

## Objective

Build the operational backbone: equipment inventory, check-out, check-in,
and usage logging — the CRUD layer everything else (alerts, anomalies,
forecasts, recommendations, both UI screens) reads from or writes to.

## Why

This is the literal "CHECK OUT → ASSIGN & TRACK → LOG USAGE → CHECK IN"
journey from the problem statement. Nothing else can be demoed without it.

## Inputs

Phase 01's schema. `REQUIREMENTS.md` REQ-001–005, REQ-018.

## Outputs

Three new backend modules under `server/src/modules/`, each following the
existing `items/` pattern (routes → controller → service → repository):

- `equipment/` — list/get equipment with live status, site, location, return date (REQ-001)
- `checkouts/` — check-out (POST), check-in (PATCH), list active/history (REQ-002, REQ-003, REQ-018)
- `usage-logs/` — record a usage entry against an active checkout (REQ-004)

## Dependencies

Depends on Phase 01 (schema). Can run in parallel with Phase 02 (seed
data) once Phase 01 lands — different files, no conflict. Phases 04-07
depend on this phase's tables having real data (via Phase 02) and its
`checkouts`/`usage_logs` writes being correct.

## Tasks

- [ ] 03.1 — `equipment` module: `GET /api/equipment`, `GET /api/equipment/:id` (with computed live status)
- [ ] 03.2 — `checkouts` module: `POST /api/checkouts` (check-out; reject if equipment already `checked_out` — REQ-018), `PATCH /api/checkouts/:id/check-in` (REQ-003)
- [ ] 03.3 — `usage-logs` module: `POST /api/usage-logs` (against an active checkout only)
- [ ] 03.4 — Validation schemas (Zod, matching existing `items.schema.js` pattern) for all three
- [ ] 03.5 — Tests: duplicate check-out rejected, check-in on already-returned checkout rejected, usage log against inactive checkout rejected

## Files / systems affected

`server/src/modules/equipment/`, `server/src/modules/checkouts/`,
`server/src/modules/usage-logs/`, one line each added to
`server/src/routes/index.js`.

## Risks

Getting checkout/check-in state transitions wrong corrupts every
downstream signal (an asset stuck "checked_out" forever would falsely
trigger every anomaly type). Mitigation: the duplicate-checkout and
double-check-in edge cases are explicit test cases, not an afterthought.

## Acceptance criteria

- Cannot check out an already-checked-out asset (409 or 400, not silent overwrite).
- Checking in updates both the `checkouts` row and the `equipment.status` consistently.
- A usage log requires an active checkout.

## Tests

Not yet run. Expected: `server/tests/checkouts.test.js`, `equipment.test.js`, `usage-logs.test.js` covering the edge cases above via supertest, following the existing `health.test.js` pattern.

## Exit criteria (phase gate)

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build passes
- [ ] Critical edge cases checked (duplicate checkout, double check-in, orphan usage log)
- [ ] Requirements mapped (REQ-001–004, REQ-018 → `VERIFIED`)
- [ ] Known issues reviewed
- [ ] Documentation updated
- [ ] Architecture still coherent
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created
- [ ] `git status` clean
