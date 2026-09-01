# Phase 01 — Data model & migrations

**Status:** `VERIFIED`
**Owner:** Ayush + AI agent
**Started:** 2026-09-01 · **Closed:** 2026-09-01

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

**As implemented** (see `DECISIONS.md`'s 2026-09-01 "Phase 01: delete the
`items` reference module; two schema deviations" entry for why `code`
columns and the extra nullability were added versus this table's original
sketch):

| Table | Key fields | Notes |
|---|---|---|
| `sites` | `id`, `code` (unique, e.g. `S003`), `name` (nullable), `location` | |
| `operators` | `id`, `code` (unique, e.g. `OP101`), `name` (nullable), `site_id` (nullable FK) | |
| `equipment` | `id`, `equipment_code` (e.g. `EQX1007`), `type`, `home_site_id` (nullable FK), `status` (`available`\|`checked_out`\|`maintenance`) | `status` is derived/maintained, not freely editable — see Phase 03 |
| `checkouts` | `id`, `equipment_id` (FK), `operator_id` (nullable FK), `site_id` (**nullable** FK), `checked_out_at`, `expected_return_at` (nullable), `checked_in_at` (nullable), `status` (`active`\|`returned`\|`overdue`), `condition_out` (nullable), `condition_in` (nullable) | one row per rental cycle — who/what/where/when (REQ-005); `site_id` nullable to preserve `EQX1002`/`EQX1007`'s official missing-assignment example |
| `usage_logs` | `id`, `checkout_id` (FK), `equipment_id` (FK), `logged_at`, `engine_hours`, `idle_hours`, `fuel_level`, `location`, `condition_note` | periodic snapshot during an active checkout |
| `alerts` | `id`, `equipment_id` (FK), `checkout_id` (FK, nullable), `type` (`upcoming_return`\|`overdue`\|`missing_info`), `message`, `severity`, `created_at`, `resolved_at` (nullable), `status` | Phase 04 |
| `anomalies` | `id`, `equipment_id` (FK), `checkout_id` (FK, nullable), `type` (`excessive_idle`\|`zero_runtime`\|`missing_assignment`\|`unusual_movement`), `reason` (text, human-readable), `severity`, `detected_at`, `status` | Phase 05 |
| `forecasts` | `id`, `equipment_type`, `site_id` (FK), `period_start`, `period_end`, `predicted_demand`, `method`, `factors` (text), `generated_at` | Phase 06 |
| `recommendations` | `id`, `source_type` (`alert`\|`anomaly`\|`forecast`), `source_id`, `equipment_id` (FK, nullable), `signal`, `reason`, `action` (`return`\|`reassign`\|`investigate`\|`extend`), `expected_impact`, `status` (`pending`\|`actioned`\|`dismissed`), `created_at`, `actioned_at` (nullable) | Phase 07 |

All FKs `ON DELETE RESTRICT` unless a real cascade need appears — don't
silently cascade-delete operational history.

## Tasks

- [x] 01.1 — Write migration `002_create_sites_operators.sql`
- [x] 01.2 — Write migration `003_create_equipment.sql`
- [x] 01.3 — Write migration `004_create_checkouts.sql`
- [x] 01.4 — Write migration `005_create_usage_logs.sql`
- [x] 01.5 — Write migration `006_create_analytics_tables.sql` (alerts, anomalies, forecasts, recommendations)
- [x] 01.6 — Run `npm run migrate`, verify each table with `\d <table>` in psql
- [x] 01.7 — Decided: delete the `items` reference module (migration `007_drop_items_table.sql` + removed `server/src/modules/items/`, `client/src/pages/Items.jsx`, `client/src/api/items.js`, their route/nav references) — see `DECISIONS.md`

## Files / systems affected

`server/db/migrations/002`–`007_*.sql`; `server/src/routes/index.js` (removed items line); `server/db/seed.js` (stubbed — real seeding is Phase 02); removed `server/src/modules/items/`, `client/src/pages/Items.jsx`, `client/src/api/items.js`; updated `client/src/App.jsx`, `client/src/components/Layout.jsx`, `client/src/pages/Home.jsx` to drop the items route/nav link.

## Risks

Getting a field wrong here is expensive later (every analytics phase
reads these tables). Mitigation: keep this phase to schema only — no
business logic — so it's fast to review and fix before Phase 02+ build on
top of it.

## Acceptance criteria

- [x] All tables exist with correct types, FKs, and constraints (verified via `\d` on all 8 tables).
- [x] `npm run migrate` is idempotent (rerunning reports "No pending migrations").
- [x] A decision is recorded on the `items` module's fate (deleted — `DECISIONS.md`).
- [x] The official 7-row sample dataset can be inserted exactly as printed, including `EQX1002`/`EQX1007`'s `NULL` site/operator and `0` engine hours.
- [x] A duplicate active checkout is rejected at the database level, not just relying on future application code.

## Tests

Actually run against the local `citadel` database:

1. `npm run migrate` — applied `002`–`007` cleanly.
2. `npm run migrate` (again) — "No pending migrations. Database is up to date." (idempotency confirmed).
3. `\dt` — confirmed `items` gone, 8 real tables present (`sites`, `operators`, `equipment`, `checkouts`, `usage_logs`, `alerts`, `anomalies`, `forecasts`, `recommendations` + `schema_migrations`).
4. `\d` on every table — column types, defaults, CHECK constraints, FKs, and indexes all match the design above.
5. Transactional insert test (rolled back, so Phase 02's real seeding starts from empty tables): inserted all 7 official equipment/checkout/usage rows exactly as printed on the handout; queried them back and confirmed an exact match, including `EQX1002`/`EQX1007` showing `NULL` site_id, `NULL` operator_id, `0.00` engine_hours; attempted a second `active` checkout on the same equipment and confirmed Postgres rejected it (`duplicate key value violates unique constraint "idx_checkouts_one_active_per_equipment"`).
6. `npm test` (server) — 2/2 pass, unaffected by the `items` removal.
7. `npm run build` (client) — clean build after removing the `items` page/nav link.
8. Live boot: `GET /api/health` → `200`, `database: connected`.

## Exit criteria (phase gate)

- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Build passes
- [x] Critical edge cases checked (rerun migration is a no-op; duplicate active checkout rejected; official NULL-site/operator pattern preserved)
- [x] Requirements mapped (REQ-001, REQ-005 → `DESIGNED` in `REQUIREMENTS.md`)
- [x] Known issues reviewed (`ISSUES.md` unchanged — no new issues surfaced)
- [x] Documentation updated (this file, `DECISIONS.md`, `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `HANDOFF.md`)
- [x] Architecture still coherent (`ARCHITECTURE.md`'s module list unaffected; `items` removal matches its own stated disposability)
- [x] No blocking regression (server tests + client build both verified post-change)
- [x] `STATE.md` updated
- [x] Checkpoint created (`checkpoint/phase-01-data-model`)
- [x] `git status` clean (verified before commit)
