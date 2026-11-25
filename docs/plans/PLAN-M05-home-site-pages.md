# PLAN-M05 — Home & site pages
Milestone: `docs/milestones/M05-home-site-pages.md` · Start tag: `m05-start` · Verify-all: `pnpm verify`
Mock domains at start → end: all (`pnpm dev:mock`; only `auth` has handlers) → all (`catalog` gains `GET /catalog` and `GET /providers/featured`). **No backend in this milestone** (`apps/api` does not exist yet), so there are no Nest tasks and no authorization-matrix rows. Both new endpoints are public; the mock applies BR-01 (listed only) and BR-08 (featured rule) the way the API will.

Conventions for the executor:
- Work on branch `m05-home-site-pages` (created in T1). One commit per task, using the message given, ending with the attribution lines from your session instructions.
- Run `pnpm format` before `pnpm verify` in every task. The code below may not be Prettier-exact.
- Code blocks are complete files unless the step says "add", "replace" or "edit". Tests import `describe/expect/it/vi` from `vitest` explicitly.
- Paths are under `apps/web/` unless they start with `packages/`, `docs/` or `/`. `@/` = `apps/web/src/`.
- Tailwind: only `sm` (≥641) and `lg` (≥1024) prefixes. Arbitrary **size** values are allowed (`h-[60px]`, `max-w-[1240px]`). Arbitrary colour values and the lint-banned prefixes `text-[`, `bg-[`, `border-[`, `shadow-[`, `ring-[`, `outline-[` are not. Token classes available: text `text-display` (phone override to 36/44 already in `globals.css`), `text-title-xl`, `text-title-lg`, `text-title-md`, `text-title-xs`, `text-lead`, `text-body`, `text-body-sm`, `text-label`, `text-meta`, `text-caption`; radii `rounded-sm|md|lg|xl|2xl|3xl|4xl` (10/12/14/16/20/24/28); shadows `shadow-search`, `shadow-float`, `shadow-hover`; colours `primary`, `primary-soft`, `primary-foreground`, `on-primary-muted`, `cta`, `on-cta`, `cta-outline`, `success`, `success-soft`, `success-text`, `page`, `surface`, `border`, `text`, `text-muted`, `text-subtle`, `icon-subtle`.
- Copy in backticks is SPEC copy. Use it character for character, including typographic apostrophes (’ is **not** used in SPEC; SPEC uses `'`) and the em dash `—`.
- If a library API differs from what the code assumes (React Router 7, TanStack Query 5, zod 4, lucide-react icon names), **STOP** and write a blocker. Don't switch majors.

