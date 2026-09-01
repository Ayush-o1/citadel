# Problem statement analysis — Smart Rental Tracking System

Filled from `ANALYSIS-TEMPLATE.md` against the official problem statement
in `../../PROBLEM-STATEMENT.md` (received 2026-09-01). This is the record
of Problem-Statement Mode (`../PLAYBOOK.md`) — read this before touching
code so nobody re-derives it from scratch mid-hackathon.

## 1. Problem interpretation

Caterpillar wants a credible **operational control tower** for rental
equipment: track each asset from checkout to return, show whether it's
being used well, catch what's going wrong, predict what will be needed
next, and — critically — tell the operator what to *do* about it. The
judges are explicitly testing whether the dashboard "recommends" rather
than just "reports." A generic CRUD-plus-charts app scores badly here even
if every screen works, because it stops at reporting.

## 2. Users

One primary user: **the rental/fleet operations user** (dispatcher /
control-tower operator) — the person deciding what to check out, what to
chase down, what to reassign. Everything is designed for this one persona
making fast decisions, not for an equipment operator in the field or an
executive viewing quarterly reports.

## 3. Workflows

The core asset lifecycle, exactly as specified:
`CHECK OUT → ASSIGN & TRACK → LOG USAGE → CHECK IN`, with every status
change answering **who / what / where / when**. Secondary workflow: the
control-tower user scanning the **Action Queue**, opening a flagged
signal, reading its explanation, and taking (or dismissing) the
recommended action.

## 4. Functional requirements

See `../REQUIREMENTS.md` for the numbered, traceable list (`REQ-001`...).
Summary: asset inventory + live status, check-out/check-in, usage logging,
alerts (upcoming return / overdue / missing info), anomaly detection
(idle / zero-runtime / missing assignment / unusual movement) with stated
reasons, demand forecasting by equipment type/site/time with stated
factors, and a recommendation layer that turns every signal into
signal → reason → action → expected impact.

## 5. Non-functional requirements

- **Explainability** is a functional requirement here, not a nice-to-have
  — every anomaly, forecast, and recommendation must state *why*. This is
  15% of the judging score on its own (AI & Analytics) and implicitly
  drives Technical Solution (20%) too.
- **Demo reliability** over raw performance — this runs for one demo, on
  a laptop, against synthetic data at the scale of the sample dataset (7
  assets). No load/scale requirement exists or should be invented.
- Standard hackathon security baseline (see `../QUALITY.md`) — no
  enterprise auth/compliance requirement stated or implied.

## 6. Ambiguity

- No real telemetry, QR/RFID, or notification channel exists — explicitly
  fine to simulate (problem statement, "DATA" section). Resolution:
  synthetic data generator (Phase 02) + in-app simulated
  checkout/check-in/usage-entry forms; no external hardware or SMS/email
  integration.
- "Optional / WOW ideas" (map, AI assistant, maintenance risk, cost
  optimization, mobile workflow, NL summaries) are explicitly optional —
  resolution in §16 (differentiation) and §8 (MVP).
- No specified authentication/multi-tenant requirement. Resolution:
  single-operator context, no auth (matches existing `DECISIONS.md`
  default) — revisit only if judging feedback during the event says
  otherwise.

## 7. Constraints

Real build time is roughly one day (see `../OVERVIEW.md` timeline). Team
skill set is React/Express/Postgres-comfortable, not ML-comfortable (see
`../OVERVIEW.md`). Sample dataset is tiny (7 assets) — any model or method
chosen must be honest about what that scale can and can't support (problem
statement explicitly warns against "a sophisticated ML model... when the
data cannot support it").

## 8. Edge cases

- Asset checked out with no operator or site assigned (`MISSING_ASSIGNMENT` anomaly).
- Usage log with zero engine hours while checked out (`ZERO_RUNTIME`).
- Checkout past its expected return date, never checked in (`OVERDUE`).
- An equipment type/site pair with too little history to forecast — must
  degrade honestly ("insufficient history"), not fabricate a number.
- Duplicate/conflicting check-out (asset already checked out) — reject at
  the API, don't silently overwrite.

## 9. Success criteria

The mandatory demonstration list from the problem statement, verbatim:
asset live status, check-in/check-out flow, usage trends, overdue
insight, ≥1 forecast, ≥1 anomaly, a recommendation/action from an
insight, and a measurable-or-clearly-labeled-as-assumed outcome. Judged
against the stated weights: Business Impact 25%, Innovation 25%,
Technical Solution 20%, UX 15%, AI & Analytics 15%.

## 10. Domain research

See `../RESEARCH.md` (`R-001`, `R-002`) — forecasting method choice and
anomaly/utilization thresholds are grounded in cited industry sources, not
invented numbers.

## 11. What other teams will probably build

Every team has the same slide deck and the same AI tools. The likely
default: a React dashboard with a table of assets, a couple of charts, a
checkout form, and a chatbot bolted on for "AI." The problem statement
itself calls this out as insufficient differentiation.

