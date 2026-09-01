# Phase 09 — Control Tower UI

**Status:** `NOT_STARTED`
**Owner:** unassigned — see `../PLAYBOOK.md` team table
**Started:** — · **Closed:** —

## Objective

The primary screen: Action Queue first, Live Status and Utilization as
supporting context — the screen that makes "insight → action → outcome"
visibly real rather than a slide claim.

## Why

REQ-011, REQ-012, REQ-013. This is the screen judges will remember —
`QUALITY.md`'s demo-first thinking applies most directly here.

## Inputs

Phase 07's recommendations API (primary), Phase 04/05/06's APIs
(secondary, for the Live Status/Utilization sections). `DESIGN.md`'s
information architecture and Action Queue component spec.

## Dependencies

Depends on Phase 07 (Action Queue is the centerpiece) and benefits from
Phases 04-06 being done, but can be built against Phase 07's API contract
in parallel with Phase 07's implementation if the contract is agreed
first (see `ARCHITECTURE.md`'s API-contract-first note).

## Tasks

- [ ] 09.1 — `client/src/api/recommendations.js`
- [ ] 09.2 — `ActionQueueItem` component (signal, reason, action, expected impact, one primary action button) — per `DESIGN.md`, must read like a sentence
- [ ] 09.3 — `ControlTower` page: Action Queue at top, Live Status summary, Utilization summary below
- [ ] 09.4 — Utilization view (runtime vs. idle, framed against the 65-75% healthy band — `RESEARCH.md` R-002)
- [ ] 09.5 — Forecast display (at least one equipment-type/site pair, with stated factors)
- [ ] 09.6 — Mark-actioned/dismissed interaction wired to Phase 07's `PATCH` endpoint
- [ ] 09.7 — Empty Action Queue state designed deliberately (`DESIGN.md`), not just "no data"
- [ ] 09.8 — Insufficient-forecast-history state designed deliberately (REQ-019), not hidden

## Files / systems affected

`client/src/pages/ControlTower.jsx`, `client/src/api/recommendations.js`,
`client/src/components/ActionQueueItem.jsx`, this becomes the default
route (`/`) — `client/src/App.jsx`.

## Risks

This is the screen the whole differentiation argument rests on
(`problem-statement/ANALYSIS.md` §12) — a generic-looking list here
undermines Phases 04-07's work even if their logic is correct.
Mitigation: review this screen specifically against `DESIGN.md` before
calling the phase done, not just against "does it render the data."

## Acceptance criteria

- Action Queue shows real, correctly-ranked recommendations from seeded data.
- At least one anomaly, one alert, and one forecast are visibly represented, each traceable to its stated reason/factors.
- Marking an item actioned/dismissed updates the queue without a page reload feeling broken.

## Tests

Not yet run. Manual verification per `QUALITY.md`'s frontend loop, plus
the demo narrative walkthrough itself (SPOT → EXPLAIN → ACT → PREDICT →
PROVE) as an informal acceptance test.

## Exit criteria (phase gate)

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build passes
- [ ] Critical edge cases checked (empty queue, insufficient-history forecast)
- [ ] Requirements mapped (REQ-011/012/013 → `VERIFIED`)
- [ ] Known issues reviewed
- [ ] Documentation updated
- [ ] Architecture still coherent
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created
- [ ] `git status` clean