Planner's decisions the executor must follow:
- **D-1 Home submits only `q` and `loc`.** S1.E4 and AC3 say the URL is `/discover?q=plumb&loc=…`. BR-02 category matching of `q` is done by Discover / `GET /providers` (`matchedCategoryId`, M06), not by Home. No `cat` is added on Home submit. Recorded in `docs/decisions/001-home-search-no-cat.md`.
- **D-2 One feature folder `features/site/`** holds Home (S1), For providers (S4) and S11. The CTA band and the steps grid are shared by S1 and S4, which are in the same feature, so they live in `features/site/components/`. `CategoryIcon` goes to `components/` because Discover/Profile/Dashboard (other features) need it.
- **D-3 Role-aware provider CTA** (`useProviderCta`, UX only): `me.roles` includes `provider` → `Go to your dashboard` → `/dashboard`; signed-in non-admin → `Join as a provider` → `/become-a-provider/1`; guest (or auth still booting) → `Join as a provider` → `/signup?intent=provider`; **admin → no primary CTA** (admins can't become providers; `Learn more` still shows on S1). SPEC doesn't define the admin case; this is the least surprising choice.
- **D-4 Fixed-price starting prices** have no `From` lead line: `priceLabel()` returns `lead: null`, and the card renders an empty, `aria-hidden` line of the same height so prices stay aligned.
- **D-5 Hash scroll.** React Router doesn't scroll to hashes. Home runs `useScrollToHash()` once data has rendered; the `#how-it-works` section has `scroll-mt-[72px]` (AC7).
- **D-6 `photoUrl`** in the mock = `/api/files/photos/{photoKey}` when `photoKey` is set, else `null`. No photo handler exists yet; every fixture provider currently has `photoKey: null`, so all cards show the category-icon tile.
- **D-7 No mock db version bump.** The db shape doesn't change.

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `packages/contracts/src/catalog/schemas.ts` (+ test) | Create | `Category`, `District`, `Town`, `TownRef`, `CatalogResponse`, `StartingPrice`, `ProviderCard` |
| `packages/contracts/src/providers/pricing.ts` (+ test) | Modify | `priceLabel()` |
| `packages/contracts/src/search/compare.ts` (+ test) | Create | `compareProviders('rating')`, `selectFeatured()` (BR-06 Top rated, BR-08) |
| `packages/contracts/src/endpoints.ts` (+ test) | Modify | `catalog_get`, `providers_featured` |
| `packages/contracts/src/index.ts` | Modify | export the new modules |
| `src/lib/format.ts` (+ test) | Modify | build on `priceLabel()` |
| `src/mocks/lib/cards.ts` (+ test) | Create | `isListed`, `toProviderCard` (BR-01) |
| `src/mocks/handlers/catalog.ts` (+ test) | Create | `GET /catalog`, `GET /providers/featured` |
| `src/mocks/handlers/index.ts` | Modify | register `catalogHandlers` |
| `src/lib/query-keys.ts` | Modify | `catalog`, `featured` |
| `src/features/site/api.ts`, `hooks.ts` (+ test) | Create | fetch + `useCatalog`, `useFeatured` |
| `src/features/site/use-provider-cta.ts` (+ test) | Create | D-3 |
| `src/features/site/search-url.ts` (+ test) | Create | S1.E4 URL builder |
| `src/features/site/use-scroll-to-hash.ts` | Create | D-5 |
| `src/components/category-icon.tsx` | Create | `CategoryIcon` enum → lucide (SPEC §2.10) |
| `src/components/skeletons.tsx` | Modify | phone size of `SkeletonCategoryCard` |
| `src/features/site/components/hero-search.tsx` | Create | S1.E4 + S1.E5 |
| `src/features/site/components/hero.tsx` | Create | S1.E1–E3, E6 |
| `src/features/site/components/section-header.tsx` | Create | S1.E7/E9 header row |
| `src/features/site/components/category-card.tsx`, `categories-section.tsx` | Create | S1.E7–E8 |
| `src/features/site/components/featured-card.tsx`, `featured-section.tsx` | Create | S1.E9–E10 |
| `src/features/site/components/steps-grid.tsx` | Create | S1.E11 / S4.E4 |
| `src/features/site/components/cta-band.tsx` | Create | S1.E12 / S4.E6 |
| `src/features/site/components/article-card.tsx` | Create | S11 layout |
| `src/features/site/pages/home-page.tsx` (+ test) | Create | S1 |
| `src/features/site/pages/for-providers-page.tsx` (+ test) | Create | S4 |
| `src/features/site/pages/about-page.tsx`, `contact-page.tsx`, `privacy-page.tsx` (+ test) | Create | S11 |
| `src/app/chunks/home.tsx`, `src/app/chunks/public.tsx` | Modify | re-export the real pages |

## Tasks

### T1 — Catalog contract schemas
- [x] done

**Files:** `packages/contracts/src/catalog/schemas.ts`, `packages/contracts/src/catalog/schemas.test.ts`, `packages/contracts/src/index.ts`
**Context:** ARCHITECTURE §2.5 (excerpt reproduced below), §3.2. `Id`, `Lkr` in `common/primitives.ts`; `CategoryIcon`, `PriceUnit` in `common/enums.ts`.
**Do:**
1. `git switch -c m05-home-site-pages && git tag m05-start`
2. Create `packages/contracts/src/catalog/schemas.ts`:
```ts
import { z } from 'zod';
import { CategoryIcon, PriceUnit } from '../common/enums';
import { Id, Lkr } from '../common/primitives';

export const Category = z.object({
  id: Id,
  name: z.string(),
  blurb: z.string(),
  icon: CategoryIcon,
  order: z.number().int(),
});
export type Category = z.infer<typeof Category>;

export const District = z.object({ id: Id, name: z.string(), order: z.number().int() });
export type District = z.infer<typeof District>;

export const Town = z.object({ id: Id, name: z.string(), districtId: Id });
export type Town = z.infer<typeof Town>;

export const TownRef = Town.pick({ id: true, name: true });
export type TownRef = z.infer<typeof TownRef>;

/** Active categories and towns only. Categories by admin `order`; districts by `order`; towns by district order, then town order. */
export const CatalogResponse = z.object({
  categories: z.array(Category),
  districts: z.array(District),
  towns: z.array(Town),
});
export type CatalogResponse = z.infer<typeof CatalogResponse>;

export const StartingPrice = z.object({ amount: Lkr, unit: PriceUnit });
export type StartingPrice = z.infer<typeof StartingPrice>;

export const ProviderCard = z.object({
  id: Id,
  businessName: z.string(),
  photoUrl: z.string().nullable(), // "/api/files/photos/…" or null → category-icon tile
  category: Category.pick({ id: true, name: true, icon: true }),
  baseTown: TownRef,
  yearsExperience: z.number().int(),
  bio: z.string(),
  verified: z.boolean(),
  paused: z.boolean(),
  rating: z.number().min(1).max(5).nullable(), // 1 dp, null → "New" (BR-27)
  reviewCount: z.number().int().min(0),
  startingPrice: StartingPrice, // BR-10
});
export type ProviderCard = z.infer<typeof ProviderCard>;
```
3. Add to `packages/contracts/src/index.ts`: `export * from './catalog/schemas';`
4. If `Id` rejects ids like `plumbing` or `dehiwala-mount-lavinia`, **STOP** (blocker: fixtures ids vs `Id`).

**Test:** `packages/contracts/src/catalog/schemas.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { CatalogResponse, ProviderCard } from './schemas';

const card = {
  id: 'p-bell',
  businessName: 'Bell & Sons Plumbing',
  photoUrl: null,
  category: { id: 'plumbing', name: 'Plumbing', icon: 'wrench' },
  baseTown: { id: 'dehiwala-mount-lavinia', name: 'Dehiwala-Mount Lavinia' },
  yearsExperience: 12,
  bio: 'Family plumbers.',
  verified: true,
  paused: false,
  rating: 4.9,
  reviewCount: 212,
  startingPrice: { amount: 2500, unit: 'per_hour' },
};

describe('catalog schemas', () => {
  it('parses a provider card', () => {
    expect(ProviderCard.parse(card)).toEqual(card);
  });
  it('accepts rating null (New)', () => {
    expect(ProviderCard.parse({ ...card, rating: null, reviewCount: 0 }).rating).toBeNull();
  });
  it('rejects a non-integer price', () => {
    expect(ProviderCard.safeParse({ ...card, startingPrice: { amount: 2500.5, unit: 'per_hour' } }).success).toBe(false);
  });
  it('rejects an unknown icon', () => {
    expect(ProviderCard.safeParse({ ...card, category: { ...card.category, icon: 'construction' } }).success).toBe(false);
  });
  it('parses an empty catalog', () => {
    expect(CatalogResponse.parse({ categories: [], districts: [], towns: [] }).towns).toEqual([]);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): catalog and provider card schemas (M05-T1)"`

### T2 — `priceLabel()` in contracts, used by `lib/format.ts`
- [x] done

**Files:** `packages/contracts/src/providers/pricing.ts`, `packages/contracts/src/providers/pricing.test.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`
**Context:** BR-09, S1.E10 (`From` / `LKR 2,500 / hour`), D-4. `formatServicePrice` / `priceParts` already exist in `lib/format.ts`; their output must not change.
**Do:**
1. Append to `packages/contracts/src/providers/pricing.ts`:
```ts
export const PRICE_UNIT_SUFFIX: Record<PriceUnit, ' / hour' | ' / visit' | ' fixed'> = {
  per_hour: ' / hour',
  per_visit: ' / visit',
  fixed: ' fixed',
};

/** BR-09 label parts. Cards show `lead` (small, own line) over `LKR {amount}{suffix}`; fixed prices have no lead (D-4). */
export function priceLabel(p: { amount: number; unit: PriceUnit }): {
  lead: 'From' | null;
  amount: number;
  suffix: ' / hour' | ' / visit' | ' fixed';
} {
  return { lead: p.unit === 'fixed' ? null : 'From', amount: p.amount, suffix: PRICE_UNIT_SUFFIX[p.unit] };
}
```
2. In `src/lib/format.ts`: delete the local `UNIT_SUFFIX` const; import `priceLabel` from `@fixit/contracts`; replace the two functions:
```ts
/** BR-09: `from LKR 2,500 / hour`, `from LKR 1,500 / visit`, `LKR 4,500 fixed`. */
export function formatServicePrice(amount: number, unit: PriceUnit): string {
  const l = priceLabel({ amount, unit });
  return `${l.lead ? 'from ' : ''}${formatLkr(amount)}${l.suffix}`;
}

/** Short price for cards: big `LKR 2,500` + small suffix, plus the `From` lead (null for fixed). */
export function priceParts(amount: number, unit: PriceUnit): { lead: 'From' | null; amount: string; suffix: string } {
  const l = priceLabel({ amount, unit });
  return { lead: l.lead, amount: formatLkr(amount), suffix: l.suffix };
}
```
**Test:** add to `packages/contracts/src/providers/pricing.test.ts`:
```ts
describe('priceLabel', () => {
  it.each([
    ['per_hour', 'From', ' / hour'],
    ['per_visit', 'From', ' / visit'],
    ['fixed', null, ' fixed'],
  ] as const)('%s → lead %s, suffix %s', (unit, lead, suffix) => {
    expect(priceLabel({ amount: 2500, unit })).toEqual({ lead, amount: 2500, suffix });
  });
});
```
(add `priceLabel` to the file's import; import `describe/expect/it` if not already). Add to `src/lib/format.test.ts`:
```ts
describe('priceParts lead', () => {
  it('From for per_hour, null for fixed', () => {
    expect(priceParts(2500, 'per_hour')).toEqual({ lead: 'From', amount: 'LKR 2,500', suffix: ' / hour' });
    expect(priceParts(15000, 'fixed')).toEqual({ lead: null, amount: 'LKR 15,000', suffix: ' fixed' });
  });
});
```
If an existing `priceParts` test uses `toEqual` on the old two-key shape, update that expectation to include `lead`.
**Verify:** `pnpm --filter @fixit/contracts test && pnpm --filter @fixit/web test -- format` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): priceLabel for starting prices (M05-T2)"`

### T3 — `compareProviders('rating')` and `selectFeatured()`
- [x] done

**Files:** `packages/contracts/src/search/compare.ts`, `packages/contracts/src/search/compare.test.ts`, `packages/contracts/src/index.ts`
**Context:** BR-06 Top rated, BR-08. M06 extends `compareProviders` with `reviews` and `town`; keep the signature extendable.
**Do:**
1. Create `packages/contracts/src/search/compare.ts`:
```ts
export interface RankFields {
  id: string;
  businessName: string;
  rating: number | null;
  reviewCount: number;
}

/** BR-06 Top rated: rating high→low, ties by review count, no reviews last. Then name, then id, so order is stable. M06 adds 'reviews' and 'town'. */
export function compareProviders(sort: 'rating'): (a: RankFields, b: RankFields) => number {
  void sort; // only 'rating' until M06
  return (a, b) => {
    const ar = a.reviewCount > 0 ? a.rating : null;
    const br = b.reviewCount > 0 ? b.rating : null;
    if (ar === null && br !== null) return 1;
    if (br === null && ar !== null) return -1;
    if (ar !== null && br !== null && ar !== br) return br - ar;
    if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount;
    const byName = a.businessName.localeCompare(b.businessName, 'en');
    if (byName !== 0) return byName;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  };
}

export const FEATURED_LIMIT = 4;

/** BR-08: up to 4 verified providers with ≥ 1 review, Top rated order. Input must already be listed only (BR-01). */
export function selectFeatured<T extends RankFields & { verified: boolean }>(cards: readonly T[]): T[] {
  return cards
    .filter((c) => c.verified && c.reviewCount >= 1)
    .sort(compareProviders('rating'))
    .slice(0, FEATURED_LIMIT);
}
```
2. Add to `index.ts`: `export * from './search/compare';`

**Test:** `packages/contracts/src/search/compare.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { compareProviders, selectFeatured } from './compare';

const p = (id: string, rating: number | null, reviewCount: number, verified = true) => ({
  id,
  businessName: id.toUpperCase(),
  rating,
  reviewCount,
  verified,
});

describe('compareProviders(rating)', () => {
  it('rating desc, then review count desc, no reviews last', () => {
    const list = [p('a', null, 0), p('b', 4.5, 10), p('c', 4.9, 2), p('d', 4.5, 30)];
    expect(list.sort(compareProviders('rating')).map((x) => x.id)).toEqual(['c', 'd', 'b', 'a']);
  });
  it('full ties fall back to name', () => {
    expect([p('z', 4, 1), p('m', 4, 1)].sort(compareProviders('rating')).map((x) => x.id)).toEqual(['m', 'z']);
  });
});

describe('selectFeatured (BR-08)', () => {
  it('keeps verified with ≥ 1 review, top 4 by rating', () => {
    const list = [
      p('a', 5, 1, false), // not verified
      p('b', null, 0), // no reviews
      p('c', 4.1, 5),
      p('d', 4.9, 5),
      p('e', 4.5, 5),
      p('f', 4.7, 5),
      p('g', 4.2, 5),
    ];
    expect(selectFeatured(list).map((x) => x.id)).toEqual(['d', 'f', 'e', 'g']);
  });
  it('returns [] when nobody qualifies', () => {
    expect(selectFeatured([p('a', null, 0), p('b', 5, 3, false)])).toEqual([]);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): top-rated comparator and featured selection (M05-T3)"`

### T4 — `ENDPOINTS` rows for `GET /catalog` and `GET /providers/featured`
- [x] done

**Files:** `packages/contracts/src/endpoints.ts`, `packages/contracts/src/endpoints.test.ts`
**Context:** ARCHITECTURE §3.2 rows 1 and 3.
**Do:**
1. Import `CatalogResponse, ProviderCard` from `./catalog/schemas` in `endpoints.ts`.
2. Add inside `ENDPOINTS` after the last auth/me entry:
```ts
  catalog_get: {
    id: 'catalog_get',
    domain: 'catalog',
    method: 'GET',
    path: '/catalog',
    access: ['public'],
    owner: 'none',
    response: CatalogResponse,
    refs: ['S1', 'S2', 'S12', 'S19', 'S24', 'S25'],
  },
  providers_featured: {
    id: 'providers_featured',
    domain: 'catalog',
    method: 'GET',
    path: '/providers/featured',
    access: ['public'],
    owner: 'none',
    response: z.array(ProviderCard),
    refs: ['F-05', 'S1', 'BR-08'],
  },
```
**Test:** add to `endpoints.test.ts`:
```ts
  it('M05 catalog rows match ARCHITECTURE §3.2', () => {
    expect(ENDPOINTS.catalog_get).toMatchObject({ method: 'GET', path: '/catalog', access: ['public'], domain: 'catalog' });
    expect(ENDPOINTS.providers_featured).toMatchObject({
      method: 'GET',
      path: '/providers/featured',
      access: ['public'],
      domain: 'catalog',
    });
  });
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): catalog and featured endpoints (M05-T4)"`

### T5 — Mock provider-card mapper (BR-01)
- [x] done

**Files:** `src/mocks/lib/cards.ts`, `src/mocks/lib/cards.test.ts`
**Context:** BR-01 (listed = onboarding complete + published + owner not suspended), D-6. `MockDb` in `src/mocks/db/schema.ts`. M06 reuses this for `GET /providers`.
**Do:** Create `src/mocks/lib/cards.ts`:
```ts
import type { ProviderCard } from '@fixit/contracts';
import type { FxProvider } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';

/** BR-01: onboarding complete, published, owner account active. */
export function isListed(d: MockDb, p: FxProvider): boolean {
  return p.onboardingComplete && p.publishedAt !== null && d.users[p.userId]?.status === 'active';
}

/** ProviderCard for a listed provider; null if a field a listed provider must have is missing (never expected with fixtures). */
export function toProviderCard(d: MockDb, p: FxProvider): ProviderCard | null {
  const category = d.categories.find((c) => c.id === p.categoryId);
  const town = d.towns.find((t) => t.id === p.baseTownId);
  if (!p.businessName || !category || !town || p.startingPrice === null || p.startingUnit === null) return null;
  return {
    id: p.id,
    businessName: p.businessName,
    photoUrl: p.photoKey ? `/api/files/photos/${p.photoKey}` : null,
    category: { id: category.id, name: category.name, icon: category.icon },
    baseTown: { id: town.id, name: town.name },
    yearsExperience: p.yearsExperience ?? 0,
    bio: p.bio ?? '',
    verified: p.verificationStatus === 'verified',
    paused: p.paused,
    rating: p.reviewCount > 0 ? p.ratingAvg : null,
    reviewCount: p.reviewCount,
    startingPrice: { amount: p.startingPrice, unit: p.startingUnit },
  };
}

/** Cards for every listed provider. */
export function listedCards(d: MockDb): ProviderCard[] {
  return Object.values(d.providers)
    .filter((p) => isListed(d, p))
    .map((p) => toProviderCard(d, p))
    .filter((c): c is ProviderCard => c !== null);
}
```
**Test:** `src/mocks/lib/cards.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { ProviderCard } from '@fixit/contracts';
import { db } from '../db/store';
import { isListed, listedCards } from './cards';

describe('listedCards', () => {
  it('every card parses as ProviderCard', () => {
    const cards = listedCards(db());
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) expect(ProviderCard.safeParse(c).success).toBe(true);
  });
  it('excludes drafts and suspended owners', () => {
    const d = db();
    const ids = new Set(listedCards(d).map((c) => c.id));
    for (const p of Object.values(d.providers)) expect(ids.has(p.id)).toBe(isListed(d, p));
  });
  it('a suspended owner hides the listing', () => {
    const d = db();
    const p = Object.values(d.providers).find((x) => isListed(d, x));
    if (!p) throw new Error('fixture has no listed provider');
    const user = d.users[p.userId];
    if (!user) throw new Error('owner missing');
    user.status = 'suspended';
    expect(listedCards(d).some((c) => c.id === p.id)).toBe(false);
  });
});
```
(The test setup resets the mock db between tests, as in `auth.test.ts`. If mutating `db()` leaks into other tests, **STOP** and write a blocker.)
**Verify:** `pnpm --filter @fixit/web test -- cards` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock provider card mapper (M05-T5)"`

### T6 — MSW handlers: `GET /catalog`, `GET /providers/featured`
- [x] done

**Files:** `src/mocks/handlers/catalog.ts`, `src/mocks/handlers/catalog.test.ts`, `src/mocks/handlers/index.ts`
**Context:** ARCH §3.2; `mockEndpoint` validates the response against the contract and handles DevPanel forced errors (AC6 uses "Force 500" on `providers_featured`).
**Do:**
1. Create `src/mocks/handlers/catalog.ts`:
```ts
import { ENDPOINTS as E, selectFeatured } from '@fixit/contracts';
import { mockEndpoint } from '../lib/endpoint';
import { listedCards } from '../lib/cards';

export const catalogHandlers = [
  mockEndpoint(E.catalog_get, ({ db: d }) => {
    const districts = [...d.districts].sort((a, b) => a.order - b.order);
    const districtOrder = new Map(districts.map((x, i) => [x.id, i]));
    const towns = d.towns
      .filter((t) => t.active && districtOrder.has(t.districtId))
      .sort(
        (a, b) =>
          (districtOrder.get(a.districtId) ?? 0) - (districtOrder.get(b.districtId) ?? 0) || a.order - b.order,
      );
    return {
      categories: d.categories
        .filter((c) => c.active)
        .sort((a, b) => a.order - b.order)
        .map(({ id, name, blurb, icon, order }) => ({ id, name, blurb, icon, order })),
      districts: districts.map(({ id, name, order }) => ({ id, name, order })),
      towns: towns.map(({ id, name, districtId }) => ({ id, name, districtId })),
    };
  }),
  mockEndpoint(E.providers_featured, ({ db: d }) => selectFeatured(listedCards(d))),
];
```
2. In `handlers/index.ts`: `import { catalogHandlers } from './catalog';` and set `catalog: catalogHandlers`.
3. Route order: `/providers/featured` must be matched before any future `/providers/:id`. Add a comment above `catalogHandlers`: `// Keep /providers/featured before /providers/:id (M07).`

**Test:** `src/mocks/handlers/catalog.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { CatalogResponse, ProviderCard, selectFeatured } from '@fixit/contracts';
import { z } from 'zod';
import { db } from '../db/store';
import { armForcedError } from '../lib/controls';
import { listedCards } from '../lib/cards';

const get = (path: string) => fetch(new URL(`/api${path}`, window.location.origin));

describe('GET /catalog', () => {
  it('returns active categories in admin order, towns grouped by district', async () => {
    const res = await get('/catalog');
    expect(res.status).toBe(200);
    const c = CatalogResponse.parse(await res.json());
    expect(c.categories).toHaveLength(8);
    expect(c.categories.map((x) => x.order)).toEqual([...c.categories.map((x) => x.order)].sort((a, b) => a - b));
    expect(c.districts.map((x) => x.name)).toEqual(['Colombo', 'Gampaha', 'Kalutara']);
    expect(c.towns.some((t) => t.id === 'dehiwala-mount-lavinia')).toBe(true);
    const firstIdx = (id: string) => c.towns.findIndex((t) => t.districtId === id);
    expect(firstIdx('colombo')).toBeLessThan(firstIdx('gampaha'));
  });
  it('hides an inactive category', async () => {
    const cat = db().categories[0];
    if (!cat) throw new Error('no categories');
    cat.active = false;
    const c = CatalogResponse.parse(await (await get('/catalog')).json());
    expect(c.categories.some((x) => x.id === cat.id)).toBe(false);
  });
});

describe('GET /providers/featured', () => {
  it('returns BR-08 selection, ≤ 4, all verified with reviews', async () => {
    const res = await get('/providers/featured');
    expect(res.status).toBe(200);
    const list = z.array(ProviderCard).parse(await res.json());
    expect(list.length).toBeLessThanOrEqual(4);
    expect(list.length).toBeGreaterThan(0);
    for (const p of list) expect(p.verified && p.reviewCount >= 1).toBe(true);
    expect(list.map((p) => p.id)).toEqual(selectFeatured(listedCards(db())).map((p) => p.id));
  });
  it('returns [] when no provider qualifies', async () => {
    for (const p of Object.values(db().providers)) p.verificationStatus = 'not_submitted';
    const list = z.array(ProviderCard).parse(await (await get('/providers/featured')).json());
    expect(list).toEqual([]);
  });
  it('honours a DevPanel forced 500', async () => {
    armForcedError('providers_featured', '500');
    expect((await get('/providers/featured')).status).toBe(500);
    expect((await get('/providers/districts-are-not-a-route')).status).not.toBe(500); // consumed once
  });
});
```
If the district ids in fixtures are not `colombo`/`gampaha`/`kalutara`, use the ids from `packages/fixtures/src/catalog.ts` (`DISTRICTS`) and say so in the commit body. Drop the last `expect` line of the forced-500 test if unmatched paths throw in the test MSW setup (`onUnhandledRequest: 'error'`).
**Verify:** `pnpm --filter @fixit/web test -- handlers/catalog` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): catalog and featured MSW handlers (M05-T6)"`

