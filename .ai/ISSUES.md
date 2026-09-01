# Issues register

Bugs, risks, tech debt, assumptions, open questions, and blockers — each
tracked explicitly rather than left in someone's memory or a chat log.
Update status as things change; don't delete resolved items, mark them
resolved (keeps the "why" available later for panel defense).

Statuses: `OPEN` · `IN_PROGRESS` · `RESOLVED` · `WON'T_FIX` · `ACCEPTED` (risk acknowledged and deliberately not mitigated further)

## Bugs

| ID | Description | Impact | Status | Next action |
|---|---|---|---|---|
| BUG-001 | Local automated suite is currently **22/26 passing**, not 26/26. Root cause verified via direct `psql` inspection, not guessed: `EQX3001` and `EQX3002`'s seeded active checkouts have been checked in (`status='returned'`) and 3 recommendations moved out of `pending` — real residue from an earlier manual-QA/browser-testing session that was never reset. This is **not an application defect** — `equipment`/`checkouts`/`usage_logs` row counts are still exactly 17/22/192, the code paths all behave correctly, and re-seeding fresh data would pass all 26. It reproduces `MANUAL-QA.md`'s own anticipated risk ("there is no one-command full reset script — that's a real gap") — the risk materialized. | Medium — doesn't affect a fresh-seed environment or the actual application logic, but means `npm test` right now gives a misleading signal, and the demo baseline (`EQX3001` overdue, `EQX3002` upcoming-return) is currently not in its intended state. | OPEN | Before the next demo or full test run: restore `EQX3001`/`EQX3002` to active checkouts matching Phase 02's original seeded values and reset the 3 non-pending recommendations to `pending` (the recommendations half already has a documented SQL snippet in `MANUAL-QA.md`'s "Before you start" section; the checkouts half does not — writing a real one-command reset script, e.g. `npm run reset-demo-data`, would close this gap for good, but that's new tooling, not a doc fix, so it's logged here rather than built during a docs-only pass). |

## Risks

| ID | Description | Impact | Status | Next action |
|---|---|---|---|---|
| RISK-001 | `docker-compose.yml` was authored and reviewed but never run end-to-end — the Docker daemon wasn't available during Phase 00. | Medium — the team may hit an unknown issue with the Compose stack for the first time under hackathon time pressure. | OPEN | Whoever has Docker running next: `docker compose up`, then `docker compose exec server npm run migrate`, confirm client/server/db all reachable. Update this row. |
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
