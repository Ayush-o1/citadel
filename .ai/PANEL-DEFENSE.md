# Panel defense

Answers to the problem statement's own "Important Expectation" question
list (`PROBLEM-STATEMENT.md` Source B, verbatim), each sourced to where
the real reasoning lives — not improvised on the spot. Presenter
assignments follow `TEAM-EXECUTION-PLAN.md`'s four sections; everyone
should be able to give the *short* answer to every question below, even
outside their section (`TEAM-EXECUTION-PLAN.md` §15's cross-team
questions are the specific ones most likely to get asked across lanes).

## 1. What problem is being solved?

Caterpillar rental equipment needs an operational control tower: track
every asset from checkout to return, catch what's going wrong, predict
what's needed next, and — the part most teams will skip — tell the
operator what to *do* about it, not just report a number.
(`problem-statement/ANALYSIS.md` §1)

## 2. Who is the user?

One persona: the fleet/rental operations dispatcher deciding what to
check out, what to chase down, what to reassign. Everything is designed
for fast decisions by this one role, not a field operator or an
executive. (`problem-statement/ANALYSIS.md` §2)

## 3. Why did we choose this solution?

Because the obvious solution — a table, a couple of charts, a checkout
form, a bolted-on chatbot — is what every team will build, and the
problem statement itself calls that insufficient. We invested the
differentiation budget in doing the Action Queue *properly*: every
alert/anomaly/forecast collapses into one ranked `signal → reason →
action → expected impact` item with a cited, defensible threshold behind
it, not a generic "AI insight." (`problem-statement/ANALYSIS.md` §11-12)

## 4. How does the system work?

`checkouts`/`usage_logs` (raw operational data) → `alerts`/`anomalies`
(rule-based, recomputed and synced into their own tables on every read)
→ `forecasts` (trailing-window average) → `recommendations` (reads all
three, ranks them, exposes the Action Queue). Two screens: Asset
Dashboard (do the work — check in/out, log usage) and Control Tower
(decide what to do next — Action Queue, Live Status, Utilization,
Forecast). See `TEAM-EXECUTION-PLAN.md` §2-8 for the full diagram set.

## 5. Why did we choose this architecture?

