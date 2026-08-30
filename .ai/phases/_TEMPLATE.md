# Phase XX — <name>

**Status:** `NOT_STARTED` | `PLANNED` | `IN_PROGRESS` | `BLOCKED` | `READY_FOR_REVIEW` | `VERIFIED` | `COMPLETE`
**Owner:** <person/agent>
**Started:** <date> · **Closed:** <date or —>

## Objective

What this phase produces, in one or two sentences.

## Why

Why this phase exists now — what it unblocks, and why this order.

## Inputs

What must already exist before this phase can start (prior phases, decisions, external info).

## Outputs

What exists once this phase is done, concretely (files, endpoints, schema, screens).

## Dependencies

Other phases or people this phase depends on, or that depend on it. Note if tasks inside can be parallelized.

## Tasks

Break down small enough to verify individually. Number them `XX.1`, `XX.2`, ... Split further if a task is still too big to finish in one sitting.

- [ ] XX.1 —
- [ ] XX.2 —

## Files / systems affected

List real paths, not vague areas — this is what keeps four people from editing the same file.

## Risks

What could go wrong in this phase specifically, and the mitigation. Log anything that materializes in `ISSUES.md`.

## Acceptance criteria

Concrete, checkable statements — not "works well."

## Tests

What was actually run to verify this phase (commands, manual checks). Not "should work" — what you ran and what happened.

## Exit criteria (phase gate)

All of these must be true before status becomes `VERIFIED`:

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Tests pass
- [ ] Build passes
- [ ] Critical edge cases checked
- [ ] Requirements mapped (if applicable — see `REQUIREMENTS.md`)
- [ ] Known issues reviewed (`ISSUES.md` updated)
- [ ] Documentation updated
- [ ] Architecture still coherent (no unreviewed drift from `ARCHITECTURE.md`)
- [ ] No blocking regression
- [ ] `STATE.md` updated
- [ ] Checkpoint created (commit + tag if the phase is a real milestone)
- [ ] `git status` clean, nothing stray staged/unstaged

A failed gate means the status is `IN_PROGRESS` or `BLOCKED` — never force
a phase to `VERIFIED`/`COMPLETE` because code exists.
