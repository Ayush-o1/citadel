# Recommended demo flow (SPOT → EXPLAIN → ACT → PREDICT → PROVE)

This matches `.ai/DEMO-SCRIPT.md`'s rehearsed path, cross-checked against
what was actually live and working in this session's testing. **Reseed
before you go on** — see `REMAINING_ISSUES.md` #2.

## Pre-flight (do this right before your slot)

1. `cd server && npm run seed` (after clearing tables if the DB isn't
   freshly seeded — see `BUGS_FIXED.md` #1 for the exact clear+reseed
   commands).
2. Confirm `EQX1007` still shows `zero_runtime`/`missing_assignment` and
   `EQX3001` still shows `overdue` at the top of the Dealer/Admin Action
   Queue — both were the exact live state confirmed in this session.
3. Sign in on the actual presenting device/browser profile once, ahead of
   time — not during the demo (`ISSUES.md`'s ad-blocker/profile finding).

## 01 — SPOT

Open the Dealer Control Tower (`/dealer`). Point at the top Action Queue
card: `EQX1007: zero runtime — 0 engine hours logged across all 12
operating day(s)`. This is the official Caterpillar-suggested worked
example (confirmed against the actual presentation slide photos, not
assumed).

## 02 — EXPLAIN

Read the reason aloud, then point at the twin signal directly below it:
`EQX1007: missing assignment — Checked out with no operator and no site
assigned`. Two independent signals on the same asset — explain that the
system doesn't just flag one heuristic, it correlates multiple real
anomaly types (idle, zero-runtime, missing-assignment, movement-mismatch)
from the same underlying usage-log data.

## 03 — ACT

Click "Mark investigated" on the `EQX1007` card. Watch it visibly leave the
Action Queue — confirmed live this session (`PATCH /api/recommendations/:id`
→ `200`, item disappears from the pending list in the same render). This is
the "the dashboard should recommend, not just report" principle made
concrete.

## 04 — PREDICT

Switch to the Forecast panel (same screen, or `/admin/forecasts`). Show
Excavator@S003 trending up ("Based on 6 checkout(s) over the last 4 weeks
(~1.5/week), trending up.") next to Grader@S001's honest
`insufficient_history` fallback — the contrast is the point: the system
tells the truth when it doesn't have enough data, rather than fabricating a
number.

## 05 — PROVE

Point at any open Action Queue card's italic impact line — e.g. `EQX2001:
excessive idle → "Simulated: reassigning or returning this equipment could
improve utilization toward the 65-75% healthy band."` Read the word
"Simulated" out loud — it's on every single one, verified this session by
inspecting the full live API response, not spot-checked.

## Optional bonus beat (if time allows)

Click "Switch role" in the top nav → `/switch-role` → pick Caterpillar
Admin. Same Control Tower engine, same recommendation queue, now at fleet
altitude with the Exceptions summary (`High-severity anomalies: 2`, `Rentals
below capacity: 1`, `Equipment with no home site: 15`). This demonstrates
one shared, correct analytics engine serving two different operational
altitudes — not two separate, possibly-inconsistent implementations.

## If a judge asks about mobile

Show the Customer flow on a phone (`/customer` → equipment detail → rent),
which renders cleanly at 390px and is short. Avoid leading with the Dealer
Control Tower on mobile — it's functional but very long to scroll (see
`REMAINING_ISSUES.md` #3); don't let that be the first mobile impression.

## If a judge asks "what happens when data is missing or incorrect?"

Two ready, real answers:
1. Point at `EQX1007`/`EQX1002`'s `missing_assignment` flag — the system
   explains exactly what's missing (operator, site, or both) rather than
   silently ignoring it.
2. Try to check out an already-checked-out asset live — `409 "Equipment is
   already checked out"`, confirmed this session, not a made-up example.
