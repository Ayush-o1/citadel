# Phase 10 — Integration, testing, and polish

**Status:** `NOT_STARTED`
**Owner:** unassigned — see `../PLAYBOOK.md` team table
**Started:** — · **Closed:** —

## Objective

Make sure the whole journey works end-to-end as one system, not seven
independently-tested modules. Only after this is solid, consider the one
optional stretch feature.

## Why

Individually-passing phase tests don't guarantee the full CHECK OUT →
ASSIGN & TRACK → LOG USAGE → CHECK IN → alert/anomaly/forecast →
recommendation chain works when chained live. `QUALITY.md`'s MVP control:
protect this before touching stretch scope.

## Inputs

All of Phases 01-09 complete and individually verified.

## Dependencies

Depends on Phases 01-09. Nothing depends on this except Phase 11.

## Tasks

- [ ] 10.1 — Full end-to-end walkthrough: check out a fresh asset → log usage that triggers an anomaly → verify it appears in the Action Queue with the right reason/action → mark it actioned → check in
- [ ] 10.2 — Cross-browser/window-size check on both screens (`QUALITY.md`'s responsive check)
- [ ] 10.3 — Re-run the full backend test suite + client build together, not just per-module
- [ ] 10.4 — Quality review pass per `QUALITY.md` (senior engineer / product designer / security reviewer / judge / interviewer lenses)
- [ ] 10.5 — Only if time remains: implement the one chosen stretch feature (REQ-020) — do not start this if 10.1-10.4 aren't clean
- [ ] 10.6 — Update `REQUIREMENTS.md` statuses to reflect actual verified state across all REQs

## Files / systems affected

Whatever 10.1's walkthrough surfaces as broken — expect small fixes across
multiple modules, not new modules.

## Risks

This phase is where schedule pressure is highest (`OVERVIEW.md` timeline
— this is likely late Day 1/early Day 2). `QUALITY.md`'s time-management
rule applies directly: cut the stretch feature (10.5) before cutting
anything in 10.1-10.4.

## Acceptance criteria

- The full walkthrough (10.1) works without manual database intervention.
- `REQUIREMENTS.md` accurately reflects verified vs. deferred status for every REQ — no silent gaps going into the demo.

## Tests

Not yet run. This phase's own task IS the test — see Tasks.

## Exit criteria (phase gate)

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build passes
- [ ] Critical edge cases checked (the full chain, not just individual endpoints)
- [ ] Requirements mapped (all REQs reviewed and updated)
- [ ] Known issues reviewed
- [ ] Documentation updated
- [ ] Architecture still coherent
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created
- [ ] `git status` clean
