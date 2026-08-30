# Hackathon playbook

The operational sequence to follow the moment Caterpillar reveals the
problem statement (Sept 1, 2026). Don't skip straight to coding — the steps
before "Implement" are what keep a 2-day build from running out of time on
the wrong thing.

```
Problem statement arrives
        ↓
Understand requirements
        ↓
Extract users
        ↓
Extract core problem
        ↓
Define MVP
        ↓
Choose architecture (adapt this repo — don't restart it)
        ↓
Create data model
        ↓
Split team tasks
        ↓
Create GitHub issues
        ↓
Implement
        ↓
Integrate
        ↓
Test
        ↓
Prepare demo
        ↓
Prepare panel defense
```

## Step 1 — Get the problem statement into the repo

Paste the actual problem statement into `PROBLEM-STATEMENT.md` at the repo
root as soon as it's given. Everyone works from that file, not from memory
or a screenshot.

## Step 2 — Analyze before coding

Copy `docs/PROBLEM-STATEMENT-TEMPLATE.md` and fill it in as a team — ideally
out loud, in the first 30–45 minutes, before anyone opens an editor. It
covers: problem interpretation, users, functional/non-functional
requirements, MVP vs. nice-to-have, architecture, data model, API list,
frontend screens, task split, risk, and demo strategy.

Don't start implementing until this is filled in and everyone agrees on the
MVP. Cutting this step to "save time" is the single most common way
hackathon teams run out of time building the wrong thing.

## Step 3 — Adapt this starter, don't rebuild it

Once the MVP and data model are agreed:
- Rename or delete the `items` example module (`server/src/modules/items/`,
  `client/src/pages/Items.jsx`, `client/src/api/items.js`) as your first
  real feature, or as a template to copy.
- Write new migrations in `server/db/migrations/` for the real schema.
- Add new frontend pages/routes as needed.
- Only add auth/AI/uploads/etc. if the MVP actually needs them — see
  `docs/ARCHITECTURE.md` for how each plugs in.

## Step 4 — Split the team and track work

Use GitHub Issues + a Project board (To Do / In Progress / Blocked / Done)
instead of a custom tool — it's already integrated with PRs and everyone
already knows it.

### Team responsibility template

Fill this in once the MVP and task split are decided:

| Name     | GitHub          | Area / Role                  | Current task | Status |
|----------|-----------------|-------------------------------|---------------|--------|
| Ayush    | Ayush-o1        |                                |               |        |
| Astik    | Astik01         |                                |               |        |
| Eklavya  | eklavaya008     |                                |               |        |
| Souharda | Souharda6996    |                                |               |        |

A reasonable default split for this stack: one person owns the data model +
migrations, one owns backend routes/business logic, one owns frontend
pages, one floats between integration/testing/demo prep. Adjust based on
what the actual problem statement needs.

## Step 5 — Implement, integrate, test continuously

- Work feature-by-feature, not layer-by-layer (don't have one person build
  "all the backend" while another waits to build "all the frontend").
- Merge to `main` frequently — see `docs/GIT-WORKFLOW.md`. A feature
  sitting unmerged on a branch for a day is a feature at risk of being cut.
- Keep `server/tests/` covering at least the routes that matter for the
  demo — not full coverage, just enough that a regression is caught before
  the panel sees it.
- Keep the app runnable at all times. If `main` breaks, fixing it is the
  top priority for whoever broke it.

## Step 6 — Prepare the demo

- Decide the demo script (what you'll click through, in what order) at
  least a couple hours before presentation time, not five minutes before.
- Seed whatever data makes the demo look real (`server/db/seed.js` is the
  place for this).
- Have a fallback plan if live demo fails (screenshots, a recorded backup).

## Step 7 — Prepare panel defense

Before presenting, make sure `docs/ARCHITECTURE.md` and `docs/DECISIONS.md`
actually reflect what was built (not what this starter assumed). Panels
tend to ask "why" more than "what" — the decisions log is there so the
answer is a real reason, not improvised on the spot.
