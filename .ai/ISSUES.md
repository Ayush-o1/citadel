# Issues register

Bugs, risks, tech debt, assumptions, open questions, and blockers — each
tracked explicitly rather than left in someone's memory or a chat log.
Update status as things change; don't delete resolved items, mark them
resolved (keeps the "why" available later for panel defense).

Statuses: `OPEN` · `IN_PROGRESS` · `RESOLVED` · `WON'T_FIX` · `ACCEPTED` (risk acknowledged and deliberately not mitigated further)

## Bugs

| ID | Description | Impact | Status | Next action |
|---|---|---|---|---|
| — | none open | | | |

## Risks

| ID | Description | Impact | Status | Next action |
|---|---|---|---|---|
| RISK-001 | `docker-compose.yml` was authored and reviewed but never run end-to-end — the Docker daemon wasn't available during Phase 00. | Medium — the team may hit an unknown issue with the Compose stack for the first time under hackathon time pressure. | OPEN | Whoever has Docker running next: `docker compose up`, then `docker compose exec server npm run migrate`, confirm client/server/db all reachable. Update this row. |
| RISK-002 | 2 of 3 invited teammates (`Astik01`, `Souharda6996`) have not yet accepted their GitHub collaborator invitation as of 2026-08-30. | High if unresolved by hackathon day — they wouldn't be able to push. | OPEN | Confirm acceptance before 2026-09-01. Ayush can check via repo Settings → Collaborators, or re-run the `gh api repos/Ayush-o1/citadel/invitations` check. |

## Tech debt

| ID | Description | Impact | Status | Next action |
|---|---|---|---|---|
| — | none yet | | | |

## Assumptions

| ID | Assumption | Basis | Status | Next action |
|---|---|---|---|---|
| ASSUM-001 | The team will use one primary database (PostgreSQL) for the real product unless the actual problem statement clearly needs document storage MongoDB fits better. | Team is equally comfortable with both; using both without a reason adds complexity for no benefit — see `.ai/DECISIONS.md`. | ACCEPTED | Revisit only if the real data model genuinely doesn't fit relational tables. |

## Open questions

| ID | Question | Status | Next action |
|---|---|---|---|
| Q-001 | Will Caterpillar provide any datasets, APIs, or sample data alongside the problem statement? | OPEN | Check at reveal time (2026-09-01 ~10:25); log the answer in `RESEARCH.md` if relevant. |

## Blockers

| ID | Description | Blocking | Status | Next action |
|---|---|---|---|---|
| — | none — product work is intentionally not started, not "blocked" in the urgent sense | | | |