### T7 — Query keys, API calls and hooks
- [x] done

**Files:** `src/lib/query-keys.ts`, `src/features/site/api.ts`, `src/features/site/hooks.ts`, `src/features/site/hooks.test.tsx`
**Context:** ARCH §4.2 keys (`['catalog','catalog']`, `['catalog','featured']`); `http` + `pathOf` in `lib/http.ts` (parses the response with the schema).
**Do:**
1. In `qk` add:
```ts
  catalog: ['catalog', 'catalog'] as const,
  featured: ['catalog', 'featured'] as const,
```
2. `src/features/site/api.ts`:
```ts
import { ENDPOINTS as E, type CatalogResponse, type ProviderCard } from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export const fetchCatalog = (): Promise<CatalogResponse> =>
  http(pathOf(E.catalog_get), { schema: E.catalog_get.response });

export const fetchFeatured = (): Promise<ProviderCard[]> =>
  http(pathOf(E.providers_featured), { schema: E.providers_featured.response });
```
3. `src/features/site/hooks.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { fetchCatalog, fetchFeatured } from './api';

/** Active categories/districts/towns. Changes rarely (admin F-34). */
export const useCatalog = () =>
  useQuery({ queryKey: qk.catalog, queryFn: fetchCatalog, staleTime: 5 * 60_000 });

/** BR-08 featured providers (≤ 4). */
export const useFeatured = () => useQuery({ queryKey: qk.featured, queryFn: fetchFeatured });
```
**Test:** `src/features/site/hooks.test.tsx`
```tsx
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { armForcedError } from '@/mocks/lib/controls';
import { createWrapper } from '@/test/render';
import { useCatalog, useFeatured } from './hooks';

describe('site hooks', () => {
  it('useCatalog loads 8 categories', async () => {
    const { result } = renderHook(() => useCatalog(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.categories).toHaveLength(8);
  });
  it('useFeatured surfaces a 500 as error', async () => {
    armForcedError('providers_featured', '500');
    const { result } = renderHook(() => useFeatured(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- features/site/hooks` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): catalog and featured queries (M05-T7)"`

