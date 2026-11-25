# PLAN-M06 — Discover
Milestone: `docs/milestones/M06-discover.md` · Start tag: `m06-start` · Verify-all: `pnpm verify`
Mock domains at start → end: all → all (`catalog` gains `GET /providers`). **No backend in this milestone** (`apps/api` does not exist yet), so there are no Nest tasks and no authorization-matrix rows. `GET /providers` is public; the mock applies BR-01…BR-07 with the contracts functions, the way M16's SQL will.

Conventions for the executor:
- T1 creates tag `m06-start` and branch `m06-discover`. One commit per task, using the message given, ending with the attribution lines from your session instructions.
- Run `pnpm format` before `pnpm verify` in every task. Code below may not be Prettier-exact.
- Code blocks are complete files unless the step says "add", "replace" or "edit". Tests import `describe/expect/it/vi` from `vitest` explicitly.
- Paths are under `apps/web/` unless they start with `packages/`, `docs/` or `/`. `@/` = `apps/web/src/`.
- Tailwind: only `sm` (≥641) and `lg` (≥1024) prefixes. Arbitrary **size** values are allowed (`w-[280px]`, `max-h-[88vh]`). Arbitrary colour values and the lint-banned prefixes `text-[`, `bg-[`, `border-[`, `shadow-[`, `ring-[`, `outline-[` are not (the existing `border-[1.5px]` in `components/ui` is a width and is already allowed there; in features use the `border-[1.5px]` only if lint passes, otherwise `border-2`). Token classes: see PLAN-M05 header, plus `shadow-search-sm`, `shadow-toast`, `shadow-modal`, `bg-overlay`, `border-strong`, `border-control`, `surface-muted`, `star`, `star-empty`, `warning-soft`, `warning-text`.
- Copy in backticks is SPEC copy, character for character.
- If a library API differs from what the code assumes (React Router 7, TanStack Query 5, zod 4, radix-ui, lucide-react names), **STOP** and write a blocker.

Planner's decisions the executor must follow:
- **D-1 New search derives `cat`.** Per SPEC §8.2, ARCH §5.4 and decision `docs/decisions/002-discover-new-search-derives-cat.md` (M06 AC4 reworded to match): set `q`, `loc`, and `cat` = BR-02 match of the new `q` (else none); drop rating/verified/price/page; keep `sort`. Test cases in T9 and T19 encode this.
- **D-2 The ticked categories** shown in the panel = `state.cat ∪ {matchCategory(state.q)}`. Toggling a row writes that full set (± the row) to `cat`; `setFilter` then clears `q` because `q` was a category match (SPEC §8.2). Example: `q=plumb`, tick Electrical → `cat=plumbing,electrical`, no `q`.
- **D-3 Filtering/counting/paging for the mock lives in `mocks/lib/discover.ts`** (mock-only; M16 does it in SQL). Everything rule-shaped it uses (`normalizeDiscoverQuery`, `matchCategory`, `compareProviders`, `RATING_STEPS`, `PRICE_STEPS`) is in contracts.
- **D-4 `compareProviders(sort, loc?)`** extends the M05 signature. `RankFields` gains optional `baseTown?: { id: string }` (a `ProviderCard` satisfies it). `town` without `loc` = `rating`.
- **D-5 Results keep the previous page while refetching** (`placeholderData: keepPreviousData`). Skeletons only show on the first load (no data yet) after 150 ms via `LoadingRegion`. Filter counts therefore don't flash to empty on each change.
- **D-6 Selects are native `<select>`** (same as `HeroSearch`): Location (grouped by district) and Sort. They are keyboard/tap friendly and render the OS picker on phone.
- **D-7 Last Discover URL** is stored in `sessionStorage['fixit.lastDiscover']` by `lib/last-discover.ts` (M07/S13 will read it with `lastDiscoverUrl()`).
- **D-8 Live count copy**: `Show {n} providers`, with `Show 1 provider` when n = 1 (same pluralisation as the H1 in S2.E8).
- **D-9 No mock db version bump.** The db shape doesn't change.
- **D-10 Pagination with fixtures.** The fixture world has exactly **10** listed providers (p01–p10), i.e. one page. Pagination behaviour is covered by tests that add providers to the mock db; the manual check uses the DevPanel-free route `?page=…` only to confirm it is hidden. See "Summary notes" at the end.

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `packages/contracts/src/catalog/schemas.ts` (+ test) | Modify | `DiscoverQuery`, `DiscoverResult` |
| `packages/contracts/src/search/match.ts` (+ test) | Create | `matchCategory()` (BR-02), `normalizeDiscoverQuery()`, `RATING_STEPS`, `PRICE_STEPS` |
| `packages/contracts/src/search/compare.ts` (+ test) | Modify | `compareProviders('rating'|'reviews'|'town', loc?)` (BR-06) |
| `packages/contracts/src/endpoints.ts` (+ test) | Modify | `providers_search` entry (`GET /providers`) |
| `packages/contracts/src/index.ts` | Modify | export `search/match` |
| `src/mocks/lib/discover.ts` (+ test) | Create | `discoverSearch(db, query)` — filter, count, sort, page |
| `src/mocks/handlers/catalog.ts` (+ test) | Modify | `GET /providers` handler |
| `src/lib/query-keys.ts` | Modify | `qk.discover(q)` |
| `src/lib/last-discover.ts` (+ test) | Create | session storage of the last Discover URL |
| `src/features/discover/url-state.ts` (+ test) | Create | `readDiscover`, `writeDiscover`, `useDiscoverParams`, `appliedFilterCount`, `tickedCategories` |
| `src/features/discover/copy.ts` (+ test) | Create | `resultsTitle`, `contextLine`, `showCountLabel` |
| `src/features/discover/api.ts`, `hooks.ts` (+ test) | Create | `fetchDiscover`, `useDiscover` |
| `src/features/discover/components/discover-search-bar.tsx` | Create | S2.E1 |
| `src/features/discover/components/filter-groups.tsx` | Create | S2.E3–E7 (shared by panel and sheet) |
| `src/features/discover/components/filter-panel.tsx` | Create | S2.E2 desktop panel |
| `src/features/discover/components/filters-sheet.tsx` | Create | phone/tablet sheet + toolbar Filters button |
| `src/features/discover/components/result-card.tsx` | Create | S2.E10 |
| `src/features/discover/components/results-header.tsx` | Create | S2.E8, S2.E9 |
| `src/features/discover/pages/discover-page.tsx` (+ test) | Create | S2 assembly, states, pagination, scroll |
| `src/app/chunks/public.tsx` | Modify | route `DiscoverPage` to the real page |
| `docs/plans/PLAN-M06-discover.md`, `docs/milestones/M00-index.md` | Modify | ticks, M06 status |

## Tasks

### T1 — `DiscoverQuery` and `DiscoverResult` schemas
- [x] done
**Files:** `packages/contracts/src/catalog/schemas.ts`, `packages/contracts/src/catalog/schemas.test.ts`
**Context:** ARCH §2.6; SPEC §8.2 (invalid → defaults). `SortKey` already exists in `common/enums.ts`; `paginated` in `common/pagination.ts`.
**Do:**
1. `git tag m06-start && git checkout -b m06-discover`.
2. Add to `catalog/schemas.ts` imports: `import { SortKey } from '../common/enums';` (merge with the existing enums import) and `import { paginated } from '../common/pagination';`.
3. Append:
```ts
const csvIds = z
  .string()
  .transform((s) => [...new Set(s.split(',').map((x) => x.trim()).filter(Boolean))])
  .pipe(z.array(Id).max(20));

/** URL params and GET /providers query share this shape (SPEC §8.2). Invalid values → defaults (.catch). */
export const DiscoverQuery = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .optional()
    .catch(undefined)
    .transform((s) => (s ? s : undefined)),
  loc: Id.optional().catch(undefined),
  cat: csvIds
    .optional()
    .catch(undefined)
    .transform((a) => (a && a.length > 0 ? a : undefined)),
  rating: z.enum(['3.5', '4', '4.5']).optional().catch(undefined),
  verified: z.literal('1').optional().catch(undefined),
  price: z.enum(['2000', '5000', '10000']).optional().catch(undefined),
  sort: SortKey.catch('rating').default('rating'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});
export type DiscoverQuery = z.infer<typeof DiscoverQuery>;

export const DiscoverResult = paginated(ProviderCard).extend({
  categoryCounts: z.record(Id, z.number().int()), // per category, all OTHER filters applied (BR-05)
  matchedCategoryId: Id.nullable(), // BR-02
});
export type DiscoverResult = z.infer<typeof DiscoverResult>;
```
Note: `cat=,,x` → `['x']` (valid Id shape; unknown ids are dropped later by `normalizeDiscoverQuery`). `cat=,,` → `undefined`.
**Test:** append to `catalog/schemas.test.ts`:
```ts
import { DiscoverQuery } from './schemas';

describe('DiscoverQuery', () => {
  it('defaults for an empty query', () => {
    expect(DiscoverQuery.parse({})).toEqual({ sort: 'rating', page: 1 });
  });
  it('parses a full valid query', () => {
    expect(
      DiscoverQuery.parse({ q: ' plumb ', loc: 'colombo', cat: 'plumbing,electrical', rating: '4', verified: '1', price: '5000', sort: 'reviews', page: '3' }),
    ).toEqual({ q: 'plumb', loc: 'colombo', cat: ['plumbing', 'electrical'], rating: '4', verified: '1', price: '5000', sort: 'reviews', page: 3 });
  });
  it('junk → defaults, no throw', () => {
    expect(DiscoverQuery.parse({ rating: '9', page: '-1', cat: ',,x', sort: 'nearest', verified: 'yes', price: '40', q: '   ', loc: 'bad id!' })).toEqual({
      cat: ['x'],
      sort: 'rating',
      page: 1,
    });
    expect(DiscoverQuery.parse({ cat: ',,' }).cat).toBeUndefined();
    expect(DiscoverQuery.parse({ page: 'abc' }).page).toBe(1);
  });
  it('dedupes cat ids', () => {
    expect(DiscoverQuery.parse({ cat: 'a,a,b' }).cat).toEqual(['a', 'b']);
  });
});
```
(Merge the `describe/expect/it` import with the file's existing one.)
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): DiscoverQuery and DiscoverResult schemas (M06-T1)"`

