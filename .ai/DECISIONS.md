# Decisions

A running log of real technical decisions, most recent first. This is for
panel defense — when they ask "why did you choose X", the answer is here
with the actual reasoning, not reconstructed after the fact.

Add an entry every time the team makes a decision worth defending: a
library choice, an architecture change, a tradeoff accepted under time
pressure. Keep each entry short.

Format:

```
## <date> — <decision>
**Context:** what problem this was solving
**Decision:** what was chosen
**Alternatives considered:** what else was on the table
**Tradeoff:** what this costs
```

---

## 2026-09-01 — Phase 01: delete the `items` reference module; two schema deviations from the phase doc

**Context:** Phase 01 task 01.7 required a decision on the `items`
module's fate now that real domain tables exist. Also, implementing the
schema against the actual official sample data surfaced two places where
the phase doc's field list needed a small, justified correction rather
than a silent one.

**Decision 1 — delete `items`:** `items` was always a disposable
reference pattern (`ARCHITECTURE.md`: "delete the folder and that one
line"), not a real feature. With `equipment`/`checkouts`/`usage_logs`
now serving as the real, live examples of the same
routes→controller→service→repository pattern, keeping `items` around adds
an unused API surface and a client page/nav link with no purpose. Removed:
`server/src/modules/items/`, its route line, `client/src/pages/Items.jsx`,
`client/src/api/items.js`, the `/items` nav link, and the table itself via
migration `007_drop_items_table.sql` (a migration, not a manual `DROP`, so
a fresh database stays fully reproducible from the repo).

**Decision 2 — `checkouts.site_id` and `checkouts.expected_return_at` must
be nullable:** The Phase 01 doc's table listed `site_id` without marking
it nullable. But the official sample's `EQX1002`/`EQX1007` rows have
`Site ID = NULL` — a NOT NULL constraint would make it impossible to
store the official data as-is, directly contradicting the explicit
instruction to preserve it unmodified. This wasn't actually a conflict
with the plan: Phase 05's anomaly rule table already specified
`MISSING_ASSIGNMENT` as `operator_id IS NULL OR site_id IS NULL`, which
only makes sense if `site_id` is nullable — the phase doc's table just
hadn't caught up to its own rule. `expected_return_at` is nullable for
the same reason: the historical official rows have no "expected return"
concept (they're already completed, with only actual checkout/check-in
dates), so it stays `NULL` for historical rows and is only set on the
live/active synthetic checkouts Phase 02 creates for the alert demo.

**Decision 3 — natural business codes on `sites`/`operators`:** The phase
doc's table listed only `id, name, location` for `sites` and
`id, name, site_id` for `operators`. The official sample references sites
and operators by short codes (`S003`, `OP101`, ...), not names — added a
unique `code` column to both tables (mirroring the `equipment_code`
pattern the phase doc already specified for `equipment`) so the official
codes can be stored and displayed as-is instead of being silently
translated into invented names.

**Alternatives considered:** Keeping `items` as a permanently-available
example — rejected, dead weight once real modules exist. Fabricating a
placeholder site/operator for `EQX1002`/`EQX1007` instead of allowing
NULL — explicitly rejected by the task instructions ("do not fabricate
business meaning the official data does not support").

**Tradeoff:** None significant — these are corrections that make the
schema match both the official data and the plan's own downstream rules,
not a new design direction.

---

## 2026-09-01 — Reconciling the official sample dataset shape with the data model

**Context:** The official one-page handout's sample table (`../PROBLEM-STATEMENT.md`
Source A) shows one row per *completed* rental with pre-aggregated
`Engine Hours/Day`, `Idle Hours/Day`, and `Operating Days` — not raw daily
telemetry. `phases/PHASE-01-data-model.md` was designed around raw daily
`usage_logs` (needed to demo the "LOG USAGE" step live). These aren't in
conflict, but needed reconciling.

**Decision:** `usage_logs` stays the source of truth for daily telemetry
(what gets written during a live demo check-in/log action).
`Engine Hours/Day` / `Idle Hours/Day` / `Operating Days` / utilization are
always **computed** from `usage_logs` for a given checkout, never stored
as separate columns — one calculation, no risk of the two disagreeing.
Phase 02's synthetic data reproduces the exact 7 official equipment IDs
(`EQX1001`–`EQX1007`) as historical completed checkouts, with daily
`usage_logs` rows generated to average out to the official handout's
exact per-day figures — so the demo can literally say "this is
Caterpillar's own sample data, not ours." Additional synthetic
equipment/checkouts are generated on top for volume and to populate the
live-demo alert states, per `phases/PHASE-02-synthetic-data.md`.

**Notable signal directly from the official data:** `EQX1002` and
`EQX1007` both have `Site ID = NULL`, `Last Operator ID = NULL`, and `0`
Engine Hours/Day — almost certainly Caterpillar's own worked example of
the "unassigned equipment" / "zero runtime" anomaly. Phase 05's rules are
written to catch exactly this pattern, not a hypothetical one.

**Alternatives considered:** Storing the aggregate fields directly on
`checkouts` (matches the handout shape more literally) — rejected because
it creates two sources of truth (stored aggregate vs. summed
`usage_logs`) that could silently drift.

**Tradeoff:** One extra join/aggregation query to produce the per-day
summary view instead of reading a column directly. Acceptable at this
data scale.

---

## 2026-09-01 — Tech stack decision gate: keep React + Express + PostgreSQL for the Smart Rental Tracking System

**Context:** The official problem statement (Smart Rental Tracking System
/ Control Tower) arrived. Per the pre-hackathon rule, the stack must be
chosen *after* understanding the problem, not carried over by default.
Re-evaluated deliberately rather than assumed.

**Options considered, per component:**
- **Frontend:** React (known, fast) vs. a server-rendered framework
  (more structure than a 2-screen app needs) vs. a no-build vanilla stack
  (would cost more implementation time for no benefit at this scale).
- **Backend:** Express (known) vs. a Python service for the analytics
  layer specifically (would split the codebase across two languages and
  two deploy stories for no capability we actually need — see the
  AI/ML decision below, since no library-only-available-in-Python is
  required).
- **Database:** PostgreSQL, single database (known, relational, fits the
  domain — equipment/checkouts/usage/alerts/anomalies/forecasts are all
  clearly relational with real foreign keys) vs. MongoDB (no
  document-shaped data exists in this problem) vs. adding a time-series
  DB for telemetry (the data volume — a handful of assets, periodic
  synthetic logs — doesn't warrant one; Postgres handles it trivially).
- **Analytics:** in-process JS modules computing rules/statistics over
  Postgres data vs. a separate ML service/pipeline (rejected — see the
  AI/ML approach decision below).

**Decision:** Keep the existing stack unchanged — React (Vite) + Express
+ PostgreSQL, no ORM, single database, analytics implemented as plain
backend service modules (see `ARCHITECTURE.md`'s analytics-layer update).

**Why this is safest for the hackathon:** zero ramp-up time (team already
knows it — see `OVERVIEW.md`), one language end-to-end (JS) so any of the
four people can work in any module, one deploy story, and it's already
running and verified (Phase 00). Every one of the six required
capabilities is either straightforward CRUD or a computation over rows
already in Postgres — nothing in the problem statement needs a
capability this stack lacks.

**Performance/security/maintainability:** unchanged from the Phase 00
baseline (`ARCHITECTURE.md`) — no new concerns introduced by this domain
at this data scale (single-digit-to-low-hundreds of synthetic rows).

**Team-learning risk:** none — no new technology introduced.

**Tradeoff:** None identified that outweighs the switching cost. Revisit
only if a specific requirement surfaces mid-hackathon that this stack
genuinely can't satisfy (none identified as of this writing).

## 2026-09-01 — Rule-based analytics, not a trained ML model

**Context:** Problem statement explicitly warns against pretending a
sophisticated model is meaningful when the dataset can't support it (the
demonstrated sample is 7 assets), and requires every anomaly/forecast to
be explainable — "why was this flagged," not just "it was flagged."

**Decision:** Anomalies and alerts are deterministic rules over computed
fields (idle ratio, runtime, assignment presence, due dates). Forecasting
uses a trailing-window statistical method (moving average or exponential
smoothing — see `RESEARCH.md` R-001), not a trained model. Recommendations
are a deterministic mapping from signal type to
action/expected-impact text.

**Alternatives considered:** A small trained classifier for anomaly
detection — rejected: no labeled training data exists, and a trained model
on this little synthetic data would be less defensible in a panel
interview than a threshold the team can point to and justify (`RESEARCH.md`
R-002), not more impressive. An LLM-based "AI assistant" chatbot —
explicitly listed as optional/non-mandatory in the problem statement and
rejected as this hackathon's differentiator (every team will have one);
effort is better spent making the rule-based Action Queue genuinely good.

**Tradeoff:** Less "AI" in the literal sense than a model-based pitch
might sound like. Accepted deliberately — the AI & Analytics judging
criterion (15%) explicitly asks whether predictions are "relevant,
transparent and actionable," which a defensible rule scores on directly;
an unexplainable model would score worse on that same criterion even if
more sophisticated.

**Anomaly thresholds (see `RESEARCH.md` R-002):** `EXCESSIVE_IDLE` when
idle_ratio (idle_hours / (engine_hours + idle_hours)) exceeds 0.40 for a
checked-out asset; utilization is framed against a 65–75% healthy band
matching industry benchmarks, not an arbitrary number.

---

## 2026-08-30 — React + Express + PostgreSQL, no ORM

**Context:** Building the hackathon starter before the problem statement
exists; needed a stack the whole 4-person team can use and defend without
ramping up on something new mid-hackathon.

**Decision:** React (Vite) frontend, Express backend, PostgreSQL with raw
SQL via `pg` and plain-file migrations (no ORM).

**Alternatives considered:** Next.js (more structure than needed for a
2-day build); Prisma/Sequelize (adds a schema DSL and migration tooling on
top of SQL everyone already knows); MongoDB as primary store (the domain is
unknown, but most CRUD-shaped hackathon problems fit relational data fine,
and the team is equally comfortable with both).

**Tradeoff:** No auto-generated types or schema-from-code; migrations are
hand-written SQL. Acceptable — the schema will be small and change fast
early on, and SQL is faster to read/change under time pressure than
learning an ORM's abstractions mid-hackathon.

## 2026-08-30 — No authentication, no AI integration by default

**Context:** The problem statement doesn't exist yet; building either in
now risks wasted work or fighting the wrong shape of auth/AI once
requirements are known.

**Decision:** Ship the starter with neither, but document the exact
integration point for both in `ARCHITECTURE.md`.

**Alternatives considered:** Pre-wiring a generic JWT auth flow "just in
case" — rejected, since roughly half of hackathon problem statements don't
need user accounts at all, and ripping out unused auth costs more time than
adding it fresh would.

**Tradeoff:** If the problem statement requires auth, there's a small
amount of setup time on day one instead of zero. Judged worth it to avoid
carrying unused complexity into every other decision until then.

## 2026-08-30 — Consolidated `docs/` into `.ai/` as one AI-agent operating system

**Context:** The team needs the repository to work as a complete,
self-contained source of truth: any future agent (different machine,
different AI account or model, zero chat history) must be able to clone it
and understand full project state without asking anyone. A separate
`docs/` (human narrative) and a hypothetical second state-tracking tree
would risk drift between the two.

**Decision:** One canonical location, `.ai/`, holding both the
process/state machinery (`AGENTS.md`, `STATE.md`, `HANDOFF.md`,
`ROADMAP.md`, `phases/`, `ISSUES.md`, `QUALITY.md`) and the narrative docs
that used to live in `docs/` (`ARCHITECTURE.md`, this file,
`GIT-WORKFLOW.md`, `PLAYBOOK.md`, the problem-statement template). `README.md`
points here as the required entrypoint for anyone — human or agent —
picking the project back up.

**Alternatives considered:** Keeping `docs/` for humans and adding a
separate `.ai/` just for agent state — rejected, since a dot-folder is
just as readable by a human on GitHub, and two locations for the same kind
of information is exactly the drift risk this system exists to prevent.

**Tradeoff:** None significant — a directory rename/consolidation, not a
scope change.

## 2026-08-30 — Corrected GitHub account: `Ayush-o1`, not `Ayush-01`

**Context:** A setup instruction referenced the repository owner's account
as `Ayush-01` (digit zero). Verified via the GitHub API that this is a
real but entirely unrelated account (`ayush-01`, id `72971850`, no
display name) — not the team's account.

**Decision:** The correct, verified account is `Ayush-o1` (letter "o", id
`243273707`, display name "Ayush kumar"), which is where this repository
actually lives and which the local `git remote` and `gh auth` both
confirm. Recorded here so no future agent "corrects" it back to the wrong
one from a stale instruction.

**Tradeoff:** None — this is a factual correction, not a design choice.