### T8 — `CategoryIcon` shared component
- [x] done

**Files:** `src/components/category-icon.tsx`
**Context:** SPEC §2.10 category rows; Notes for planner ("one shared component").
**Do:** Create:
```tsx
import {
  Drill,
  Hammer,
  PaintRoller,
  SprayCan,
  Sprout,
  WashingMachine,
  Wrench,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';
import type { CategoryIcon as CategoryIconName } from '@fixit/contracts';

export const CATEGORY_ICONS: Record<CategoryIconName, LucideIcon> = {
  wrench: Wrench,
  zap: Zap,
  'spray-can': SprayCan,
  sprout: Sprout,
  'paint-roller': PaintRoller,
  hammer: Hammer,
  drill: Drill,
  'washing-machine': WashingMachine,
};

/** Decorative category icon (SPEC §2.10). Unknown → Wrench (F-34 default). */
export function CategoryIcon({ icon, ...props }: { icon: CategoryIconName } & LucideProps) {
  const Icon = CATEGORY_ICONS[icon] ?? Wrench;
  return <Icon aria-hidden="true" {...props} />;
}
```
If ESLint flags `?? Wrench` as unnecessary (the record is exhaustive), remove `?? Wrench`.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): shared CategoryIcon (M05-T8)"`

### T9 — Home search URL builder
- [x] done

**Files:** `src/features/site/search-url.ts`, `src/features/site/search-url.test.ts`
**Context:** S1.E4, AC3, D-1.
**Do:**
```ts
/** S1.E4: `/discover?q={trimmed}&loc={townId}`; empty fields are omitted (D-1: no `cat` here). */
export function homeSearchUrl(input: { q: string; loc: string }): string {
  const params = new URLSearchParams();
  const q = input.q.trim();
  if (q) params.set('q', q);
  if (input.loc) params.set('loc', input.loc);
  const s = params.toString();
  return s ? `/discover?${s}` : '/discover';
}
```
**Test:**
```ts
import { describe, expect, it } from 'vitest';
import { homeSearchUrl } from './search-url';

describe('homeSearchUrl', () => {
  it('q + loc', () => {
    expect(homeSearchUrl({ q: ' plumb ', loc: 'dehiwala-mount-lavinia' })).toBe(
      '/discover?q=plumb&loc=dehiwala-mount-lavinia',
    );
  });
  it('omits empty fields', () => {
    expect(homeSearchUrl({ q: '   ', loc: '' })).toBe('/discover');
    expect(homeSearchUrl({ q: '', loc: 'panadura' })).toBe('/discover?loc=panadura');
  });
  it('encodes text', () => {
    expect(homeSearchUrl({ q: 'tap & sink', loc: '' })).toBe('/discover?q=tap+%26+sink');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- search-url` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): home search URL builder (M05-T9)"`

### T10 — `useProviderCta`
- [x] done

**Files:** `src/features/site/use-provider-cta.ts`, `src/features/site/use-provider-cta.test.tsx`
**Context:** S1.E12, S4.E3, AC5, D-3. `useAuth()` in `lib/auth-store.ts`; `signInAs` in `src/test/sign-in.ts`.
**Do:**
```ts
import { useAuth } from '@/lib/auth-store';

export type ProviderCta = { label: 'Join as a provider' | 'Go to your dashboard'; to: string } | null;

/** D-3 (UX only; the server decides). null = admin: no primary CTA. */
export function useProviderCta(): ProviderCta {
  const { status, me } = useAuth();
  if (status !== 'signed-in' || !me) return { label: 'Join as a provider', to: '/signup?intent=provider' };
  if (me.roles.includes('admin')) return null;
  if (me.roles.includes('provider')) return { label: 'Go to your dashboard', to: '/dashboard' };
  return { label: 'Join as a provider', to: '/become-a-provider/1' };
}
```
**Test:**
```tsx
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { signInAs } from '@/test/sign-in';
import { useProviderCta } from './use-provider-cta';

describe('useProviderCta', () => {
  it('guest → signup with provider intent', () => {
    authStore.setGuest();
    expect(renderHook(() => useProviderCta()).result.current).toEqual({
      label: 'Join as a provider',
      to: '/signup?intent=provider',
    });
  });
  it('customer (Olivia) → onboarding step 1', () => {
    signInAs('customer');
    expect(renderHook(() => useProviderCta()).result.current?.to).toBe('/become-a-provider/1');
  });
  it('provider (Marcus) → dashboard', () => {
    signInAs('provider');
    expect(renderHook(() => useProviderCta()).result.current).toEqual({
      label: 'Go to your dashboard',
      to: '/dashboard',
    });
  });
  it('admin → null', () => {
    signInAs('admin');
    expect(renderHook(() => useProviderCta()).result.current).toBeNull();
  });
});
```
If the admin persona key isn't `admin`, use the key from `DEMO_PERSONAS`.
**Verify:** `pnpm --filter @fixit/web test -- use-provider-cta` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): role-aware provider CTA hook (M05-T10)"`

### T11 — `useScrollToHash`
- [x] done

**Files:** `src/features/site/use-scroll-to-hash.ts`
**Context:** D-5, AC7, S1.E11.
**Do:**
```ts
import { useEffect } from 'react';
import { useLocation } from 'react-router';

/** D-5: after render, scroll to `location.hash` if that element exists. The target sets its own `scroll-mt-*`. */
export function useScrollToHash(ready = true): void {
  const { hash, key } = useLocation();
  useEffect(() => {
    if (!ready || !hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    el?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [hash, key, ready]);
}
```
`key` is in the deps so tapping the footer link again while already on `/#how-it-works` scrolls again. If jsdom lacks `matchMedia` in other tests that render Home, the setup in `src/test/media.ts` provides it; if not, **STOP** with a blocker.
**Verify:** `pnpm verify` green (behaviour checked in T18).
**Commit:** `git commit -m "feat(web): scroll to hash on site pages (M05-T11)"`

### T12 — Hero search bar with popular chips (S1.E4, S1.E5)
- [x] done

