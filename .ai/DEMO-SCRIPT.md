# Demo script

Rehearsed and verified live, twice consecutively, against the real
seeded database (`phases/PHASE-11-demo-and-defense.md` has the full
verification record) — **before the three-role rebuild and real Google
auth landed** (2026-09-01, later that night). Updated in place for
current routes/baseline/numbers rather than re-rehearsed from scratch —
re-run this live at least once before presenting. This is the literal
script — follow it, don't improvise the flow live.

## Before you start (every single time, including the real demo)

The Action Queue is stateful — marking something "actioned" during a
rehearsal removes it from the queue for real. Reset before every run:

```sql
UPDATE recommendations SET status = 'pending', actioned_at = NULL WHERE status != 'pending';
```

**2026-09-02 finding, real and confirmed live:** a full night of real
multi-person testing (multiple teammates + judges/testers using the
actual Google sign-in) left genuine drift on production — `EQX1001` and
`EQX1002` were found checked out live with no operator/site (real
checkouts from real testing, not corrupted data), which is why they may
show extra `missing_assignment` cards beyond the original official
example. Anomalies don't auto-resolve by design, so old ones from
earlier test checkouts can also still be sitting in the queue. Before
presenting: check in any active checkouts on assets you don't want
showing as "currently checked out" (Dealer's Asset Dashboard, or query
`GET /api/equipment` for any `status: "checked_out"` you don't
recognize), and consider whether a full re-seed is warranted if the
queue looks cluttered with stale test signals rather than the clean
official example.

Also confirm the baseline hasn't drifted structurally: `equipment: 21,
checkouts: 26, usage_logs: 257` is the RB-6 *seeded* baseline — real
testing since then will have added more checkouts/usage_logs on top of
it, which is expected, not a bug. If `equipment` itself isn't 21,
something is actually wrong — stop and investigate.

Start both servers: `cd server && npm run dev` (or `npm start`), `cd
client && npm run dev`. Open `http://localhost:5173/`.

**New step — sign in first.** The app now uses real Google Sign-In, not
a name-entry demo mode. Click "Sign in with Google" with the presenting
account, then **"Continue as Dealer"** — that lands on `/dealer`, the
Control Tower, which is where this script begins and ends. (If the
account already has a role set from a previous session, it'll skip
straight there — use "Switch role," top-right, to get back to the role
picker if you need to demo the entry flow itself.)

## The five-step narrative

### 1. SPOT

On `/dealer` (Control Tower). Point at the Action Queue. Don't explain
anything yet — let the panel see a real, populated, ranked list first.
Then point specifically at **`EQX1002: zero runtime`** (amber-bordered,
a few rows down from the top).

Say: *"This is one of the seven example assets Caterpillar gave us in
the official problem statement. Our system caught it automatically."*

### 2. EXPLAIN

Read the card's own text — it's designed to be read aloud:

> **EQX1002: zero runtime** — *0 engine hours logged across all 20
> operating days.* Simulated: investigating could recover unused rental
> cost.

Say: *"Zero engine hours across 20 full days checked out — that's a
19-day-plus lost-rental signal, not a rounding error. Our rule: any
logged day with zero engine hours while checked out. Not a black box —
you can see the exact rule and the exact number that tripped it."*

(Optional, if asked: this same asset also shows `missing assignment` —
no operator, no site — which is the *other* half of Caterpillar's own
worked example. Both fire from the same underlying data.)

### 3. ACT

Click **"Mark investigated"** on the `EQX1002: zero runtime` card.

Say: *"That's the loop closing. It's not just a dashboard — it's a
worklist. Once handled, it drops out of the queue immediately."*

Point out: the card is gone, the queue re-ranks, nothing reloaded.

### 4. PREDICT

Point at the **Forecast** panel in the sidebar — specifically
**`Excavator @ S003`**.

Say: *"Based on 6 checkouts over the last 4 weeks, averaging about
1.5 a week, trending up — we're predicting continued demand for
excavators at site S003, so pre-positioning one there avoids a
stockout."* Then point at **`Grader @ S001`**: *"And where we don't have
enough history — like here, only 2 checkouts — we say so honestly
instead of making up a number."*

### 5. PROVE

Point at any still-open card's expected-impact line, e.g.
`EQX2005: excessive idle` → *"Simulated: reassigning or returning this
equipment could improve utilization toward the 65-75% healthy band."*

Say: *"Every impact claim is explicitly labeled simulated — we're not
claiming a measured business result on synthetic data, we're showing the
system's reasoning and what it would mean if acted on. That 65-75% band
isn't invented — it's from published fleet-utilization benchmarks, cited
in our research log."*

## Optional bonus beat (if there's time, or a judge asks about the fleet-owner/business view)

Click "Switch role" → "Continue as Caterpillar Admin" → lands on `/admin`,
also a Control Tower (new — added same night as real auth), not a static
report. Say: *"Same recommendation engine, fleet-wide altitude — the
Caterpillar-side stakeholder doesn't dig through six report tabs to find
what needs attention, they get the same ranked queue Dealer does, plus
fleet-level exception counts."* Point at the sidebar's "Exceptions" card
(high-severity anomalies, rentals below capacity, unassigned equipment,
utilization bands). Honest caveat if asked: today the Admin and Dealer
queues show the same underlying items — the fleet-wide *scoping* of which
signals surface to which role is documented future work, not built yet.

## Fallback if live demo fails

Screenshots captured during the verified rehearsal — regenerate a fresh
set before presenting (the old ones predate the role rebuild and won't
match): sign in, land on `/dealer`, screenshot that and `/dealer/assets`
at `1400x1200`. Narrate over the screenshots using this same script if
the live app is unavailable. Note the fallback can't show a fresh Google
sign-in itself (needs a live OAuth round trip) — screenshot the
already-signed-in state and narrate the auth step verbally.

## Secondary flow (if there's time / a follow-up question): the full lifecycle

Asset Dashboard (`/dealer/assets`) → check out any `available` asset →
click "Log usage" on it → enter a low engine-hours / high idle-hours
split → watch it become a live `excessive_idle` anomaly on the next
Control Tower load. This demonstrates CHECK OUT → LOG USAGE → ANALYZE
live, not just against pre-seeded data. **Use an asset you're prepared to
check back in before ending the demo** — don't leave the real fleet state
altered.
