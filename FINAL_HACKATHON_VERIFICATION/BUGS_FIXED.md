# Bugs found and fixed during this local verification pass

Local-only session, 2026-09-02. Nothing here was committed or pushed — see
`README.md`. Both real code changes made this session are already reverted;
what's listed below is what was found, root-caused, fixed, re-tested, and
then reverted (since the fix was to *data*, not code, in one case) or
reverted-because-temporary (in the other).

---

## 1. Seeded "upcoming return" demo case had drifted into "overdue" (data, not code)

**Found via:** `npm test` — 1 failure out of 32:
`alerts.test.js`: "EQX3002 (Phase 02: upcoming_return) should produce an
upcoming_return alert."

**Root cause:** `server/db/seed.js`'s `ACTIVE_CHECKOUTS` table seeds
`EQX3002` with `expectedReturnHoursFromNow: 18` — computed relative to
*seed-run time*, not a fixed date. The local DB had last been seeded ~18
hours before this test run, so by the time this pass started, real wall-clock
time (`now()`) had passed `expected_return_at` by a few minutes — the
checkout was now legitimately overdue, not "upcoming." Confirmed directly:

```
expected_return_at = 2026-09-02 10:49:16+05:30
now()               = 2026-09-02 10:52:29+05:30   -- 3 min past deadline
```

This is the same underlying pattern as the already-documented `ISSUES.md`
`BUG-001` (seed timestamps are relative-to-seed-time, and therefore "expire"
as real time passes) — not a new class of bug, but a fresh live instance of
it, and worth re-confirming it's still a real, recurring characteristic of
this seeding approach, not a one-off.

**Fix:** Cleared and re-ran `npm run seed` against the local DB (FK-safe
delete of `forecasts → recommendations → anomalies → alerts → usage_logs →
checkouts → equipment → sites → operators`, confirmed empty, then
`npm run seed`). Did **not** touch the `users` table or production/Neon.

**Verified:** `npm test` → **32/32 passing** (was 31/32). Confirmed
`EQX3002`'s `expected_return_at` is now correctly ~18h in the future again.

**Not fixed (deliberately, out of scope for this pass):** the seeding
approach itself. A permanent fix would mean either (a) seeding fixed
absolute dates instead of relative offsets, or (b) re-seeding automatically
on a schedule. Both are real product-hardening work, not appropriate to
change this close to presenting without team discussion — flagged instead
in `REMAINING_ISSUES.md`.

**Action for you:** re-run `npm run seed` (after clearing tables, per above)
shortly before the actual demo/judging — the same drift will recur again as
more real time passes, exactly like `BUG-001` already warned.

---

## 2. Test-only Google-OAuth bypass route — added, used, then fully removed

Not a bug — a necessary, disclosed testing workaround, listed here for
transparency since it *did* touch tracked source for part of this session.

**What:** Real Google sign-in cannot be scripted (Google blocks automated
OAuth, and no test credentials exist in this environment). To test the
actual signed-in Customer/Dealer/Admin UI/API/DB behavior with a real
browser instead of settling for code review, a temporary route
(`POST /api/auth/_test-login`, gated on `NODE_ENV !== 'production'`) was
added to `server/src/modules/auth/auth.routes.js`. It signed a real session
cookie, using the app's own `signSession()`, for one of 4 verification-only
user rows inserted directly into the local `users` table
(`verify-customer@citadel.test`, `verify-dealer@citadel.test`,
`verify-admin@citadel.test`, `verify-newuser@citadel.test`).

**Confirmed removed:** `git diff -- server/src/modules/auth/auth.routes.js`
is empty — the file is byte-identical to the committed version again. The
4 verification users were deleted from the local `users` table (confirmed:
`SELECT count(*) FROM users` → 2, both real accounts, exactly as before this
session started).

---

## 3. Test-data cleanup after live interaction testing

Also not an app bug — records of what this session's own live testing left
behind and how it was cleaned up, so the local DB is back to a genuine demo
baseline and nothing looks like unexplained drift to a future session:

- **EQX1001** was rented and returned (Customer flow), then checked out and
  checked back in again (Dealer flow) during testing — both real, correct
  round trips. Left `EQX1001` in `available` status afterward (confirmed).
- **A test usage log** (`location: "Site verification test"`) was written to
  a real active checkout during the Usage Logging test. This correctly
  triggered a genuine `unusual_movement` anomaly (proving the anomaly engine
  works) but would have shown as confusing clutter in the Action Queue —
  deleted the one test row; anomaly self-resolved on the next sync (no
  manual DB touch needed for the anomaly row itself).
- **Two recommendations** (`EQX3001: overdue`, `EQX1007: zero runtime`) were
  marked actioned/dismissed to prove the ACT interaction works end-to-end
  (real `PATCH /api/recommendations/:id` → `200`, item left the pending
  queue — screenshotted as evidence). Reset both back to `pending` afterward
  so the demo's top-priority banner (`EQX3001: overdue`) reads exactly as it
  did before this session.

**Net result:** local DB now has the documented 21 equipment / 257
usage_logs baseline, 28 checkouts (26 seeded + 2 genuine extra completed
round trips from this session's own live testing, both closed out cleanly —
not corruption), 6 active checkouts (the intended `EQX3001`-`EQX3006` demo
set), 19 anomalies with **zero duplicates**, and the same top-priority
recommendation as before testing began.

---

## Not found: no other functional bugs surfaced during this pass

Every other live interaction (checkout, check-in, usage logging, action-queue
actions, role selection/switching, mobile rendering, error states) worked
exactly as designed on the first try, with zero unexplained console errors,
zero unexpected 4xx/5xx responses, and zero UI/data mismatches against direct
Postgres inspection. See `TEST_RESULTS.md` and `USER_JOURNEY_TESTS.md` for
the full run log.
