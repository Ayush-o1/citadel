# Phase 01 — Data model & migrations

**Status:** `PLANNED`
**Owner:** unassigned — see `../PLAYBOOK.md` team table
**Started:** — · **Closed:** —

## Objective

Define and migrate the relational schema for the Smart Rental Tracking
System. Every other phase depends on this.

## Why

Every capability in the problem statement (status, checkout, usage,
alerts, anomalies, forecasts, recommendations) is a query or computation
over this schema. Getting entities/relationships right first avoids
rework across every later phase.

## Inputs

`problem-statement/ANALYSIS.md` §18, `REQUIREMENTS.md` REQ-001/002/003/004/005.

## Outputs

Migration files in `server/db/migrations/` creating the tables below;
`server/db/migrate.js` run successfully against the `citadel` database.

## Dependencies

None (first product phase). Everything else depends on this.

## Data model

| Table | Key fields | Notes |
|---|---|---|
| `sites` | `id`, `name`, `location` | |
| `operators` | `id`, `name`, `site_id` (nullable FK) | |
| `equipment` | `id`, `equipment_code` (e.g. `EQX1007`), `type`, `home_site_id` (FK), `status` (`available`\|`checked_out`\|`maintenance`) | `status` is derived/maintained, not freely editable — see Phase 03 |
| `checkouts` | `id`, `equipment_id` (FK), `operator_id` (FK, nullable), `site_id` (FK), `checked_out_at`, `expected_return_at`, `checked_in_at` (nullable), `status` (`active`\|`returned`\|`overdue`), `condition_out`, `condition_in` (nullable) | one row per rental cycle — this is the who/what/where/when backbone (REQ-005) |
| `usage_logs` | `id`, `checkout_id` (FK), `equipment_id` (FK), `logged_at`, `engine_hours`, `idle_hours`, `fuel_level`, `location`, `condition_note` | periodic snapshot during an active checkout |
| `alerts` | `id`, `equipment_id` (FK), `checkout_id` (FK, nullable), `type` (`upcoming_return`\|`overdue`\|`missing_info`), `message`, `severity`, `created_at`, `resolved_at` (nullable), `status` | Phase 04 |
| `anomalies` | `id`, `equipment_id` (FK), `checkout_id` (FK, nullable), `type` (`excessive_idle`\|`zero_runtime`\|`missing_assignment`\|`unusual_movement`), `reason` (text, human-readable), `severity`, `detected_at`, `status` | Phase 05 |
| `forecasts` | `id`, `equipment_type`, `site_id` (FK), `period_start`, `period_end`, `predicted_demand`, `method`, `factors` (text), `generated_at` | Phase 06 |
| `recommendations` | `id`, `source_type` (`alert`\|`anomaly`\|`forecast`), `source_id`, `equipment_id` (FK, nullable), `signal`, `reason`, `action` (`return`\|`reassign`\|`investigate`\|`extend`), `expected_impact`, `status` (`pending`\|`actioned`\|`dismissed`), `created_at`, `actioned_at` (nullable) | Phase 07 |

All FKs `ON DELETE RESTRICT` unless a real cascade need appears — don't
silently cascade-delete operational history.

## Tasks

- [ ] 01.1 — Write migration `002_create_sites_operators.sql`
- [ ] 01.2 — Write migration `003_create_equipment.sql`
- [ ] 01.3 — Write migration `004_create_checkouts.sql`
- [ ] 01.4 — Write migration `005_create_usage_logs.sql`
- [ ] 01.5 — Write migration `006_create_alerts_anomalies_forecasts_recommendations.sql`
- [ ] 01.6 — Run `npm run migrate`, verify each table with `\d <table>` in psql
- [ ] 01.7 — Decide and document whether to keep or delete the `items` reference table/module now that real tables exist (see `ARCHITECTURE.md`)

## Files / systems affected

`server/db/migrations/00[2-6]_*.sql`

## Risks

Getting a field wrong here is expensive later (every analytics phase
reads these tables). Mitigation: keep this phase to schema only — no
business logic — so it's fast to review and fix before Phase 02+ build on
top of it.

## Acceptance criteria

- All 5 new tables exist with the fields above, correct types, and FKs.
- `npm run migrate` is idempotent (rerunning does nothing).
- A decision is recorded on the `items` module's fate.

## Tests

Not yet run — to be filled when this phase is executed. Expected: `npm run migrate` twice (idempotency), `\d` on each table in psql.

## Exit criteria (phase gate)

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build passes
- [ ] Critical edge cases checked (rerun migration is a no-op)
- [ ] Requirements mapped (REQ-001–005 → `DESIGNED`)
- [ ] Known issues reviewed
- [ ] Documentation updated
- [ ] Architecture still coherent
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created
- [ ] `git status` clean