**Files:** `src/features/site/components/hero-search.tsx`
**Context:** S1.E4, S1.E5, S1 phone layout item 1, §2.9 "Search bar" (home variant), 01-home-desktop.png search bar + chips row. Reuses `useCatalog` (T7), `homeSearchUrl` (T9).
**Do:** Create the component. Full code:
```tsx
import { useId, useRef, useState, type FormEvent } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useCatalog } from '../hooks';
import { homeSearchUrl } from '../search-url';

const POPULAR = ['Plumbing', 'Cleaning', 'Electrical', 'Handyman'] as const;

export function HeroSearch() {
  const navigate = useNavigate();
  const { data: catalog } = useCatalog();
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const qRef = useRef<HTMLInputElement>(null);
  const qId = useId();
  const locId = useId();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void navigate(homeSearchUrl({ q, loc }));
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        role="search"
        aria-label="Search providers"
        onSubmit={onSubmit}
        className="border-border bg-surface shadow-search flex flex-col rounded-2xl border p-2 sm:flex-row sm:items-center sm:gap-2"
      >
        <label
          htmlFor={qId}
          className="focus-within:ring-primary flex h-14 min-w-0 flex-1 items-center gap-3 rounded-md px-3 focus-within:ring-2 sm:h-[60px]"
        >
          <Search aria-hidden="true" className="text-icon-subtle size-5 shrink-0" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-caption text-text font-bold">Service</span>
            <input
              id={qId}
              ref={qRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What service do you need?"
              maxLength={80}
              className="text-body text-text placeholder:text-text-subtle w-full bg-transparent outline-none sm:text-body-sm"
            />
          </span>
        </label>
        <span aria-hidden="true" className="bg-border mx-3 h-px sm:mx-0 sm:h-10 sm:w-px" />
        <label
          htmlFor={locId}
          className="focus-within:ring-primary relative flex h-14 min-w-0 items-center gap-3 rounded-md px-3 focus-within:ring-2 sm:h-[60px] sm:w-[220px]"
        >
          <MapPin aria-hidden="true" className="text-icon-subtle size-5 shrink-0" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-caption text-text font-bold">Location</span>
            <select
              id={locId}
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              className="text-body text-text w-full appearance-none truncate bg-transparent pr-6 outline-none sm:text-body-sm"
            >
              <option value="">All locations</option>
              {catalog?.districts.map((d) => (
                <optgroup key={d.id} label={d.name}>
                  {catalog.towns
                    .filter((t) => t.districtId === d.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </span>
          <ChevronDown aria-hidden="true" className="text-text-muted pointer-events-none absolute right-3 size-4" />
        </label>
        <Button type="submit" size="lg" className="mt-2 h-[52px] w-full rounded-lg sm:mt-0 sm:h-14 sm:w-auto sm:px-7">
          <Search aria-hidden="true" className="size-5" />
          Search
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-meta text-text-subtle">Popular:</span>
        {POPULAR.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setQ(label);
              qRef.current?.focus();
            }}
            className="border-border bg-surface text-meta text-text-muted hover:border-primary hover:text-primary focus-visible:ring-primary h-11 rounded-full border px-3 font-semibold focus-visible:ring-2 focus-visible:outline-none sm:h-8"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
```
States: catalog loading or failed → the select has only `All locations` (search still works, no error shown; the categories section shows the error). Submitting = plain navigation (no spinner).
Phone (≤640): form is `flex-col` → Service (56), divider (`h-px`), Location (56), full-width 52-high Search button r14; chips wrap with 44-high targets. ≥641: one row, fields 60 high, vertical divider.
**Verify:** `pnpm verify` green (behaviour tested in T18).
**Commit:** `git commit -m "feat(web): home hero search bar and popular chips (M05-T12)"`

### T13 — Hero section (S1.E1–E3, E6)
- [x] done

**Files:** `src/features/site/components/hero.tsx`
**Context:** S1 desktop item 1, phone item 1, tablet; S1.E1, E2, E3, E6; 01-home-desktop.png top band. Reuses `Stars`, `VerifiedBadge`-style `BadgeCheck`, `CategoryIcon`, `StatusPill` is **not** used (the `Accepted` pill here is decorative).
**Do:** Create `Hero({ floating }: { floating: ProviderCard | null })`. The page passes `featured.data?.[0] ?? null` (null while loading, on error and with 0 featured → card hidden, S1.E6 / AC6).
Skeleton:
```tsx
<section className="border-border bg-surface border-b">
  <div className="mx-auto grid max-w-[1240px] gap-10 px-4 pt-8 pb-12 sm:px-6 sm:pt-12 sm:pb-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:pt-[72px] lg:pb-[88px]">
    <div className="flex min-w-0 flex-col gap-6">
      {/* S1.E1 */}
      <span className="bg-success-soft text-success-text text-meta inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 font-bold">
        <BadgeCheck aria-hidden="true" className="size-4" /> Verified pros across the Western Province
      </span>
      {/* S1.E2 */}
      <h1 className="text-display text-text text-balance">
        Trusted local help, <span className="text-primary">right when you need it.</span>
      </h1>
      {/* S1.E3 */}
      <p className="text-body text-text-muted sm:text-lead max-w-[560px]">Find reviewed plumbers, electricians, cleaners and more near you — compare them side by side and send a request in minutes.</p>
      <HeroSearch />
    </div>
    {/* S1.E6 */}
    <div className="relative mb-6 lg:mb-0">
      <div aria-hidden="true" className="bg-primary-soft h-[220px] rounded-2xl sm:h-[320px] lg:h-[520px] lg:rounded-4xl" />
      {/* Accepted card: hidden on phone */}
      <div aria-hidden="true" className="bg-surface shadow-float absolute top-6 right-6 hidden items-center gap-3 rounded-xl px-4 py-3 sm:flex">
        <span className="bg-primary-soft text-primary text-meta inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-bold">
          <span className="bg-primary size-1.5 rounded-full" /> Accepted
        </span>
        <span className="text-meta text-text font-semibold">Your request was accepted</span>
      </div>
      {floating && (
        <Link
          to={`/providers/${floating.id}`}
          className="bg-surface shadow-float focus-visible:ring-primary absolute inset-x-3 -bottom-6 flex items-center gap-3 rounded-xl p-4 focus-visible:ring-2 focus-visible:outline-none lg:inset-x-auto lg:bottom-10 lg:-left-10 lg:w-[300px]"
        >
          {/* 44×44 r10: photo <img alt=""> object-cover, else primary-soft tile with CategoryIcon size-6 text-primary */}
          <span className="min-w-0 flex-1">
            <span className="text-label text-text block truncate font-bold">{floating.businessName}</span>
            <Stars rating={floating.rating} count={floating.reviewCount} size={12} />
          </span>
          {floating.verified && <BadgeCheck aria-label="Verified" className="text-success size-6 shrink-0" />}
        </Link>
      )}
    </div>
  </div>
</section>
```
Fill in the commented thumbnail exactly as described (`size-11 rounded-sm`). Imports: `BadgeCheck` from lucide, `Link` from react-router, `Stars` from `@/components/stars`, `CategoryIcon` from `@/components/category-icon`, `HeroSearch` from `./hero-search`, `type ProviderCard` from `@fixit/contracts`.
States: floating card hidden when `floating` is null. Hero photo: always the `primary-soft` panel (asset out of scope).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): home hero (M05-T13)"`

### T14 — Section header + category card + categories section (S1.E7, E8)
- [x] done

**Files:** `src/features/site/components/section-header.tsx`, `src/features/site/components/category-card.tsx`, `src/features/site/components/categories-section.tsx`, `src/components/skeletons.tsx`
**Context:** S1.E7, S1.E8, S1 phone item 2–3, §6.1 Category card skeleton, §6.3 section error; 01-home-desktop.png "Popular services". Reuses `LoadingRegion`, `SkeletonCategoryCard`, `SectionError`, `CategoryIcon`, `useCatalog`.
**Do:**
1. `section-header.tsx`:
```tsx
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export function SectionHeader({ id, title, sub, link }: {
  id: string; // h2 id, used by aria-labelledby on the section
  title: string;
  sub: string;
  link?: { label: string; to: string };
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-title-lg text-text">{title}</h2>
        <p className="text-body text-text-muted">{sub}</p>
      </div>
      {link && (
        <Link to={link.to} className="text-primary hover:text-primary-hover text-body-sm inline-flex min-h-11 items-center gap-1 font-bold sm:min-h-0">
          {link.label} <ArrowRight aria-hidden="true" className="size-5" />
        </Link>
      )}
    </div>
  );
}
```
2. `category-card.tsx` — props `{ category: Category }`; one `<Link to={`/discover?cat=${category.id}`}>` card:
   - Classes: `border-border bg-surface hover:border-primary hover:shadow-hover focus-visible:ring-primary flex h-full flex-col gap-3 rounded-xl border p-4 transition focus-visible:ring-2 focus-visible:outline-none motion-safe:hover:-translate-y-0.5 sm:p-5`
   - Icon tile: `bg-primary-soft text-primary grid h-10 w-11 place-items-center rounded-lg sm:h-12 sm:w-[52px]` with `<CategoryIcon icon={category.icon} className="size-6 sm:size-7" />`
   - Name: `text-title-xs text-text`; blurb: `text-body-sm text-text-subtle line-clamp-2`.
