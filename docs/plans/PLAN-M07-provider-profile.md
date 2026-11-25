# PLAN-M07 — Provider public profile
Milestone: `docs/milestones/M07-provider-profile.md` · Start tag: `m07-start` · Verify-all: `pnpm verify`
Mock domains at start → end: all → all (`catalog` gains `GET /providers/:id` and `GET /providers/:id/reviews`; `requests` gains its first handler, `GET /me/request-eligibility/:providerId`). **No backend in this milestone** (`apps/api` does not exist yet), so there are no Nest tasks and no authorization-matrix rows. The mocks apply the role rules through `mockEndpoint` and the business rules through contracts functions, as the API will.

Conventions for the executor:
- T1 creates tag `m07-start` and branch `m07-provider-profile` from the current HEAD. One commit per task, using the message given, ending with the attribution lines from your session instructions.
- Run `pnpm format` before `pnpm verify` in every task. Code below may not be Prettier-exact.
- Code blocks are complete files unless the step says "add", "replace" or "edit". Tests import `describe/expect/it/vi` from `vitest` explicitly.
- Paths are under `apps/web/` unless they start with `packages/`, `docs/` or `/`. `@/` = `apps/web/src/`.
- Tailwind: only `sm` (≥641) and `lg` (≥1024) prefixes. Arbitrary **size/grid** values are allowed (`w-[220px]`, `grid-cols-[88px_minmax(0,1fr)]`). Arbitrary colour values and lint-banned prefixes (`text-[`, `bg-[`, `border-[`, `shadow-[`, `ring-[`, `outline-[`) are not. Token classes used in this plan: `bg-surface bg-page bg-primary-soft bg-success-soft bg-warning-soft bg-surface-muted bg-tooltip-bg text-text text-text-muted text-text-subtle text-primary text-success text-success-text text-warning-text text-primary-foreground text-icon-subtle border-border border-border-strong shadow-tooltip`, type scale `text-title-xl text-title-lg text-title-md text-price-xl text-lead text-body text-body-sm text-label text-meta text-caption`, radii `rounded-xs…rounded-3xl rounded-full`, spacing token `w-aside` (380, `--spacing-aside`).
- Copy in backticks is SPEC copy, character for character.
- If a library API differs from what the code assumes (React Router 7, TanStack Query 5, zod 4, radix-ui, lucide-react names), **STOP** and write a blocker.

Planner's decisions the executor must follow:
- **D-1 Review paging window** (decision record written in T1): `GET /providers/:id/reviews?page=n`. Page 1 = 5 newest (`PAGE_SIZE.reviewsFirst`), page n ≥ 2 = the next 10 (`PAGE_SIZE.reviewsMore`), offset `5 + (n − 2) × 10`. The `size` query param in ARCH §3.2 is dropped because plain `page × size` cannot express "5, then 10 more" without skipping or repeating reviews. `pageSize` in the response is 5 or 10; `totalPages = total ≤ 5 ? 1 : 1 + ceil((total − 5) / 10)` (0 when total = 0).
- **D-2 Client-side states.** The web asks the server for `Eligibility` only when signed in as a **non-admin** (the endpoint is `U`; an admin call is 403 by ARCH §3). `guest` (signed out) and `admin` (me.roles includes admin) are produced client-side. This is UX only: S12/POST re-check everything.
- **D-3 SPEC evaluation order** is applied by two pure functions: `evaluateEligibility()` in contracts (server side: admin → own_listing → provider_unavailable → provider_paused → open_with_provider → open_limit_reached → email_unconfirmed → ok) and `toRequestAction()` on the web (maps a state to a rendering; `guest` with a paused provider renders as paused, because paused precedes guest in the SPEC table).
- **D-4 `email_unconfirmed` and `provider_unavailable`** are not rows in the S3 table. On S3 `email_unconfirmed` renders as **Otherwise** (enabled, → `/providers/{id}/request`; S12 shows the confirm-first block, SPEC §8.4). `provider_unavailable` cannot occur on a rendered profile (the profile itself is 404); it renders as **hidden**. If eligibility fails to load, render **Otherwise** (the server re-checks on S12).
- **D-5 New fixtures** (T6): `p12` Ranasinghe Garden Care (listed, 0 reviews → `New`), `p13` Lanka Paint Works (listed, **paused**), `p14` Jayasekara Carpentry owned by the already-suspended `u-ruwan` (published but hidden, BR-41), and customer `u-dilani` (Dilani Fernando, `dilani@fixit.test`) with **5 pending** requests FX-1990…FX-1994 to p03–p07, exposed as DevPanel persona `customerAtLimit`. Listed providers go from 10 → 12. MOCK_DB_VERSION is bumped to 3 so browsers reseed (the data, not the shape, changed — bumping is the only way existing dev browsers pick it up).
- **D-6 Phone sticky bar padding.** The bar is `fixed`, so it also covers the footer. While the profile is mounted it adds `pb-36 sm:pb-0` to `document.body` (hook `useBodyClass`), which clears the bar for the whole page, footer included.
- **D-7 Verified tooltip** = radix `Popover` controlled by our own `<button>` (not `PopoverTrigger`): hover / focus open, click toggles, Esc and tap-outside close via radix, blur and mouse-leave close. A click within 400 ms after a focus-open is ignored (a tap fires focus then click; without this the tap would open and immediately close). The tooltip text also lives in an always-rendered `sr-only` span that the button's `aria-describedby` points at.
- **D-8 Load-more failure** keeps the loaded reviews and shows `SectionError` under them (its `Try again` calls `fetchNextPage`). First-page failure replaces the list with `SectionError` (AC7).

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `docs/decisions/003-profile-reviews-paging.md` | Create | D-1 record |
| `docs/ARCHITECTURE.md` | Modify | §3.2 reviews row: `PageQuery` (window per decision 003) |
| `packages/contracts/src/providers/schemas.ts` | Create | `Service` |
| `packages/contracts/src/catalog/schemas.ts` | Modify | `ProviderPublicProfile`, `PublicReview`, `PublicReviewPage` |
| `packages/contracts/src/catalog/profile.ts` (+ test) | Create | `orderAreas`, `reviewsWindow`, `reviewsTotalPages` |
| `packages/contracts/src/requests/schemas.ts` | Modify | `Eligibility` |
| `packages/contracts/src/requests/eligibility.ts` (+ test) | Create | `evaluateEligibility` |
| `packages/contracts/src/endpoints.ts` (+ test) | Modify | `providers_get`, `providers_reviews`, `requests_eligibility` |
| `packages/contracts/src/index.ts` | Modify | exports |
| `packages/fixtures/src/{providers,users,requests,build}.ts`, `build.test.ts` | Modify | D-5 fixtures |
| `src/mocks/db/schema.ts` | Modify | version 3 |
| `src/mocks/lib/profile.ts` (+ test) | Create | `toPublicProfile`, `publicReviewsPage`, `eligibilityFor` |
| `src/mocks/handlers/catalog.ts` (+ test) | Modify | two GET handlers |
| `src/mocks/handlers/requests.ts` (+ test) | Create | eligibility handler |
| `src/mocks/handlers/index.ts` | Modify | register `requests` |
| `src/lib/query-keys.ts` | Modify | `provider`, `providerReviews`, `eligibility` |
| `src/lib/format.ts` (+ test) | Modify | `formatReviewDate` |
| `src/lib/use-body-class.ts` | Create | D-6 |
| `src/features/provider-profile/api.ts` | Create | fetchers |
| `src/features/provider-profile/hooks.ts` (+ test) | Create | `useProviderProfile`, `useProviderReviews`, `useRequestAction` |
| `src/features/provider-profile/request-action.ts` (+ test) | Create | `toRequestAction` |
| `src/features/provider-profile/components/*.tsx` | Create | header, badge tooltip, request button, sections, sticky bar, skeleton |
| `src/features/provider-profile/pages/provider-profile-page.tsx` (+ test) | Create | S3 |
| `src/app/chunks/public.tsx` | Modify | real page instead of placeholder |

## Tasks

### T1 — Decision record for review paging
- [x] done
**Files:** `docs/decisions/003-profile-reviews-paging.md`, `docs/ARCHITECTURE.md`
**Context:** ARCH §3.2 row `GET /providers/:id/reviews` says `PageQuery + size (5|10)`; SPEC S3.E11 says 5, then 10 more. D-1.
**Do:**
1. `git tag m07-start && git checkout -b m07-provider-profile`.
2. Create the decision file (same layout as `002-…`):
```md
# 003 — Profile reviews: fixed 5-then-10 window
Date: 2026-11-25 · Status: accepted · Milestone: M07

## Context
SPEC S3.E11 shows the 5 newest reviews, then `Show more reviews` loads 10 more. ARCH §3.2 gave the endpoint `PageQuery + size (5|10)`. With plain page × size paging, page 2 of size 10 starts at review 11, so reviews 6–10 would be skipped (or repeated if the client re-requests page 1 at size 10).

## Decision
`GET /providers/:id/reviews` takes `PageQuery` only. Page 1 = the 5 newest visible reviews; page n ≥ 2 = the next 10, offset `5 + (n − 2) × 10`. The response is `Paginated<PublicReview>` with `pageSize` 5 or 10 and `totalPages = total = 0 ? 0 : total ≤ 5 ? 1 : 1 + ceil((total − 5) / 10)`. The window is `reviewsWindow(page)` in `@fixit/contracts` (shared by mocks and API).

## Consequences
`size` is not accepted. The client uses an infinite query and stops when the loaded count reaches `total`.
```
3. In `docs/ARCHITECTURE.md` §3.2 replace `| PageQuery + \`size\` (5\|10) |` in the reviews row with `| PageQuery (window: decision 003) |`.
**Verify:** `pnpm format:check` passes.
**Commit:** `git commit -m "docs: decision 003 profile reviews paging (M07-T1)"`