### T2 — `matchCategory` (BR-02)
- [x] done
**Files:** `packages/contracts/src/search/match.ts`, `packages/contracts/src/search/match.test.ts`, `packages/contracts/src/index.ts`
**Context:** PRODUCT BR-02; ARCH §2.6.
**Do:** create `search/match.ts`:
```ts
export interface NamedCategory {
  id: string;
  name: string;
  order: number;
}

/**
 * BR-02: trimmed, case-insensitive. Equal to a category name → that category.
 * Else a prefix of a category name and ≥ 4 characters → that category (first by `order` if several).
 * Otherwise null (the text is used as free text, BR-03).
 */
export function matchCategory<C extends NamedCategory>(q: string | undefined, categories: readonly C[]): C | null {
  const t = (q ?? '').trim().toLowerCase();
  if (!t) return null;
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  const exact = sorted.find((c) => c.name.toLowerCase() === t);
  if (exact) return exact;
  if (t.length < 4) return null;
  return sorted.find((c) => c.name.toLowerCase().startsWith(t)) ?? null;
}
```
Add `export * from './search/match';` to `index.ts`.
**Test:** `search/match.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { matchCategory } from './match';

const cats = [
  { id: 'plumbing', name: 'Plumbing', order: 1 },
  { id: 'painting', name: 'Painting & Decorating', order: 5 },
  { id: 'appliance', name: 'Appliance Repair', order: 8 },
];

describe('matchCategory (BR-02)', () => {
  it('exact name, any case', () => {
    expect(matchCategory('plumbing', cats)?.id).toBe('plumbing');
    expect(matchCategory('PAINTING & DECORATING', cats)?.id).toBe('painting');
  });
  it('prefix ≥ 4 chars', () => {
    expect(matchCategory('plumb', cats)?.id).toBe('plumbing');
    expect(matchCategory('Appl', cats)?.id).toBe('appliance');
  });
  it('prefix < 4 chars is free text', () => {
    expect(matchCategory('plu', cats)).toBeNull();
    expect(matchCategory('pa', cats)).toBeNull();
  });
  it('trims whitespace', () => {
    expect(matchCategory('  plumb  ', cats)?.id).toBe('plumbing');
  });
  it('non-prefix text and empty input → null', () => {
    expect(matchCategory('leaky tap', cats)).toBeNull();
    expect(matchCategory('lumbing', cats)).toBeNull();
    expect(matchCategory('', cats)).toBeNull();
    expect(matchCategory(undefined, cats)).toBeNull();
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): matchCategory BR-02 (M06-T2)"`

### T3 — `RATING_STEPS`, `PRICE_STEPS`, `normalizeDiscoverQuery`
- [x] done
**Files:** `packages/contracts/src/search/match.ts`, `packages/contracts/src/search/match.test.ts`
**Context:** BR-03/04/05; ARCH §2.6 ("unknown cat/loc ids dropped"), §7.6 (`text` null when BR-02 matches, the category joins `cats`).
**Do:** append to `match.ts`:
```ts
import type { DiscoverQuery } from '../catalog/schemas';

/** BR-05 / SPEC S2.E5. `Any` is the absence of the param. */
export const RATING_STEPS = [
  { value: '3.5', label: '3.5+', min: 3.5 },
  { value: '4', label: '4.0+', min: 4 },
  { value: '4.5', label: '4.5+', min: 4.5 },
] as const;

/** BR-05 / SPEC S2.E7. */
export const PRICE_STEPS = [
  { value: '2000', label: 'Up to LKR 2,000', max: 2000 },
  { value: '5000', label: 'Up to LKR 5,000', max: 5000 },
  { value: '10000', label: 'Up to LKR 10,000', max: 10000 },
] as const;

export interface NormalizedDiscover {
  text: string | null; // BR-03 free text, lowercased; null when empty or a category match
  cats: string[] | null; // known ids only; includes the BR-02 match; null = no category filter
  matchedCategoryId: string | null;
  loc: string | null; // known town id or null
  minRating: number | null;
  verifiedOnly: boolean;
  maxPrice: number | null;
  sort: DiscoverQuery['sort'];
  page: number;
}

export function normalizeDiscoverQuery(
  q: DiscoverQuery,
  catalog: { categories: readonly NamedCategory[]; towns: readonly { id: string }[] },
): NormalizedDiscover {
  const matched = matchCategory(q.q, catalog.categories);
  const known = new Set(catalog.categories.map((c) => c.id));
  const cats = [...new Set([...(q.cat ?? []).filter((id) => known.has(id)), ...(matched ? [matched.id] : [])])];
  const loc = q.loc && catalog.towns.some((t) => t.id === q.loc) ? q.loc : null;
  return {
    text: matched || !q.q ? null : q.q.trim().toLowerCase(),
    cats: cats.length > 0 ? cats : null,
    matchedCategoryId: matched?.id ?? null,
    loc,
    minRating: RATING_STEPS.find((s) => s.value === q.rating)?.min ?? null,
    verifiedOnly: q.verified === '1',
    maxPrice: PRICE_STEPS.find((s) => s.value === q.price)?.max ?? null,
    sort: q.sort,
    page: q.page,
  };
}
```
(Move the `import type` line to the top of the file.)
**Test:** append to `match.test.ts`:
```ts
import { normalizeDiscoverQuery } from './match';
import { DiscoverQuery } from '../catalog/schemas';

const catalog = { categories: cats, towns: [{ id: 'colombo' }, { id: 'dehiwala-mount-lavinia' }] };
const n = (raw: Record<string, string>) => normalizeDiscoverQuery(DiscoverQuery.parse(raw), catalog);

describe('normalizeDiscoverQuery', () => {
  it('category match → cats, no free text', () => {
    expect(n({ q: 'plumb' })).toMatchObject({ text: null, cats: ['plumbing'], matchedCategoryId: 'plumbing' });
  });
  it('free text is lowercased; no cats', () => {
    expect(n({ q: 'Leaky Tap' })).toMatchObject({ text: 'leaky tap', cats: null, matchedCategoryId: null });
  });
  it('drops unknown cat and loc ids', () => {
    expect(n({ cat: 'x,plumbing', loc: 'atlantis' })).toMatchObject({ cats: ['plumbing'], loc: null });
    expect(n({ cat: ',,x' }).cats).toBeNull();
  });
  it('maps rating, verified, price', () => {
    expect(n({ rating: '4.5', verified: '1', price: '2000' })).toMatchObject({ minRating: 4.5, verifiedOnly: true, maxPrice: 2000 });
    expect(n({})).toMatchObject({ minRating: null, verifiedOnly: false, maxPrice: null, sort: 'rating', page: 1 });
  });
  it('union of cat and the matched category, no duplicates', () => {
    expect(n({ q: 'plumbing', cat: 'plumbing,painting' }).cats).toEqual(['plumbing', 'painting']);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): normalizeDiscoverQuery and filter steps (M06-T3)"`

