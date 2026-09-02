# Issues register

Bugs, risks, tech debt, assumptions, open questions, and blockers — each
tracked explicitly rather than left in someone's memory or a chat log.
Update status as things change; don't delete resolved items, mark them
resolved (keeps the "why" available later for panel defense).

Statuses: `OPEN` · `IN_PROGRESS` · `RESOLVED` · `WON'T_FIX` · `ACCEPTED` (risk acknowledged and deliberately not mitigated further)

## Bugs

| ID | Description | Impact | Status | Next action |
|---|---|---|---|---|
| BUG-003 | Real race condition in alerts/anomalies/recommendations sync-on-read (check-then-act, no atomicity): two concurrent GET requests to the same endpoint (real scenario — multiple people had the Control Tower open at once during testing) could both insert the same signal. **Confirmed live on production 2026-09-02**: EQX1007 had every anomaly type duplicated, same equipment_id/checkout_id, detected_at ~50ms apart. | Duplicate/incorrect-looking cards in the Action Queue — would have been visible and embarrassing during judging if a judge had multiple tabs open or refreshed during a demo. | RESOLVED | Migration `011_dedupe_and_lock_analytics_sync.sql` adds partial unique indexes (after deduplicating existing violations) on `anomalies`/`alerts` (checkout_id, type) WHERE status='open' and `recommendations` (source_type, source_id); repository inserts use `ON CONFLICT DO NOTHING`. Verified with a 10-way concurrent stress test against all three sync functions — zero duplicates, zero failures. Confirmed zero duplicates live on production after deploy. |
| BUG-004 | Role switching (`/switch-role`, the "Switch role" nav link) was removed by a same-night commit (`f1328cc`) without updating Entry.jsx's own copy ("You can switch roles later from any screen") or `DEMO-SCRIPT.md`'s bonus beat, both of which depended on it existing. Without it, demoing all three roles requires three separate Google accounts. | Would have broken the rehearsed Admin bonus-beat demo path; made an explicit on-screen promise to users that was false. | RESOLVED | Restored `client/src/pages/SwitchRole.jsx`, the `/switch-role` route, and the nav link — redesigned to match the current visual language (equipment photos, Footer) rather than reverted verbatim. |
| BUG-001 | ~~Local automated suite was 22/26 passing due to manual-QA residue on the pre-rebuild seed.~~ **RESOLVED 2026-09-01**: local Postgres data was cleared (FK-safe row deletes, schema untouched) and re-seeded fresh against the current RB-6 baseline. Also found and fixed a related gap while doing this: migrations `008`/`009` had only been applied to a throwaway Docker Postgres in an earlier verification attempt, not the real local database — `npm test` failed with `column "customer_name" does not exist` until `npm run migrate` was re-run against the real local DB. | None now — confirmed **28/28 passing**, seed baseline exactly 21 equipment/26 checkouts/257 usage_logs, `EQX1002`/`EQX1007` confirmed via live API to still produce the official `zero_runtime`/`missing_assignment`/`excessive_idle` triad. | RESOLVED | None — the missing one-command reset script is still real tooling debt (not built, per this being a verification/docs task, not a feature-building one) but the immediate data-drift symptom is gone. |

## Risks

