# Read this first

You are continuing an existing project. You have zero access to any prior
conversation. Everything you need is in this repository. Do not start
coding until you've worked through this checklist.

## Boot sequence

1. Read this file completely.
2. Read [`OVERVIEW.md`](OVERVIEW.md) — what this project is, the team, the constraints.
3. Read [`STATE.md`](STATE.md) — current phase, progress, blockers, next recommended action.
4. Read the latest entry (top) of [`HANDOFF.md`](HANDOFF.md) — what the last agent/session actually did and verified.
5. Read [`ROADMAP.md`](ROADMAP.md) — how phases work, and the index of phases that exist so far.
6. Read the current phase's file in [`phases/`](phases/), if one is marked `IN_PROGRESS`.
7. Read [`DECISIONS.md`](DECISIONS.md) — don't relitigate settled decisions without new information.
8. Read [`ISSUES.md`](ISSUES.md) — known bugs, risks, tech debt, open questions, blockers.
9. Check the root [`PROBLEM-STATEMENT.md`](../PROBLEM-STATEMENT.md) — has the real Caterpillar problem statement been pasted in yet?
   - **If not yet released:** you are in foundation mode. Do not invent a domain, do not build product features. See "Before the problem statement exists" below.
   - **If released and Phase 01 doesn't exist yet:** run Problem-Statement Mode — see [`PLAYBOOK.md`](PLAYBOOK.md).
10. Run `git log --oneline -10` and `git status` — does reality match what `STATE.md` claims?
11. Run `git branch -a` — is there in-progress work on another branch you should know about?
12. Verify the environment: `node -v`, `psql --version` (or `docker info`), confirm `server/.env` exists (copy from `server/.env.example` if not — never invent credentials).
13. Run the baseline: `cd server && npm install && npm run migrate && npm test`, `cd client && npm install && npm run build`.
14. If baseline fails, that's your first task — fix it before anything else, and record it in `ISSUES.md`.
15. Only now decide what to actually do next, using `STATE.md`'s "Next recommended action" as your starting hypothesis, not a blind instruction.
16. Implement in small steps.
17. Verify: run tests, run the app, inspect `git diff` before committing. See [`QUALITY.md`](QUALITY.md) for the full verification loop and phase-gate checklist.
18. Update `STATE.md` to reflect reality (never mark something `VERIFIED` or `COMPLETE` without actually running it).
19. Commit with a meaningful message (see [`GIT-WORKFLOW.md`](GIT-WORKFLOW.md)); tag a checkpoint if you closed out a phase.
20. If you're stopping — context limit, handoff to a teammate, end of session — write a new entry at the top of `HANDOFF.md` before you stop. Do not leave state only in your own head or chat history; the chat disappears, the repo doesn't.

## Before the problem statement exists

Do not:
- invent a domain, fake Caterpillar features, or fake business logic
- add authentication, AI integrations, or dashboards "just in case"
- restructure the stack because something newer/trendier exists
- pre-build product phases — phase count and shape depend on the actual problem (see `ROADMAP.md`)

Do:
- keep the foundation (`.ai/` system, `server/`, `client/`, Docker, docs) accurate and working
- fix genuine bugs, gaps, or unclear docs you find while verifying the baseline
- keep `ISSUES.md` and `DECISIONS.md` current

## Hard rules

- Never force-push to `main`. Never overwrite another person's or agent's work without inspecting it first.
- Never commit secrets. Real values live in `.env` files (gitignored); `.env.example` files hold placeholders only.
- Never mark a phase gate or requirement complete because code exists — it's complete when it's been run and verified. See `QUALITY.md`.
- When uncertain: stop, document the uncertainty in `ISSUES.md` (as an open question), then act — don't guess and move on silently.

## Map of `.ai/`

| File | Purpose |
|---|---|
| `AGENTS.md` | This file — the entrypoint |
| `OVERVIEW.md` | Mission, team, event timeline, technical constraints |
| `STATE.md` | Canonical current state — phase, progress, checkpoints |
| `HANDOFF.md` | Append-only log of session handoffs, newest first |
| `ROADMAP.md` | Phase framework + index (phases live in `phases/`) |
| `phases/` | One file per phase, filled from `phases/_TEMPLATE.md` |
| `DECISIONS.md` | ADR-style log of real decisions and why |
| `ARCHITECTURE.md` | System architecture and how to extend it |
| `DESIGN.md` | UX/visual design system — information architecture, component conventions |
| `REQUIREMENTS.md` | Requirement → design → code → test traceability |
| `RESEARCH.md` | Research log (source, date, finding, decision influenced) |
| `ISSUES.md` | Bugs, risks, tech debt, assumptions, open questions, blockers |
| `QUALITY.md` | Phase gates, verification loop, quality review, MVP rules |
| `GIT-WORKFLOW.md` | Branching, commits, checkpoints, conflict handling |
| `PLAYBOOK.md` | The step-by-step protocol for when the hackathon actually starts |
| `PRE-HACKATHON-CHECKLIST.md` | The team's literal Sept 1 morning-of checklist — clone through first commit |
| `TEAM-EXECUTION-PLAN.md` | Final architecture, 4-person work division, phase/dependency map, presentation split, panel-defense prep for Phases 03-11 — read this before starting any of Phases 03-11 |
| `CITADEL-ARCHITECTURE-TEAM-PLAN.pdf` | Print/study copy of `TEAM-EXECUTION-PLAN.md` — if they disagree, the markdown file wins |
| `DEMO-SCRIPT.md` | The literal, rehearsed five-step demo script (SPOT→EXPLAIN→ACT→PREDICT→PROVE) — follow it, don't improvise the flow live |
| `PANEL-DEFENSE.md` | Real, sourced answers to the problem statement's "Important Expectation" question list, plus per-person defense pointers |
| `problem-statement/ANALYSIS-TEMPLATE.md` | Template for analyzing the real problem statement |
| `problem-statement/ANALYSIS.md` | The filled analysis of the actual Smart Rental Tracking System problem statement |
