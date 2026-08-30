# Hackathon playbook

The operational sequence from the moment Caterpillar reveals the problem
statement through to interviews. Don't skip the planning steps — with
roughly one real build day (see `OVERVIEW.md`'s timeline), building the
wrong thing well is worse than building the right thing simply.

```
BOOT (.ai/AGENTS.md)
  → READ CONTEXT → READ PROBLEM → RESEARCH → REQUIREMENTS → SUCCESS CRITERIA
  → COMPETITOR / COMMON-SOLUTION ANALYSIS → INNOVATION OPPORTUNITIES
  → MVP → FEATURE PRIORITY → ARCHITECTURE → DATABASE → API DESIGN → UX/UI DESIGN
  → TESTING STRATEGY → TEAM DECOMPOSITION → PHASES → TASKS
  → IMPLEMENTATION → INTEGRATION → TESTING → REVIEW → FIX → POLISH
  → DEMO PREPARATION → REQUIREMENT AUDIT → FINAL QUALITY AUDIT
  → PRESENTATION DEFENSE → INTERVIEW DEFENSE → FINAL CHECKPOINT
```

This is a checklist of stages, not a fixed set of phases — see `ROADMAP.md`
for how the real phases get created and sized for the actual problem.

## Step 1 — Get the problem statement into the repo

Paste the real problem statement into `../PROBLEM-STATEMENT.md` at the repo
root the moment it's given. Everyone and every agent works from that file
— not from memory, a screenshot, or a WhatsApp message.

## Step 2 — Problem-Statement Mode: analyze before coding

Do not start implementing until this is done. Fill in
`problem-statement/ANALYSIS-TEMPLATE.md` as a team, out loud, before anyone
opens an editor:

1. Read the full statement
2. Rewrite the problem in plain language
3. Identify users
4. Identify workflows
5. Extract explicit requirements → seed `REQUIREMENTS.md`
6. Infer implicit requirements → mark them `Implicit` in `REQUIREMENTS.md`
7. Identify ambiguity — write it down, don't silently assume
8. Identify constraints (time, data, tech)
9. Identify edge cases
10. Identify success criteria
11. Research the domain (see "Research" below) → log in `RESEARCH.md`
12. Research existing solutions/products
13. Identify what other teams will probably build (the obvious solution)
14. Identify real differentiation opportunities (see "Innovation" below)
15. Define the MVP
16. Define SHOULD-HAVE features
17. Define STRETCH features
18. Define what to deliberately NOT build
19. Design architecture (adapt `ARCHITECTURE.md` — don't restart the stack)
20. Design the data model
21. Design the APIs
22. Design frontend information architecture
23. Define testing strategy
24. Define team work split
25. Create phase files under `phases/` (update `ROADMAP.md`'s index)
26. Create GitHub issues for the first phase's tasks
27. Estimate risk/time per phase
28. Only now: begin implementation

Skipping straight to step 28 is the most common way hackathon teams run
out of time building the wrong thing.

## Research

Research answers a specific question — domain knowledge, existing
products, technical alternatives, relevant APIs/datasets, security
considerations, UX conventions, genuine Caterpillar relevance. It is not
open-ended browsing. Every finding that actually influenced a decision
goes in `RESEARCH.md` with source, date, finding, relevance, and the
decision it influenced — if it's not written down, it doesn't exist for
the next agent.

## Innovation framework

The default AI-hackathon shape — problem → login → CRUD → dashboard → done
— rarely stands out because most teams will build exactly that. For every
major feature, ask in order:

1. What's the obvious implementation?
2. What will most teams probably build?
3. What would make ours meaningfully better — in workflow, UX, automation,
   decision support, explainability, reliability, observability,
   accessibility, resilience, speed, data quality, or real-world
   usefulness?

Then, before building the improved version, answer: **why** (what problem
does it actually solve), **value** (to the user, to the demo), **cost**
(time), **risk**, **how to implement**, **how to demonstrate** it clearly
in the demo. An innovation that can't be demonstrated clearly is worth
less than a simple feature that visibly works — see `QUALITY.md`'s
demo-first thinking.

## Step 3 — Adapt this starter, don't rebuild it

Once the MVP and data model are agreed:
- Rename or delete the `items` example module
  (`server/src/modules/items/`, `client/src/pages/Items.jsx`,
  `client/src/api/items.js`) as your first real feature, or copy it as a
  template.
- Write new migrations in `server/db/migrations/` for the real schema —
  see `ARCHITECTURE.md`'s "Why no ORM" and database design steps in
  `QUALITY.md`.
- Add new frontend pages/routes as needed.
- Only add auth/AI/uploads/real-time/etc. if the MVP actually needs them —
  `ARCHITECTURE.md` documents exactly how each plugs in.

## Step 4 — Split the team and track work

Use GitHub Issues + a Project board (`To Do` / `In Progress` / `Blocked` /
`Done`) instead of a custom tool.

### GitHub as project management

Prefer GitHub-native mechanisms over building our own: Issues for tasks,
a Project board for the To-Do/In-Progress/Blocked/Done view, Milestones
per phase if useful, and Labels for quick filtering. This repo already has
labels for: issue type (`bug`, `documentation`, `question`, ...) plus
MoSCoW priority (`must-have`, `should-have`, `nice-to-have`, `stretch`)
and workflow state (`blocked`, `research`, `tech-debt`) — apply them when
creating issues instead of inventing a new taxonomy.

### Team responsibility template

Fill this in once the MVP and task split are decided — don't pre-assign
roles before the problem is known (see `OVERVIEW.md`):

| Name | GitHub | Area / role | Current task | Status |
|---|---|---|---|---|
| Ayush | `Ayush-o1` | | | |
| Astik | `Astik01` | | | |
| Eklavya | `eklavaya008` | | | |
| Souharda | `Souharda6996` | | | |

Split by skill + dependency + risk + speed + file ownership — avoid four
people editing the same files. Before claiming a task, identify the
specific files/components it touches (this is what phase files' "Files /
systems affected" section is for).

## Step 5 — Implement, integrate, test continuously

- Work feature-by-feature, not layer-by-layer.
- Merge to `main` frequently — see `GIT-WORKFLOW.md`. An unmerged branch
  sitting for a day is a feature at risk of being cut.
- Keep `server/tests/` covering at least what matters for the demo.
- Keep `main` runnable at all times — if it breaks, fixing it is the top
  priority for whoever broke it (see `GIT-WORKFLOW.md`'s checkpoint rules).
- Follow the verification loop in `QUALITY.md` for every feature — code
  existing is not the same as code working.

## Time management (during the actual event)

Track continuously, not just at the start: total time, time elapsed, time
remaining, MVP status, open high-priority risks, demo readiness. If the
plan has become unrealistic, cut scope (`STRETCH` first, see `QUALITY.md`'s
MVP control) — don't keep following a plan reality has outrun. Update
`STATE.md` when scope changes so the next person/agent isn't working from
a stale plan.

## Step 6 — Prepare the demo

- Decide the demo script (what gets clicked through, in what order) hours
  before presentation, not five minutes before.
- Seed realistic-looking data (`server/db/seed.js`).
- Have a fallback if live demo fails (screenshots, a recorded backup).
- Before presenting, audit `REQUIREMENTS.md`: what's `VERIFIED`, what's
  `DEFERRED` and why — know the answer before a judge asks it.

## Step 7 — Prepare panel and interview defense

Make sure `ARCHITECTURE.md` and `DECISIONS.md` reflect what was actually
built, not what this starter assumed on day zero. Be ready to answer, with
real reasons, not improvised ones: why this architecture, why this
database, why this API design, why this tech, what tradeoffs, what
alternatives, what security, what scalability, what edge cases, what
limitations, what's the innovation, why is it relevant to Caterpillar. If
an interviewer asks "why?" five times about any decision, `DECISIONS.md`
should already have the answer.
