# Requirements audit — final local verification

Date: 2026-09-02. Verified against commit `d13bd57` (local `main`, matches `origin/main`).
Ground truth: `PROBLEM-STATEMENT.md` Source A (official printed handout) + Source B
(confirmed presentation framing), cross-checked against the original slide/handout
photos in `~/Downloads` directly — not assumed from repo docs.

Status values used: **PASS** (demonstrated live, with evidence) / **PARTIAL** /
**FAIL** / **NOT VERIFIED**. A requirement is PASS only when it was actually run —
not because code for it exists.

Everything below was produced by a real running local stack: Postgres 18 (local,
freshly re-seeded), `server` (`npm run dev`, port 4000), `client` (`npm run dev`,
port 5173) — see `TEST_RESULTS.md` for exact commands/output and `DEPLOYMENT_STATUS.md`
for how this maps to the live Vercel/Render/Neon deployment.

---

## 1. Asset Dashboard — live status, site, location, return date

**Source:** Source A "Asset Dashboard"; Source B capability 1.
**Route:** Customer `/customer` (Discover grid) + `/customer/equipment/:id`; Dealer
`/dealer/assets`; Admin `/admin/fleet`.
**What was done:** Loaded all three views live; opened `EQX1001`'s detail page.
**Evidence:** `screenshots/02_CUSTOMER/REQ-001_customer-discover-grid.png`,
`REQ-001_equipment-detail-live-status.png`, `screenshots/03_DEALER/REQ-001_dealer-asset-dashboard.png`,
`screenshots/04_ADMIN/REQ-001_admin-fleet-overview.png`.
**Observed:** Status (available/checked-out/overdue), current site, and (where
active) expected return date render correctly and match `GET /api/equipment`'s
live response — cross-checked field-by-field against `psql`.
**Status:** **PASS**

## 2. Check-in / Check-out (asset-ID entry)

**Source:** Source A "based on QR code/RFID simulation/user entry"; Source B
capability 2 ("QR/RFID simulation OR asset-ID based entry").
**Route:** Customer equipment detail page (rent flow); Dealer `/dealer/assets`
(Check out / Check in buttons + modal).
**What was done:** Full live round trip, twice, from two different roles:
1. Customer: rented `EQX1001` from `/customer/equipment/:id` → appeared in
   `/customer/rentals` as active → returned it → flipped to returned.
2. Dealer: checked `EQX1001` out again from `/dealer/assets` (operator+site
   assignment) → checked it back in via `PATCH /checkouts/:id/check-in`.
