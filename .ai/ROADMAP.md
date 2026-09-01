# Roadmap

## How phases work here

Phase count and shape are **not** fixed in advance. The real product might
need 8 phases or 25 — that depends on the actual Caterpillar problem, team
size, and time available. Deciding that before the problem exists would
just mean throwing the plan away on day one.

What's fixed is the *format*. Every phase, once created, is a file in
[`phases/`](phases/) filled from [`phases/_TEMPLATE.md`](phases/_TEMPLATE.md),
containing: objective, why, inputs/outputs, dependencies, tasks, files
affected, risks, acceptance criteria, tests, and exit criteria. See
`QUALITY.md` for what actually qualifies a phase as done (code existing is
not enough).

Rules for creating phases:
- A phase should be small enough to finish, verify, and checkpoint in a
  bounded chunk of hackathon time — not "backend" as one phase.
- If a phase turns out too big once you're in it, split it and update this
  file. Don't quietly let scope grow inside one phase file.
- If phases are independent (e.g., frontend page A and backend module B
  with an agreed API contract), they can run in parallel across team
  members. If one depends on another, say so explicitly in both phase
  files' "Dependencies" section.
- Renumber only if you have to — prefer `phase-07b` over renumbering
  everything after it.

## Phase index

Product: **Smart Rental Tracking System** (problem statement received
2026-09-01 — see `PROBLEM-STATEMENT.md`, analyzed in
`problem-statement/ANALYSIS.md`).

| ID | Name | Status | Owner | File |
|---|---|---|---|---|
| 00 | Foundation | `VERIFIED` | Ayush + AI agent | [`phases/PHASE-00-foundation.md`](phases/PHASE-00-foundation.md) |
| 01 | Data model & migrations | `VERIFIED` | Ayush + AI agent | [`phases/PHASE-01-data-model.md`](phases/PHASE-01-data-model.md) |
| 02 | Synthetic operational data | `VERIFIED` | Ayush + AI agent | [`phases/PHASE-02-synthetic-data.md`](phases/PHASE-02-synthetic-data.md) |
| 03 | Core backend APIs | `VERIFIED` | Astik (`TEAM-EXECUTION-PLAN.md`) | [`phases/PHASE-03-core-apis.md`](phases/PHASE-03-core-apis.md) |
| 04 | Alerts engine | `VERIFIED` | Eklavya (`TEAM-EXECUTION-PLAN.md`) | [`phases/PHASE-04-alerts.md`](phases/PHASE-04-alerts.md) |
| 05 | Anomaly detection | `VERIFIED` | Eklavya (`TEAM-EXECUTION-PLAN.md`) | [`phases/PHASE-05-anomaly-detection.md`](phases/PHASE-05-anomaly-detection.md) |
| 06 | Demand forecasting | `VERIFIED` | Eklavya (`TEAM-EXECUTION-PLAN.md`) | [`phases/PHASE-06-forecasting.md`](phases/PHASE-06-forecasting.md) |
| 07 | Recommendations & Action Queue | `NOT_STARTED` | unassigned | [`phases/PHASE-07-recommendations.md`](phases/PHASE-07-recommendations.md) |
| 08 | Asset Dashboard UI | `NOT_STARTED` | unassigned | [`phases/PHASE-08-asset-dashboard-ui.md`](phases/PHASE-08-asset-dashboard-ui.md) |
| 09 | Control Tower UI | `NOT_STARTED` | unassigned | [`phases/PHASE-09-control-tower-ui.md`](phases/PHASE-09-control-tower-ui.md) |
| 10 | Integration, testing, polish | `NOT_STARTED` | unassigned | [`phases/PHASE-10-integration-and-polish.md`](phases/PHASE-10-integration-and-polish.md) |
| 11 | Demo and panel-defense prep | `NOT_STARTED` | unassigned | [`phases/PHASE-11-demo-and-defense.md`](phases/PHASE-11-demo-and-defense.md) |

## Dependency shape and parallelization

```
01 (data model)
 ├─→ 02 (synthetic data) ─┬─→ 04 (alerts)     ─┐
 └─→ 03 (core APIs) ──────┼─→ 05 (anomalies)  ─┼─→ 07 (recommendations) ─→ 09 (control tower UI) ─┐
                          └─→ 06 (forecasting) ─┘                                                  ├─→ 10 (integration) ─→ 11 (demo)
                             03 ───────────────────────────────────────→ 08 (asset dashboard UI) ──┘
```

01 gates everything. Once 01 is done, 02 and 03 can run in parallel (see
`PLAYBOOK.md`'s team table). Once 02+03 land, 04/05/06 can run in
parallel with each other and with 08. 07 needs 04+05+06. 09 needs 07 (and
benefits from 04-06 directly). 10 needs everything. 11 needs 10.

## Rejected/deferred scope

See `problem-statement/ANALYSIS.md` §15-16 for should-have/stretch/
explicitly-not-building — not repeated here to avoid two copies drifting.