### T4 — `compareProviders` for `reviews` and `town` (BR-06)
- [x] done
**Files:** `packages/contracts/src/search/compare.ts`, `packages/contracts/src/search/compare.test.ts`
**Context:** BR-06; D-4. `selectFeatured` keeps calling `compareProviders('rating')`.
**Do:** replace the top part of `compare.ts` (everything above `export const FEATURED_LIMIT`) with:
```ts
import type { SortKey } from '../common/enums';

export interface RankFields {
  id: string;
  businessName: string;
  rating: number | null;
  reviewCount: number;
  baseTown?: { id: string };
}

type Comparator = (a: RankFields, b: RankFields) => number;

const stable: Comparator = (a, b) => {
  const byName = a.businessName.localeCompare(b.businessName, 'en');
  if (byName !== 0) return byName;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

const ratingOf = (p: RankFields) => (p.reviewCount > 0 ? p.rating : null);

/** Top rated: rating desc, ties by review count desc, no reviews last, then name, then id. */
const byRating: Comparator = (a, b) => {
  const ar = ratingOf(a);
  const br = ratingOf(b);
  if (ar === null && br !== null) return 1;
  if (br === null && ar !== null) return -1;
  if (ar !== null && br !== null && ar !== br) return br - ar;
  if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount;
  return stable(a, b);
};

/** Most reviews: review count desc, ties by Top rated (which puts no-review providers last). */
const byReviews: Comparator = (a, b) => (a.reviewCount !== b.reviewCount ? b.reviewCount - a.reviewCount : byRating(a, b));

/** BR-06. `town` puts providers based in `loc` first, each group Top rated; without `loc` it is Top rated. */
export function compareProviders(sort: SortKey, loc?: string | null): Comparator {
  if (sort === 'reviews') return byReviews;
  if (sort === 'town' && loc) {
    return (a, b) => {
      const ag = a.baseTown?.id === loc ? 0 : 1;
      const bg = b.baseTown?.id === loc ? 0 : 1;
      return ag !== bg ? ag - bg : byRating(a, b);
    };
  }
  return byRating;
}
```
Keep `FEATURED_LIMIT` and `selectFeatured` unchanged.
**Test:** in `compare.test.ts` change helper `p` to accept a town and add cases:
```ts
const p = (id: string, rating: number | null, reviewCount: number, verified = true, town = 'colombo') => ({
  id,
  businessName: id.toUpperCase(),
  rating,
  reviewCount,
  verified,
  baseTown: { id: town },
});

describe('compareProviders(reviews)', () => {
  it('review count desc, ties by rating, no reviews last', () => {
    const list = [p('a', null, 0), p('b', 4.2, 30), p('c', 4.9, 30), p('d', 5, 3)];
    expect(list.sort(compareProviders('reviews')).map((x) => x.id)).toEqual(['c', 'b', 'd', 'a']);
  });
  it('full ties fall back to name', () => {
    expect([p('z', 4, 1), p('m', 4, 1)].sort(compareProviders('reviews')).map((x) => x.id)).toEqual(['m', 'z']);
  });
});

describe('compareProviders(town)', () => {
  const list = () => [p('a', 4.9, 10, true, 'colombo'), p('b', 4.1, 5, true, 'dehiwala'), p('c', null, 0, true, 'dehiwala'), p('d', 4.5, 8, true, 'colombo')];
  it('based-in-town first, each group Top rated, no reviews last within group', () => {
    expect(list().sort(compareProviders('town', 'dehiwala')).map((x) => x.id)).toEqual(['b', 'c', 'a', 'd']);
  });
  it('without loc equals Top rated', () => {
    expect(list().sort(compareProviders('town')).map((x) => x.id)).toEqual(list().sort(compareProviders('rating')).map((x) => x.id));
    expect(list().sort(compareProviders('town', null)).map((x) => x.id)).toEqual(['a', 'd', 'b', 'c']);
  });
});

describe('compareProviders(rating) ties', () => {
  it('rating 0-review provider with a stale rating value still sorts last', () => {
    expect([p('a', 5, 0), p('b', 3, 1)].sort(compareProviders('rating')).map((x) => x.id)).toEqual(['b', 'a']);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green (old cases still pass); `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): compareProviders reviews and town sorts (M06-T4)"`

### T5 — `providers_search` endpoint entry
- [x] done
**Files:** `packages/contracts/src/endpoints.ts`, `packages/contracts/src/endpoints.test.ts`
**Context:** ARCH §3.2 row `GET /providers` (Pub, DiscoverQuery → DiscoverResult, refs F-06 F-07 F-08 S2).
**Do:** extend the catalog import to `import { CatalogResponse, DiscoverQuery, DiscoverResult, ProviderCard } from './catalog/schemas';` and add after `providers_featured`:
```ts
  providers_search: {
    id: 'providers_search',
    domain: 'catalog',
    method: 'GET',
    path: '/providers',
    access: ['public'],
    owner: 'none',
    query: DiscoverQuery,
    response: DiscoverResult,
    refs: ['F-06', 'F-07', 'F-08', 'S2'],
  },
```
**Test:** add to `endpoints.test.ts`:
```ts
  it('M06 discover row matches ARCHITECTURE §3.2', () => {
    expect(ENDPOINTS.providers_search).toMatchObject({ method: 'GET', path: '/providers', access: ['public'], domain: 'catalog', owner: 'none' });
  });
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green (the web "every handler maps to a registry entry" test, if present, still passes — the handler comes in T7).
**Commit:** `git commit -m "feat(contracts): GET /providers endpoint entry (M06-T5)"`

### T6 — Mock search engine `discoverSearch`
- [x] done
**Files:** `src/mocks/lib/discover.ts`, `src/mocks/lib/discover.test.ts`
**Context:** BR-01…BR-07, ARCH §7.6 (base = all filters except category; counts from base; total and page with categories); D-3. Reuse `listedCards`, `isListed` from `mocks/lib/cards.ts`.
**Do:** create `discover.ts`:
```ts
import {
  compareProviders,
  normalizeDiscoverQuery,
  PAGE_SIZE,
  type DiscoverQuery,
  type DiscoverResult,
  type ProviderCard,
} from '@fixit/contracts';
import type { MockDb } from '../db/schema';
import { listedCards } from './cards';

/** Mock stand-in for M16's SearchService (ARCH §7.6). Pure over the db snapshot. */
export function discoverSearch(d: MockDb, query: DiscoverQuery): DiscoverResult {
  const activeCats = d.categories.filter((c) => c.active);
  const activeTowns = d.towns.filter((t) => t.active);
  const n = normalizeDiscoverQuery(query, { categories: activeCats, towns: activeTowns });

  const serviceNames = new Map<string, string[]>();
  for (const s of Object.values(d.services)) {
    serviceNames.set(s.providerId, [...(serviceNames.get(s.providerId) ?? []), s.name]);
  }
  const servesTown = (providerId: string, townId: string) =>
    d.areas.some((a) => a.providerId === providerId && a.townId === townId);

  const matchesText = (c: ProviderCard) => {
    if (n.text === null) return true;
    const hay = [c.businessName, c.category.name, ...(serviceNames.get(c.id) ?? [])].join(' ').toLowerCase();
    return hay.includes(n.text); // BR-03
  };

  // base: every filter except category (BR-05 counts)
  const base = listedCards(d).filter(
    (c) =>
      matchesText(c) &&
      (n.loc === null || servesTown(c.id, n.loc)) && // BR-04
      (n.minRating === null || (c.reviewCount > 0 && c.rating !== null && c.rating >= n.minRating)) &&
      (!n.verifiedOnly || c.verified) &&
      (n.maxPrice === null || c.startingPrice.amount <= n.maxPrice),
  );

  const categoryCounts: Record<string, number> = {};
  for (const cat of activeCats) categoryCounts[cat.id] = base.filter((c) => c.category.id === cat.id).length;

  const cats = n.cats;
  const filtered = (cats === null ? base : base.filter((c) => cats.includes(c.category.id))).sort(
    compareProviders(n.sort, n.loc),
  );

  const pageSize = PAGE_SIZE.discover;
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const page = Math.min(n.page, Math.max(totalPages, 1)); // beyond last → last
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total,
    totalPages,
    categoryCounts,
    matchedCategoryId: n.matchedCategoryId,
  };
}
```
If `FxTown`/`FxCategory` have no `active` field, STOP and write a blocker (catalog handler uses `.active`, so it should exist).
**Test:** `discover.test.ts` (uses the seeded mock db; `db()` is reset per test by `setup.ts` as in `catalog.test.ts`):
```ts
import { describe, expect, it } from 'vitest';
import { DiscoverQuery, compareProviders, type DiscoverResult } from '@fixit/contracts';
import { db } from '../db/store';
import { listedCards } from './cards';
import { discoverSearch } from './discover';

const run = (raw: Record<string, string>): DiscoverResult => discoverSearch(db(), DiscoverQuery.parse(raw));

/** Adds `count` listed clones of p01 (same category/town/services area) for paging tests. */
function addClones(count: number) {
  const d = db();
  const src = d.providers.p01;
  if (!src) throw new Error('fixture p01 missing');
  for (let i = 0; i < count; i++) {
    const id = `px${String(i)}`;
    d.providers[id] = { ...src, id, businessName: `Clone ${String(i).padStart(2, '0')}` };
    d.areas.push({ providerId: id, townId: src.baseTownId ?? 'colombo', isBase: true });
  }
}

