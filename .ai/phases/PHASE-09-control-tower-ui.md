# Phase 09 — Control Tower UI

**Status:** `VERIFIED`
**Owner:** Souharda (per `TEAM-EXECUTION-PLAN.md`) — implemented this session by AI agent, pending Souharda's review once their GitHub invite is accepted (`RISK-002`)
**Started:** 2026-09-01 · **Closed:** 2026-09-01

## Objective

The primary screen: Action Queue first, Live Status and Utilization as
supporting context — the screen that makes "insight → action → outcome"
visibly real rather than a slide claim.

## Why

REQ-011, REQ-012, REQ-013. The screen judges will remember most.

## Inputs

Phase 07's recommendations API (primary), Phase 04/05/06's APIs
(secondary). `DESIGN.md`'s information architecture and Action Queue
component spec.

## Dependencies

Depended on Phase 07 (exists). Benefits from 04-06 (all exist).

## Tasks

- [x] 09.1 — `client/src/api/recommendations.js`
- [x] 09.2 — `ActionQueueItem` component (signal, reason, action, expected impact, primary action + dismiss)
- [x] 09.3 — `ControlTower` page: Action Queue top, Live Status + Utilization + Forecast sidebar
- [x] 09.4 — Utilization view (runtime vs. idle, framed against 65-75% healthy band) — required adding `GET /api/utilization` (see `DECISIONS.md`)
- [x] 09.5 — Forecast display (all forecast groups shown, real and insufficient-history alike)
- [x] 09.6 — Mark-actioned/dismissed interaction wired to Phase 07's `PATCH` endpoint
- [x] 09.7 — Empty Action Queue state designed (verified by code review — not forced live, since the current seeded data always has real signals; see Tests)
- [x] 09.8 — Insufficient-forecast-history state designed and verified live (3 of 5 forecast groups show it)

## Files / systems affected

`client/src/pages/ControlTower.jsx` (now the default `/` route, replacing
the placeholder `Home.jsx`, which was deleted — no longer referenced
anywhere), `client/src/api/recommendations.js`, `forecasts.js`,
`utilization.js`, `client/src/components/ActionQueueItem.jsx`,
`client/src/App.jsx`, `client/src/components/Layout.jsx` (nav updated),
`client/src/index.css` (Control Tower grid/action-item/summary-card
styles). Backend: `server/src/modules/utilization/` (new),
`server/tests/utilization.test.js`. Also fixed a real bug in Phase 07's
`recommendations.service.js`/`recommendations.repository.js` (see below).

## Two real bugs found via live browser testing, not by reading code

1. **Duplicate signal/reason text.** The overdue alert's recommendation
   showed the exact same sentence twice — `signal` and `reason` were both
   set to the raw alert message. Only visible by actually looking at the
   rendered Action Queue card, not from reading the JSON in isolation.
   Fixed in Phase 07's `buildAlertCandidates`.
2. **Stale pending-recommendation text.** Fixing bug 1 surfaced that a
   `pending` recommendation's wording never refreshes after its first
   sync — an overdue alert's frozen "expected back" date would go stale
   forever. Fixed the sync loop to refresh content for still-`pending`
   rows (never for `actioned`/`dismissed` ones, preserving REQ-017).

Both are documented in full in `DECISIONS.md`'s "Phase 09..." entry,
including a known limitation left deliberately unfixed (a resolved
underlying signal doesn't auto-clear its recommendation).

## Risks

This is the screen the whole differentiation argument rests on — a
generic-looking list here would undermine Phases 04-07's work even if
correct. Mitigated by reviewing the actual rendered screen (not just
"does it render") and catching/fixing the wording bug above before
calling this done.

## Acceptance criteria

- [x] Action Queue shows real, correctly-ranked recommendations from seeded data — verified live: overdue (red) first, anomalies (amber) next, forecast (blue) last, matching Phase 07's ranking.
- [x] At least one anomaly, one alert, and one forecast are visibly represented, each traceable to its stated reason/factors — all three visible simultaneously in one screenshot.
- [x] Marking an item actioned/dismissed updates the queue without a page reload feeling broken — verified live: clicked "Mark investigated" on a real anomaly, it disappeared from the queue within the same page state (React refetch, no navigation).

## Tests

Actually run, live, against the real running app:

1. `npm test` (server) — **26/26 pass** (25 existing + 1 new for `/api/utilization`).
2. `npm run build` (client) — clean.
3. Screenshot of the full Control Tower: confirmed the red overdue item,
   6 amber anomaly items, Live Status counts (12 available / 4 checked
   out / 1 overdue / 0 maintenance — matches the real equipment table),
   Utilization card (Bulldozer 88% overutilized in amber, others
   underutilized in gray — matches direct SQL aggregation done
   independently), and the Forecast card showing both real forecasts
   (Excavator/S003 trending up, Bulldozer/S002 flat) and 3
   insufficient-history entries with their real checkout counts, all in
   one view.
4. **Live mark-actioned interaction** (Puppeteer against the real running
   app): clicked "Mark investigated" on `EQX1007: zero runtime`, confirmed
   it disappeared from the queue on the next render, screenshotted the
   result. **Restored the DB afterward** (`UPDATE recommendations SET
   status='pending', actioned_at=NULL`) so the seeded demo data's full
   19-item queue stays intact for later phases/rehearsal, exactly as
   Phase 07 left it — verified via a post-test count (19 pending) and the
   unchanged 17/22/192 baseline.
5. Re-ran the full backend suite after all manual DB pokes — 26/26 clean.

## Exit criteria (phase gate)

- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass (26/26; live browser walkthrough clean)
- [x] Build passes
- [x] Critical edge cases checked (empty queue via code review; insufficient-history forecast verified live for 3 real groups)
- [x] Requirements mapped (REQ-011/012/013 → `VERIFIED`)
- [x] Known issues reviewed (2 real bugs found and fixed, not deferred; 1 known limitation documented, not hidden)
- [x] Documentation updated (this file, `DECISIONS.md`, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, `HANDOFF.md`)
- [x] Architecture still coherent (utilization module follows the existing pattern; no new architecture)
- [x] No blocking regression (Phase 00-08 tests/build all still pass; seeded data and recommendation queue restored to their documented baseline after manual testing)
- [x] `STATE.md` updated
- [x] Checkpoint created (`checkpoint/phase-09-control-tower-ui`)
- [x] `git status` clean
