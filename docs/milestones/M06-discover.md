# M06 — Discover
Phase: B   Depends on: M05   Est: 1½ days
Mock domains after this milestone: all

## Goal
Anyone can search, filter and sort listed providers on Discover, with the URL as the single source of truth, per-category counts that respect the other filters, pagination and the empty state. On phone and tablet the filters live in a sheet with a live result count.

## Scope
- PRODUCT F-06, F-07, F-08, F-29; BR-01 (listed only, "Not yet verified"), BR-02 (category matching), BR-03, BR-04, BR-05 (filters, counts, URL reset rules), BR-06 (sorts), BR-07 (no distance), BR-15 display (`Not taking requests` pill from `paused`).
- SPEC S2 (E1–E12, desktop / tablet / phone), §8.2 Discover URL state, §6.1 result-card skeletons, §6.2.
- ARCHITECTURE §2.6 `DiscoverQuery`, `DiscoverResult`; §2.9 / `search/*`: `matchCategory()`, `normalizeDiscoverQuery()`, `RATING_STEPS`, `PRICE_STEPS`, `compareProviders()` with tests; §5.4 `features/discover/url-state.ts`; §3.2 `GET /providers` MSW handler + `ENDPOINTS` entry.

## Out of scope
- Server-side SQL search (M16). Provider profile (M07) — `View profile` links work but the page can be a placeholder.

## Acceptance criteria
1. At 1440px: `/discover?q=plumb&loc=dehiwala-mount-lavinia` shows the search bar prefilled, Plumbing ticked in the filter panel (BR-02: "plumb" ≥ 4 chars prefix → category, not free text), H1 `{n} providers found`, context `Showing Plumbing in Dehiwala-Mount Lavinia`, results sorted Top rated.
2. Each filter updates the URL and results: categories (OR), Location, Minimum rating (providers with no reviews only under Any), Verified only (row toggles on tap), Starting price steps. Category counts change to reflect the other active filters; a 0-count row is subtle but selectable.
3. Sort `Most reviews` and `Based in your town first` reorder results per BR-06; with no town, "Based in your town first" equals Top rated. Changing sort resets `page` to 1.
4. A new search sets `q` and `loc`, sets `cat` from the BR-02 match of the new `q` (else none), keeps `sort`, and resets rating, verified, price and page (BR-05). `Clear all` resets everything incl. `q`. Browser Back/Forward restores each state; a pasted URL with junk (`rating=9&page=-1&cat=,,x`) renders defaults without error.
5. Result cards show Verified badge or `Not yet verified`, `New` + `No reviews yet` for 0 reviews, category · town · years meta (no distance), bio clamped to 2 lines, `Starting at` price with unit. More than 10 results → pagination; page links scroll to the results heading.
6. At 390px: H1 22/30, sticky toolbar with `Filters` (badge = count of applied filters) and Sort; the filters bottom sheet (88vh) applies changes live and its footer reads `Show {n} providers`; `Clear all` in the footer. At 800px the sheet slides from the right (380 wide). Pagination collapses to `‹ Previous · Page 2 of 5 · Next ›`. No horizontal scroll at 390 / 800 / 1440.
7. Empty: filters with no matches show `No providers match your filters` + `Clear filters`. Loading: card skeletons after 150 ms; error (forced 500) shows a section error with `Try again` and keeps the filter panel usable.
8. Vitest: `matchCategory` (exact, prefix ≥ 4, prefix < 4, case/whitespace), `DiscoverQuery` invalid → defaults, `compareProviders` for all three sorts incl. ties and no-review providers last, `url-state` round trip and reset rules.

## Notes for the planner
- The URL is the state; no duplicated React state for filters (ARCHITECTURE §5.4).
- The mock implements filtering/counting in TypeScript using the contracts functions; M16 will assert the SQL order equals `compareProviders` on the fixture set, so keep the comparator authoritative.
- Remember the last Discover URL in session (S3.E1 "Back to results", S13 "Back to search").
- Unknown `cat`/`loc` ids are dropped; `page` beyond the last page returns the last page (ARCHITECTURE §2.6).
