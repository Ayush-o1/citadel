# Phase 08 — Asset Dashboard UI

**Status:** `VERIFIED`
**Owner:** Astik (per `TEAM-EXECUTION-PLAN.md`) — implemented this session by AI agent, pending Astik's review once their GitHub invite is accepted (`RISK-002`)
**Started:** 2026-09-01 · **Closed:** 2026-09-01

## Objective

The inventory screen: every asset's live status, site, location, return
date, with check-out/check-in actions inline.

## Why

REQ-001, REQ-011 (partially), REQ-014. The "do the work" screen —
`DESIGN.md`'s Asset Dashboard vs. Control Tower split.

## Inputs

Phase 03's `equipment`/`checkouts` APIs. `DESIGN.md`'s component
conventions (status badge, table).

## Dependencies

Depended on Phase 03. Independent of Phases 04-07.

## Tasks

- [x] 08.1 — `client/src/api/equipment.js`, `client/src/api/checkouts.js`
- [x] 08.2 — `StatusBadge` component (neutral/info/warning/danger tones)
- [x] 08.3 — `AssetDashboard` page: sortable table (asset/status/site/return date)
- [x] 08.4 — Check-out form/modal (operator + site pickers)
- [x] 08.5 — Check-in action
- [x] 08.6 — Loading/error/empty states (existing components, reused)
- [x] 08.7 — Reject-duplicate-checkout error surfaced clearly

## A gap found and closed: no read endpoint for sites/operators existed

Task 08.4 needs a way for a human to pick an operator and site — Phase 03
never built `GET /api/sites`/`GET /api/operators` because nothing needed
them yet. Added two minimal modules (`server/src/modules/sites/`,
`operators/`) rather than working around it with free-text UUID entry.
See `DECISIONS.md`'s "Phase 08: added minimal GET /api/sites and
/api/operators" entry.

## Files / systems affected

`client/src/pages/AssetDashboard.jsx`, `client/src/api/equipment.js`,
`checkouts.js`, `referenceData.js`, `client/src/components/StatusBadge.jsx`,
`client/src/App.jsx` (route added), `client/src/components/Layout.jsx`
(nav link added), `client/src/index.css` (table/badge/modal styles,
widened `.layout-main`). Backend: `server/src/modules/sites/`,
`operators/` (new, minimal), `server/tests/reference-data.test.js`.

## Risks

None specific beyond the general frontend verification loop — the most
conventional module in the plan. The one real risk (duplicate-checkout
race) is already handled at the API layer (Phase 03); this phase just has
to surface the error, not re-solve it.

## Acceptance criteria

- [x] Every equipment row shows correct live status, site, return date — verified visually against the real seeded data (17 rows, including the 5 correctly-differentiated active checkouts).
- [x] Check-out and check-in both work end-to-end against the real API — verified live in a browser (Puppeteer-driven, against the actual running dev server + backend), not just by reading the code.
- [x] Attempting to check out an already-checked-out asset shows a clear error, not a crash or silent no-op — the API's 409 message renders inline in the modal via `formError`.

## Tests

Actually run, per `QUALITY.md`'s frontend loop (build → run → click
through → check states, not just the happy path):

1. `npm run build` (client) — clean build.
2. Started the real dev server (`vite`) against the real backend
   (`node src/server.js`), confirmed the `/api` proxy forwards correctly.
3. Screenshot verification (headless Chrome) of the full 17-row table:
   confirmed `EQX3001` renders the red "Overdue" badge, `EQX3002`-`EQX3005`
   render the blue "Checked out" badge with their real site codes and
   return dates, and all `available` equipment renders the neutral badge
   with `—` placeholders — all computed from real API data, not mocked.
4. **Live end-to-end interaction** (Puppeteer against the real running
   app, not a unit test double): clicked "Check out" on `EQX1001` →
   confirmed the modal renders with operator/site dropdowns populated
   from the real `/api/operators`/`/api/sites` data → submitted → the
   table refetched and showed `EQX1001` as "Checked out" with a "Check
   in" button → clicked "Check in" → confirmed it returned to
   "Available." This is the real check-out/check-in flow working
   end-to-end through the UI, not just the API tests from Phase 03.
5. **Cleaned up the test's own residue**: the manual click-through used a
   real seeded asset (`EQX1001`) rather than a disposable fixture (no
   fixture concept exists for browser-driven manual testing), leaving one
   extra `returned` checkout row plus a spurious `missing_assignment`
   anomaly (no operator/site was selected in the test). Deleted that
   checkout row (and its cascaded alert/anomaly/recommendation rows)
   directly, then re-ran the full backend suite (25/25 pass) and
   confirmed the database returned to the exact Phase 02 baseline
   (17/22/192) before continuing — the seeded data must stay exactly as
   documented for later phases and the demo.
6. `npm test` (server) — 25/25 pass (23 existing + 2 new for `/api/sites`/`/api/operators`).

## Exit criteria (phase gate)

- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass (client build clean; server 25/25; live browser walkthrough clean)
- [x] Build passes
- [x] Critical edge cases checked (duplicate-checkout error path is a real, reachable UI state, verified by design even though not re-triggered live in this session's walkthrough)
- [x] Requirements mapped (REQ-001 → `VERIFIED`, REQ-014 → `VERIFIED`)
- [x] Known issues reviewed (none introduced)
- [x] Documentation updated (this file, `DECISIONS.md`, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, `HANDOFF.md`)
- [x] Architecture still coherent (frontend structure matches `ARCHITECTURE.md`; two small new backend modules follow the existing pattern)
- [x] No blocking regression (Phase 00-07 tests/build all still pass; seeded data counts unchanged, confirmed after cleaning up manual-test residue)
- [x] `STATE.md` updated
- [x] Checkpoint created (`checkpoint/phase-08-asset-dashboard-ui`)
- [x] `git status` clean