### T2 — `Service`, `ProviderPublicProfile`, `PublicReview` schemas
- [x] done
**Files:** `packages/contracts/src/providers/schemas.ts`, `packages/contracts/src/catalog/schemas.ts`, `packages/contracts/src/index.ts`
**Context:** ARCH §2.5. `Service` is only the entity here; `ServiceBody` arrives with S23 (not this milestone).
**Do:**
1. Create `packages/contracts/src/providers/schemas.ts`:
```ts
import { z } from 'zod';
import { PriceUnit } from '../common/enums';
import { Id, Lkr } from '../common/primitives';

export const Service = z.object({ id: Id, name: z.string(), price: Lkr, unit: PriceUnit });
export type Service = z.infer<typeof Service>;
```
2. In `catalog/schemas.ts` add imports `IsoDateTime` (from `../common/primitives`) and `Service` (from `../providers/schemas`), and append:
```ts
export const ProfileArea = TownRef.extend({ isBase: z.boolean() });
export type ProfileArea = z.infer<typeof ProfileArea>;

export const ProviderPublicProfile = ProviderCard.extend({
  ownerName: z.string(),
  services: z.array(Service),
  areas: z.array(ProfileArea), // base first, rest alphabetical (orderAreas)
  ratingSummary: z.object({ rating: z.number().nullable(), reviewCount: z.number().int() }),
});
export type ProviderPublicProfile = z.infer<typeof ProviderPublicProfile>;

export const PublicReview = z.object({
  id: Id,
  authorDisplayName: z.string(), // "Sarah K."
  rating: z.number().int().min(1).max(5),
  text: z.string(),
  createdAt: IsoDateTime,
  reply: z.object({ text: z.string(), createdAt: IsoDateTime, updatedAt: IsoDateTime }).nullable(),
});
export type PublicReview = z.infer<typeof PublicReview>;

export const PublicReviewPage = paginated(PublicReview);
export type PublicReviewPage = z.infer<typeof PublicReviewPage>;
```
3. `index.ts`: add `export * from './providers/schemas';`.
4. Add to `catalog/schemas.test.ts`:
```ts
describe('ProviderPublicProfile', () => {
  it('rejects a profile without ownerName', () => {
    const card = { id: 'p01', businessName: 'B', photoUrl: null, category: { id: 'plumbing', name: 'Plumbing', icon: 'plumbing' }, baseTown: { id: 'colombo', name: 'Colombo' }, yearsExperience: 1, bio: '', verified: true, paused: false, rating: null, reviewCount: 0, startingPrice: { amount: 2500, unit: 'per_hour' } };
    const ok = { ...card, ownerName: 'Marcus Bell', services: [], areas: [], ratingSummary: { rating: null, reviewCount: 0 } };
    expect(ProviderPublicProfile.safeParse(ok).success).toBe(true);
    const { ownerName: _o, ...bad } = ok;
    expect(ProviderPublicProfile.safeParse(bad).success).toBe(false);
  });
});
```
(Use the real `CategoryIcon` value for plumbing from `common/enums.ts` if it is not `'plumbing'`; import `ProviderPublicProfile`.)
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): public profile and review schemas (M07-T2)"`

### T3 — `orderAreas` and `reviewsWindow`
- [x] done
**Files:** `packages/contracts/src/catalog/profile.ts`, `packages/contracts/src/catalog/profile.test.ts`, `index.ts`
**Context:** S3.E13 (base first, rest alphabetical), D-1.
**Do:** create
```ts
import { PAGE_SIZE } from '../common/pagination';

/** S3.E13: base town first, the rest alphabetical by name (en, case-insensitive). */
export function orderAreas<T extends { name: string; isBase: boolean }>(areas: readonly T[]): T[] {
  const base = areas.filter((a) => a.isBase);
  const rest = areas
    .filter((a) => !a.isBase)
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  return [...base, ...rest];
}

/** Decision 003: page 1 = 5 newest, page n ≥ 2 = next 10. */
export function reviewsWindow(page: number): { offset: number; limit: number } {
  if (page <= 1) return { offset: 0, limit: PAGE_SIZE.reviewsFirst };
  return { offset: PAGE_SIZE.reviewsFirst + (page - 2) * PAGE_SIZE.reviewsMore, limit: PAGE_SIZE.reviewsMore };
}

export function reviewsTotalPages(total: number): number {
  if (total === 0) return 0;
  if (total <= PAGE_SIZE.reviewsFirst) return 1;
  return 1 + Math.ceil((total - PAGE_SIZE.reviewsFirst) / PAGE_SIZE.reviewsMore);
}
```
Export from `index.ts`: `export * from './catalog/profile';`.
**Test:** `profile.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { orderAreas, reviewsTotalPages, reviewsWindow } from './profile';

describe('orderAreas', () => {
  it('puts the base first, then alphabetical', () => {
    const out = orderAreas([
      { name: 'Moratuwa', isBase: false },
      { name: 'colombo 7', isBase: false },
      { name: 'Maharagama', isBase: true },
      { name: 'Dehiwala', isBase: false },
    ]);
    expect(out.map((a) => a.name)).toEqual(['Maharagama', 'colombo 7', 'Dehiwala', 'Moratuwa']);
  });
});
describe('reviewsWindow', () => {
  it.each([
    [1, 0, 5],
    [2, 5, 10],
    [3, 15, 10],
    [0, 0, 5],
  ])('page %i → offset %i limit %i', (page, offset, limit) => {
    expect(reviewsWindow(page)).toEqual({ offset, limit });
  });
  it.each([
    [0, 0],
    [3, 1],
    [5, 1],
    [6, 2],
    [15, 2],
    [16, 3],
    [212, 22],
  ])('total %i → %i pages', (total, pages) => {
    expect(reviewsTotalPages(total)).toBe(pages);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green.
**Commit:** `git commit -m "feat(contracts): profile area order and review window (M07-T3)"`

### T4 — `Eligibility` schema and `evaluateEligibility`
- [x] done
**Files:** `packages/contracts/src/requests/schemas.ts`, `packages/contracts/src/requests/eligibility.ts`, `…/eligibility.test.ts`, `index.ts`
**Context:** ARCH §2.5 `Eligibility`; SPEC S3 "Request Service states"; BR-15, BR-16, BR-33; D-3. `OPEN_LIMIT_TOTAL`, `OPEN_LIMIT_PER_PROVIDER` already in `requests/rules.ts`.
**Do:**
1. Append to `requests/schemas.ts` (add `Id`/`RequestRef` import as needed):
```ts
export const Eligibility = z.discriminatedUnion('state', [
  z.object({ state: z.literal('ok') }),
  z.object({ state: z.literal('guest') }), // only produced client-side
  z.object({ state: z.literal('admin') }), // client-side on S3 (D-2); kept for completeness
  z.object({ state: z.literal('own_listing') }),
  z.object({ state: z.literal('provider_unavailable') }),
  z.object({ state: z.literal('provider_paused') }),
  z.object({ state: z.literal('email_unconfirmed') }),
  z.object({ state: z.literal('open_with_provider'), ref: RequestRef }),
  z.object({ state: z.literal('open_limit_reached') }),
]); // order of evaluation = SPEC S3.E7 table; mobile_missing is not a block (S12 asks inline)
export type Eligibility = z.infer<typeof Eligibility>;
```
2. Create `requests/eligibility.ts`:
```ts
import { OPEN_LIMIT_TOTAL } from './rules';
import type { Eligibility } from './schemas';

export interface EligibilityInput {
  viewer: { userId: string; isAdmin: boolean; emailConfirmed: boolean };
  /** null = unknown id. `listed` = BR-01 (complete, published, owner active). */
  provider: { id: string; userId: string; listed: boolean; paused: boolean } | null;
  /** The viewer's open (pending|accepted) requests, any provider. */
  openRequests: readonly { ref: string; providerId: string }[];
}

/** Server-side S3.E7 / S12 order (D-3). Pure; used by the mock handler and later the API. */
export function evaluateEligibility({ viewer, provider, openRequests }: EligibilityInput): Eligibility {
  if (viewer.isAdmin) return { state: 'admin' };
  if (provider && provider.userId === viewer.userId) return { state: 'own_listing' };
  if (!provider?.listed) return { state: 'provider_unavailable' };
  if (provider.paused) return { state: 'provider_paused' };
  const withProvider = openRequests.find((r) => r.providerId === provider.id);
  if (withProvider) return { state: 'open_with_provider', ref: withProvider.ref };
  if (openRequests.length >= OPEN_LIMIT_TOTAL) return { state: 'open_limit_reached' };
  if (!viewer.emailConfirmed) return { state: 'email_unconfirmed' };
  return { state: 'ok' };
}
```
Note: own listing is checked before listed, so a provider viewing their own (paused or unlisted) listing still gets `own_listing`.
3. `index.ts`: `export * from './requests/eligibility';`.
**Test:** `eligibility.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { evaluateEligibility, type EligibilityInput } from './eligibility';

const base: EligibilityInput = {
  viewer: { userId: 'u1', isAdmin: false, emailConfirmed: true },
  provider: { id: 'p1', userId: 'u9', listed: true, paused: false },
  openRequests: [],
};
const open = (n: number, providerId = 'px') =>
  Array.from({ length: n }, (_, i) => ({ ref: `FX-${String(3000 + i)}`, providerId }));

