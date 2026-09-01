# Manual QA checklist

For manual testing only — automated coverage lives in `server/tests/`
(**28/28 passing**, reconfirmed against a fresh migrate+seed on
2026-09-01 — see `STATE.md`). This checklist is for a human clicking
through the real, running app. **Mark each test `[x] PASS` or `[ ] FAIL`
yourself as you go** — nothing here is pre-checked, and no automated
result counts as a PASS here. If something fails, report the Test ID and
what you saw (see "Reporting a failure" at the bottom).

## Before you start

**URLs (local, currently running):**
- Frontend: **http://localhost:5173/**
- Backend/API: **http://localhost:4000/api/...**
- Health check: **http://localhost:4000/api/health**
- Hosted/public URL: **none — not deployed yet.** See `DEPLOYMENT.md`;
  don't go looking for a public link, one doesn't exist.

**Current seeded baseline** (freshly migrated + seeded 2026-09-01, RB-6):
**21 equipment, 26 checkouts, 257 usage_logs.** This is *not* the
original Phase 02 baseline (17/22/192) — RB-6 added three historical
Excavator rentals plus one active checkout (`EQX3006`) so the new
capacity-aware feature has real data to compute from. See `DECISIONS.md`
("RB-6" entry) if the numbers below ever look off by exactly those four
rows.

**The app now has three role-gated experiences**, chosen from an entry
screen at `/` — this is new since the original checklist below was
written, and is the main thing this update covers:

| Role | Entry | Routes |
|---|---|---|
| Customer | "Continue as Customer" (enter any name) | `/customer`, `/customer/equipment/:id`, `/customer/rentals` |
| Dealer | "Continue as Dealer" | `/dealer`, `/dealer/assets` |
| Caterpillar Admin | "Continue as Caterpillar Admin" | `/admin`, `/admin/utilization`, `/admin/capacity`, `/admin/anomalies`, `/admin/forecasts`, `/admin/recommendations` |

Role selection is **client-simulated, not real authentication** — no
password, no server-side session. "Switch role" (top-right) always
returns you to `/`. This is by design and stated on the entry screen
itself — don't file it as a bug.

**Real actions leave real residue.** This is a shared demo database, not
a sandboxed test environment. If you check something out, log usage, rent
equipment as a customer, or mark a recommendation actioned/dismissed,
that state persists across reloads and other testers. To undo:
- Checked something out (Dealer or Customer) by mistake → check it back
  in (Dealer's Asset Dashboard, or Customer's "Return equipment" on My
  Rentals).
- Marked a recommendation actioned/dismissed by mistake → this SQL
  restores every recommendation to pending:
  `UPDATE recommendations SET status='pending', actioned_at=NULL WHERE status != 'pending';`
- There is still no one-command "full reset to seeded baseline" script —
  a real, documented gap (`ISSUES.md` `BUG-001` describes exactly this
  happening once already). If the demo data looks wrong before you start,
  say so before testing further rather than testing against drifted data.

**What automated/scripted verification already covered** (so you don't
need to re-discover these — go straight past them to the parts only a
human can judge): all three roles' primary screens load with real data
and zero console errors (desktop + 390px mobile), the full Customer
rent→return round trip works against real DB writes, the capacity
feature correctly flags `EQX3006` and shows real completion estimates for
`EQX3001`/`EQX3004`, and `EQX1002`/`EQX1007` produce the official
zero_runtime/missing_assignment/excessive_idle triad. **What hasn't been
checked by any session yet: actual human judgment on whether the UI
reads clearly, whether the flows feel right, and the edge cases below.**
That's what this pass is for.

---

## A. Environment

- [ ] **T-001** — Open http://localhost:4000/api/health. **Expect:** `{"success":true,"data":{"status":"ok",...,"database":"connected"}}`.
- [ ] **T-002** — Open http://localhost:5173/. **Expect:** the Citadel entry screen loads (headline "Citadel", three role cards), no blank page, no crash.
- [ ] **T-003** — Open DevTools console on the entry screen. **Expect:** no red errors on load.

## B. Customer flow

Start at `/`, click "Continue as Customer," enter any name (e.g. "QA Tester").

