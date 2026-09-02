# Remaining issues — honest, not swept under the rug

Carried forward from `.ai/ISSUES.md` (still accurate) plus two new findings
from this session's live testing. Nothing here was fixed by design — either
it's out of scope for a same-day pre-demo pass, or it's an inherent
tradeoff already made deliberately.

## 1. Server-side authorization is real but narrow (`ISSUES.md` RISK-005, unchanged)

`requireAuth` is applied to exactly one route (`PATCH /api/auth/me/role`).
Every other endpoint — including every write: `POST /api/checkouts`,
`PATCH /api/checkouts/:id/check-in`, `POST /api/usage-logs`,
`PATCH /api/recommendations/:id` — accepts unauthenticated requests. The
only real identity check that exists is narrower still: a signed-in customer
can only self-return their *own* rental. `RoleGate` on the frontend is a UX
guard only, not a security boundary.

**Confirmed still true this session** by re-reading every `*.routes.js` file
directly — not assumed carried-over from the prior session's audit.

**Why not fixed now:** would require updating every backend test fixture to
authenticate first (32 tests currently call these routes unauthenticated) —
real, non-trivial work this close to presenting, on a system that was just
stabilized. Documented, not hidden — see `PANEL-DEFENSE.md` §12 for the
rehearsed answer if a judge asks.

## 2. Seed data timestamps drift with real wall-clock time (`ISSUES.md` BUG-001 pattern, reconfirmed live)

Demonstrated directly this session (`BUGS_FIXED.md` #1): `EQX3002`'s
"upcoming return" demo case flips to "overdue" roughly 18 hours after the
local DB is last seeded, because the seed script computes
`expected_return_at` relative to seed-run time, not a fixed calendar date.

**Impact:** if the local (or production/Neon) database isn't reseeded
reasonably close to the actual judging slot, this specific card's wording
will have quietly changed from what `DEMO-SCRIPT.md` describes — not broken,
just a different (still real, still correct) alert type than rehearsed.

**Why not fixed now:** a permanent fix (fixed absolute seed dates, or
scheduled re-seeding) is a real design change to the seeding approach, not
appropriate to make hours before presenting without discussing with the
team. Reseeding right before your slot is the correct mitigation, and it's
cheap (`npm run seed` after clearing tables, ~5 seconds).

**Action for you:** reseed the database you'll actually demo from (local or
production/Neon — whichever you're presenting against) as close to your slot
as practical, and re-skim `EQX3001`-`EQX3006` afterward to make sure the
demo beats (`DEMO-SCRIPT.md`) still match.

## 3. Mobile Action Queue is very long, with no collapsing/pagination (new finding, this session)

**Found via:** live mobile-viewport (390×844) screenshot of `/dealer` —
the resulting full-page screenshot is over 9000px tall. Every Action Queue
card (21 of them, full width) stacks vertically with no "show top 5" /
"load more" / collapse affordance.

**Impact:** on an actual phone, a judge or demo presenter would need to
scroll a very long way to see anything below the top few cards. Not broken
— every card renders correctly, no layout bugs — but it's a real UX
weakness for the mobile "wow" angle specifically (desktop is fine, since the
sidebar panels are visible without excessive scrolling).

**Why not fixed now:** the correct fix (pagination, a "top N + expand"
pattern, or a collapsed/summary card view) is a real feature addition, not a
one-line patch, and risks introducing a new bug in the Action Queue's
ranking/interaction logic hours before presenting. Flagging honestly instead
of attempting a rushed fix.

**Recommendation:** if mobile is part of your actual demo (not just "it
doesn't crash on mobile"), lead with desktop for the Control Tower and use
mobile specifically for the Customer flow (Discover/rent), which is short
and renders well at 390px (see `screenshots/12_MOBILE/customer-discover-mobile.png`).

## 4. Google's live OAuth screen not re-verified this session

See `USER_JOURNEY_TESTS.md`'s note at the top and `REQUIREMENTS_AUDIT.md`
#15 — architecturally unchanged and verified live in production the night
before across real devices, but this specific pass could not re-click it
(cannot be automated, no test credentials). Not a new risk, just an honest
scope boundary for what "verified today" means.

## 5. Docker Compose end-to-end still unverified (`ISSUES.md` RISK-001, unchanged)

This session's local Postgres was the existing Homebrew service (already
running), not `docker compose up postgres` — same unverified state as
before, not newly checked either way.

## 6. Two of three invited teammates still haven't accepted GitHub access (`ISSUES.md` RISK-002, unchanged)

Not re-checked this session (would require GitHub API access, out of scope
for a local-only pass) — carried forward as-is from `ISSUES.md`.
