# Phase 07 — Recommendations & Action Queue

**Status:** `NOT_STARTED`
**Owner:** unassigned — see `../PLAYBOOK.md` team table
**Started:** — · **Closed:** —

## Objective

Unify alerts, anomalies, and forecasts into one ranked feed of
`signal → reason → recommended action → expected impact` — the module the
differentiation strategy hinges on (`problem-statement/ANALYSIS.md` §12).

## Why

REQ-010, REQ-017. This is the literal answer to the problem statement's
central line: "the dashboard should not only report, it should recommend."
Every other analytics phase feeds this one; this is what turns three
separate lists into the Control Tower's single Action Queue.

## Inputs

Phase 04's alerts, Phase 05's anomalies, Phase 06's forecasts — all as
data, read-only from this module's perspective (`ARCHITECTURE.md`'s
analytics-layer dependency direction: recommendations reads from the
other three, never the reverse).

## Dependencies

Depends on Phases 04, 05, and 06 all existing (even minimally) — this is
the integration point. Cannot meaningfully start before at least one of
each signal type is producible, though the mapping table below can be
designed in parallel with them.

## Signal → action mapping

| Source | Example signal | Recommended action | Expected impact (labeled as simulated/estimated) |
|---|---|---|---|
| Anomaly: `EXCESSIVE_IDLE` | "Idle 82% of logged hours" | Reassign or return | Improve utilization toward the 65-75% healthy band (`RESEARCH.md` R-002) |
| Anomaly: `ZERO_RUNTIME` | "0 engine hours logged while checked out" | Investigate | Recover unused rental cost |
| Anomaly: `MISSING_ASSIGNMENT` | "No site/operator on an active checkout" | Investigate / assign | Restore visibility (who/what/where/when) |
| Alert: `OVERDUE` | "3 days past expected return" | Return | Avoid further rental cost / free up equipment |
| Alert: `UPCOMING_RETURN` | "Due back in 24h" | (informational — no strong action needed yet) | Avoid missed return |
| Forecast: high predicted demand | "Excavators trending up at Site S003" | Extend / pre-position | Avoid stockout, matches the handout's "pre-position equipment" outcome |

Every expected-impact string must read as clearly simulated/estimated —
never a bare number presented as a measured fact (REQ-016).

## Outputs

`server/src/modules/recommendations/` — a service that reads current
alerts/anomalies/forecasts, applies the mapping above, ranks by severity
(overdue/anomaly first, forecast-driven suggestions lower), and exposes
`GET /api/recommendations` plus `PATCH /api/recommendations/:id` to mark
actioned/dismissed (REQ-017 — closes the loop visibly for the demo).

## Tasks

- [ ] 07.1 — Implement the mapping table as code (one function per source type, not a giant if/else)
- [ ] 07.2 — Implement ranking (severity, then recency/due-date)
- [ ] 07.3 — `GET /api/recommendations`
- [ ] 07.4 — `PATCH /api/recommendations/:id` (actioned/dismissed)
- [ ] 07.5 — Tests: a known anomaly produces the expected recommendation shape; marking one actioned persists and excludes it from the active queue

## Files / systems affected

`server/src/modules/recommendations/`, one line in `server/src/routes/index.js`.

## Risks

If this reads as a generic "here's a list of problems" rather than
specific, worded recommendations, the differentiation strategy fails.
Mitigation: `DESIGN.md`'s Action Queue component spec — reason and action
must read like a sentence, reviewed for that specifically before this
phase is called done.

## Acceptance criteria

- Every open alert/anomaly/qualifying forecast produces exactly one recommendation, correctly ranked.
- Marking a recommendation actioned/dismissed persists and is reflected on next fetch.
- No expected-impact text reads as an unlabeled factual claim.

## Tests

Not yet run. Expected: `server/tests/recommendations.test.js` covering the mapping, ranking, and actioned/dismissed persistence.

## Exit criteria (phase gate)

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build passes
- [ ] Critical edge cases checked (dismissed items don't reappear; no source produces zero or duplicate recommendations)
- [ ] Requirements mapped (REQ-010 → `VERIFIED`, REQ-017 → `VERIFIED`)
- [ ] Known issues reviewed
- [ ] Documentation updated
- [ ] Architecture still coherent
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created
- [ ] `git status` clean
