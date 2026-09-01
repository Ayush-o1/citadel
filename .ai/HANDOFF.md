# Handoff log

Newest entry first. Every agent/session adds a new entry before stopping —
never edits or deletes a previous one. This is the narrative record that
`STATE.md`'s snapshot can't carry on its own: what was actually tried,
what surprised us, what's still shaky.

---

## 2026-09-01 — Phase 05 implemented and verified: anomaly detection

**Where we are:** Phase 05 `VERIFIED`. `server/src/modules/anomalies/`
built with the same sync-on-read pattern as Phase 04. This is one of the
two highest-judging-weight modules (AI & Analytics), so before writing
any code, ran a direct SQL query against the 7 official rows' aggregated
engine/idle hours (see the Phase 05 doc's Rules table) to confirm the
0.40 threshold's predicted split *before* implementing the rule, not
after — avoids fitting a rule to a wrong assumption.

**What we built:**
- `excessive_idle`: `idle_hours / (engine_hours + idle_hours) > 0.40`, aggregated per checkout.
- `zero_runtime`: any logged day with `engine_hours = 0` (covers both a single bad day and the official summary rows where every day is zero).
- `missing_assignment`: reuses `hasMissingAssignment` from Phase 04's shared `checkoutRules.js` — generalized to drop the `status === 'active'` gate, since this anomaly must also catch it on a **returned** historical checkout (`EQX1002`/`EQX1007` are both returned). Phase 04's `missing_info` alert is unaffected since its query only ever looks at active checkouts.
- `unusual_movement` (should-have): a checkout has an assigned site but a logged `usage_logs.location` doesn't contain that site's code. Caught a real bug before it shipped: `usage_logs.location` is free text ("Site S002 yard"), not a bare site code, so a strict-equality comparison would have flagged *every* logged location including the correct one — fixed to a substring check before writing the test, confirmed against the actual seeded values via `psql`.

**What we verified:**
- `npm test` — 17/17 pass. `EQX1002`/`EQX1007` flagged `zero_runtime` +
  `missing_assignment` (and, correctly, `excessive_idle` too, since 0
  engine hours makes idle ratio 100% by definition — a true additional
  signal, not a double-counted bug). `EQX1003`/`EQX1005` flagged nothing.
  `EQX3004` flagged `unusual_movement` with the right reason string.
  `EQX3005` (healthy baseline) flagged nothing.
- Post-test DB check: seeded counts unchanged (17/22/192, 0 test
  fixtures); `anomalies` table holds exactly 17 open rows matching the
  full expected set across all seeded equipment, not just the official 7.
- `npm run build` (client) — clean, unaffected.

**RISK-003 note:** the idle-threshold half of this risk was already
marked resolved after Phase 02's calibration; this phase is the second,
independent confirmation — the threshold now works correctly in the
actual production code path, not just in a one-off calibration query.
`ISSUES.md` updated to reflect that.

**Next:** Phase 06 (demand forecasting) — the highest-risk remaining
phase (must stay honest on small-sample data, per `ANALYSIS.md` §24).
Continuing the authorized Phase 03→11 run without stopping for approval.

---

## 2026-09-01 — Phase 04 implemented and verified: alerts engine

**Where we are:** Phase 04 `VERIFIED`. `server/src/modules/alerts/` built;
`GET /api/alerts` recomputes signals from live `checkouts` data on every
call and syncs them into the `alerts` table (insert newly-detected,
resolve stale). Shared detection logic lives in the new
`server/src/utils/checkoutRules.js` specifically so Phase 05's
`missing_assignment` anomaly can reuse `hasMissingAssignment` instead of
reimplementing it (task 04.4's explicit requirement).

**Real decision made and documented:** chose to persist alerts (sync on
read) rather than pure in-memory computation, because `ARCHITECTURE.md`
already describes recommendations (Phase 07) as *reading from* alerts/
anomalies/forecasts — which only holds together if those are real rows,
not logic Phase 07 would have to re-derive itself. Full reasoning in
`DECISIONS.md`'s "Phase 04: alerts synced on read" entry.

**What we verified:**
- `npm test` — 16/16 pass (14 from Phase 03 + 2 new). The seeded
  `EQX3001`/`EQX3002`/`EQX3003` each produce exactly the alert Phase 02
  documented (overdue/upcoming_return/missing_info, one of each, verified
  both via the API and a direct SQL count).
- A fixture test proves the *resolve* path actually fires, not just the
  insert path: checked out with a past `expected_return_at` → alert
  appears → checked in → alert disappears on the next `GET`.
- Post-test DB check: seeded counts unchanged (17/22/192), zero leftover
  test fixtures or their alerts (cleanup order updated in
  `tests/helpers/fixtures.js` to clear `recommendations`/`anomalies`/
  `alerts` before `equipment`, since all three have the same
  `ON DELETE RESTRICT` FK Phase 03's fixtures already had to respect for
  `checkouts`/`usage_logs`).
- `npm run build` (client) — clean, unaffected.

**Not verified:** anything beyond the 3 required alert types at the
current data scale — no load test, no test of what happens if `alerts`
grows large (not a concern at 17-equipment/22-checkout scale, noted as a
real limitation in `DECISIONS.md`'s tradeoff line).

**Next:** Phase 05 (anomaly detection) — unblocked, next up. Continuing
the authorized Phase 03→11 run without stopping for approval.

---

## 2026-09-01 — Phase 03 implemented and verified: core backend APIs

**Where we are:** Phase 03 `VERIFIED`. `server/src/modules/equipment/`,
`checkouts/`, `usage-logs/` built following the existing
routes→controller→service→repository layering, mounted in
`routes/index.js`. This is the first phase executed under the
autonomous Phase 03→11 authorization (see the planning-checkpoint entry
below for what preceded it).

**What we built:**
- `GET /api/equipment`, `GET /api/equipment/:id` — `status` is computed
  at read time (available/checked_out/overdue/maintenance) from the
  active checkout's `expected_return_at`, never stored redundantly.
- `POST /api/checkouts`, `PATCH /api/checkouts/:id/check-in`, `GET
  /api/checkouts[?status=]` — checkout/check-in each run inside a new
  `withTransaction()` helper (added to `server/src/config/db.js`) so the
  `checkouts` row and `equipment.status` update atomically.
- `POST /api/usage-logs`, `GET /api/usage-logs/checkout/:checkoutId`.
- `server/src/middleware/validateUuidParam.js` (new) — malformed `:id`
  params now 400 cleanly instead of a Postgres `22P02` surfacing as a 500.

**What we verified:**
- `npm test` — 14/14 pass, including duplicate-checkout rejection (409),
  double-check-in rejection (409), orphan usage-log rejection (409/404),
  and the seeded `EQX3001` (overdue) / `EQX3003` (missing assignment on an
  *active* checkout) both computing the right live status via the real API.
- Manual verification against a running `node src/server.js`: health
  check, equipment list, a live duplicate-checkout attempt against the
  real seeded `EQX3001`, and a deliberately invalid usage-log payload —
  all returned clean JSON errors, not stack traces or generic 500s.
- **Confirmed the seeded data is untouched:** test fixtures are created
  with a `TEST-EQX-` prefix and deleted in a `finally` block; post-test
  query shows 0 leftover fixtures and the exact Phase 02 counts (17
  equipment / 22 checkouts / 192 usage_logs) unchanged.
- `npm run build` (client) — clean, unaffected (no frontend work this phase).

**Real decision made and documented:** the duplicate-checkout guard has
two layers — an app-level pre-check for a fast, friendly 409, and a
catch on Postgres's `23505` (unique-violation) from the existing partial
unique index `idx_checkouts_one_active_per_equipment`, mapped to the same
409 — so the actual guarantee is DB-enforced, not just application logic.
This is called out in `TEAM-EXECUTION-PLAN.md` as Astik's "decision to
defend."

**Not verified:** concurrent-request load testing (two simultaneous
check-out requests racing) — the DB-level unique index should prevent a
double-active-checkout under a real race, but this wasn't exercised with
actual concurrent requests, only reasoned about from the constraint's
existence. If this matters before the demo, a follow-up test firing two
`POST /api/checkouts` concurrently at the same equipment would close the
gap.

**Next:** Phase 04 (alerts engine) — unblocked, next up per `STATE.md`.
Continuing the authorized Phase 03→11 run without stopping for approval.

---

## 2026-09-01 — Planning checkpoint: TEAM-EXECUTION-PLAN.md + architecture PDF, before Phase 03-11 autonomous execution

**Where we are:** Phases 00-02 `VERIFIED` (unchanged this session). Before
starting the authorized Phase 03→11 autonomous run, produced the planning
artifact the team asked for: `.ai/TEAM-EXECUTION-PLAN.md` (source of
truth) and `.ai/CITADEL-ARCHITECTURE-TEAM-PLAN.pdf` (13-page print copy,
generated via headless Chrome from a standalone HTML file — no new
dependency added to the app itself).

**What it contains:** the existing architecture restated with concrete
diagrams (system architecture, data flow, asset lifecycle, ERD, analytics
pipeline, frontend IA, phase/dependency map), an API-contract table for
Phases 03/04/05/06/07 so 08/09 can be built against an agreed shape before
their real dependency lands, an expansion of `PLAYBOOK.md`'s existing
4-person team table into per-phase task ownership + file ownership (for
merge-conflict avoidance) + one cross-training task per person + a
4-section presentation division + a panel-defense cheat sheet skeleton.

**What did NOT change:** no new architecture, no new tech choice, no
change to the Phase 01 schema or Phase 02 seed data. `PLAYBOOK.md`'s team
table and `ROADMAP.md`'s dependency graph were extended, not replaced —
both are referenced from the new file rather than duplicated.

**Not verified (by nature — this is a planning doc, not code):** the file
ownership / parallel-work claims are correct on paper (no two owners touch
the same module folder) but untested by actual simultaneous multi-person
work, since only Ayush's GitHub invite has been accepted so far
(`RISK-002` — Astik/Souharda still pending). Treat the team assignments as
the plan for when they join, not evidence they've been followed.

**Next:** proceeding directly into Phase 03 (core backend APIs) per the
already-authorized autonomous Phase 03→11 execution — see `STATE.md`.

---

## 2026-09-01 — Phase 02 implemented and verified: synthetic operational data

**Where we are:** Phase 02 `VERIFIED`. Database now has real, believable
data to compute against: 17 equipment, 22 checkouts, 192 usage_logs.
Phase 03 (core APIs) is next — was not started this session
(out of scope by instruction: "do NOT start another phase after Phase 02").

**What we just did:** Rewrote `server/db/seed.js` (replacing Phase 01's
placeholder stub) to generate three layers, fully deterministically (no
`Math.random()` anywhere):
1. The exact official 7-row Caterpillar sample as historical completed
   checkouts, with daily `usage_logs` reconstructing each row's stated
   per-day averages exactly.
2. Trailing weekly history on 5 additional equipment, deliberately rich
   for `Excavator`/`S003` and `Bulldozer`/`S002`, deliberately sparse for
   `Grader`/`S001` (for Phase 06's insufficient-history fallback).
3. 5 live active checkouts, each cleanly isolated to demonstrate exactly
   one signal: overdue, upcoming-return, missing-assignment (on an active
   checkout, not just historically), unusual-movement, and a healthy
   baseline.

**A real data-quality finding, documented not silently fixed:** six of
the seven official rows' stated `Operating Days` matches their calendar
date span exactly; `EQX1003` is off by one (matches inclusive counting
instead of exclusive). Rather than "fixing" this, treated `Operating
Days` as authoritative for the generated row count and left both the
dates and the day count exactly as printed — see `DECISIONS.md`.

**RISK-003 calibration (explicitly requested):** computed idle_ratio
across all 17 seeded historical checkout-rows. The 0.40 threshold from
`RESEARCH.md` R-002 cleanly separates 10 flagged rows from 7 clearly
healthy ones with no boundary-ambiguous cases — confirmed sound, not
changed. Full evidence in `DECISIONS.md`'s "RISK-003 calibration result"
entry; `ISSUES.md`'s `RISK-003` row updated to `IN_PROGRESS` (threshold
half resolved, forecasting-method half still open pending Phase 06).

**What was verified:** exact reproduction of all 7 official rows (site
code, operator code, dates, daily averages, log-day count) via direct
psql query comparison against the handout; idempotency (second `npm run
seed` no-ops); all 5 active-checkout demo cases individually confirmed
correct and signal-isolated (no confounding idle-anomaly noise on the
overdue/upcoming/missing/movement examples); trailing-history depth
confirmed rich (5, 4) vs. sparse (2) exactly as designed; server tests
(2/2) and client build both still pass.

**What was not verified:** nothing scoped to this phase was skipped.
Actual anomaly/alert/forecast computation logic doesn't exist yet
(Phases 04-06) — this phase only had to prove the *data* supports it,
which it does.

**Current phase / task:** Phase 02 `VERIFIED`. Phase 03 (core APIs) is
`PLANNED` and unblocked — next up, not started.

**Known bugs:** none. **Known risks:** `RISK-001`, `RISK-002` unchanged;
`RISK-003` now `IN_PROGRESS` (half resolved, see above).

**Important decisions:** `DECISIONS.md`'s two 2026-09-01 Phase 02 entries
(RISK-003 calibration result; Operating Days authoritative).

**Files affected this session:** `server/db/seed.js` (full rewrite).
`.ai/phases/PHASE-02-synthetic-data.md`, `STATE.md`, `ROADMAP.md`,
`REQUIREMENTS.md`, `DECISIONS.md`, `ISSUES.md` updated to match. No
migrations, no server/client application code touched (schema unchanged
from Phase 01; Phase 03 untouched).

**Blockers:** none.

**Next action:** start Phase 03 (`phases/PHASE-03-core-apis.md`) — the
`equipment`/`checkouts`/`usage-logs` API modules. Once it lands, Phases
04-06 (alerts/anomalies/forecasting) can build directly against the
seeded data this session produced.

**Commands to run to pick this up:**
```bash
git log --oneline -10 && git status
cd server && npm install && npm run migrate && npm test
cd ../client && npm install && npm run build
# confirm the seeded data is still there:
PGPASSWORD='<see server/.env>' psql -U ayush -h localhost -p 5432 -d citadel -c "SELECT COUNT(*) FROM equipment;"
```
Then open `phases/PHASE-03-core-apis.md` and start on its tasks.

**What not to touch without reason:** the seeded data's deliberate edge
cases (`EQX3001`–`EQX3005`, the `Grader`/`S001` sparse pair) — later
phases' tests and the eventual demo depend on these existing exactly as
seeded. Don't re-run `npm run seed` after manually clearing tables and
expect identical IDs (the generator is deterministic in *values*, not in
the UUIDs Postgres assigns) — if you need to reset, re-run the full
migration + seed together, don't partially reset. `server/.env`.

---

## 2026-09-01 — Phase 01 implemented and verified: data model & migrations

**Where we are:** Phase 01 `VERIFIED`. First real product code exists —
8 tables, migrated, inspected, and insert-tested. Phases 02 and 03 are
now unblocked and can run in parallel.

**What we just did:** Wrote and ran migrations `002`–`006` (sites,
operators, equipment, checkouts, usage_logs, alerts, anomalies,
forecasts, recommendations) per `phases/PHASE-01-data-model.md`. Executed
task 01.7's decision (delete `items`) via migration `007` plus removing
`server/src/modules/items/`, `client/src/pages/Items.jsx`,
`client/src/api/items.js`, and their route/nav references — `items` was
always a disposable reference pattern (`ARCHITECTURE.md`) and the real
tables now serve as the live example instead.

**Two schema deviations from the phase doc, both documented in
`DECISIONS.md`, not silent:**
1. `checkouts.site_id` and `checkouts.expected_return_at` had to be
   nullable — the phase doc's table hadn't marked them so, but the
   official sample's `EQX1002`/`EQX1007` rows have `NULL` Site ID, and a
   NOT NULL constraint would make the official data un-storable. This
   wasn't actually new information — Phase 05's anomaly rule table
   already assumed `site_id` could be null; the Phase 01 table just
   hadn't caught up to its own downstream phase.
2. Added a `code` column to `sites` and `operators` (unique, e.g. `S003`,
   `OP101`) mirroring the `equipment_code` pattern already specified for
   `equipment` — needed to store the official sample's actual identifiers
   instead of inventing names for them.

**What was verified (see `phases/PHASE-01-data-model.md`'s "Tests"
section for the full list):** migration applied cleanly and is idempotent
on rerun; every table's structure inspected via `\d` and matches the
design; a transactional insert (rolled back afterward — Phase 02 owns
real seeding) proved the exact official 7-row dataset fits the schema,
including `EQX1002`/`EQX1007`'s `NULL` site/operator/`0` engine-hours
pattern; the partial unique index correctly rejected a second `active`
checkout on the same equipment (REQ-018, enforced at the DB level, not
just relying on future application code); server tests (2/2) and client
build both still pass after the `items` removal; live server boot
confirmed `/api/health` still reports `database: connected` against the
new schema.

**What was not verified:** nothing scoped to this phase was skipped. Real
seed data (Phase 02) and the anomaly/forecast threshold calibration
(`RISK-003`) are explicitly out of this phase's scope, not gaps in it.

**Current phase / task:** Phase 01 `VERIFIED`. Phase 02 (synthetic data)
and Phase 03 (core APIs) are both `PLANNED` and unblocked — see
`ROADMAP.md`.

**Known bugs:** none. **Known risks:** unchanged (`RISK-001`, `RISK-002`,
`RISK-003` — see `ISSUES.md`).

**Important decisions:** `DECISIONS.md`'s 2026-09-01 "Phase 01: delete
the `items` reference module; two schema deviations" entry.

**Files affected this session:** `server/db/migrations/002`–`007_*.sql`;
removed `server/src/modules/items/`, `client/src/pages/Items.jsx`,
`client/src/api/items.js`; updated `server/src/routes/index.js`,
`server/db/seed.js` (stubbed pending Phase 02), `client/src/App.jsx`,
`client/src/components/Layout.jsx`, `client/src/pages/Home.jsx`;
`.ai/phases/PHASE-01-data-model.md`, `STATE.md`, `ROADMAP.md`,
`REQUIREMENTS.md`, `DECISIONS.md` updated to match.

**Blockers:** none.

**Next action:** start Phase 02 and Phase 03 in parallel (see
`PLAYBOOK.md`'s team table for the suggested split). Do not start
Phases 04-07 (alerts/anomalies/forecasting/recommendations) before
Phase 02 has real data seeded.

**Commands to run to pick this up:**
```bash
git log --oneline -10 && git status
cd server && npm install && npm run migrate && npm test
cd ../client && npm install && npm run build
```
Then open `phases/PHASE-02-synthetic-data.md` and/or
`phases/PHASE-03-core-apis.md` and start on their tasks.

**What not to touch without reason:** `checkouts.site_id`/`operator_id`'s
nullability (see above — it's load-bearing for the official anomaly
example, not an oversight to "fix"); the partial unique index enforcing
one active checkout per equipment; `server/.env`.

---

## 2026-09-01 — Problem-statement planning: Smart Rental Tracking System

**Where we are:** Problem statement received and fully analyzed. Complete
11-phase build plan exists (`ROADMAP.md`, `phases/PHASE-01`–`PHASE-11`).
**Nothing coded yet** — this session was planning only, per the explicit
"do not skip to coding" instruction. Phase 01 (data model) is `PLANNED`
and ready for someone to actually start.

**What we just did:**
- Ran Problem-Statement Mode end to end: filled `problem-statement/ANALYSIS.md`,
  populated `REQUIREMENTS.md` with 20 real requirements (REQ-001–020),
  logged 2 research findings in `RESEARCH.md` (forecasting method,
  industry idle/utilization thresholds — both with real cited sources),
  added a tech-stack decision gate and an analytics-approach decision to
  `DECISIONS.md`, wrote `DESIGN.md` (the UX/IA spec for the Control Tower
  and Asset Dashboard screens), and extended `ARCHITECTURE.md` with the
  domain module list and analytics-layer convention.
- Created all 11 phase files with concrete tasks, acceptance criteria, and
  exit criteria — see `ROADMAP.md`'s dependency graph for build order and
  parallelization.
- Filled `PLAYBOOK.md`'s team responsibility table with a suggested
  split, reasoned from the judging weights (analytics gets 2 people).

**Important discovery — two problem-statement sources didn't match:** a
photo of the actual one-page Caterpillar handout (`PROBLEM-STATEMENT.md`
Source A) surfaced *after* this session had already been analyzing a more
elaborate text version (Source B: "Control Tower," judging weights,
recommendation-engine shape, demo narrative) that the user had pasted in
as "official problem context." None of Source B appears on the literal
handout. **Asked the user directly** rather than guessing which to trust
— confirmed (2026-09-01) that Source B is real content from the live
event presentation/briefing, not an AI/interpretive elaboration. Both
sources are now preserved verbatim in `PROBLEM-STATEMENT.md`, clearly
labeled, and don't actually conflict — Source B adds structure on top of
Source A's same six capabilities. **If a future agent finds any other
discrepancy between what's in this repo's analysis and what the team
actually saw/heard at the event, ask before assuming — don't silently
pick one.**

**A concrete, valuable finding from Source A's sample data:** two of the
seven official example rows (`EQX1002`, `EQX1007`) have `Site ID = NULL`,
`Last Operator ID = NULL`, and `0` Engine Hours/Day together — almost
certainly Caterpillar's own worked example of the "unassigned equipment"
/ "zero runtime" anomaly. Phase 02's synthetic data reproduces these 7
rows exactly (with daily `usage_logs` generated to match the handout's
per-day averages), and Phase 05's anomaly rules are written to catch this
exact pattern — see `DECISIONS.md`'s reconciliation entry.

**What was verified:** nothing new technically (no code changed this
session) — Phase 00's baseline (tests, build, migrations) was not
re-run since no application code was touched. Verify it fresh before
starting Phase 01, per `AGENTS.md`'s boot sequence.

**What was not verified:** the anomaly thresholds and forecasting method
are designed from research and the official sample, not from actually
running numbers against seeded data yet — this is explicit in `ISSUES.md`
(`RISK-003`) and built into Phases 05/06 as calibration tasks (05.1, 06.1),
not assumed settled.

**Current phase / task:** Phase 00 `VERIFIED` (unchanged). Phase 01
(`phases/PHASE-01-data-model.md`) is `PLANNED` — this is the next actual
work. Do not re-run Problem-Statement Mode; that's done.

**Known bugs:** none. **Known risks:** `RISK-001` (Docker untested),
`RISK-002` (2 pending invites — check before day one), `RISK-003`
(uncalibrated thresholds, see above).

**Important decisions:** `DECISIONS.md`'s three 2026-09-01 entries (tech
stack reconfirmed, rule-based analytics over ML, sample-data reconciliation).

**Files affected this session:** `PROBLEM-STATEMENT.md` (rewritten with
both sources), everything new under `.ai/problem-statement/`,
`.ai/phases/PHASE-01` through `PHASE-11`, `REQUIREMENTS.md`, `RESEARCH.md`,
`DECISIONS.md`, `DESIGN.md` (new), `ARCHITECTURE.md`, `ROADMAP.md`,
`PLAYBOOK.md`, `STATE.md`, `ISSUES.md`. No application code.

**Blockers:** none. Ready to implement.

**Next action:** start Phase 01 (`phases/PHASE-01-data-model.md`) — write
the migrations, run them, verify schema, then hand off to whoever's doing
Phase 02/03 per `PLAYBOOK.md`'s team table.

**Commands to run to pick this up:**
```bash
git log --oneline -10 && git status
cd server && npm install && npm run migrate && npm test
cd ../client && npm install && npm run build
```
Then open `phases/PHASE-01-data-model.md` and start on its tasks.

**What not to touch without reason:** the two-sources structure of
`PROBLEM-STATEMENT.md` — don't collapse it back into one version; the
distinction matters if another discrepancy surfaces later. The rule-based
(not ML) analytics decision — don't introduce a trained model without a
new `DECISIONS.md` entry justifying it against the alternative already
rejected there.

---

## 2026-08-30 — Foundation session 2: AI-agent operating system

**Where we are:** Phase 00 (foundation) complete and verified. Repository
now has a full `.ai/` operating system so any future agent — any machine,
any AI tool, zero chat history — can pick this up correctly.

**What we just did:**
- Verified GitHub username `Ayush-01` (digit zero) is an unrelated
  account; corrected to `Ayush-o1` (letter o) everywhere — see
  `DECISIONS.md`.
- Confirmed `eklavaya008` accepted their collaborator invite;
  `Astik01` and `Souharda6996` still pending from the prior session.
- Migrated `docs/` into `.ai/` as the single canonical location for
  process/state docs (no duplication between two doc trees).
- Built the full `.ai/` structure: `AGENTS.md`, `OVERVIEW.md`, `STATE.md`,
  this `HANDOFF.md`, `ROADMAP.md`, `phases/` (template + Phase 00 record),
  `REQUIREMENTS.md`, `RESEARCH.md`, `ISSUES.md`, `QUALITY.md`, and
  extended `GIT-WORKFLOW.md` / `PLAYBOOK.md`.
- Added GitHub labels for MoSCoW prioritization and issue typing (see
  `PLAYBOOK.md` → "GitHub as project management").
- Ran a cross-agent handoff simulation (fresh clone, following only
  `AGENTS.md`'s boot sequence with no chat context) per Phase 00's
  acceptance criteria — passed.

**What was verified:** backend boots and connects to the `citadel`
Postgres DB; migration + seed re-run cleanly (idempotent); `npm test`
passes (2/2); client builds and dev-boots; fresh-clone `./scripts/setup.sh`
still works; no secrets in tracked files (`git grep` clean); a simulated
"Agent B" reading only the repo (no chat access) could correctly state the
project's purpose, current phase, and next action.

**What was not verified:** Docker Compose end-to-end (`docker compose up`)
— the Docker daemon was not running on this machine during this session.
Tracked as `RISK-001` in `ISSUES.md`. Whoever has Docker running next
should run it once and flip that risk to resolved or file a real bug.

**Current phase / task:** Phase 00 `VERIFIED`. No active task — waiting on
the Caterpillar problem statement (expected 2026-09-01).

**Known bugs:** none open.

**Known risks:** see `ISSUES.md` (`RISK-001` Docker untested, `RISK-002`
two teammates haven't accepted GitHub access yet).

**Important decisions:** see `DECISIONS.md`, entries dated 2026-08-30.

**Files affected this session:** everything under `.ai/`; `docs/` removed
(content moved, not deleted); `README.md` updated to point at
`.ai/AGENTS.md`; no application code changed.

**Blockers:** none for foundation work. Product work is blocked on the
problem statement by design (see `OVERVIEW.md`).

**Next action:** when `PROBLEM-STATEMENT.md` is filled in, the next agent
runs Problem-Statement Mode in `PLAYBOOK.md` — do not start coding before
that analysis is done and phases exist in `ROADMAP.md`.

**Commands to run to pick this up:**
```bash
git log --oneline -10 && git status
cd server && npm install && npm run migrate && npm test
cd ../client && npm install && npm run build
```

**What not to touch without reason:** `server/.env` (real local DB
credentials, machine-specific); the `items` reference module (delete
deliberately, not accidentally, once real features exist); the stack
choice itself (React/Express/Postgres, no ORM) — revisit only via a new
`DECISIONS.md` entry, not silently.

---

## 2026-08-30 — Foundation session 1: initial scaffold

**Where we are:** Empty repository → working full-stack starter.

**What we just did:** Invited the three teammates (verified usernames via
GitHub API before inviting); built React (Vite) client + Express server +
PostgreSQL backend with a layered structure (routes → controller → service
→ repository); added a reference `items` CRUD module end-to-end; wrote
migrations, a seed script, and one health-check test suite; wrote
`docker-compose.yml`; wrote initial `README.md` and `docs/*` (later moved
into `.ai/`, see the entry above).

**What was verified:** created a dedicated `citadel` Postgres database;
ran migrations and seed against it; full CRUD cycle tested live via curl
(create, list, validate-reject, delete, 404-after-delete); client dev
server's `/api` proxy confirmed working against the live backend;
`npm audit` came back clean after bumping Vite 5→8 and React Router 6→7 to
clear two real CVEs (re-verified build + dev boot after the bump); fresh
clone + `./scripts/setup.sh` tested end-to-end in `/tmp`.

**What was not verified:** Docker Compose (daemon not running).

**Important decisions:** React/Express/Postgres with no ORM; no
auth/AI/dashboards by default. See `DECISIONS.md`.

**Next action at the time:** build the AI-agent operating system — done in
the session above.
