# Prompt 09 — Change record

> **Any time** · **Model:** Opus 5.5 · new session
> **Output:** `docs/decisions/NNN-<slug>.md` + updates to affected docs (+ `Cxx` milestone if code must change)

## When to use
When reality overrides an earlier decision. For example: you decide to add Google sign-in
after all, switch from Vite to Next.js for SEO, change the request lifecycle (add
"Quoted"), move file storage providers, or a library turns out not to work with
NestJS. Don't silently edit PRODUCT, SPEC or ARCHITECTURE. Write it down, then update
the docs.

Not for small fixes inside a milestone (those go in the plan) or for new
features that don't change existing decisions (those go through 08).

## The prompt
````text
A decision needs to change.

**Change:** {{WHAT_CHANGED}}
**Why:** {{EVIDENCE}}   (e.g. "provider interviews: they need to send a price quote
                          before the customer commits — Accepted is too early")

1. Read PRODUCT, SPEC, ARCHITECTURE, CLAUDE.md, M00-index, open plans,
   feature briefs, and the code affected by this decision (contracts, MSW
   handlers, API modules, Prisma schema, web features).
2. Impact analysis: every doc section, contract, state-machine rule,
   endpoint, authorization matrix row, MSW handler, migration, plan task,
   and finished milestone affected. Table: | Item | Impact | Action |.
   Include a data-migration note for existing rows if the schema changes.
3. STOP and show me the table.
4. After approval:
   - Write `docs/decisions/NNN-<slug>.md`: Context · Decision · Alternatives
     · Consequences · Affected items.
   - Update PRODUCT/SPEC/ARCHITECTURE/CLAUDE.md in place, adding
     "(changed by decision NNN)" next to each edited section.
   - If finished code must change, create a milestone `Cxx-<slug>.md` with
     acceptance criteria and add it to M00-index. It then goes through 05/06/07.
````

## Done when
- [ ] Decision file committed, docs updated, and the follow-up milestone (if any) indexed