- [ ] **CUST-01** — After entering a name and continuing, confirm you land on `/customer` with an equipment grid ("Find equipment"). Confirm only equipment with status **Available** appears (no checked-out machines in the grid).
- [ ] **CUST-02** — Click a type filter chip (e.g. "Excavator"). **Expect:** grid narrows to only that type; click "All types" to reset.
- [ ] **CUST-03** — Click an equipment card. **Expect:** navigates to a detail page showing type, code, home site, and a rent form pre-filled with your entered name.
- [ ] **CUST-04** — If the machine's type has enough historical data (currently: Excavator), confirm a green-bordered "capacity-fit hint" box appears below the form with a typical-hours figure and sample count. For a type without enough history, confirm the hint is simply **absent** — not a broken/empty box.
- [ ] **CUST-05** — Set a return date, click "Rent this equipment." **Expect:** navigates to `/customer/rentals`, and the machine you just rented appears there with status "Checked out."
- [ ] **CUST-06** — Go back to `/customer` (Discover). **Expect:** the machine you just rented no longer appears in the available grid.
- [ ] **CUST-07** — On My Rentals, click "Return equipment" on your active rental. **Expect:** status flips to "Returned," the button disappears.
- [ ] **CUST-08** — Click "Switch role" (top right). **Expect:** returns to `/`, and choosing Customer again with a **different** name shows an empty "My Rentals" (no cross-contamination between names).

## C. Dealer flow

Switch role → "Continue as Dealer." You land on `/dealer` (Control Tower).

Use an equipment that is currently `Available` and **not** `EQX1002` or
`EQX1007` (reserved — see section F) and not one you rented as the
Customer above.

- [ ] **DLR-01** — Confirm the Action Queue lists real signal cards (signal / reason / expected-impact sentence each), and a "Top priority" banner at the top summarizing the first card.
- [ ] **DLR-02** — Confirm the right-hand sidebar's "Live status" counts (available/checked out/overdue/maintenance) look plausible and non-zero.
- [ ] **DLR-03** — Click "Asset Dashboard" in the nav. **Expect:** navigates to `/dealer/assets`, a sortable table of all 21 equipment loads.
- [ ] **DLR-04** — Click the "Asset" column header. **Expect:** table re-sorts alphabetically; click again, sort reverses.
- [ ] **DLR-05** — Click "Check out" on an available asset. Fill in an operator and site, confirm. **Expect:** modal closes, row updates to "Checked out."
- [ ] **DLR-06** — On that same row, click "Log usage." Enter a date, e.g. 6 engine hours / 1 idle hour, submit. **Expect:** success notice.
- [ ] **DLR-07** — Log usage again for the **same asset and same date**. **Expect:** a clear inline error (duplicate log), not a silent failure.
- [ ] **DLR-08** — Log usage with a **negative** number in either field. **Expect:** rejected with a validation message.
- [ ] **DLR-09** — Click "Check in" on the asset from DLR-05. **Expect:** row returns to "Available."
- [ ] **DLR-10** — Check out an asset **without** selecting an operator or site. **Expect:** succeeds (intentional — this is what produces a `missing_assignment` signal, same pattern as the official `EQX1002`/`EQX1007` rows). Check it back in afterward.

## D. Caterpillar Admin flow

Switch role → "Continue as Caterpillar Admin." You land on `/admin` (Fleet Overview).