describe('discoverSearch', () => {
  it('no filters: all listed providers, Top rated order', () => {
    const r = run({});
    const all = listedCards(db()).sort(compareProviders('rating'));
    expect(r.total).toBe(all.length);
    expect(r.items.map((c) => c.id)).toEqual(all.slice(0, 10).map((c) => c.id));
    expect(r.matchedCategoryId).toBeNull();
  });
  it('BR-02: q=plumb filters by Plumbing and reports the match', () => {
    const r = run({ q: 'plumb' });
    expect(r.matchedCategoryId).toBe('plumbing');
    expect(r.items.length).toBeGreaterThan(0);
    for (const c of r.items) expect(c.category.id).toBe('plumbing');
  });
  it('BR-03: free text matches business, category or service names', () => {
    const r = run({ q: 'sparkle' });
    expect(r.items.map((c) => c.businessName)).toContain('Sparkle & Shine Cleaners');
    expect(run({ q: 'zzzz-nothing' }).total).toBe(0);
  });
  it('BR-04: loc matches service areas', () => {
    const d = db();
    const r = run({ loc: 'dehiwala-mount-lavinia' });
    for (const c of r.items) expect(d.areas.some((a) => a.providerId === c.id && a.townId === 'dehiwala-mount-lavinia')).toBe(true);
  });
  it('BR-05: categories OR; counts ignore the category filter but respect others', () => {
    const r = run({ cat: 'plumbing,cleaning', verified: '1' });
    for (const c of r.items) expect(['plumbing', 'cleaning']).toContain(c.category.id);
    for (const c of r.items) expect(c.verified).toBe(true);
    const noCat = run({ verified: '1' });
    expect(r.categoryCounts).toEqual(noCat.categoryCounts);
    const sum = Object.values(noCat.categoryCounts).reduce((a, b) => a + b, 0);
    expect(sum).toBe(noCat.total);
  });
  it('BR-05: min rating excludes providers with no reviews', () => {
    for (const c of run({ rating: '3.5' }).items) expect(c.reviewCount).toBeGreaterThan(0);
  });
  it('BR-05: price step on starting price', () => {
    for (const c of run({ price: '2000' }).items) expect(c.startingPrice.amount).toBeLessThanOrEqual(2000);
  });
  it('BR-06: reviews sort', () => {
    const ids = run({ sort: 'reviews' }).items.map((c) => c.id);
    expect(ids).toEqual(listedCards(db()).sort(compareProviders('reviews')).slice(0, 10).map((c) => c.id));
  });
  it('unknown ids dropped, junk tolerated', () => {
    expect(run({ cat: ',,x', loc: 'atlantis', rating: '9', page: '-1' }).total).toBe(run({}).total);
  });
  it('pages of 10; beyond last page returns the last page', () => {
    addClones(15);
    const r1 = run({});
    expect(r1.totalPages).toBe(Math.ceil(r1.total / 10));
    expect(r1.items).toHaveLength(10);
    const last = run({ page: '99' });
    expect(last.page).toBe(r1.totalPages);
    expect(last.items.length).toBe(r1.total - (r1.totalPages - 1) * 10);
  });
  it('0 results → page 1, totalPages 0', () => {
    expect(run({ q: 'zzzz-nothing' })).toMatchObject({ total: 0, totalPages: 0, page: 1, items: [] });
  });
});
```
If `FxProvider` spread trips TypeScript (e.g. `id` is a branded type), adjust the clone object only; do not change fixtures.
**Verify:** `pnpm --filter @fixit/web test -- discover` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock discover search engine (M06-T6)"`

### T7 — `GET /providers` MSW handler
- [ ] done
**Files:** `src/mocks/handlers/catalog.ts`, `src/mocks/handlers/catalog.test.ts`
**Context:** ARCH §4.3 (`mockEndpoint` parses `query` with the registry schema, applies access, honours forced errors).
**Do:** in `catalog.ts` import `discoverSearch` from `'../lib/discover'` and add as the **last** array entry:
```ts
  mockEndpoint(E.providers_search, ({ db: d, query }) => discoverSearch(d, query)),
```
If `query` is typed `undefined | DiscoverQuery`, write `({ db: d, query }) => discoverSearch(d, E.providers_search.query.parse(query ?? {}))` — no casts.
**Test:** append to `catalog.test.ts`:
```ts
import { DiscoverResult } from '@fixit/contracts';

describe('GET /providers', () => {
  it('returns a DiscoverResult for a guest', async () => {
    const res = await get('/providers?q=plumb&loc=dehiwala-mount-lavinia');
    expect(res.status).toBe(200);
    const r = DiscoverResult.parse(await res.json());
    expect(r.matchedCategoryId).toBe('plumbing');
  });
  it('junk params → 200 with defaults', async () => {
    const res = await get('/providers?rating=9&page=-1&cat=,,x');
    expect(res.status).toBe(200);
    expect(DiscoverResult.parse(await res.json()).page).toBe(1);
  });
  it('honours a DevPanel forced 500', async () => {
    armForcedError('providers_search', '500');
    expect((await get('/providers')).status).toBe(500);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- catalog` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): GET /providers mock handler (M06-T7)"`

### T8 — Query key, api and `useDiscover` hook
- [ ] done
**Files:** `src/lib/query-keys.ts`, `src/features/discover/api.ts`, `src/features/discover/hooks.ts`, `src/features/discover/hooks.test.tsx`
**Context:** ARCH §4.2; D-5. `api.ts` needs `writeDiscover`, so this task creates `url-state.ts` with only `readDiscover` and `writeDiscover`; T9 replaces it with the full file.
**Do:**
1. `query-keys.ts`: add `import type { DiscoverQuery } from '@fixit/contracts';` and the key `discover: (q: DiscoverQuery) => ['catalog', 'discover', q] as const,`.
2. `api.ts`:
```ts
import { ENDPOINTS as E, type DiscoverQuery, type DiscoverResult } from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';
import { writeDiscover } from './url-state';

export const fetchDiscover = (q: DiscoverQuery): Promise<DiscoverResult> => {
  const qs = writeDiscover(q).toString();
  return http(`${pathOf(E.providers_search)}${qs ? `?${qs}` : ''}`, { schema: E.providers_search.response });
};
```
3. Create `src/features/discover/url-state.ts` containing only the imports `DiscoverQuery` from `@fixit/contracts` and the two functions `readDiscover` and `writeDiscover`, copied exactly from the T9 code block. Add `src/features/discover/url-state.ts` to this commit.
4. `hooks.ts`:
```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DiscoverQuery } from '@fixit/contracts';
import { qk } from '@/lib/query-keys';
import { fetchDiscover } from './api';

/** Results for the URL state. Keeps the previous result while a new one loads (D-5). */
export const useDiscover = (q: DiscoverQuery) =>
  useQuery({ queryKey: qk.discover(q), queryFn: () => fetchDiscover(q), placeholderData: keepPreviousData });
```
**Test:** `hooks.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { DiscoverQuery } from '@fixit/contracts';
import { createWrapper } from '@/test/render';
import { armForcedError } from '@/mocks/lib/controls';
import { useDiscover } from './hooks';

describe('useDiscover', () => {
  it('loads results through the mock', async () => {
    const { result } = renderHook(() => useDiscover(DiscoverQuery.parse({ q: 'plumb' })), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.matchedCategoryId).toBe('plumbing');
  });
  it('surfaces a forced 500 as an error', async () => {
    armForcedError('providers_search', '500');
    const { result } = renderHook(() => useDiscover(DiscoverQuery.parse({})), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- discover` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): useDiscover hook and query key (M06-T8)"`

