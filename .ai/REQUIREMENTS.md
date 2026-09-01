# Requirements traceability

Populated from the official problem statement (received 2026-09-01) via
`problem-statement/ANALYSIS.md`. Nothing here is "done" because code
exists — it's done when it's designed, built, tested, and verified.

## Format

**Type:** `Explicit` (stated directly in the problem statement) or
`Implicit` (inferred — note the reasoning in `DECISIONS.md` if it's not
obvious).

**Priority:** `Must-have` / `Should-have` / `Nice-to-have` / `Stretch` — see
`QUALITY.md` for the MVP-control rules governing this.

**Status:** `NOT_STARTED` · `DESIGNED` · `IMPLEMENTED` · `TESTED` · `VERIFIED`
· `DEFERRED` (explicitly cut, with reason) · `WON'T_DO`

## Answering the standard questions

At a glance: filter `Status = VERIFIED` for done, `DESIGNED`/`IMPLEMENTED`
for partial, `NOT_STARTED` for missing, `DEFERRED` for optional-and-cut
(never silently dropped).

## Requirements

| ID | Requirement | Type | Priority | Design | Code | Test | Status |
|---|---|---|---|---|---|---|---|
| REQ-001 | Equipment inventory with live status (available/checked-out/overdue), site, location, return date | Explicit | Must-have | `phases/PHASE-01-data-model.md` | `server/src/modules/equipment/` | — | `NOT_STARTED` |
| REQ-002 | Check-out an asset (asset ID entry, simulated QR/RFID) with operator + site assignment | Explicit | Must-have | `phases/PHASE-03-core-apis.md` | `server/src/modules/checkouts/` | — | `NOT_STARTED` |
| REQ-003 | Check-in an asset, recording return time and final condition | Explicit | Must-have | `phases/PHASE-03-core-apis.md` | `server/src/modules/checkouts/` | — | `NOT_STARTED` |
| REQ-004 | Usage logging: runtime/engine hours, idle hours, fuel, location, condition | Explicit | Must-have | `phases/PHASE-03-core-apis.md` | `server/src/modules/usage-logs/` | — | `NOT_STARTED` |
| REQ-005 | Every status change records who/what/where/when | Explicit | Must-have | `phases/PHASE-01-data-model.md` | `server/src/modules/checkouts/`, `usage-logs/` | — | `NOT_STARTED` |
| REQ-006 | Alerts: upcoming return, overdue, missing info | Explicit | Must-have | `phases/PHASE-04-alerts.md` | `server/src/modules/alerts/` | — | `NOT_STARTED` |
| REQ-007 | Anomaly detection: excessive idle, zero runtime, missing assignment, with a stated reason per flag | Explicit | Must-have | `phases/PHASE-05-anomaly-detection.md` | `server/src/modules/anomalies/` | — | `NOT_STARTED` |
| REQ-008 | Anomaly detection: unusual/inconsistent asset movement | Explicit | Should-have | `phases/PHASE-05-anomaly-detection.md` | `server/src/modules/anomalies/` | — | `NOT_STARTED` |
| REQ-009 | Demand forecasting by equipment type, site, and time, stating an operational answer ("what, where, when") and its influencing factors | Explicit | Must-have | `phases/PHASE-06-forecasting.md` | `server/src/modules/forecasts/` | — | `NOT_STARTED` |
| REQ-010 | Recommendations: convert each signal into signal → reason → recommended action → expected impact | Explicit | Must-have | `phases/PHASE-07-recommendations.md` | `server/src/modules/recommendations/` | — | `NOT_STARTED` |
| REQ-011 | Control Tower: live status view | Explicit | Must-have | `phases/PHASE-09-control-tower-ui.md` | `client/src/pages/ControlTower.jsx` | — | `NOT_STARTED` |
| REQ-012 | Control Tower: utilization view (runtime vs. idle) | Explicit | Must-have | `phases/PHASE-09-control-tower-ui.md` | `client/src/pages/ControlTower.jsx` | — | `NOT_STARTED` |
| REQ-013 | Control Tower: action queue (ranked, actionable) | Explicit | Must-have | `phases/PHASE-09-control-tower-ui.md` | `client/src/pages/ControlTower.jsx` | — | `NOT_STARTED` |
| REQ-014 | Asset Dashboard screen + check-in/check-out UI | Explicit | Must-have | `phases/PHASE-08-asset-dashboard-ui.md` | `client/src/pages/AssetDashboard.jsx` | — | `NOT_STARTED` |
| REQ-015 | Realistic simulated data (telemetry, QR/RFID, history) — clearly labeled as simulated, not real-world claims | Explicit | Must-have | `phases/PHASE-02-synthetic-data.md` | `server/db/seed.js` | — | `NOT_STARTED` |
| REQ-016 | Any business-value claim (downtime/cost/utilization improvement) must be labeled as an assumption/simulation, never presented as a real measured result | Explicit | Must-have | `phases/PHASE-11-demo-and-defense.md` | demo materials | — | `NOT_STARTED` |
| REQ-017 | Mark a recommendation as actioned/dismissed, closing the insight→action loop visibly | Implicit — needed to demonstrate "ACT" in the demo narrative | Should-have | `phases/PHASE-07-recommendations.md` | `server/src/modules/recommendations/` | — | `NOT_STARTED` |
| REQ-018 | Reject a duplicate check-out of an already-checked-out asset | Implicit — data integrity edge case from problem statement's "what happens when data is missing or incorrect?" | Must-have | `phases/PHASE-03-core-apis.md` | `server/src/modules/checkouts/` | — | `NOT_STARTED` |
| REQ-019 | Forecast degrades honestly ("insufficient history") rather than fabricating a number when an equipment type/site pair lacks data | Implicit — problem statement explicitly warns against pretending a model is meaningful when data can't support it | Must-have | `phases/PHASE-06-forecasting.md` | `server/src/modules/forecasts/` | — | `NOT_STARTED` |
| REQ-020 | One optional "wow" feature, chosen for judging value vs. risk (candidate: rule-driven natural-language summary of the top Action Queue item) | Explicit (optional per problem statement) | Stretch | `phases/PHASE-10-integration-and-polish.md` | TBD | — | `NOT_STARTED` |
