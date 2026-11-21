# M16 — Catalog & search API
Phase: C   Depends on: M15   Est: 1½ days
Mock domains after this milestone: `providers,requests,reviews,admin`

## Goal
Home, Discover and the public provider profile run on Postgres: the catalog, the parameterized Discover SQL with per-category counts and the three sorts, featured providers, public profiles and paginated public reviews. Results match the mock's behaviour exactly because both follow the contracts comparator.

## Scope
- PRODUCT F-05, F-06, F-07, F-08, F-09, F-29 (read); BR-01 – BR-08, BR-27, BR-41 (suspended hidden).
- ARCHITECTURE §3.2 `GET /catalog`, `GET /providers`, `GET /providers/featured`, `GET /providers/:id`, `GET /providers/:id/reviews`; §7.6 `SearchService` (base CTE, counts, total, page in one `$transaction`, ILIKE escaping, `normalizeDiscoverQuery`), §8.2 indexes (pg_trgm GIN on `searchText`), contract test "SQL order equals `compareProviders()` on the fixture world", D9, D10.
- Matrix rows for these endpoints; integration tests for every filter, combination, count and sort.

## Out of scope
- `/me/saved` (F-10, Backlog). `/files/photos/:key` (M17; seeded providers have no photos, so cards show the category-icon tile). Eligibility (M18).

## Acceptance criteria
1. The authorization matrix rows for the 5 catalog endpoints pass (all public; suspended/draft providers → 404 on `/providers/:id`).
2. With `VITE_MOCK_DOMAINS=providers,requests,reviews,admin`, every M05, M06 and M07 user-visible criterion passes on real data at 1440px and 390px (search hand-off, filters, counts, sorts, URL reset rules, pagination, empty state, phone filter sheet, featured, profile, tooltip, reviews 5 + 10 more, not-found box). The S3 Request Service states still come from the mocked `requests` domain.
3. `/discover?q=plumb` applies the Plumbing category (BR-02) and `matchedCategoryId=plumbing`; `q=50%_\` returns 0 results without SQL errors (escaping); unknown `cat`/`loc` ids are ignored; `page=999` returns the last page.
4. Integration: the order of `GET /providers?sort=rating|reviews|town&loc=…` equals `compareProviders()` over the same fixture world; `categoryCounts` equal counts computed with all other filters applied; providers with no reviews are excluded for any minimum rating; Verified only and price steps filter on stored columns.
5. Featured returns ≤ 4 verified providers with ≥ 1 review in Top-rated order; a provider whose user is suspended (SQL) disappears from Discover, featured and its profile link (404).
6. `GET /providers/:id/reviews?size=5` then `page=2&size=10` returns visible reviews newest first with `Sarah K.`-style author names and never emails/ids of authors (privacy probe in the matrix).
7. A search over the seeded world responds in < 100 ms locally (logged timing in the integration test, informational).

## Notes for the planner
- Load cards with Prisma after selecting ids and keep the SQL order.
- `searchText` maintenance belongs to writers (providers service in M17, admin category rename in M26); here it is only read. The seed already computed it.
- Mixed-mode caveat (ARCHITECTURE §4.4): writes in the still-mocked `providers` domain (e.g. a new service) won't show in real search until M17. That's expected; don't patch around it.