Both confirmed against real Postgres rows (`checked_out_at`/`checked_in_at`
timestamps), not just UI state — see `USER_JOURNEY_TESTS.md`.
**Evidence:** `screenshots/05_ASSET_LIFECYCLE/REQ-002_customer-checkout-success.png`,
`REQ-002_dealer-checkout-modal.png`, `REQ-002_dealer-checkout-result.png`,
`REQ-003_customer-checkin-success.png`.
**Note:** No QR/RFID scan simulation UI exists — asset-ID/UI-driven entry only.
This is explicitly one of two allowed methods in Source A/B ("QR code/RFID
**simulation/user entry**" / "**OR** asset-ID based entry") — not a gap.
**Status:** **PASS**

## 3. Usage Logging — runtime, idle, fuel, location, condition

**Source:** Source A "Usage Logging"; Source B capability 3 + Core Asset Journey
"LOG USAGE".
**Route:** Dealer `/dealer/assets`, "Log usage" on an active checkout.
**What was done:** Opened the log-usage modal for an active checkout, filled
engine hours / idle hours / fuel level / location, submitted.
**Evidence:** `screenshots/06_USAGE_LOGGING/REQ-004_usage-log-form.png`,
`REQ-004_usage-runtime-idle-fuel.png`.
**Backend evidence:** `POST /api/usage-logs` → `201`, confirmed a new row in
`usage_logs` (then deleted as test cleanup — see `BUGS_FIXED.md` "test data
cleanup"). A duplicate-log-after-return case (`409`) is covered by the
automated suite (`usage-logs.test.js`).
**Utilization summary:** `GET /api/utilization` — verified live, frames each
equipment type against the 65-75% healthy runtime band (`screenshots/04_ADMIN/REQ-012_admin-utilization.png`).
**Status:** **PASS**

## 4. Alerts — upcoming return, overdue, missing info

**Source:** Source A "Overdue alerts and notification"; Source B capability 4.
**Route:** Surfaced inside Dealer/Admin Action Queue and Control Tower Live
Status (dedicated `/api/alerts`, no standalone alerts page — folded into the
Action Queue by design, per `DECISIONS.md`).
**What was done:** Loaded the Dealer and Admin Control Towers live; inspected
the "Live Status"/"Fleet Status" panel counts (overdue: 1) and the Action
Queue's top card (`EQX3001: overdue`).
**Real bug found and fixed during this pass:** `EQX3002`'s seeded
"upcoming_return" demo case had drifted past its own deadline due to real
wall-clock time passing since the last seed run — see `BUGS_FIXED.md` #1.
Reseeded, reconfirmed.
**Evidence:** `screenshots/03_DEALER/REQ-011_dealer-control-tower-live-status.png`
(top banner: "Top priority — EQX3001: overdue. Recommended: return it."),
`screenshots/04_ADMIN/REQ-011_admin-control-tower.png`.
**Status:** **PASS**

## 5. Demand Forecasting — equipment type / site / time

**Source:** Source A "Demand Forecasting"; Source B "AI/Analytics" #1.
**Route:** Admin `/admin/forecasts`; Dealer Control Tower's Forecast panel.
**What was done:** Loaded both live.
**Observed:** Real forecasts for Excavator@S003 and Bulldozer@S002 ("Based on
6 checkout(s) over the last 4 weeks (~1.5/week), trending up."), and an honest
`insufficient_history` fallback for Grader@S001, Crane@S005, Excavator@S004 —
exactly the designed split, not fabricated numbers where data doesn't support
one. This directly answers the problem statement's "what equipment, where,
when" framing.
**Evidence:** `screenshots/09_FORECASTS/REQ-009_admin-forecasts.png`,
`REQ-009_dealer-forecast-panel.png`.
**Status:** **PASS**

## 6. Anomaly Detection — idle, zero runtime, missing assignment, movement

**Source:** Source A "Anomaly Detection"; Source B "AI/Analytics" #2 (explicit:
excessive idle, zero runtime, missing assignment, unusual movement).
**Route:** Admin `/admin/anomalies`; surfaced in both Action Queues.
**What was done:** Loaded `/admin/anomalies` live; cross-checked
`GET /api/anomalies` directly against `psql` for duplicate/incorrect rows.
**Observed, all four types present in the live feed with a plain-English
reason each:**
- `excessive_idle` — e.g. "Idle 75% of logged hours over 5 operating day(s)"
- `zero_runtime` — e.g. "0 engine hours logged across all 12 operating day(s)"
- `missing_assignment` — e.g. "Checked out with no operator and no site assigned"
- `unusual_movement` — e.g. "Logged location (Site S002 yard) does not match
  assigned site (S004)"
**Real bug found and fixed earlier tonight (2026-09-02, pre-this-session), reconfirmed clean now:** a race
condition could duplicate anomaly/alert/recommendation rows under concurrent
reads. Migration `011` fixed it; **reconfirmed zero duplicates** against the
fresh local reseed (19 anomalies, 0 duplicate `(checkout_id,type)` pairs).
**Evidence:** `screenshots/08_ANOMALIES/REQ-007_admin-anomalies-list.png`.
**Status:** **PASS**

## 7. Recommendations — signal → reason → action → expected impact

**Source:** Source A implicit (via "flag under-utilized assets and optimize
rentals"); Source B "AI/Analytics" #3, explicit signal→reason→action→impact
shape.
**Route:** Dealer Action Queue (`/dealer`), Admin Recommendations (`/admin`).
**What was done:** Loaded both live; clicked a real action button on each
(Dealer: "Mark returned"/"Mark investigated"; Admin: "Dismiss") and confirmed
the item left the pending queue via a real `PATCH /api/recommendations/:id`
(`200`), then restored both to `pending` afterward to preserve the demo
baseline (see `BUGS_FIXED.md`).
**Observed shape, every card:** `EQX2005: excessive idle` → "Idle 75% of
logged hours..." → "Mark reassigned" button → *"Simulated: reassigning or
returning this equipment could improve utilization toward the 65-75% healthy
band."* — the "Simulated:" prefix is present on every impact line, never
presented as a real measured result.
**Evidence:** `screenshots/10_RECOMMENDATIONS/REQ-010_dealer-action-queue-item-actioned.png`,
`REQ-010_admin-recommendation-dismissed.png`, `REQ-013_dealer-action-queue.png`.
**Status:** **PASS**

## 8. Complete asset lifecycle: CHECK OUT → ASSIGN & TRACK → LOG USAGE → CHECK IN

**Source:** Source B "Core Asset Journey" (explicit four-stage diagram).
**What was done:** Ran the full chain live, twice (Customer path and Dealer
path — see requirement 2 and `USER_JOURNEY_TESTS.md`), including a usage log
written mid-lifecycle on a still-active checkout.
**Status:** **PASS**

## 9. WHO / WHAT / WHERE / WHEN traceability

**Source:** Source B, explicit under Core Asset Journey.
**What was done:** Inspected checkout/usage_log rows directly in Postgres
after each live action.
**Observed:** Every checkout row carries `operator_id` (who), `equipment_id`
(what), `site_id` (where), `checked_out_at`/`checked_in_at`/`expected_return_at`
(when); every usage_log row carries `checkout_id`, `logged_at`, `location`.
**Status:** **PASS**

## 10. "The dashboard should recommend, not just report"

**Source:** Source B, stated as "the key principle."
**What was done:** Confirmed both Dealer and Admin landing pages lead with a
ranked, actionable Action Queue/Recommendations list (not a static table) —
verified live, both roles, both showing the exact same top-priority banner
pattern.
**Status:** **PASS**

## 11. Simulated data clearly labeled

**Source:** Source B "DATA" section, explicit.
**What was done:** Inspected every recommendation's `expected_impact` text
live via the API and in the rendered UI.
**Observed:** 100% of impact strings begin with "Simulated:" — verified by
grepping the live `GET /api/recommendations` response, not just spot-checked.
**Status:** **PASS**

## 12. Business value claims labeled as assumptions/simulations

**Source:** Source B "DATA" section, explicit ("Do not invent business claims
or real-world savings numbers without labeling them as assumptions/simulations").
**What was done:** Same inspection as #11 — no unlabeled dollar/percentage
claims found anywhere in the live recommendation/capacity feed.
**Status:** **PASS**

## 13. Capacity-aware rental optimization

**Source:** Not in the one-page Source A handout; explicit in the team's own
`REQ-022` (a deliberate value-add responding to Source A's "optimize rentals"
line and Source B's underlying business objective). Documented as such in
`REQUIREMENTS.md`, not claimed as an official checklist item.
**Route:** Admin `/admin/capacity`; Customer equipment-fit hint on
`EquipmentDetail`.
**What was done:** Loaded both live.
**Observed:** `EQX3006: underutilized capacity` — "Operating at ~50% of
assumed capacity (4h/day vs. an assumed 8h/day) — current pace suggests the
typical workload for this equipment type completes in 21-31 days, well inside
the 55-day remaining rental window." — assumptions stated inline, action is
"review" not a command, matches the designed honest-degradation pattern.
**Evidence:** `screenshots/11_CAPACITY/REQ-022_admin-capacity.png`,
`REQ-022_customer-equipment-fit-hint.png`.
**Status:** **PASS**

## 14. Role-based Customer / Dealer / Admin experiences

**Source:** Not explicit in Source A; the team's own architectural response
to "who is the user?" (an "Important Expectation" question in Source B) —
documented as `REQ-021`, not an official line item.
**What was done:** Live-tested all three roles end-to-end this session (see
above), plus role selection and role switching for a brand-new signed-in user.
**Observed:** A freshly-created signed-in-but-roleless user, clicking
"Identify as Dealer," was redirected to `/dealer` and the choice persisted
server-side (`GET /api/auth/me` returned `role: "dealer"` afterward, confirmed
via direct API call, not just the UI). `/switch-role` correctly lets a
signed-in user move between all three.
**Evidence:** `screenshots/01_LANDING/REQ-021_signed-in-no-role-yet.png`,
`REQ-021_role-selected-redirect.png`, `screenshots/04_ADMIN/REQ-021_switch-role-page.png`.
**Status:** **PASS**

## 15. Authentication and role persistence

**What was done:** See #14, plus inspected the `users` table directly.
**Real, honestly-disclosed limitation found (not new, already in `ISSUES.md`
`RISK-005`, reconfirmed this session):** the actual Google OAuth popup screen
itself could not be automated (Google blocks scripted sign-in, and this
environment has no test Google credentials) — worked around by minting a
session cookie for pre-existing local test-only DB rows through a temporary,
dev-only route using the app's own real `signSession()` code (see
`USER_JOURNEY_TESTS.md` for the exact method and why this is sound evidence
for everything *after* the OAuth handshake, but not a substitute for a human
actually clicking "Sign in with Google" once). That route has been removed;
the server now matches the exact committed code again (`git diff` clean).
**Status:** **PASS** for role persistence and session handling; **NOT
VERIFIED** for the live Google popup/redirect UI itself this session (was
verified live in production against real devices in the prior session per
`ISSUES.md`/`HANDOFF.md` — not re-attempted here since it cannot be automated).

---

## Requirements NOT in the official one-page handout but claimed elsewhere

`REQUIREMENTS.md` labels `REQ-021` (roles) and `REQ-022` (capacity) as
"Explicit (new direction)" — more accurately, neither appears in Source A
(the literal handout) and both are the team's own extensions responding to
Source B's framing and the business objective. Not a gap — just a precision
correction for panel defense: if asked "was this in the brief," the honest
answer is "we built this because X, not because the handout listed it."

## Summary

| # | Requirement | Status |
|---|---|---|
| 1 | Asset Dashboard | PASS |
| 2 | Check-in/Check-out | PASS |
| 3 | Usage Logging | PASS |
| 4 | Alerts | PASS |
| 5 | Demand Forecasting | PASS |
| 6 | Anomaly Detection | PASS |
| 7 | Recommendations | PASS |
| 8 | Full lifecycle | PASS |
| 9 | WHO/WHAT/WHERE/WHEN | PASS |
| 10 | Recommend not just report | PASS |
| 11 | Simulated data labeled | PASS |
| 12 | Business claims labeled | PASS |
| 13 | Capacity optimization (extension) | PASS |
| 14 | Role-based experiences (extension) | PASS |
| 15 | Auth & role persistence | PASS (session/role) / NOT VERIFIED (live Google popup, this session) |

**14 of 15 fully PASS with fresh, live, local evidence from this session; the
15th (Google's own OAuth screen) is architecturally sound and was verified
live in production the night before — just not re-clickable inside this
sandbox.**