## 12. Differentiation strategy

Not visual effects, not a chatbot. Differentiation comes from doing the
**Action Queue** properly: every alert, anomaly, and forecast collapses
into one ranked list of `signal → reason → recommended action → expected
impact`, sourced from real (simulated) data, with thresholds the team can
defend with citations (`../RESEARCH.md`). The demo story becomes "here's a
real problem the system caught, here's why, here's what it told the
operator to do, here's the effect" — which is exactly the SPOT → EXPLAIN →
ACT → PREDICT → PROVE narrative the problem statement asks for, produced
by the product itself rather than narrated over slides.

## 13. MVP (must-have)

1. Equipment inventory + live status (available / checked-out / overdue)
2. Check-out / check-in flow (asset + operator + site, timestamps)
3. Usage logging (engine hours, idle hours, fuel, location, condition)
4. Alerts: upcoming return, overdue, missing info
5. Anomaly detection: excessive idle, zero runtime, missing assignment — each with a stated reason
6. Forecasting: demand by equipment type + site over a trailing window, with stated factors
7. Recommendation / Action Queue unifying 4–6 into signal → reason → action → expected impact
8. Control Tower screen: live status, utilization, action queue
9. Asset Dashboard screen + check-in/check-out UI
10. Synthetic data realistic enough to make all of the above show real signals

## 14. Should-have

- Unusual-movement anomaly (asset location inconsistent with assigned site)
- Historical usage trend view per asset/site
- Marking a recommendation as actioned/dismissed (closes the loop visibly in the demo)

## 15. Stretch (only after MVP is excellent)

- One "optional/WOW" idea, chosen for judging value vs. risk — candidate:
  a natural-language one-line summary of the Action Queue's top signal
  (still rule-driven text generation, not a new AI dependency). Map view
  and mobile workflow are explicitly deprioritized — high effort, low
  marginal judging value given the weights.

## 16. Explicitly NOT building

Authentication/multi-user roles, real hardware/QR/RFID integration, a
chatbot, a map view, a second database, real-time push notifications
(actual email/SMS), predictive maintenance, or any ML model beyond simple,
explainable statistical methods. Each would cost build time disproportionate
to its judging weight relative to the core loop.

## 17. Architecture fit

The existing Citadel stack (React/Vite + Express, layered
routes→controller→service→repository, PostgreSQL, no ORM — see
`../ARCHITECTURE.md`) fits this problem directly: it's a relational,
CRUD-plus-computed-views domain, not a document-store or real-time-stream
problem. No new datastore, framework, or infrastructure is needed. See the
tech-stack decision gate in `../DECISIONS.md`. New addition: an
`analytics/` layer (alerts, anomalies, forecasting, recommendations) — see
`../ARCHITECTURE.md`'s update.

## 18. Data model

See `../phases/PHASE-01-data-model.md` for the full schema. Entities:
`sites`, `operators`, `equipment`, `checkouts`, `usage_logs`, `alerts`,
`anomalies`, `forecasts`, `recommendations`.

## 19. API list

Defined per-phase as each module is built (`phases/PHASE-03-core-apis.md`
onward) rather than duplicated in a separate global file — see
`../ARCHITECTURE.md`'s module-per-folder convention.

## 20. Frontend information architecture

See `../DESIGN.md`. Two screens for MVP: **Asset Dashboard** (inventory +
check-out/check-in) and **Control Tower** (live status, utilization,
action queue). Information hierarchy is Attention → Explanation → Action,
not chart-first.

## 21. Testing strategy

Per `../QUALITY.md`'s verification loop, applied per phase: backend —
route tests against real validation/edge cases (duplicate checkout,
missing assignment, insufficient forecast history); frontend — loading /
error / empty states for both screens, not just the happy path.

## 22. Team task division

See `../PLAYBOOK.md`'s team responsibility table (filled) and `../ROADMAP.md`'s phase index.

## 23. Phases

See `../ROADMAP.md` — 11 phases created, `phases/PHASE-01-*.md` through `PHASE-11-*.md`.

## 24. Risk / time estimate

Highest-risk phase: forecasting (Phase 06) — risk is producing something
defensible on 7 assets' worth of synthetic history, not a code-complexity
risk. Mitigated by choosing a trailing-window method over anything
data-hungry (`RESEARCH.md` R-001), and by generating enough synthetic
history (Phase 02) that the trailing window has real data to work with.

## 25. Demo strategy

Follow the problem statement's own five-step narrative directly: SPOT a
flagged anomaly/alert on the Control Tower → EXPLAIN its stated reason →
ACT (mark it actioned/reassigned in the UI) → PREDICT (show the
forecast for that equipment type/site) → PROVE (show the labeled
before/after or expected-impact number, clearly marked as simulated). See
`phases/PHASE-11-demo-and-defense.md`.
