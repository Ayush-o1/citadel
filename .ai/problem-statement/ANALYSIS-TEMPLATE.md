# Problem statement analysis

Copy this into a new doc (or fill it in directly) as soon as the real
problem statement is pasted into `../../PROBLEM-STATEMENT.md`. Fill it in
as a team before writing code — see `../PLAYBOOK.md` for the full sequence
this fits into, and `../QUALITY.md`'s MVP-control rules.

## 1. Problem interpretation

What is the problem actually asking for, in plain language? What is
Caterpillar (or the panel) trying to see us demonstrate?

## 2. Users

Who uses this? List each distinct user type and what they need from the
system.

## 3. Functional requirements

What must the system *do*. One bullet per capability. Transfer each into
`../REQUIREMENTS.md` as a `REQ-XXX` row once this list is stable.

## 4. Non-functional requirements

Performance, reliability, security, scale — only the ones that are
actually relevant given the 2-day timeframe and demo format.

## 5. MVP

The smallest version of this that is still a complete, demoable answer to
the problem. If in doubt, cut — a smaller working demo beats a larger
broken one.

## 6. Nice-to-have (only if time remains)

Everything real but not essential. Rank by demo impact vs. effort.

## 7. Architecture

Does the existing Citadel starter fit as-is, or does anything need to
change (e.g. a second datastore, a real-time layer, an external API)? See
`../ARCHITECTURE.md` for how to extend it. Note any domain research that
influenced this in `../RESEARCH.md`.

## 8. Data model

Entities, their fields, and relationships. This becomes the migration
files in `server/db/migrations/`.

## 9. API list

Method, path, purpose — one row per endpoint.

| Method | Path | Purpose |
|--------|------|---------|
|        |      |         |

## 10. Frontend screens

One row per page/route and what it shows.

| Route | Purpose |
|-------|---------|
|       |         |

## 11. Team task division

Fill in `../PLAYBOOK.md`'s team responsibility template with the actual
split once this section is done. Create the phase files in `../phases/`
(from `../phases/_TEMPLATE.md`) and update `../ROADMAP.md`'s index.

## 12. Estimated difficulty / risk

What's the riskiest part of this build (technically or time-wise)? Build
that first, or spike it early, so there's time to recover if it doesn't
work.

## 13. Demo strategy

What will actually be shown, in what order, and what's the fallback if
something breaks live.