describe('evaluateEligibility (SPEC S3.E7 order)', () => {
  it('ok', () => expect(evaluateEligibility(base)).toEqual({ state: 'ok' }));
  it('admin beats everything', () =>
    expect(evaluateEligibility({ ...base, viewer: { ...base.viewer, isAdmin: true } }).state).toBe('admin'));
  it('own listing beats paused', () =>
    expect(
      evaluateEligibility({ ...base, provider: { id: 'p1', userId: 'u1', listed: true, paused: true } }).state,
    ).toBe('own_listing'));
  it('unknown or unlisted provider', () => {
    expect(evaluateEligibility({ ...base, provider: null }).state).toBe('provider_unavailable');
    expect(evaluateEligibility({ ...base, provider: { ...base.provider!, listed: false } }).state).toBe(
      'provider_unavailable',
    ); // provider is set in `base`
  });
  it('paused beats open requests', () =>
    expect(
      evaluateEligibility({ ...base, provider: { ...base.provider!, paused: true }, openRequests: open(5, 'p1') })
        .state,
    ).toBe('provider_paused')); // provider is set in `base`
  it('open with provider (with ref) beats the limit', () =>
    expect(evaluateEligibility({ ...base, openRequests: [...open(4), { ref: 'FX-2061', providerId: 'p1' }] })).toEqual({
      state: 'open_with_provider',
      ref: 'FX-2061',
    }));
  it('5 open → limit; 4 open → ok', () => {
    expect(evaluateEligibility({ ...base, openRequests: open(5) }).state).toBe('open_limit_reached');
    expect(evaluateEligibility({ ...base, openRequests: open(4) }).state).toBe('ok');
  });
  it('unconfirmed email comes after the limits', () => {
    const v = { ...base.viewer, emailConfirmed: false };
    expect(evaluateEligibility({ ...base, viewer: v }).state).toBe('email_unconfirmed');
    expect(evaluateEligibility({ ...base, viewer: v, openRequests: open(5) }).state).toBe('open_limit_reached');
  });
});
```
(If lint rejects `!` in the test even with the trailing comment, replace `base.provider!` by a local `const prov = { id: 'p1', userId: 'u9', listed: true, paused: false };` used both in `base` and the spreads.)
**Verify:** `pnpm --filter @fixit/contracts test` green.
**Commit:** `git commit -m "feat(contracts): request eligibility (M07-T4)"`

### T5 — Endpoint entries
- [x] done
**Files:** `packages/contracts/src/endpoints.ts`, `endpoints.test.ts`
**Context:** ARCH §3.2, §3.4; decision 003.
**Do:** import `ProviderPublicProfile, PublicReviewPage` from `./catalog/schemas`, `PageQuery` from `./common/pagination`, `Eligibility` from `./requests/schemas`; add after `providers_search`:
```ts
  providers_get: {
    id: 'providers_get',
    domain: 'catalog',
    method: 'GET',
    path: '/providers/:id',
    access: ['public'],
    owner: 'none',
    response: ProviderPublicProfile,
    refs: ['F-09', 'S3', 'BR-01', 'BR-41'],
  },
  providers_reviews: {
    id: 'providers_reviews',
    domain: 'catalog',
    method: 'GET',
    path: '/providers/:id/reviews',
    access: ['public'],
    owner: 'none',
    query: PageQuery,
    response: PublicReviewPage,
    refs: ['S3.E11', 'F-23', 'D-003'],
  },
  requests_eligibility: {
    id: 'requests_eligibility',
    domain: 'requests',
    method: 'GET',
    path: '/me/request-eligibility/:providerId',
    access: ['user'],
    owner: 'self',
    response: Eligibility,
    refs: ['F-14', 'S3.E7', 'S12'],
  },
```
**Test:** add to `endpoints.test.ts`:
```ts
  it('M07 rows match ARCHITECTURE §3.2/§3.4', () => {
    const rows = Object.fromEntries(Object.values(ENDPOINTS).map((d) => [`${d.method} ${d.path}`, [d.domain, d.access]]));
    expect(rows).toMatchObject({
      'GET /providers/:id': ['catalog', ['public']],
      'GET /providers/:id/reviews': ['catalog', ['public']],
      'GET /me/request-eligibility/:providerId': ['requests', ['user']],
    });
  });
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): profile, reviews and eligibility endpoints (M07-T5)"`

### T6 — Fixtures: new, paused and suspended providers; customer at the limit
- [x] done
**Files:** `packages/fixtures/src/providers.ts`, `users.ts`, `requests.ts`, `build.ts`, `build.test.ts`, `src/mocks/db/schema.ts`
**Context:** D-5; AC3, AC4, AC6. Review refs use FX-0001…FX-1248; prototype FX-2037…2061; FX-1990…1994 are free.
**Do:**
1. `providers.ts`:
   - Add `ownerId`-based optional `paused?: boolean` to `ProviderSeed`; in `buildProviders` set `paused: s.paused ?? false`.
   - Append three seeds to `PROVIDER_SEEDS` (after p10):
```ts
  {
    id: 'p12',
    ownerId: 'u-chathura',
    businessName: 'Ranasinghe Garden Care',
    categoryId: 'gardening',
    baseTownId: 'homagama',
    years: 2,
    verification: 'not_submitted',
    bio: 'New garden care service for lawns, hedges and small landscaping jobs around Homagama.',
    services: [
      ['Lawn mowing', 2000, 'per_visit'],
      ['Hedge trimming', 1500, 'per_hour'],
      ['Garden clean-up', 6000, 'fixed'],
    ],
    otherTowns: ['maharagama', 'kesbewa'],
  },
  {
    id: 'p13',
    ownerId: 'u-nadeesha',
    businessName: 'Lanka Paint Works',
    categoryId: 'painting',
    baseTownId: 'negombo',
    years: 9,
    verification: 'verified',
    paused: true,
    bio: 'Interior and exterior painting with careful preparation and clean finishes.',
    services: [
      ['Interior painting', 2500, 'per_hour'],
      ['Exterior painting', 3000, 'per_hour'],
      ['Single room repaint', 25000, 'fixed'],
    ],
    otherTowns: ['ja-ela', 'kadawatha'],
  },
  {
    id: 'p14',
    ownerId: 'u-ruwan',
    businessName: 'Jayasekara Carpentry',
    categoryId: 'carpentry',
    baseTownId: 'moratuwa',
    years: 11,
    verification: 'verified',
    bio: 'Custom furniture, doors and window frames.',
    services: [
      ['Door repair', 2500, 'per_hour'],
      ['Custom shelving', 18000, 'fixed'],
    ],
    otherTowns: ['colombo', 'kesbewa'],
  },
```
   - If `verifiedAt`/submissions/documents generation in `buildProviders` iterates `PROTOTYPE_PROVIDER_IDS` or assumes 10 seeds, make it iterate `PROVIDER_SEEDS` unchanged otherwise; do not add submissions for p12–p14 unless an existing test requires every verified provider to have one (then add an approved submission the same way p01 gets one).
   - If `reviews.ts`/`buildReviews` iterates `PROVIDER_SEEDS` and reads `PROTOTYPE_RATINGS[id]`, guard it to iterate `PROTOTYPE_PROVIDER_IDS` only, so p12–p14 get **no** reviews.
2. `users.ts` `CORE_USERS`: add after `u-grace`
```ts
  { id: 'u-chathura', email: 'chathura@fixit.test', fullName: 'Chathura Ranasinghe', mobile: mobileNo(1111) },
  { id: 'u-nadeesha', email: 'nadeesha@fixit.test', fullName: 'Nadeesha Perera', mobile: mobileNo(1112) },
  { id: 'u-dilani', email: 'dilani@fixit.test', fullName: 'Dilani Fernando', mobile: mobileNo(1005) },
```
   (`u-ruwan` exists and is suspended.) Add to `DEMO_PERSONAS` after `customerUnconfirmed`:
```ts
  {
    key: 'customerAtLimit',
    label: 'Customer, 5 open requests (Dilani Fernando)',
    email: 'dilani@fixit.test',
    userId: 'u-dilani',
  },
```
3. `requests.ts`: append
```ts
/** M07: Dilani has 5 pending requests (BR-33 limit), one each to p03–p07. */
export function buildLimitRequests(
  now: Date,
  ctx: { users: readonly FxUser[]; providers: readonly FxProvider[]; services: readonly FxService[] },
): RequestRecord[] {
  const today = colomboToday(now);
  const customer = ctx.users.find((u) => u.id === 'u-dilani');
  if (!customer) throw new Error('fixtures: u-dilani missing');
  return ['p03', 'p04', 'p05', 'p06', 'p07'].map((pid, i) => {
    const provider = ctx.providers.find((p) => p.id === pid);
    const service = ctx.services.find((s) => s.id === serviceId(pid, 0));
    const area = provider?.baseTownId;
    if (!provider || !service || !area) throw new Error(`fixtures: bad limit request for ${pid}`);
    return makeRequest({
      ref: `FX-${String(1990 + i)}`,
      customer,
      provider,
      service,
      townId: area,
      preferredDate: addDays(today, 4 + i),
      slot: 'morning',
      addressLine1: `${String(10 + i)} Temple Road`,
      description: 'Please come and take a look; details on the phone.',
      createdAt: new Date(now.getTime() - (5 + i) * HOUR),
      steps: [],
    });
  });
}
```
4. `build.ts`: `const limitRequests = buildLimitRequests(now, { users, providers, services });` and `requests: [...prototypeRequests, ...limitRequests, ...reviewedRequests]`.
5. `build.test.ts` add:
```ts
describe('M07 fixtures', () => {
  const prov = (id: string) => world.providers.find((p) => p.id === id);
  it('p12 is listed with no reviews; p13 is paused; p14 belongs to suspended Ruwan', () => {
    expect(world.reviews.filter((r) => r.providerId === 'p12')).toHaveLength(0);
    expect([prov('p12')?.reviewCount, prov('p12')?.ratingAvg]).toEqual([0, null]);
    expect(prov('p13')?.paused).toBe(true);
    expect(prov('p14')?.userId).toBe('u-ruwan');
    expect(world.users.find((u) => u.id === 'u-ruwan')?.status).toBe('suspended');
  });
  it('Dilani has exactly 5 open requests, none with p01', () => {
    const open = world.requests.filter((r) => r.customerId === 'u-dilani' && ['pending', 'accepted'].includes(r.status));
    expect(open).toHaveLength(5);
    expect(open.some((r) => r.providerId === 'p01')).toBe(false);
  });
});
```
6. `src/mocks/db/schema.ts`: `MOCK_DB_VERSION = 3`.
7. Run `pnpm test`. Existing tests that assert the **fixture total** of listed providers (10) must be updated to 12 — only change numbers that count fixture providers, nothing else. If a Discover test breaks for a different reason, STOP and write a blocker.
**Verify:** `pnpm --filter @fixit/fixtures test` and `pnpm verify` green.
**Commit:** `git commit -m "feat(fixtures): new, paused, suspended providers and a customer at the open limit (M07-T6)"`

