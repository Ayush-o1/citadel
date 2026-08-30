# Phase 00 — Foundation

**Status:** `VERIFIED`
**Owner:** Ayush + AI agent
**Started:** 2026-08-30 · **Closed:** 2026-08-30

## Objective

Build the repository, tooling, and AI-agent operating system needed so
that the moment Caterpillar releases the problem statement, the team
starts solving the problem instead of figuring out how to work together.

## Why

The hackathon is a hiring assessment with ~1 day of real build time (see
`OVERVIEW.md`). Time spent on environment setup, onboarding, or
re-explaining project state to a new agent/teammate on day one is time
taken directly from solving the actual problem.

## Inputs

- Empty GitHub repository (`Ayush-o1/citadel`)
- Team roster and (unverified) candidate GitHub usernames
- Known team tech comfort level (see `OVERVIEW.md`)
- Local PostgreSQL 18 instance available

## Outputs

- Full-stack starter: React (Vite) client, Express server, PostgreSQL
  database, one reference CRUD module (`items`) demonstrating the whole
  pattern end-to-end
- Migrations + seed script + backend test suite
- Optional Docker Compose stack
- The `.ai/` AI-agent operating system (this file's directory)
- Three teammates invited as collaborators (one accepted as of this
  writing)
- GitHub labels for lightweight project management

## Dependencies

None — this is phase 0. Everything else depends on it.

## Tasks

- [x] 00.1 — Verify team GitHub usernames via API, invite as collaborators with write access
- [x] 00.2 — Inspect repo/DB/tooling state before building anything
- [x] 00.3 — Scaffold Express backend (config, middleware, routes, one reference module, error handling, validation)
- [x] 00.4 — Scaffold React frontend (routing, layout, reusable state components, API service layer, one reference page)
- [x] 00.5 — Create dedicated `citadel` Postgres database; write migration runner + first migration + seed
- [x] 00.6 — Write Docker Compose stack (untested end-to-end — see Risks)
- [x] 00.7 — Write initial docs (architecture, decisions, git workflow, hackathon playbook, problem-statement template)
- [x] 00.8 — Verify everything: install, migrate, seed, test, boot server, boot client, full CRUD via curl, fresh-clone simulation
- [x] 00.9 — Remove all AI-attribution traces from the committed history per explicit request
- [x] 00.10 — Correct GitHub username confusion (`Ayush-01` is not the team's account)
- [x] 00.11 — Build the `.ai/` AI-agent operating system (this structure) and consolidate `docs/` into it
- [x] 00.12 — Add GitHub labels for MoSCoW prioritization and issue typing
- [x] 00.13 — Run a real cross-agent handoff simulation (fresh clone, no chat context) and fix anything unclear

## Files / systems affected

Entire repository at this point — this is the initial scaffold. Going
forward, phase files should list specific paths, not "everything."

## Risks

- Docker Compose was authored without a running Docker daemon to test
  against — tracked as `RISK-001` in `ISSUES.md`. Mitigation: the
  documented non-Docker path (`npm run dev` in each app) is fully verified
  and is the recommended path during the hackathon anyway, for faster
  iteration.
- Two of three teammates haven't accepted their GitHub invite yet
  (`RISK-002`) — confirm before day one.

## Acceptance criteria

- A machine with no prior state can clone the repo and run it following
  only `README.md`.
- An AI agent with no chat history can clone the repo and correctly state:
  project purpose, current phase, what's done, what's not, and the next
  action — using only repository content.
- No secrets exist in any tracked file or git history.
- No mention of any AI tool/vendor exists anywhere in the tracked
  repository (explicit team requirement).

## Tests

Backend:
```
cd server && npm install && npm run migrate && npm run seed && npm test
```
Result: migration applied cleanly (idempotent on rerun), seed inserted
sample rows (skips if already present), 2/2 tests passed.

Live verification: booted `npm run dev`, exercised `/api/health` (200,
`database: connected`), full `items` CRUD via curl — create (201),
duplicate list (200), validation rejection on empty name (400 with field
error), delete (204), get-after-delete (404). All as expected.

Frontend:
```
cd client && npm install && npm run build
```
Result: clean build, 0 `npm audit` vulnerabilities (after bumping Vite
5→8 and react-router-dom 6→7 to clear two real CVEs — re-verified build
and dev-server boot afterward). Dev server boots; `/api/*` proxy to the
live backend confirmed via curl through port 5173.

Fresh-clone simulation:
```
git clone https://github.com/Ayush-o1/citadel.git /tmp/citadel-clone-test
cd /tmp/citadel-clone-test && ./scripts/setup.sh
```
Result: both apps installed cleanly, `.env` files created from examples,
0 vulnerabilities reported.

Cross-agent handoff simulation (this session): treated the repo as if
encountered fresh, with no chat access, reading only `.ai/AGENTS.md`
onward per its boot sequence — see `HANDOFF.md`'s latest entry for the
outcome and `QUALITY.md` for the method used.

Secret and AI-tool-attribution scan:
```
git grep -il "<any AI tool/vendor name>"   # 0 matches in tracked files
git grep -i "<the real DB password>"       # 0 matches
git ls-files | grep -E '(^|/)\.env$'       # 0 matches
```

## Exit criteria (phase gate)

- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Build passes
- [x] Critical edge cases checked (validation failure, delete-then-get-404, empty-repo fresh clone)
- [x] Requirements mapped — N/A, no product requirements exist yet at this phase
- [x] Known issues reviewed (`ISSUES.md` created and populated)
- [x] Documentation updated (`.ai/` fully built, `README.md` points to it)
- [x] Architecture still coherent (`ARCHITECTURE.md` matches what was actually built)
- [x] No blocking regression
- [x] `STATE.md` updated
- [x] Checkpoint created (commit + `checkpoint/phase-00-foundation` tag)
- [x] `git status` clean
