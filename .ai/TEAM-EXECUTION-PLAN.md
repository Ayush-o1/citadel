# Team execution plan — Phases 03-11

**Purpose:** the single place all four team members go to understand the
whole system, who owns what, how work runs in parallel without collisions,
and how the final presentation is divided. This is the editable source of
truth; `CITADEL-ARCHITECTURE-TEAM-PLAN.pdf` (same directory) is a
print/study copy generated from this file plus the diagrams below — if
they ever disagree, this file wins.

Nothing here invents new architecture. It restates and extends what
`ARCHITECTURE.md`, `DESIGN.md`, `ROADMAP.md`, and `PLAYBOOK.md` already
decided, now that all 9 remaining phase files (`phases/PHASE-03-*.md`
through `PHASE-11-*.md`) exist and can be mapped concretely.

## 1. What the system does (one paragraph, for anyone)

Citadel tracks rented Caterpillar equipment through its full lifecycle —
**check out → assign & track → log usage → check in** — and instead of
just reporting that data back as tables and charts, it watches it
continuously for three kinds of signal (alerts, anomalies, forecasts),
explains each one in plain language, and turns it into a ranked,
actionable recommendation. The Control Tower screen is the "what should I
do next" view; the Asset Dashboard is the "do the work" view.

## 2. High-level architecture

```
                              ┌─────────────────────┐
                              │        USER          │
                              │ (fleet ops / dispatcher) │
                              └──────────┬───────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │              FRONTEND (React)             │
                    │  Control Tower (/)   Asset Dashboard (/assets) │
                    └────────────────────┬────────────────────┘
                                         │ HTTP /api/*
                    ┌────────────────────┴────────────────────┐
                    │           API LAYER (Express routes)      │
                    └────────────────────┬────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │   BUSINESS LOGIC (per-module services)    │
                    │  equipment · checkouts · usage-logs       │
                    └────────────────────┬────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │         DATABASE (PostgreSQL, no ORM)      │
                    │ sites · operators · equipment · checkouts │
                    │ usage_logs · alerts · anomalies ·         │
                    │ forecasts · recommendations               │
                    └────────────────────┬────────────────────┘
                                         │ reads
                    ┌────────────────────┴────────────────────┐
                    │        ANALYTICS LAYER (rule-based)        │
                    │   alerts  │  anomalies  │  forecasts       │
                    └────────────────────┬────────────────────┘
                                         │ read-only, one-way
                    ┌────────────────────┴────────────────────┐
                    │        RECOMMENDATION ENGINE               │
                    │  signal → reason → action → impact         │
                    │  ranked Action Queue                       │
                    └────────────────────┬────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │      ACTION / USER RESPONSE (Control Tower)│
                    │   mark actioned/dismissed → loop closes    │
                    └─────────────────────────────────────────┘
```

