# Phase 03 — Core backend APIs

**Status:** `VERIFIED`
**Owner:** Astik (per `TEAM-EXECUTION-PLAN.md`) — implemented this session by AI agent, pending Astik's review once their GitHub invite is accepted (`RISK-002`)
**Started:** 2026-09-01 · **Closed:** 2026-09-01

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
existing routes → controller → service → repository layering
(`ARCHITECTURE.md`):

- `equipment/` — `GET /api/equipment`, `GET /api/equipment/:id`, both with
  a computed `status` (`available`/`checked_out`/`overdue`/`maintenance`)
  derived at read time from the active checkout's `expected_return_at`,
  not stored (REQ-001).
- `checkouts/` — `POST /api/checkouts` (check-out; 409 if equipment
  already has an active checkout — REQ-018), `PATCH
  /api/checkouts/:id/check-in` (REQ-003), `GET /api/checkouts[?status=]`
  (REQ-002).
- `usage-logs/` — `POST /api/usage-logs` (only against an active
  checkout — REQ-004), `GET /api/usage-logs/checkout/:checkoutId`.

Plus two small shared additions: `withTransaction()` in
`server/src/config/db.js` (checkout create/check-in each touch both
`checkouts` and `equipment` atomically) and
`server/src/middleware/validateUuidParam.js` (turns a malformed `:id` into
a clean 400 instead of a Postgres `22P02` surfacing as a 500).

## Dependencies

Depended on Phase 01 (schema). Ran after Phase 02 in this session, but the
code has no dependency on Phase 02's seed data beyond using it for
verification.

## Tasks

- [x] 03.1 — `equipment` module: `GET /api/equipment`, `GET /api/equipment/:id` (with computed live status)
- [x] 03.2 — `checkouts` module: `POST /api/checkouts` (reject duplicate — REQ-018), `PATCH /api/checkouts/:id/check-in` (REQ-003)
- [x] 03.3 — `usage-logs` module: `POST /api/usage-logs` (active checkout only)
- [x] 03.4 — Validation schemas (Zod) for all three
- [x] 03.5 — Tests: duplicate check-out rejected, check-in on already-returned checkout rejected, usage log against inactive checkout rejected

## Files / systems affected

`server/src/modules/equipment/`, `server/src/modules/checkouts/`,
`server/src/modules/usage-logs/`, `server/src/middleware/validateUuidParam.js`
(new), `server/src/config/db.js` (added `withTransaction`),
`server/src/routes/index.js` (3 lines added), `server/tests/equipment.test.js`,
`server/tests/checkouts.test.js`, `server/tests/usage-logs.test.js`,
`server/tests/helpers/fixtures.js` (new — creates/deletes disposable test
equipment rather than mutating Phase 02's seeded rows).

## Risks

Getting checkout/check-in state transitions wrong corrupts every
downstream signal (an asset stuck "checked_out" forever would falsely
trigger every anomaly type). Mitigated two ways: (1) the duplicate-checkout
and double-check-in edge cases are explicit test cases; (2) the
duplicate-checkout guard is enforced at the database level via the
existing partial unique index `idx_checkouts_one_active_per_equipment` —
the service's own pre-check is a fast-path for a friendly error message,
but a Postgres `23505` from a race is still caught and mapped to the same
409, so the guarantee doesn't rely on application logic alone.

## Acceptance criteria

- [x] Cannot check out an already-checked-out asset (409, not silent overwrite).
- [x] Checking in updates both the `checkouts` row and `equipment.status` consistently (verified via `GET /api/equipment/:id` before/during/after in the test).
- [x] A usage log requires an active checkout (404 if the checkout doesn't exist, 409 if it's already returned).

## Tests

Actually run against the local `citadel` database (17 equipment / 22
checkouts / 192 usage_logs seeded by Phase 02, confirmed unchanged after
this phase's tests — see below):

1. `npm test` (server) — **14/14 pass**, covering: `GET /api/equipment`
   correctly derives `overdue` for the seeded `EQX3001` and
   `missing_assignment`-shaped data for `EQX3003` (`null` operator/site on
   an *active* checkout, not just historical); `GET /api/equipment/:id`
   404 (well-formed but nonexistent id) and 400 (malformed id); a full
   check-out → duplicate-reject (409) → check-in → double-check-in-reject
   (409) cycle against a disposable fixture equipment row; check-out
   against a nonexistent `equipment_id` (404) and a malformed body (400);
   `GET /api/checkouts?status=active` returns the 5 seeded active
   checkouts; a usage log against an active checkout (201), a duplicate
   same-day log (409, unique constraint), a log after check-in (409), a
   log against a nonexistent checkout (404), and a malformed body (400).
2. Manual verification against the running server (`node src/server.js`):
   `GET /api/health` → `database: connected`; `GET /api/equipment` → 17
   items; a live duplicate-checkout attempt against the real seeded
   `EQX3001` (already active) → clean 409 JSON, not a stack trace; a
   deliberately invalid usage-log payload (negative hours, non-ISO date)
   → 400 with per-field Zod messages, not a generic 500.
3. Post-test database check: `SELECT count(*) FROM equipment WHERE
   equipment_code LIKE 'TEST-%'` → `0` (all test fixtures cleaned up), and
   `equipment: 17, checkouts: 22, usage_logs: 192` — **exactly** Phase 02's
   documented counts, confirming the test suite never touched the seeded
   edge-case data.
4. `npm run build` (client) — clean, unaffected (no frontend changes this phase).

## Exit criteria (phase gate)

- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass (14/14)
- [x] Build passes (client)
- [x] Critical edge cases checked (duplicate checkout incl. DB-level race guard, double check-in, orphan usage log, malformed/nonexistent ids)
- [x] Requirements mapped (REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-018 → `VERIFIED` in `REQUIREMENTS.md`)
- [x] Known issues reviewed (none introduced; `RISK-002` unaffected)
- [x] Documentation updated (this file, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, `HANDOFF.md`)
- [x] Architecture still coherent (same routes→controller→service→repository shape as `ARCHITECTURE.md` specifies; `withTransaction` is the one small addition, documented in `ARCHITECTURE.md`-consistent style inline)
- [x] No blocking regression (Phase 00-02 tests/build all still pass; seeded data counts unchanged)
- [x] `STATE.md` updated
- [x] Checkpoint created (`checkpoint/phase-03-core-apis`)
- [x] `git status` clean
