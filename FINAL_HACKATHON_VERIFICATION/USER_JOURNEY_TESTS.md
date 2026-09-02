# User journey tests — what was actually clicked, in order

Real Playwright-driven Chromium, real local dev servers, real Postgres.
Screenshots referenced here live in `screenshots/`; see `EVIDENCE_INDEX.md`
for the full requirement mapping.

## A note on authentication for this pass

Google's real OAuth screen cannot be automated (Google actively blocks
scripted/headless sign-in, and no test Google account credentials exist in
this environment). Rather than skip live UI testing of every authenticated
screen, or guess, this was flagged to you directly mid-session and you chose
the option to add a **temporary, dev-only test-login route** (fully
described and confirmed-removed in `BUGS_FIXED.md` #2). It signs a real
session cookie for a pre-existing local `users` row using the app's own
`signSession()` — functionally identical to what happens after a real Google
sign-in completes, from the point the session cookie is set onward. This
means: everything from "already signed in" through every subsequent click is
real, live, unmocked testing. The one thing genuinely **not** re-tested this
session is the Google popup/redirect screen itself — that was verified live
in production the night before, across real devices, per `ISSUES.md`.

---

## Landing page (unauthenticated)

1. `GET /` at 1440×900 → entry page renders, three role cards (Customer/
   Dealer/Caterpillar Admin), each with a photo, tagline, and an "Identify
   as X" button carrying a Google icon.
2. Resized to 390×844 (mobile) → reflows cleanly to a single column.

No errors either viewport. `screenshots/01_LANDING/`.

## Customer journey

1. Signed in as `verify-customer@citadel.test` (role: customer).
2. `/customer` → Discover grid renders all available equipment with type/status.
3. Opened `/customer/equipment/:id` for `EQX1001` → live status, capacity-fit
   hint both render.
4. Filled a 7-day-out return date, clicked "Rent" → `POST /api/checkouts` →
   `201`. Confirmed in Postgres: new `checkouts` row, `equipment.status`
   flipped to `checked_out`.
5. `/customer/rentals` → `EQX1001` appears as active.
6. Clicked "Return" → `PATCH /checkouts/:id/check-in` → `200`. Confirmed:
   `checked_in_at` set, status `returned`, equipment back to `available`.
7. **Edge case:** navigated to `/customer/equipment/<random-uuid>` → clean
   "Equipment not found" error state, no crash, no console error beyond the
   expected `404` network log.
8. Mobile pass (390×844): Discover grid reflows correctly.

Zero unexpected console/network errors. `screenshots/02_CUSTOMER/`,
`screenshots/05_ASSET_LIFECYCLE/`, `screenshots/13_ERROR_STATES/`.

## Dealer journey

1. Signed in as `verify-dealer@citadel.test` (role: dealer).
2. `/dealer` → Control Tower: Action Queue (21 items, correctly ranked —
   alert/anomaly-sourced first, forecast-sourced last), Live Status (15
   available / 5 checked-out / 1 overdue / 0 maintenance), Utilization
   (per-type idle%), Forecast panel.
3. `/dealer/assets` → Asset Dashboard table, sortable, all 21 units.
4. Clicked "Check out" on the first available row (`EQX1001`, since it had
   just been returned by the Customer step above) → modal opened, asked for
   operator + site (both optional selects, matching the schema's nullable
   `operator_id`/`site_id`) → submitted → `POST /api/checkouts` → `201`.
   Confirmed live in Postgres.
5. Clicked "Log usage" on an active checkout → filled engine hours, idle
   hours, fuel level, location → submitted → `POST /api/usage-logs` → `201`.
   (This deliberately-mismatched test location correctly triggered a real
   `unusual_movement` anomaly — direct evidence the anomaly engine reacts to
   genuinely new data, not canned seed rows. Cleaned up after, see
   `BUGS_FIXED.md` #3.)
6. Back on `/dealer`, clicked the top Action Queue item's action button
   (`EQX3001: overdue` → "Mark returned") → `PATCH /api/recommendations/:id`
   → `200`, item left the pending list. Reverted after, to preserve the
   demo's original top-priority banner.
7. **Edge case, API-level:** attempted `POST /api/checkouts` against
   `EQX3001`, which was already active → `409 "Equipment is already checked
   out"` — correct rejection, evidence saved to
   `tests/browser/dup-checkout-response.json`.
8. Checked `EQX1001` back in (`PATCH /checkouts/:id/check-in` → `200`) as
   cleanup, restoring it to `available`.
9. Mobile pass (390×844): both Control Tower and Asset Dashboard load and
   render without errors — see `REMAINING_ISSUES.md` for an honest note on
   mobile Action Queue length/density.

`screenshots/03_DEALER/`, `screenshots/05_ASSET_LIFECYCLE/`,
`screenshots/06_USAGE_LOGGING/`, `screenshots/09_FORECASTS/`,
`screenshots/10_RECOMMENDATIONS/`, `screenshots/12_MOBILE/`.

## Caterpillar Admin journey

1. Signed in as `verify-admin@citadel.test` (role: admin).
2. `/admin` → Fleet Control Tower: same recommendation-queue-first pattern
   as Dealer, Fleet Status panel, Exceptions summary (High-severity
   anomalies: 2, Rentals below capacity: 1, Equipment with no home site: 15,
   Types outside healthy band: 4).
3. `/admin/fleet` → full fleet table.
4. `/admin/utilization` → per-type runtime vs. idle, matches Dealer's panel
   (same backend endpoint, correctly shared).
5. `/admin/anomalies` → dedicated list, all four anomaly types present with
   reasons.
6. `/admin/forecasts` → same forecast data as Dealer's panel.
7. `/admin/capacity` → `EQX3006: underutilized capacity`, assumptions stated
   inline.
8. Clicked "Dismiss" on a recommendation → `PATCH` → `200`, confirmed removed
   from the pending list. Reverted after.
9. `/switch-role` → renders all three role cards, current role (Admin)
   marked.
10. Mobile pass (390×844): Control Tower loads; see `REMAINING_ISSUES.md`.

`screenshots/04_ADMIN/`, `screenshots/08_ANOMALIES/`, `screenshots/09_FORECASTS/`,
`screenshots/11_CAPACITY/`, `screenshots/10_RECOMMENDATIONS/`.

## New-user role selection (REQ-021 persistence)

First attempt used an imprecise Playwright locator (`getByText(/dealer/i)`,
which matched non-interactive text rather than the actual button) and
silently didn't click anything — caught by checking `GET /api/auth/me`
afterward and seeing `role` was still `null`. This was a **test script bug**,
not an app bug — corrected by targeting the real accessible button
(`getByRole('button', { name: /identify as dealer/i })`) and re-run:

```
before: {"role": null}
clicked "Identify as Dealer"
url after click: http://localhost:5173/dealer   <- real client-side redirect
after:  {"role": "dealer"}                       <- confirmed via direct API call
```

Role selection and persistence is real and working. `screenshots/01_LANDING/REQ-021_role-selected-redirect.png`.

## Cleanup performed after all of the above

See `BUGS_FIXED.md` #3 for the full list — net effect: local DB is back to
the intended demo baseline (21 equipment / 257 usage_logs / 6 active
checkouts / 0 duplicate anomalies / original top-priority recommendation),
plus 2 extra fully-closed checkout rows from this session's own genuine
round-trip testing (not corruption). The 4 verification-only user accounts
and the temporary test-login route are both fully removed.
