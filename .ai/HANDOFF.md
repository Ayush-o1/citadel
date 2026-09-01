# Handoff log

Newest entry first. Every agent/session adds a new entry before stopping —
never edits or deletes a previous one. This is the narrative record that
`STATE.md`'s snapshot can't carry on its own: what was actually tried,
what surprised us, what's still shaky.

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
