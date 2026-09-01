# Research log

Research must answer a specific question — not "browse the internet about
the topic." Log every finding that actually influenced a decision here, so
it survives past the chat session that produced it. If it's not here, it
didn't happen as far as the next agent is concerned.

## Format

| ID | Question | Source | Date | Finding | Relevance | Decision influenced |
|---|---|---|---|---|---|---|
| R-001 | What simple, explainable method fits demand forecasting on a very small dataset (problem statement's sample is 7 assets)? | [Moving Average Forecasting](https://www.blog.trainindata.com/master-moving-average-forecasting/), [Demand Forecasting Techniques](https://study.com/academy/lesson/demand-forecasting-techniques-moving-average-exponential-smoothing.html) | 2026-09-01 | Moving average needs N stored historical points; exponential smoothing needs only the latest point + previous forecast, and an alpha < 0.4 is typically effective for business data — both are fully interpretable. | High — directly determines the forecasting method for Phase 06 | `DECISIONS.md` "Forecasting method" entry: trailing-window moving average (or exponential smoothing) over checkout/usage counts, not ML |
| R-002 | What idle-time and utilization thresholds does the rental/fleet industry actually use to flag underuse? | [How to Reduce Equipment Idle Time](https://fleetrabbit.com/industry/construction-management-system/how-to-reduce-equipment-idle-time-construction-sites), [Fleet Utilization Benchmarks](https://gethapn.com/blog/fleet-utilization-benchmarks-2026-is-your-equipment-actually-making-money/), [Is Idle Equipment Impacting Utilization?](https://ezo.io/ezrentout/blog/how-idle-equipment-impacts-asset-utilization/) | 2026-09-01 | Industry practice: flag when idle exceeds ~35% of an active shift; healthy time-utilization band is ~65–75% (below 60% = overstocked, above ~80–85% = missing rental opportunities); assets consistently below ~40% productive use are redeployment/return candidates. | High — gives defensible, citable numeric thresholds for the anomaly and recommendation engines instead of arbitrary ones | `DECISIONS.md` "Anomaly thresholds" entry: idle_ratio > 0.40 → `EXCESSIVE_IDLE`; utilization target band 65–75% used for the Control Tower's utilization framing |

Both findings are logged because they set numbers used in `phases/PHASE-05-anomaly-detection.md` and `phases/PHASE-06-forecasting.md` — if a judge or interviewer asks "why 40%, why not 25%?", the answer is here, not invented on the spot.
