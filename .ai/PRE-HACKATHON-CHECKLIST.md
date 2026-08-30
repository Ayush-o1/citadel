# Pre-hackathon checklist — Sept 1, 2026

Do this, in order, before writing any product code. Each person runs the
setup steps on their own machine; the team does the protocol steps
together.

## 1. Clone / pull

```bash
git clone https://github.com/Ayush-o1/citadel.git   # if you don't have it yet
cd citadel && git checkout main && git pull origin main
```

## 2. Verify environment

```bash
node -v        # >= 18
git status     # should be clean
```

## 3. Verify database

```bash
./scripts/setup.sh
# edit server/.env: set DATABASE_URL to your local Postgres (or use Docker below)
cd server && npm run migrate && npm test
```
No local Postgres? `docker compose up` then `docker compose exec server npm run migrate`.

## 4. Open the problem statement

- Paste the real Caterpillar problem statement into `PROBLEM-STATEMENT.md` at the repo root.
- Commit and push it immediately so everyone works from the same text.

## 5. Run Problem-Statement Mode

Follow `.ai/PLAYBOOK.md` step by step, as a team, out loud:
analysis → users → requirements → MVP → architecture fit → data model →
API list → frontend screens → phases. Fill `.ai/problem-statement/ANALYSIS-TEMPLATE.md`.
**Do not start coding before this is done.**

## 6. Team task assignment

- Create phase files under `.ai/phases/` (from `.ai/phases/_TEMPLATE.md`); update `.ai/ROADMAP.md`'s index.
- Fill the team responsibility table in `.ai/PLAYBOOK.md` — split by skill/dependency/risk, not by pre-assigned role.
- Create a GitHub Issue per task, labeled with priority (`must-have`/`should-have`/`nice-to-have`/`stretch`).

## 7. Branch creation

- One branch per task/phase: `feature/<name>` or `phase/<phase-name>`.
- Nobody pushes directly to `main`.

## 8. Checkpoint rules

- Small commits during work: `<type>(<scope>): <what changed>`.
- Merge to `main` frequently — don't let branches sit unmerged for hours.
- After each phase reaches `VERIFIED` (see `.ai/QUALITY.md` exit criteria): tag it —
  `git tag checkpoint/phase-<id>-<name> && git push origin checkpoint/phase-<id>-<name>`.
- Never force-push `main`.

## 9. Communication rules

- Say what file/module you're about to touch before touching it — avoids
  four people editing the same file.
- If `main` breaks, whoever broke it fixes it first, before starting anything new.
- Log real decisions in `.ai/DECISIONS.md` and anything blocking/risky in `.ai/ISSUES.md` as they happen — not from memory at the end.

## 10. Final verification rules (before every merge to `main`, and before the demo)

- Tests pass, build passes (see `.ai/QUALITY.md`'s verification loop).
- `git status` clean, `git diff` inspected before commit.
- `.ai/STATE.md` reflects reality — never mark something done because code exists.
- Before presenting: `.ai/REQUIREMENTS.md` and `.ai/DECISIONS.md` match what was actually built.
