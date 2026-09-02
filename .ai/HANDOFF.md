# Handoff log

Newest entry first. Every agent/session adds a new entry before stopping —
never edits or deletes a previous one. This is the narrative record that
`STATE.md`'s snapshot can't carry on its own: what was actually tried,
what surprised us, what's still shaky.

---

## 2026-09-02 — Full competition-readiness audit against the real Caterpillar source material

**What this session was:** an independent audit against the actual
Caterpillar hackathon brief, not the repo's own docs. Read the real
source material first — the printed handout photo already referenced in
`PROBLEM-STATEMENT.md`, plus 11 previously-unreviewed presentation-slide
photos from `~/Downloads` (the "Source B" deck itself, not a relayed
transcription). Confirmed the existing `PROBLEM-STATEMENT.md` is
accurate against the real slides on every checkable point (six
capabilities, four-step asset journey, judging weights, demo-narrative
framing all match word-for-word) — one real, useful finding: the
official suggested demo's SPOT example is `EQX1007` ("12 idle hours per
day"), not `EQX1002`, which `DEMO-SCRIPT.md` had been using. Fixed.

**Two real, live bugs found and fixed, both confirmed on production, not
guessed:**
1. A genuine race condition in alerts/anomalies/recommendations
   sync-on-read (check-then-act, no atomicity) — confirmed via duplicate
   rows on live production sharing the exact same equipment_id AND
   checkout_id, inserted ~50ms apart. Fixed with migration `011` (partial
   unique indexes + `ON CONFLICT DO NOTHING`), verified with a 10-way
   concurrent stress test against all three sync functions before and
   after. See `ISSUES.md` `BUG-003`.
2. Role switching was silently removed by a same-night teammate commit,
   leaving Entry.jsx's own copy promising a capability that no longer
   existed and breaking `DEMO-SCRIPT.md`'s rehearsed Admin bonus beat.
   Restored (`client/src/pages/SwitchRole.jsx`), redesigned to match the
   current visual language rather than reverted verbatim. See `ISSUES.md`
   `BUG-004`.

