# Design

Frontend design for the Smart Rental Tracking System, treated as a product
decision, not an afterthought — filled in once the real problem and user
were known (`problem-statement/ANALYSIS.md`).

**Superseded by the three-role rebuild (2026-09-01):** everything below
describes the original single-persona (Dealer-only) MVP — still accurate
for the Dealer experience specifically (`Layout.jsx` is now
`components/layout/AppShell.jsx`, `/assets` is now `/dealer/assets`), but
the "two screens" framing and user model are out of date. See
`FRONTEND-REBUILD-PLAN.md` (architecture/roles), `FRONTEND-ROLE-MATRIX.md`
(feature ownership), and `FRONTEND-UX-PLAN.md` (current visual direction)
for the Customer/Dealer/Admin design as it actually exists now. Kept here
rather than rewritten so the original reasoning isn't lost — most of it
(status vocabulary, no-sidebar decision, avoiding decorative styling)
still holds and was reused, not replaced.

## User and job-to-be-done

One user: the control-tower/operations person deciding what to do next.
Every screen answers one of: *what needs my attention, why, and what do I
do about it* — not *here is a chart of everything*.

## Information architecture

**Attention → Explanation → Action**, not Chart → Chart → Chart. Concretely:

1. **Control Tower** (`/`) — the primary screen, opens to what needs
   attention first: Action Queue at the top (ranked signals with reason +
   recommended action), Live Status and Utilization below it as
   supporting context, not the headline.
2. **Asset Dashboard** (`/assets`) — the inventory: every asset's status,
   site, location, return date, with check-out/check-in actions inline.
   This is the "do the work" screen; Control Tower is the "decide what
   work to do" screen.

No third screen for MVP. A settings/admin screen, a map, or a chatbot
panel are not needed to tell the required demo story — see
`problem-statement/ANALYSIS.md` §16.

## Visual language

Industrial control-tower context, not a generic AI-startup dashboard:

- **Color carries meaning, not decoration.** A small, fixed status
  vocabulary: neutral (available/normal), amber (attention — upcoming
  return, moderate idle), red (overdue, anomaly, urgent). No gradient
  backgrounds, no decorative color. If a color appears, it's answering
  "does this need attention," full stop.
- **Typography:** one sans-serif family, weight and size carry hierarchy
  (signal text heavier than supporting metadata) rather than color alone
  — keeps it usable and avoids "AI dashboard" cliché of everything being
  the same weight in a bright accent color.
- **Density over whitespace-for-its-own-sake.** An operations user scans
  a list of signals quickly; this is closer to an ops console than a
  marketing page. Generous spacing where it aids scanning (row separation
  in the Action Queue), tight where it doesn't (metadata within a row).
- **No decorative animation.** Any motion (e.g., a status changing on
  check-in) exists to draw attention to *what changed*, not for polish.

## Component conventions

- **Status badge** — one small component, reused everywhere an asset or
  signal's state is shown (Asset Dashboard rows, Action Queue items). One
  definition of what each color/label means, defined once.
- **Action Queue item** — signal, reason, recommended action, expected
  impact, and a single primary action button (mark actioned / dismiss).
  This is the component the differentiation strategy hinges on
  (`problem-statement/ANALYSIS.md` §12) — it should read like a sentence a
  human wrote, not a raw data dump.
- **Table** (Asset Dashboard) — sortable by status/site/return date; no
  pagination needed at this data scale (single-digit-to-low-hundreds of
  synthetic assets).
- Loading / error / empty states follow the existing pattern
  (`client/src/components/{Loading,Error,Empty}State.jsx`) — every new
  page uses them, including the Action Queue's own empty state ("nothing
  needs attention right now" is a real, good state to design for, not an
  afterthought).

## States that must be designed, not just coded

- Action Queue empty (healthy fleet) vs. populated (what does a 5-item
  queue look like, ranked how — severity first, then due-soonest).
- A forecast with insufficient history — must say so plainly, not hide
  the card or show a fabricated number (`REQ-019`).
- A duplicate check-out attempt — inline validation error, not a silent
  failure or generic 500.

## What this explicitly avoids

Gradient-heavy panels, glassmorphism, a sidebar (two screens don't need
one — top nav is enough, matching the existing `Layout.jsx`), decorative
charts that don't map to a decision, and generic purple/blue "AI product"
styling. If a design choice can't be justified against the user's actual
decision-making need, it doesn't go in.
