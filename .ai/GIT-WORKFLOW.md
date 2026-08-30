# Git workflow

Simple enough to run under hackathon time pressure. Four people, two days —
the goal is avoiding lost work and merge conflicts, not process purity.

## Branches

- `main` is always demo-able and runnable. Nobody pushes to it directly —
  no casual pushes of unfinished/experimental work.
- One branch per task or phase: `feature/<short-name>`, `fix/<short-name>`,
  or `phase/<phase-name>` for work spanning a whole phase.
  Examples: `feature/items-api`, `fix/health-check-timeout`, `phase/03-frontend-mvp`.
- Keep branches short-lived — merge within a few hours, not days. Long-lived
  branches are what cause painful conflicts during a hackathon.

## Commits

- Small, meaningful commits during active work — don't wait until a whole
  phase is done to commit once.
- Message style: `<type>(<scope>): <what changed>`, where `<type>` is
  `feat` / `fix` / `chore` / `docs` / `test` / `refactor`, and `<scope>` is
  the phase or area. Examples: `feat(phase-03): implement API foundation`,
  `fix(phase-04): resolve validation regression`, `chore(phase-05): update project state`.
- Don't commit `.env`, `node_modules/`, or generated files (already in
  `.gitignore` — check `git status` before committing if unsure).
- Inspect `git diff` before committing and `git status` after — catches
  both secrets and accidental unrelated changes.

## Pull requests

- Open a PR as soon as the branch is pushed, even if marked draft — keeps
  the team aware of what's in flight.
- One teammate reviews before merge. With four people, reviewing each
  other's PRs also doubles as staying in sync on the codebase.
- Prefer "squash and merge" to keep `main`'s history readable.
- Delete the branch after merge.

## Keeping your branch updated

```bash
git fetch origin
git rebase origin/main
```

If a rebase gets messy under time pressure, `git merge origin/main` instead
— a slightly messier history beats losing an hour to a rebase during the
hackathon.

## Conflict handling

- Talk before you resolve — a 30-second Slack/Discord message ("I changed
  `items.routes.js`, pulling now") prevents most conflicts before they
  happen.
- If a conflict does happen, whoever has more context on *both* sides
  resolves it, not whoever hit the conflict first.
- Never resolve a conflict by blindly picking "ours" or "theirs" without
  reading both sides.

## Who reviews what

With four people, don't formalize this beyond: whoever isn't the author and
has touched that area of the code recently reviews. If nobody fits, anyone
reviews — a fast review beats a perfectly-matched one.

## Checkpoints

A checkpoint is a commit (or a merge to `main`) that's actually been
verified — see `QUALITY.md`'s verification loop. Every phase that reaches
`VERIFIED` in its `phases/<phase>.md` file gets a git tag:
`checkpoint/phase-<id>-<short-name>` (e.g. `checkpoint/phase-03-frontend-mvp`).
This gives everyone — human or agent — a known-good point to diff against
or roll back to, without relying on memory of "which commit was the last
one that worked."

```bash
git tag checkpoint/phase-03-frontend-mvp
git push origin checkpoint/phase-03-frontend-mvp
```

Before tagging: `STATE.md` and the phase file must already be updated to
match. A checkpoint that doesn't match `STATE.md` defeats the point.

## Hard rules (non-negotiable, human or AI agent)

- **Never force-push** `main`. If you genuinely believe you need to, stop
  and ask a human first — don't decide alone.
- **Never overwrite another person's or agent's uncommitted work.** Run
  `git status` before any command that could discard changes
  (`checkout`/`restore`/`reset --hard`/`clean`).
- **Never commit secrets.** Real credentials live only in gitignored
  `.env` files.
- If something breaks on `main`, the fix is: find the last verified
  checkpoint tag, inspect what changed since, then fix forward or revert —
  don't just keep pushing new attempts on top of a known-broken state.