**Also found, live on production, and diagnosed as NOT a bug:** `EQX1001`
and `EQX1002` showed as actively checked out with no operator/site
assigned. Traced to real, legitimate checkouts created by real people
testing the live app tonight (matches the same real customer/checkout
activity visible in Render's own request logs) — not corrupted seed
data. Documented in `DEMO-SCRIPT.md`'s pre-flight section: check these in
before presenting, or re-seed if the queue looks cluttered with test
signals rather than the clean official example.

**Real, honest, NOT-fixed-tonight gap, formalized as `ISSUES.md`
`RISK-005`:** server-side authorization covers exactly one route
(`PATCH /api/auth/me/role`); every other endpoint, writes included,
accepts unauthenticated requests. This was already honestly disclosed in
`PANEL-DEFENSE.md` before tonight — confirmed still accurate by reading
every route file directly. Deliberately not retrofitted this session:
the automated test suite calls these routes without authenticating, so
doing this properly means updating test fixtures too, which is real risk
this close to presenting on a system just stabilized after two more
visible live bugs. First priority after presenting.

**Verified this session (not assumed):** backend 32/32 tests (before and
after every change); client build clean throughout; migration 011
applies cleanly to a fresh local database; the race-condition fix
holds under 10-way concurrency for all three sync functions; production
redeployed and reconfirmed zero duplicate `(checkout_id, type)` pairs
live; `/switch-role` returns 200 live; the public entry page renders
correctly at a real mobile viewport (390×844) against the live URL with
zero console errors.

**Not verified, and said so rather than guessed:** a live, human-driven
click-through of the full Customer/Dealer/Admin/capacity flows on the
actual production URL this session (extensive live API- and log-level
verification was done instead, which is what's actually available
without a browser session of my own on the deployed app). The
`RISK-005` authorization gap's real-world exploitability wasn't
penetration-tested, only confirmed to exist by reading the route code.

---

## 2026-09-01 (late night) — Admin Control Tower + full doc sync after the real-auth landing

**What this session was:** picked up mid-flight, uncommitted real Google
OAuth work (migration `010_create_users.sql`, `server/src/modules/auth/`,
rewritten `RoleContext`/`RoleGate`) that a prior session/agent had already
built and gotten working (confirmed via a real signed-in row in `users` —
`ayushh.ofc10@gmail.com`, role `admin`) but never documented or fully
integrated. Verified it end-to-end (see `.ai/DECISIONS.md`'s "Full
product/UX audit, second pass" entry for the full method: minted a
DB-backed test session, ran a real checkout → cross-customer 403 →
real-owner-check-in cycle against Postgres, cleaned up after). Then did a
product-level audit against the problem statement's own principle ("the
dashboard should recommend, not just report") and found Admin's home page
was still a static report while Dealer's was already a real Control
Tower — built `client/src/pages/admin/ControlTower.jsx` to close that gap
(old `FleetOverview` content moved to `/admin/fleet`), plus three smaller
fixes (Customer capacity-hint ordering, a pointless readonly form field
removed, search added to Dealer's Asset Dashboard).

**Then a full documentation sync**, because the auth landing had left the
docs badly out of date — anyone reading them cold would have gotten the
auth flow, the admin routes, and the baseline numbers wrong:
- `.ai/PANEL-DEFENSE.md` §12 literally said "No authentication/multi-user
  roles" — actively wrong and would have been an embarrassing thing to
  say to judges. Corrected, with the real, honest boundary (auth is real,
  server-side role *authorization* is still partial).
- `.ai/MANUAL-QA.md` still instructed testers to "enter any name" — there
  is no such flow anymore, only real Google Sign-In. Rewrote the auth
  instructions, the Admin section (new routes/nav), and the baseline
  count (17/22/192 → 21/26/257) throughout.
- `.ai/DEMO-SCRIPT.md` — the literal script for tonight's presentation —
  predated the whole role rebuild: no sign-in step at all, `/assets`
  instead of `/dealer/assets`, and a forecast number
  (`Excavator @ S003`) that had drifted from 5/1.25-per-week to
  6/1.5-per-week since the script was written (checked live against the
  running API, not assumed). Fixed all three, and added an optional
  bonus beat showing the new Admin Control Tower.
- `.ai/DEPLOYMENT.md` had no mention of the Google OAuth env vars
  (`GOOGLE_CLIENT_ID`/`SECRET`/`REDIRECT_URI`, `SESSION_SECRET`) at all —
  deploying today would have silently shipped broken sign-in. Added them,
  plus the Google Cloud Console redirect-URI step deployment needs.
- `.ai/ARCHITECTURE.md`, `.ai/REQUIREMENTS.md`, `.ai/FRONTEND-UX-PLAN.md`,
  `.ai/FRONTEND-REBUILD-PLAN.md`, `README.md` — smaller corrections or
  "superseded, see X" notes pointing at current reality, not rewritten
  wholesale (history kept intact where it was genuinely historical, per
  this project's own documentation discipline).

**What's still true and unresolved, not fixed this session (by design —
flagged, not silently worked around):**
- Admin's and Dealer's Control Tower queues show the *same* recommendation
  items — no role-scoped backend query exists yet. Documented everywhere
  it's relevant rather than presented as more differentiated than it is.
- Server-side role-based authorization is still mostly UX-guard-only
  (`RoleGate` redirects, but most read endpoints don't check `req.user.role`).
- Deployment is still not live — no Vercel/Render/Neon account created.
- The demo script was corrected in place but **not re-rehearsed live**
  this session — do at least one live run-through before presenting,
  per its own instruction.

**Verified this session:** backend 32/32 tests (unchanged, no server
logic touched beyond what the prior uncommitted auth work already had);
client build clean (61 modules); live Playwright pass across every
screen (entry, all three role homes, equipment detail, asset dashboard),
1440px + 390px mobile, zero console errors; every data shape the new
Admin Control Tower reads checked against live API responses first.
Nothing committed by this session — the user asked for docs updated and
pushed; see the commit this entry ships with for exactly what's included.

---

## 2026-09-01 — Documentation audit + deployment prep (no application logic changed)

**What this session was:** two things, back to back. (1) Prepared
deployment configuration (Vercel + Render + Neon, chosen and researched
against current 2026-09 free-tier terms — see `DECISIONS.md`) but did
**not** create any hosting accounts (that's a manual, human-only OAuth
step — see `DEPLOYMENT.md`). (2) A full documentation audit against
actual current repository/runtime state, per an explicit "audit and
update docs only, don't build features" instruction.

**Real findings from re-running verification, not assumed:**
- `npm test` in `server/` is currently **22/26 passing**, not the 26/26
  every phase doc claims. Root-caused via direct `psql` inspection (not
  guessed): `EQX3001`/`EQX3002`'s seeded active checkouts got checked in
  during an earlier manual-QA/browser-testing session and were never
  reset, and 3 recommendations moved out of `pending`. `equipment`/
  `checkouts`/`usage_logs` row counts are still exactly 17/22/192 — this
  is seeded-data drift, not a code defect. Logged as `ISSUES.md` `BUG-001`,
  not silently fixed (fixing it would mean writing SQL to restore
  production-shaped demo data by hand, which is a data-hygiene action
  outside a docs-only session's scope — flagged for the next session
  instead).
- `git log --format=%an` confirms all 29 commits are authored solely by
  `Ayush-o1` — `ROADMAP.md`'s phase-owner table (Astik/Eklavya/Souharda
  per phase) is `TEAM-EXECUTION-PLAN.md`'s *intended* assignment, not an
  execution record. Added a footnote to `ROADMAP.md` rather than rewrite
  the table — it's still valid as a plan.
- `README.md` still described the deleted `items/` reference module and
  told a future agent to "copy or delete it" — that already happened.
  Rewrote the relevant section to describe the actual implemented modules
  and pages, and corrected a stale "no dashboards" claim (Control Tower
  *is* a dashboard).
- Manual QA: `.ai/MANUAL-QA.md` has 0 of 66 tests actually marked PASS by
  a human — only automated + AI-scripted browser verification has
  happened so far. `STATE.md` didn't previously distinguish these; now
  does, explicitly.
- `client/npm run build` reconfirmed clean (42 modules, no errors).

**Deployment prep (code changes, kept minimal and justified):**
`server/src/config/db.js` now enables SSL only when `NODE_ENV=production`
(hosted Postgres requires it, local dev Postgres doesn't have an SSL
listener at all — confirmed the full backend suite still behaves
identically locally after this change, modulo the pre-existing `BUG-001`
drift above). `server/src/server.js`'s startup log no longer hardcodes
"localhost". Added `render.yaml` (Blueprint) and `client/vercel.json`
(SPA rewrite, needed because the app uses `react-router-dom`'s
`BrowserRouter`). New `.ai/DEPLOYMENT.md` is the source of truth for
deployment status — as of this entry, **not live**, config only.

**Files touched this session:** `.ai/DEPLOYMENT.md` (new), `.ai/DECISIONS.md`,
`.ai/ISSUES.md`, `.ai/STATE.md`, `.ai/ROADMAP.md`, `.ai/AGENTS.md`,
`.ai/GIT-WORKFLOW.md`, `.ai/MANUAL-QA.md`, `README.md`,
`server/src/config/db.js`, `server/src/server.js`, `server/.env.example`,
`render.yaml` (new), `client/vercel.json` (new). No phase files,
`ARCHITECTURE.md`, `DESIGN.md`, `QUALITY.md`, `REQUIREMENTS.md`,
`RESEARCH.md`, `TEAM-EXECUTION-PLAN.md`, `DEMO-SCRIPT.md`, or
`PANEL-DEFENSE.md` needed changes — each was checked against actual code/
data and found accurate (or, for phase files, correctly describing that
phase's state *at the time*, which historical entries shouldn't be
rewritten to match today).

**What a future agent picking this up should do:** resolve `BUG-001`
(restore the demo baseline) before the next full test run or demo
rehearsal; complete the manual Vercel/Render/Neon account setup in
`DEPLOYMENT.md` if a live public URL is actually needed; keep treating
`.ai/MANUAL-QA.md` PASS marks as something only a human can grant.

---

## 2026-09-01 — Phase 11 implemented and verified: demo and panel-defense prep (all 11 phases now VERIFIED — autonomous Phase 03→11 run complete)

**Where we are:** Phase 11 `VERIFIED` — the last phase. **All 11 phases
(00-11) are now `VERIFIED`, all 20 requirements are `VERIFIED`.** This
closes out the autonomous Phase 03→11 run authorized after the
`TEAM-EXECUTION-PLAN.md` planning checkpoint.

**What we built:** `.ai/DEMO-SCRIPT.md` — the literal five-step demo
script (SPOT → EXPLAIN → ACT → PREDICT → PROVE), using `EQX1002`
(Caterpillar's own worked example) as the spotted anomaly. `.ai/PANEL-DEFENSE.md`
— real, sourced answers to all 12 questions from the problem statement's
own "IMPORTANT EXPECTATION" section (not paraphrased from memory — read
the literal section, answered each one against the actual decision
record).

**What we verified, live, twice:** ran the full demo script via a
scripted Puppeteer session against the real running app, start to finish,
**twice consecutively**, resetting the Action Queue
(`UPDATE recommendations SET status='pending', actioned_at=NULL WHERE
status != 'pending'`) between runs. Both rehearsals produced identical
results: the anomaly spotted and explained, the mark-actioned interaction
visibly closing the loop, the forecast panel showing both a real trend
and an honest fallback, and the expected-impact text correctly labeled
`"Simulated:"`. This is now documented as a **required pre-demo step** at
the top of `DEMO-SCRIPT.md`, since the rehearsal itself revealed the
queue is genuinely stateful — worth knowing before discovering it live in
front of the panel.

**Final documentation-reality check (11.5):** closed out REQ-016 (was
sitting at "verified with a caveat" since Phase 07) once the demo script
confirmed the simulated-labeling isn't just present in raw JSON but part
of the narrated story. Spot-checked `DECISIONS.md`'s three most
load-bearing claims (0.40 idle threshold, plain-average forecast method,
sync-on-read pattern) against the actual running code — all match.

**Honest gaps, not hidden:** `STATE.md`'s Final Phase 11 Gate section
lists three items genuinely not done this session and says so plainly:
Docker Compose was never run end-to-end (the app ran via `node`/`vite`
directly all session — `RISK-001` unchanged); a true fresh-clone bootstrap
on an empty database was not re-verified (migration idempotency and
seed-skip behavior were reconfirmed directly, which is not the same
thing); only Ayush's GitHub invite is accepted, so the team-ownership
plan in `TEAM-EXECUTION-PLAN.md` is real for when the other three join,
not evidence they've actually executed any of it (`RISK-002` unchanged).
None of these block the demo working on this machine; all three are
listed as pre-presentation action items, not swept under "all done."

**Final state, checked before writing this:** `git status` clean, all 11
phase checkpoints tagged and pushed and confirmed on `origin` (`git
rev-list --left-right --count main...origin/main` → `0 0` after every
single phase this session, not just at the end). Seeded data confirmed
at the exact Phase 02/07 baseline (17 equipment / 22 checkouts / 192
usage_logs / 19 pending recommendations) one final time after the
rehearsals.

**What a future agent picking this up should do:** there is no Phase 12.
Read `STATE.md`'s "Next recommended action" for the three pre-presentation
logistics items (Docker, fresh-clone check, teammate invites) — none of
them are code changes. If asked to add a genuinely new feature, that's
new scope beyond what this hackathon build was asked to cover this
session — treat it as a real new request, not a continuation of Phase 11.

---

## 2026-09-01 — Phase 10 implemented and verified: integration, testing, and polish

**Where we are:** Phase 10 `VERIFIED`. This phase's entire point is
verifying the system works as *one thing*, not nine independently-tested
phases — and it did exactly that: found one real, previously-invisible
gap by actually trying to run the whole story end to end.

**The real gap:** ran the literal demo chain (CHECK OUT → LOG USAGE →
anomaly appears → Action Queue → mark actioned → CHECK IN) against a
disposable fixture (`E2E-DEMO-001`, cleaned up afterward) through the
actual running app. No single phase's own tests would have caught this,
but the full walkthrough immediately did: **there was no way to log
usage from the browser** — Phase 03 built the API, Phase 08's task list
never included a usage-log UI. Fixed by returning to the Asset Dashboard
(not a new phase) and adding a "Log usage" button + modal. With that
fixed, the walkthrough ran clean: a deliberately high-idle usage entry
(1 engine hour / 9 idle hours) produced a real `excessive_idle` anomaly
(90%) that flowed through to the Action Queue correctly, and marking it
actioned closed the loop live.

**10.2 responsive check:** measured (not just eyeballed) both screens at
420px — `document.body.scrollWidth === window.innerWidth` exactly on
both, confirming no page-level horizontal overflow. An initial screenshot
looked like the nav was clipped; precise `getBoundingClientRect`
measurement showed this was a headless-screenshot rendering artifact, not
a real bug — worth recording so a future agent doesn't chase a phantom
issue from a screenshot alone.

**10.4 quality review:** CORS scoped to one origin, all writes validated,
all queries parameterized, prod errors redact internals, `.env` never
committed, no dead code left behind (Phase 09 already removed the
placeholder `Home.jsx`).

**10.5 stretch feature (REQ-020):** implemented a rule-driven top-priority
summary banner on the Control Tower (`client/src/utils/summarize.js`) —
plain string templating over the Action Queue's own top-ranked item, no
new AI dependency, exactly matching the problem statement's own candidate
for the optional "wow" feature. Verified live: renders "Top priority —
EQX3001: overdue. Recommended: return it." correctly.

**10.6 requirements audit:** 19 of 20 REQs now `VERIFIED`; REQ-016 is
verified at the API layer with one final documentation-level pass still
due in Phase 11 (not silently marked done early).

**What we verified:** `npm test` — 26/26. `npm run build` — clean.
Post-walkthrough DB check confirmed the fixture fully removed and the
seeded baseline exactly unchanged (17/22/192, 19 pending recommendations).

**Next:** Phase 11 (demo and panel-defense prep) — the last phase.
Continuing the authorized Phase 03→11 run without stopping.

---

## 2026-09-01 — Phase 09 implemented and verified: Control Tower UI (all 9 product phases now complete)

**Where we are:** Phase 09 `VERIFIED`. `client/src/pages/ControlTower.jsx`
is now the default `/` route (the placeholder `Home.jsx` deleted — no
longer referenced). **All of Phases 00-09 are `VERIFIED`.** Only Phase 10
(integration/polish) and Phase 11 (demo/defense prep) remain.

**What we built:** Action Queue at the top (ranked, color-coded by source
— red=overdue alert, amber=anomaly, blue=forecast), Live Status/
Utilization/Forecast as a supporting sidebar, matching `DESIGN.md`'s
Attention → Explanation → Action hierarchy exactly. Mark-actioned/dismiss
wired to Phase 07's `PATCH` endpoint.

**A real gap found and closed:** REQ-012 (utilization view) had no
backend support — Phase 05's idle-ratio logic was per-checkout only, not
a fleet-wide aggregate. Added `GET /api/utilization` (by equipment type,
classified against the same 65-75% healthy band Phase 05 already uses).

**Two real bugs found via actually looking at the rendered screen, not
by reading code:**
1. The overdue alert's Action Queue card showed the exact same sentence
   twice (`signal` and `reason` were both the raw alert message) — only
   visible once the card was actually rendered and read. Fixed in Phase
   07's `buildAlertCandidates`.
2. Fixing #1 surfaced that a still-`pending` recommendation's wording
   never refreshed after its first sync (an overdue alert's "expected
   back <date>" text would freeze at creation time forever). Fixed the
   sync loop to refresh content for `pending` rows only — `actioned`/
   `dismissed` rows are still never touched, preserving REQ-017. A known,
   deliberately-not-fixed limitation (a resolved signal's recommendation
   doesn't auto-clear) is documented in `DECISIONS.md`, not hidden.

**What we verified, live, in a browser:** the full Control Tower
screenshot (red overdue item, 6 amber anomalies, Live Status counts
matching the real equipment table, Utilization card matching an
independent SQL aggregation, Forecast card showing both real forecasts
and 3 insufficient-history entries simultaneously) — and a **live
mark-actioned interaction**: clicked "Mark investigated" on a real
anomaly, watched it disappear from the queue in the same page state (no
reload), confirming REQ-013's "closes the loop visibly" actually works,
not just compiles.

**Cleanup performed:** the live mark-actioned test changed a real
recommendation's status in the database. Restored it to `pending`
afterward (`UPDATE recommendations SET status='pending', actioned_at=NULL`)
so the full 19-item demo queue Phase 07 built stays intact — verified via
a post-test count (19 pending) and the unchanged 17/22/192 seeded-data
baseline. `npm test` — 26/26 clean after all manual DB pokes.

**Next:** Phase 10 (integration, testing, polish) — the "does the whole
system work as one thing" gate. Individual phases have all been verified
in isolation; the full CHECK OUT → ... → CHECK IN → recommendation → ACT
chain hasn't yet been walked as one deliberate script. Continuing the
authorized Phase 03→11 run without stopping.

---

## 2026-09-01 — Phase 08 implemented and verified: Asset Dashboard UI (first frontend phase)

**Where we are:** Phase 08 `VERIFIED` — the first frontend phase.
`client/src/pages/AssetDashboard.jsx` built: a sortable equipment table
(asset/status/site/return date), a check-out modal with operator/site
pickers, an inline check-in action, and the existing loading/error/empty
state components reused rather than reinvented.

**A real gap found and closed:** the check-out form needs operator/site
pickers, but no read endpoint for `sites`/`operators` existed — Phase 03
never needed one. Added two small, consistent modules
(`server/src/modules/sites/`, `operators/`) rather than working around it
with unusable free-text UUID fields. Documented in `DECISIONS.md`.

**What we verified — genuinely in a browser, not just by reading code:**
started the real dev server (`vite`) against the real backend
(`node src/server.js`), confirmed the `/api` proxy works, then used a
scripted headless-Chrome (Puppeteer) session against the actual running
app to: screenshot the full 17-row table (confirmed `EQX3001` renders red
"Overdue", `EQX3002`-`EQX3005` render blue "Checked out" with real
site/date data), click "Check out" on `EQX1001`, confirm the modal
renders with real operator/site options, submit it, confirm the table
refetches and shows "Checked out," click "Check in," and confirm it
returns to "Available." This is the real check-out/check-in flow working
end-to-end through the UI against the real API and database — not a
mocked test double.

**A real mess made and cleaned up:** the manual click-through checked out
a real seeded asset (`EQX1001`) rather than a disposable fixture (no
fixture concept exists for browser-driven testing), leaving one extra
`returned` checkout row and a spurious `missing_assignment` anomaly (no
operator/site was selected). Found it via a DB count that didn't match
Phase 02's documented baseline (23 checkouts instead of 22), deleted the
extra checkout row and its cascaded alert/anomaly/recommendation rows
directly, then reran the full backend suite (25/25 pass) and reconfirmed
the exact baseline (17/22/192) before moving on. Recorded so a future
agent doing manual UI testing knows to either use a disposable equipment
row or clean up afterward the same way.

**Next:** Phase 09 (Control Tower UI) — the screen the differentiation
strategy hinges on. Continuing the authorized Phase 03→11 run without
stopping.

---

## 2026-09-01 — Phase 07 implemented and verified: recommendations & Action Queue (backend complete)

**Where we are:** Phase 07 `VERIFIED` — the last backend analytics phase.
`server/src/modules/recommendations/` built. **The entire backend is now
functionally complete**: Phases 03-07 cover the full CHECK OUT → ASSIGN &
TRACK → LOG USAGE → CHECK IN → alert/anomaly/forecast → recommendation
chain end-to-end via API. Only the frontend (08/09) and integration/demo
polish (10/11) remain.

**What we built:** `GET /api/recommendations` calls the other three
analytics modules' service functions (a deliberate, documented exception
to "no module imports another" — see `DECISIONS.md`), maps each real
signal through one function per source type into `signal/reason/action/
expected_impact`, inserts a `pending` row for any signal that doesn't
already have one (insert-once — a still-open alert/anomaly must not
resurrect a recommendation the user already actioned/dismissed), and
returns the active queue ranked alert/anomaly-first, forecast-last.
`PATCH /api/recommendations/:id` marks actioned/dismissed, 409s on a
second attempt.

**Two real bugs found and fixed while implementing this phase, not
deferred:**
1. **Forecast id instability** — Phase 06's `forecasts.repository` did
   delete-then-insert on every recompute, so a forecast's `id` changed on
   every poll. Since Phase 07 needs a stable `source_id` to avoid
   duplicate recommendations for the same forecast, fixed the earlier
   phase's repository to upsert in place. Reran Phase 06's own tests
   after the change — unaffected, now folded into the larger green suite.
2. **A real cross-file test-concurrency bug** — `npm test` was flaky
   (~1-in-3 failure) with a raw connection-level error once this phase's
   heavier internal fan-out (one `GET /api/recommendations` triggers 3
   nested syncs, each doing multiple queries) widened the overlap window
   between Node's test-runner's default *concurrent* test-file execution
   and the fact that every file shares one real Postgres database. Fixed
   via `--test-concurrency=1` in `server/package.json`'s `test` script.
   Found and cleaned up 3 stale `TEST-EQX-*` fixture rows left behind by
   the pre-fix flaky runs — confirmed via DB count that this was purely a
   test-isolation artifact, not corruption of the Phase 02 seeded data
   (which remained exactly 17/22/192 throughout).

**What we verified:**
- `npm test` — 23/23 pass, reliably across 3 consecutive full runs
  post-fix (previously flaky). Every recommendation across the real
  19-item queue has all four required fields, every `expected_impact`
  starts with `"Simulated:"` (REQ-016), forecast items rank last,
  re-syncing twice produces an identical set (no duplicates).
- A fixture-based test (not touching seeded data) proves the full
  actioned/dismissed lifecycle: appears while pending → actioned →
  disappears from the active queue → a second status change on the same
  id is rejected (409).
- Post-test DB check: seeded counts unchanged (17/22/192, 0 leftover
  fixtures); `recommendations` table holds exactly 19 rows.
- `npm run build` (client) — clean, unaffected (no frontend work yet).

**Next:** Phase 08 (Asset Dashboard UI) — the first frontend phase,
unblocked since Phase 03 landed. Phase 09 (Control Tower UI) is also now
unblocked. Continuing the authorized Phase 03→11 run without stopping.

---

## 2026-09-01 — Phase 06 implemented and verified: demand forecasting (RISK-003 fully resolved)

**Where we are:** Phase 06 `VERIFIED` — the last of the three
higher-judging-weight analytics phases, and the highest-risk one per
`ANALYSIS.md` §24. `server/src/modules/forecasts/` built.

**What we built:** `GET /api/forecasts` groups checkouts from the last 28
days by `(equipment_type, site)` (excluding checkouts with no site — you
can't forecast demand at an unknown location). A group with ≥3 checkouts
gets a real forecast: `predicted_demand = count/4` (checkouts/week), a
`method` string, and a `factors` string stating the sample count, rate,
and trend (recent 14 days vs. previous 14). A group with 1-2 checkouts
gets `insufficient_history: true` with the real count — never a
fabricated number. Real forecasts are upserted into the `forecasts` table
(one row per group, replaced each recompute, since the table has no
status/lifecycle column the way alerts/anomalies do); insufficient-history
entries are computed live and never persisted.

**Real decision made and documented (task 06.1):** chose a plain
trailing-window average over exponential smoothing — with only 2-5 data
points per group, a tunable alpha adds no real benefit and is harder to
defend under panel questioning. Full reasoning, alternatives, and
tradeoff in `DECISIONS.md`'s "Phase 06: forecast method chosen" entry.

**A real near-bug caught before shipping:** the first sufficiency design
judged history by counting distinct 7-day buckets with activity. Walking
the actual seeded dates by hand found this boundary-fragile at this
sample size — a checkout landing hours on either side of an exact 7-day
cutoff flips which bucket it counts toward, which nearly misclassified
the deliberately-sparse `Grader`/`S001` pair as "sufficient" by accident.
Switched to a raw checkout-count threshold over a fixed 28-day window
instead, which has no such boundary sensitivity — verified by re-running
against the real dates before writing the rigid test assertions.

**A second real bug caught and fixed:** `forecast.period_start`/
`period_end`, read back from Postgres's `DATE` columns via node-pg,
round-tripped as JS `Date` objects at local midnight and serialized a day
off in this environment's timezone. Fixed by returning the already-correct
date-only strings computed before the insert instead of the round-tripped
DB values.

**What we verified:**
- `npm test` — 19/19 pass (17 from Phases 03-05 + 2 new). Real numbers
  match a by-hand SQL analysis of the actual seeded dates done *before*
  implementing the rule: `Excavator`/`S003` (5 checkouts, up, ~1.25/week)
  and `Bulldozer`/`S002` (4 checkouts, flat, ~1/week) get real forecasts;
  `Grader`/`S001`, `Excavator`/`S004`, `Crane`/`S005` correctly fall back
  to `insufficient_history`.
- Post-test DB check: seeded counts unchanged (17/22/192); `forecasts`
  table holds exactly 2 rows (one per qualifying group).
- `npm run build` (client) — clean, unaffected.

**RISK-003 is now fully resolved** (both the anomaly-threshold half from
Phase 05 and this phase's forecasting-method half) — `ISSUES.md` and
`STATE.md` updated to close it out, and `Q-002` closed alongside it.

**Next:** Phase 07 (recommendations & action queue) — the module the
differentiation strategy hinges on; needs 04+05+06, all now real.
Continuing the authorized Phase 03→11 run without stopping for approval.

---

## 2026-09-01 — Phase 05 implemented and verified: anomaly detection

**Where we are:** Phase 05 `VERIFIED`. `server/src/modules/anomalies/`
built with the same sync-on-read pattern as Phase 04. This is one of the
two highest-judging-weight modules (AI & Analytics), so before writing
any code, ran a direct SQL query against the 7 official rows' aggregated
engine/idle hours (see the Phase 05 doc's Rules table) to confirm the
0.40 threshold's predicted split *before* implementing the rule, not
after — avoids fitting a rule to a wrong assumption.

**What we built:**
- `excessive_idle`: `idle_hours / (engine_hours + idle_hours) > 0.40`, aggregated per checkout.
- `zero_runtime`: any logged day with `engine_hours = 0` (covers both a single bad day and the official summary rows where every day is zero).
- `missing_assignment`: reuses `hasMissingAssignment` from Phase 04's shared `checkoutRules.js` — generalized to drop the `status === 'active'` gate, since this anomaly must also catch it on a **returned** historical checkout (`EQX1002`/`EQX1007` are both returned). Phase 04's `missing_info` alert is unaffected since its query only ever looks at active checkouts.
- `unusual_movement` (should-have): a checkout has an assigned site but a logged `usage_logs.location` doesn't contain that site's code. Caught a real bug before it shipped: `usage_logs.location` is free text ("Site S002 yard"), not a bare site code, so a strict-equality comparison would have flagged *every* logged location including the correct one — fixed to a substring check before writing the test, confirmed against the actual seeded values via `psql`.

**What we verified:**
- `npm test` — 17/17 pass. `EQX1002`/`EQX1007` flagged `zero_runtime` +
  `missing_assignment` (and, correctly, `excessive_idle` too, since 0
  engine hours makes idle ratio 100% by definition — a true additional
  signal, not a double-counted bug). `EQX1003`/`EQX1005` flagged nothing.
  `EQX3004` flagged `unusual_movement` with the right reason string.
  `EQX3005` (healthy baseline) flagged nothing.
- Post-test DB check: seeded counts unchanged (17/22/192, 0 test
  fixtures); `anomalies` table holds exactly 17 open rows matching the
  full expected set across all seeded equipment, not just the official 7.
- `npm run build` (client) — clean, unaffected.

**RISK-003 note:** the idle-threshold half of this risk was already
marked resolved after Phase 02's calibration; this phase is the second,
independent confirmation — the threshold now works correctly in the
actual production code path, not just in a one-off calibration query.
`ISSUES.md` updated to reflect that.

**Next:** Phase 06 (demand forecasting) — the highest-risk remaining
phase (must stay honest on small-sample data, per `ANALYSIS.md` §24).
Continuing the authorized Phase 03→11 run without stopping for approval.

---

## 2026-09-01 — Phase 04 implemented and verified: alerts engine

**Where we are:** Phase 04 `VERIFIED`. `server/src/modules/alerts/` built;
`GET /api/alerts` recomputes signals from live `checkouts` data on every
call and syncs them into the `alerts` table (insert newly-detected,
resolve stale). Shared detection logic lives in the new
`server/src/utils/checkoutRules.js` specifically so Phase 05's
`missing_assignment` anomaly can reuse `hasMissingAssignment` instead of
reimplementing it (task 04.4's explicit requirement).

**Real decision made and documented:** chose to persist alerts (sync on
read) rather than pure in-memory computation, because `ARCHITECTURE.md`
already describes recommendations (Phase 07) as *reading from* alerts/
anomalies/forecasts — which only holds together if those are real rows,
not logic Phase 07 would have to re-derive itself. Full reasoning in
`DECISIONS.md`'s "Phase 04: alerts synced on read" entry.

**What we verified:**
- `npm test` — 16/16 pass (14 from Phase 03 + 2 new). The seeded
  `EQX3001`/`EQX3002`/`EQX3003` each produce exactly the alert Phase 02
  documented (overdue/upcoming_return/missing_info, one of each, verified
  both via the API and a direct SQL count).
- A fixture test proves the *resolve* path actually fires, not just the
  insert path: checked out with a past `expected_return_at` → alert
  appears → checked in → alert disappears on the next `GET`.
- Post-test DB check: seeded counts unchanged (17/22/192), zero leftover
  test fixtures or their alerts (cleanup order updated in
  `tests/helpers/fixtures.js` to clear `recommendations`/`anomalies`/
  `alerts` before `equipment`, since all three have the same
  `ON DELETE RESTRICT` FK Phase 03's fixtures already had to respect for
  `checkouts`/`usage_logs`).
- `npm run build` (client) — clean, unaffected.

**Not verified:** anything beyond the 3 required alert types at the
current data scale — no load test, no test of what happens if `alerts`
grows large (not a concern at 17-equipment/22-checkout scale, noted as a
real limitation in `DECISIONS.md`'s tradeoff line).

**Next:** Phase 05 (anomaly detection) — unblocked, next up. Continuing
the authorized Phase 03→11 run without stopping for approval.

---

## 2026-09-01 — Phase 03 implemented and verified: core backend APIs

**Where we are:** Phase 03 `VERIFIED`. `server/src/modules/equipment/`,
`checkouts/`, `usage-logs/` built following the existing
routes→controller→service→repository layering, mounted in
`routes/index.js`. This is the first phase executed under the
autonomous Phase 03→11 authorization (see the planning-checkpoint entry
below for what preceded it).

**What we built:**
- `GET /api/equipment`, `GET /api/equipment/:id` — `status` is computed
  at read time (available/checked_out/overdue/maintenance) from the
  active checkout's `expected_return_at`, never stored redundantly.
- `POST /api/checkouts`, `PATCH /api/checkouts/:id/check-in`, `GET
  /api/checkouts[?status=]` — checkout/check-in each run inside a new
  `withTransaction()` helper (added to `server/src/config/db.js`) so the
  `checkouts` row and `equipment.status` update atomically.
- `POST /api/usage-logs`, `GET /api/usage-logs/checkout/:checkoutId`.
- `server/src/middleware/validateUuidParam.js` (new) — malformed `:id`
  params now 400 cleanly instead of a Postgres `22P02` surfacing as a 500.

**What we verified:**
- `npm test` — 14/14 pass, including duplicate-checkout rejection (409),
  double-check-in rejection (409), orphan usage-log rejection (409/404),
  and the seeded `EQX3001` (overdue) / `EQX3003` (missing assignment on an
  *active* checkout) both computing the right live status via the real API.
- Manual verification against a running `node src/server.js`: health
  check, equipment list, a live duplicate-checkout attempt against the
  real seeded `EQX3001`, and a deliberately invalid usage-log payload —
  all returned clean JSON errors, not stack traces or generic 500s.
- **Confirmed the seeded data is untouched:** test fixtures are created
  with a `TEST-EQX-` prefix and deleted in a `finally` block; post-test
  query shows 0 leftover fixtures and the exact Phase 02 counts (17
  equipment / 22 checkouts / 192 usage_logs) unchanged.
- `npm run build` (client) — clean, unaffected (no frontend work this phase).

**Real decision made and documented:** the duplicate-checkout guard has
two layers — an app-level pre-check for a fast, friendly 409, and a
catch on Postgres's `23505` (unique-violation) from the existing partial
unique index `idx_checkouts_one_active_per_equipment`, mapped to the same
409 — so the actual guarantee is DB-enforced, not just application logic.
This is called out in `TEAM-EXECUTION-PLAN.md` as Astik's "decision to
defend."

**Not verified:** concurrent-request load testing (two simultaneous
check-out requests racing) — the DB-level unique index should prevent a
double-active-checkout under a real race, but this wasn't exercised with
actual concurrent requests, only reasoned about from the constraint's
existence. If this matters before the demo, a follow-up test firing two
`POST /api/checkouts` concurrently at the same equipment would close the
gap.

**Next:** Phase 04 (alerts engine) — unblocked, next up per `STATE.md`.
Continuing the authorized Phase 03→11 run without stopping for approval.

---

## 2026-09-01 — Planning checkpoint: TEAM-EXECUTION-PLAN.md + architecture PDF, before Phase 03-11 autonomous execution

**Where we are:** Phases 00-02 `VERIFIED` (unchanged this session). Before
starting the authorized Phase 03→11 autonomous run, produced the planning
artifact the team asked for: `.ai/TEAM-EXECUTION-PLAN.md` (source of
truth) and `.ai/CITADEL-ARCHITECTURE-TEAM-PLAN.pdf` (13-page print copy,
generated via headless Chrome from a standalone HTML file — no new
dependency added to the app itself).

**What it contains:** the existing architecture restated with concrete
diagrams (system architecture, data flow, asset lifecycle, ERD, analytics
pipeline, frontend IA, phase/dependency map), an API-contract table for
Phases 03/04/05/06/07 so 08/09 can be built against an agreed shape before
their real dependency lands, an expansion of `PLAYBOOK.md`'s existing
4-person team table into per-phase task ownership + file ownership (for
merge-conflict avoidance) + one cross-training task per person + a
4-section presentation division + a panel-defense cheat sheet skeleton.

**What did NOT change:** no new architecture, no new tech choice, no
change to the Phase 01 schema or Phase 02 seed data. `PLAYBOOK.md`'s team
table and `ROADMAP.md`'s dependency graph were extended, not replaced —
both are referenced from the new file rather than duplicated.

**Not verified (by nature — this is a planning doc, not code):** the file
ownership / parallel-work claims are correct on paper (no two owners touch
the same module folder) but untested by actual simultaneous multi-person
work, since only Ayush's GitHub invite has been accepted so far
(`RISK-002` — Astik/Souharda still pending). Treat the team assignments as
the plan for when they join, not evidence they've been followed.

**Next:** proceeding directly into Phase 03 (core backend APIs) per the
already-authorized autonomous Phase 03→11 execution — see `STATE.md`.

---

## 2026-09-01 — Phase 02 implemented and verified: synthetic operational data

**Where we are:** Phase 02 `VERIFIED`. Database now has real, believable
data to compute against: 17 equipment, 22 checkouts, 192 usage_logs.
Phase 03 (core APIs) is next — was not started this session
(out of scope by instruction: "do NOT start another phase after Phase 02").

**What we just did:** Rewrote `server/db/seed.js` (replacing Phase 01's
placeholder stub) to generate three layers, fully deterministically (no
`Math.random()` anywhere):
1. The exact official 7-row Caterpillar sample as historical completed
   checkouts, with daily `usage_logs` reconstructing each row's stated
   per-day averages exactly.
2. Trailing weekly history on 5 additional equipment, deliberately rich
   for `Excavator`/`S003` and `Bulldozer`/`S002`, deliberately sparse for
   `Grader`/`S001` (for Phase 06's insufficient-history fallback).
3. 5 live active checkouts, each cleanly isolated to demonstrate exactly
   one signal: overdue, upcoming-return, missing-assignment (on an active
   checkout, not just historically), unusual-movement, and a healthy
   baseline.

**A real data-quality finding, documented not silently fixed:** six of
the seven official rows' stated `Operating Days` matches their calendar
date span exactly; `EQX1003` is off by one (matches inclusive counting
instead of exclusive). Rather than "fixing" this, treated `Operating
Days` as authoritative for the generated row count and left both the
dates and the day count exactly as printed — see `DECISIONS.md`.

**RISK-003 calibration (explicitly requested):** computed idle_ratio
across all 17 seeded historical checkout-rows. The 0.40 threshold from
`RESEARCH.md` R-002 cleanly separates 10 flagged rows from 7 clearly
healthy ones with no boundary-ambiguous cases — confirmed sound, not
changed. Full evidence in `DECISIONS.md`'s "RISK-003 calibration result"
entry; `ISSUES.md`'s `RISK-003` row updated to `IN_PROGRESS` (threshold
half resolved, forecasting-method half still open pending Phase 06).

**What was verified:** exact reproduction of all 7 official rows (site
code, operator code, dates, daily averages, log-day count) via direct
psql query comparison against the handout; idempotency (second `npm run
seed` no-ops); all 5 active-checkout demo cases individually confirmed
correct and signal-isolated (no confounding idle-anomaly noise on the
overdue/upcoming/missing/movement examples); trailing-history depth
confirmed rich (5, 4) vs. sparse (2) exactly as designed; server tests
(2/2) and client build both still pass.

**What was not verified:** nothing scoped to this phase was skipped.
Actual anomaly/alert/forecast computation logic doesn't exist yet
(Phases 04-06) — this phase only had to prove the *data* supports it,
which it does.

**Current phase / task:** Phase 02 `VERIFIED`. Phase 03 (core APIs) is
`PLANNED` and unblocked — next up, not started.

**Known bugs:** none. **Known risks:** `RISK-001`, `RISK-002` unchanged;
`RISK-003` now `IN_PROGRESS` (half resolved, see above).

**Important decisions:** `DECISIONS.md`'s two 2026-09-01 Phase 02 entries
(RISK-003 calibration result; Operating Days authoritative).

**Files affected this session:** `server/db/seed.js` (full rewrite).
`.ai/phases/PHASE-02-synthetic-data.md`, `STATE.md`, `ROADMAP.md`,
`REQUIREMENTS.md`, `DECISIONS.md`, `ISSUES.md` updated to match. No
migrations, no server/client application code touched (schema unchanged
from Phase 01; Phase 03 untouched).

**Blockers:** none.

**Next action:** start Phase 03 (`phases/PHASE-03-core-apis.md`) — the
`equipment`/`checkouts`/`usage-logs` API modules. Once it lands, Phases
04-06 (alerts/anomalies/forecasting) can build directly against the
seeded data this session produced.

**Commands to run to pick this up:**
```bash
git log --oneline -10 && git status
cd server && npm install && npm run migrate && npm test
cd ../client && npm install && npm run build
# confirm the seeded data is still there:
PGPASSWORD='<see server/.env>' psql -U ayush -h localhost -p 5432 -d citadel -c "SELECT COUNT(*) FROM equipment;"
```
Then open `phases/PHASE-03-core-apis.md` and start on its tasks.

**What not to touch without reason:** the seeded data's deliberate edge
cases (`EQX3001`–`EQX3005`, the `Grader`/`S001` sparse pair) — later
phases' tests and the eventual demo depend on these existing exactly as
seeded. Don't re-run `npm run seed` after manually clearing tables and
expect identical IDs (the generator is deterministic in *values*, not in
the UUIDs Postgres assigns) — if you need to reset, re-run the full
migration + seed together, don't partially reset. `server/.env`.

---

## 2026-09-01 — Phase 01 implemented and verified: data model & migrations

**Where we are:** Phase 01 `VERIFIED`. First real product code exists —
8 tables, migrated, inspected, and insert-tested. Phases 02 and 03 are
now unblocked and can run in parallel.

**What we just did:** Wrote and ran migrations `002`–`006` (sites,
operators, equipment, checkouts, usage_logs, alerts, anomalies,
forecasts, recommendations) per `phases/PHASE-01-data-model.md`. Executed
task 01.7's decision (delete `items`) via migration `007` plus removing
`server/src/modules/items/`, `client/src/pages/Items.jsx`,
`client/src/api/items.js`, and their route/nav references — `items` was
always a disposable reference pattern (`ARCHITECTURE.md`) and the real
tables now serve as the live example instead.

**Two schema deviations from the phase doc, both documented in
`DECISIONS.md`, not silent:**
1. `checkouts.site_id` and `checkouts.expected_return_at` had to be
   nullable — the phase doc's table hadn't marked them so, but the
   official sample's `EQX1002`/`EQX1007` rows have `NULL` Site ID, and a
   NOT NULL constraint would make the official data un-storable. This
   wasn't actually new information — Phase 05's anomaly rule table
   already assumed `site_id` could be null; the Phase 01 table just
   hadn't caught up to its own downstream phase.
2. Added a `code` column to `sites` and `operators` (unique, e.g. `S003`,
   `OP101`) mirroring the `equipment_code` pattern already specified for
   `equipment` — needed to store the official sample's actual identifiers
   instead of inventing names for them.

**What was verified (see `phases/PHASE-01-data-model.md`'s "Tests"
section for the full list):** migration applied cleanly and is idempotent
on rerun; every table's structure inspected via `\d` and matches the
design; a transactional insert (rolled back afterward — Phase 02 owns
real seeding) proved the exact official 7-row dataset fits the schema,
including `EQX1002`/`EQX1007`'s `NULL` site/operator/`0` engine-hours
pattern; the partial unique index correctly rejected a second `active`
checkout on the same equipment (REQ-018, enforced at the DB level, not
just relying on future application code); server tests (2/2) and client
build both still pass after the `items` removal; live server boot
confirmed `/api/health` still reports `database: connected` against the
new schema.

**What was not verified:** nothing scoped to this phase was skipped. Real
seed data (Phase 02) and the anomaly/forecast threshold calibration
(`RISK-003`) are explicitly out of this phase's scope, not gaps in it.

**Current phase / task:** Phase 01 `VERIFIED`. Phase 02 (synthetic data)
and Phase 03 (core APIs) are both `PLANNED` and unblocked — see
`ROADMAP.md`.

**Known bugs:** none. **Known risks:** unchanged (`RISK-001`, `RISK-002`,
`RISK-003` — see `ISSUES.md`).

**Important decisions:** `DECISIONS.md`'s 2026-09-01 "Phase 01: delete
the `items` reference module; two schema deviations" entry.

**Files affected this session:** `server/db/migrations/002`–`007_*.sql`;
removed `server/src/modules/items/`, `client/src/pages/Items.jsx`,
`client/src/api/items.js`; updated `server/src/routes/index.js`,
`server/db/seed.js` (stubbed pending Phase 02), `client/src/App.jsx`,
`client/src/components/Layout.jsx`, `client/src/pages/Home.jsx`;
`.ai/phases/PHASE-01-data-model.md`, `STATE.md`, `ROADMAP.md`,
`REQUIREMENTS.md`, `DECISIONS.md` updated to match.

**Blockers:** none.

**Next action:** start Phase 02 and Phase 03 in parallel (see
`PLAYBOOK.md`'s team table for the suggested split). Do not start
Phases 04-07 (alerts/anomalies/forecasting/recommendations) before
Phase 02 has real data seeded.

**Commands to run to pick this up:**
```bash
git log --oneline -10 && git status
cd server && npm install && npm run migrate && npm test
cd ../client && npm install && npm run build
```
Then open `phases/PHASE-02-synthetic-data.md` and/or
`phases/PHASE-03-core-apis.md` and start on their tasks.

**What not to touch without reason:** `checkouts.site_id`/`operator_id`'s
nullability (see above — it's load-bearing for the official anomaly
example, not an oversight to "fix"); the partial unique index enforcing
one active checkout per equipment; `server/.env`.

---

## 2026-09-01 — Problem-statement planning: Smart Rental Tracking System

**Where we are:** Problem statement received and fully analyzed. Complete
11-phase build plan exists (`ROADMAP.md`, `phases/PHASE-01`–`PHASE-11`).
**Nothing coded yet** — this session was planning only, per the explicit
"do not skip to coding" instruction. Phase 01 (data model) is `PLANNED`
and ready for someone to actually start.

**What we just did:**
- Ran Problem-Statement Mode end to end: filled `problem-statement/ANALYSIS.md`,
  populated `REQUIREMENTS.md` with 20 real requirements (REQ-001–020),
  logged 2 research findings in `RESEARCH.md` (forecasting method,
  industry idle/utilization thresholds — both with real cited sources),
  added a tech-stack decision gate and an analytics-approach decision to
  `DECISIONS.md`, wrote `DESIGN.md` (the UX/IA spec for the Control Tower
  and Asset Dashboard screens), and extended `ARCHITECTURE.md` with the
  domain module list and analytics-layer convention.
- Created all 11 phase files with concrete tasks, acceptance criteria, and
  exit criteria — see `ROADMAP.md`'s dependency graph for build order and
  parallelization.
- Filled `PLAYBOOK.md`'s team responsibility table with a suggested
  split, reasoned from the judging weights (analytics gets 2 people).

**Important discovery — two problem-statement sources didn't match:** a
photo of the actual one-page Caterpillar handout (`PROBLEM-STATEMENT.md`
Source A) surfaced *after* this session had already been analyzing a more
elaborate text version (Source B: "Control Tower," judging weights,
recommendation-engine shape, demo narrative) that the user had pasted in
as "official problem context." None of Source B appears on the literal
handout. **Asked the user directly** rather than guessing which to trust
— confirmed (2026-09-01) that Source B is real content from the live
event presentation/briefing, not an AI/interpretive elaboration. Both
sources are now preserved verbatim in `PROBLEM-STATEMENT.md`, clearly
labeled, and don't actually conflict — Source B adds structure on top of
Source A's same six capabilities. **If a future agent finds any other
discrepancy between what's in this repo's analysis and what the team
actually saw/heard at the event, ask before assuming — don't silently
pick one.**

**A concrete, valuable finding from Source A's sample data:** two of the
seven official example rows (`EQX1002`, `EQX1007`) have `Site ID = NULL`,
`Last Operator ID = NULL`, and `0` Engine Hours/Day together — almost
certainly Caterpillar's own worked example of the "unassigned equipment"
/ "zero runtime" anomaly. Phase 02's synthetic data reproduces these 7
rows exactly (with daily `usage_logs` generated to match the handout's
per-day averages), and Phase 05's anomaly rules are written to catch this
exact pattern — see `DECISIONS.md`'s reconciliation entry.

**What was verified:** nothing new technically (no code changed this
session) — Phase 00's baseline (tests, build, migrations) was not
re-run since no application code was touched. Verify it fresh before
starting Phase 01, per `AGENTS.md`'s boot sequence.

**What was not verified:** the anomaly thresholds and forecasting method
are designed from research and the official sample, not from actually
running numbers against seeded data yet — this is explicit in `ISSUES.md`
(`RISK-003`) and built into Phases 05/06 as calibration tasks (05.1, 06.1),
not assumed settled.

**Current phase / task:** Phase 00 `VERIFIED` (unchanged). Phase 01
(`phases/PHASE-01-data-model.md`) is `PLANNED` — this is the next actual
work. Do not re-run Problem-Statement Mode; that's done.

**Known bugs:** none. **Known risks:** `RISK-001` (Docker untested),
`RISK-002` (2 pending invites — check before day one), `RISK-003`
(uncalibrated thresholds, see above).

**Important decisions:** `DECISIONS.md`'s three 2026-09-01 entries (tech
stack reconfirmed, rule-based analytics over ML, sample-data reconciliation).

**Files affected this session:** `PROBLEM-STATEMENT.md` (rewritten with
both sources), everything new under `.ai/problem-statement/`,
`.ai/phases/PHASE-01` through `PHASE-11`, `REQUIREMENTS.md`, `RESEARCH.md`,
`DECISIONS.md`, `DESIGN.md` (new), `ARCHITECTURE.md`, `ROADMAP.md`,
`PLAYBOOK.md`, `STATE.md`, `ISSUES.md`. No application code.

**Blockers:** none. Ready to implement.

**Next action:** start Phase 01 (`phases/PHASE-01-data-model.md`) — write
the migrations, run them, verify schema, then hand off to whoever's doing
Phase 02/03 per `PLAYBOOK.md`'s team table.

**Commands to run to pick this up:**
```bash
git log --oneline -10 && git status
cd server && npm install && npm run migrate && npm test
cd ../client && npm install && npm run build
```
Then open `phases/PHASE-01-data-model.md` and start on its tasks.

**What not to touch without reason:** the two-sources structure of
`PROBLEM-STATEMENT.md` — don't collapse it back into one version; the
distinction matters if another discrepancy surfaces later. The rule-based
(not ML) analytics decision — don't introduce a trained model without a
new `DECISIONS.md` entry justifying it against the alternative already
rejected there.

---

## 2026-08-30 — Foundation session 2: AI-agent operating system

**Where we are:** Phase 00 (foundation) complete and verified. Repository
now has a full `.ai/` operating system so any future agent — any machine,
any AI tool, zero chat history — can pick this up correctly.

**What we just did:**
- Verified GitHub username `Ayush-01` (digit zero) is an unrelated
  account; corrected to `Ayush-o1` (letter o) everywhere — see
  `DECISIONS.md`.
- Confirmed `eklavaya008` accepted their collaborator invite;
  `Astik01` and `Souharda6996` still pending from the prior session.
- Migrated `docs/` into `.ai/` as the single canonical location for
  process/state docs (no duplication between two doc trees).
- Built the full `.ai/` structure: `AGENTS.md`, `OVERVIEW.md`, `STATE.md`,
  this `HANDOFF.md`, `ROADMAP.md`, `phases/` (template + Phase 00 record),
  `REQUIREMENTS.md`, `RESEARCH.md`, `ISSUES.md`, `QUALITY.md`, and
  extended `GIT-WORKFLOW.md` / `PLAYBOOK.md`.
- Added GitHub labels for MoSCoW prioritization and issue typing (see
  `PLAYBOOK.md` → "GitHub as project management").
- Ran a cross-agent handoff simulation (fresh clone, following only
  `AGENTS.md`'s boot sequence with no chat context) per Phase 00's
  acceptance criteria — passed.

**What was verified:** backend boots and connects to the `citadel`
Postgres DB; migration + seed re-run cleanly (idempotent); `npm test`
passes (2/2); client builds and dev-boots; fresh-clone `./scripts/setup.sh`
still works; no secrets in tracked files (`git grep` clean); a simulated
"Agent B" reading only the repo (no chat access) could correctly state the
project's purpose, current phase, and next action.

**What was not verified:** Docker Compose end-to-end (`docker compose up`)
— the Docker daemon was not running on this machine during this session.
Tracked as `RISK-001` in `ISSUES.md`. Whoever has Docker running next
should run it once and flip that risk to resolved or file a real bug.

**Current phase / task:** Phase 00 `VERIFIED`. No active task — waiting on
the Caterpillar problem statement (expected 2026-09-01).

**Known bugs:** none open.

**Known risks:** see `ISSUES.md` (`RISK-001` Docker untested, `RISK-002`
two teammates haven't accepted GitHub access yet).

**Important decisions:** see `DECISIONS.md`, entries dated 2026-08-30.

**Files affected this session:** everything under `.ai/`; `docs/` removed
(content moved, not deleted); `README.md` updated to point at
`.ai/AGENTS.md`; no application code changed.

**Blockers:** none for foundation work. Product work is blocked on the
problem statement by design (see `OVERVIEW.md`).

**Next action:** when `PROBLEM-STATEMENT.md` is filled in, the next agent
runs Problem-Statement Mode in `PLAYBOOK.md` — do not start coding before
that analysis is done and phases exist in `ROADMAP.md`.

**Commands to run to pick this up:**
```bash
git log --oneline -10 && git status
cd server && npm install && npm run migrate && npm test
cd ../client && npm install && npm run build
```

**What not to touch without reason:** `server/.env` (real local DB
credentials, machine-specific); the `items` reference module (delete
deliberately, not accidentally, once real features exist); the stack
choice itself (React/Express/Postgres, no ORM) — revisit only via a new
`DECISIONS.md` entry, not silently.

---

## 2026-08-30 — Foundation session 1: initial scaffold

**Where we are:** Empty repository → working full-stack starter.

**What we just did:** Invited the three teammates (verified usernames via
GitHub API before inviting); built React (Vite) client + Express server +
PostgreSQL backend with a layered structure (routes → controller → service
→ repository); added a reference `items` CRUD module end-to-end; wrote
migrations, a seed script, and one health-check test suite; wrote
`docker-compose.yml`; wrote initial `README.md` and `docs/*` (later moved
into `.ai/`, see the entry above).

**What was verified:** created a dedicated `citadel` Postgres database;
ran migrations and seed against it; full CRUD cycle tested live via curl
(create, list, validate-reject, delete, 404-after-delete); client dev
server's `/api` proxy confirmed working against the live backend;
`npm audit` came back clean after bumping Vite 5→8 and React Router 6→7 to
clear two real CVEs (re-verified build + dev boot after the bump); fresh
clone + `./scripts/setup.sh` tested end-to-end in `/tmp`.

**What was not verified:** Docker Compose (daemon not running).

**Important decisions:** React/Express/Postgres with no ORM; no
auth/AI/dashboards by default. See `DECISIONS.md`.

**Next action at the time:** build the AI-agent operating system — done in
the session above.
