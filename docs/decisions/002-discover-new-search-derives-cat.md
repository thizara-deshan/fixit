# 002 — A Discover search-bar submit derives `cat` from BR-02; it does not keep the previous `cat`

Date: 2026-11-25 · Status: accepted · Raised by: PLAN-M06 (decision D-1)

## Context
M06 AC4 said "A new search keeps `q`, `loc`, `cat` and resets rating, verified, price and page". SPEC §8.2 (and decision 001) say a submit on S2 "sets `q` and `loc`, and sets `cat` from BR-02 (the matched category, else none)"; ARCHITECTURE §5.4 `newSearch` implements exactly that. BR-05 ("search text, town and categories are kept in the page link") describes which params live in the URL, not that an old `cat` survives a new search.

## Decision
Submitting the S2 search bar sets `q` (trimmed) and `loc`, sets `cat` to the BR-02 match of the new `q` (else omits it), drops `rating`, `verified`, `price` and `page`, keeps `sort`, and pushes a history entry. M06 AC4 is reworded to match.

## Alternatives
- Keep the previous `cat` and add the new match. Rejected: a new search for "cleaning" while Plumbing is ticked would show both categories, which surprises users and contradicts SPEC §8.2 and ARCH §5.4.

## Consequences
- No change to SPEC, PRODUCT, ARCHITECTURE or contracts.
- PLAN-M06 T9 and T19 tests encode this behaviour.

## Affected items
| Item | Impact | Action |
|---|---|---|
| M06 AC4 | Contradicted SPEC §8.2 | Edited (changed by decision 002) |
| SPEC §8.2, S2.E1; ARCH §5.4 | Already match | None |
| PLAN-M06 D-1, T9, T19 | Already match | None |