### T9 — URL state helper `url-state.ts`
- [ ] done
**Files:** `src/features/discover/url-state.ts`, `src/features/discover/url-state.test.tsx`
**Context:** ARCH §5.4; SPEC §8.2; D-1, D-2; S2 phone toolbar badge count rule.
**Do:** full file:
```ts
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { DiscoverQuery, matchCategory, type Category } from '@fixit/contracts';

export function readDiscover(sp: URLSearchParams): DiscoverQuery {
  return DiscoverQuery.parse(Object.fromEntries(sp)); // invalid → defaults (.catch)
}

/** Canonical URL params: defaults omitted. */
export function writeDiscover(s: Partial<DiscoverQuery>): URLSearchParams {
  const out = new URLSearchParams();
  if (s.q) out.set('q', s.q);
  if (s.loc) out.set('loc', s.loc);
  if (s.cat?.length) out.set('cat', s.cat.join(','));
  if (s.rating) out.set('rating', s.rating);
  if (s.verified) out.set('verified', '1');
  if (s.price) out.set('price', s.price);
  if (s.sort && s.sort !== 'rating') out.set('sort', s.sort);
  if (s.page && s.page > 1) out.set('page', String(s.page));
  return out;
}

/** D-2: categories shown ticked = cat ∪ the BR-02 match of q. */
export function tickedCategories(state: DiscoverQuery, categories: readonly Category[]): string[] {
  const m = matchCategory(state.q, categories);
  return [...new Set([...(state.cat ?? []), ...(m ? [m.id] : [])])];
}

/** S2 phone toolbar badge: 1 per ticked category + 1 each for loc, rating, verified, price. */
export function appliedFilterCount(state: DiscoverQuery, categories: readonly Category[]): number {
  return (
    tickedCategories(state, categories).length +
    (state.loc ? 1 : 0) +
    (state.rating ? 1 : 0) +
    (state.verified ? 1 : 0) +
    (state.price ? 1 : 0)
  );
}

export type DiscoverPatch = Partial<Pick<DiscoverQuery, 'loc' | 'cat' | 'rating' | 'verified' | 'price' | 'sort'>>;

/** Pure next-state functions (unit-tested); the hook only wires them to the router. */
export const next = {
  newSearch(state: DiscoverQuery, q: string, loc: string | undefined, categories: readonly Category[]) {
    const t = q.trim();
    const m = matchCategory(t, categories);
    return writeDiscover({ q: t || undefined, loc: loc || undefined, cat: m ? [m.id] : undefined, sort: state.sort });
  },
  setFilter(state: DiscoverQuery, patch: DiscoverPatch, categories: readonly Category[]) {
    const clearQ = 'cat' in patch && state.q !== undefined && matchCategory(state.q, categories) !== null;
    return writeDiscover({ ...state, ...patch, ...(clearQ ? { q: undefined } : {}), page: 1 });
  },
  setPage(state: DiscoverQuery, page: number) {
    return writeDiscover({ ...state, page });
  },
};

export function useDiscoverParams(categories: readonly Category[]) {
  const [sp, setSp] = useSearchParams();
  const state = useMemo(() => readDiscover(sp), [sp]);
  return {
    state,
    /** Search bar submit: PUSH (SPEC §8.2). */
    newSearch: (q: string, loc: string | undefined) => {
      setSp(next.newSearch(state, q, loc, categories));
    },
    /** Filters, sort, location: REPLACE, page → 1. */
    setFilter: (patch: DiscoverPatch) => {
      setSp(next.setFilter(state, patch, categories), { replace: true });
    },
    /** Toggle one category row (D-2). */
    toggleCategory: (id: string) => {
      const ticked = tickedCategories(state, categories);
      const cat = ticked.includes(id) ? ticked.filter((x) => x !== id) : [...ticked, id];
      setSp(next.setFilter(state, { cat }, categories), { replace: true });
    },
    hrefForPage: (page: number) => {
      const s = next.setPage(state, page).toString();
      return s ? `/discover?${s}` : '/discover';
    },
    clearAll: () => {
      setSp(new URLSearchParams(), { replace: true });
    },
  };
}
```
Note: `setFilter({ cat: [] })` writes no `cat` (empty arrays are omitted by `writeDiscover`). `setFilter` with `loc: undefined` removes `loc` because the spread overwrites it.
**Test:** `url-state.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import type { Category } from '@fixit/contracts';
import { appliedFilterCount, next, readDiscover, tickedCategories, writeDiscover } from './url-state';

const cats: Category[] = [
  { id: 'plumbing', name: 'Plumbing', blurb: '', icon: 'plumbing', order: 1 },
  { id: 'electrical', name: 'Electrical', blurb: '', icon: 'electrical', order: 2 },
];
const read = (s: string) => readDiscover(new URLSearchParams(s));

describe('url-state', () => {
  it('round trip is canonical', () => {
    const s = 'q=leak&loc=colombo&cat=plumbing%2Celectrical&rating=4&verified=1&price=5000&sort=reviews&page=2';
    expect(writeDiscover(read(s)).toString()).toBe(s);
    expect(writeDiscover(read('sort=rating&page=1')).toString()).toBe('');
  });
  it('junk renders defaults', () => {
    expect(read('rating=9&page=-1&cat=,,x')).toEqual({ cat: ['x'], sort: 'rating', page: 1 });
  });
  it('new search: q, loc, derived cat; drops rating/verified/price/page; keeps sort (D-1)', () => {
    const state = read('q=leak&cat=electrical&rating=4&verified=1&price=2000&sort=reviews&page=3');
    expect(next.newSearch(state, ' plumb ', 'colombo', cats).toString()).toBe('q=plumb&loc=colombo&cat=plumbing&sort=reviews');
    expect(next.newSearch(state, 'tap', undefined, cats).toString()).toBe('q=tap&sort=reviews');
  });
  it('filter change resets page; sort change resets page', () => {
    const state = read('loc=colombo&page=4');
    expect(next.setFilter(state, { rating: '4.5' }, cats).toString()).toBe('loc=colombo&rating=4.5');
    expect(next.setFilter(state, { sort: 'town' }, cats).toString()).toBe('loc=colombo&sort=town');
  });
  it('ticking a category clears q when q was a category match', () => {
    const state = read('q=plumb');
    expect(tickedCategories(state, cats)).toEqual(['plumbing']);
    expect(next.setFilter(state, { cat: ['plumbing', 'electrical'] }, cats).toString()).toBe('cat=plumbing%2Celectrical');
    expect(next.setFilter(read('q=tap'), { cat: ['electrical'] }, cats).toString()).toBe('q=tap&cat=electrical');
  });
  it('page change keeps filters', () => {
    expect(next.setPage(read('cat=plumbing'), 2).toString()).toBe('cat=plumbing&page=2');
  });
  it('badge count', () => {
    expect(appliedFilterCount(read('q=plumb&cat=electrical&loc=colombo&rating=4&verified=1&price=2000'), cats)).toBe(6);
    expect(appliedFilterCount(read('q=tap&sort=reviews'), cats)).toBe(0);
  });
});
```
(If `icon: 'plumbing'` is not a valid `CategoryIcon` value, use the value from `packages/fixtures/src/catalog.ts`.)
**Verify:** `pnpm --filter @fixit/web test -- url-state` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): discover URL state helper (M06-T9)"`

### T10 — Last Discover URL in session
- [ ] done
**Files:** `src/lib/last-discover.ts`, `src/lib/last-discover.test.ts`
**Context:** SPEC §8.2 "Back to results"; ARCH §5.4; D-7.
**Do:**
```ts
const KEY = 'fixit.lastDiscover';

/** Called by Discover on every URL change. `search` is `location.search` ('' or '?…'). */
export function rememberDiscover(search: string): void {
  try {
    sessionStorage.setItem(KEY, `/discover${search}`);
  } catch {
    // storage disabled: back links fall back to /discover
  }
}

/** For S3 "Back to results" and S13 "Back to search". */
export function lastDiscoverUrl(): string {
  try {
    const v = sessionStorage.getItem(KEY);
    return v?.startsWith('/discover') ? v : '/discover';
  } catch {
    return '/discover';
  }
}
```
**Test:**
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { lastDiscoverUrl, rememberDiscover } from './last-discover';

