# Git workflow

Simple enough to run under hackathon time pressure. Four people, two days —
the goal is avoiding lost work and merge conflicts, not process purity.

## Branches

- `main` is always demo-able. Nobody pushes to it directly.
- One branch per task: `feature/<short-name>`, `fix/<short-name>`.
  Examples: `feature/items-api`, `fix/health-check-timeout`.
- Keep branches short-lived — merge within a few hours, not days. Long-lived
  branches are what cause painful conflicts during a hackathon.

## Commits

- Small, working commits over one giant commit at the end.
- Message style: `<area>: <what changed>` — e.g. `server: add items repository`,
  `client: add loading state to Items page`.
- Don't commit `.env`, `node_modules/`, or generated files (already in
  `.gitignore` — check `git status` before committing if unsure).

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
