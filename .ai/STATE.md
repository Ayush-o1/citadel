# Project state

**Last updated:** 2026-09-01, AI agent, Phase 02 implementation session.
**Statuses used:** `NOT_STARTED` · `PLANNED` · `IN_PROGRESS` · `BLOCKED` · `READY_FOR_REVIEW` · `VERIFIED` · `COMPLETE`

## Current phase

**Phase 00 — Foundation.** Status: `VERIFIED`.
**Phase 01 — Data model & migrations.** Status: `VERIFIED`.
**Phase 02 — Synthetic operational data.** Status: `VERIFIED`. Database
now holds 17 equipment / 22 checkouts / 192 usage_logs across the exact
official 7-row Caterpillar sample plus a synthetic trailing-history and
live-active-checkout layer. See
[`phases/PHASE-02-synthetic-data.md`](phases/PHASE-02-synthetic-data.md).

**Phase 03 — Core backend APIs.** Status: `PLANNED`, unblocked, not
started this session (out of scope — this session was Phase 02 only).

**Phases 04-11:** `NOT_STARTED`, waiting on Phase 03.

## Next recommended action

**Start Phase 03 (core backend APIs)** — `phases/PHASE-03-core-apis.md`.
It only depended on Phase 01, so it could have run in parallel with
Phase 02, but nobody picked it up this session. Once Phase 03 lands,
Phases 04/05/06 (alerts/anomalies/forecasting) can start — they now have
real seeded data to compute against, per Phase 02.

## Overall progress

| Area | Status | Notes |
|---|---|---|
| Team access | `VERIFIED` | 1 of 3 invites accepted (`eklavaya008`); 2 pending — `RISK-002` |
| Foundation | `VERIFIED` | Phase 00 |
| Docker Compose | `READY_FOR_REVIEW` | Still not run end-to-end — `RISK-001` |
| AI-agent operating system | `VERIFIED` | Phase 00 |
| Problem statement received & analyzed | `VERIFIED` | 2 sources, both confirmed authoritative |
| Data model | `VERIFIED` | Phase 01 |
| Synthetic data | `VERIFIED` | Phase 02 — 17 equipment, 22 checkouts, 192 usage_logs seeded and verified |
| Anomaly threshold calibration | `RESOLVED` | 0.40 idle-ratio threshold validated against real seeded data — `DECISIONS.md` |
| Forecasting method calibration | `NOT_STARTED` | Still pending Phase 06 task 06.1 — `Q-002` |
| Requirements | `IMPLEMENTED` (partial) | REQ-001, REQ-005 `DESIGNED`; REQ-015 `IMPLEMENTED`; rest `NOT_STARTED` |
| Phase plan | `VERIFIED` | 11 phases in `ROADMAP.md` |
| Core backend APIs (equipment/checkouts/usage-logs) | `NOT_STARTED` | Phase 03 — next up |
| Product implementation | `IN_PROGRESS` | Phases 00-02 done; Phases 03-11 not started |

## Known bugs

None open. See `ISSUES.md`.

## Known risks

- `RISK-001`: Docker Compose stack untested end-to-end.
- `RISK-002`: 2 of 3 invited teammates haven't accepted GitHub access yet.
- `RISK-003`: **Partially resolved.** Anomaly/idle threshold half
  confirmed sound against real seeded data (`DECISIONS.md`). Forecasting-
  method half (moving average vs. exponential smoothing) still open —
  Phase 06 task 06.1.

## Checkpoint log

| Checkpoint | Date | Phase | Commit | Verified |
|---|---|---|---|---|
| `checkpoint/phase-00-foundation` | 2026-08-30 | Phase 00 | `2dfc243` | Yes |
| `checkpoint/phase-01-data-model` | 2026-09-01 | Phase 01 | `56e1a9d` | Yes |
| `checkpoint/phase-02-synthetic-data` | 2026-09-01 | Phase 02 | (see `git log` after this commit) | Yes — see Phase 02 doc's "Tests" section |

## What must not be changed without a documented reason

- The core stack choice (React/Express/PostgreSQL, no ORM).
- Rule-based analytics over a trained ML model — see `DECISIONS.md`.
- The schema's nullable `checkouts.site_id`/`checkouts.operator_id`.
- The 0.40 idle-ratio anomaly threshold — now validated against real data (`DECISIONS.md`); don't casually retune it without new evidence.
- The seeded data's deliberate edge cases (`EQX3001`–`EQX3005`, the `Grader`/`S001` sparse-history pair) — Phase 04/05/06/09 tests and demo depend on these existing exactly as seeded. Don't overwrite them by re-running seed against a wiped-then-different dataset without updating this state.
- `server/.env` — real local DB credentials, never commit it.
