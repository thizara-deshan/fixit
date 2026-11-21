# Prompt 08 — New feature (brainstorm → milestone)

> **Feature loop** · whenever "we missed something" · **Model:** Opus 5.5 · new session · interactive
> **Inputs:** the idea, PRODUCT, SPEC, ARCHITECTURE, M00-index, current code
> **Output:** `docs/features/FEAT-NN-<slug>.md` + `docs/milestones/Fxx-<slug>.md` (+ PRODUCT/SPEC updates)

## When to use
The prototype doesn't cover everything, and you'll keep finding gaps: "providers need
a vacation mode", "admins need to see why a request was declined", "customers want to
upload photos of the problem". This prompt replaces Eduscope's hardware intake. It takes
a raw idea, brainstorms it with you, checks it against what's already built, and turns
it into a feature brief and a milestone that goes through the normal 05 → 06 → 07 loop.

Use it also to triage the **Ideas inbox** in bulk (e.g. at the frontend complete gate).

Don't use it for bugs in a finished milestone (add a fix task, or use 07) or for
changing an existing decision (use 09).

## Variables
```
{{IDEA}}   — the idea in your words, e.g. "providers should be able to pause
             receiving requests while on vacation"  (or "triage the Ideas inbox")
{{NN}}     — next feature number, e.g. 03
```

## The prompt
````text
You are a product engineer adding a feature to "Fixit", which is already
partly built. Your job: understand the idea, shape it with me, and turn it
into a feature brief and a buildable milestone that fits the existing
architecture.

### Inputs
- The idea: {{IDEA}}
- `docs/PRODUCT.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`
- `docs/milestones/M00-index.md` (what's done, in progress, planned; Ideas inbox)
- Existing `docs/features/FEAT-*.md`
- The codebase: contracts, MSW handlers, API modules, web features

### Process — STOP after rounds 1 and 2 for my answers
**Round 1 — Understand.** Restate the idea as a problem: who has it, when, and
what they do today without it. Classify it: new feature | extension of
F-xx | actually a bug | actually a decision change (→ prompt 09). If it is
"triage the Ideas inbox", do this for each line and group duplicates.
Ask me 3–6 questions, each with your recommended answer + alternatives.
Typical ones: which roles, which statuses it touches, what admins can see or
override, mobile behavior, notifications, effect on existing data.

**Round 2 — Shape.** Propose:
 - user stories with acceptance criteria (Given/When/Then)
 - roles matrix rows added or changed
 - state machine changes, if any (new status / transition / actor)
 - new or changed business rules (BR-xx)
 - screens: new screens or changed elements, described in SPEC format, reusing
   existing patterns. Say whether it deserves a Claude Design mockup first.
 - data: contract schemas, endpoints (with roles + ownership), Prisma changes
   and a migration/backfill note for existing rows
 - impact on finished milestones (what code changes) and on planned ones
 - size estimate, MoSCoW, and where it fits in the milestone order
 - the smallest version worth shipping (cut it down if it's large)
 Ask me to confirm the shape and the slot.

### Output (after approval)
1. `docs/features/FEAT-{{NN}}-<slug>.md`: Problem · Decision summary ·
   User stories & criteria · Roles · Lifecycle/rule changes · Screens ·
   Contracts & endpoints · Data & migration · Impact · Out of scope ·
   Decisions (questions + my answers / `[ASSUMED]`).
2. Update `docs/PRODUCT.md` (feature row, roles matrix, BR, lifecycle) and
   `docs/SPEC.md` (screens/elements), marking each edited place with
   "(added by FEAT-{{NN}})". Update ARCHITECTURE's endpoint table if it changes.
3. `docs/milestones/Fxx-<slug>.md` in the standard milestone format. If the
   frontend and backend phases are both already past, ONE milestone covers
   contracts + mocks + UI + API (in that order). Otherwise split it: a
   frontend part for Phase B and a backend part for Phase C.
4. Add the row(s) to M00-index, remove the handled lines from Ideas inbox,
   and update the coverage check.

### Rules
- Fit the existing architecture. If it can't, STOP and say a Change Record
  (prompt 09) is needed first.
- Reuse existing patterns and components before proposing new ones.
- Every new endpoint comes with roles + ownership + matrix rows in the brief.
- Never edit code in this prompt. It only writes docs.
````

## After a feature brief
1. If the brief calls for a mockup, design it in Claude Design, export it into
   `reference/prototype/`, re-run the tools, and reference the new screenshots in the milestone.
2. Commit: `git add docs && git commit -m "docs: FEAT-NN <slug>"`
3. Run 05 → 06 → 07 for the `Fxx` milestone when its slot comes.