3. In `skeletons.tsx` make `SkeletonCategoryCard` match the phone box: container `p-4 sm:p-5`, icon block `h-10 w-11 sm:h-12 sm:w-[52px]`.
4. `categories-section.tsx`:
```tsx
export function CategoriesSection() {
  const catalog = useCatalog();
  return (
    <section aria-labelledby="popular-services" className="flex flex-col gap-6">
      <SectionHeader id="popular-services" title="Popular services" sub="Pick a category to see pros available near you." link={{ label: 'All services', to: '/discover' }} />
      {catalog.isError ? (
        <SectionError onRetry={() => void catalog.refetch()} />
      ) : (
        <LoadingRegion
          loading={catalog.isPending}
          skeleton={<div className={GRID}>{Array.from({ length: 8 }, (_, i) => <SkeletonCategoryCard key={i} />)}</div>}
        >
          <ul className={GRID}>
            {catalog.data?.categories.map((c) => <li key={c.id}><CategoryCard category={c} /></li>)}
          </ul>
        </LoadingRegion>
      )}
    </section>
  );
}
const GRID = 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4';
```
   (add the imports). States: loading → 8 skeletons after 150 ms; error → `SectionError` (`We couldn't load this.` / `Check your connection and try again.` / `Try again`), refetch only the catalog; success → cards in `order`. 0 active categories → render the empty `ul` (no SPEC copy; not reachable with fixtures).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): popular services section (M05-T14)"`

### T15 — Featured provider card (S1.E10)
- [x] done

**Files:** `src/features/site/components/featured-card.tsx`
**Context:** S1.E10, AC4, D-4, §6.1 Featured skeleton (180-high block; 160 on phone); 01-home-desktop.png "Featured providers" cards. Reuses `Stars`, `VerifiedBadge` (`size="sm"`), `CategoryIcon`, `priceParts` (T2), `Button`.
**Do:** Create `FeaturedCard({ provider }: { provider: ProviderCard })`:
```tsx
const price = priceParts(provider.startingPrice.amount, provider.startingPrice.unit);
return (
  <article className="border-border bg-surface hover:shadow-hover flex h-full flex-col overflow-hidden rounded-xl border transition">
    <div className="relative h-40 sm:h-[180px]">
      {provider.photoUrl ? (
        <img src={provider.photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <div className="bg-primary-soft text-primary grid size-full place-items-center">
          <CategoryIcon icon={provider.category.icon} className="size-12" />
        </div>
      )}
      {provider.verified && <VerifiedBadge size="sm" className="bg-surface shadow-badge absolute top-3 left-3" />}
    </div>
    <div className="flex flex-1 flex-col gap-2 p-4">
      <h3 className="text-title-xs text-text">
        <Link to={`/providers/${provider.id}`} className="hover:text-primary focus-visible:ring-primary rounded-xs focus-visible:ring-2 focus-visible:outline-none">
          {provider.businessName}
        </Link>
      </h3>
      <p className="text-meta text-text-subtle flex items-center gap-1">
        {provider.category.name} · <MapPin aria-hidden="true" className="text-icon-subtle size-3.5" /> {provider.baseTown.name}
      </p>
      <Stars rating={provider.rating} count={provider.reviewCount} size={13} />
      <div className="border-border mt-auto flex items-end justify-between gap-3 border-t pt-3">
        <div className="flex flex-col">
          <span className="text-meta text-text-subtle" aria-hidden={price.lead === null}>{price.lead ?? ' '}</span>
          <span className="whitespace-nowrap">
            <span className="text-title-xs text-text font-extrabold">{price.amount}</span>
            <span className="text-meta text-text-subtle font-medium">{price.suffix}</span>
          </span>
        </div>
        <Button asChild variant="outline" size="md">
          <Link to={`/providers/${provider.id}`} aria-label={`View profile: ${provider.businessName}`}>View profile</Link>
        </Button>
      </div>
    </div>
  </article>
);
```
If `VerifiedBadge` already has a `bg-success-soft` class that conflicts with `bg-surface`, drop `bg-surface` (keep `shadow-badge`). If `shadow-badge` is not a token in `globals.css`, omit it. Paused providers: no extra UI on Home (SPEC S1.E10 has none).
Also update `SkeletonFeaturedCard` in `src/components/skeletons.tsx`: image block `h-40 sm:h-[180px]`.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): featured provider card (M05-T15)"`

### T16 — Featured section (S1.E9)
- [x] done

**Files:** `src/features/site/components/featured-section.tsx`
**Context:** S1.E9, BR-08, AC1, AC6. Query is owned by the page (shared with the hero floating card), so this takes the query result as a prop.
**Do:**
```tsx
import type { UseQueryResult } from '@tanstack/react-query';
import type { ProviderCard } from '@fixit/contracts';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonFeaturedCard } from '@/components/skeletons';
import { FeaturedCard } from './featured-card';
import { SectionHeader } from './section-header';

const GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4';

export function FeaturedSection({ query }: { query: UseQueryResult<ProviderCard[]> }) {
  if (query.isSuccess && query.data.length === 0) return null; // S1.E9: hidden when 0 qualify
  return (
    <section aria-labelledby="featured-providers" className="flex flex-col gap-6">
      <SectionHeader
        id="featured-providers"
        title="Featured providers near you"
        sub="Highly rated, verified pros in the Western Province."
        link={{ label: 'See all providers', to: '/discover' }}
      />
      {query.isError ? (
        <SectionError onRetry={() => void query.refetch()} />
      ) : (
        <LoadingRegion
          loading={query.isPending}
          skeleton={<div className={GRID}>{Array.from({ length: 4 }, (_, i) => <SkeletonFeaturedCard key={i} />)}</div>}
        >
          <ul className={GRID}>
            {query.data?.map((p) => <li key={p.id}><FeaturedCard provider={p} /></li>)}
          </ul>
        </LoadingRegion>
      )}
    </section>
  );
}
```
States: loading → 4 skeletons; error → section error, retry refetches only featured; 0 → section not rendered; 1–4 → cards in API order.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): featured providers section (M05-T16)"`

### T17 — Steps grid (S1.E11 / S4.E4)
- [x] done

**Files:** `src/features/site/components/steps-grid.tsx`
**Context:** S1.E11, S4.E4, S1 tablet rule ("3 columns if ≥ 900 px, otherwise 1"); 01-home-desktop.png "How it works" cards (icon tile 56 r16, big faint numeral right, title, copy; step 3 tile `cta`).
**Do:**
```tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step { n: '01' | '02' | '03'; title: string; body: string; icon: LucideIcon; accent?: boolean }

export function StepsGrid({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-3 lg:gap-6">
      {steps.map(({ n, title, body, icon: Icon, accent }) => (
        <li key={n} className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-6 lg:p-8">
          <div className="flex items-start justify-between">
            <span className={cn('grid size-14 place-items-center rounded-xl', accent ? 'bg-cta text-on-cta' : 'bg-primary text-primary-foreground')}>
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <span aria-hidden="true" className="text-title-xl text-border">{n}</span>
          </div>
          <h3 className="text-title-md text-text"><span className="sr-only">{n} </span>{title}</h3>
          <p className="text-body-sm text-text-muted">{body}</p>
        </li>
      ))}
    </ol>
  );
}
```
`min-[900px]:` is the single SPEC-mandated exception to "sm/lg only" (S1 tablet rule). If lint forbids it, use `lg:grid-cols-3` and record the deviation under Blockers as a note (do not stop).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): steps grid (M05-T17)"`

### T18 — CTA band (S1.E12 / S4.E6)
- [ ] done

**Files:** `src/features/site/components/cta-band.tsx`
**Context:** S1.E12, S4.E6, S1 phone item 6, AC5; 01-home-desktop.png blue band (`cta` button + outline `Learn more` on blue). Reuses `useProviderCta` (T10), `Button` (`cta` variant).
**Do:**
```tsx
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useProviderCta } from '../use-provider-cta';

export function CtaBand({ title, body, learnMore }: { title: string; body: string; learnMore: boolean }) {
  const cta = useProviderCta();
  return (
    <section aria-labelledby="cta-band" className="bg-primary text-primary-foreground flex flex-col gap-6 rounded-2xl px-6 py-7 lg:flex-row lg:items-center lg:justify-between lg:rounded-3xl lg:px-14 lg:py-12">
      <div className="flex flex-col gap-2">
        <h2 id="cta-band" className="text-title-lg tracking-tight">{title}</h2>
        <p className="text-body text-on-primary-muted max-w-[600px]">{body}</p>
      </div>
      {(cta ?? learnMore) && (
        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          {cta && (
            <Button asChild variant="cta" size="lg" className="w-full sm:w-auto">
              <Link to={cta.to}>{cta.label}{cta.label === 'Join as a provider' && <ArrowRight aria-hidden="true" className="size-5" />}</Link>
            </Button>
          )}
          {learnMore && (
            <Button asChild size="lg" className="border-cta-outline text-primary-foreground hover:bg-primary-hover w-full border-[1.5px] bg-transparent sm:w-auto">
              <Link to="/for-providers">Learn more</Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
```
Phone: padding 28/24 (`px-6 py-7`), radius 20, text stacks over full-width 48 buttons. If `cta ?? learnMore` trips `@typescript-eslint/prefer-nullish-coalescing` / boolean lint rules, write `(cta !== null || learnMore)`.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): provider CTA band (M05-T18)"`

### T19 — Home page assembly + wiring
- [ ] done

