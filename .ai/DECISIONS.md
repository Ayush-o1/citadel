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