- [ ] **ADM-01** — Confirm "Status by equipment type" table and "Allocation by site" list both show real, non-zero numbers.
- [ ] **ADM-02** — Click "Utilization" in the nav. **Expect:** each equipment type shows a runtime % and a band label (Healthy/Underutilized/Overutilized/No data), each with a one-line plain-English explanation.
- [ ] **ADM-03** — Click "Capacity" in the nav. **Expect:** see section E below — this is the capacity-aware optimization feature's dedicated view.
- [ ] **ADM-04** — Click "Anomalies" in the nav. **Expect:** a list of flagged equipment with type + reason + severity badge (this is the same underlying data as Dealer's Action Queue, but Admin gets a dedicated direct view of it — no per-asset action buttons here, by design: Admin observes, Dealer executes).
- [ ] **ADM-05** — Click "Forecasts" in the nav. **Expect:** cards per equipment-type/site pair — some with a real predicted-demand number and trend, at least one with an honest "insufficient history" message (never a fabricated number).
- [ ] **ADM-06** — Click "Recommendations" in the nav. **Expect:** the full ranked queue (same underlying data/actions as Dealer's Action Queue — mark actioned/dismissed here works identically).
- [ ] **ADM-07** — Confirm Admin's pages never expose a "Check out" / "Check in" / "Log usage" button anywhere — Admin is strategic/read-only for asset actions by design, unlike Dealer.

## E. Capacity-aware rental optimization

This is the newest analytics feature — verify it's explainable, not just
a number. Best viewed at `/admin/capacity`, but also check the Action
Queue (Dealer or Admin).

- [ ] **CAP-01** — On `/admin/capacity`, confirm `EQX3006` appears under "Review for early return or reassignment" (green-bordered) with: a utilization percentage, an observed-vs-assumed-capacity sentence (e.g. "4h/day observed vs. an assumed 8h/day capacity"), an estimated completion **range** (not a single number), and a bulleted list of stated assumptions.
- [ ] **CAP-02** — Confirm `EQX3001` and `EQX3004` appear under "Below capacity, not enough history to estimate completion" **or** show a real estimate without being flagged — either is correct; what matters is neither is silently missing nor shown with a fabricated number it can't support.
- [ ] **CAP-03** — On the Dealer Action Queue (or Admin Recommendations), find the `EQX3006: underutilized capacity` card. **Expect:** its left border is a distinct green (not red/amber/blue like alerts/anomalies/forecasts), and its expected-impact line starts with "Simulated:" like every other card.
- [ ] **CAP-04** — Read the `EQX3006` card's reason sentence aloud. **Expect:** it states the observed rate, the assumed capacity, the estimated completion range, and the remaining rental window — not just a bare percentage.
- [ ] **CAP-05** — Click "Mark investigated" on the `EQX3006` capacity card. **Expect:** it disappears from the queue like any other recommendation, and does not reappear on reload (same insert-once/closes-the-loop behavior as alerts/anomalies).

## F. Official Caterpillar sample: EQX1002 / EQX1007 (read-only — do not check these out during QA)

- [ ] **T-034** — On Dealer's Asset Dashboard, confirm `EQX1002` and `EQX1007` both show status **Available** (they're historical, already-returned checkouts).
- [ ] **T-035** — On the Action Queue (Dealer or Admin), confirm **both** produce a `zero_runtime` card ("0 engine hours logged across all N operating day(s)").
- [ ] **T-036** — Confirm **both** also produce a `missing_assignment` card ("Checked out with no operator and no site assigned").
- [ ] **T-037** — Confirm **both** also produce an `excessive_idle` card (0 engine hours mathematically means 100% idle ratio — this is correct, not a duplicate bug).
- [ ] **T-038** — Via API, `curl http://localhost:4000/api/equipment` and find `EQX1002`/`EQX1007` — confirm `"home_site": null` and no active checkout (both already returned).

## G. End-to-end workflow (Dealer)

- [ ] **T-039** — Full chain on a throwaway available asset (not EQX1002/EQX1007, not one rented via Customer): **CHECK OUT** (no operator/site) → **LOG USAGE** (high idle, e.g. 1 engine/9 idle) → go to Control Tower, **confirm two cards appear** (missing_assignment + excessive_idle) → **ACT** (mark one investigated) → confirm it's gone → **CHECK IN** the asset. **Expect:** every step works without a page reload fixing anything, no console errors at any step.

## H. Edge cases / negative testing

- [ ] **T-040** — Dealer check-out form: submit with no operator/site at all. **Expect:** succeeds (both optional by design — see DLR-10).
- [ ] **T-041** — Try checking in an asset that's already `Available` — shouldn't be possible via the UI (no "Check in" button shows).
- [ ] **T-042** — Via API: `curl -X POST http://localhost:4000/api/checkouts -H "Content-Type: application/json" -d '{"equipment_id":"00000000-0000-0000-0000-000000000000"}'`. **Expect:** `404`, not a 500.
- [ ] **T-043** — Via API: `curl -X POST http://localhost:4000/api/checkouts -H "Content-Type: application/json" -d '{"equipment_id":"not-a-uuid"}'`. **Expect:** `400` with a field-level validation message.
- [ ] **T-044** — Via API: check out a real available asset's id twice in a row. **Expect:** first `201`, second `409` ("already checked out").
- [ ] **T-045** — Via API: `curl http://localhost:4000/api/equipment/not-a-uuid`. **Expect:** `400`, not a crash.
- [ ] **T-046** — Log usage with an absurdly large number, e.g. `999999` engine hours. **Expect:** accepted (no upper bound enforced — note whether this feels like a real gap; report either way, don't silently decide).
- [ ] **T-047** — Refresh the browser mid-way through filling out a Dealer check-out modal or Customer rent form (before submitting). **Expect:** the in-progress form is lost (expected), but the app doesn't break.
- [ ] **T-048** — Open the app in two tabs, check out the same asset in both nearly simultaneously (Dealer or Customer, or one of each). **Expect:** one succeeds, the other gets a clear error, not a duplicate active checkout.
- [ ] **CUST-EDGE-01** — As Customer, visit `/customer/rentals` under a name that has never rented anything. **Expect:** a clear "No rentals yet" empty state, not a blank page or error.
- [ ] **CUST-EDGE-02** — As Customer, try to open an equipment detail page for a machine that's currently checked out (e.g. navigate directly to a checked-out equipment's URL, or check something out as Dealer first then view it as Customer). **Expect:** the page shows the machine's real status and does **not** offer a rent form for an unavailable machine.
- [ ] **ROLE-EDGE-01** — Manually edit the URL to a Dealer route (e.g. `/dealer/assets`) while in Customer role (or vice versa) without going through "Switch role." **Expect:** redirected back to `/`, not shown the wrong role's screen. (This is a UX guard, not real authorization — note that distinction if you're evaluating it as a security control.)

## I. UI / UX / responsive

