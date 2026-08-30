# Project overview

## What this is

Citadel is the command-center repository for a 4-person team competing in
the Caterpillar campus placement hackathon. It is not a product — it's the
foundation, process, and institutional memory the team uses to build the
actual product fast once Caterpillar reveals the problem statement.

## Mission

Build the best realistic solution to whatever problem statement Caterpillar
gives us, optimized for winning the hackathon and getting the team
shortlisted for interviews. This is a hiring assessment, not just a coding
contest — technical quality, problem understanding, UX, reliability,
teamwork, and how well each person defends the work in interviews all
count.

## Event timeline

| Date | Key milestones |
|---|---|
| Tue 2026-09-01 | Problem statement revealed ~10:25; hackathon runs 11:30–18:30 |
| Wed 2026-09-02 | Hackathon continues 09:00–11:30; presentations to panel 12:00–18:30; shortlist announced ~19:30–20:30 |
| Thu 2026-09-03 | Individual interviews 09:00–17:00+; results by ~19:30 |

**Implication:** roughly one full day of actual build time before it
becomes presentation and defense. Scope control (`QUALITY.md`) is not
optional — a smaller, polished, well-defended solution beats a larger
broken one.

## Team

| Name | GitHub | Access |
|---|---|---|
| Ayush | `Ayush-o1` | Owner / admin |
| Eklavya (Eklavaya Singh) | `eklavaya008` | Collaborator (write) — accepted |
| Astik | `Astik01` | Collaborator (write) — invited, pending acceptance |
| Souharda (Souharda Mandal) | `Souharda6996` | Collaborator (write) — invited, pending acceptance |

Note: an unrelated GitHub account, `Ayush-01` (digit zero, not the letter
"o"), was mentioned once in setup instructions but is **not** this team's
account — the real owner account is `Ayush-o1`. Don't invite or grant
access to `Ayush-01`.

Roles are not pre-assigned. Work is split by skill/dependency/risk once the
real problem and required features are known — see `PLAYBOOK.md`.

## Technical reality (read before proposing tech choices)

The team is a group of B.Tech CSE students, comfortable with HTML/CSS/JS,
Express, PostgreSQL and MongoDB, basic React/Node/Docker/Python, and DSA in
C++. Several past projects were built with AI assistance.

**Constraint this implies:** every technology or pattern in this repo must
be something the team can explain and defend in an interview, unprompted.
Prefer boring and correct over new and impressive. Don't introduce a
framework, database, or architecture pattern because it looks advanced —
justify it in `DECISIONS.md` or don't add it.

## Current stack (see `ARCHITECTURE.md` for detail and rationale)

React (Vite) + Express + PostgreSQL, no ORM, no auth, no AI integration by
default. Chosen because it's what the whole team already knows and it
generalizes to almost any CRUD/workflow/dashboard-shaped problem without
rework.

## What this repo deliberately does not contain yet

No domain logic, no fake Caterpillar features, no pre-built dashboards, no
authentication, no AI features. These are not gaps — they're deliberate,
because building any of them before the real problem statement risks
guessing wrong and wasting hackathon time ripping it out. See `ROADMAP.md`
for how the real phases get created once the problem is known.

## Other projects — do not confuse with Citadel

Ayush's separate interview-prep projects (BW, 042-X, ContextForge, and one
more) are unrelated to this repository and this hackathon. If asked about
those, they live elsewhere — nothing in this repo should reference them.
