# Issues register

Bugs, risks, tech debt, assumptions, open questions, and blockers — each
tracked explicitly rather than left in someone's memory or a chat log.
Update status as things change; don't delete resolved items, mark them
resolved (keeps the "why" available later for panel defense).

Statuses: `OPEN` · `IN_PROGRESS` · `RESOLVED` · `WON'T_FIX` · `ACCEPTED` (risk acknowledged and deliberately not mitigated further)

## Bugs

| ID | Description | Impact | Status | Next action |
|---|---|---|---|---|
| BUG-001 | ~~Local automated suite was 22/26 passing due to manual-QA residue on the pre-rebuild seed.~~ **RESOLVED 2026-09-01**: local Postgres data was cleared (FK-safe row deletes, schema untouched) and re-seeded fresh against the current RB-6 baseline. Also found and fixed a related gap while doing this: migrations `008`/`009` had only been applied to a throwaway Docker Postgres in an earlier verification attempt, not the real local database — `npm test` failed with `column "customer_name" does not exist` until `npm run migrate` was re-run against the real local DB. | None now — confirmed **28/28 passing**, seed baseline exactly 21 equipment/26 checkouts/257 usage_logs, `EQX1002`/`EQX1007` confirmed via live API to still produce the official `zero_runtime`/`missing_assignment`/`excessive_idle` triad. | RESOLVED | None — the missing one-command reset script is still real tooling debt (not built, per this being a verification/docs task, not a feature-building one) but the immediate data-drift symptom is gone. |

## Risks

| ID | Description | Impact | Status | Next action |
|---|---|---|---|---|
| RISK-001 | `docker-compose.yml`'s `postgres` service was actually run 2026-09-01 (`docker compose up -d postgres`): container started healthy, and `npm run migrate` applied all 9 migrations cleanly against it — the Postgres half is genuinely verified. The full-stack (`server`/`client` containers, `docker compose up` with no service filter) is still unverified — the container was torn down by the agent sandbox between tool calls before that could be attempted, unrelated to `docker-compose.yml` itself. | Low-medium — the riskiest part (does the schema/migrations actually work against a container Postgres) is now confirmed; what's left is lower-risk (the app containers are simple `node`/`vite` processes, already proven to run fine outside Docker). | IN_PROGRESS | Someone with a normal (non-sandboxed) machine: `docker compose up`, confirm all three services reachable, `docker compose exec server npm run migrate`. Update this row. |
| RISK-002 | 2 of 3 invited teammates (`Astik01`, `Souharda6996`) have not yet accepted their GitHub collaborator invitation as of 2026-08-30. All 29 commits to date are authored solely by `Ayush-o1` (verified via `git log --format=%an`) — `ROADMAP.md`'s phase-owner column reflects `TEAM-EXECUTION-PLAN.md`'s intended assignment, not who actually wrote the code so far. | High if unresolved by hackathon day — they wouldn't be able to push, and the "4-person execution" story isn't real yet. | OPEN | Confirm acceptance before presenting. Ayush can check via repo Settings → Collaborators, or re-run the `gh api repos/Ayush-o1/citadel/invitations` check. |
| RISK-003 | Anomaly thresholds (Phase 05) and forecasting method (Phase 06) were designed from small-sample industry research (`RESEARCH.md` R-001/R-002) and the official 7-row example, not yet validated against real seeded volume. | Medium — a threshold that floods or empties the Action Queue undermines the whole differentiation strategy. | RESOLVED | **Both halves resolved.** Idle/anomaly-threshold: calibrated in Phase 02, then confirmed in Phase 05's real `GET /api/anomalies` output. Forecasting method (`Q-002`): decided in Phase 06 against real seeded dates — plain trailing-window average over a 28-day/≥3-checkout threshold, chosen over exponential smoothing (`DECISIONS.md`'s "Phase 06: forecast method chosen" entry) — produced the exact intended split (2 real forecasts, 3 insufficient-history) against the actual seeded data. |
| RISK-004 | Deployment (Vercel/Render/Neon) is configured in the repo (`render.yaml`, `client/vercel.json`, `DEPLOYMENT.md`) but **no account has actually been created/connected yet** — there is no live public URL. | Medium — the "public demo" capability doesn't exist yet even though the config does. | OPEN | Complete the one-time manual account setup in `DEPLOYMENT.md`'s "How to actually go live" section (requires a human's browser/GitHub login — can't be done headlessly). |

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
| Q-001 | Will Caterpillar provide any datasets, APIs, or sample data alongside the problem statement? | RESOLVED | Yes — a 7-row sample dataset (`EQX1001`-`EQX1007`) on the official handout. See `PROBLEM-STATEMENT.md` Source A, incorporated into `phases/PHASE-02-synthetic-data.md`. |
| Q-002 | Which trailing-window method (moving average vs. exponential smoothing) actually reads better once real seeded data exists? | RESOLVED | Plain trailing-window average chosen over exponential smoothing — see `DECISIONS.md`'s "Phase 06: forecast method chosen" entry and `phases/PHASE-06-forecasting.md`. |

## Blockers

| ID | Description | Blocking | Status | Next action |
|---|---|---|---|---|
| — | none — product work is intentionally not started, not "blocked" in the urgent sense | | | |