Two independent apps (`client/`, `server/`) talking over a versionless
`/api` HTTP contract — see `ARCHITECTURE.md`. The analytics layer and
recommendation engine are **not** a separate service or process; they are
plain service-layer functions reading the same Postgres tables, following
the exact same routes→controller→service→repository shape as every other
module (`ARCHITECTURE.md`'s "Analytics layer" section). No ML pipeline, no
message queue, no new infrastructure.

## 3. End-to-end data flow — DATA → INSIGHT → RECOMMENDATION → ACTION → OUTCOME

```
 usage_logs / checkouts (raw operational data)
        │
        ▼
 utilization + idle_ratio computed per checkout          [INSIGHT: what happened]
        │
        ▼
 alerts (date-based) + anomalies (rule-based, with a stated reason)   [INSIGHT: what's wrong]
        │
        ▼
 forecasts (trailing-window, with stated factors, or "insufficient history")  [INSIGHT: what's next]
        │
        ▼
 recommendations: signal → reason → recommended action → expected impact   [RECOMMENDATION]
        │
        ▼
 Action Queue (Control Tower UI, ranked by severity)      [ACTION: user acts]
        │
        ▼
 mark actioned/dismissed → persisted, excluded from active queue   [OUTCOME: loop closed]
```

Every arrow above is a real, queryable data dependency — not a narrative
device. This is also literally the demo script (§10, and `phases/
PHASE-11-demo-and-defense.md`).

## 4. Asset / user lifecycle flow

```
CHECK OUT ──▶ ASSIGN & TRACK ──▶ LOG USAGE ──▶ ANALYZE ──▶ ALERT/ANOMALY ──▶ RECOMMEND ──▶ ACT ──▶ CHECK IN
   │               │                 │             │             │               │          │        │
Phase 03        Phase 03          Phase 03      Phase 05      Phase 04/05     Phase 07   Phase 09  Phase 03
(checkouts)   (site/operator)  (usage-logs)   (idle_ratio)   (rules+reason)  (mapping)  (Control   (checkouts
                                                                                          Tower)     check-in)
```

Every status change on this line records **who / what / where / when**
(REQ-005) — the checkout row plus its usage_logs are the audit trail;
nothing is inferred from application memory.

## 5. Database / entity relationship (as built in Phase 01, unchanged)

```
sites ──┐                         ┌── operators
        │                         │
        └──▶ checkouts ◀──────────┘
               │  │
               │  └──▶ equipment (1 equipment : many checkouts, at most 1 active)
               │
               └──▶ usage_logs (1 checkout : many daily logs)

checkouts ──▶ alerts          (derived, date/field rules)
checkouts ──▶ anomalies       (derived, usage-log rules)
equipment+site ──▶ forecasts  (derived, trailing-window aggregation)
alerts+anomalies+forecasts ──▶ recommendations (derived, one-way merge)
```

`checkouts.site_id` and `checkouts.operator_id` are nullable by design —
this is what lets `MISSING_ASSIGNMENT` exist as a real, representable
state (matches the official `EQX1002`/`EQX1007` sample exactly; see
`DECISIONS.md`). Don't "fix" this nullability later without re-reading
that decision.

## 6. Analytics pipeline

```
RAW OPERATIONAL DATA (checkouts, usage_logs)
        │
        ├──▶ ALERTS       (date/field comparison — upcoming_return, overdue, missing_info)
        │
        ├──▶ ANOMALIES    (idle_ratio > 0.40, zero_runtime, missing_assignment, unusual_movement)
        │       every anomaly carries a human-readable `reason`, not just a type code
        │
        └──▶ FORECASTS    (trailing-window moving avg / exp. smoothing, per equipment type + site)
                every forecast carries `factors`; degrades to "insufficient history" honestly (REQ-019)
                        │
                        ▼
                RECOMMENDATIONS (signal → reason → action → expected impact, ranked)
```

Thresholds and method are cited, not invented — `RESEARCH.md` R-001
(forecast method) and R-002 (0.40 idle threshold, 65-75% healthy
utilization band), both already calibrated once against real seeded data
(`DECISIONS.md`'s "RISK-003 calibration result").

## 7. Frontend information architecture

```
                    ┌─────────────────────────────┐
                    │        Layout (top nav)       │
                    └──────────────┬────────────────┘
             ┌──────────────────────┴──────────────────────┐
             ▼                                              ▼
   Control Tower  ( / )                          Asset Dashboard ( /assets )
   "decide what to do next"                        "do the work"
   ┌─────────────────────────┐                  ┌───────────────────────┐
   │ Action Queue (top)       │                  │ Equipment table        │
   │  - ActionQueueItem       │                  │  - StatusBadge         │
   │  - mark actioned/dismiss │                  │  - check-out modal     │
   │ Live Status (supporting) │                  │  - check-in action     │
   │ Utilization (supporting) │                  │  - duplicate-checkout  │
   │ Forecast card            │                  │    error surfaced      │
   └─────────────────────────┘                  └───────────────────────┘
```

Two screens for MVP — see `DESIGN.md` for why a third screen (settings,
map, chatbot panel) isn't needed to tell the required demo story.

## 8. Phase / dependency map

```
01 (data model) ─── VERIFIED
 │
 ├─▶ 02 (synthetic data) ─── VERIFIED ──┬─▶ 04 (alerts)      ─┐
 │                                       ├─▶ 05 (anomalies)   ─┼─▶ 07 (recommendations) ─▶ 09 (Control Tower UI) ─┐
 └─▶ 03 (core APIs) ────────────────────┼─▶ 06 (forecasting) ─┘                                                  ├─▶ 10 (integration) ─▶ 11 (demo)
                                          └───────────────────────────────────────▶ 08 (Asset Dashboard UI) ──────┘
```

- **Sequential, hard-blocking:** 01 → (02, 03) → (04, 05, 06) → 07 → 09 → 10 → 11.
- **Safe to build in parallel right now:** 04, 05, 06, and 08 all depend
  only on 02+03 (already `VERIFIED`) — four people could start all four
  today with zero file collisions.
- **Can be developed against a mocked contract before its real dependency lands:**
  09 (Control Tower UI) can be built against Phase 07's *agreed* API
  shape (§9 below) while 07 is still being implemented, per
  `ARCHITECTURE.md`'s API-contract-first note.
- **Hard gate:** 07 cannot meaningfully start until at least one real
  alert, one real anomaly, and one real forecast exist — even minimal
  stub responses from 04/05/06 unblock it.

## 9. API contracts (agreed now, so 07/08/09 can start before their dependencies fully land)

| Endpoint | Phase | Shape (response item) |
|---|---|---|
| `GET /api/equipment` | 03 | `{ id, code, type, site, status, location, expected_return_at }` |
| `POST /api/checkouts` | 03 | `{ equipment_id, operator_id?, site_id? }` → 201 or 409 (already checked out) |
| `PATCH /api/checkouts/:id/check-in` | 03 | `{ condition_in }` → 200 or 409 (already checked in) |
| `POST /api/usage-logs` | 03 | `{ checkout_id, logged_at, engine_hours, idle_hours, location?, condition? }` |
| `GET /api/alerts` | 04 | `{ type, checkout_id, equipment_code, message, due_at? }` |
| `GET /api/anomalies` | 05 | `{ type, checkout_id, equipment_code, reason }` |
| `GET /api/forecasts` | 06 | `{ equipment_type, site, predicted, factors }` or `{ equipment_type, site, insufficient_history: true }` |
| `GET /api/recommendations` | 07 | `{ id, source_type, signal, reason, action, expected_impact, status, ranked_priority }` |
| `PATCH /api/recommendations/:id` | 07 | `{ status: 'actioned' \| 'dismissed' }` → 200 |

Any module consuming one of these before it's implemented should code
against this table, not guess. If the real implementation needs to
deviate, update this table in the same commit as the code, and note why
in `DECISIONS.md` if the deviation is non-trivial.

## 10. Team ownership map

This extends `PLAYBOOK.md`'s existing team table (not a rewrite — that
table was already deliberately balanced against the judging weights).
Each person has real implementation ownership, one non-trivial technical
decision to defend, and one cross-training task outside their primary
area (Part 12 requirement).

| Person | GitHub | Primary ownership | Phases | Key files/components | One technical decision to defend | Cross-training task (outside primary area) | Presentation section |
|---|---|---|---|---|---|---|---|
| **Ayush** | `Ayush-o1` | Foundation, data model, synthetic data, cross-phase integration | 00, 01, 02, (drives) 10 | `server/db/migrations/`, `server/db/seed.js`, `.ai/*` state docs | Why `checkouts.site_id`/`operator_id` are nullable instead of enforced-not-null with a separate "unassigned" flag | Implements `StatusBadge` component (08.2) — a small frontend task, so the person who designed the schema also understands how its states render | **Problem, product & foundation** — problem interpretation, user, why this data model |
| **Astik** | `Astik01` | Core backend APIs, Asset Dashboard UI | 03, 08 | `server/src/modules/equipment/`, `checkouts/`, `usage-logs/`, `client/src/pages/AssetDashboard.jsx` | Why check-out/check-in are modeled as state transitions on one `checkouts` row rather than separate events, and how the duplicate-checkout race is prevented at the DB level (partial unique index, not just app logic) | Implements `UNUSUAL_MOVEMENT` anomaly (05.3) — the one anomaly rule that reads `usage_logs.location`, which Astik's own `usage-logs` module produces | **How it works** — architecture, backend, the core workflow |
| **Eklavya** | `eklavaya008` | Analytics: alerts, anomalies, forecasting | 04, 05, 06 | `server/src/modules/alerts/`, `anomalies/`, `forecasts/` | Why the forecast uses a trailing-window method instead of a trained model, and what "insufficient history" protects against | Writes Phase 03's edge-case tests (03.5: duplicate checkout, double check-in, orphan usage log) before starting Phase 04 — forces understanding of the tables analytics reads from | **Intelligence** — data, anomalies, forecasting, explainability |
| **Souharda** | `Souharda6996` | Recommendations & Action Queue, Control Tower UI | 07, 09 | `server/src/modules/recommendations/`, `client/src/pages/ControlTower.jsx`, `ActionQueueItem.jsx` | Why recommendations only *read* from alerts/anomalies/forecasts and never the reverse (one-way dependency, `ARCHITECTURE.md`) | Implements the `usage-logs` `POST` route's validation schema (part of 03.4) as a warm-up before Phase 07, to understand the data recommendations ultimately trace back to | **Action & outcome** — Action Queue, demo result, business impact |

**Whole-team phases:** 10 (integration) and 11 (demo/defense) are not
owned by one person — Ayush drives the integration walkthrough (10.1) as
the person with the most cross-module context, but everyone fixes what
10.1 surfaces in their own area, and everyone participates in 11's
rehearsals and Q&A prep. This isn't a silo-breaker task, it's the nature
of integration/demo work.

## 11. Actual phase allocation (Phase 03 → 11)

| Phase | Task | Owner | Depends on | Output | Verification |
|---|---|---|---|---|---|
| 03 | 03.1 equipment module | Astik | 01 | `GET /api/equipment[/:id]` | supertest, real DB |
| 03 | 03.2 checkouts module | Astik | 01 | `POST /api/checkouts`, `PATCH .../check-in` | duplicate-checkout + double-check-in tests |
| 03 | 03.3 usage-logs module | Astik (validation schema: Souharda, cross-training) | 03.2 | `POST /api/usage-logs` | orphan-usage-log test |
| 03 | 03.4 validation schemas | Astik + Souharda | 03.1-03.3 | Zod schemas | — |
| 03 | 03.5 tests | Astik (+ Eklavya, cross-training) | 03.1-03.4 | `server/tests/*.test.js` | `npm test` green |
| 04 | alerts engine | Eklavya | 03 (data), 02 (seed) | `GET /api/alerts` | seeded overdue/upcoming-return appear |
| 05 | anomaly detection | Eklavya (05.3 unusual_movement: Astik, cross-training) | 02, 03 | `GET /api/anomalies` | EQX1002/EQX1007 flagged, EQX1003/EQX1005 clean |
| 06 | demand forecasting | Eklavya | 02 | `GET /api/forecasts` | 1 real forecast + 1 insufficient-history case |
| 07 | recommendations & action queue | Souharda | 04, 05, 06 | `GET/PATCH /api/recommendations` | mapping + ranking + persistence tests |
| 08 | Asset Dashboard UI | Astik | 03 | `client/src/pages/AssetDashboard.jsx` | manual click-through, duplicate-checkout error visible |
| 09 | Control Tower UI | Souharda | 07 (contract: §9, can start early) | `client/src/pages/ControlTower.jsx` | manual click-through, empty/insufficient states designed |
| 10 | integration, testing, polish | Ayush drives; all fix their own area | 03-09 | full walkthrough clean | 10.1 walkthrough script passes twice |
| 11 | demo & panel-defense prep | All four | 10 | demo script + fallback + defense sheets | 2 clean rehearsals on the real machine |

**Parallel-safe today:** 04, 05, 06, 08 (all cleared by `VERIFIED` Phases
01-03 once 03 lands). **Sequential, no way around it:** 07 needs 04+05+06;
09 needs 07's contract; 10 needs everything; 11 needs 10.

## 12. File / component ownership (merge-conflict avoidance)

| Path | Owner | Notes |
|---|---|---|
| `server/db/migrations/`, `server/db/seed.js` | Ayush | Schema is frozen post-Phase 01/02 (see `STATE.md` "must not be changed without a documented reason") — nobody else edits these without flagging it first |
| `server/src/modules/equipment/`, `checkouts/`, `usage-logs/` | Astik | |
| `server/src/modules/alerts/`, `anomalies/`, `forecasts/` | Eklavya | |
| `server/src/modules/recommendations/` | Souharda | |
| `client/src/pages/AssetDashboard.jsx`, `client/src/api/equipment.js`, `checkouts.js`, `client/src/components/StatusBadge.jsx` | Astik | |
| `client/src/pages/ControlTower.jsx`, `client/src/api/recommendations.js`, `client/src/components/ActionQueueItem.jsx` | Souharda | |
| `server/src/routes/index.js` (shared) | Whoever adds their module | One line per module. Pull before adding your line; if you hit a conflict, it's a one-line rebase, not a real conflict — never resolve by deleting someone else's line |
| `client/src/App.jsx` (shared) | Whoever adds their route | Same rule as above |
| `.ai/STATE.md`, `.ai/ROADMAP.md`, `.ai/HANDOFF.md` | Ayush maintains centrally after each phase merges | Individual phase files (`phases/PHASE-0X-*.md`) are edited by that phase's owner directly; the three cross-cutting files above get one coordinated update per merged phase to avoid four people racing to edit the same file |

## 13. Team execution rules

1. Pull latest `main` before starting any task.
2. Claim a task by updating its phase file's task checkbox status to `IN_PROGRESS` in a small commit, or via a GitHub Issue if the team is using the board (`PLAYBOOK.md` Step 4).
3. Check the dependency column (§11) before starting — don't start 07 before 04/05/06 have at least a stub response.
4. Work on a focused branch per phase (e.g. `phase-04-alerts`), not one shared long-lived branch.
5. Keep changes scoped to your owned files (§12); if you must touch someone else's file, say so before merging, not after.
6. Commit meaningful milestones, not one giant end-of-day commit.
7. Verify before claiming completion — `QUALITY.md`'s loop, every time. Code existing ≠ done.
8. Push stable checkpoints; tag per `GIT-WORKFLOW.md` convention once a phase gate passes.
9. Integrate frequently — merge to `main` same-day, not at the end of the hackathon.
10. Never overwrite teammate work — if `git status` shows unfamiliar changes, investigate before touching them.
11. Never force-push to `main`.
12. Update `STATE.md`/`HANDOFF.md` (owner: Ayush, per §12) immediately after your phase merges — the next phase's owner reads these, not your head.
13. Report blockers immediately in the team channel/issue, not at the next stand-up.

## 14. Presentation division (one story, four sections)

| Order | Person | Section | Content |
|---|---|---|---|
| 1 | Ayush | **Problem, product & foundation** | The problem in plain language, the one user persona, why this architecture/database (not a rebuild — an adaptation), the data model and why the nullable-assignment design matters for the anomalies shown later |
| 2 | Astik | **How it works** | System architecture walkthrough, the check-out/assign/track/log-usage/check-in workflow live, why layered modules + no ORM, how duplicate check-outs are actually prevented (not just claimed) |
| 3 | Eklavya | **Intelligence** | Data → alerts → anomalies → forecasting pipeline, the cited thresholds (not invented numbers), a real flagged anomaly with its stated reason, the forecast with its factors, the honest "insufficient history" fallback shown live |
| 4 | Souharda | **Action & outcome** | The Action Queue turning three signal types into one ranked list, marking an item actioned live (closing the loop), the labeled expected-impact figure, business-impact framing tied back to the judging weights |

Each presenter follows: **WHAT → WHY → HOW → ALTERNATIVE CONSIDERED → TRADEOFF → RESULT** — never "I made the frontend."

## 15. Panel defense — per-person cheat sheet skeleton

For each of the 10 standard questions below, each owner fills in their
real answer (source: their phase file, `DECISIONS.md`, `RESEARCH.md`) —
this is a skeleton, not a script written for them, because a rehearsed
answer someone else wrote falls apart under a follow-up question.

1. What did you personally build?
2. Why this way — what's the reasoning, not just the description?
3. How does it actually work, mechanically?
4. What alternative did you consider and reject, and why?
5. What can go wrong with it (failure mode)?
6. How did you test it — what did you actually run, not just "it should work"?
7. Performance consideration, if any (or: why performance wasn't a concern at this scale)?
8. Security consideration, if any?
9. What tradeoff did you accept, knowingly?
10. How does this connect to the rest of the system — what reads from you, what do you read from?

**Cross-team questions to expect (nobody may answer "not my part"):**
- Astik (backend) may be asked why the Control Tower ranks items the way it does → answer traces to Souharda's Phase 07 ranking (04.4's shared rule, `ARCHITECTURE.md`'s dependency direction) — Astik should know the one-sentence version.
- Souharda (recommendations/UI) may be asked why `checkouts.site_id` is nullable → traces to Ayush's Phase 01 decision (`DECISIONS.md`) — should know it's what makes `MISSING_ASSIGNMENT` representable at all.
- Eklavya (analytics) may be asked how the frontend surfaces "insufficient history" instead of hiding the card → traces to Souharda's Phase 09 task 09.8 / `DESIGN.md`.
- Ayush (foundation) may be asked why the API returns `insufficient_history` instead of a fabricated number → traces to Eklavya's Phase 06 REQ-019 fallback.

This is why §16 (cross-training) exists — everyone did at least one task outside their lane specifically so these answers are real, not guessed live.

## 16. "Who knows what" matrix

| Area | Primary (built it) | Secondary (can explain it, cross-trained or reviewed it) |
|---|---|---|
| Data model / migrations | Ayush | Astik (consumes it directly in Phase 03) |
| Synthetic data / seed design | Ayush | Eklavya (calibrates thresholds against it) |
| Core APIs (checkout/check-in/usage-logs) | Astik | Souharda (cross-trained on usage-logs validation) |
| Alerts | Eklavya | Astik |
| Anomalies | Eklavya | Astik (built unusual_movement) |
| Forecasting | Eklavya | Ayush |
| Recommendations / Action Queue | Souharda | Eklavya |
| Asset Dashboard UI | Astik | Ayush (built StatusBadge) |
| Control Tower UI | Souharda | Eklavya |
| Integration / demo flow | Ayush (drives) | all four |

## 17. Verification of this planning artifact (Part 16 checklist)

- [x] Architecture matches the problem — reuses `ARCHITECTURE.md`, adapts nothing structurally, only adds the concrete phase/ownership mapping that didn't exist before Phase 03-11 files were written.
- [x] Every requirement (`REQUIREMENTS.md` REQ-001–020) has a phase and owner — cross-checked against §11.
- [x] Database supports the workflows — Phase 01 schema unchanged, confirmed nullable columns support `MISSING_ASSIGNMENT` (§5).
- [x] APIs support the frontend — §9's contract table covers every field both Asset Dashboard and Control Tower need per `DESIGN.md`.
- [x] Analytics has required inputs — alerts/anomalies read `checkouts`+`usage_logs` (populated, Phase 02 `VERIFIED`); forecasting reads grouped checkout history (Phase 02's volume layer exists for exactly this).
- [x] Recommendation system has required outputs — §9's `/api/recommendations` shape matches `DESIGN.md`'s Action Queue item spec (signal, reason, action, impact).
- [x] Phase dependencies make sense — §8 matches `ROADMAP.md`'s existing dependency graph exactly, just expanded with task-level detail.
- [x] All 4 people have meaningful work — §10, each has 2 owned phases, one real decision, one cross-training task.
- [x] Presentation is balanced — §14, four sections, each maps to real ownership, not an arbitrary split.
- [x] Ownership overlaps identified — §12's shared-file rule (`routes/index.js`, `App.jsx`).
- [x] Parallel work is safe — §8's "parallel-safe today" line, confirmed against §12's file ownership (no two people touch the same module folder).
- [x] Panel-defense responsibilities are clear — §15.
- [x] PDF is readable — see `CITADEL-ARCHITECTURE-TEAM-PLAN.pdf`, generated from this file's content, 13 pages.
- [x] Repository documentation matches the PDF — same source, no separate drift-prone copy of the substance.

## 18. What happens next

Once this plan is committed, autonomous implementation continues exactly
as `ROADMAP.md`/the phase files already specify: Phase 03 first (it gates
everything), then 04/05/06/08 in whatever order/parallelism the actual
(currently effectively solo, pending teammate GitHub-invite acceptance —
`RISK-002`) execution allows, then 07 → 09 → 10 → 11. This plan does not
change that order — it only makes explicit, for whenever the other three
accept their invites, exactly where to start reading and what to pick up.
