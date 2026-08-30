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
integration point for both in `docs/ARCHITECTURE.md`.

**Alternatives considered:** Pre-wiring a generic JWT auth flow "just in
case" — rejected, since roughly half of hackathon problem statements don't
need user accounts at all, and ripping out unused auth costs more time than
adding it fresh would.

**Tradeoff:** If the problem statement requires auth, there's a small
amount of setup time on day one instead of zero. Judged worth it to avoid
carrying unused complexity into every other decision until then.
