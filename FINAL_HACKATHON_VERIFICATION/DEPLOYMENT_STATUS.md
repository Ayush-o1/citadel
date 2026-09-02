# Deployment status

This session tested **local only**, per your explicit instruction (no push,
no commit, nothing touching remote/production). This file summarizes what
was verified live in production the night before (from `.ai/ISSUES.md`/
`.ai/HANDOFF.md`, not re-verified today) and how today's local findings
relate to it.

## Live URLs (from prior session, not re-checked today)

- **Frontend:** `https://citadel-silk.vercel.app` (Vercel)
- **Backend:** `https://citadel-96hb.onrender.com` (Render, deployed via
  `server/Dockerfile`, not the `render.yaml` Blueprint)
- **Database:** Neon Postgres

## What was confirmed live in production last night (per `ISSUES.md`, not redone today)

- Real Google sign-in across multiple real devices/browsers (Android, Mac,
  Windows, Linux; Chrome/Safari).
- The race-condition fix (migration `011`) — zero duplicate anomaly/alert/
  recommendation rows confirmed against the live Neon database.
- `/switch-role` reachable (`200`).

## What today's local findings mean for production

- **The seed-drift bug found and fixed locally today
  (`BUGS_FIXED.md` #1) is a property of `server/db/seed.js`, not of local
  Postgres specifically** — if the production Neon database hasn't been
  reseeded recently, the same `EQX3002`-style drift (an "upcoming return"
  card silently becoming "overdue") is plausible there too. This was **not
  checked against production today** (out of scope for this local-only
  pass) — worth a quick live check before presenting if you're demoing
  against the deployed URL rather than local.
- **RISK-005** (narrow server-side authorization) applies equally to
  production — the live Render API accepts the same unauthenticated writes
  the local one does.
- Everything else verified today (full lifecycle, anomaly/forecast/
  recommendation correctness, role persistence, mobile rendering) is
  architecturally identical between local and production — same code, same
  migrations, same seed script — so today's PASS results are strong
  evidence for production behavior too, just not a substitute for actually
  loading the live URL once before you present.

## Recommended action before presenting

If presenting from the deployed URL: load it once yourself, confirm
`EQX1007`/`EQX3001` still show the expected cards, and reseed the Neon
database if the demo cards have drifted (same `npm run seed` approach,
pointed at `DATABASE_URL` for Neon instead of local — see `.ai/DEPLOYMENT.md`
for the exact production env var setup).

If presenting from local: this session already left your local database in
the correct demo-ready state (see `TEST_RESULTS.md`) — just don't run
`npm test` again right before presenting without reseeding afterward, since
the test suite itself doesn't mutate demo data permanently but a few hours
of real wall-clock time passing will reproduce the same drift again.