- [ ] **T-049** — Resize the browser window to a narrow (mobile, ~390px) width on all three roles. **Expect:** no horizontal scrollbar on the page itself; Dealer's Asset Dashboard table scrolls independently inside its own container if content is wider than the screen; Customer's Discover grid reflows to a single column.
- [ ] **T-050** — Confirm status badge colors are consistent across all three roles: gray = available/normal, blue = checked out, red = overdue/danger, amber = warning/anomaly, green = capacity opportunity — same meaning everywhere they appear.
- [ ] **T-051** — Trigger a loading state (throttle network in DevTools, or note it on first page load). **Expect:** a visible "Loading…" message, not a blank screen, on all three roles' pages.
- [ ] **T-052** — Trigger an error state: stop the backend (`Ctrl+C` the server process) and reload the frontend on any role's page. **Expect:** a visible error message with a "Retry" option, not a blank page or raw stack trace. **Restart the backend afterward** (`cd server && npm run dev`) before continuing QA.
- [ ] **T-053** — Confirm an empty-queue message would be clear if the Action Queue were ever empty (read the design intent if you can't easily force this state — don't dismiss/action every item just to check).

## J. API verification (direct, independent of the UI)

- [ ] **T-054** — `curl http://localhost:4000/api/alerts` — confirm valid JSON, `success: true`, at least one item.
- [ ] **T-055** — `curl http://localhost:4000/api/anomalies` — confirm every item has a non-empty `reason` field.
- [ ] **T-056** — `curl http://localhost:4000/api/forecasts` — confirm at least one item has `insufficient_history: true` and at least one has `insufficient_history: false`.
- [ ] **T-057** — `curl -X PATCH http://localhost:4000/api/recommendations/00000000-0000-0000-0000-000000000000 -H "Content-Type: application/json" -d '{"status":"actioned"}'` — **Expect:** `404`.
- [ ] **T-058** — `curl http://localhost:4000/api/unknown-route` — **Expect:** `404` with a JSON error body, not an HTML stack trace.
- [ ] **CAP-06** — `curl http://localhost:4000/api/capacity` — confirm the response has both `active_checkouts` and `type_baselines` arrays, and that `EQX3006` in `active_checkouts` has `"underutilized_capacity": true`.

## K. Security sanity

- [ ] **T-059** — View page source / DevTools Network tab on the frontend. Confirm no database connection string, password, or `.env` content appears anywhere in what's sent to the browser.
- [ ] **T-060** — Confirm `git status` in the repo shows no `.env` file staged or tracked (`git ls-files | grep '\.env$'` should return nothing — only `.env.example` files should be tracked).
- [ ] **T-061** — Try a request from an unexpected origin: `curl -i -X OPTIONS http://localhost:4000/api/equipment -H "Origin: http://evil.example.com" -H "Access-Control-Request-Method: GET"` — confirm the response's `Access-Control-Allow-Origin` is `http://localhost:5173`, **not** `http://evil.example.com` and **not** `*`.

## L. Final demo test — the golden path

This is the scenario to actually present. Reset first if you've been
clicking around: `UPDATE recommendations SET status='pending', actioned_at=NULL WHERE status != 'pending';`

- [ ] **T-062 — SPOT.** As Dealer, open the Control Tower. Point at `EQX1002: zero runtime` in the Action Queue.
- [ ] **T-063 — EXPLAIN.** Read its reason aloud: "0 engine hours logged across all 20 operating days." Note this is one of Caterpillar's own 7 official sample rows.
- [ ] **T-064 — ACT.** Click "Mark investigated" on that card. Confirm it disappears immediately, no reload.
- [ ] **T-065 — PREDICT.** Point at the Forecast panel: `Excavator @ S003` — a real trailing-window prediction with a stated trend. Contrast with `Grader @ S001`'s honest "insufficient history." Then switch to Admin's Capacity view and point at `EQX3006`'s estimated completion range vs. its 55-day remaining window.
- [ ] **T-066 — PROVE.** Point at any remaining open card's expected-impact line and confirm it's explicitly labeled `"Simulated:"` — tied to the cited 65-75% utilization band or the capacity assumptions, not an invented number.
- [ ] **T-067 — THREE ROLES.** Close the loop: switch role to Customer, show discovering and renting a machine; switch to Admin, show the same fleet from a strategic utilization/capacity lens instead of a per-asset action list — demonstrating genuinely different information priorities on the same underlying data, not three copies of the same screen.

Full script with talking points (pre-rebuild, Dealer-only — update before
presenting the three-role version): `.ai/DEMO-SCRIPT.md`.

---

## Reporting a failure

Tell me the Test ID and what you actually saw (a screenshot helps but
isn't required). I'll reproduce it, find the root cause, fix it, add or
update a regression test, re-run the full suite, verify the complete flow
again, update `STATE.md`/`ISSUES.md`, and commit + push — not patch the
symptom.
