# 001 — Home search hands off `q` and `loc` only; Discover applies BR-02

Date: 2026-11-25 · Status: accepted · Raised by: PLAN-M05 (decision D-1)

## Context
SPEC §8.2 says submitting the search bar on S1 **or** S2 "sets `q` and `loc`, and sets `cat` from BR-02". SPEC S1.E4, M05 AC3 and M06 AC1 all expect Home to produce `/discover?q=plumb&loc=dehiwala-mount-lavinia` (no `cat`) and Discover to show Plumbing ticked because "plumb" matches by BR-02. The two rules contradict each other for Home.

## Decision
- **S1 (Home)** submits only `q` (trimmed) and `loc`; empty fields are omitted. It does no category matching and needs no catalog lookup to submit.
- **S2 (Discover)** applies BR-02 when it reads the URL: `GET /providers` returns `matchedCategoryId`, and the page treats that category as the applied filter (`q` is not used as free text).
- S2's own search-bar submit keeps the §8.2 behaviour (sets `cat` from BR-02, resets rating/verified/price/page, keeps sort).

## Alternatives
- Home also matches BR-02 and writes `cat=plumbing`. Rejected: it contradicts S1.E4 and the M05/M06 acceptance criteria, duplicates the matching on two screens, and makes Home depend on the catalog before it can submit.

## Consequences
- The Home URL stays exactly what the user typed, so it's shareable and readable.
- Discover must handle a `q` that is a category match with no `cat` (already required by M06 AC1 and M16 AC3).
- No finished code changes; no follow-up `Cxx` milestone.

## Affected items
| Item | Impact | Action |
|---|---|---|
| SPEC §8.2 "Submitting the search bar" | Contradicted S1.E4 | Edited (changed by decision 001) |
| SPEC S1.E4 | Already matches | None |
| SPEC S2.E1 | Unchanged (S2 submit still derives `cat`) | None |
| M05 AC3, PLAN-M05 D-1 / T9 | Already match | None |
| M06 AC1, M16 AC3 | Already match | None |
| Contracts / ARCHITECTURE (`matchCategory`, `matchedCategoryId`) | Unchanged | None |
