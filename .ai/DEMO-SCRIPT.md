# Demo script

Rehearsed and verified live, twice consecutively, against the real
seeded database (`phases/PHASE-11-demo-and-defense.md` has the full
verification record). This is the literal script — follow it, don't
improvise the flow live.

## Before you start (every single time, including the real demo)

The Action Queue is stateful — marking something "actioned" during a
rehearsal removes it from the queue for real. Reset before every run:

```sql
UPDATE recommendations SET status = 'pending', actioned_at = NULL WHERE status != 'pending';
```

Also confirm the baseline hasn't drifted: `equipment: 17, checkouts: 22,
usage_logs: 192` (`psql`, or ask whoever ran the last rehearsal). If it
doesn't match, something touched the seeded data — stop and investigate
before presenting, don't demo on a corrupted baseline.

Start both servers: `cd server && npm run dev` (or `npm start`), `cd
client && npm run dev`. Open `http://localhost:5173/` — the Control
Tower, not the Asset Dashboard — that's where the demo begins and ends.

## The five-step narrative

### 1. SPOT

Open the Control Tower. Point at the Action Queue. Don't explain
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

Say: *"Based on 5 checkouts over the last 4 weeks, averaging about
1.25 a week, trending up — we're predicting continued demand for
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

## Fallback if live demo fails

Screenshots captured during the verified rehearsal (same real seeded
data, same flow) — ask whoever ran the last rehearsal for the current
set, or regenerate: `google-chrome --headless --screenshot=... http://localhost:5173/`
for both `/` and `/assets` at `1400x1200`. Narrate over the screenshots
using this same script if the live app is unavailable.

## Secondary flow (if there's time / a follow-up question): the full lifecycle

Asset Dashboard (`/assets`) → check out any `available` asset → click
"Log usage" on it → enter a low engine-hours / high idle-hours split →
watch it become a live `excessive_idle` anomaly on the next Control Tower
load. This demonstrates CHECK OUT → LOG USAGE → ANALYZE live, not just
against pre-seeded data. **Use an asset you're prepared to check back in
before ending the demo** — don't leave the real fleet state altered.