describe('last-discover', () => {
  beforeEach(() => sessionStorage.clear());
  it('defaults to /discover', () => expect(lastDiscoverUrl()).toBe('/discover'));
  it('stores the last search', () => {
    rememberDiscover('?q=plumb');
    expect(lastDiscoverUrl()).toBe('/discover?q=plumb');
  });
  it('ignores a tampered value', () => {
    sessionStorage.setItem('fixit.lastDiscover', 'https://evil.example');
    expect(lastDiscoverUrl()).toBe('/discover');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- last-discover` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): remember last discover URL (M06-T10)"`

### T11 — Results copy helpers
- [ ] done
**Files:** `src/features/discover/copy.ts`, `src/features/discover/copy.test.ts`
**Context:** S2.E8 copy; D-8.
**Do:**
```ts
import type { CatalogResponse, DiscoverQuery } from '@fixit/contracts';
import { tickedCategories } from './url-state';

export const resultsTitle = (n: number) => (n === 1 ? '1 provider found' : `${String(n)} providers found`);
export const showCountLabel = (n: number) => (n === 1 ? 'Show 1 provider' : `Show ${String(n)} providers`);

/** `Showing {label} in {Town | all locations}` (S2.E8). */
export function contextLine(state: DiscoverQuery, catalog: CatalogResponse): string {
  const ticked = tickedCategories(state, catalog.categories);
  const freeText = state.q && ticked.length === 0 ? state.q : null;
  let label = 'all services';
  if (ticked.length === 1) label = catalog.categories.find((c) => c.id === ticked[0])?.name ?? 'all services';
  else if (ticked.length > 1) label = `${String(ticked.length)} categories`;
  else if (freeText) label = `“${freeText}”`;
  const town = catalog.towns.find((t) => t.id === state.loc)?.name ?? 'all locations';
  return `Showing ${label} in ${town}`;
}
```
Note: `tickedCategories` may include unknown ids from the URL; filter them: replace the first line in the function body with `const ticked = tickedCategories(state, catalog.categories).filter((id) => catalog.categories.some((c) => c.id === id));`.
**Test:**
```ts
import { describe, expect, it } from 'vitest';
import { DiscoverQuery, type CatalogResponse } from '@fixit/contracts';
import { contextLine, resultsTitle, showCountLabel } from './copy';

const catalog: CatalogResponse = {
  categories: [
    { id: 'plumbing', name: 'Plumbing', blurb: '', icon: 'plumbing', order: 1 },
    { id: 'cleaning', name: 'Cleaning', blurb: '', icon: 'cleaning', order: 2 },
  ],
  districts: [{ id: 'colombo', name: 'Colombo', order: 1 }],
  towns: [{ id: 'dehiwala-mount-lavinia', name: 'Dehiwala-Mount Lavinia', districtId: 'colombo' }],
};
const ctx = (raw: Record<string, string>) => contextLine(DiscoverQuery.parse(raw), catalog);

describe('discover copy', () => {
  it('titles', () => {
    expect(resultsTitle(1)).toBe('1 provider found');
    expect(resultsTitle(0)).toBe('0 providers found');
    expect(showCountLabel(4)).toBe('Show 4 providers');
  });
  it('context line variants', () => {
    expect(ctx({ q: 'plumb', loc: 'dehiwala-mount-lavinia' })).toBe('Showing Plumbing in Dehiwala-Mount Lavinia');
    expect(ctx({ cat: 'plumbing,cleaning' })).toBe('Showing 2 categories in all locations');
    expect(ctx({ q: 'leaky tap' })).toBe('Showing “leaky tap” in all locations');
    expect(ctx({})).toBe('Showing all services in all locations');
    expect(ctx({ cat: 'x' })).toBe('Showing all services in all locations');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- copy` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): discover results copy helpers (M06-T11)"`

### T12 — `ResultCard` (S2.E10)
- [ ] done
**Files:** `src/features/discover/components/result-card.tsx`
**Context:** S2.E10, S2 phone item 5; 04-discover-plumbing-austin-desktop.png, the card at right (photo 132, name + badge, stars row, meta row, bio, right column price + `View profile` separated by a vertical divider). Reuse `CategoryIcon`, `Stars`, `StatusPill` (`kind: 'trust'`, `kind: 'availability'`), `priceParts`, `Button`. BR-07: no distance.
**Do:** skeleton (fill the markup exactly with these classes):
```tsx
import { Award, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import type { ProviderCard } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { Stars } from '@/components/stars';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { priceParts } from '@/lib/format';

export function ResultCard({ provider: p }: { provider: ProviderCard }) {
  const price = priceParts(p.startingPrice.amount, p.startingPrice.unit);
  const href = `/providers/${p.id}`;
  return (
    <article className="border-border bg-surface hover:border-border-strong hover:shadow-hover flex flex-col gap-3 rounded-xl border p-4 transition sm:flex-row sm:gap-5 sm:p-5">
      {/* phone: 72 photo beside name block; sm+: 132 photo column */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:gap-5">
        <div className="flex gap-3 sm:contents">
          {/* Photo: size-[72px] rounded-md sm:size-[132px] sm:rounded-lg shrink-0 overflow-hidden.
              photoUrl → <img alt="" className="size-full object-cover" />;
              null → bg-primary-soft text-primary grid place-items-center + <CategoryIcon icon={p.category.icon} className="size-8 sm:size-12" /> */}
          {/* Name block (phone: beside photo; sm+: top of the middle column via sm:contents + order):
              <h3 className="text-title-sm text-text"><Link to={href} className="hover:text-primary focus-visible:ring-primary rounded-xs focus-visible:outline-none focus-visible:ring-2">{p.businessName}</Link></h3>
              badges row "flex flex-wrap items-center gap-2":
                <StatusPill kind="trust" verified={p.verified} compact />
                {p.paused && <StatusPill kind="availability" compact />}
              rating row:
                p.reviewCount > 0
                  ? <Stars rating={p.rating} count={p.reviewCount} size={14} />  (text "({n} reviews)": render
                    <span className="text-meta text-text-subtle">({p.reviewCount} reviews)</span> after Stars with showValue
                    kept; if Stars already prints "(n)", pass showValue={false} and print `{rating}` 14/700 + `({n} reviews)` yourself)
                  : <span className="flex items-center gap-2"><span className="bg-primary-soft text-primary text-caption rounded-full px-2.5 py-0.5 font-bold">New</span><span className="text-label text-text-subtle">No reviews yet</span></span> */}
        </div>
        {/* meta row: <ul className="text-label text-text-muted flex flex-wrap gap-x-4 gap-y-1">
              <li className="flex items-center gap-1.5"><CategoryIcon icon={p.category.icon} className="text-icon-subtle size-4" aria-hidden />{p.category.name}</li>
              <li ...><MapPin aria-hidden="true" className="text-icon-subtle size-4" />{p.baseTown.name}</li>
              <li ...><Award aria-hidden="true" className="text-icon-subtle size-4" />{p.yearsExperience} yrs experience</li></ul>
            bio: <p className="text-body-sm text-text-subtle line-clamp-2">{p.bio}</p> */}
      </div>
      {/* Price column:
          phone: "border-border flex items-center justify-between gap-3 border-t pt-3"
          sm+:   "sm:w-[150px] sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"
          left/top: <div className="flex flex-col sm:items-end"><span className="text-meta text-text-subtle">Starting at</span>
                    <span className="whitespace-nowrap"><span className="text-price-lg text-text">{price.amount}</span><span className="text-meta text-text-subtle font-medium">{price.suffix}</span></span></div>
          button: <Button asChild variant="outline" size="md" className="h-11"><Link to={href} aria-label={`View profile: ${p.businessName}`}>View profile</Link></Button> */}
    </article>
  );
}
```
Rules: no hover-only info; the whole card is not a link (name + button are). If `text-price-lg` / `text-title-sm` tokens don't exist in `globals.css`, use `text-title-md font-extrabold` / `text-title-xs` and note it in the commit body (don't add tokens). Desktop column order: photo | name+badges+rating+meta+bio | price. With `sm:contents` the name block must render in the middle column above the meta row — if `contents` makes this awkward, render the name block twice is **not** allowed; instead use a CSS grid: `grid grid-cols-[72px_minmax(0,1fr)] gap-3 sm:grid-cols-[132px_minmax(0,1fr)_auto] sm:gap-5` with photo `sm:row-span-2`, name block col 2, meta+bio `col-span-2 sm:col-span-1 sm:col-start-2`, price `col-span-2 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1`. Prefer this grid version.
States: verified / not verified / paused / 0 reviews / no photo — all from props.
**Verify:** `pnpm verify` green. Visual check comes at Checkpoint 2.
**Commit:** `git commit -m "feat(web): discover result card (M06-T12)"`

### T13 — Filter groups (S2.E3–E7)
- [ ] done
**Files:** `src/features/discover/components/filter-groups.tsx`
**Context:** S2.E3–E7 copy/states; 04-discover desktop left panel; §2.9 Checkbox row, Option row, Toggle. Reuse `components/ui/checkbox`, `components/ui/switch`, `Stars` (showValue false). Phone rows 44 high.
**Do:** one component used by the desktop panel and the sheet:
```tsx
import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { PRICE_STEPS, RATING_STEPS, type CatalogResponse, type DiscoverQuery } from '@fixit/contracts';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Stars } from '@/components/stars';
import { cn } from '@/lib/utils';
import type { DiscoverPatch } from '../url-state';

interface FilterGroupsProps {
  catalog: CatalogResponse;
  state: DiscoverQuery;
  ticked: string[];
  counts: Record<string, number> | undefined; // undefined while the first result loads or on error → hide numbers
  onToggleCategory: (id: string) => void;
  onChange: (patch: DiscoverPatch) => void;
}
```
Layout: root `flex flex-col divide-y divide-border` with each group `flex flex-col gap-3 py-6 first:pt-0 last:pb-0`.
1. **Service category** — `<fieldset>`, `<legend className="text-label text-text font-bold">Service category</legend>`. One `<label>` per `catalog.categories` row: `flex min-h-11 items-center gap-3 sm:min-h-9 cursor-pointer`; `<Checkbox checked={ticked.includes(c.id)} onCheckedChange={() => onToggleCategory(c.id)} />`; name `text-body-sm flex-1` coloured `text-text` or `text-text-subtle` when `counts?.[c.id] === 0`; count `text-meta text-text-subtle tabular-nums` (render only when `counts` defined).
2. **Location** — `<label>` `Location` (text-label bold) + native `<select>` in a `relative` wrapper: `border-border bg-surface text-body text-text sm:text-body-sm h-12 w-full appearance-none rounded-md border-2 px-3 pr-9 focus-visible:border-primary focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-2`; first option `All locations` (value ''), then `<optgroup label={district.name}>` per district with its towns (same as `HeroSearch`). `onChange={(e) => onChange({ loc: e.target.value || undefined })}`; `ChevronDown` at `pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-text-muted`.
3. **Minimum rating** — `role="radiogroup"` with `aria-labelledby` the label `Minimum rating`. Options: `Any` (value undefined) then `RATING_STEPS`. Each is a `<button type="button" role="radio" aria-checked>`: `flex h-11 sm:h-[38px] items-center justify-between rounded-sm border-2 px-3`; selected `border-primary bg-primary-soft`, else `border-border bg-surface`. Left: `<Stars rating={floor} count={1} showValue={false} size={13} />` where floor = `Math.floor(step.min)` (Any → `rating={null} count={0}`, all empty); right: label `text-meta text-text font-bold`. Click → `onChange({ rating: step?.value })`. Arrow keys not required (each is a button in tab order).
4. **Verified** — the whole row is the switch (SPEC §9): `<label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">` with text block `Verified providers only` (text-label text-text font-bold) / `ID checked by Fixit` (text-meta text-text-subtle) and `<Switch checked={state.verified === '1'} onCheckedChange={(on) => onChange({ verified: on ? '1' : undefined })} aria-label="Verified providers only" />`.
5. **Starting price** — header row: label `Starting price` + right `text-label text-primary font-semibold` = selected step label or `Any price`. Options as group 3 (radio buttons, no stars): `Any price` then `PRICE_STEPS` labels. Click → `onChange({ price: step?.value })`.
All copy exactly as SPEC S2.E3–E7.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): discover filter groups (M06-T13)"`

### T14 — Desktop filter panel (S2.E2)
- [ ] done
**Files:** `src/features/discover/components/filter-panel.tsx`
**Context:** S2 desktop layout item 2; 04-discover desktop, left panel. Visible only `lg` and up.
**Do:**
```tsx
export function FilterPanel(props: FilterGroupsProps & { onClearAll: () => void }) {
  return (
    <aside aria-label="Filters" className="border-border bg-surface sticky top-24 hidden flex-col gap-6 self-start rounded-2xl border p-6 lg:flex">
      <div className="flex items-center justify-between">
        <h2 className="text-lead text-text font-extrabold">Filters</h2>
        <Button variant="link" size="inline" onClick={props.onClearAll}>Clear all</Button>
      </div>
      <FilterGroups {...props} />
    </aside>
  );
}
```
Export `FilterGroupsProps` from `filter-groups.tsx` for this.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): discover desktop filter panel (M06-T14)"`