**Files:** `src/features/site/pages/home-page.tsx`, `src/features/site/pages/home-page.test.tsx`, `src/app/chunks/home.tsx`
**Context:** S1 desktop/phone order, section-gap 88/56, AC1–AC6, AC7 (hash). Reuses all of T12–T18, `useFeatured`, `useScrollToHash`.
**Do:**
1. `home-page.tsx`:
```tsx
import { ArrowLeftRight, Search, Send } from 'lucide-react';
import { CategoriesSection } from '../components/categories-section';
import { CtaBand } from '../components/cta-band';
import { FeaturedSection } from '../components/featured-section';
import { Hero } from '../components/hero';
import { StepsGrid, type Step } from '../components/steps-grid';
import { useFeatured } from '../hooks';
import { useScrollToHash } from '../use-scroll-to-hash';

const STEPS: readonly Step[] = [
  { n: '01', title: 'Search', icon: Search, body: "Tell us what you need and where. We'll show local pros who do exactly that." },
  { n: '02', title: 'Compare', icon: ArrowLeftRight, body: 'Check ratings, reviews, prices and Verified badges to pick the right fit.' },
  { n: '03', title: 'Request', icon: Send, accent: true, body: "Send a service request with your details. The provider accepts and you're booked." },
];

export function HomePage() {
  const featured = useFeatured();
  useScrollToHash(!featured.isPending);
  return (
    <div className="bg-page flex flex-col">
      <Hero floating={featured.data?.[0] ?? null} />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-14 px-4 py-14 sm:px-6 lg:gap-[88px] lg:px-8 lg:py-[88px]">
        <CategoriesSection />
        <FeaturedSection query={featured} />
        <section id="how-it-works" aria-labelledby="how-it-works-title" className="flex scroll-mt-[72px] flex-col gap-8">
          <div className="flex flex-col items-center gap-1 text-center">
            <h2 id="how-it-works-title" className="text-title-lg text-text">How it works</h2>
            <p className="text-body text-text-muted">Get the job done in three simple steps.</p>
          </div>
          <StepsGrid steps={STEPS} />
        </section>
        <CtaBand
          title="Are you a service provider? Join us."
          body="List your business, get verified and receive requests from customers in your area — free to join."
          learnMore
        />
      </div>
    </div>
  );
}
```
2. `src/app/chunks/home.tsx` → `export { HomePage } from '@/features/site/pages/home-page';`
3. Set `document.title`? Only if other pages (M04) do it; follow the existing pattern, else skip.

**Test:** `home-page.test.tsx` (uses `renderRoute`, real routes + MSW):
```tsx
import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('S1 Home', () => {
  it('search hand-off: q + loc, empty omitted (AC3)', async () => {
    authStore.setGuest();
    const user = userEvent.setup();
    const { location } = renderRoute('/');
    await user.type(await screen.findByLabelText('Service'), 'plumb');
    const loc = screen.getByLabelText('Location');
    await waitFor(() => expect(within(loc).getByRole('option', { name: 'Dehiwala-Mount Lavinia' })).toBeInTheDocument());
    await user.selectOptions(loc, 'dehiwala-mount-lavinia');
    await user.type(screen.getByLabelText('Service'), '{Enter}');
    await waitFor(() => expect(location()).toBe('/discover?q=plumb&loc=dehiwala-mount-lavinia'));
  });
  it('chip fills the input without submitting (AC3)', async () => {
    authStore.setGuest();
    const user = userEvent.setup();
    const { location } = renderRoute('/');
    await user.click(await screen.findByRole('button', { name: 'Cleaning' }));
    expect(screen.getByLabelText('Service')).toHaveValue('Cleaning');
    expect(location()).toBe('/');
  });
  it('category card links to /discover?cat= (AC4)', async () => {
    authStore.setGuest();
    renderRoute('/');
    expect(await screen.findByRole('link', { name: /Plumbing/ })).toHaveAttribute('href', '/discover?cat=plumbing');
  });
  it('featured cards: ≤ 4, From price, profile links (AC1, AC4)', async () => {
    authStore.setGuest();
    renderRoute('/');
    const section = (await screen.findByRole('heading', { name: 'Featured providers near you' })).closest('section');
    if (!section) throw new Error('no section');
    await waitFor(() => expect(within(section).getAllByRole('article').length).toBeGreaterThan(0));
    const cards = within(section).getAllByRole('article');
    expect(cards.length).toBeLessThanOrEqual(4);
    const first = within(cards[0] as HTMLElement).getAllByRole('link')[0];
    expect(first?.getAttribute('href')).toMatch(/^\/providers\//);
  });
  it('featured 500 shows a section error; categories still render (AC6)', async () => {
    authStore.setGuest();
    armForcedError('providers_featured', '500');
    renderRoute('/');
    expect(await screen.findByText("We couldn't load this.")).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Plumbing/ })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Featured providers near you' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("We couldn't load this.")).not.toBeInTheDocument());
  });
  it('0 qualifying providers hides Featured and the floating card (AC6)', async () => {
    for (const p of Object.values(db().providers)) p.verificationStatus = 'not_submitted';
    authStore.setGuest();
    renderRoute('/');
    await screen.findByRole('link', { name: /Plumbing/ });
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Featured providers near you' })).not.toBeInTheDocument());
  });
  it.each([
    ['guest', null, 'Join as a provider', '/signup?intent=provider'],
    ['customer', 'customer', 'Join as a provider', '/become-a-provider/1'],
    ['provider', 'provider', 'Go to your dashboard', '/dashboard'],
  ] as const)('CTA band for %s (AC5)', async (_, persona, label, href) => {
    if (persona) signInAs(persona);
    else authStore.setGuest();
    renderRoute('/');
    const band = (await screen.findByRole('heading', { name: 'Are you a service provider? Join us.' })).closest('section');
    if (!band) throw new Error('no band');
    expect(within(band).getByRole('link', { name: label })).toHaveAttribute('href', href);
    expect(within(band).getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', '/for-providers');
  });
});
```
If `renderRoute` needs the auth bootstrap to finish first (status `booting` renders nothing), follow how M04 page tests set the guest state; adapt only the setup lines.
**Verify:** `pnpm --filter @fixit/web test -- home-page` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S1 home page (M05-T19)"`

### T20 — S4 For providers page
- [ ] done

**Files:** `src/features/site/pages/for-providers-page.tsx`, `src/features/site/pages/for-providers-page.test.tsx`, `src/app/chunks/public.tsx`
**Context:** S4 (all elements), AC5 (S4 primary CTA and band). Reuses `StepsGrid`, `CtaBand` (`learnMore={false}`), `useProviderCta`.
**Do:**
1. Page structure:
   - Hero band: `<section className="border-border bg-surface border-b"><div className="mx-auto flex max-w-[720px] flex-col items-center gap-6 px-4 pt-8 pb-12 text-center sm:px-6 lg:px-8 lg:py-[72px]">`
     - S4.E1 pill: `bg-success-soft text-success-text text-meta rounded-full px-3 py-1 font-bold` → `Free to join`
     - S4.E2 H1 `text-title-xl text-text text-balance`: `Get local jobs without paying to join.`; lead `text-body sm:text-lead text-text-muted`: `List your business on Fixit, get verified and receive requests from customers in the Western Province. Customers pay you directly — Fixit takes no commission.`
     - S4.E3: `const cta = useProviderCta();` if non-null: `<Button asChild size="lg" className="w-full sm:w-auto"><Link to={cta.to}>{cta.label}</Link></Button>`; admin → nothing.
   - Body: `<div className="mx-auto flex w-full max-w-[1240px] flex-col gap-14 px-4 py-14 sm:px-6 lg:gap-[88px] lg:px-8 lg:py-[88px]">`
     - S4.E4: `<section aria-labelledby="provider-steps">` with centred H2 `text-title-lg` `How it works for providers` and `StepsGrid` steps: `01 Create your listing` / `Add your business, services, prices and the towns you cover.` (`BriefcaseBusiness`); `02 Get verified` / `Upload your NIC, and your trade certificate if you have one. We check it and add the Verified badge.` (`ShieldCheck`); `03 Receive requests` / `Accept the jobs that suit you, contact the customer and get paid directly.` (`Inbox`, `accent: true`).
     - S4.E5: card `border-border bg-surface mx-auto w-full max-w-[720px] rounded-2xl border p-6 lg:p-8`; H2 `text-title-md` `What you'll need`; `<ul className="mt-4 flex flex-col gap-3">` items `flex gap-3 text-body text-text` with `<CircleCheck aria-hidden className="text-success size-5 shrink-0 mt-0.5" />`: `A mobile number`, `Your NIC (front and back)`, `Your prices for each service`, `Optional: trade certificate or NVQ, business registration`.
     - S4.E6: `<CtaBand title="Ready to get started?" body="It takes about 10 minutes to set up your listing." learnMore={false} />`
2. In `chunks/public.tsx` replace the `ForProvidersPage` placeholder with `export { ForProvidersPage } from '@/features/site/pages/for-providers-page';` (keep the other placeholders until T21–T23).

**Test:** `for-providers-page.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('S4 For providers', () => {
  it.each([
    ['guest', null, 'Join as a provider', '/signup?intent=provider'],
    ['customer', 'customer', 'Join as a provider', '/become-a-provider/1'],
    ['provider', 'provider', 'Go to your dashboard', '/dashboard'],
  ] as const)('both CTAs for %s (AC5)', async (_, persona, label, href) => {
    if (persona) signInAs(persona);
    else authStore.setGuest();
    renderRoute('/for-providers');
    await screen.findByRole('heading', { name: 'Get local jobs without paying to join.' });
    const links = screen.getAllByRole('link', { name: label });
    expect(links).toHaveLength(2);
    for (const l of links) expect(l).toHaveAttribute('href', href);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- for-providers` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S4 for providers page (M05-T20)"`