It's an adaptation of the existing starter, not a rebuild: layered
routes→controller→service→repository per module, no ORM (raw
parameterized SQL — small evolving schema, faster for a 4-person team to
read than an ORM's abstractions), analytics as plain service functions
reading the same Postgres tables rather than a separate pipeline. Nothing
here is invented for the demo — it's the same shape every module in the
codebase already uses. (`ARCHITECTURE.md`, `DECISIONS.md`'s "Tech stack
decision gate" and "React + Express + PostgreSQL, no ORM" entries)

## 6. Why this database?

PostgreSQL because the domain is genuinely relational (equipment ↔
checkouts ↔ usage_logs, with computed views on top) — not a document
store or a real-time-stream problem. No ORM because the schema is small
and evolves fast during a hackathon; raw SQL is faster for the whole team
to read and change than learning a query-builder's abstractions.
(`ARCHITECTURE.md`'s "Why no ORM"; `problem-statement/ANALYSIS.md` §17)

## 7. Why this analytics approach?

Rule-based, not a trained model, on purpose — the problem statement
itself warns against "a sophisticated ML model... when the data cannot
support it," and our real dataset (7 official assets + synthetic volume)
is exactly that scale. Every threshold is cited from real industry
research (`RESEARCH.md` R-001/R-002), not invented, and confirmed against
our own real seeded data before being trusted (`DECISIONS.md`'s "RISK-003
calibration result"). (`DECISIONS.md`'s "Rule-based analytics, not a
trained ML model" entry)

## 8. How are anomalies detected?

Four rules, each a plain comparison over real `checkouts`/`usage_logs`
data, computed fresh on every `GET /api/anomalies` and synced into the
`anomalies` table: **excessive_idle** (idle_hours / total_hours > 0.40,
the cited industry threshold), **zero_runtime** (any logged day with 0
engine hours while checked out), **missing_assignment** (no operator or
site, active or historical), **unusual_movement** (logged location
doesn't match the assigned site). Verified against Caterpillar's own
worked example: `EQX1002`/`EQX1007` (0 engine hours, no
operator/site) flag correctly; `EQX1003`/`EQX1005` (well-utilized) don't
flag at all. (`phases/PHASE-05-anomaly-detection.md`)

## 9. How is forecasting performed?

A plain trailing-window average, not exponential smoothing — chosen
specifically because with only 2-5 real checkouts per equipment-type/site
group, a tunable smoothing parameter adds no real benefit and is harder
to defend than "we averaged the last N checkouts." Sufficiency threshold:
at least 3 checkouts in the last 28 days; below that, the API returns
`insufficient_history: true` with the real count — never a fabricated
number. (`DECISIONS.md`'s "Phase 06: forecast method chosen" entry,
`phases/PHASE-06-forecasting.md`)

## 10. Why are recommendations made?

Because a signal nobody acts on doesn't move the business-impact needle
— it's a fact, not an action. Each alert/anomaly/forecast maps through
one function per source type into a `{signal, reason, action,
expected_impact}` recommendation, ranked (alert/anomaly before forecast,
oldest-surfaced-first), with a `PATCH` endpoint to mark it
actioned/dismissed so the loop visibly closes. Every expected-impact
string is explicitly prefixed `"Simulated:"` — we never present a
synthetic-data outcome as a measured real result.
(`phases/PHASE-07-recommendations.md`, REQ-016)

## 11. What happens when data is missing or incorrect?

Specific, tested behaviors, not assumptions: a duplicate check-out is
rejected with 409 at both the application level and the database level
(a partial unique index — `idx_checkouts_one_active_per_equipment` — so
even a race condition can't create two active checkouts for one asset); a
usage log against a non-active checkout is rejected; a malformed request
body is rejected with a field-level validation message (Zod); a
checkout/equipment with no operator or site is a first-class,
representable, flagged state (`MISSING_ASSIGNMENT`) rather than an error
— it's exactly how Caterpillar's own sample data represents it.
(`phases/PHASE-03-core-apis.md`, `DECISIONS.md`'s nullable-columns
reasoning)

## 12. What are the limitations?

Stated plainly, not hidden:
- Forecasting is a simple average on a genuinely small sample — it's
  honest about when it doesn't have enough data, but it's not a
  sophisticated predictive model, by design.
- A `pending` recommendation's wording refreshes on every sync, but a
  recommendation whose underlying signal has cleared doesn't
  auto-resolve — it sits until a human acts on it (`DECISIONS.md`'s
  Phase 09 entry, documented as a deliberate scope cut, not an oversight).
- Real Google Sign-In exists (three role-gated experiences, a real
  `users` table, server-persisted role), but role-based **authorization**
  is partial: the API enforces true identity-based ownership on the one
  place it matters most (a customer returning their own rental —
  `checkouts.service.js`'s `user_id` check), while most read endpoints
  aren't yet role-restricted server-side, and `/admin` and `/dealer`
  currently read the same unscoped recommendations feed rather than a
  role-scoped one. `RoleGate` on the frontend is a UX guard, not the
  authorization boundary — stated plainly, not hidden. See
  `.ai/DECISIONS.md`'s 2026-09-01 "Reversed 'no auth/multi-user roles'"
  and "Full product/UX audit, second pass" entries.
- Docker Compose (`RISK-001`) hasn't been run end-to-end this session;
  the app has only been verified via `npm run dev`/`node src/server.js`
  directly.
- All data is simulated — clearly labeled, never presented as measured
  real-world telemetry (REQ-015).

## What would be improved in a production system?

Full server-side role-based authorization (today, most read endpoints
trust the frontend's route gating; only self-return ownership is
enforced server-side) and a role-scoped recommendations feed (Admin and
Dealer currently see the same queue, differentiated only by framing, not
by which signals each role is shown); a background job for the
alerts/anomalies sync instead of computing on every read (fine at 21
equipment, wouldn't scale to a real fleet); auto-resolving
recommendations when their underlying signal clears; a real forecasting
model once there's enough historical volume to support one honestly;
Docker Compose validated as the actual deployment path; structured
logging/observability beyond `morgan`.

## Per-section presenter defense sheets

Each presenter (see `TEAM-EXECUTION-PLAN.md` §14) should be ready to go
one level deeper than the answers above on their own section, using the
10-question skeleton from `TEAM-EXECUTION-PLAN.md` §15 (what did you
build, why this way, how does it work, what alternative did you reject,
what can go wrong, how did you test it, performance/security
consideration, what tradeoff, how does it connect to the rest). The real
answers for each are already written out across the phase files and
`DECISIONS.md` — reread your own phase file(s) before presenting, don't
rely on memory of writing them.

- **Ayush** — Phases 00, 01, 02, 10: `phases/PHASE-01-data-model.md`,
  `PHASE-02-synthetic-data.md`, `PHASE-10-integration-and-polish.md`.
- **Astik** — Phases 03, 08: `phases/PHASE-03-core-apis.md`,
  `PHASE-08-asset-dashboard-ui.md`.
- **Eklavya** — Phases 04, 05, 06: `phases/PHASE-04-alerts.md`,
  `PHASE-05-anomaly-detection.md`, `PHASE-06-forecasting.md`.
- **Souharda** — Phases 07, 09: `phases/PHASE-07-recommendations.md`,
  `PHASE-09-control-tower-ui.md`.