### T15 — Filters sheet and phone/tablet toolbar
- [ ] done
**Files:** `src/features/discover/components/filters-sheet.tsx`
**Context:** S2 phone items 3–4; §2.9 Bottom sheet; §6.10; AC6. Reuse `components/ui/sheet` (don't fork it: pass classes via `className`), `useMediaQuery(MQ.sm)`, `appliedFilterCount`, `showCountLabel`.
**Do:**
```tsx
import { SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MQ, useMediaQuery } from '@/lib/use-media-query';
import { FilterGroups, type FilterGroupsProps } from './filter-groups';
import { showCountLabel } from '../copy';

interface FiltersSheetProps extends FilterGroupsProps {
  badge: number;          // appliedFilterCount
  total: number | undefined; // live count; undefined while loading → button shows `Show providers`
  onClearAll: () => void;
}

export function FiltersSheet({ badge, total, onClearAll, ...groups }: FiltersSheetProps) {
  const tablet = useMediaQuery(MQ.sm);
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="h-11 w-full">
          <SlidersHorizontal aria-hidden="true" className="size-5" />
          Filters
          {badge > 0 && (
            <span className="bg-primary text-primary-foreground text-caption grid size-5 place-items-center rounded-full font-extrabold" aria-label={`${String(badge)} applied`}>
              {badge}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side={tablet ? 'right' : 'bottom'}
        className={tablet ? 'w-[380px] max-w-[100vw] gap-0 p-0 sm:max-w-[380px]' : 'shadow-toast max-h-[88vh] gap-0 rounded-t-2xl p-0'}
      >
        {!tablet && <span aria-hidden="true" className="bg-border-strong mx-auto mt-2 h-1 w-9 rounded-full" />}
        <div className="flex h-14 items-center px-4 pr-16">
          <SheetTitle className="text-lead font-extrabold">Filters</SheetTitle>
          <SheetDescription className="sr-only">Changes apply as you make them.</SheetDescription>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <FilterGroups {...groups} />
        </div>
        <div className="border-border bg-surface flex items-center justify-between gap-3 border-t px-4 py-3">
          <Button variant="link" size="inline" className="min-h-11" onClick={onClearAll}>Clear all</Button>
          <Button size="lg" onClick={() => setOpen(false)}>
            {total === undefined ? 'Show providers' : showCountLabel(total)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```
(`useState` from `react`.) The built-in close `X` of `SheetContent` (44 target, top-right) stays. With `prefers-reduced-motion` the slide is handled by the existing `animate-*` utilities; don't add motion.
States: closed; open with badge 0; open with count loading (`Show providers`); open with 0 results (`Show 0 providers`, still closes).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): discover filters sheet (M06-T15)"`

### T16 — Search bar (discover variant, S2.E1)
- [ ] done
**Files:** `src/features/discover/components/discover-search-bar.tsx`
**Context:** S2.E1; §2.9 Search bar discover variant (radius 16, pad 6, 56 high, `shadow-search-sm`); phone stacks like S1. Copy as S1.E4 (`Service`, `What service do you need?`, `Location`, `All locations`, `Search`). Pattern: copy the markup of `features/site/components/hero-search.tsx` (not import — it navigates and has chips); do **not** render the Popular chips.
**Do:**
```tsx
interface Props {
  catalog: CatalogResponse | undefined;
  q: string | undefined;       // from URL
  loc: string | undefined;     // from URL
  onSearch: (q: string, loc: string | undefined) => void;   // newSearch (PUSH)
  onLocationChange: (loc: string | undefined) => void;      // setFilter({ loc }) — applies immediately
}
```
- Local state `const [text, setText] = useState(q ?? '')`, re-synced when the URL changes: render the component with `key={q ?? ''}` from the page (no effect).
- Location select is controlled by `loc` from props (URL), `onChange → onLocationChange(value || undefined)`.
- Submit → `onSearch(text, loc)`.
- Classes: form `border-border bg-surface shadow-search-sm flex flex-col rounded-xl border p-1.5 sm:flex-row sm:items-center sm:gap-2`; fields `h-14`; button `mt-2 h-12 w-full sm:mt-0 sm:h-14 sm:w-auto sm:px-7` (size `lg`). Input text `text-body` (16px on phone).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): discover search bar (M06-T16)"`

### T17 — Results header with sort (S2.E8, S2.E9)
- [ ] done
**Files:** `src/features/discover/components/results-header.tsx`
**Context:** S2.E8/E9; desktop header row (H1 left, `Sort by` select right); phone H1 22/30 via `text-title-lg`. First check `globals.css`: `text-title-lg` must have a ≤ 640px override to 22/30. If it doesn't, STOP and write a blocker (don't add or change tokens).
**Do:**
```tsx
import { forwardRef } from 'react';
import type { SortKey } from '@fixit/contracts';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'rating', label: 'Top rated' },
  { value: 'reviews', label: 'Most reviews' },
  { value: 'town', label: 'Based in your town first' },
];

export const ResultsHeading = forwardRef<HTMLHeadingElement, { title: string; context: string }>(function ResultsHeading({ title, context }, ref) {
  return (
    <div className="flex flex-col gap-1">
      <h1 ref={ref} tabIndex={-1} className="text-title-lg text-text scroll-mt-32 focus:outline-none lg:scroll-mt-24">{title}</h1>
      <p className="text-body-sm text-text-muted">{context}</p>
    </div>
  );
});

export function SortSelect({ value, onChange, className }: { value: SortKey; onChange: (s: SortKey) => void; className?: string }) {
  // <label className="flex items-center gap-2"><span className="text-label text-text-muted hidden lg:inline">Sort by</span>
  //   <span className="sr-only lg:hidden">Sort by</span>
  //   native <select> same classes as the Location select (h-11 lg:h-10), options SORT_OPTIONS;
  //   onChange={(e) => onChange(SortKey.parse(e.target.value))}</label>
}
```
(Import `SortKey` as a value for `.parse`.) Before the title/context exist (first load), the page renders a skeleton line instead (T18).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): discover results heading and sort (M06-T17)"`

### T18 — `DiscoverPage` assembly and states
- [ ] done
**Files:** `src/features/discover/pages/discover-page.tsx`, `src/app/chunks/public.tsx`
**Context:** S2 desktop + phone layout; §6.1 (result skeleton ×4, 150 ms, `aria-busy`), §6.2 (empty, `SearchX`), §6.3 section error; AC1–AC7; D-5, D-7. Reuse `useCatalog` (`features/site/hooks`), `LoadingRegion`, `SkeletonResultCard`, `EmptyState`, `SectionError`, `Pagination`.
**Do:**
1. `public.tsx`: replace the placeholder `DiscoverPage` with `export { DiscoverPage } from '@/features/discover/pages/discover-page';`.
2. Page:
```tsx
export function DiscoverPage() {
  const { data: catalog } = useCatalog();
  const categories = catalog?.categories ?? [];
  const nav = useDiscoverParams(categories);
  const { state } = nav;
  const result = useDiscover(state);
  const location = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { rememberDiscover(location.search); }, [location.search]);   // D-7

  // Page links scroll to the results heading (S2.E12); not on first render.
  const prevPage = useRef(state.page);
  useEffect(() => {
    if (prevPage.current !== state.page) headingRef.current?.scrollIntoView({ block: 'start' });
    prevPage.current = state.page;
  }, [state.page]);

  const data = result.data;
  const ticked = tickedCategories(state, categories);
  const groups = {
    catalog: catalog ?? { categories: [], districts: [], towns: [] },
    state, ticked,
    counts: data?.categoryCounts,
    onToggleCategory: nav.toggleCategory,
    onChange: nav.setFilter,
  };
  …
}
```
3. Markup (exact classes):
   - Search band: `<div className="border-border bg-surface border-b"><div className="mx-auto max-w-[1240px] px-4 py-4 sm:px-6 lg:px-8 lg:py-7"><DiscoverSearchBar key={state.q ?? ''} … onSearch={nav.newSearch} onLocationChange={(loc) => nav.setFilter({ loc })} /></div></div>`
   - Main: `<div className="mx-auto grid max-w-[1240px] gap-5 px-4 pb-14 pt-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:pb-[88px] lg:pt-8">`
     - `<FilterPanel {...groups} onClearAll={nav.clearAll} />` (hidden below lg)
     - `<section aria-labelledby="discover-results" className="flex min-w-0 flex-col gap-5">`
       - Header row: `flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between`: `ResultsHeading` (id `discover-results`, title `resultsTitle(data.total)`, context `contextLine(state, catalog)`) when `data && catalog`, else `<Skeleton className="h-8 w-56" />`; `SortSelect` wrapped in `hidden lg:block`.
       - Toolbar (below lg): `sticky top-16 z-10 -mx-4 grid grid-cols-2 gap-3 border-b border-border bg-surface px-4 py-2 sm:top-[72px] sm:-mx-6 sm:px-6 lg:hidden` containing `<FiltersSheet {...groups} badge={appliedFilterCount(state, categories)} total={data?.total} onClearAll={nav.clearAll} />` and `<SortSelect className="w-full" … />`. Check the nav height classes against `app/layouts` (nav 64 phone / 72 tablet); adjust `top-*` to match.
       - Body, in this order of precedence:
         - `result.isError && !data` → `<SectionError onRetry={() => void result.refetch()} />` (the panel/sheet still work since they render from URL + catalog).
         - `<LoadingRegion loading={result.isPending} skeleton={<div className="flex flex-col gap-5">{[0,1,2,3].map((i) => <SkeletonResultCard key={i} />)}</div>}>`
           - `data.total === 0` → `<EmptyState icon={SearchX} title="No providers match your filters" body="Try another location or loosen the rating and price filters." action={{ label: 'Clear filters', onClick: nav.clearAll }} />`
           - else `<ul className="flex flex-col gap-3 sm:gap-5">` of `<li><ResultCard provider={p} /></li>`, then `<Pagination page={data.page} totalPages={data.totalPages} hrefFor={nav.hrefForPage} className="mt-3" />`.
         - When `result.isError && data` (refetch failed while showing previous data): keep the list and render `SectionError` above it.
   - Set `aria-busy={result.isFetching}` on the `<ul>` while a refetch is in flight (no skeleton, D-5).