### T7 — Mock projections: profile, reviews page, eligibility input
- [x] done
**Files:** `src/mocks/lib/profile.ts`, `src/mocks/lib/profile.test.ts`
**Context:** BR-01, BR-41 (`isListed` in `mocks/lib/cards.ts` already checks owner `status === 'active'`), BR-27, S3.E13, decision 003.
**Do:** create
```ts
import {
  displayNameOf,
  evaluateEligibility,
  OPEN_STATUSES,
  orderAreas,
  reviewsTotalPages,
  reviewsWindow,
  type Eligibility,
  type ProviderPublicProfile,
  type PublicReviewPage,
  type RequestStatus,
} from '@fixit/contracts';
import type { FxProvider } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { isListed, toProviderCard } from './cards';
import { mockError } from './errors';
import { rolesOf } from './identity';

/** Listed provider or 404 (unknown, draft, suspended owner: BR-01, BR-41). */
export function listedProviderOr404(d: MockDb, id: string): FxProvider {
  const p = d.providers[id];
  if (!p || !isListed(d, p)) throw mockError(404, 'NOT_FOUND', 'Provider not found');
  return p;
}

export function toPublicProfile(d: MockDb, p: FxProvider): ProviderPublicProfile {
  const card = toProviderCard(d, p);
  const owner = d.users[p.userId];
  if (!card || !owner) throw mockError(404, 'NOT_FOUND', 'Provider not found');
  const townName = new Map(d.towns.map((t) => [t.id, t.name]));
  const areas = d.areas
    .filter((a) => a.providerId === p.id)
    .map((a) => ({ id: a.townId, name: townName.get(a.townId) ?? a.townId, isBase: a.isBase }));
  return {
    ...card,
    ownerName: owner.fullName,
    services: Object.values(d.services)
      .filter((s) => s.providerId === p.id)
      .map(({ id, name, price, unit }) => ({ id, name, price, unit })),
    areas: orderAreas(areas),
    ratingSummary: { rating: card.rating, reviewCount: card.reviewCount },
  };
}

/** Visible reviews, newest first, windowed per decision 003. */
export function publicReviewsPage(d: MockDb, providerId: string, page: number): PublicReviewPage {
  const visible = Object.values(d.reviews)
    .filter((r) => r.providerId === providerId && r.visibility === 'visible')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  const { offset, limit } = reviewsWindow(page);
  return {
    items: visible.slice(offset, offset + limit).map((r) => ({
      id: r.id,
      authorDisplayName: displayNameOf(d.users[r.authorId]?.fullName ?? 'Fixit customer'),
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
      reply:
        r.replyText !== null && r.replyCreatedAt !== null
          ? { text: r.replyText, createdAt: r.replyCreatedAt, updatedAt: r.replyUpdatedAt ?? r.replyCreatedAt }
          : null,
    })),
    page: Math.max(page, 1),
    pageSize: limit,
    total: visible.length,
    totalPages: reviewsTotalPages(visible.length),
  };
}

const isOpen = (s: RequestStatus) => (OPEN_STATUSES as readonly RequestStatus[]).includes(s);

/** Same inputs the API service will gather, evaluated by contracts. */
export function eligibilityFor(d: MockDb, userId: string, providerId: string): Eligibility {
  const user = d.users[userId];
  const p = d.providers[providerId];
  return evaluateEligibility({
    viewer: {
      userId,
      isAdmin: rolesOf(d, userId).includes('admin'),
      emailConfirmed: user?.emailConfirmedAt != null,
    },
    provider: p ? { id: p.id, userId: p.userId, listed: isListed(d, p), paused: p.paused } : null,
    openRequests: Object.values(d.requests)
      .filter((r) => r.customerId === userId && isOpen(r.status))
      .map((r) => ({ ref: r.ref, providerId: r.providerId })),
  });
}
```
(If `displayNameOf` of written authors does not produce the prototype names like `Sarah K.`, check how `writtenAuthorSeeds` stores names — the full name must be e.g. `Sarah Kxxx`; if it is stored as `Sarah K.` already, `displayNameOf('Sarah K.')` returns `Sarah K..` — then STOP and write a blocker.)
**Test:** `profile.test.ts` (uses the seeded `db()` from test setup):
```ts
import { describe, expect, it } from 'vitest';
import { ProviderPublicProfile, PublicReviewPage } from '@fixit/contracts';
import { db } from '../db/store';
import { eligibilityFor, listedProviderOr404, publicReviewsPage, toPublicProfile } from './profile';

describe('toPublicProfile', () => {
  it('p01: owner, services, base town first then alphabetical', () => {
    const d = db();
    const p = ProviderPublicProfile.parse(toPublicProfile(d, listedProviderOr404(d, 'p01')));
    expect(p.ownerName).toBe('Marcus Bell');
    expect(p.services).toHaveLength(5);
    expect(p.areas[0]).toMatchObject({ id: 'colombo', isBase: true });
    const rest = p.areas.slice(1).map((a) => a.name);
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })));
  });
  it.each(['unknown', 'p11', 'p14'])('%s → 404', (id) => {
    expect(() => listedProviderOr404(db(), id)).toThrow(expect.objectContaining({ status: 404 }));
  });
});
describe('publicReviewsPage', () => {
  it('5 then 10, newest first, Sarah K. on top for p01', () => {
    const one = PublicReviewPage.parse(publicReviewsPage(db(), 'p01', 1));
    expect(one.items).toHaveLength(5);
    expect(one.items[0]?.authorDisplayName).toBe('Sarah K.');
    expect(one.total).toBe(212);
    const two = publicReviewsPage(db(), 'p01', 2);
    expect(two.items).toHaveLength(10);
    expect(two.items[0]?.createdAt <= (one.items[4]?.createdAt ?? '')).toBe(true);
  });
  it('excludes hidden reviews', () => {
    const d = db();
    const first = publicReviewsPage(d, 'p01', 1).items[0];
    const row = first && d.reviews[first.id];
    if (!row) throw new Error('no review');
    row.visibility = 'hidden';
    expect(publicReviewsPage(d, 'p01', 1).items.some((r) => r.id === row.id)).toBe(false);
  });
});
describe('eligibilityFor (fixtures)', () => {
  it.each([
    ['u-marcus', 'p01', { state: 'own_listing' }],
    ['u-olivia', 'p01', { state: 'open_with_provider', ref: 'FX-2061' }],
    ['u-dilani', 'p01', { state: 'open_limit_reached' }],
    ['u-olivia', 'p13', { state: 'provider_paused' }],
    ['u-olivia', 'p02', { state: 'ok' }],
    ['u-nimal', 'p02', { state: 'email_unconfirmed' }],
  ])('%s on %s', (user, provider, expected) => {
    expect(eligibilityFor(db(), user, provider)).toEqual(expected);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- mocks/lib/profile` green.
**Commit:** `git commit -m "feat(web): mock profile, reviews and eligibility projections (M07-T7)"`

### T8 — `GET /providers/:id` and `/reviews` handlers
- [x] done
**Files:** `src/mocks/handlers/catalog.ts`, `catalog.test.ts`
**Do:** import `listedProviderOr404, publicReviewsPage, toPublicProfile` from `../lib/profile`; append to `catalogHandlers` **after** `providers_featured` (MSW matches in order; `/providers/featured` must win over `/providers/:id`):
```ts
  mockEndpoint(E.providers_get, ({ db: d, params }) =>
    toPublicProfile(d, listedProviderOr404(d, params.id ?? '')),
  ),
  mockEndpoint(E.providers_reviews, ({ db: d, params, query }) => {
    const p = listedProviderOr404(d, params.id ?? '');
    return publicReviewsPage(d, p.id, query.page);
  }),
```
Remove the old comment `// Keep /providers/featured before /providers/:id (M07).` and put `// Order matters: /providers/featured before /providers/:id.` above the array.
**Test:** add to `catalog.test.ts`:
```ts
describe('GET /providers/:id', () => {
  it('returns the profile for a guest', async () => {
    const res = await get('/providers/p01');
    expect(res.status).toBe(200);
    expect(ProviderPublicProfile.parse(await res.json()).businessName).toBe('Bell & Sons Plumbing');
  });
  it.each(['unknown', 'p11', 'p14'])('%s → 404 NOT_FOUND', async (id) => {
    const res = await get(`/providers/${id}`);
    expect(res.status).toBe(404);
  });
  it('featured still resolves', async () => {
    expect((await get('/providers/featured')).status).toBe(200);
  });
});
describe('GET /providers/:id/reviews', () => {
  it('page 1 = 5, page 2 = 10', async () => {
    const one = PublicReviewPage.parse(await (await get('/providers/p01/reviews')).json());
    const two = PublicReviewPage.parse(await (await get('/providers/p01/reviews?page=2')).json());
    expect([one.items.length, one.pageSize, two.items.length, two.pageSize]).toEqual([5, 5, 10, 10]);
  });
  it('p12 has none; suspended p14 → 404; forced 500 honoured', async () => {
    expect(PublicReviewPage.parse(await (await get('/providers/p12/reviews')).json()).total).toBe(0);
    expect((await get('/providers/p14/reviews')).status).toBe(404);
    armForcedError('providers_reviews', '500');
    expect((await get('/providers/p01/reviews')).status).toBe(500);
  });
});
```
(Add `ProviderPublicProfile, PublicReviewPage` to the contracts import.)
**Verify:** `pnpm --filter @fixit/web test -- handlers/catalog` green.
**Commit:** `git commit -m "feat(web): mock provider profile and reviews endpoints (M07-T8)"`

