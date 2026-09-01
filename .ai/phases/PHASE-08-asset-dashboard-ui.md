# Phase 08 — Asset Dashboard UI

**Status:** `NOT_STARTED`
**Owner:** unassigned — see `../PLAYBOOK.md` team table
**Started:** — · **Closed:** —

## Objective

The inventory screen: every asset's live status, site, location, return
date, with check-out/check-in actions inline.

## Why

REQ-001, REQ-011 (partially), REQ-014. This is the "do the work" screen —
see `DESIGN.md`'s information architecture (Asset Dashboard vs. Control
Tower split).

## Inputs

Phase 03's `equipment`/`checkouts` APIs. `DESIGN.md`'s component
conventions (status badge, table).

## Dependencies

Depends on Phase 03 (needs real endpoints to call). Independent of
Phases 04-07 — can be built in parallel with the analytics phases once
Phase 03's API contract is stable.

## Tasks

- [ ] 08.1 — `client/src/api/equipment.js`, `client/src/api/checkouts.js` (thin fetch wrappers, matching `items.js`'s pattern)
- [ ] 08.2 — `StatusBadge` component (`DESIGN.md`'s fixed status vocabulary — neutral/amber/red)
- [ ] 08.3 — `AssetDashboard` page: table of equipment (status, site, location, return date), sortable
- [ ] 08.4 — Check-out form/modal (asset-ID entry, operator, site — simulated QR/RFID per problem statement)
- [ ] 08.5 — Check-in action (condition, timestamp)
- [ ] 08.6 — Loading / error / empty states (existing components)
- [ ] 08.7 — Reject-duplicate-checkout error surfaced clearly in the UI (not a silent failure)

## Files / systems affected

`client/src/pages/AssetDashboard.jsx`, `client/src/api/equipment.js`,
`client/src/api/checkouts.js`, `client/src/components/StatusBadge.jsx`,
one route added in `client/src/App.jsx`.

## Risks

None specific beyond the general frontend verification loop
(`QUALITY.md`) — this is the most conventional module in the whole plan.

## Acceptance criteria

- Every equipment row shows correct live status, site, location, return date.
- Check-out and check-in both work end-to-end against the real API.
- Attempting to check out an already-checked-out asset shows a clear error, not a crash or silent no-op.

## Tests

Not yet run. Manual verification per `QUALITY.md`'s frontend loop (build, run, click through happy path + the duplicate-checkout edge case + empty/loading states).

## Exit criteria (phase gate)

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build passes
- [ ] Critical edge cases checked (duplicate checkout error path)
- [ ] Requirements mapped (REQ-001 → `VERIFIED`, REQ-014 → `VERIFIED`)
- [ ] Known issues reviewed
- [ ] Documentation updated
- [ ] Architecture still coherent
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created
- [ ] `git status` clean