### T21 — Article card + About page
- [ ] done

**Files:** `src/features/site/components/article-card.tsx`, `src/features/site/pages/about-page.tsx`, `src/app/chunks/public.tsx`
**Context:** S11 layout + About row; BR-20 tooltip sentence — copy it verbatim from PRODUCT BR-20 (`grep -n "BR-20" docs/PRODUCT.md`). If BR-20 has no single sentence to copy, **STOP** with a blocker.
**Do:**
1. `article-card.tsx`:
```tsx
import type { ReactNode } from 'react';

/** S11: main 48/32/88 (phone 24/16/56), white card max 720 r20, padding 40 (phone 24). */
export function ArticleCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-4 pt-6 pb-14 sm:px-6 sm:pt-12 lg:px-8 lg:pb-[88px]">
      <article className="border-border bg-surface mx-auto flex max-w-[720px] flex-col rounded-2xl border p-6 lg:p-10">
        <h1 className="text-title-lg text-text">{title}</h1>
        <div className="text-body text-text-muted flex flex-col gap-4 leading-[26px] [&_a]:text-primary [&_a]:font-semibold [&_h2]:text-title-md [&_h2]:text-text [&_h2]:mt-8 [&_h2]:-mb-2 mt-4">
          {children}
        </div>
      </article>
    </div>
  );
}
```
   If lint rejects the `[&_…]` variants, apply the same classes directly on each `h2`/`a` in the pages instead.
2. `about-page.tsx`: `<ArticleCard title="About Fixit">` with the S11 About body `<p>`, `<h2>How Fixit works</h2><p>…</p>`, `<h2>What "Verified" means</h2><p>{BR-20 sentence}</p>` — exact copy from SPEC S11.
3. `chunks/public.tsx`: re-export `AboutPage` from the feature.
**Verify:** `pnpm verify` green; tested in T23.
**Commit:** `git commit -m "feat(web): S11 about page (M05-T21)"`

### T22 — Contact page
- [ ] done

**Files:** `src/features/site/pages/contact-page.tsx`, `src/app/chunks/public.tsx`
**Context:** S11 Contact row; `CONTACT_EMAIL` from `@/lib/env` (`VITE_CONTACT_EMAIL`, default `hello@fixit.test`).
**Do:** `<ArticleCard title="Contact us">`:
- `<p>Email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we'll reply within 2 working days.</p>`
- `<h2>Deleting your account</h2><p>To delete your account, email us from the address you signed up with.</p>`
- `<h2>Problems with a job</h2><p>Contact the provider first using the phone number shown on your request. If that doesn't work, email us with your request reference (like FX-2061).</p>`
Re-export `ContactPage` in `chunks/public.tsx`. If `VITE_CONTACT_EMAIL` is missing from `/.env.example`, add `VITE_CONTACT_EMAIL=hello@fixit.test`.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S11 contact page (M05-T22)"`

### T23 — Privacy page + S11 tests
- [ ] done

**Files:** `src/features/site/pages/privacy-page.tsx`, `src/features/site/pages/site-pages.test.tsx`, `src/app/chunks/public.tsx`
**Context:** S11 Privacy row, AC7.
**Do:**
1. Page:
```tsx
import { ArticleCard } from '../components/article-card';

export const PRIVACY_HEADINGS = [
  'What we collect',
  'Your national ID and other documents',
  'Who sees your details',
  'How long we keep it',
  'Your choices',
  'Contact',
] as const;

/** Body copy comes from the legal draft before launch (M22, M00 gap #1). */
export function PrivacyPage() {
  return (
    <ArticleCard title="Privacy">
      {PRIVACY_HEADINGS.map((h) => (
        <section key={h} className="flex flex-col gap-4">
          <h2>{h}</h2>
          <p className="text-body-sm text-text-subtle">Content coming before launch.</p>
        </section>
      ))}
    </ArticleCard>
  );
}
```
2. Re-export `PrivacyPage`. `chunks/public.tsx` should now only keep the `DiscoverPage` and `ProviderProfilePage` placeholders.

**Test:** `site-pages.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { renderRoute } from '@/test/render';
import { PRIVACY_HEADINGS } from './privacy-page';

describe('S11 pages', () => {
  it('about', async () => {
    authStore.setGuest();
    renderRoute('/about');
    expect(await screen.findByRole('heading', { level: 1, name: 'About Fixit' })).toBeInTheDocument();
  });
  it('contact shows the contact email (AC7)', async () => {
    authStore.setGuest();
    renderRoute('/contact');
    expect(await screen.findByRole('link', { name: 'hello@fixit.test' })).toHaveAttribute('href', 'mailto:hello@fixit.test');
  });
  it('privacy shows every heading with the placeholder (AC7)', async () => {
    authStore.setGuest();
    renderRoute('/privacy');
    for (const h of PRIVACY_HEADINGS) expect(await screen.findByRole('heading', { level: 2, name: h })).toBeInTheDocument();
    expect(screen.getAllByText('Content coming before launch.')).toHaveLength(PRIVACY_HEADINGS.length);
  });
});
```
If the test env sets a different `VITE_CONTACT_EMAIL`, assert on `CONTACT_EMAIL` from `@/lib/env` instead.
**Verify:** `pnpm --filter @fixit/web test -- site-pages` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S11 privacy page (M05-T23)"`

### T24 — M05 acceptance
- [ ] done

**Files:** `docs/plans/PLAN-M05-home-site-pages.md` (results table appended), `docs/milestones/M00-index.md` (status only, if that file tracks milestone status)
**Do:** Run `pnpm verify` (must be green), then `pnpm dev:mock` and walk each criterion. Record ✅/❌ with a one-line note per row in a `## Acceptance results` section at the end of this plan. Any ❌ that is a code bug: fix it in a separate `fix(web): … (M05-T24)` commit with a test that fails first. Anything a human must judge visually: mark "human check".

| AC | Check |
|---|---|
| 1 | 1440px, guest, `/`: eyebrow `Verified pros across the Western Province`, H1, lead, search with Service + Location `<optgroup>`s Colombo / Gampaha / Kalutara; 8 categories in 4 columns; ≤ 4 featured (all Verified, with reviews, highest rating first; compare with `GET /api/providers/featured` in DevTools); How it works 3 steps; CTA band; footer. `home-page.test.tsx` covers counts. |
| 2 | DevTools 390px: search stacks (Service, divider, Location, full-width Search); hero panel under the search with only the provider floating card; categories 2 columns, blurbs ≤ 2 lines; featured 1 column; CTA buttons full width; `document.documentElement.scrollWidth === 390` in the console. 800px: categories and featured 2 columns. |
| 3 | `home-page.test.tsx` "search hand-off" + "chip" tests; manually type `plumb`, pick Dehiwala-Mount Lavinia, Enter → `/discover?q=plumb&loc=dehiwala-mount-lavinia`; empty → `/discover`. |
| 4 | Click Plumbing card → `/discover?cat=plumbing`. Featured name and `View profile` → `/providers/{id}`; price shows `From` over `LKR 2,500 / hour` style; no-photo providers show the category icon tile. |
| 5 | DevPanel: guest → `/signup?intent=provider`; Olivia → `/become-a-provider/1`; Marcus → `Go to your dashboard` → `/dashboard`; same on `/for-providers` (hero CTA + band). Tests in T19/T20. |
| 6 | DevPanel latency `slow`: skeletons for categories (8) and featured (4) with no layout jump. DevPanel force 500 on `providers_featured`, reload: featured section error with `Try again`; search and categories work; `Try again` recovers. 0 qualifying: test in T19 (also hides the floating card). |
| 7 | `/about`, `/contact`, `/privacy` at 1440 and 390 (card padding 24 and 16 gutter on phone); Contact shows `hello@fixit.test`; Privacy headings + `Content coming before launch.`; from `/about`, footer "How it works" → Home scrolls so the heading sits just under the 72px nav. |

**Verify:** `pnpm verify` green; results table filled.
**Commit:** `git commit -m "chore: M05 acceptance checks (M05-T24)"`, then `git tag m05-done`.

## Checkpoints
- After T13: "Human: run `pnpm dev:mock`, open `/` at 1440 and 390, compare the hero with `reference/screens/01-home-desktop.png` (top band). The phone layout follows SPEC S1 phone rules, not `01-home-phone.png` (the prototype phone render is broken)."
- After T19: "Human: open `/` at 1440, 800 and 390; compare with `01-home-desktop.png` and `02-home-how-desktop.png`; check no horizontal scroll at 390."
- After T23: "Human: open `/for-providers`, `/about`, `/contact`, `/privacy` at 1440 and 390."

## Blockers
(executor writes here; leave empty)

## Nice-to-haves (not tasks)
- Move `FeaturedCard` to `components/` when S17 Saved providers (F-10) reuses it.
- Real hero photo asset with `primary-soft` fallback on load error.
- `document.title` per site page if the app adopts a title convention.
