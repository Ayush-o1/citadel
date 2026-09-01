# Problem statement

Two sources exist for this problem statement — kept separate and labeled
because they don't fully match (see `.ai/HANDOFF.md`'s latest entry for
the discrepancy and what's still unresolved).

---

## SOURCE A — Official one-page document (verbatim)

Transcribed from the printed Caterpillar handout
(`WhatsApp Image 2026-09-01 at 11.39.36.jpeg`, © 2025 Caterpillar). This is
the literal source document — treat it as ground truth over Source B
below wherever the two disagree.

### Smart Rental Tracking System

**Background**

In industries like construction and mining, companies often rent
machinery and tools instead of owning them through our registered
dealers. However, managing these rentals — tracking where the equipment
is, who's using it, when it's due to return and predicting upcoming
demand — is still largely manual or spreadsheet based. This results in:

- Equipment being lost or unaccounted for.
- Delays and downtime due to misallocation.
- Unexpected rental extension and costs.

**Challenge:**

Design a smart asset rental tracking system that can help:

- Track and monitor rented equipment in real time.
- Predict demand, flag under-utilized assets and optimize rentals.
- Log usage and conditions.

**Expected outcomes**

- **Asset Dashboard:** List of all rented equipment with live status. (You can assume that the data is real time.)
- **Check-in/Check-out system:** based on QR code/RFID simulation/user entry.
- **Usage Logging:** Runtime hours, Fuel usage, Location, Idle hours etc. Summary of total rented hours, usage per site, downtime.
- **Overdue alerts and notification:** Remind users when return time is approaching.
- **Demand Forecasting:** Help companies pre-position equipment by predicting which tools/machines will be needed at certain sites/times.
- **Anomaly Detection:** Use the historical data to detect any misuse of assets, e.g.: long idle hours, unassigned equipment etc.

**Sample dataset (7 rows, as shown on the handout)**

| Equipment ID | Type | Site ID | Check-Out Date | Check-In Date | Engine Hours/Day | Idle Hours/Day | Operating Days | Last Operator ID |
|---|---|---|---|---|---|---|---|---|
| EQX1001 | Excavator | S003 | 2025-04-01 | 2025-04-16 | 1.5 | 10 | 15 | OP101 |
| EQX1002 | Crane | NULL | 2025-03-10 | 2025-03-30 | 0 | 11 | 20 | NULL |
| EQX1003 | Bulldozer | S002 | 2025-02-15 | 2025-03-11 | 7.5 | 0.5 | 25 | OP203 |
| EQX1004 | Excavator | S004 | 2025-05-05 | 2025-05-15 | 2 | 9 | 10 | OP106 |
| EQX1005 | Bulldozer | S006 | 2025-01-01 | 2025-01-31 | 8 | 0 | 30 | OP301 |
| EQX1006 | Grader | S001 | 2025-04-05 | 2025-04-23 | 3 | 6 | 18 | OP114 |
| EQX1007 | Excavator | NULL | 2025-03-20 | 2025-04-01 | 0 | 12 | 12 | NULL |

Note: every row already has both a Check-Out Date and a Check-In Date —
this sample is **historical/completed rentals**, used to demonstrate that
operational rows convert into insights (utilization, idle, anomalies,
forecasting), not a live "currently checked out" table.

Two rows (`EQX1002`, `EQX1007`) have `Site ID = NULL` and
`Last Operator ID = NULL` together, and also read `0` Engine Hours/Day —
almost certainly a deliberate example of the "unassigned equipment" /
"zero runtime" anomaly the challenge asks us to detect.

---

## SOURCE B — Supplementary presentation framing (as relayed, unverified against a written document)

Pasted into this repo by the team during the reveal session, described as
covering: a "Control Tower" concept (Live Status / Utilization / Action
Queue), a recommendation-engine shape (signal → reason → recommended
action → expected impact), specific judging weights (Business Impact 25%
/ Innovation 25% / Technical Solution 20% / UX 15% / AI & Analytics 15%),
and a five-step demo narrative (SPOT → EXPLAIN → ACT → PREDICT → PROVE).

**Status: CONFIRMED** (Ayush, 2026-09-01) — from the live presentation/
briefing at the event, not an interpretation. Treated as authoritative
alongside Source A; nothing in it actually contradicts Source A, it adds
structure (Control Tower framing, judging weights, demo narrative) on top
of the same six capabilities.

