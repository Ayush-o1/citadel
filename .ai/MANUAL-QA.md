# Manual QA checklist

For manual testing only — automated coverage already exists in
`server/tests/` (28/28 passing as of the RB-6 session; see `STATE.md`).
This checklist is for a human clicking through the real app.

**Everything below this notice describes the pre-rebuild, single-persona
app** (routes `/` and `/assets`, no role concept). It's kept as-is for
historical/regression reference — the underlying Dealer functionality it
describes (checkout/check-in/usage logging/Action Queue) still exists,
just moved to `/dealer` and `/dealer/assets`. **It has not been rewritten
for the three-role rebuild (RB-1..RB-6, see `FRONTEND-REBUILD-PLAN.md`).**

What RB-7 (this session) actually verified live in a browser via
Playwright, for the current app — start at `/` (role entry), then:

- **Customer** (`/customer`, `/customer/equipment/:id`,
  `/customer/rentals`): role entry → discover (type filter tested) →
  equipment detail (capacity-fit hint shown when a type baseline exists)
  → rent → appears in My Rentals as "Checked out" → return → flips to
  "Returned". Verified as a full live round trip against real DB writes,
  not mocked. Mobile viewport (390px) reflow checked.
- **Dealer** (`/dealer`, `/dealer/assets`): Control Tower (Action Queue
  incl. the new capacity signal, Live Status, Utilization, Forecast) and
  Asset Dashboard both render real data; existing checkout/check-in/
  usage-log flows unchanged (moved, not rebuilt). Mobile table
  horizontal-scroll fallback checked.
- **Caterpillar Admin** (`/admin`, `/admin/utilization`,
  `/admin/capacity`, `/admin/anomalies`, `/admin/forecasts`,
  `/admin/recommendations`): all five (now six) views render real
  fleet-wide data, including the new Capacity page's flagged-vs-
  insufficient-history sections.
- Zero console/page errors across every screen checked, both viewports.

**Not yet done by any session:** a human (not just Playwright) has not
clicked through the new role UIs; edge cases beyond the ones above
(empty states for a customer with zero rentals under a name that's never
rented, role-switch mid-form, etc.) are untested. Do that before treating
the three-role rebuild as demo-ready.

---

## Original (pre-rebuild) checklist below — Dealer-only, historical

## Before you start

- Frontend (pre-rebuild routes): **http://localhost:5173/** (Control
  Tower) and **http://localhost:5173/assets** (Asset Dashboard) — now
  **http://localhost:5173/dealer** and **http://localhost:5173/dealer/assets**
- Backend/API: **http://localhost:4000/api/...**
- Both are already running — don't restart them mid-session unless a test
  says to.
- Original seeded baseline this checklist was written against: **17
  equipment, 22 checkouts, 192 usage_logs, 19 pending recommendations**.
  RB-6 added a Layer 3 (see `DECISIONS.md`) — current baseline is **21
  equipment, 26 checkouts, 257 usage_logs**. Recompute expected counts
  accordingly if re-running this checklist verbatim.
- **Real actions leave real residue.** Checking out a real seeded asset
  (not a throwaway one) and never checking it back in changes the demo
  state permanently. If you want to undo an action:
  - Checked something out by mistake → check it back in.
  - Marked a recommendation actioned/dismissed by mistake → this SQL
    restores every recommendation to pending:
    `UPDATE recommendations SET status='pending', actioned_at=NULL WHERE status != 'pending';`
  - There is no one-command "full reset" script — that's a real gap if
    you need to reset the seeded data itself (equipment/checkouts/usage_logs),
    not a bug to silently patch around during this QA pass.

---

## A. Environment

- [ ] **T-001** — Open http://localhost:4000/api/health. **Expect:** `{"success":true,"data":{"status":"ok",...,"database":"connected"}}`.
- [ ] **T-002** — Open http://localhost:5173/. **Expect:** Control Tower loads, no blank page, no visible crash.
- [ ] **T-003** — Open browser DevTools console on that page. **Expect:** no red errors on load.

## B. Startup / navigation

