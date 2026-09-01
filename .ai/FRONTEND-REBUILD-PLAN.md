# Frontend rebuild plan — three role experiences + capacity-aware optimization

**Partially superseded (2026-09-01, later that night):** this plan's
"client-simulated, no real auth backend" decision (§2 below, and the
non-goals in §9) was itself superseded — real Google OAuth was built
(`server/src/modules/auth/`, migration `010_create_users.sql`) and is
confirmed working with a real signed-in account. `RoleContext.jsx` now
holds real identity from `/api/auth/me`, not `localStorage`. The Admin
route map in §5 is also out of date: `/admin` is now a Control Tower
(`ControlTower.jsx`), `Recommendations.jsx` was folded into it, and the
old `/admin` content (fleet/site allocation) moved to `/admin/fleet`.
Everything else here (role/feature scope, capacity feature design,
non-auth architecture decisions) still holds. See `.ai/DECISIONS.md`'s
"Full product/UX audit, second pass" entry and `.ai/STATE.md` for current
reality — this file is kept for the original reasoning trail, not edited
in place.

**Status:** superseding decision, recorded 2026-09-01 (post-Phase-11). The
Phase 00–11 build shipped a single-persona dispatcher tool by deliberate
choice (`DECISIONS.md` 2026-08-30, `PANEL-DEFENSE.md` §12: "no
authentication/multi-user roles"). This plan **reverses that decision**
under explicit new direction: build three distinct role experiences
(Customer / Dealer / Caterpillar Admin) plus a capacity-aware rental
optimization feature. This is a conscious product-scope change, not a
silent contradiction — `DECISIONS.md` gets a new entry cross-referencing
this file.

## 1. Current-state problems (from the ground-truth audit)

- No role concept anywhere — one nav, two pages (Control Tower, Asset
  Dashboard), built for a dispatcher, not a renter or an executive.
- No customer/renter identity in the data model at all — `checkouts` links
  to `operator`+`site` (internal fleet staff), never to an external
  customer. A genuine Customer POV needs *some* notion of "whose rental is
  this," even if minimal.
- Design system is a single dark theme with ad hoc spacing/type — workable,
  but not an intentional "industrial premium" identity, and has no
  documented tokens (colors are CSS vars, everything else is hardcoded
  per-class).
- `alerts` and `anomalies` have real endpoints but **no dedicated frontend
  view** — only consumed indirectly via `recommendations`. An Admin
  "anomaly intelligence" view needs direct access to these.
- Utilization is fleet-wide-by-type only (`utilization.service.js`) — no
  per-checkout/per-rental view, which is what the capacity-aware feature
  (below) needs.
- No concept of "typical/expected workload" for a rental — utilization is
  measured (engine vs idle hours) but never compared against a capacity
  baseline or a completion estimate.

## 2. Role model (resolves conflict with `DECISIONS.md`)

Three roles, client-simulated (no real auth backend — matches
`ARCHITECTURE.md`'s existing extension notes; a JWT/session layer is future
work, not built now). Role is chosen at an entry screen, stored in
`localStorage` + React context, and clearly labeled as demo/simulated
switching — never presented as real authentication. "Continue with Google"
is **not** implemented (no backend to support it) — omitted rather than
faked, per instruction.

| Role | Data scope | New identity needed? |
|---|---|---|
| Customer | Equipment discovery (available equipment), one simulated "my rentals" view | Yes — see §3 |
| Dealer | Everything Phase 00-11 already built (inventory, checkout, check-in, usage, alerts, anomalies, recommendations) | No |
| Caterpillar Admin | Fleet-wide utilization, anomalies, forecasts, recommendations, capacity intelligence | No |

## 3. Minimal customer-identity schema change

To make "my rentals" real (not fully mocked), add a nullable
`checkouts.customer_name` (`TEXT`, nullable) via migration `008`. This is
the smallest honest change: it lets a checkout be *optionally* attributed
to a named customer without inventing a full user/auth system the problem
statement never asked for. Customer POV's "browse & request" flow creates
a checkout the same way the Dealer flow does (reusing `POST /api/checkouts`
with `customer_name` added to the payload/schema), and "my rentals" filters
client-side by the name the visitor entered at the simulated customer
"login." This is explicitly a demo simplification — documented as a known
limitation (no real customer accounts), same honesty standard as the
existing `PANEL-DEFENSE.md` limitations section.

## 4. Capacity-aware rental optimization — where it fits

**This is not a new UI card. It's a new analytics capability**, sitting
alongside `alerts`/`anomalies`/`forecasts` as a peer signal source feeding
`recommendations`.

### 4.1 Method (rule-based, explainable — matches existing analytics style)

Inputs, all already in the schema (no new tables beyond §3):
- `usage_logs.engine_hours` per active checkout → observed daily productive
  rate.
- Assumed **rated capacity per equipment type** (`CAPACITY_HOURS_PER_DAY`
  constant map, e.g. Excavator 8h, Bulldozer 8h, Crane 6h, Grader 7h) —
  an explicit, documented assumption, not measured. Surfaced in the UI as
  "assumed capacity," not fact.
- **Typical workload baseline**: median total `engine_hours` logged across
  *historical, returned* checkouts of the same equipment type that fell in
  the existing 65–75% healthy utilization band (`utilization.service.js`'s
  own band — reused, not reinvented). This is real historical data, not
  invented.

Calculation, per active checkout:
1. `observed_daily_rate = avg(engine_hours)` over that checkout's logged
   days (needs ≥3 logged days, same minimum-evidence bar as anomalies).
2. `utilization_ratio = observed_daily_rate / assumed_capacity_hours`.
3. If `utilization_ratio < 0.65` (underutilized, existing band) **and** a
   typical-workload baseline exists for that equipment type (≥3 historical
   healthy checkouts): `estimated_completion_days = typical_total_hours /
   observed_daily_rate`, reported as a **range** (±20% to visualize
   uncertainty, explicit assumption) rather than a false-precision single
   number.
4. If no baseline exists: report the utilization signal only, with
   `insufficient_history: true` — same honest-degradation pattern as
   `forecasts`' `insufficient_history`. Never fabricate a completion
   window without data.
5. Compare `estimated_completion_days` to the remaining contracted rental
   window (`expected_return_at - now`). If completion is expected well
   before the contracted return (>20% slack), surface signal
   `underutilized_capacity`.

### 4.2 New backend module: `server/src/modules/capacity/`

- `GET /api/capacity` — per active checkout: utilization ratio, assumed
  capacity, observed rate, typical baseline (or `insufficient_history`),
  estimated completion range, assumptions used (verbatim, for the UI to
  display).
- Extends `recommendations` source types: migration `009` adds
  `'capacity'` to `recommendations.source_type` CHECK constraint (minimal,
  additive, documented). New recommendations map
  `underutilized_capacity` → `action: 'investigate'` (existing enum value
  — reviewing for early return/reassignment is an investigation, not an
  automatic return; matches "do not blindly say return").

### 4.3 Panel-defense answers (pre-written, per the prompt's explicit ask)

- *Why underutilization, not just "low usage"?* Because it's relative to
  an assumed capacity **and** compared against what similar past rentals
  of the same equipment actually needed — two independent signals, not one
  raw percentage.
- *How is capacity estimated?* A documented per-type constant
  (assumption, labeled as such in the UI), not measured — a production
  system would source this from OEM spec sheets or historical peak rates.
- *How is completion time estimated?* Historical median total hours for
  healthy-band rentals of the same type, divided by this rental's observed
  daily rate — shown as a range, not a point estimate.
- *Why should the customer return early?* We never say "should" — the
  recommendation action is `investigate`/`review`, worded as a
  suggestion with visible assumptions, not a command.
- *What if the customer needs more hours later?* The estimate updates
  every time `/api/capacity` recomputes (every read, same as alerts/
  anomalies) — it reflects the latest logged usage, not a one-time
  prediction; extension remains a normal action.
- *What if the forecast is wrong?* It's explicitly labeled with its
  assumptions and a ±20% range, and only ever suggests review — no
  automatic action is taken (matches REQ-016's simulation-labeling rule).
- *Dealer benefit:* earlier visibility into likely-returnable equipment →
  faster re-circulation. *Caterpillar benefit:* fleet-wide capacity-gap
  visibility across dealers (Admin view, §6).
- *Vs. plain utilization:* utilization alone is a rear-view percentage;
  this adds a forward-looking, data-grounded completion estimate and a
  concrete recommended action.
- *Production accuracy needs:* real per-machine rated capacity (not a type
  constant), a stated customer workload/contract scope, and enough
  historical volume per type/site to trust the baseline — noted as
  limitations, same honesty standard as `RESEARCH.md`.

## 5. Frontend architecture

```
client/src/
  app/
    RoleContext.jsx        - current role + "log out" (clears localStorage)
    RoleGate.jsx            - route guard, redirects to /entry if no role set
  pages/
    Entry.jsx                - landing + role selection (public)
    customer/
      Discover.jsx            - browse available equipment
      EquipmentDetail.jsx      - one machine's detail + capacity-fit hint + rent action
      MyRentals.jsx            - active/past rentals for the entered customer name
    dealer/
      ControlTower.jsx         - existing, restyled, + capacity signals in Action Queue
      AssetDashboard.jsx       - existing, restyled
    admin/
      FleetOverview.jsx        - fleet status, dealer/site allocation
      Utilization.jsx          - existing utilization data, capacity-gap framing
      Anomalies.jsx            - direct anomalies view (new — was Dealer-only via recs)
      Forecasts.jsx            - existing forecast data, decision framing
      Recommendations.jsx      - full ranked queue, all source types incl. capacity
    NotFound.jsx
  components/
    layout/
      AppShell.jsx             - role-aware header/nav (was Layout.jsx)
    shared/  (StatusBadge, LoadingState, ErrorState, EmptyState, ActionQueueItem - kept)
    capacity/
      CapacityBadge.jsx        - underutilized/healthy/overutilized chip
      CompletionEstimate.jsx   - range + assumptions disclosure
  api/
    capacity.js               - new: GET /capacity
    alerts.js, anomalies.js   - new: dedicated clients (Admin views need them directly)
    checkouts.js              - extended: customer_name field
  styles/
    tokens.css                - new: named design tokens (see §7)
    index.css                 - existing, refactored to consume tokens
```

Routing (React Router v7, still no new deps):
`/` → `Entry`. `/customer/*`, `/dealer/*`, `/admin/*` are role-scoped
subtrees, each behind `RoleGate` (redirects to `/` if role doesn't match —
demo-safe, not real authorization).

## 6. Feature → role mapping

See `.ai/FRONTEND-ROLE-MATRIX.md` (source of truth, kept in sync with this
file).

## 7. Design system direction

- Keep the existing dark-first palette as the base (`--color-bg`,
  `--color-surface`, etc. — already reasonable) but formalize it into
  named tokens with a light-mode-safe structure, add a genuine type scale
  (`--font-size-xs/sm/md/lg/xl/2xl`) and spacing scale
  (`--space-1..8`, 4px base), replacing hardcoded rem values.
- Amber (`#e6a82f`, already present) becomes the **one** intentional
  Caterpillar-adjacent accent, reserved for: primary brand mark, primary
  CTA, and "attention" semantic state — not the whole UI.
  Semantic 4-tone system (neutral/info/warning/danger) stays, formalized
  as tokens instead of hardcoded hex per component.
- No new dependencies (no Tailwind, no component library) — plain CSS with
  tokens, consistent with the existing "no unnecessary libraries" decision
  in `DECISIONS.md`.

## 8. Implementation phases

| Phase | Scope | Depends on |
|---|---|---|
| RB-1 | Planning docs (this file + role matrix) | Audit |
| RB-2 | Design tokens + `AppShell` + `Entry` role-selection landing + routing skeleton | RB-1 |
| RB-3 | Dealer experience restyle (existing pages moved under `/dealer`, no functional change) | RB-2 |
| RB-4 | Customer experience (`Discover`, `EquipmentDetail`, `MyRentals`) + migration 008 (`customer_name`) + checkout schema extension | RB-2 |
| RB-5 | Admin experience (`FleetOverview`, `Utilization`, `Anomalies`, `Forecasts`, `Recommendations`) + dedicated alerts/anomalies API clients | RB-2 |
| RB-6 | Capacity-aware optimization: migration 009 (`capacity` source type), `capacity` backend module + tests, surfaced in Dealer Action Queue + Admin capacity view + Customer equipment-fit hint | RB-3, RB-4, RB-5 |
| RB-7 | Manual QA pass (three roles), responsive check, a11y pass, doc sync (`STATE.md`, `REQUIREMENTS.md`, `MANUAL-QA.md`) | RB-2..RB-6 |

Each phase: implement → run → manually verify against the live app → commit
→ update `STATE.md`. No phase is "done" on code existing alone.

## 9. Explicit non-goals (kept out, matching existing project discipline)

- No real authentication/JWT/password backend — client-simulated role
  switching only, clearly labeled.
- No payment/pricing engine.
- No ML model for capacity/forecast — rule-based, explainable, same as
  existing `forecasts`/`anomalies`.
- No new state-management library, no UI kit, no CSS framework.