<details>
<summary>Full Source B text (click to expand)</summary>

```
CATERPILLAR HACKATHON — OFFICIAL PROBLEM STATEMENT
===================================================

TITLE:
SMART RENTAL TRACKING SYSTEM

OBJECTIVE
---------

Build a smart rental tracking and operational control-tower solution that helps
equipment/rental operators track assets from checkout to return, understand
asset utilization, identify exceptions/anomalies, forecast upcoming demand,
and take actionable decisions.

The solution should turn operational data into:

INSIGHT → ACTION → MEASURABLE OUTCOME

The system should NOT only report what is happening.
It should help the operator decide what to do next.

===================================================
CORE PRODUCT — CONTROL TOWER
===================================================

The solution should provide a central operational control tower with six
essential capabilities:

1. ASSET DASHBOARD
   - Live asset status
   - Site
   - Location
   - Return date

2. CHECK-IN / CHECK-OUT
   - QR/RFID simulation OR asset-ID based entry
   - Check an asset out
   - Check an asset back in

3. USAGE LOGGING
   Capture operational usage information such as:
   - Runtime
   - Idle hours
   - Fuel
   - Location
   - Engine usage
   - Condition

4. ALERTS
   Identify important operational exceptions such as:
   - Upcoming returns
   - Overdue assets
   - Missing information
   - Other relevant exceptions

5. FORECASTING
   Predict future equipment demand based on:
   - Equipment
   - Site
   - Time

   The prediction should answer a useful operational question such as:
   "What equipment is likely to be needed, where, and when?"

6. ANOMALIES
   Detect unusual or problematic conditions such as:
   - Excessive idle hours
   - Zero runtime
   - Missing assignment
   - Unusual or inconsistent asset movement/usage
   - Other relevant operational anomalies

===================================================
CORE ASSET JOURNEY
===================================================

The complete asset lifecycle should be represented as:

CHECK OUT
    ↓
ASSIGN & TRACK
    ↓
LOG USAGE
    ↓
CHECK IN

CHECK OUT
- Scan QR/RFID or enter asset ID.

ASSIGN & TRACK
- Attach site.
- Attach operator where applicable.
- Update operational location.

LOG USAGE
Capture:
- Engine/runtime information
- Idle hours
- Fuel
- Location
- Condition

CHECK IN
- Record return time.
- Record final condition.
- Complete the asset's rental lifecycle.

Every important status change should make it possible to understand:

WHO?
WHAT?
WHERE?
WHEN?

===================================================
CONTROL TOWER
===================================================

The control tower should help an operations user understand:

LIVE STATUS
- What is happening now?

UTILIZATION
- How effectively are assets being used?
- Runtime vs idle time
- Operating days / usage patterns where useful

ACTION QUEUE
- What requires attention?
- What should the operator do next?

The key principle is:

THE DASHBOARD SHOULD NOT ONLY REPORT.
IT SHOULD RECOMMEND.

===================================================
AI / ANALYTICS
===================================================

The solution should make AI/analytics useful, transparent and actionable.

Three highlighted areas:

1. DEMAND FORECASTING

Predict equipment demand by:
- equipment type
- site
- time

Example:
"This equipment type is likely to be required at Site X next week."

The forecast should explain what factors influenced the prediction
where practical.

2. ANOMALY DETECTION

Identify operational anomalies such as:
- excessive idle
- zero runtime
- missing assignment
- unusual usage
- unexpected movement
- other meaningful deviations

The system should explain WHY an asset was flagged.

3. RECOMMENDATIONS

Convert operational signals into recommended action.

Examples:
- Return
- Reassign
- Investigate
- Extend

The system should ideally present:

SIGNAL
→ REASON
→ RECOMMENDED ACTION
→ EXPECTED IMPACT

Do not add AI merely for appearance.

===================================================
DATA
===================================================

The presentation included a sample dataset containing seven assets.

Sample fields included:

- Equipment ID
- Equipment Type
- Site
- Engine hours/day
- Idle hours/day
- Operator

Example equipment IDs shown:

EQX1001
EQX1002
EQX1003
EQX1004
EQX1005
EQX1006
EQX1007

The sample data demonstrates that operational rows can be converted into
useful insights.

The implementation may use realistic simulated telemetry/data where real
telemetry is unavailable.

Simulation is acceptable for:
- telemetry
- QR/RFID
- notifications
- historical data
- other necessary operational inputs

The goal is to demonstrate a credible software solution, not physical
hardware integration.

IMPORTANT:
Do not invent business claims or real-world savings numbers without labeling
them as assumptions/simulations.

===================================================
BUSINESS OBJECTIVE
===================================================

The solution should demonstrate how better asset visibility and intelligence
can help reduce or improve:

- downtime
- idle utilization
- rental cost
- missed/late returns
- inefficient allocation
- asset loss or mismanagement
- operational decision time

The system should connect data to a real operational decision.

===================================================
JUDGING LENS
===================================================

The judging framework shown in the Caterpillar presentation was:

BUSINESS IMPACT — 25%
Does the solution reduce loss, downtime or rental cost?

INNOVATION — 25%
Is the approach distinctive and useful?

TECHNICAL SOLUTION — 20%
Is the architecture credible and is the demo reliable?

USER EXPERIENCE — 15%
Can an operator act quickly and confidently?

AI & ANALYTICS — 15%
Are predictions relevant, transparent and actionable?

TOTAL — 100%

Use these weights when prioritizing engineering effort.

===================================================
BUILD PHILOSOPHY
===================================================

A strong minimum viable solution should tell ONE COMPLETE STORY.

DEPTH BEATS BREADTH.

The solution should prioritize a complete, believable operational workflow
rather than many shallow features.

The final product should ideally demonstrate:

1. Asset live status
2. Check-in / check-out
3. Usage tracking / summaries
4. Overdue or exception insight
5. At least one useful forecast
6. At least one meaningful anomaly
7. A recommendation/action based on an insight
8. A measurable or clearly explainable outcome

===================================================
DEMO NARRATIVE
===================================================

The recommended five-step demonstration story is:

01 — SPOT
Identify an important operational signal.

02 — EXPLAIN
Explain what is happening and why it matters.

03 — ACT
Show the operator taking an appropriate action.

04 — PREDICT
Show how forecasting/analytics helps with the next decision.

05 — PROVE
Show the resulting or expected measurable value.

Core narrative:

INSIGHT
→ ACTION
→ MEASURABLE OUTCOME

===================================================
OPTIONAL / "WOW" IDEAS
===================================================

The presentation mentioned possible optional enhancements such as:

- Map experience
- AI assistant
- Maintenance risk
- Cost optimization
- Mobile workflow
- Natural-language summary

These are NOT mandatory.

Only implement an optional feature if it creates meaningful judging value
without threatening the quality or reliability of the core solution.

===================================================
SOLUTION ARCHITECTURE
===================================================

The presentation illustrated the overall concept as:

TELEMETRY
→ PLATFORM
→ INTELLIGENCE
→ ACTION

The exact technology stack is left to the team.

The architecture should be:

- credible
- maintainable
- explainable
- testable
- reliable
- appropriate for the hackathon time limit

Do not introduce complexity merely to make the architecture look advanced.

===================================================
IMPORTANT EXPECTATION
===================================================

The judges are evaluating understanding, approach and execution.

The team must be able to clearly explain:

- What problem is being solved?
- Who is the user?
- Why did we choose this solution?
- How does the system work?
- Why did we choose this architecture?
- Why this database?
- Why this analytics approach?
- How are anomalies detected?
- How is forecasting performed?
- Why are recommendations made?
- What happens when data is missing or incorrect?
- What are the limitations?
- What would be improved in a production system?

The team should understand the implementation rather than merely demonstrate
AI-generated output.

===================================================
FINAL SUCCESS CRITERIA
===================================================

The final solution should be:

PROBLEM-DRIVEN
BUSINESS-RELEVANT
INNOVATIVE
TECHNICALLY CREDIBLE
EASY TO USE
EXPLAINABLE
RELIABLE
DEMOABLE

The ideal operational loop is:

DATA
→ INSIGHT
→ EXPLANATION
→ RECOMMENDATION
→ ACTION
→ OUTCOME

The ideal demonstration is:

SPOT
→ EXPLAIN
→ ACT
→ PREDICT
→ PROVE
```

</details>
