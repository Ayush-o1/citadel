# Quality system

## The verification loop

No feature is done after code generation. For every meaningful change:

```
IMPLEMENT → RUN → TEST → INSPECT → FIND PROBLEMS → FIX → RUN AGAIN → REVIEW → ACCEPT
```

**Backend:** run it → hit the API with valid input, invalid input, and edge
cases → check the database actually changed as expected → fix → rerun.

**Frontend:** build it → run it → click through it → check loading/error/
empty states, not just the happy path → check it doesn't break at narrow
widths → fix → rerun.

**Database:** write the migration → run it against a clean database → seed
if useful → verify the schema matches what you intended (`\d tablename` in
psql, or equivalent) → fix → rerun.

Never report something as working because the code looks right. Run it.

## Phase gates

A phase's status becomes `VERIFIED` only when every item in its
`phases/<phase>.md` "Exit criteria" checklist is actually true — see
`phases/_TEMPLATE.md`. A failed gate means `IN_PROGRESS` or `BLOCKED`, not
a quietly-lowered bar. Faking completion here is the single most damaging
thing an agent can do to this project, because every later phase and the
final panel defense both trust `STATE.md` and the phase files at face
value.

## Quality review (after every meaningful phase)

Review the work as if you were, in turn: a senior engineer, a product
designer, a security reviewer, a hackathon judge, and a Caterpillar
interviewer. Ask, honestly:

- Does this actually solve the stated problem, or a simplified version of it?
- Is the UX coherent — not just "does it render"?
- Are edge cases handled, or just the happy path?
- Is anything overengineered relative to the time remaining?
- Is the database schema sensible for the actual query patterns used?
- Are the APIs consistent with the rest of the codebase's conventions?
- Is security acceptable for a hackathon (no obvious injection/exposed
  secrets/open CORS-to-everywhere), without having built enterprise
  security infrastructure nobody asked for?
- Is it demoable in under a couple of minutes?
- Can a teammate who didn't write this explain what it does and why?
- If an interviewer asks "why?" five times in a row about this decision,
  is there a real answer, or does it dead-end at "the AI suggested it"?

Fix what's actually wrong. Don't gold-plate what already works.

## MVP control

Classify every feature: `MUST-HAVE` · `SHOULD-HAVE` · `NICE-TO-HAVE` ·
`STRETCH`. Continuously weigh time remaining against value, risk, and work
remaining (see `OVERVIEW.md`'s event timeline — the real build window is
short). When time is tight: cut scope, starting from `STRETCH` down. Never
sacrifice the reliability of a `MUST-HAVE` to add polish to a
`NICE-TO-HAVE`. A smaller, fully-working solution beats a larger, broken
one — both for the demo and for the panel's confidence in the team.

## Demo-first thinking

For every non-trivial feature, before building it, ask: what will the
judge actually see, understand, and remember from it? A technically
impressive feature that can't be shown clearly in a 2-minute demo is worth
less than a simple one that visibly works. Design the demo flow
deliberately (see `PLAYBOOK.md`) rather than discovering it five minutes
before presenting.

## Security baseline (hackathon-appropriate, not enterprise)

Check for: secrets in code or git history, missing input validation,
obvious injection risk (string-concatenated SQL — this repo uses
parameterized queries by convention, keep it that way), overly permissive
CORS, error responses leaking stack traces/internals in a way a demo judge
or interviewer could poke at, and any file upload path (if added) that
doesn't restrict type/size. Don't spend hackathon time building auth
infrastructure, rate limiting, or audit logging nobody asked for.
