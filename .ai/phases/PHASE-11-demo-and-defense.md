# Phase 11 — Demo and panel-defense prep

**Status:** `NOT_STARTED`
**Owner:** unassigned — see `../PLAYBOOK.md` team table
**Started:** — · **Closed:** —

## Objective

Turn a working system into a reliable, well-defended presentation.

## Why

The hackathon is a hiring assessment (`OVERVIEW.md`) — a working system
that's poorly demoed or can't be defended in Q&A scores worse than a
simpler one presented well.

## Inputs

Phase 10's verified, integrated system. `problem-statement/ANALYSIS.md`
§25 (demo strategy). The problem statement's own demo narrative and
"Important Expectation" question list (`PROBLEM-STATEMENT.md` Source B).

## Dependencies

Depends on Phase 10. Last phase.

## Tasks

- [ ] 11.1 — Script the demo as the five-step narrative: SPOT (open Control Tower, point at a real flagged item) → EXPLAIN (its reason) → ACT (mark it actioned) → PREDICT (show the forecast) → PROVE (show the labeled expected-impact figure)
- [ ] 11.2 — Rehearse it against the actual seeded data at least twice, on the actual demo machine
- [ ] 11.3 — Prepare a fallback (screenshots or a short recording) in case live demo fails
- [ ] 11.4 — Every team member reviews and can personally answer the "Important Expectation" question list verbatim from `PROBLEM-STATEMENT.md` Source B, using `DECISIONS.md`/`ARCHITECTURE.md`/`RESEARCH.md` as the source of real answers — not improvised on the spot
- [ ] 11.5 — Confirm `REQUIREMENTS.md` and `DECISIONS.md` reflect what was actually built, not what Phase 00-01 assumed
- [ ] 11.6 — Assign who answers which category of interview question, based on who actually built that part (`PLAYBOOK.md` team table)

## Files / systems affected

Documentation only (`REQUIREMENTS.md`, `DECISIONS.md` final pass) plus
whatever demo data adjustments 11.2's rehearsal surfaces as needed.

## Risks

Rehearsing on a different machine/network than the actual demo — mitigate
by 11.2 explicitly requiring the real machine. A team member who can't
answer questions about a part they didn't build — mitigated by 11.6.

## Acceptance criteria

- The five-step demo runs successfully twice in a row on the demo machine.
- Every team member can answer at least the questions covering the part of the system they built.

## Tests

Not yet run. This phase's tests are the rehearsals themselves (11.2).

## Exit criteria (phase gate)

- [ ] Implementation complete (the demo script + fallback exist)
- [ ] Acceptance criteria met
- [ ] Tests pass (successful rehearsals)
- [ ] Build passes
- [ ] Critical edge cases checked (what happens if a rehearsal step fails live — fallback ready)
- [ ] Requirements mapped (final `REQUIREMENTS.md` pass done)
- [ ] Known issues reviewed (nothing left silently broken going into presentation)
- [ ] Documentation updated
- [ ] Architecture still coherent
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created
- [ ] `git status` clean
