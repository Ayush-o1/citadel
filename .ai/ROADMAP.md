# Roadmap

## How phases work here

Phase count and shape are **not** fixed in advance. The real product might
need 8 phases or 25 — that depends on the actual Caterpillar problem, team
size, and time available. Deciding that before the problem exists would
just mean throwing the plan away on day one.

What's fixed is the *format*. Every phase, once created, is a file in
[`phases/`](phases/) filled from [`phases/_TEMPLATE.md`](phases/_TEMPLATE.md),
containing: objective, why, inputs/outputs, dependencies, tasks, files
affected, risks, acceptance criteria, tests, and exit criteria. See
`QUALITY.md` for what actually qualifies a phase as done (code existing is
not enough).

Rules for creating phases:
- A phase should be small enough to finish, verify, and checkpoint in a
  bounded chunk of hackathon time — not "backend" as one phase.
- If a phase turns out too big once you're in it, split it and update this
  file. Don't quietly let scope grow inside one phase file.
- If phases are independent (e.g., frontend page A and backend module B
  with an agreed API contract), they can run in parallel across team
  members. If one depends on another, say so explicitly in both phase
  files' "Dependencies" section.
- Renumber only if you have to — prefer `phase-07b` over renumbering
  everything after it.

## Phase index

| ID | Name | Status | Owner | File |
|---|---|---|---|---|
| 00 | Foundation | `VERIFIED` | Ayush + AI agent | [`phases/PHASE-00-foundation.md`](phases/PHASE-00-foundation.md) |
| 01+ | *(the real product, TBD)* | `NOT_STARTED` | — | created after `PROBLEM-STATEMENT.md` is filled and analyzed per `PLAYBOOK.md` |

## When the problem statement lands

Don't write phase files from a guess. Follow `PLAYBOOK.md`'s
Problem-Statement Mode first — it produces the MVP definition, architecture
fit, and task list that phase 01+ files should be built from. Typically
that produces something like (illustrative, not prescriptive):

- Phase 01 — data model + migrations for the real domain
- Phase 02 — core backend APIs for the MVP
- Phase 03 — core frontend screens for the MVP
- Phase 04 — integration + end-to-end testing
- Phase 05 — the one differentiating feature (see `PLAYBOOK.md` §Innovation)
- Phase 06 — polish + demo prep
- Phase 07 — presentation + panel-defense prep

Adjust freely. The point of this file is the mechanism, not this example.