### T9 — `GET /me/request-eligibility/:providerId` handler
- [x] done
**Files:** `src/mocks/handlers/requests.ts`, `requests.test.ts`, `handlers/index.ts`
**Context:** ARCH §3.4; Notes for planner (handler in `requests.ts`); AC8.
**Do:**
```ts
import { ENDPOINTS as E } from '@fixit/contracts';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
import { eligibilityFor } from '../lib/profile';

export const requestsHandlers = [
  mockEndpoint(E.requests_eligibility, ({ db: d, actor, params }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED'); // assertAccess already guarantees this
    return eligibilityFor(d, actor.userId, params.providerId ?? '');
  }),
];
```
`index.ts`: `import { requestsHandlers } from './requests';` and `requests: requestsHandlers,`.
**Test:** `requests.test.ts` — follow the pattern used in `auth.test.ts` for authenticated calls (use `signInAs` from `@/test/sign-in` and send `Authorization: Bearer ${session.accessToken}`):
```ts
import { describe, expect, it } from 'vitest';
import { Eligibility } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { signInAs } from '@/test/sign-in';

const call = async (providerId: string, persona?: PersonaKey) => {
  const headers: Record<string, string> = {};
  if (persona) headers.Authorization = `Bearer ${signInAs(persona).accessToken}`;
  return fetch(new URL(`/api/me/request-eligibility/${providerId}`, window.location.origin), { headers });
};

describe('GET /me/request-eligibility/:providerId', () => {
  it.each([
    ['provider', 'p01', { state: 'own_listing' }],
    ['customer', 'p01', { state: 'open_with_provider', ref: 'FX-2061' }],
    ['customerAtLimit', 'p01', { state: 'open_limit_reached' }],
    ['customer', 'p13', { state: 'provider_paused' }],
    ['customer', 'p02', { state: 'ok' }],
  ] as const)('%s on %s', async (persona, providerId, expected) => {
    const res = await call(providerId, persona);
    expect(res.status).toBe(200);
    expect(Eligibility.parse(await res.json())).toEqual(expected);
  });
  it('anonymous → 401, admin → 403', async () => {
    expect((await call('p01')).status).toBe(401);
    expect((await call('p01', 'admin')).status).toBe(403);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- handlers/requests` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock request eligibility endpoint (M07-T9)"`

### T10 — Query keys, review date format, api functions
- [x] done
**Files:** `src/lib/query-keys.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`, `src/features/provider-profile/api.ts`
**Do:**
1. `qk` add:
```ts
  provider: (id: string) => ['catalog', 'provider', id] as const,
  providerReviews: (id: string) => ['catalog', 'provider-reviews', id] as const,
  eligibility: (providerId: string) => ['requests', 'eligibility', providerId] as const,
```
2. `format.ts` add:
```ts
/** `12 Sep 2026` (S3.E11 review date) */
export const formatReviewDate = (value: string | Date): string => formatInColombo(toInstant(value), 'd MMM yyyy');
```
   Test: `expect(formatReviewDate('2026-09-11T20:00:00Z')).toBe('12 Sep 2026');` (20:00Z = 01:30 next day in Colombo).
3. `features/provider-profile/api.ts`:
```ts
import { ENDPOINTS as E, type Eligibility, type ProviderPublicProfile, type PublicReviewPage } from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export const fetchProvider = (id: string): Promise<ProviderPublicProfile> =>
  http(pathOf(E.providers_get, { id }), { schema: E.providers_get.response });

export const fetchProviderReviews = (id: string, page: number): Promise<PublicReviewPage> =>
  http(pathOf(E.providers_reviews, { id }), { query: { page }, schema: E.providers_reviews.response });

export const fetchEligibility = (providerId: string): Promise<Eligibility> =>
  http(pathOf(E.requests_eligibility, { providerId }), { schema: E.requests_eligibility.response });
```
**Verify:** `pnpm --filter @fixit/web test -- lib/format` green; `pnpm typecheck` green.
**Commit:** `git commit -m "feat(web): profile query keys, api and review date format (M07-T10)"`

### T11 — `toRequestAction` (SPEC order → rendering)
- [x] done
**Files:** `src/features/provider-profile/request-action.ts`, `request-action.test.ts`
**Context:** SPEC "Request Service states"; D-3, D-4; AC8 first half.
**Do:**
```ts
import type { Eligibility } from '@fixit/contracts';

export type RequestAction =
  | { kind: 'hidden' }
  | { kind: 'loading' }
  | { kind: 'request'; to: string } // enabled primary `Request Service`
  | { kind: 'disabled'; helper: string } // disabled primary `Request Service`
  | { kind: 'edit'; to: '/dashboard/profile'; helper: 'This is your listing.' }
  | { kind: 'view'; to: string; helper: string };

export const LIMIT_HELPER =
  'You have 5 open requests. Wait for one to finish or cancel one to send another.';

/** SPEC S3.E7 table, evaluated in order. `paused` comes from the profile so a guest sees the paused state. */
export function toRequestAction(
  e: Eligibility,
  p: { id: string; businessName: string; paused: boolean },
): RequestAction {
  const paused: RequestAction = { kind: 'disabled', helper: `${p.businessName} isn't taking new requests right now.` };
  switch (e.state) {
    case 'admin':
    case 'provider_unavailable':
      return { kind: 'hidden' };
    case 'own_listing':
      return { kind: 'edit', to: '/dashboard/profile', helper: 'This is your listing.' };
    case 'provider_paused':
      return paused;
    case 'guest':
      return p.paused ? paused : { kind: 'request', to: `/login?next=/providers/${p.id}/request` };
    case 'open_with_provider':
      return {
        kind: 'view',
        to: `/requests/${e.ref}`,
        helper: `You already have an open request with ${p.businessName}.`,
      };
    case 'open_limit_reached':
      return { kind: 'disabled', helper: LIMIT_HELPER };
    case 'email_unconfirmed':
    case 'ok':
      return { kind: 'request', to: `/providers/${p.id}/request` };
  }
}
```
**Test:**
```ts
import { describe, expect, it } from 'vitest';
import { LIMIT_HELPER, toRequestAction } from './request-action';