4. `document.title`: follow whatever the other pages do (grep `document.title` / `useTitle`); if nothing exists, skip.
States covered: first load (skeleton after 150 ms), results, 0 results (empty), error (section error + panel usable), refetching (previous results, aria-busy), 1 page (no pagination), many pages.
**Verify:** `pnpm verify` green; `pnpm dev:mock`, open `/discover` — cards render.
**Commit:** `git commit -m "feat(web): discover page (M06-T18)"`

### T19 — Discover page integration tests
- [ ] done
**Files:** `src/features/discover/pages/discover-page.test.tsx`
**Context:** AC1–AC4, AC6 (badge, live count), AC7; `renderRoute` from `@/test/render`; `setViewportWidth` from `@/test/media`; `armForcedError`; `db()` to add providers for pagination (see T6 `addClones` — copy the helper).
**Do/Test:**
```tsx
import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from '@/test/render';
import { setViewportWidth } from '@/test/media';
import { armForcedError } from '@/mocks/lib/controls';
import { db } from '@/mocks/db/store';

function addClones(count: number) { /* same as T6 */ }

describe('DiscoverPage', () => {
  it('AC1: q=plumb&loc prefilled, Plumbing ticked, heading and context', async () => {
    renderRoute('/discover?q=plumb&loc=dehiwala-mount-lavinia');
    expect(await screen.findByRole('heading', { level: 1, name: /providers? found$/ })).toBeInTheDocument();
    expect(screen.getByText('Showing Plumbing in Dehiwala-Mount Lavinia')).toBeInTheDocument();
    expect(screen.getByDisplayValue('plumb')).toBeInTheDocument();
    const panel = screen.getByRole('complementary', { name: 'Filters' });
    expect(within(panel).getByRole('checkbox', { name: /Plumbing/ })).toBeChecked();
  });
  it('AC2: ticking a category updates the URL and clears a matched q', async () => {
    const { location } = renderRoute('/discover?q=plumb');
    const panel = await screen.findByRole('complementary', { name: 'Filters' });
    await userEvent.click(await within(panel).findByRole('checkbox', { name: /Electrical/ }));
    await waitFor(() => expect(location()).toBe('/discover?cat=plumbing%2Celectrical'));
  });
  it('AC2: verified row toggles; AC3 sort resets page', async () => {
    addClones(15);
    const { location } = renderRoute('/discover?page=2');
    const panel = await screen.findByRole('complementary', { name: 'Filters' });
    await userEvent.click(within(panel).getByRole('switch', { name: 'Verified providers only' }));
    await waitFor(() => expect(location()).toBe('/discover?verified=1'));
    await userEvent.selectOptions(screen.getAllByRole('combobox', { name: 'Sort by' })[0]!, 'reviews'); // first = desktop
    await waitFor(() => expect(location()).toBe('/discover?verified=1&sort=reviews'));
  });
  it('AC4: new search keeps sort, drops rating/price; Clear all resets', async () => {
    const { location } = renderRoute('/discover?q=tap&rating=4&price=2000&sort=reviews');
    const box = await screen.findByDisplayValue('tap');
    await userEvent.clear(box);
    await userEvent.type(box, 'cleaning{Enter}');
    await waitFor(() => expect(location()).toBe('/discover?q=cleaning&cat=cleaning&sort=reviews'));
    await userEvent.click(within(screen.getByRole('complementary', { name: 'Filters' })).getByRole('button', { name: 'Clear all' }));
    await waitFor(() => expect(location()).toBe('/discover'));
  });
  it('AC4: junk URL renders defaults', async () => {
    renderRoute('/discover?rating=9&page=-1&cat=,,x');
    expect(await screen.findByText('Showing all services in all locations')).toBeInTheDocument();
  });
  it('AC5: pagination appears above 10 results', async () => {
    addClones(15);
    renderRoute('/discover');
    expect(await screen.findByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });
  it('AC7: empty state and Clear filters', async () => {
    const { location } = renderRoute('/discover?q=zzzz-nothing');
    expect(await screen.findByText('No providers match your filters')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(location()).toBe('/discover'));
  });
  it('AC7: forced 500 shows a section error with Try again; filters still usable', async () => {
    armForcedError('providers_search', '500');
    renderRoute('/discover');
    expect(await screen.findByText("We couldn't load this.")).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Filters' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: /providers? found$/ })).toBeInTheDocument();
  });
  it('AC6: phone toolbar badge and live count in the sheet', async () => {
    setViewportWidth(390);
    renderRoute('/discover?cat=plumbing&verified=1');
    const btn = await screen.findByRole('button', { name: /Filters/ });
    expect(within(btn).getByText('2')).toBeInTheDocument();
    await userEvent.click(btn);
    expect(await screen.findByRole('button', { name: /^Show \d+ providers?$/ })).toBeInTheDocument();
  });
});
```
If `armForcedError` only arms the next call and the 500 is consumed by a retry, keep as is (query client in tests has `retry: false`). If hidden-by-CSS elements (`lg:hidden`) are both in the DOM, select via the `complementary` landmark as written; jsdom ignores CSS.
**Verify:** `pnpm --filter @fixit/web test -- discover-page` green; `pnpm verify` green.
**Commit:** `git commit -m "test(web): discover page behaviour (M06-T19)"`

### T20 — Acceptance walk-through
- [ ] done
**Files:** `docs/plans/PLAN-M06-discover.md` (ticks), `docs/milestones/M00-index.md` (M06 → Done)
**Do:** run `pnpm verify`, then `pnpm dev:mock` and check each criterion; record any failure under Blockers instead of fixing out of scope.
| AC | Check |
|---|---|
| 1 | 1440: open `/discover?q=plumb&loc=dehiwala-mount-lavinia` → bar shows `plumb` + Dehiwala-Mount Lavinia, Plumbing ticked, H1 `{n} providers found`, context `Showing Plumbing in Dehiwala-Mount Lavinia`, sort `Top rated`. Test: T19 AC1. |
| 2 | Toggle each filter; URL changes (replace, no new history entry); counts change when toggling verified/rating/price/location but not when ticking categories; a 0-count row is `text-subtle` and can be ticked. Tests: T6, T19. |
| 3 | Sort Most reviews / Based in your town first (with and without a location); `page` removed from URL. Tests: T4, T6, T19. |
| 4 | Submit a new search after setting rating/price → those drop, sort kept, cat derived (D-1). Clear all → `/discover`. Back/Forward through 3 states. Paste `/discover?rating=9&page=-1&cat=,,x` → defaults, no console error. Tests: T9, T19. |
| 5 | Cards: Verified badge vs `Not yet verified`; a 0-review provider shows `New` + `No reviews yet`; meta has category · town · `{n} yrs experience`, no distance; bio 2 lines; `Starting at` + unit. Pagination and scroll-to-heading: covered by T19 AC5 only, because the fixtures have exactly 10 listed providers (D-10); in the browser confirm pagination is hidden on `/discover`. |
| 6 | DevTools 390: H1 22/30, sticky toolbar, badge count, sheet 88vh, live `Show {n} providers`, `Clear all` in footer; 800: sheet from the right, 380 wide; pagination text `Page x of y` on phone (T19 AC5 at 390 if desired). `document.documentElement.scrollWidth === innerWidth` at 390 / 800 / 1440. |
| 7 | Empty: `/discover?q=zzzz-nothing`. Loading: DevPanel latency → skeletons after 150 ms. Error: DevPanel force 500 on `providers_search` → section error, `Try again` works, filters usable. |
| 8 | `pnpm --filter @fixit/contracts test` and `pnpm --filter @fixit/web test` green (T2, T1, T4, T9). |
Then set M06 to `Done` in `M00-index.md`, tick all tasks, `git tag m06-done`.
**Verify:** `pnpm verify` green; every row checked.
**Commit:** `git commit -m "chore: M06 acceptance checks (M06-T20)"`

## Checkpoints
- After T7: "Human: `pnpm dev:mock`, in the console run `await (await fetch('/api/providers?q=plumb')).json()` — `matchedCategoryId: 'plumbing'`, counts per category."
- After T18: "Human: run `pnpm dev:mock`, open `/discover?q=plumb&loc=dehiwala-mount-lavinia` at 1440 and compare with `reference/screens/04-discover-plumbing-austin-desktop.png` (filter panel, header row, card); open `/discover` at 1440 vs `03-discover-all-desktop.png`; then 390 and 800 — toolbar, sheet (bottom at 390, right at 800), no horizontal scroll. Note: `03-discover-all-phone.png` is the broken prototype phone layout; follow SPEC S2 phone layout instead."

## Blockers
(executor writes here; leave empty)

## Nice-to-haves (not tasks)
- More listed fixture providers (≥ 11) so pagination can be seen in the browser.
- Debounced free-text-as-you-type search.
- Arrow-key navigation inside the rating/price radio groups.

## Summary notes for the reviewer
- AC4 reworded to match SPEC §8.2 (decision 002, D-1).
- Fixtures list exactly 10 providers, so AC5 pagination can only be shown via tests (D-10).
