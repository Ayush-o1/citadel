# Project state

**Last updated:** 2026-09-01, AI agent, Phase 01 implementation session.
**Statuses used:** `NOT_STARTED` · `PLANNED` · `IN_PROGRESS` · `BLOCKED` · `READY_FOR_REVIEW` · `VERIFIED` · `COMPLETE`

## Current phase

**Phase 00 — Foundation.** Status: `VERIFIED`.

**Phase 01 — Data model & migrations.** Status: `VERIFIED`. Schema
migrated and verified against the local `citadel` database, including a
transactional insert test proving the official 7-row sample dataset
(including `EQX1002`/`EQX1007`'s missing-assignment pattern) fits exactly.
See [`phases/PHASE-01-data-model.md`](phases/PHASE-01-data-model.md).

**Phases 02-11:** `NOT_STARTED`/`PLANNED`. Phase 02 and Phase 03 are both
now unblocked and can run in parallel — see `ROADMAP.md`'s dependency
graph.

## Next recommended action

**Start Phase 02 (synthetic data) and Phase 03 (core APIs) in parallel**
— both depend only on Phase 01, which is done. Per `PLAYBOOK.md`'s team
table: Ayush → Phase 02, Astik → Phase 03. Do not start Phase 04/05/06
(alerts/anomalies/forecasting) until Phase 02 has real data seeded — they
need rows to compute against, not just tables.

## Overall progress

| Area | Status | Notes |
|---|---|---|
| Team access | `VERIFIED` | 1 of 3 invites accepted (`eklavaya008`); 2 pending — see `RISK-002` |
| Foundation (backend/frontend/DB scaffolding) | `VERIFIED` | Phase 00 |
| Docker Compose | `READY_FOR_REVIEW` | Still not run end-to-end — `RISK-001` |
| AI-agent operating system | `VERIFIED` | Phase 00 |
| Problem statement received & analyzed | `VERIFIED` | 2 sources, both confirmed authoritative |
| Requirements | `DESIGNED` | REQ-001, REQ-005 now `DESIGNED` (schema exists); rest `NOT_STARTED` |
| Data model | `VERIFIED` | Migrated, inspected, and insert-tested against the local `citadel` DB — Phase 01 |
| Phase plan | `VERIFIED` | 11 phases in `ROADMAP.md` |
| Design system | `VERIFIED` (design only, not built) | `DESIGN.md` |
| Product implementation | `IN_PROGRESS` | Phase 01 done; Phases 02-11 not started |

## Known bugs

None open. See `ISSUES.md`.

## Known risks

- `RISK-001`: Docker Compose stack untested end-to-end.
- `RISK-002`: 2 of 3 invited teammates haven't accepted GitHub access yet.
- `RISK-003`: Forecasting (Phase 06) and anomaly thresholds (Phase 05) are
  designed from research and the official sample, not yet validated
  against real seeded volume — Phase 02 must land first.

## Checkpoint log

| Checkpoint | Date | Phase | Commit | Verified |
|---|---|---|---|---|
| `checkpoint/phase-00-foundation` | 2026-08-30 | Phase 00 | `2dfc243` | Yes |
| `checkpoint/phase-01-data-model` | 2026-09-01 | Phase 01 | `56e1a9d` | Yes — see Phase 01 doc's "Tests" section |

## What must not be changed without a documented reason

- The core stack choice (React/Express/PostgreSQL, no ORM).
- Rule-based analytics over a trained ML model — see `DECISIONS.md`.
- The schema's nullable `checkouts.site_id`/`checkouts.operator_id` — this
  is what makes the official `EQX1002`/`EQX1007` anomaly example
  representable; don't "fix" it to NOT NULL.
- `server/.env` — real local DB credentials, never commit it.
