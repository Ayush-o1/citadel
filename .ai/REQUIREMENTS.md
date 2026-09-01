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
| REQ-001 | Equipment inventory with live status (available/checked-out/overdue), site, location, return date | Explicit | Must-have | `phases/PHASE-01-data-model.md` | `server/src/modules/equipment/`, `client/src/pages/AssetDashboard.jsx` | `server/tests/equipment.test.js`; manual browser verification (Phase 08) | `VERIFIED` |
| REQ-002 | Check-out an asset (asset ID entry, simulated QR/RFID) with operator + site assignment | Explicit | Must-have | `phases/PHASE-03-core-apis.md` | `server/src/modules/checkouts/` | `server/tests/checkouts.test.js` | `VERIFIED` |
| REQ-003 | Check-in an asset, recording return time and final condition | Explicit | Must-have | `phases/PHASE-03-core-apis.md` | `server/src/modules/checkouts/` | `server/tests/checkouts.test.js` | `VERIFIED` |
| REQ-004 | Usage logging: runtime/engine hours, idle hours, fuel, location, condition | Explicit | Must-have | `phases/PHASE-03-core-apis.md` | `server/src/modules/usage-logs/` | `server/tests/usage-logs.test.js` | `VERIFIED` |
| REQ-005 | Every status change records who/what/where/when | Explicit | Must-have | `phases/PHASE-01-data-model.md` | `server/src/modules/checkouts/`, `usage-logs/` | `server/tests/checkouts.test.js` | `VERIFIED` |
| REQ-006 | Alerts: upcoming return, overdue, missing info | Explicit | Must-have | `phases/PHASE-04-alerts.md` | `server/src/modules/alerts/` | `server/tests/alerts.test.js` | `VERIFIED` |
| REQ-007 | Anomaly detection: excessive idle, zero runtime, missing assignment, with a stated reason per flag | Explicit | Must-have | `phases/PHASE-05-anomaly-detection.md` | `server/src/modules/anomalies/` | `server/tests/anomalies.test.js` | `VERIFIED` |
| REQ-008 | Anomaly detection: unusual/inconsistent asset movement | Explicit | Should-have | `phases/PHASE-05-anomaly-detection.md` | `server/src/modules/anomalies/` | `server/tests/anomalies.test.js` | `VERIFIED` |
| REQ-009 | Demand forecasting by equipment type, site, and time, stating an operational answer ("what, where, when") and its influencing factors | Explicit | Must-have | `phases/PHASE-06-forecasting.md` | `server/src/modules/forecasts/` | `server/tests/forecasts.test.js` | `VERIFIED` |
| REQ-010 | Recommendations: convert each signal into signal → reason → recommended action → expected impact | Explicit | Must-have | `phases/PHASE-07-recommendations.md` | `server/src/modules/recommendations/` | `server/tests/recommendations.test.js` | `VERIFIED` |
| REQ-011 | Control Tower: live status view | Explicit | Must-have | `phases/PHASE-09-control-tower-ui.md` | `client/src/pages/ControlTower.jsx` | Manual browser verification (Phase 09) | `VERIFIED` |
| REQ-012 | Control Tower: utilization view (runtime vs. idle) | Explicit | Must-have | `phases/PHASE-09-control-tower-ui.md` | `client/src/pages/ControlTower.jsx`, `server/src/modules/utilization/` | `server/tests/utilization.test.js`; manual browser verification | `VERIFIED` |
| REQ-013 | Control Tower: action queue (ranked, actionable) | Explicit | Must-have | `phases/PHASE-09-control-tower-ui.md` | `client/src/pages/ControlTower.jsx` | Manual browser verification (Phase 09 — live mark-actioned interaction) | `VERIFIED` |
| REQ-014 | Asset Dashboard screen + check-in/check-out UI | Explicit | Must-have | `phases/PHASE-08-asset-dashboard-ui.md` | `client/src/pages/AssetDashboard.jsx` | Manual browser verification (Phase 08 — live check-out/check-in cycle via Puppeteer against the real dev server) | `VERIFIED` |
| REQ-015 | Realistic simulated data (telemetry, QR/RFID, history) — clearly labeled as simulated, not real-world claims | Explicit | Must-have | `phases/PHASE-02-synthetic-data.md` | `server/db/seed.js` | Verified via psql inspection (see Phase 02 doc) | `VERIFIED` |
| REQ-016 | Any business-value claim (downtime/cost/utilization improvement) must be labeled as an assumption/simulation, never presented as a real measured result | Explicit | Must-have | `phases/PHASE-11-demo-and-defense.md` | `server/src/modules/recommendations/` | `server/tests/recommendations.test.js`; `DEMO-SCRIPT.md`'s PROVE step explicitly narrates the "Simulated:" labeling | `VERIFIED` |
| REQ-017 | Mark a recommendation as actioned/dismissed, closing the insight→action loop visibly | Implicit — needed to demonstrate "ACT" in the demo narrative | Should-have | `phases/PHASE-07-recommendations.md` | `server/src/modules/recommendations/` | `server/tests/recommendations.test.js` | `VERIFIED` |
| REQ-018 | Reject a duplicate check-out of an already-checked-out asset | Implicit — data integrity edge case from problem statement's "what happens when data is missing or incorrect?" | Must-have | `phases/PHASE-03-core-apis.md` | `server/src/modules/checkouts/` | `server/tests/checkouts.test.js` | `VERIFIED` |
| REQ-019 | Forecast degrades honestly ("insufficient history") rather than fabricating a number when an equipment type/site pair lacks data | Implicit — problem statement explicitly warns against pretending a model is meaningful when data can't support it | Must-have | `phases/PHASE-06-forecasting.md` | `server/src/modules/forecasts/` | `server/tests/forecasts.test.js` | `VERIFIED` |
| REQ-020 | One optional "wow" feature, chosen for judging value vs. risk (candidate: rule-driven natural-language summary of the top Action Queue item) | Explicit (optional per problem statement) | Stretch | `phases/PHASE-10-integration-and-polish.md` | `client/src/utils/summarize.js`, `client/src/pages/ControlTower.jsx` | Manual browser verification (Phase 10) | `VERIFIED` |
| REQ-021 | Three distinct role experiences (Customer/Dealer/Caterpillar Admin) behind real Google OAuth — a signed-in user picks a role once (server-persisted), changeable anytime via "Switch role" | Explicit (new direction, 2026-09-01; auth landed same night) | Must-have | `.ai/FRONTEND-REBUILD-PLAN.md`, `.ai/FRONTEND-ROLE-MATRIX.md`, `.ai/DECISIONS.md` | `server/src/modules/auth/`, `server/db/migrations/010_create_users.sql`, `client/src/app/`, `client/src/pages/{customer,dealer,admin}/` | 32/32 backend tests; live end-to-end verification incl. a real signed-in Google account and a scripted DB-backed ownership test | `VERIFIED` |
| REQ-022 | Capacity-aware rental optimization: compare observed usage against an assumed capacity and a historical typical-workload baseline, produce an estimated completion range with visible assumptions, and recommend review (never a command) only when confidently flagged | Explicit (new direction, 2026-09-01) | Must-have | `.ai/FRONTEND-REBUILD-PLAN.md` section 4, `.ai/DECISIONS.md`'s "RB-6" entry | `server/src/modules/capacity/`, `client/src/pages/admin/Capacity.jsx`, `client/src/pages/customer/EquipmentDetail.jsx` | `server/tests/capacity.test.js` (2/2); manual browser verification (RB-7) | `VERIFIED` |
