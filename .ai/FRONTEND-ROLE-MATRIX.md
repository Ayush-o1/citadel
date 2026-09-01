# Frontend role / feature matrix

Source of truth for who sees what. Companion to `FRONTEND-REBUILD-PLAN.md`.
"API used" refers to real, existing endpoints unless marked **(new)**.

| Feature | Customer | Dealer | Caterpillar Admin | Primary action | Data shown | API used |
|---|:---:|:---:|:---:|---|---|---|
| Equipment discovery (available list) | ✅ primary | — (has full inventory instead) | — | Browse / select | type, code, home site, status | `GET /equipment` (filtered client-side to `available`) |
| Equipment detail | ✅ | — | — | View, then Rent | type, code, site, capacity-fit hint | `GET /equipment/:id`, `GET /capacity` **(new)** |
| Request rental (checkout) | ✅ simplified form | ✅ full form (operator+site) | — | Submit rental / checkout | equipment, dates, `customer_name` **(new field)** | `POST /checkouts` |
| My rentals (active + past) | ✅ primary | — | — | Track, see return date | status, checked_out_at, expected_return_at | `GET /checkouts` (filtered by `customer_name`) |
| Return equipment | ✅ initiate; — dealer confirms | ✅ confirm/check-in | — | Check in | condition, timestamps | `PATCH /checkouts/:id/check-in` |
| Full inventory table | — | ✅ primary | ✅ read-only fleet view | Checkout / check-in / log usage | all equipment, live status | `GET /equipment` |
| Checkout (operator+site assignment) | — | ✅ primary | — | Assign equipment | operator, site, expected return | `POST /checkouts`, `GET /sites`, `GET /operators` |
| Check-in | — | ✅ primary | — | Record return + condition | condition_in, checked_in_at | `PATCH /checkouts/:id/check-in` |
| Usage logging | — | ✅ primary | — | Log daily hours | engine/idle hours, fuel, location | `POST /usage-logs` |
| Alerts (overdue / upcoming / missing info) | — | ✅ via Action Queue | ✅ dedicated view **(new)** | Act on alert | type, severity, equipment | `GET /alerts` |
| Anomalies (idle, zero-runtime, movement) | — | ✅ via Action Queue | ✅ dedicated view **(new)** | Investigate | type, reason, evidence | `GET /anomalies` |
| Utilization (fleet, by type) | — | ✅ sidebar card | ✅ primary, strategic framing | Spot under/over-utilization | ratio, band, type | `GET /utilization` |
| Capacity-aware completion estimate | ✅ "fits your need?" hint on equipment detail | ✅ Action Queue signal | ✅ dedicated capacity view **(new)** | Review early return/reassign | utilization vs assumed capacity, estimated completion range, assumptions | `GET /capacity` **(new)** |
| Demand forecasting | — | ✅ sidebar card | ✅ primary, business framing | Plan allocation | predicted demand, trend, confidence | `GET /forecasts` |
| Recommendations / Action Queue | — | ✅ primary workspace | ✅ full ranked queue, all sources | Actioned / dismissed | signal, reason, action, expected impact | `GET /recommendations`, `PATCH /recommendations/:id` |
| Fleet/dealer allocation overview | — | — (site-scoped by nature of the data) | ✅ primary | Spot allocation imbalance | equipment by site/type/status | `GET /equipment`, `GET /sites` |

## Notes

- Dealer keeps everything Phase 00–11 already verified — this is a
  restyle + reorganization under `/dealer`, not a rebuild of dealer logic.
- Admin reuses the **same** underlying data as Dealer (`utilization`,
  `forecasts`, `recommendations`) but at fleet scope with a strategic
  framing (trends/patterns) rather than a per-asset action list — same
  data, different altitude, per the prompt's explicit instruction not to
  duplicate the same dashboard.
- Customer is the only role that needs a schema change (`customer_name` on
  `checkouts`) and the only role with materially less data — no
  utilization/anomaly/forecast internals exposed, by design (§14 of the
  original prompt: "do not turn the customer interface into an operations
  dashboard").
- `GET /capacity` is the one genuinely new backend capability; alerts/
  anomalies already exist as APIs but lacked a dedicated frontend client
  — that's a frontend gap being closed, not a backend gap.