const p = { id: 'p01', businessName: 'Bell & Sons Plumbing', paused: false };
describe('toRequestAction (SPEC S3.E7)', () => {
  it('admin and unavailable → hidden', () => {
    expect(toRequestAction({ state: 'admin' }, p)).toEqual({ kind: 'hidden' });
    expect(toRequestAction({ state: 'provider_unavailable' }, p)).toEqual({ kind: 'hidden' });
  });
  it('own listing → edit', () =>
    expect(toRequestAction({ state: 'own_listing' }, p)).toEqual({
      kind: 'edit', to: '/dashboard/profile', helper: 'This is your listing.',
    }));
  it('paused → disabled with business copy', () =>
    expect(toRequestAction({ state: 'provider_paused' }, p)).toEqual({
      kind: 'disabled', helper: "Bell & Sons Plumbing isn't taking new requests right now.",
    }));
  it('guest → login with next; guest on a paused provider → paused (paused precedes guest)', () => {
    expect(toRequestAction({ state: 'guest' }, p)).toEqual({ kind: 'request', to: '/login?next=/providers/p01/request' });
    expect(toRequestAction({ state: 'guest' }, { ...p, paused: true }).kind).toBe('disabled');
  });
  it('open with provider → view with ref', () =>
    expect(toRequestAction({ state: 'open_with_provider', ref: 'FX-2061' }, p)).toEqual({
      kind: 'view', to: '/requests/FX-2061', helper: 'You already have an open request with Bell & Sons Plumbing.',
    }));
  it('limit → disabled with limit copy', () =>
    expect(toRequestAction({ state: 'open_limit_reached' }, p)).toEqual({ kind: 'disabled', helper: LIMIT_HELPER }));
  it('ok and email_unconfirmed → request form', () => {
    expect(toRequestAction({ state: 'ok' }, p)).toEqual({ kind: 'request', to: '/providers/p01/request' });
    expect(toRequestAction({ state: 'email_unconfirmed' }, p)).toEqual({ kind: 'request', to: '/providers/p01/request' });
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- request-action` green.
**Commit:** `git commit -m "feat(web): request service state mapping (M07-T11)"`

### T12 — Hooks: profile, reviews, request action
- [x] done
**Files:** `src/features/provider-profile/hooks.ts`, `hooks.test.tsx`
**Context:** D-2, D-4; ARCH §4.2.
**Do:**
```ts
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { ProviderPublicProfile } from '@fixit/contracts';
import { useAuth } from '@/lib/auth-store';
import { qk } from '@/lib/query-keys';
import { fetchEligibility, fetchProvider, fetchProviderReviews } from './api';
import { toRequestAction, type RequestAction } from './request-action';

export const useProviderProfile = (id: string) =>
  useQuery({ queryKey: qk.provider(id), queryFn: () => fetchProvider(id), retry: false });

/** Decision 003: page 1 = 5, then 10 per page until loaded = total. */
export const useProviderReviews = (id: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: qk.providerReviews(id),
    queryFn: ({ pageParam }) => fetchProviderReviews(id, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled,
  });

/** S3.E7. guest/admin are client-side (D-2); everything else is the server's Eligibility. */
export function useRequestAction(p: Pick<ProviderPublicProfile, 'id' | 'businessName' | 'paused'> | undefined): RequestAction {
  const { status, me } = useAuth();
  const isAdmin = me?.roles.includes('admin') ?? false;
  const ask = status === 'signed-in' && !isAdmin && p !== undefined;
  const q = useQuery({
    queryKey: qk.eligibility(p?.id ?? ''),
    queryFn: () => fetchEligibility(p?.id ?? ''),
    enabled: ask,
    retry: false,
  });
  if (!p || status === 'booting') return { kind: 'loading' };
  if (status === 'guest') return toRequestAction({ state: 'guest' }, p);
  if (isAdmin) return toRequestAction({ state: 'admin' }, p);
  if (q.isPending && q.fetchStatus !== 'idle') return { kind: 'loading' };
  if (q.data) return toRequestAction(q.data, p);
  return toRequestAction({ state: 'ok' }, p); // D-4: load failure → Otherwise; S12 re-checks
}
```
**Test:** `hooks.test.tsx` with `renderHook` + `createWrapper` from `@/test/render`, `signInAs`, `authStore`:
```ts
import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useProviderReviews, useRequestAction } from './hooks';

const p01 = { id: 'p01', businessName: 'Bell & Sons Plumbing', paused: false };

describe('useRequestAction', () => {
  it('guest → login next (no eligibility call)', () => {
    authStore.setGuest();
    const { result } = renderHook(() => useRequestAction(p01), { wrapper: createWrapper() });
    expect(result.current).toEqual({ kind: 'request', to: '/login?next=/providers/p01/request' });
  });
  it('admin → hidden', () => {
    signInAs('admin');
    const { result } = renderHook(() => useRequestAction(p01), { wrapper: createWrapper() });
    expect(result.current).toEqual({ kind: 'hidden' });
  });
  it('Olivia on p01 → view FX-2061', async () => {
    signInAs('customer');
    const { result } = renderHook(() => useRequestAction(p01), { wrapper: createWrapper() });
    expect(result.current.kind).toBe('loading');
    await waitFor(() => expect(result.current).toMatchObject({ kind: 'view', to: '/requests/FX-2061' }));
  });
});
describe('useProviderReviews', () => {
  it('loads 5 then 10 more', async () => {
    const { result } = renderHook(() => useProviderReviews('p01'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.data?.pages[0]?.items).toHaveLength(5));
    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.data?.pages.flatMap((x) => x.items)).toHaveLength(15));
    expect(result.current.hasNextPage).toBe(true);
  });
});
```
(If the test setup leaves auth `booting` by default, the guest test's `setGuest()` covers it; the setup resets the store between tests — check `test/setup.ts`.)
**Verify:** `pnpm --filter @fixit/web test -- provider-profile/hooks` green.
**Commit:** `git commit -m "feat(web): provider profile hooks (M07-T12)"`

### T13 — `useBodyClass`
- [x] done
**Files:** `src/lib/use-body-class.ts`
**Context:** D-6.
**Do:**
```ts
import { useEffect } from 'react';

/** Adds classes to <body> while mounted (S3 phone sticky bar padding, D-6). */
export function useBodyClass(classes: string): void {
  useEffect(() => {
    const list = classes.split(/\s+/).filter(Boolean);
    document.body.classList.add(...list);
    return () => {
      document.body.classList.remove(...list);
    };
  }, [classes]);
}
```
**Verify:** `pnpm typecheck` green.
**Commit:** `git commit -m "feat(web): body class hook (M07-T13)"`

### T14 — Verified badge with tooltip
- [ ] done
**Files:** `src/features/provider-profile/components/verified-tip.tsx`
**Context:** S3.E5, BR-20, D-7, SPEC §2.9 Tooltip (`tooltip-bg`, width 280, r12, pad 12×14, 13/19 500 white, bold title), AC2, AC5 (clamped). Reuse the look of `components/verified-badge.tsx` (do not change that component).
**Do:**
```tsx
import { useId, useRef, useState } from 'react';
import { Check, Info } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const TITLE = 'What does Verified mean?';
const BODY = "Fixit has checked this provider's national ID and, where listed, their trade qualification.";

export function VerifiedTip() {
  const [open, setOpen] = useState(false);
  const focusOpenedAt = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const descId = useId();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <button
          ref={buttonRef}
          type="button"
          aria-describedby={descId}
          aria-expanded={open}
          className="bg-success-soft text-success-text text-meta inline-flex h-11 items-center gap-1.5 rounded-full pl-1 pr-2.5 font-bold sm:h-7"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => {
            focusOpenedAt.current = Date.now();
            setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onClick={() => {
            if (Date.now() - focusOpenedAt.current < 400) return; // tap = focus + click (D-7)
            setOpen((v) => !v);
          }}
        >
          <span aria-hidden="true" className="bg-success text-primary-foreground grid size-[18px] place-items-center rounded-full">
            <Check className="size-3" strokeWidth={3} />
          </span>
          Verified
          <Info aria-hidden="true" className="size-4" />
        </button>
      </PopoverAnchor>
      <span id={descId} className="sr-only">{`${TITLE} ${BODY}`}</span>
      <PopoverContent
        side="bottom"
        align="start"
        collisionPadding={16}
        role="tooltip"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (buttonRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
        className={cn(
          'bg-tooltip-bg text-primary-foreground text-meta w-[min(280px,calc(100vw-32px))] rounded-lg border-0 px-3.5 py-3 font-medium',
        )}
      >
        <p className="font-bold">{TITLE}</p>
        <p>{BODY}</p>
      </PopoverContent>
    </Popover>
  );
}
```
Notes: `rounded-lg` must be 12px — check `globals.css` radius map; if `lg` is 14, use `rounded-md` (12). The tooltip has `aria-hidden` semantics via the sr-only duplicate; screen readers get the text from `aria-describedby`. Phone touch target: `h-11` (44) on phone, `sm:h-7` from 641.
**Verify:** `pnpm typecheck && pnpm lint` green. Behaviour is tested in T20.
**Commit:** `git commit -m "feat(web): verified badge tooltip (M07-T14)"`

### T15 — Request Service action block
- [ ] done
**Files:** `src/features/provider-profile/components/request-action-block.tsx`
**Context:** S3.E7 table; SPEC §2.9 buttons; helper text 13 `text-muted` under the button.
**Do:** one component used by the header card (desktop/tablet) and the phone bar:
```tsx
import { Pencil, Send } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { RequestAction } from '../request-action';

export function RequestActionBlock({ action, className }: { action: RequestAction; className?: string }) {
  if (action.kind === 'hidden') return null;
  if (action.kind === 'loading') return <Skeleton className={cn('h-12 w-full rounded-md', className)} />;
  const helper = 'helper' in action ? action.helper : null;
  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      {action.kind === 'request' && (
        <Button asChild size="lg" className="w-full">
          <Link to={action.to}><Send aria-hidden="true" />Request Service</Link>
        </Button>
      )}
      {action.kind === 'disabled' && (
        <Button size="lg" className="w-full" disabled aria-describedby="request-helper">
          <Send aria-hidden="true" />Request Service
        </Button>
      )}
      {action.kind === 'edit' && (
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link to={action.to}><Pencil aria-hidden="true" />Edit your listing</Link>
        </Button>
      )}
      {action.kind === 'view' && (
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link to={action.to}>View your request</Link>
        </Button>
      )}
      {helper && <p id="request-helper" className="text-meta text-text-muted">{helper}</p>}
    </div>
  );
}
```
Because the block renders twice (header + phone bar, one of them `hidden` by CSS), give the helper id via a prop `helperId` (`request-helper-header` / `request-helper-bar`) instead of the fixed `request-helper`; use it for both `id` and `aria-describedby`.
**Verify:** `pnpm typecheck && pnpm lint` green.
**Commit:** `git commit -m "feat(web): request service action block (M07-T15)"`

### T16 — Profile header card
- [ ] done
**Files:** `src/features/provider-profile/components/profile-header.tsx`
**Context:** S3 desktop/phone/tablet layout; S3.E2–E6; 05-provider-verified-desktop.png top card (ignore `$`/`TX`, the Save button and the photo stripes). AC1, AC5.
**Do:** props `{ profile: ProviderPublicProfile; action: RequestAction }`. Structure and exact classes:
```tsx
<section aria-labelledby="provider-name"
  className="border-border bg-surface grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-2xl border p-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-x-8 sm:rounded-3xl sm:p-7 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
  {/* E2 photo — row-span-2 from sm so identity + details sit beside it */}
  <Photo className="size-[88px] rounded-xl sm:row-span-2 sm:size-40 lg:size-[220px]" />
  {/* E3 identity */}
  <div className="flex min-w-0 flex-col justify-center gap-1 sm:justify-end">
    <p className="text-label text-primary inline-flex items-center gap-1.5 font-semibold"><CategoryIcon icon={profile.category.icon} aria-hidden="true" className="size-4" />{profile.category.name}</p>
    <h1 id="provider-name" className="text-title-xl text-text break-words">{profile.businessName}</h1>
  </div>
  {/* owner, meta, badges — full width on phone */}
  <div className="col-span-2 flex flex-col gap-3 sm:col-span-1 sm:col-start-2">
    <p className="text-body-sm text-text-muted">Owned &amp; run by {profile.ownerName}</p>
    <ul className="text-body-sm text-text-muted flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
      <li>{rating}</li>
      <li className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="text-icon-subtle size-4" />{profile.baseTown.name}</li>
      <li className="inline-flex items-center gap-1.5"><Award aria-hidden="true" className="text-icon-subtle size-4" />{profile.yearsExperience} years experience</li>
    </ul>
    <div className="flex flex-wrap items-center gap-2">{badges}</div>
  </div>
  {/* E6 + E7 action column: hidden on phone (sticky bar instead) */}
  <div className="border-border col-span-2 hidden flex-col gap-4 border-t pt-5 sm:flex lg:col-span-1 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:w-[240px] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 lg:justify-center">
    <PriceBlock />
    <RequestActionBlock action={action} helperId="request-helper-header" />
  </div>
</section>
```
- **Photo** (`E2`): `photoUrl` → `<img src alt={businessName} className="… object-cover" />`; null → `<div role="img" aria-label={businessName} className="bg-primary-soft text-primary grid place-items-center …"><CategoryIcon icon=… className="size-10 lg:size-16" aria-hidden="true" /></div>`.
- **Rating** (`E4`): reviewCount > 0 → `<Stars rating count showValue={false} size={16} />` + `<span className="text-text font-bold">{formatRating(rating, count)}</span>` + `<a href="#reviews" onClick={scrollToReviews} className="text-text underline underline-offset-2 hover:text-primary">{count} reviews</a>` (`1 review` when count is 1). `scrollToReviews`: `e.preventDefault(); document.getElementById('reviews')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });`. Count 0 → `<span className="bg-primary-soft text-primary text-meta rounded-full px-2.5 py-0.5 font-bold">New</span>` + `<span>No reviews yet</span>` (no link).
- **Badges** (`E5`): verified → `<VerifiedTip />`; else `<span className="bg-surface-muted text-text-muted text-meta inline-flex h-7 items-center rounded-full px-3 font-semibold">Not yet verified</span>`. Paused → also `<span className="bg-warning-soft text-warning-text text-meta inline-flex h-7 items-center rounded-full px-3 font-bold">Not taking requests</span>`.
- **PriceBlock** (`E6`, exported for the phone bar): `<div><p className="text-caption text-text-subtle font-medium normal-case">Starting at</p><PriceLabel variant="short" amount unit amountClassName="text-price-xl" /></div>`. Fixed → PriceLabel already renders `LKR 15,000` + ` fixed`.
- No Save button (F-10 off).
**Verify:** `pnpm typecheck && pnpm lint` green.
**Commit:** `git commit -m "feat(web): provider profile header card (M07-T16)"`

### T17 — About, Services, Service area sections
- [ ] done
**Files:** `src/features/provider-profile/components/profile-sections.tsx`
**Context:** S3.E9, E10 (BR-09, BR-11), E13; screenshot section cards (r20, padding 28 desktop).
**Do:** export `SectionCard({ title, id?, aside?, children, className })`:
```tsx
<section id={id} aria-labelledby={`${id ?? slug}-title`} className={cn('border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-7', className)}>
  <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id=… className="text-title-md text-text">{title}</h2>{aside}</div>
  {children}
