# Phase 06 — Demand forecasting

**Status:** `NOT_STARTED`
**Owner:** unassigned — see `../PLAYBOOK.md` team table
**Started:** — · **Closed:** —

## Objective

Predict equipment demand by type, site, and time, answering "what
equipment is likely to be needed, where, and when" with stated factors —
not just rendering a chart.

## Why

REQ-009. The single riskiest phase (`problem-statement/ANALYSIS.md` §24)
— not because it's hard to code, but because it has to stay honest and
explainable on a genuinely small dataset. This is where "we used ML" talk
gets teams in trouble at panel defense if they can't explain it.

## Inputs

`RESEARCH.md` R-001 (method choice). Phase 02's checkout history, grouped
by equipment type + site + time period.

## Dependencies

Depends on Phase 02 (needs enough trailing history per equipment-type/site
pair — this is precisely what Phase 02's "additional synthetic volume"
layer exists for). Independent of Phases 04/05 — can run in parallel with
either.

## Method

Trailing-window forecast, not a trained model (`DECISIONS.md`'s
"Rule-based analytics" entry): for a given equipment type + site, take the
last N periods (e.g. weekly checkout counts or total engine-hours demand)
and either (a) a simple moving average, or (b) exponential smoothing with
alpha < 0.4 (`RESEARCH.md` R-001 — pick whichever reads more naturally
once real data is in; document the final choice here once decided). The
output states the number, the equipment type/site/period it applies to,
and the factors that drove it (e.g., "based on the last 4 weeks averaging
3 checkouts/week, trending up").

**Explicit fallback:** if an equipment-type/site pair has fewer than the
minimum required trailing periods, return "insufficient history" — never
fabricate a number (REQ-019).

## Outputs

`server/src/modules/forecasts/` — a service computing the above,
`GET /api/forecasts` (optionally filtered by equipment type/site).

## Tasks

- [ ] 06.1 — Decide moving-average vs. exponential smoothing against real seeded data (whichever produces a more sensible, explainable result) and record the choice in `DECISIONS.md`
- [ ] 06.2 — Define the minimum trailing-period threshold below which a forecast isn't attempted (REQ-019)
- [ ] 06.3 — Implement the forecast computation + factors string
- [ ] 06.4 — `GET /api/forecasts` endpoint
- [ ] 06.5 — Tests: a well-supported equipment-type/site pair produces a number + factors; an under-supported one returns "insufficient history," not a number

## Files / systems affected

`server/src/modules/forecasts/`, one line in `server/src/routes/index.js`.

## Risks

Overclaiming precision on 7-asset-scale data is the main risk — a judge
who asks "how confident are you in that number" needs a real answer
(`method`, sample size, trend direction), not a black-box percentage.
Mitigation: the `factors` field is mandatory output, not optional
metadata — see Outputs.

## Acceptance criteria

- At least one equipment-type/site pair produces a real forecast with stated factors (mandatory demo requirement).
- At least one produces "insufficient history" rather than a fabricated number, proving the fallback actually works, not just exists in theory.

## Tests

Not yet run. Expected: `server/tests/forecasts.test.js` against seeded data covering both acceptance criteria.

## Exit criteria (phase gate)

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build passes
- [ ] Critical edge cases checked (insufficient-history fallback actually triggers, not just coded)
- [ ] Requirements mapped (REQ-009 → `VERIFIED`, REQ-019 → `VERIFIED`)
- [ ] Known issues reviewed
- [ ] Documentation updated
- [ ] Architecture still coherent
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created
- [ ] `git status` clean