- [ ] **T-004** — Click "Asset Dashboard" in the top nav. **Expect:** navigates to `/assets`, table loads.
- [ ] **T-005** — Click "Control Tower" in the top nav. **Expect:** navigates back to `/`, Action Queue loads.
- [ ] **T-006** — Visit a nonexistent route, e.g. http://localhost:5173/nope. **Expect:** a 404/not-found page, not a blank screen or crash.

## C. Dashboard (both screens)

- [ ] **T-007** — Asset Dashboard: confirm all 17 equipment rows are listed with a status badge, site, return date, type.
- [ ] **T-008** — Click the "Asset" column header. **Expect:** table re-sorts alphabetically; click again, sort reverses.
- [ ] **T-009** — Click "Status" column header. **Expect:** rows group by status.
- [ ] **T-010** — Control Tower: confirm the "Live status" panel counts (available/checked out/overdue/maintenance) match what you count manually on the Asset Dashboard.
- [ ] **T-011** — Control Tower: confirm the "Top priority" banner at the top of the Action Queue shows a real, non-empty sentence matching the first card below it.

## D. Asset lifecycle (checkout / check-in)

Use an equipment that is currently `Available` and **not** `EQX1002` or
`EQX1007` (reserved for section I — don't disturb them).

- [ ] **T-012** — Click "Check out" on an available asset. Fill in an operator and site, confirm. **Expect:** modal closes, row updates to "Checked out" with the chosen site and no errors.
- [ ] **T-013** — Try to check out the *same* asset again (open the row's action again — it should now say "Check in", so instead: open two browser tabs, or just note the button correctly changed to "Check in" and no "Check out" option remains). **Expect:** the UI itself prevents a double check-out by only offering "Check in" once checked out.
- [ ] **T-014** — Click "Check in" on the asset you checked out in T-012. **Expect:** row returns to "Available", site/return-date clear.
- [ ] **T-015** — Check out an asset **without** selecting an operator or site (leave both "— none —"). **Expect:** succeeds (this is intentionally allowed — it's what produces a `missing_assignment` anomaly, exactly like the official `EQX1002`/`EQX1007` pattern). Check it back in when done unless you want to see it flow through to the Action Queue first (see T-034).

## E. Usage logging

Requires a checked-out asset — check one out first if needed.

- [ ] **T-016** — On a checked-out asset, click "Log usage." Enter a date, e.g. 6 engine hours / 1 idle hour, submit. **Expect:** success notice, modal closes.
- [ ] **T-017** — Log usage again for the **same asset and same date**. **Expect:** a clear inline error (duplicate log for that date), not a silent failure or crash.
- [ ] **T-018** — Log usage with a **negative** number in engine hours or idle hours. **Expect:** rejected with a validation message, not accepted.
- [ ] **T-019** — Log usage with idle hours much greater than engine hours (e.g. 1 engine / 9 idle) for a checked-out asset, then check the Control Tower. **Expect:** an `excessive_idle` anomaly for that asset appears in the Action Queue (idle ratio > 40%).
- [ ] **T-020** — Check the asset back in, then try to log usage against that same (now-closed) checkout via the same asset row. **Expect:** the "Log usage" option is gone once checked in (only checked-out assets show it).

## F. Alerts

- [ ] **T-021** — On the Control Tower, find `EQX3001`. **Expect:** red "Overdue" card in the Action Queue, with the real expected-return date in the reason text.
- [ ] **T-022** — Look for `EQX3002` in the underlying data (it won't have its own Action Queue card — upcoming-return is informational only by design). Confirm via API: `curl http://localhost:4000/api/alerts` and look for `"equipment_code":"EQX3002"`, `"type":"upcoming_return"`. **Expect:** present in the alerts API even though it doesn't get its own recommendation card.
- [ ] **T-023** — Find `EQX3003` in the Action Queue. **Expect:** an amber "missing assignment" card (it's actively checked out with no operator/site).

## G. Anomalies

- [ ] **T-024** — Find `EQX1001` in the Action Queue. **Expect:** `excessive_idle`, reason states "Idle 87% of logged hours over 15 operating day(s)."
- [ ] **T-025** — Find `EQX3004` in the Action Queue. **Expect:** `unusual_movement`, reason mentions a logged location not matching the assigned site.
- [ ] **T-026** — Confirm `EQX1003` and `EQX1005` do **not** appear anywhere in the Action Queue. **Expect:** absent — these are the well-utilized official rows and must stay clean.

## H. Forecasting

- [ ] **T-027** — Control Tower "Forecast" panel: find `Excavator @ S003`. **Expect:** a real number and a factors sentence mentioning checkout count and trend (e.g. "trending up").
- [ ] **T-028** — Find `Grader @ S001` in the same panel. **Expect:** an honest "insufficient history" message with a real checkout count — no fabricated number.
- [ ] **T-029** — Confirm the Excavator/S003 forecast also appears as a `Mark extended` card in the Action Queue (forecast-sourced recommendations rank last).

## I. Recommendations (Action Queue actions)

- [ ] **T-030** — Click "Dismiss" on any Action Queue card. **Expect:** it disappears from the queue.
- [ ] **T-031** — Reload the page. **Expect:** the dismissed card does **not** reappear.
- [ ] **T-032** — Click the primary action button (e.g. "Mark investigated") on a different card. **Expect:** it disappears, and the Live Status/Utilization panels remain correct.
- [ ] **T-033** — Confirm every visible card's italic line starts with the word **"Simulated:"**. **Expect:** true for every card, no exceptions — this is a hard requirement (REQ-016), not a style choice.

## Official Caterpillar sample: EQX1002 / EQX1007 (read-only — do not check these out during QA)

- [ ] **T-034** — On the Asset Dashboard, confirm `EQX1002` and `EQX1007` both show status **Available** (they're historical, already-returned checkouts).
- [ ] **T-035** — On the Control Tower, confirm **both** produce a `zero_runtime` card ("0 engine hours logged across all N operating day(s)").
- [ ] **T-036** — Confirm **both** also produce a `missing_assignment` card ("Checked out with no operator and no site assigned").
- [ ] **T-037** — Confirm **both** also produce an `excessive_idle` card (0 engine hours mathematically means 100% idle ratio — this is correct, not a duplicate bug).
- [ ] **T-038** — Via API, `curl http://localhost:4000/api/equipment` and find `EQX1002`/`EQX1007` — confirm `"home_site": null` and no active checkout (both already returned).

## J. End-to-end workflow

- [ ] **T-039** — Full chain on a throwaway available asset (not EQX1002/EQX1007): **CHECK OUT** (no operator/site) → **LOG USAGE** (high idle) → go to Control Tower, **confirm two cards appear** (missing_assignment + excessive_idle) → **ACT** (mark one investigated) → confirm it's gone → **CHECK IN** the asset. **Expect:** every step works without a page reload fixing anything, no console errors at any step.

## K. Edge cases / negative testing

- [ ] **T-040** — Check-out form: submit with no operator/site at all. **Expect:** succeeds (both are optional by design — see T-015).
- [ ] **T-041** — Try checking in an asset that's already `Available` — this shouldn't be possible via the UI (no "Check in" button shows), confirm that's the case.
- [ ] **T-042** — Via API: `curl -X POST http://localhost:4000/api/checkouts -H "Content-Type: application/json" -d '{"equipment_id":"00000000-0000-0000-0000-000000000000"}'`. **Expect:** `404`, equipment not found — not a 500.
- [ ] **T-043** — Via API: `curl -X POST http://localhost:4000/api/checkouts -H "Content-Type: application/json" -d '{"equipment_id":"not-a-uuid"}'`. **Expect:** `400` with a field-level validation message.
- [ ] **T-044** — Via API: check out a real available asset's id twice in a row (same `equipment_id`). **Expect:** first `201`, second `409` ("already checked out").
- [ ] **T-045** — Via API: `curl http://localhost:4000/api/equipment/not-a-uuid`. **Expect:** `400`, not a crash.
- [ ] **T-046** — Log usage with an absurdly large number, e.g. `999999` engine hours. **Expect:** accepted (no upper bound is enforced — note whether this feels like a real gap or an acceptable one for this scale; report it either way, don't silently decide).
- [ ] **T-047** — Refresh the browser mid-way through filling out the check-out modal (before submitting). **Expect:** the in-progress form is lost (expected — no draft-saving exists), but the app itself doesn't break; equipment list reloads correctly.
- [ ] **T-048** — Open the app in two browser tabs, check out the same asset in both nearly simultaneously. **Expect:** one succeeds, the other gets a clear 409 error, not a duplicate active checkout.

## L. UI / UX

- [ ] **T-049** — Resize the browser window to a narrow (mobile) width on both screens. **Expect:** no horizontal scrollbar on the page itself; the Asset Dashboard's table scrolls independently if content is wider than the screen.
- [ ] **T-050** — Confirm status badge colors are consistent: gray = available/normal, blue = checked out, red = overdue, amber = anomaly/warning — same meaning everywhere they appear.
- [ ] **T-051** — Trigger a loading state (throttle network in DevTools, or just note it on first page load). **Expect:** a visible "Loading…" message, not a blank screen.
- [ ] **T-052** — Trigger an error state: stop the backend (`Ctrl+C` the server process) and reload the frontend. **Expect:** a visible error message with a "Retry" option, not a blank page or a raw stack trace. **Restart the backend afterward** (`cd server && npm start`) before continuing QA.
- [ ] **T-053** — Confirm an empty-queue message would be clear if the Action Queue were ever empty (read the code/design intent if you can't easily force this state — don't dismiss/action all 19 items just to check, that's more residue than it's worth).

## M. API verification (direct, independent of the UI)

- [ ] **T-054** — `curl http://localhost:4000/api/alerts` — confirm valid JSON, `success: true`, at least one item.
- [ ] **T-055** — `curl http://localhost:4000/api/anomalies` — confirm every item has a non-empty `reason` field.
- [ ] **T-056** — `curl http://localhost:4000/api/forecasts` — confirm at least one item has `insufficient_history: true` and at least one has `insufficient_history: false`.
- [ ] **T-057** — `curl -X PATCH http://localhost:4000/api/recommendations/00000000-0000-0000-0000-000000000000 -H "Content-Type: application/json" -d '{"status":"actioned"}'` — **Expect:** `404`.
- [ ] **T-058** — `curl http://localhost:4000/api/unknown-route` — **Expect:** `404` with a JSON error body, not an HTML stack trace.

## N. Security sanity

- [ ] **T-059** — View page source / DevTools Network tab on the frontend. Confirm no database connection string, password, or `.env` content appears anywhere in what's sent to the browser.
- [ ] **T-060** — Confirm `git status` in the repo shows no `.env` file staged or tracked (`git ls-files | grep '\.env$'` should return nothing).
- [ ] **T-061** — Try a request from an unexpected origin: `curl -i -X OPTIONS http://localhost:4000/api/equipment -H "Origin: http://evil.example.com" -H "Access-Control-Request-Method: GET"` — confirm the response's `Access-Control-Allow-Origin` is `http://localhost:5173`, **not** `http://evil.example.com` and **not** `*`.

## O. Final demo test — the golden path

This is the scenario to actually present. Reset first if you've been
clicking around: `UPDATE recommendations SET status='pending', actioned_at=NULL WHERE status != 'pending';`

- [ ] **T-062 — SPOT.** Open the Control Tower. Point at `EQX1002: zero runtime` in the Action Queue (a few rows down, amber-bordered).
- [ ] **T-063 — EXPLAIN.** Read its reason aloud: "0 engine hours logged across all 20 operating days." Note this is one of Caterpillar's own 7 official sample rows.
- [ ] **T-064 — ACT.** Click "Mark investigated" on that card. Confirm it disappears from the queue immediately, no reload.
- [ ] **T-065 — PREDICT.** Point at the Forecast panel: `Excavator @ S003` — a real trailing-window prediction with a stated trend. Contrast with `Grader @ S001`'s honest "insufficient history."
- [ ] **T-066 — PROVE.** Point at any remaining open card's expected-impact line and confirm it's explicitly labeled `"Simulated:"` — tied to the cited 65-75% utilization band, not an invented number.

Full script with talking points: `.ai/DEMO-SCRIPT.md`.

---

## Reporting a failure

Tell me the Test ID and what you actually saw (a screenshot helps but
isn't required). I'll reproduce it, find the root cause, fix it, add or
update a regression test, re-run the full suite, verify the complete flow
again, update `STATE.md`/`ISSUES.md`, and commit + push — not patch the
symptom.