</section>
```
- `AboutSection({ bio })`: `<p className="text-body text-text-muted whitespace-pre-line">{bio}</p>`. H2 `About`.
- `ServicesSection({ services })`: H2 `Services offered`; `<ul>` rows `className="border-divider-subtle flex items-start gap-3 border-b py-3 last:border-b-0"`: `<CircleCheck aria-hidden className="text-success mt-0.5 size-5 shrink-0" />`, name `text-body-sm text-text min-w-0 flex-1 font-semibold break-words`, price right `ml-auto shrink-0 text-right` containing — non-fixed: `<span className="text-meta text-text-subtle mr-2">from</span><span className="text-body-sm text-text font-bold">{formatLkr(price)}{suffix}</span>`; fixed: `<span …font-bold>{formatLkr(price)} fixed</span>` (use `priceParts` from `lib/format` to get suffix and lead). Note under list: `<p className="text-meta text-text-subtle">Final price is confirmed by the provider after reviewing your request.</p>`.
- `ServiceAreaSection({ areas })`: H2 `Service area`; rows (already ordered by the API; do not re-sort) `flex min-h-11 items-center gap-3 border-b border-border py-2.5 last:border-b-0`: `<MapPin aria-hidden className="text-primary size-5" />`, name `text-body-sm text-text font-semibold`, base → `<span className="text-meta text-text-subtle ml-auto">Based here</span>`. No map.
**Verify:** `pnpm typecheck && pnpm lint` green.
**Commit:** `git commit -m "feat(web): about, services and service area sections (M07-T17)"`

### T18 — Reviews section
- [ ] done
**Files:** `src/features/provider-profile/components/reviews-section.tsx`
**Context:** S3.E11 (E12 hidden: `features.replies` is false — do not render `reply`), §6.1 review row skeleton (3), §6.3 section error, D-8, AC3, AC7.
**Do:** props `{ providerId: string; businessName: string; rating: number | null; reviewCount: number }`; uses `useProviderReviews(providerId)`. Render inside `SectionCard id="reviews" className="scroll-mt-22"` with title `Reviews`, aside (only when reviewCount > 0): `<span className="text-body-sm text-text-subtle"><Star aria-hidden className="text-star inline size-4 fill-current" strokeWidth={0} /> <b className="text-text">{formatRating(rating, reviewCount)}</b> · {reviewCount} reviews</span>`.
States:
- **reviewCount === 0** (from the profile; don't wait for the query): `EmptyState icon={Star} title="No reviews yet" body={`${businessName} is new on Fixit. Reviews appear here after completed jobs.`} titleAs="h3" className="py-8"` (compact).
- **loading first page**: `<LoadingRegion loading skeleton={<>{3 × <SkeletonReviewRow />}</>} />`.
- **first page error**: `<SectionError onRetry={() => void q.refetch()} />`.
- **data**: `<ul>` of all `pages.flatMap(p => p.items)`; row `border-border flex gap-4 border-b py-4 last:border-b-0`: avatar `bg-primary-soft text-primary grid size-11 shrink-0 place-items-center rounded-full font-extrabold text-label` with `initialsOf(authorDisplayName.replace('.', ''))`; body: top row `flex flex-wrap items-baseline justify-between gap-x-3` with `<p className="text-body-sm text-text font-bold">{authorDisplayName}</p>` and `<time dateTime={createdAt} className="text-meta text-text-subtle">{formatReviewDate(createdAt)}</time>`; `<Stars rating={r.rating} count={1} showValue={false} size={14} />`; `<p className="text-body-sm text-text-muted mt-1">{text}</p>`.
- **more**: `hasNextPage && !isFetchNextPageError` → `<Button variant="secondary" className="self-start" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage} aria-busy={isFetchingNextPage}>Show more reviews</Button>` (label stays; spinner not required). Hidden when all are shown.
- **load-more error** (`isFetchNextPageError`): keep list; render `<SectionError onRetry={() => void fetchNextPage()} />` below it.
**Verify:** `pnpm typecheck && pnpm lint` green.
**Commit:** `git commit -m "feat(web): provider reviews section (M07-T18)"`

### T19 — Profile page, phone bar, skeleton, not found; wire route
- [ ] done
**Files:** `src/features/provider-profile/components/sticky-request-bar.tsx`, `src/features/provider-profile/pages/provider-profile-page.tsx`, `src/app/chunks/public.tsx`
**Context:** S3 layouts, E1, E14, §6.1 profile skeleton, §6.4; D-6; AC1, AC5, AC6, AC7.
**Do:**
1. `StickyRequestBar({ profile, action })`: return null when `action.kind === 'hidden'`. Otherwise
```tsx
<div className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 border-t px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:hidden">
  <div className="flex items-center gap-4">
    <div className="shrink-0"><p className="text-caption text-text-subtle font-medium normal-case">Starting at</p><PriceLabel variant="short" amount=… unit=… amountClassName="text-title-md font-extrabold" /></div>
    <RequestActionBlock action={action} helperId="request-helper-bar" className="min-w-0 flex-1" />
  </div>
</div>
```
2. Page:
```tsx
export function ProviderProfilePage() {
  const { id = '' } = useParams();
  const profile = useProviderProfile(id);
  const action = useRequestAction(profile.data);
  useBodyClass(profile.data ? 'pb-36 sm:pb-0' : '');
  if (profile.isError) {
    if (profile.error instanceof ApiError && profile.error.status === 404) return <NotFoundPage variant="provider" />;
    throw profile.error; // S41 via the route boundary
  }
  const p = profile.data;
  return (
    <div className="max-w-content mx-auto flex w-full flex-col gap-6 px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pb-22">
      <BackLink to={lastDiscoverUrl()}>Back to results</BackLink>
      <LoadingRegion loading={!p} skeleton={<ProfileSkeleton />}>
        {p && (
          <>
            <ProfileHeader profile={p} action={action} />
            <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_theme(spacing.aside)] lg:items-start">
              <AboutSection bio={p.bio} className="order-1 lg:order-none lg:col-start-1 lg:row-start-1" />
              <ServicesSection services={p.services} className="order-2 lg:order-none lg:col-start-1 lg:row-start-2" />
              <ReviewsSection … className="order-4 sm:order-3 lg:order-none lg:col-start-1 lg:row-start-3" />
              <ServiceAreaSection areas={p.areas} className="order-3 sm:order-4 lg:order-none lg:sticky lg:top-24 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start" />
            </div>
            <StickyRequestBar profile={p} action={action} />
          </>
        )}
      </LoadingRegion>
    </div>
  );
}
```
   - If `theme(spacing.aside)` does not compile in Tailwind v4, use `lg:grid-cols-[minmax(0,1fr)_380px]`.
   - Pass `className` through on the section components (T17/T18 accept it).
   - `useBodyClass('')` must be a no-op (the hook filters empty strings).
   - Not-found (`NotFoundPage variant="provider"`) already renders only `This provider couldn't be found.` + `Browse all providers`; render it **without** the BackLink (AC6 "only").
   - Set `document.title` the way other pages do (check `discover-page.tsx`; if none do, skip).
3. `ProfileSkeleton` (same file or `components/profile-skeleton.tsx`): `<div className="flex flex-col gap-6"><SkeletonProfileHeader /><div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px]"><div className="flex flex-col gap-6"><SkeletonSectionCard lines={3} /><SkeletonSectionCard lines={5} /></div><SkeletonSectionCard lines={4} /></div></div>`.
4. `chunks/public.tsx`: delete the placeholder `ProviderProfilePage` function (and the `PlaceholderScreen` import if now unused) and add `export { ProviderProfilePage } from '@/features/provider-profile/pages/provider-profile-page';`.
**Verify:** `pnpm verify` green; `pnpm dev:mock`, open `/providers/p01` — renders.
**Commit:** `git commit -m "feat(web): provider profile page (M07-T19)"`

