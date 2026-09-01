# Frontend UX plan

Companion to `FRONTEND-REBUILD-PLAN.md` (architecture/roles/capacity
feature) and `FRONTEND-ROLE-MATRIX.md` (feature ownership). This file
covers visual/interaction/quality specifics.

## Visual direction

Industrial/premium/technical, not generic SaaS. Reference:
rent.cat.com's *character* (confident type, high-contrast industrial
photography, restrained color, equipment-first hierarchy) — not its
layout, copy, or components (none reused).

- **Base:** dark surface (`--color-bg`/`--color-surface`, already
  established), kept as the primary theme — reads as an operations/
  control-room product, appropriate for Dealer/Admin. Customer pages use
  the same tokens but lighter surface density (more whitespace, larger
  imagery, fewer borders) so the product-discovery experience doesn't feel
  like an ops console.
- **Accent:** amber reserved for brand mark, primary CTA, and "needs
  attention" semantic state only. Never a background wash.
- **Typography:** system font stack kept (no webfont dependency/latency
  risk); introduce a real type scale (tokens, §7 of the rebuild plan) so
  hierarchy is deliberate, not per-component guesswork.
- **Cards/tables/badges:** keep the existing semantic 4-tone status
  language (neutral/info/warning/danger) — it already works and is used
  consistently; formalize into tokens, don't reinvent.

## Motion

Purposeful only: page-section fade/slide-in on route change (~150ms,
`prefers-reduced-motion` respected via a single CSS media query gate),
Action Queue item enter/exit on actioned/dismissed, subtle hover states on
interactive cards/buttons. No decorative animation, no hero video.

## Images

Equipment imagery used only where it earns its place: Customer `Discover`
grid and `EquipmentDetail` hero. Source: static optimized images checked
into `client/public/equipment/` (type-level, not per-unit — e.g. one
excavator image reused across all excavator listings), not an external
CDN dependency. If no suitable asset exists for a type, fall back to a
clean labeled placeholder (equipment type + icon), never a broken image or
generic stock photo.

## Responsive

- Customer flows: mobile-first, single-column, large tap targets — this
  is the role most likely to be used on a phone.
- Dealer/Admin: desktop-first (operational, data-dense), but must not
  break below ~768px — tables get horizontal scroll containers, sidebar
  cards stack, per the existing 420px-verified pattern from Phase 10.

## Accessibility

- Color is never the only status signal — text label always accompanies
  every badge (already true in `StatusBadge.jsx`, keep it).
- Focus-visible states on all interactive elements (buttons, links, form
  controls) — audit during RB-7.
- Semantic HTML: real `<table>`/`<th>` for data tables, `<button>` for
  actions (not clickable `<div>`s), labeled form inputs.
- `prefers-reduced-motion: reduce` disables the route-transition/hover
  animation, keeps instant state changes.

## Performance

- No new heavy dependencies. Equipment images lazy-loaded
  (`loading="lazy"`), sized/optimized before commit.
- Data-fetching stays the existing `useApi` hook pattern (no
  over-fetching library); Admin/Dealer views that show the same
  utilization/forecast/recommendation data reuse the same API client
  functions, not duplicated fetch logic.
- Recommendation/alert/anomaly lists render as plain lists — no charting
  library added for the sake of "having a chart"; only add a chart where
  it answers a real decision (e.g., utilization trend), and prefer simple
  inline SVG/CSS bars over a dependency if the need is small.

## Implementation order

Matches `FRONTEND-REBUILD-PLAN.md` §8 (RB-1..RB-7). Order rationale:
design tokens + shell + routing first (RB-2) because every subsequent
phase depends on `AppShell`/`RoleGate`; Dealer restyle before Customer/
Admin builds (RB-3) because it's the lowest-risk phase (no new data
dependency, existing verified logic) and re-confirms the token system
works before building net-new pages on top of it; Customer and Admin
(RB-4/RB-5) can be built in either order (independent) but both must land
before Capacity (RB-6), which surfaces in all three. QA (RB-7) last,
against the real running app, not just component-level review.

## Key UX decisions log

- **No fake Google auth** — explicitly instructed not to fake real auth;
  role entry is labeled "Demo mode — choose a role to continue," never
  presented as a real login.
- **Admin ≠ Dealer with more charts** — same underlying data sources,
  different altitude: Dealer sees per-asset actions, Admin sees
  fleet-wide patterns and capacity-gap framing. Enforced by giving Admin
  pages no per-asset action buttons (no checkout/check-in) — Admin
  observes and recommends strategy, Dealer executes.
- **Customer never sees utilization/anomaly internals** — per the
  original brief's explicit instruction; Customer's only analytics
  exposure is the plain-language capacity-fit hint on equipment detail.
