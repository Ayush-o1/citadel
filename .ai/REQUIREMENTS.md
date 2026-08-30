# Requirements traceability

**Status: empty.** No requirements exist yet — there is no problem
statement (see root `PROBLEM-STATEMENT.md`). Do not invent requirements to
fill this in. This file defines the format; it gets populated during
Problem-Statement Mode (`PLAYBOOK.md`).

## Format

Every requirement gets an ID (`REQ-001`, `REQ-002`, ...) extracted directly
from the problem statement (explicit) or clearly marked as inferred
(implicit). Each requirement tracks its full chain: nothing is "done"
because code exists — it's done when it's designed, built, tested, and
verified.

| ID | Requirement | Type | Priority | Design | Code | Test | Status |
|---|---|---|---|---|---|---|---|
| REQ-001 | *(example — delete once real ones exist)* Users can create an account | Explicit | Must-have | `phases/PHASE-0X-*.md` | `server/src/modules/auth/` | `server/tests/auth.test.js` | `NOT_STARTED` |

**Type:** `Explicit` (stated directly in the problem statement) or
`Implicit` (inferred — note the reasoning in `DECISIONS.md` if it's not
obvious).

**Priority:** `Must-have` / `Should-have` / `Nice-to-have` / `Stretch` — see
`QUALITY.md` for the MVP-control rules governing this.

**Status:** `NOT_STARTED` · `DESIGNED` · `IMPLEMENTED` · `TESTED` · `VERIFIED`
· `DEFERRED` (explicitly cut, with reason) · `WON'T_DO`

## Answering the standard questions

Once populated, this table should let anyone answer, at a glance:
- What requirements are complete? → filter `Status = VERIFIED`
- What's partial? → `DESIGNED` or `IMPLEMENTED` but not `TESTED`/`VERIFIED`
- What's missing? → `NOT_STARTED`
- What's optional and cut? → `DEFERRED` with a reason, not silently dropped