### T20 — Profile page behaviour tests
- [ ] done
**Files:** `src/features/provider-profile/pages/provider-profile-page.test.tsx`
**Context:** AC1–AC7 (behaviour only; no markup/styling assertions).
**Do / Test:**
```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { authStore } from '@/lib/auth-store';
import { rememberDiscover } from '@/lib/last-discover';
import { armForcedError } from '@/mocks/lib/controls';

const TIP = "Fixit has checked this provider's national ID and, where listed, their trade qualification.";

describe('ProviderProfilePage', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    authStore.setGuest();
  });
  it('AC1: header, sections, back link to last Discover URL', async () => {
    rememberDiscover('?q=plumb');
    renderRoute('/providers/p01');
    expect(await screen.findByRole('heading', { level: 1, name: 'Bell & Sons Plumbing' })).toBeInTheDocument();
    expect(screen.getByText('Owned & run by Marcus Bell')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to results' })).toHaveAttribute('href', '/discover?q=plumb');
    expect(screen.getByText('Final price is confirmed by the provider after reviewing your request.')).toBeInTheDocument();
    const area = screen.getByRole('region', { name: 'Service area' });
    expect(within(area).getAllByRole('listitem')[0]).toHaveTextContent('ColomboBased here');
    await userEvent.click(screen.getByRole('link', { name: '212 reviews' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
  it('AC2: verified tooltip opens on click and closes on Esc', async () => {
    renderRoute('/providers/p01');
    const badge = await screen.findByRole('button', { name: /Verified/ });
    expect(badge).toHaveAccessibleDescription(`What does Verified mean? ${TIP}`);
    await userEvent.hover(badge);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(TIP);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });
  it('AC2: unverified provider shows Not yet verified', async () => {
    renderRoute('/providers/p08');
    expect(await screen.findByText('Not yet verified')).toBeInTheDocument();
  });
  it('AC3: 5 reviews, then 10 more', async () => {
    renderRoute('/providers/p01');
    const reviews = await screen.findByRole('region', { name: 'Reviews' });
    await waitFor(() => expect(within(reviews).getAllByRole('listitem')).toHaveLength(5));
    expect(within(reviews).getByText('Sarah K.')).toBeInTheDocument();
    await userEvent.click(within(reviews).getByRole('button', { name: 'Show more reviews' }));
    await waitFor(() => expect(within(reviews).getAllByRole('listitem')).toHaveLength(15));
  });
  it('AC3: provider with no reviews', async () => {
    renderRoute('/providers/p12');
    expect(await screen.findByText('New')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No reviews yet' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more reviews' })).not.toBeInTheDocument();
  });
  it.each([
    ['guest', null, 'link', 'Request Service', '/login?next=/providers/p01/request'],
    ['owner', 'provider', 'link', 'Edit your listing', '/dashboard/profile'],
    ['open request', 'customer', 'link', 'View your request', '/requests/FX-2061'],
  ] as const)('AC4: %s', async (_label, persona, role, name, href) => {
    if (persona) signInAs(persona);
    renderRoute('/providers/p01');
    const links = await screen.findAllByRole(role, { name });
    expect(links[0]).toHaveAttribute('href', href);
  });
  it('AC4: admin sees no Request Service', async () => {
    signInAs('admin');
    renderRoute('/providers/p01');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText('Request Service')).not.toBeInTheDocument();
  });
  it('AC4: limit and paused are disabled with helper copy', async () => {
    signInAs('customerAtLimit');
    renderRoute('/providers/p01');
    expect((await screen.findAllByRole('button', { name: /Request Service/ }))[0]).toBeDisabled();
    expect(screen.getAllByText('You have 5 open requests. Wait for one to finish or cancel one to send another.')[0]).toBeInTheDocument();
  });
  it('AC4: paused provider (guest)', async () => {
    renderRoute('/providers/p13');
    expect((await screen.findAllByRole('button', { name: /Request Service/ }))[0]).toBeDisabled();
    expect(screen.getAllByText("Lanka Paint Works isn't taking new requests right now.")[0]).toBeInTheDocument();
    expect(screen.getByText('Not taking requests')).toBeInTheDocument();
  });
  it.each(['unknown', 'p14', 'p11'])('AC6: %s → not found only', async (id) => {
    renderRoute(`/providers/${id}`);
    expect(await screen.findByText("This provider couldn't be found.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse all providers' })).toHaveAttribute('href', '/discover');
    expect(screen.queryByRole('link', { name: 'Back to results' })).not.toBeInTheDocument();
  });
  it('AC7: reviews 500 → section error, rest renders; retry loads', async () => {
    armForcedError('providers_reviews', '500');
    renderRoute('/providers/p01');
    expect(await screen.findByText("We couldn't load this.")).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Bell & Sons Plumbing' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Sarah K.')).toBeInTheDocument();
  });
});
```
Notes: the request block renders twice (header + phone bar), hence `findAll…[0]`. If `act` is unused, drop the import. If `findByRole('region', { name })` doesn't resolve, check that each `SectionCard` has `aria-labelledby` pointing to its H2. The guest → login → `/providers/p01/request` round-trip (AC4) is already covered by M04 login tests with `next`; verify it manually in T21.
**Verify:** `pnpm --filter @fixit/web test -- provider-profile-page` green; `pnpm verify` green.
**Commit:** `git commit -m "test(web): provider profile page behaviour (M07-T20)"`

### T21 — Acceptance checks
- [ ] done
**Files:** this plan (tick boxes), `docs/milestones/M00-index.md` (mark M07 done the same way M06 was)
**Do:** run `pnpm verify` (green), then `pnpm dev:mock` and check every criterion. Use DevPanel "Reset demo data" first (version bump reseeds anyway).
| AC | Check |
|---|---|
| 1 | 1440px `/discover?q=plumb` → open Bell & Sons → `Back to results` returns to `/discover?q=plumb`. Fresh tab `/providers/p01` → back link `/discover`. Header: placeholder tile with Wrench, `Owned & run by Marcus Bell`, stars `4.9` `212 reviews` (click → smooth scroll, heading not under nav), `Colombo`, `14 years experience`, Verified, `Starting at LKR 2,500 / hour`, Request Service. About, Services (`from LKR 2,500 / hour`, `LKR 13,500 fixed`) + BR-11 note, Reviews; sticky Service area aside, Colombo first `Based here`, rest A→Z. Vitest T20 AC1. |
| 2 | Hover, Tab-focus, and tap (DevTools touch) the badge: tooltip opens with the exact copy; Esc and tap outside close; tapping the badge again closes. `/providers/p08` shows `Not yet verified`. Vitest T20 AC2. |
| 3 | p01: 5 reviews, `Sarah K.`, `d MMM yyyy` dates; `Show more reviews` → 15; keep clicking on a provider with ≤ 15 (p08 has 41 → click 4×) until the button disappears. `/providers/p12`: `New` + `No reviews yet` card. Vitest T20 AC3, T7, T8. |
| 4 | DevPanel personas: Admin → no button; Marcus on p01 → `Edit your listing` → `/dashboard/profile` + `This is your listing.`; signed out → click → `/login?next=/providers/p01/request`, log in as Olivia → lands on `/providers/p01/request`; Olivia on p01 → `View your request` → `/requests/FX-2061`; Dilani (`Customer, 5 open requests`) on p02 → disabled + 5-requests helper; `/providers/p13` → disabled + `Lanka Paint Works isn't taking new requests right now.` Vitest T11, T12, T20 AC4. |
| 5 | 390px: header 88×88 tile beside category + H1; owner, rating, town, years each on its own line; badges row; sections About → Services → Service area → Reviews; sticky bar with `Starting at` + full-width Request Service; scroll to the very bottom — footer is not hidden by the bar; tooltip stays inside the viewport. 800px: header action as a full-width row; aside under Reviews. 1440/390/800: no horizontal scroll. |
| 6 | `/providers/unknown`, `/providers/p14` (suspended Ruwan), `/providers/p11` (Kasun draft) → only `This provider couldn't be found.` + `Browse all providers`. Vitest T20 AC6. |
| 7 | DevPanel latency `slow` → profile skeleton (header + section cards) after 150 ms. DevPanel force 500 on `providers_reviews` → Reviews shows `We couldn't load this.`, rest renders; `Try again` loads. Vitest T20 AC7. |
| 8 | `pnpm --filter @fixit/web test -- request-action handlers/requests mocks/lib/profile` green; `pnpm --filter @fixit/contracts test -- eligibility` green. |
Tick all boxes, commit.
**Verify:** `pnpm verify` green; every row above checked.
**Commit:** `git commit -m "chore: M07 acceptance checks (M07-T21)"`

## Checkpoints
- After T9: "Human: `pnpm dev:mock`, in the browser console `await (await fetch('/api/providers/p01')).json()` and `/api/providers/p01/reviews?page=2` — profile and 10 reviews."
- After T19: "Human: run `pnpm dev:mock`, open `/providers/p01` at 1440 and 390, compare with `reference/screens/05-provider-verified-desktop.png` (ignore `$`, `TX`, the Save button and the map placeholder; the phone screenshot is a broken prototype — follow SPEC S3 phone layout instead)."
- After T21: "Human: walk AC4 with each DevPanel persona."

## Blockers
**Resolved: option A, and `store.test.ts` now uses `MOCK_DB_KEY`/`MOCK_DB_VERSION`.**

### T6 — two existing tests fail after the planned fixture changes (stopped)
T1–T5 are done and committed. The T6 edits (providers p12–p14, users, `customerAtLimit` persona, `buildLimitRequests`, `build.ts`, new `build.test.ts` cases, `MOCK_DB_VERSION = 3`) are written but **uncommitted** in the working tree, because `pnpm verify` is red. Step 7 only allows changing numbers that count fixture providers, and neither failure is one.

1. `packages/fixtures/src/build.test.ts:88` "pending requests are 3–6 days out and not expired" asserts `world.requests.filter(status === 'pending')` has length 3 with `preferredDate` within today+3..+6. T6 step 3 adds 5 pending requests for Dilani (FX-1990…1994) with `preferredDate` today+4..+8. The count becomes 8, and today+7 and +8 are outside the window, so fixing the count alone is not enough.
   - Option A: scope the test to the prototype requests (`providerId === 'p01'` and `customerId !== 'u-dilani'`). The intent is "the prototype's 3 pending requests", so the check stays as strict.
   - Option B: change the plan so Dilani's `preferredDate` is today+3..+6 (for example `3 + (i % 4)`) and update the count to 8. This keeps the test global but weakens the "3" meaning.
   - Option C: leave the test alone and give Dilani's requests a status that is open but not `pending`. This is not possible, because only `accepted` is open besides `pending`, and an accepted request needs steps.
2. `apps/web/src/mocks/db/store.test.ts` has two tests that hardcode the storage key `fixit.mockdb.v2` ("seeds when storage is empty and persists under fixit.mockdb.v2" and "reseeds when the stored version differs"). The mandated bump to `MOCK_DB_VERSION = 3` makes them fail. The fix is mechanical (use `MOCK_DB_KEY` or `v3`), but the plan doesn't list it.

Recommended: plan owner amends T6 step 7 to say (a) option A for the fixtures test and (b) the web `store.test.ts` key follows `MOCK_DB_KEY`. Then rerun from T6.


## Nice-to-haves (not tasks)
- Prefetch the profile on result-card hover/focus in Discover.
- `<title>` per provider and Open Graph tags.
- Spinner in `Show more reviews` while fetching.
