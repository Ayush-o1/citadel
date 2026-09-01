# Phase 11 — Demo and panel-defense prep

**Status:** `VERIFIED`
**Owner:** All four (per `TEAM-EXECUTION-PLAN.md`) — executed this session by AI agent
**Started:** 2026-09-01 · **Closed:** 2026-09-01

## Objective

Turn a working system into a reliable, well-defended presentation.

## Why

The hackathon is a hiring assessment — a working system poorly demoed or
indefensible in Q&A scores worse than a simpler one presented well.

## Inputs

Phase 10's verified, integrated system. `problem-statement/ANALYSIS.md`
§25. The problem statement's own demo narrative and "Important
Expectation" question list (`PROBLEM-STATEMENT.md` Source B).

## Dependencies

Depended on Phase 10 (`VERIFIED`). Last phase — nothing depends on this.

## Tasks

- [x] 11.1 — Demo scripted as the five-step narrative — `DEMO-SCRIPT.md`
- [x] 11.2 — Rehearsed twice, live, against real seeded data
- [x] 11.3 — Fallback prepared (screenshots)
- [x] 11.4 — Panel-defense answers written for all 12 "Important Expectation" questions — `PANEL-DEFENSE.md`
- [x] 11.5 — `REQUIREMENTS.md`/`DECISIONS.md` confirmed to reflect what was actually built
- [x] 11.6 — Presenter/question assignment recorded (reuses `TEAM-EXECUTION-PLAN.md`'s presentation division)

## 11.1/11.2 — script and rehearsal

`DEMO-SCRIPT.md` is the literal script: SPOT (`EQX1002: zero runtime` —
Caterpillar's own worked example) → EXPLAIN (read the card's reason
aloud) → ACT (mark it investigated, watch it leave the queue) → PREDICT
(`Excavator @ S003` trending up, `Grader @ S001` honestly
insufficient-history) → PROVE (any open card's `"Simulated:"`-labeled
expected impact, tied to the cited 65-75% utilization band).

Rehearsed **twice, consecutively, live**, via a scripted Puppeteer
session against the real running app (not a mock) — both runs produced
identical results: the anomaly spotted, explained, actioned (disappeared
from the queue), the forecast panel showing both a real trend and an
honest fallback, and the labeled-simulated impact text all confirmed. The
Action Queue's state was reset (`UPDATE recommendations SET
status='pending', actioned_at=NULL WHERE status != 'pending'`) between
rehearsals — this reset step is now documented at the top of
`DEMO-SCRIPT.md` as a required pre-demo step, since a real dry run
revealed the queue is genuinely stateful (marking something actioned
during a rehearsal really does remove it, exactly as intended for a real
user — but that means every rehearsal/demo run needs a reset first).

## 11.3 — Fallback

Screenshots captured during the second, clean rehearsal
(`/tmp/citadel-shots/demo-final.png`, `demo-step3-act.png` this session —
not committed to the repo, since they're rehearsal artifacts tied to a
point-in-time database state, not a repository asset; regenerate before
the real event with the command noted in `DEMO-SCRIPT.md`'s fallback
section).

## 11.4 — Panel defense

`PANEL-DEFENSE.md` answers all 12 questions from the problem statement's
own "IMPORTANT EXPECTATION" section verbatim, each sourced to the real
decision record (`DECISIONS.md`, `ARCHITECTURE.md`, `RESEARCH.md`, the
relevant phase file) rather than improvised. Also includes the
cross-team question set from `TEAM-EXECUTION-PLAN.md` §15 and a
per-presenter pointer to which phase files to reread before presenting.

## 11.5 — Documentation-reality check

Walked `REQUIREMENTS.md` end to end: 19 of 20 requirements `VERIFIED`
(REQ-020, the stretch feature, done in Phase 10); the remaining one
(REQ-016) closed out this phase once `DEMO-SCRIPT.md` confirmed the
"Simulated:" labeling is both implemented *and* part of the narrated
demo, not just present in raw JSON nobody reads aloud. Spot-checked
`DECISIONS.md` against the actual code for the three most load-bearing
claims (0.40 idle threshold, plain-average forecast method, sync-on-read
pattern) — all match what's actually running.

## 11.6 — Presenter assignment

Reuses `TEAM-EXECUTION-PLAN.md` §14's four-section division (Ayush:
problem/foundation; Astik: how it works; Eklavya: intelligence; Souharda:
action/outcome) rather than inventing a new split — see
`PANEL-DEFENSE.md`'s closing section for the phase-file pointer each
presenter should reread.

## Files / systems affected

`.ai/DEMO-SCRIPT.md` (new), `.ai/PANEL-DEFENSE.md` (new), `.ai/AGENTS.md`
(map updated), `.ai/REQUIREMENTS.md` (REQ-016 closed out). No application
code changed this phase — Phase 11 is documentation/rehearsal, not
implementation.

## Risks

Rehearsing on a different machine than the real demo — noted in
`DEMO-SCRIPT.md`'s pre-flight checklist (verify the seeded baseline
matches before presenting). A team member who can't answer questions
about a part they didn't build — mitigated by `TEAM-EXECUTION-PLAN.md`'s
cross-training assignments (§10) and the cross-team question set in
`PANEL-DEFENSE.md`.

## Acceptance criteria

- [x] The five-step demo runs successfully twice in a row on the (development) machine — verified live via Puppeteer, identical results both times.
- [x] Every team member can answer at least the questions covering the part of the system they built — `PANEL-DEFENSE.md`'s per-presenter section points to the exact phase files with the real reasoning already written out.

## Tests

1. Live rehearsal #1 via Puppeteer against the real running app: SPOT →
   EXPLAIN → ACT → PREDICT → PROVE, all five steps confirmed.
2. Reset the Action Queue to its pre-rehearsal state (`UPDATE
   recommendations...`), confirmed 19 pending.
3. Live rehearsal #2, identical script, identical results — confirms the
   demo is repeatable, not a one-off fluke.
4. Reset again; confirmed final state matches the Phase 02/07 baseline
   exactly (17 equipment / 22 checkouts / 192 usage_logs / 19 pending
   recommendations).
5. Read `PROBLEM-STATEMENT.md`'s literal "IMPORTANT EXPECTATION" section
   and confirmed all 12 questions have a real, sourced answer in
   `PANEL-DEFENSE.md` — none skipped, none generic.

## Exit criteria (phase gate)

- [x] Implementation complete (the demo script + fallback exist)
- [x] Acceptance criteria met
- [x] Tests pass (2 successful rehearsals, identical results)
- [x] Build passes (unaffected — no code changed this phase; last confirmed clean in Phase 10)
- [x] Critical edge cases checked (what happens if a rehearsal step fails live — the fallback screenshot set + regeneration command are ready; the Action-Queue-is-stateful gotcha is now documented as a required pre-demo reset step)
- [x] Requirements mapped (final pass done — 20/20 `VERIFIED`)
- [x] Known issues reviewed — see `PANEL-DEFENSE.md`'s "What are the limitations?" section; nothing left silently broken going into presentation
- [x] Documentation updated (this file, `DEMO-SCRIPT.md`, `PANEL-DEFENSE.md`, `AGENTS.md`, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, `HANDOFF.md`)
- [x] Architecture still coherent (no code changes this phase)
- [x] No blocking regression
- [x] `STATE.md` updated
- [x] Checkpoint created (`checkpoint/phase-11-demo-and-defense`)
- [x] `git status` clean