| ID | Description | Impact | Status | Next action |
|---|---|---|---|---|
| RISK-001 | `docker-compose.yml`'s `postgres` service was actually run 2026-09-01 (`docker compose up -d postgres`): container started healthy, and `npm run migrate` applied all 9 migrations cleanly against it — the Postgres half is genuinely verified. The full-stack (`server`/`client` containers, `docker compose up` with no service filter) is still unverified — the container was torn down by the agent sandbox between tool calls before that could be attempted, unrelated to `docker-compose.yml` itself. | Low-medium — the riskiest part (does the schema/migrations actually work against a container Postgres) is now confirmed; what's left is lower-risk (the app containers are simple `node`/`vite` processes, already proven to run fine outside Docker). | IN_PROGRESS | Someone with a normal (non-sandboxed) machine: `docker compose up`, confirm all three services reachable, `docker compose exec server npm run migrate`. Update this row. |
| RISK-002 | 2 of 3 invited teammates (`Astik01`, `Souharda6996`) have not yet accepted their GitHub collaborator invitation as of 2026-08-30. All 29 commits to date are authored solely by `Ayush-o1` (verified via `git log --format=%an`) — `ROADMAP.md`'s phase-owner column reflects `TEAM-EXECUTION-PLAN.md`'s intended assignment, not who actually wrote the code so far. | High if unresolved by hackathon day — they wouldn't be able to push, and the "4-person execution" story isn't real yet. | OPEN | Confirm acceptance before presenting. Ayush can check via repo Settings → Collaborators, or re-run the `gh api repos/Ayush-o1/citadel/invitations` check. |
| RISK-003 | Anomaly thresholds (Phase 05) and forecasting method (Phase 06) were designed from small-sample industry research (`RESEARCH.md` R-001/R-002) and the official 7-row example, not yet validated against real seeded volume. | Medium — a threshold that floods or empties the Action Queue undermines the whole differentiation strategy. | RESOLVED | **Both halves resolved.** Idle/anomaly-threshold: calibrated in Phase 02, then confirmed in Phase 05's real `GET /api/anomalies` output. Forecasting method (`Q-002`): decided in Phase 06 against real seeded dates — plain trailing-window average over a 28-day/≥3-checkout threshold, chosen over exponential smoothing (`DECISIONS.md`'s "Phase 06: forecast method chosen" entry) — produced the exact intended split (2 real forecasts, 3 insufficient-history) against the actual seeded data. |
| RISK-004 | ~~Deployment not live.~~ **RESOLVED 2026-09-02**: live at `https://citadel-silk.vercel.app` (frontend, Vercel) and `https://citadel-96hb.onrender.com` (backend, Render, deployed via `server/Dockerfile`, not the `render.yaml` Blueprint — Render's dashboard shows this service's environment as "Docker"). Neon Postgres connected and seeded. Confirmed working end-to-end across multiple real devices/browsers tonight (Android, Mac, Windows, Linux; Chrome/Safari) — real Google sign-in, role assignment, and role-specific data all verified live via server logs and direct API checks, not assumed. | None now for the core path. | RESOLVED | `render.yaml`'s Blueprint config is now effectively unused for this service (it deploys from the Dockerfile instead) — either migrate the service to a true Blueprint deploy for consistency, or delete `render.yaml` to stop it misleadingly implying that's the active path. Not urgent — both paths now run the identical `migrate && seed && start` sequence. |
| RISK-005 | Server-side authorization is real but narrow: `requireAuth` (or any auth check) is applied to exactly one route, `PATCH /api/auth/me/role`. Every other endpoint — including writes: `POST /api/checkouts`, `PATCH /api/checkouts/:id/check-in`, `POST /api/usage-logs`, `PATCH /api/recommendations/:id` — accepts unauthenticated requests. The one real identity-based check that exists is narrower still: a signed-in customer can only self-return their *own* rental (`checkouts.service.js`'s `user_id` check); nothing stops an anonymous caller from creating a checkout, logging usage, or actioning/dismissing a recommendation directly against the API. `RoleGate` on the frontend is a UX guard only, not a security boundary — already honestly stated in `PANEL-DEFENSE.md` §12, confirmed accurate by inspecting every `*.routes.js` file directly (2026-09-02 audit), not assumed. | Medium for a real deployment; low-medium for hackathon judging specifically — the live URL is technically abusable by anyone who finds it, but a judge probing this deliberately (vs. asking about it, which the panel-defense answer already covers) is a narrower risk than the two RESOLVED bugs above, which were already visibly wrong on screen. | ACCEPTED (for now) | Add `requireAuth` (and, for dealer/admin-only actions, a role check) to every mutation route. Deliberately not done in this pass: automated tests (`server/tests/`, 32/32 currently passing) call these routes without authenticating, so this would need test-fixture updates too — real, non-trivial work carrying real risk of new breakage this close to presenting, on a system that was just stabilized after two more severe live bugs. Do this first after presenting, before any real (non-hackathon) use. |

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
