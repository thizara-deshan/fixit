# PLAN-M09 — My requests, cancel & leave a review
Milestone: `docs/milestones/M09-my-requests-reviews.md` · Start tag: `m09-start` · Verify-all: `pnpm verify`
Mock domains at start → end: all → all (`requests` gains `GET /me/requests` and `POST /me/requests/:ref/cancel`; `reviews` gets its first handler, `POST /me/requests/:ref/review`). **No backend in this milestone** (`apps/api` does not exist yet), so there are no Nest tasks and no authorization-matrix rows. The mocks apply role rules through `mockEndpoint`, ownership through `customerId = actor` lookups (miss → 404) and business rules through contracts functions, as the API will.

Conventions for the executor (same as M08):
- T1 creates tag `m09-start` and branch `m09-my-requests` from the current HEAD (`git tag m09-start && git switch -c m09-my-requests`). One commit per task, using the message given, ending with the attribution lines from your session instructions.
- Run `pnpm format` before `pnpm verify` in every task. Code below may not be Prettier-exact.
- Code blocks are complete files unless the step says "add", "replace" or "edit". Tests import `describe/expect/it/vi` from `vitest` explicitly.
- Paths are under `apps/web/` unless they start with `packages/`, `docs/` or `/`. `@/` = `apps/web/src/`.
- Tailwind: only `sm` (≥641) and `lg` (≥1024) prefixes. Arbitrary **size/grid** values are allowed (`max-w-[640px]`, `grid-cols-[minmax(0,1fr)_380px]`). Arbitrary colour values and lint-banned prefixes (`text-[`, `bg-[`, `border-[`, `shadow-[`, `ring-[`, `outline-[`) are not. Token classes used in this plan: `bg-surface bg-page bg-primary-soft bg-success-soft bg-warning-soft bg-surface-muted text-text text-text-muted text-text-subtle text-primary text-success text-danger-text border-border border-border-strong`, top-border colours `border-t-warning border-t-primary border-t-success border-t-danger border-t-icon-subtle border-t-border-control`, dots `bg-warning bg-primary bg-success bg-danger bg-icon-subtle bg-border-control`, type scale `text-title-lg text-title-md text-title-sm text-lead text-body text-body-sm text-label text-meta text-caption`, radii `rounded-md rounded-lg rounded-xl rounded-2xl rounded-full`, `font-mono`.
- Copy in backticks is SPEC copy, character for character.
- Time in tests (M08 D-6): fixtures are seeded at `FIXED_NOW` (`@/test/fixed-now`, Sun 22 Nov 2026 10:00 Colombo). Every new test that calls the requests/reviews handlers uses `vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] })` in `beforeEach` and `vi.useRealTimers()` in `afterEach`.
- If a library API differs from what the code assumes (React Router 7, TanStack Query 5, zod 4, react-hook-form 7, lucide-react names), **STOP** and write a blocker.

Planner's decisions the executor must follow:
- **D-1 Fixtures for every status.** The milestone says "fixtures already contain requests in every status". They don't: Olivia has only FX-2061 (Pending) and FX-2046 (Completed, eligible). T6 adds `buildCustomerJourneyRequests` (FX-2028…FX-2036, Olivia, providers p04–p07, p09, p10, which no existing test uses). This raises Olivia's open count from 1 to 4 (still under the limit of 5). The one test that asserts `openRequestCount: 1` (`src/mocks/handlers/auth.test.ts`) is updated in T6. `MOCK_DB_VERSION` goes 3 → 4 so stored dev dbs reseed.
- **D-2 `makeRequest` steps get an optional actor** (`provider` default, `admin`, `system`). `closedBy` becomes the actor of the last step for every final status (before: `provider` for declined/completed, `null` otherwise; no fixture was cancelled or expired, so nothing existing changes).
- **D-3 `categoryId` in the customer view.** S15 `Find another provider` → `/discover?cat={cat}&loc={town}` needs the provider's category id, which `CustomerRequestView.provider` doesn't carry. T2 adds `categoryId: Id` (additive; noted for the API milestone).
- **D-4 `reviewEligibility(request, existingReview, actorId, now)`.** ARCH §4 sketches `(request, existingReview, now)`. The milestone's AC9 also tests "other customer", so the function takes the actor id as a third argument. Order of checks: other customer → `review_not_eligible`; not Completed → `review_not_eligible`; existing review → `already_reviewed`; `now ≥ completedAt + 30 days` → `review_window_closed`. `toCustomerView` uses it for `review.eligible` so the rule exists once.
- **D-5 Conflicts.** The mock cancel handler turns a refused transition into 409 `INVALID_TRANSITION` with `details.reason` **and** `details.status` (the current status, ARCH error table) via a shared helper `transitionOr409`. The web handles 409 by closing the cancel dialog, refetching the request and opening the §6.3 conflict dialog: title `This request has changed`; body `It's now {Status}, so this action isn't available.` (Status = pill label of the refetched status). When `details.reason === 'past_cancel_deadline'` the body is the S15 copy `It's too late to cancel online. Contact {Business} directly.` Button `OK`.
- **D-6 Cut-off copy.** `cancelDeadline` is 00:00 Colombo on the preferred date (BR-30, existing rule). The S15 sentence prints the day before: `You can cancel until 11:59 PM on {formatDateShort(addDays(preferredDate, -1))}.` (e.g. `Sat, 21 Nov`). The UI never compares times: whether the button shows is `view.canCancel`.
- **D-7 Row layout per width.** S14 uses `DataList` with two column sets chosen by `useMediaQuery(MQ.sm)`: the SPEC table columns at ≥ 641, and the SPEC phone card rows below.
- **D-8 Copy failure.** `Copy` uses `navigator.clipboard.writeText`. On failure: `notifyError("Couldn't copy. Try again.")` (the §6.3 action-failed pattern). Success: `notify('Number copied.')`.
- **D-9 Review form leaves the page only after success.** Same as M08 S12: a `postedRef` state is set in `onSuccess`, the guard is `when={dirty && postedRef === null}`, and an effect navigates when `postedRef` is set.

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `packages/contracts/src/requests/list.ts` (+ `list.test.ts`) | Create | `RequestStatusGroup`, `statusesOf`, `groupOf`, `RequestListQuery`, `MyRequestList`, `CancelBody` |
| `packages/contracts/src/requests/schemas.ts` | Modify | `provider.categoryId` in `CustomerRequestView` |
| `packages/contracts/src/requests/projections.ts` (+ test) | Modify | `categoryId`, eligibility via `reviewEligibility` |
| `packages/contracts/src/reviews/schemas.ts` (+ `schemas.test.ts`) | Create | `CreateReviewBody`, `Review`, `RATING_LABELS` |
| `packages/contracts/src/reviews/rules.ts` (+ test) | Modify | `reviewEligibility` |
| `packages/contracts/src/endpoints.ts` (+ test) | Modify | `requests_list`, `requests_cancel`, `reviews_create` |
| `packages/contracts/src/index.ts` | Modify | exports |
| `packages/fixtures/src/requests.ts`, `build.ts`, `build.test.ts` | Modify | step actors, Olivia's journey requests + hidden review |
| `src/mocks/db/schema.ts` | Modify | `MOCK_DB_VERSION = 4` |
| `src/mocks/handlers/auth.test.ts` | Modify | Olivia open count 4 |
| `src/mocks/lib/requests.ts` (+ test) | Modify | `customerViewOf` categoryId, `transitionOr409`, `myRequestList` |
| `src/mocks/handlers/requests.ts` (+ `requests-mine.test.ts`) | Modify/Create | list + cancel |
| `src/mocks/handlers/reviews.ts` (+ test), `src/mocks/handlers/index.ts` | Create/Modify | post review + rating recompute |
| `src/lib/query-keys.ts` | Modify | `myRequests.list` |
| `src/lib/format.ts` (+ test) | Modify | `formatCancelCutoffDay`, `formatCount` |
| `src/components/status-pill.tsx` | Modify | export `REQUEST_DOT` / `REQUEST_LABEL` |
| `src/features/requests/api.ts` | Modify | `fetchMyRequests`, `cancelMyRequest`, `postReview` |
| `src/features/requests/hooks.ts` (+ `hooks.test.tsx`) | Modify | `useMyRequests`, `useCancelRequest`, `usePostReview` |
| `src/features/requests/list-search.ts` (+ test) | Create | `?status=&page=` ↔ `RequestListQuery` |
| `src/features/requests/status-panel.ts` (+ test) | Create | S15 panel copy per status |
| `src/features/requests/history.ts` (+ test) | Create | S15.E7 actor wording |
| `src/features/requests/components/my-requests-list.tsx` | Create | S14 table / phone cards |
| `src/features/requests/components/status-panel-card.tsx` | Create | S15.E2 |
| `src/features/requests/components/contact-block.tsx` | Create | S15.E4 |
| `src/features/requests/components/cancel-request-dialog.tsx` | Create | §8.3 cancel dialog |
| `src/features/requests/components/conflict-dialog.tsx` | Create | §6.3 conflict dialog |
| `src/features/requests/components/review-block.tsx` | Create | S15.E6 |
| `src/features/requests/components/request-details-card.tsx` | Create | S15.E5 |
| `src/features/requests/components/request-history.tsx` | Create | S15.E7 |
| `src/features/requests/components/provider-aside-card.tsx` | Create | S15.E3 |
| `src/features/requests/components/star-rating-input.tsx` | Create | S16 rating field |
| `src/features/requests/components/review-form.tsx` | Create | S16 form card |
| `src/features/requests/pages/my-requests-page.tsx` (+ test) | Create | S14 |
| `src/features/requests/pages/customer-request-page.tsx` (+ test) | Create | S15 |
| `src/features/requests/pages/leave-review-page.tsx` (+ test) | Create | S16 |
| `src/app/chunks/customer.tsx` | Modify | wire S14–S16 |
| `src/features/requests/pages/request-sent-page.test.tsx` | Modify | S13 redirect assertion now finds the real S15 |

## Tasks

### T1 — Status groups, `RequestListQuery`, `MyRequestList`, `CancelBody`
- [x] done
**Files:** `packages/contracts/src/requests/list.ts`, `packages/contracts/src/requests/list.test.ts`, `packages/contracts/src/index.ts`
**Context:** SPEC S14.E2 (groups: Open = Pending + Accepted; Closed = Declined + Cancelled + Expired), S14.E5 (20 per page, `PAGE_SIZE.myRequests`), §8.3 reason ≤ 500 `Keep the reason under 500 characters.`; ARCH §3.4. `PageQuery`, `paginated` in `common/pagination.ts`.
**Do:**
1. `git tag m09-start && git switch -c m09-my-requests`.
2. Create `packages/contracts/src/requests/list.ts`:
```ts
import { z } from 'zod';
import type { RequestStatus } from '../common/enums';
import { paginated } from '../common/pagination';
import { CustomerRequestView } from './schemas';

export const RequestStatusGroup = z.enum(['all', 'open', 'completed', 'closed']);
export type RequestStatusGroup = z.infer<typeof RequestStatusGroup>;

const GROUPS: Record<Exclude<RequestStatusGroup, 'all'>, readonly RequestStatus[]> = {
  open: ['pending', 'accepted'],
  completed: ['completed'],
  closed: ['declined', 'cancelled', 'expired'],
};

/** SPEC S14.E2. `all` → every status. */
export function statusesOf(group: RequestStatusGroup): readonly RequestStatus[] {
  return group === 'all' ? [...GROUPS.open, ...GROUPS.completed, ...GROUPS.closed] : GROUPS[group];
}

export function groupOf(status: RequestStatus): Exclude<RequestStatusGroup, 'all'> {
  if (GROUPS.open.includes(status)) return 'open';
  if (status === 'completed') return 'completed';
  return 'closed';
}

/** URL `?status=&page=` and GET /me/requests query. Invalid values fall back to defaults. */
export const RequestListQuery = z.object({
  status: RequestStatusGroup.catch('all').default('all'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});
export type RequestListQuery = z.infer<typeof RequestListQuery>;

export const RequestCounts = z.object({
  all: z.number().int().min(0),
  open: z.number().int().min(0),
  completed: z.number().int().min(0),
  closed: z.number().int().min(0),
});
export type RequestCounts = z.infer<typeof RequestCounts>;

export const MyRequestList = paginated(CustomerRequestView).extend({ counts: RequestCounts });
export type MyRequestList = z.infer<typeof MyRequestList>;

export const REASON_MAX_MESSAGE = 'Keep the reason under 500 characters.';

/** §8.3 customer cancel: optional reason ≤ 500. Empty → undefined. */
export const CancelBody = z.object({
  reason: z
    .string()
    .trim()
    .max(500, REASON_MAX_MESSAGE)
    .optional()
    .transform((s) => (s === '' ? undefined : s)),
});
export type CancelBody = z.infer<typeof CancelBody>;
```
3. Add `export * from './requests/list';` to `packages/contracts/src/index.ts`.
**Test:** `packages/contracts/src/requests/list.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { CancelBody, groupOf, RequestListQuery, statusesOf } from './list';

describe('status groups (S14.E2)', () => {
  it('maps groups to statuses', () => {
    expect(statusesOf('open')).toEqual(['pending', 'accepted']);
    expect(statusesOf('closed')).toEqual(['declined', 'cancelled', 'expired']);
    expect(statusesOf('all')).toHaveLength(6);
  });
  it.each([
    ['pending', 'open'],
    ['accepted', 'open'],
    ['completed', 'completed'],
    ['expired', 'closed'],
  ] as const)('%s → %s', (s, g) => {
    expect(groupOf(s)).toBe(g);
  });
});

describe('RequestListQuery', () => {
  it('defaults', () => {
    expect(RequestListQuery.parse({})).toEqual({ status: 'all', page: 1 });
  });
  it('invalid values fall back', () => {
    expect(RequestListQuery.parse({ status: 'nope', page: '-2' })).toEqual({ status: 'all', page: 1 });
  });
  it('parses strings from the URL', () => {
    expect(RequestListQuery.parse({ status: 'closed', page: '3' })).toEqual({ status: 'closed', page: 3 });
  });
});

describe('CancelBody', () => {
  it('empty reason → undefined', () => {
    expect(CancelBody.parse({ reason: '  ' })).toEqual({ reason: undefined });
  });
  it('501 characters → SPEC message', () => {
    const r = CancelBody.safeParse({ reason: 'x'.repeat(501) });
    expect(r.success ? '' : r.error.issues[0]?.message).toBe('Keep the reason under 500 characters.');
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green; then `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): request list query, status groups and cancel body (M09-T1)"`

### T2 — `categoryId` in `CustomerRequestView`
- [x] done
**Files:** `packages/contracts/src/requests/schemas.ts`, `packages/contracts/src/requests/projections.ts`, `packages/contracts/src/requests/projections.test.ts`, `src/mocks/lib/requests.ts`
**Context:** D-3; SPEC S15 `Find another provider` → `/discover?cat={cat}&loc={town}`.
**Do:**
1. In `schemas.ts`, inside `CustomerRequestView` → `provider: z.object({ … })`, add `categoryId: Id,` directly after `id: Id,`.
2. In `projections.ts`, add `categoryId: string;` after `id: string;` in `CustomerViewContext['provider']`.
3. In `src/mocks/lib/requests.ts` `customerViewOf`, add `categoryId: category.id,` after `id: p.id,`.
4. In `projections.test.ts`, add `categoryId: 'plumbing'` to every provider context object the test builds (search for `categoryIcon:` and add the line next to it). Add one assertion to the first existing test: `expect(view.provider.categoryId).toBe('plumbing');` (use the variable name the test uses for the view).
**Verify:** `pnpm verify` green (typecheck proves every caller passes `categoryId`).
**Commit:** `git commit -m "feat(contracts): provider category id in the customer request view (M09-T2)"`

### T3 — `CreateReviewBody`, `Review`, `RATING_LABELS`
- [x] done
**Files:** `packages/contracts/src/reviews/schemas.ts`, `packages/contracts/src/reviews/schemas.test.ts`, `packages/contracts/src/index.ts`
**Context:** SPEC S16 field table; BR-26; ARCH §2.5 excerpt. `PublicReview` in `catalog/schemas.ts`.
**Do:**
1. Create `packages/contracts/src/reviews/schemas.ts`:
```ts
import { z } from 'zod';
import { PublicReview } from '../catalog/schemas';
import { ReviewVisibility } from '../common/enums';
import { Id, RequestRef } from '../common/primitives';

const RATING_MESSAGE = 'Choose a star rating.';

/** SPEC S16 / BR-26. `rating` is undefined in an untouched form → the SPEC message. */
export const CreateReviewBody = z.object({
  rating: z.number({ error: RATING_MESSAGE }).int(RATING_MESSAGE).min(1, RATING_MESSAGE).max(5, RATING_MESSAGE),
  text: z
    .string({ error: 'Write at least 10 characters.' })
    .trim()
    .min(10, 'Write at least 10 characters.')
    .max(1000, 'Keep your review under 1,000 characters.'),
});
export type CreateReviewBody = z.infer<typeof CreateReviewBody>;

export const Review = PublicReview.extend({
  requestRef: RequestRef,
  serviceName: z.string(),
  providerId: Id,
  visibility: ReviewVisibility,
});
export type Review = z.infer<typeof Review>;

/** SPEC S16 star labels, index = rating − 1. */
export const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'] as const;
```
2. Add `export * from './reviews/schemas';` to `index.ts`.
**Test:** `packages/contracts/src/reviews/schemas.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { CreateReviewBody } from './schemas';

const messages = (input: unknown) => {
  const r = CreateReviewBody.safeParse(input);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
};

describe('CreateReviewBody (S16)', () => {
  it('empty form → both SPEC messages', () => {
    expect(messages({ text: '' })).toEqual({
      rating: 'Choose a star rating.',
      text: 'Write at least 10 characters.',
    });
  });
  it('text is trimmed before the length check', () => {
    expect(messages({ rating: 4, text: '   short   ' })).toEqual({ text: 'Write at least 10 characters.' });
  });
  it('too long', () => {
    expect(messages({ rating: 4, text: 'x'.repeat(1001) })).toEqual({
      text: 'Keep your review under 1,000 characters.',
    });
  });
  it('out of range rating', () => {
    expect(messages({ rating: 6, text: 'Great work, thanks!' })).toEqual({ rating: 'Choose a star rating.' });
  });
  it('valid', () => {
    expect(CreateReviewBody.parse({ rating: 5, text: '  Great work, thanks!  ' })).toEqual({
      rating: 5,
      text: 'Great work, thanks!',
    });
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green. If zod 4 reports a different first message for `{ text: '' }` on `rating` (missing key), **STOP** and write a blocker.
**Commit:** `git commit -m "feat(contracts): review body and review schemas (M09-T3)"`

### T4 — `reviewEligibility` and its use in `toCustomerView`
- [x] done
**Files:** `packages/contracts/src/reviews/rules.ts`, `packages/contracts/src/reviews/rules.test.ts`, `packages/contracts/src/requests/projections.ts`
**Context:** BR-24, BR-25; D-4; AC9. `RuleCode` already has `review_not_eligible`, `review_window_closed`, `already_reviewed`.
**Do:**
1. Append to `packages/contracts/src/reviews/rules.ts`:
```ts
import type { RequestStatus } from '../common/enums';

export interface ReviewableRequest {
  status: RequestStatus;
  customerId: string;
  completedAt: string | null; // IsoDateTime
}
export type ReviewEligibility =
  | { ok: true; deadline: Date }
  | { ok: false; rule: 'review_not_eligible' | 'review_window_closed' | 'already_reviewed' };

/** BR-24/25 (D-4). Same function in mocks, API and the customer view. */
export function reviewEligibility(
  request: ReviewableRequest,
  existingReview: { id: string } | null,
  actorId: string,
  now: Date,
): ReviewEligibility {
  if (request.customerId !== actorId) return { ok: false, rule: 'review_not_eligible' };
  if (request.status !== 'completed' || request.completedAt === null)
    return { ok: false, rule: 'review_not_eligible' };
  if (existingReview !== null) return { ok: false, rule: 'already_reviewed' };
  const deadline = reviewDeadline(new Date(request.completedAt));
  if (now.getTime() >= deadline.getTime()) return { ok: false, rule: 'review_window_closed' };
  return { ok: true, deadline };
}
```
(Move the `import type` line to the top of the file with the other imports, if any.)
2. In `projections.ts`, import `reviewEligibility` from `'../reviews/rules'` (next to `reviewDeadline`) and replace the `eligible:` line with:
```ts
      eligible: reviewEligibility(r, ctx.ownReview, r.customerId, now).ok,
```
**Test:** add to `packages/contracts/src/reviews/rules.test.ts` (extend the import to `ratingFrom, reviewDeadline, reviewEligibility`):
```ts
describe('reviewEligibility (BR-24/25)', () => {
  const now = new Date('2026-11-22T04:30:00.000Z');
  const completed = { status: 'completed' as const, customerId: 'u-olivia', completedAt: '2026-11-20T04:30:00.000Z' };
  it('own completed request inside 30 days → ok with deadline', () => {
    expect(reviewEligibility(completed, null, 'u-olivia', now)).toEqual({
      ok: true,
      deadline: new Date('2026-12-20T04:30:00.000Z'),
    });
  });
  it('not completed', () => {
    expect(
      reviewEligibility({ ...completed, status: 'accepted', completedAt: null }, null, 'u-olivia', now),
    ).toEqual({ ok: false, rule: 'review_not_eligible' });
  });
  it('more than 30 days', () => {
    const old = { ...completed, completedAt: '2026-10-22T04:29:59.000Z' };
    expect(reviewEligibility(old, null, 'u-olivia', now)).toEqual({ ok: false, rule: 'review_window_closed' });
  });
  it('exactly at the deadline is closed', () => {
    const edge = { ...completed, completedAt: '2026-10-23T04:30:00.000Z' };
    expect(reviewEligibility(edge, null, 'u-olivia', now)).toEqual({ ok: false, rule: 'review_window_closed' });
  });
  it('already reviewed', () => {
    expect(reviewEligibility(completed, { id: 'v1' }, 'u-olivia', now)).toEqual({
      ok: false,
      rule: 'already_reviewed',
    });
  });
  it('other customer', () => {
    expect(reviewEligibility(completed, null, 'u-marcus', now)).toEqual({
      ok: false,
      rule: 'review_not_eligible',
    });
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green (the existing projection tests still pass unchanged); `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): reviewEligibility, used by the customer view (M09-T4)"`

### T5 — Endpoint entries
- [x] done
**Files:** `packages/contracts/src/endpoints.ts`, `packages/contracts/src/endpoints.test.ts`
**Context:** ARCH §3.4 rows `GET /me/requests`, `POST /me/requests/:ref/cancel`; §3.5 `POST /me/requests/:ref/review`.
**Do:**
1. In `endpoints.ts` extend the imports:
```ts
import { CancelBody, MyRequestList, RequestListQuery } from './requests/list';
import { CreateReviewBody, Review } from './reviews/schemas';
```
2. Add after `requests_get`:
```ts
  requests_list: {
    id: 'requests_list',
    domain: 'requests',
    method: 'GET',
    path: '/me/requests',
    access: ['user'],
    owner: 'self',
    query: RequestListQuery,
    response: MyRequestList,
    refs: ['F-12', 'S14'],
  },
  requests_cancel: {
    id: 'requests_cancel',
    domain: 'requests',
    method: 'POST',
    path: '/me/requests/:ref/cancel',
    access: ['user'],
    owner: 'request_customer',
    body: CancelBody,
    response: CustomerRequestView,
    refs: ['F-13', 'S15', 'A12', 'BR-30'],
  },
  reviews_create: {
    id: 'reviews_create',
    domain: 'reviews',
    method: 'POST',
    path: '/me/requests/:ref/review',
    access: ['user'],
    owner: 'request_customer',
    body: CreateReviewBody,
    response: Review,
    refs: ['F-28', 'F-29', 'S16', 'A19', 'BR-24', 'BR-25', 'BR-26', 'BR-27'],
  },
```
**Test:** add to `endpoints.test.ts`:
```ts
  it('M09 rows match ARCHITECTURE §3.4/§3.5', () => {
    expect(ENDPOINTS.requests_list).toMatchObject({ method: 'GET', path: '/me/requests', access: ['user'], domain: 'requests' });
    expect(ENDPOINTS.requests_cancel).toMatchObject({
      method: 'POST',
      path: '/me/requests/:ref/cancel',
      access: ['user'],
      owner: 'request_customer',
    });
    expect(ENDPOINTS.reviews_create).toMatchObject({
      method: 'POST',
      path: '/me/requests/:ref/review',
      access: ['user'],
      owner: 'request_customer',
      domain: 'reviews',
    });
  });
```
**Verify:** `pnpm verify` green. MSW: the GET `/me/requests` list and GET `/me/requests/:ref` don't collide (different paths).
**Commit:** `git commit -m "feat(contracts): my-requests list, cancel and review endpoints (M09-T5)"`

### T6 — Fixtures: step actors and Olivia's journey requests
- [x] done
**Files:** `packages/fixtures/src/requests.ts`, `packages/fixtures/src/build.ts`, `packages/fixtures/src/build.test.ts`, `src/mocks/db/schema.ts`, `src/mocks/handlers/auth.test.ts`
**Context:** D-1, D-2; AC4–AC8. Existing `makeRequest`, `serviceId` (from `./providers`), `FxReview` type.
**Do:**
1. In `requests.ts`, change the `steps` type in `RequestSeed` to:
```ts
  steps: readonly {
    status: Exclude<RequestStatus, 'pending'>;
    at: Date;
    reason?: string;
    actor?: 'provider' | 'admin' | 'system'; // default provider (D-2)
  }[];
```
2. In `makeRequest`, replace the `closedBy:` line with
```ts
    closedBy: status === 'pending' || status === 'accepted' ? null : (last?.actor ?? 'provider'),
```
and replace the mapped events (`...s.steps.map(...)`) with:
```ts
      ...s.steps.map((st) => {
        const actor = st.actor ?? 'provider';
        return {
          status: st.status,
          at: st.at.toISOString(),
          actor,
          actorUserId: actor === 'provider' ? s.provider.userId : actor === 'admin' ? 'u-admin' : null,
          reason: st.reason ?? null,
        };
      }),
```
3. Append to `requests.ts` (add `FxReview` to the `./types` import):
```ts
interface JourneyRow {
  ref: string;
  providerId: string;
  prefDays: number;
  createdHoursAgo: number;
  steps: readonly {
    status: Exclude<RequestStatus, 'pending'>;
    hoursAgo: number;
    actor?: 'provider' | 'admin' | 'system';
    reason?: string;
  }[];
  hiddenReview?: { rating: number; text: string; hoursAgo: number };
}

/** M09 (D-1): Olivia's requests in every state S15 renders. Providers p04–p07, p09, p10 are not used by other tests. */
const JOURNEY: readonly JourneyRow[] = [
  // Accepted, cut-off in the future (AC5)
  { ref: 'FX-2030', providerId: 'p04', prefDays: 5, createdHoursAgo: 30, steps: [{ status: 'accepted', hoursAgo: 20 }] },
  // Accepted, preferred date today → past the cut-off (AC5)
  { ref: 'FX-2031', providerId: 'p05', prefDays: 0, createdHoursAgo: 50, steps: [{ status: 'accepted', hoursAgo: 40 }] },
  // Pending that expires 6 minutes after seeding (AC6 mock sweep)
  { ref: 'FX-2032', providerId: 'p06', prefDays: 4, createdHoursAgo: 71.9, steps: [] },
  // Declined with a reason
  {
    ref: 'FX-2033',
    providerId: 'p07',
    prefDays: -5,
    createdHoursAgo: 300,
    steps: [{ status: 'declined', hoursAgo: 290, reason: 'Fully booked that week.' }],
  },
  // Declined by the system (provider suspended)
  {
    ref: 'FX-2034',
    providerId: 'p09',
    prefDays: -2,
    createdHoursAgo: 200,
    steps: [{ status: 'declined', hoursAgo: 190, actor: 'system', reason: 'Provider unavailable' }],
  },
  // Accepted, then cancelled by an admin
  {
    ref: 'FX-2035',
    providerId: 'p10',
    prefDays: -1,
    createdHoursAgo: 150,
    steps: [
      { status: 'accepted', hoursAgo: 140 },
      { status: 'cancelled', hoursAgo: 100, actor: 'admin', reason: 'The provider reported a family emergency.' },
    ],
  },
  // Expired at createdAt + 72 h
  {
    ref: 'FX-2036',
    providerId: 'p04',
    prefDays: -10,
    createdHoursAgo: 400,
    steps: [{ status: 'expired', hoursAgo: 328, actor: 'system' }],
  },
  // Completed 35 days ago → review window closed (AC8)
  {
    ref: 'FX-2029',
    providerId: 'p09',
    prefDays: -36,
    createdHoursAgo: 900,
    steps: [
      { status: 'accepted', hoursAgo: 890 },
      { status: 'completed', hoursAgo: 840 },
    ],
  },
  // Completed, reviewed, review hidden by an admin (S15.E6 Hidden pill)
  {
    ref: 'FX-2028',
    providerId: 'p10',
    prefDays: -15,
    createdHoursAgo: 400,
    steps: [
      { status: 'accepted', hoursAgo: 390 },
      { status: 'completed', hoursAgo: 350 },
    ],
    hiddenReview: { rating: 2, text: 'Arrived very late and left a mess behind.', hoursAgo: 340 },
  },
];

export function buildCustomerJourneyRequests(
  now: Date,
  ctx: { users: readonly FxUser[]; providers: readonly FxProvider[]; services: readonly FxService[] },
): { requests: RequestRecord[]; reviews: FxReview[] } {
  const today = colomboToday(now);
  const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * HOUR);
  const customer = ctx.users.find((u) => u.id === 'u-olivia');
  if (!customer) throw new Error('fixtures: u-olivia missing');
  const requests: RequestRecord[] = [];
  const reviews: FxReview[] = [];
  for (const row of JOURNEY) {
    const provider = ctx.providers.find((p) => p.id === row.providerId);
    const service = ctx.services.find((s) => s.id === serviceId(row.providerId, 0));
    if (!provider?.baseTownId || !service) throw new Error(`fixtures: bad journey request ${row.ref}`);
    const r = makeRequest({
      ref: row.ref,
      customer,
      provider,
      service,
      townId: provider.baseTownId,
      preferredDate: addDays(today, row.prefDays),
      slot: 'afternoon',
      addressLine1: '24 Galle Road',
      description: 'Please take a look and tell me what it will cost.',
      createdAt: at(row.createdHoursAgo),
      steps: row.steps.map((st) => ({
        status: st.status,
        at: at(st.hoursAgo),
        ...(st.actor ? { actor: st.actor } : {}),
        ...(st.reason ? { reason: st.reason } : {}),
      })),
    });
    requests.push(r);
    if (row.hiddenReview)
      reviews.push({
        id: `v-${row.ref}`,
        requestId: r.id,
        providerId: provider.id,
        authorId: customer.id,
        rating: row.hiddenReview.rating,
        text: row.hiddenReview.text,
        visibility: 'hidden',
        createdAt: at(row.hiddenReview.hoursAgo).toISOString(),
        replyText: null,
        replyCreatedAt: null,
        replyUpdatedAt: null,
      });
  }
  return { requests, reviews };
}
```
4. In `build.ts`: import `buildCustomerJourneyRequests`; after `buildReviews(...)` add
```ts
  const journey = buildCustomerJourneyRequests(now, { users, providers, services });
  const allReviews = [...reviews, ...journey.reviews];
```
Use `allReviews` instead of `reviews` in the aggregate loop and in the returned `reviews:`; add `...journey.requests` to the returned `requests` array.
5. In `src/mocks/db/schema.ts` set `MOCK_DB_VERSION = 4`.
6. In `src/mocks/handlers/auth.test.ts` line ~62, change the expected `1` to `4` (Olivia now has FX-2061, FX-2030, FX-2031, FX-2032 open).
**Test:** add to `packages/fixtures/src/build.test.ts` (inside the existing describe; it already has `world`, `byRef`, `NOW`, `today`):
```ts
  it("Olivia's journey requests cover every S15 state (M09)", () => {
    const s = (ref: string) => {
      const r = byRef(ref);
      return [r?.customerId, r?.status, r?.closedBy];
    };
    expect(s('FX-2030')).toEqual(['u-olivia', 'accepted', null]);
    expect(byRef('FX-2031')?.preferredDate).toBe(today);
    expect(s('FX-2032')).toEqual(['u-olivia', 'pending', null]);
    expect(new Date(byRef('FX-2032')?.expiresAt ?? 0).getTime() - NOW.getTime()).toBe(6 * 60_000);
    expect(s('FX-2033')).toEqual(['u-olivia', 'declined', 'provider']);
    expect(s('FX-2034')).toEqual(['u-olivia', 'declined', 'system']);
    expect(s('FX-2035')).toEqual(['u-olivia', 'cancelled', 'admin']);
    expect(byRef('FX-2035')?.events.at(-1)?.actorUserId).toBe('u-admin');
    expect(s('FX-2036')).toEqual(['u-olivia', 'expired', 'system']);
    expect(s('FX-2029')).toEqual(['u-olivia', 'completed', 'provider']);
    const hidden = world.reviews.find((v) => v.requestId === byRef('FX-2028')?.id);
    expect(hidden?.visibility).toBe('hidden');
  });
  it('Olivia has 4 open requests (under the limit of 5)', () => {
    const open = world.requests.filter(
      (r) => r.customerId === 'u-olivia' && (r.status === 'pending' || r.status === 'accepted'),
    );
    expect(open.map((r) => r.ref).sort()).toEqual(['FX-2030', 'FX-2031', 'FX-2032', 'FX-2061']);
  });
```
**Verify:** `pnpm --filter @fixit/fixtures test` green (existing invariants — aggregates equal `ratingFrom`, every review has a completed request by its author, refs unique — must still pass). Then `pnpm verify` green. If any *other* existing web test fails because of Olivia's new requests, **STOP** and write a blocker naming the test (don't edit it).
**Commit:** `git commit -m "feat(fixtures): Olivia's requests in every status for S15 (M09-T6)"`

### T7 — Mock helpers: `transitionOr409` and `myRequestList`
- [x] done
**Files:** `src/mocks/lib/requests.ts`, `src/mocks/lib/requests.test.ts`
**Context:** D-5; S14.E4 (most recently updated first), S14.E5 (20 per page); `statusesOf`, `groupOf`, `PAGE_SIZE`.
**Do:** Add to `src/mocks/lib/requests.ts` (extend the contracts import with `assertTransition, groupOf, PAGE_SIZE, statusesOf, toMachineRequest, TransitionError, type MachineActor, type MyRequestList, type RequestListQuery, type TransitionInput`):
```ts
/** D-5: refused transition → 409 INVALID_TRANSITION with details.reason and details.status (ARCH error table). */
export function transitionOr409(
  r: RequestRecord,
  to: RequestStatus,
  actor: MachineActor,
  now: Date,
  input: TransitionInput = {},
): void {
  try {
    assertTransition(toMachineRequest(r), to, actor, now, input);
  } catch (e) {
    if (e instanceof TransitionError)
      throw mockError(409, 'INVALID_TRANSITION', e.message, { details: { reason: e.reason, status: r.status } });
    throw e;
  }
}

/** GET /me/requests: own requests only, newest update first, counts per group, 20 per page. */
export function myRequestList(d: MockDb, customerId: string, q: RequestListQuery, now: Date): MyRequestList {
  const mine = Object.values(d.requests)
    .filter((r) => r.customerId === customerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.ref.localeCompare(a.ref));
  const counts = { all: mine.length, open: 0, completed: 0, closed: 0 };
  for (const r of mine) counts[groupOf(r.status)] += 1;
  const wanted = statusesOf(q.status);
  const filtered = mine.filter((r) => wanted.includes(r.status));
  const pageSize = PAGE_SIZE.myRequests;
  const start = (q.page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize).map((r) => customerViewOf(d, r, now)),
    page: q.page,
    pageSize,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize),
    counts,
  };
}
```
**Test:** add to `src/mocks/lib/requests.test.ts` (use the file's existing seeding style — if it builds a db with `seedDb(FIXED_NOW)`, do the same):
```ts
describe('myRequestList', () => {
  it("Olivia's list: newest update first, counts per group", () => {
    const d = seedDb(FIXED_NOW);
    const list = myRequestList(d, 'u-olivia', { status: 'all', page: 1 }, FIXED_NOW);
    expect(list.counts).toEqual({ all: 11, open: 4, completed: 3, closed: 4 });
    const times = list.items.map((r) => r.updatedAt);
    expect([...times].sort().reverse()).toEqual(times);
    expect(list.items.every((r) => r.ref !== 'FX-2037')).toBe(true); // Marcus's, not Olivia's
  });
  it('filters by group', () => {
    const d = seedDb(FIXED_NOW);
    const closed = myRequestList(d, 'u-olivia', { status: 'closed', page: 1 }, FIXED_NOW);
    expect(closed.items.map((r) => r.status).sort()).toEqual(['cancelled', 'declined', 'declined', 'expired']);
    expect(closed.totalPages).toBe(1);
  });
  it('a customer with no requests → empty, 0 pages', () => {
    const d = seedDb(FIXED_NOW);
    expect(myRequestList(d, 'u-nimal', { status: 'all', page: 1 }, FIXED_NOW)).toMatchObject({
      items: [],
      total: 0,
      totalPages: 0,
      counts: { all: 0, open: 0, completed: 0, closed: 0 },
    });
  });
});
```
(Olivia: open 4 = FX-2061/2030/2031/2032; completed 3 = FX-2046/2029/2028; closed 4 = FX-2033/2034/2035/2036. If the numbers differ, check fixtures before changing the expectation.)
**Verify:** `pnpm --filter @fixit/web test -- src/mocks/lib/requests.test.ts` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock request list and transition helpers (M09-T7)"`

### T8 — Mock handlers: `GET /me/requests` and `POST /me/requests/:ref/cancel`
- [x] done
**Files:** `src/mocks/handlers/requests.ts`, `src/mocks/handlers/requests-mine.test.ts`
**Context:** A12, BR-30, F-25 (sweep at the start of each handler), §6.3 privacy (contact hidden after cancel), AC6, AC8, AC9.
**Do:** Add to `requestsHandlers` (imports: `myRequestList`, `transitionOr409` from `../lib/requests`):
```ts
  mockEndpoint(E.requests_list, ({ db: d, actor, query, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    return myRequestList(d, actor.userId, query, now);
  }),

  mockEndpoint(E.requests_cancel, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const r = Object.values(d.requests).find((x) => x.ref === params.ref && x.customerId === actor.userId);
    if (!r) throw mockError(404, 'NOT_FOUND', 'Request not found'); // other owner → 404
    transitionOr409(r, 'cancelled', { kind: 'customer', userId: actor.userId }, now, { reason: body.reason });
    const at = now.toISOString();
    r.status = 'cancelled';
    r.closedBy = 'customer';
    r.reason = body.reason ?? null;
    r.updatedAt = at;
    r.events.push({ status: 'cancelled', at, actor: 'customer', actorUserId: actor.userId, reason: body.reason ?? null });
    return customerViewOf(d, r, now);
  }),
```
**Test:** `src/mocks/handlers/requests-mine.test.ts`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerRequestView, ErrorEnvelope, MyRequestList } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const call = (path: string, persona?: PersonaKey, body?: unknown) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (persona) headers.Authorization = `Bearer ${signInAs(persona).accessToken}`;
  return fetch(new URL(`/api${path}`, window.location.origin), {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
};

describe('GET /me/requests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('Olivia: own requests with counts', async () => {
    const res = await call('/me/requests?status=open', 'customer');
    const list = MyRequestList.parse(await res.json());
    expect(list.counts.open).toBe(4);
    expect(list.items.every((r) => r.status === 'pending' || r.status === 'accepted')).toBe(true);
  });
  it('Marcus as customer sees only his customer requests, not p01 incoming', async () => {
    const list = MyRequestList.parse(await (await call('/me/requests', 'provider')).json());
    expect(list.items.map((r) => r.ref)).toEqual(['FX-2037']);
  });
  it('anonymous → 401, admin → 403', async () => {
    expect((await call('/me/requests')).status).toBe(401);
    expect((await call('/me/requests', 'admin')).status).toBe(403);
  });
  it('sweeps expired pending requests first (F-25)', async () => {
    vi.setSystemTime(new Date(FIXED_NOW.getTime() + 10 * 60_000));
    const list = MyRequestList.parse(await (await call('/me/requests?status=closed', 'customer')).json());
    expect(list.items.find((r) => r.ref === 'FX-2032')?.status).toBe('expired');
  });
});

describe('POST /me/requests/:ref/cancel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('pending → cancelled by customer, with reason and event', async () => {
    const res = await call('/me/requests/FX-2061/cancel', 'customer', { reason: 'Fixed it myself.' });
    expect(res.status).toBe(200);
    const v = CustomerRequestView.parse(await res.json());
    expect([v.status, v.closedBy, v.reason, v.canCancel]).toEqual(['cancelled', 'customer', 'Fixed it myself.', false]);
    expect(v.history.at(-1)).toMatchObject({ status: 'cancelled', actor: 'customer' });
  });
  it('accepted before the cut-off → cancelled and the mobile is hidden (§6.3)', async () => {
    const v = CustomerRequestView.parse(await (await call('/me/requests/FX-2030/cancel', 'customer', {})).json());
    expect(v.status).toBe('cancelled');
    expect(v.provider.mobile).toBeNull();
  });
  it('accepted on the preferred day → 409 past_cancel_deadline (BR-30)', async () => {
    const res = await call('/me/requests/FX-2031/cancel', 'customer', {});
    expect(res.status).toBe(409);
    const err = ErrorEnvelope.parse(await res.json()).error;
    expect(err).toMatchObject({ code: 'INVALID_TRANSITION', details: { reason: 'past_cancel_deadline', status: 'accepted' } });
  });
  it('already closed → 409 final_status', async () => {
    const res = await call('/me/requests/FX-2033/cancel', 'customer', {});
    expect(res.status).toBe(409);
  });
  it("another customer's ref → 404; admin → 403; reason too long → 400", async () => {
    expect((await call('/me/requests/FX-2059/cancel', 'customer', {})).status).toBe(404);
    expect((await call('/me/requests/FX-2061/cancel', 'admin', {})).status).toBe(403);
    const res = await call('/me/requests/FX-2061/cancel', 'customer', { reason: 'x'.repeat(501) });
    expect(res.status).toBe(400);
    expect(ErrorEnvelope.parse(await res.json()).error.fieldErrors).toEqual({
      reason: ['Keep the reason under 500 characters.'],
    });
  });
});
```
(If the existing handler tests reset the mock db between tests through a helper in `src/test/setup.ts`, nothing extra is needed. If cancel in one test leaks into another, add the reset the other handler tests use.)
**Verify:** `pnpm --filter @fixit/web test -- src/mocks/handlers/requests-mine.test.ts` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock my-requests list and cancel handlers (M09-T8)"`

### T9 — Mock handler: `POST /me/requests/:ref/review` with rating recompute
- [x] done
**Files:** `src/mocks/handlers/reviews.ts`, `src/mocks/handlers/reviews.test.ts`, `src/mocks/handlers/index.ts`
**Context:** A19, BR-24–BR-27, F-29; ARCH §4 (rating recomputed with `ratingFrom()` over visible reviews, not incremented). `displayNameOf` in contracts `auth/names`.
**Do:**
1. Create `src/mocks/handlers/reviews.ts`:
```ts
import { displayNameOf, ENDPOINTS as E, ratingFrom, reviewEligibility } from '@fixit/contracts';
import type { FxReview } from '@fixit/fixtures';
import { expireDue } from '../db/expire';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';

export const reviewsHandlers = [
  mockEndpoint(E.reviews_create, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const r = Object.values(d.requests).find((x) => x.ref === params.ref && x.customerId === actor.userId);
    if (!r) throw mockError(404, 'NOT_FOUND', 'Request not found'); // other owner → 404
    const existing = Object.values(d.reviews).find((v) => v.requestId === r.id) ?? null;
    const check = reviewEligibility(r, existing, actor.userId, now);
    if (!check.ok) throw mockError(422, 'RULE_VIOLATION', check.rule, { details: { rule: check.rule } });
    const author = d.users[actor.userId];
    const provider = d.providers[r.providerId];
    if (!author || !provider) throw mockError(500, 'INTERNAL', 'Review author or provider missing');
    const review: FxReview = {
      id: `v-${r.ref}`,
      requestId: r.id,
      providerId: provider.id,
      authorId: author.id,
      rating: body.rating,
      text: body.text,
      visibility: 'visible',
      createdAt: now.toISOString(),
      replyText: null,
      replyCreatedAt: null,
      replyUpdatedAt: null,
    };
    d.reviews[review.id] = review;
    // BR-27 / F-29: recompute from visible reviews (same "transaction": one handler run, one commit)
    const agg = ratingFrom(
      Object.values(d.reviews)
        .filter((v) => v.providerId === provider.id && v.visibility === 'visible')
        .map((v) => v.rating),
    );
    provider.ratingAvg = agg.rating;
    provider.reviewCount = agg.count;
    return {
      id: review.id,
      authorDisplayName: displayNameOf(author.fullName),
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt,
      reply: null,
      requestRef: r.ref,
      serviceName: r.service.name,
      providerId: provider.id,
      visibility: review.visibility,
    };
  }),
];
```
2. In `src/mocks/handlers/index.ts`: import `reviewsHandlers` and set `reviews: reviewsHandlers`.
**Test:** `src/mocks/handlers/reviews.test.ts`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorEnvelope, ProviderProfile, ratingFrom, Review } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const post = (ref: string, body: unknown, persona?: PersonaKey) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (persona) headers.Authorization = `Bearer ${signInAs(persona).accessToken}`;
  return fetch(new URL(`/api/me/requests/${ref}/review`, window.location.origin), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
};
const ok = { rating: 1, text: 'It did not go well at all.' };

describe('POST /me/requests/:ref/review', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('posts, then the provider rating/count are recomputed with ratingFrom', async () => {
    const before = db().providers.p01;
    const res = await post('FX-2046', ok, 'customer');
    expect(res.status).toBe(200);
    const review = Review.parse(await res.json());
    expect(review).toMatchObject({ authorDisplayName: 'Olivia M.', requestRef: 'FX-2046', visibility: 'visible' });
    const ratings = Object.values(db().reviews)
      .filter((v) => v.providerId === 'p01' && v.visibility === 'visible')
      .map((v) => v.rating);
    expect(db().providers.p01?.reviewCount).toBe((before?.reviewCount ?? 0) + 1);
    expect(db().providers.p01?.ratingAvg).toBe(ratingFrom(ratings).rating);
  });
  it('second post → 422 already_reviewed', async () => {
    await post('FX-2046', ok, 'customer');
    const err = ErrorEnvelope.parse(await (await post('FX-2046', ok, 'customer')).json()).error;
    expect(err.details?.rule).toBe('already_reviewed');
  });
  it.each([
    ['FX-2029', 'review_window_closed'],
    ['FX-2030', 'review_not_eligible'],
  ] as const)('%s → 422 %s', async (ref, rule) => {
    const res = await post(ref, ok, 'customer');
    expect(res.status).toBe(422);
    expect(ErrorEnvelope.parse(await res.json()).error.details?.rule).toBe(rule);
  });
  it("other customer's ref → 404; admin → 403; empty body → 400 with SPEC messages", async () => {
    expect((await post('FX-2041', ok, 'customer')).status).toBe(404);
    expect((await post('FX-2046', ok, 'admin')).status).toBe(403);
    const res = await post('FX-2046', { text: '' }, 'customer');
    expect(ErrorEnvelope.parse(await res.json()).error.fieldErrors).toEqual({
      rating: ['Choose a star rating.'],
      text: ['Write at least 10 characters.'],
    });
  });
});
```
(Remove the unused `ProviderProfile` import if lint flags it.)
**Verify:** `pnpm --filter @fixit/web test -- src/mocks/handlers/reviews.test.ts` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock post-review handler with rating recompute (M09-T9)"`

**Checkpoint after T9:** "Human: run `pnpm dev:mock`, open the DevPanel endpoint list and check that `requests_list`, `requests_cancel` and `reviews_create` appear."

### T10 — Query key, API functions, formatters
- [x] done
**Files:** `src/lib/query-keys.ts`, `src/features/requests/api.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`
**Context:** ARCH §4.2 key shape; D-6; S16 counter `{n} / 1,000`.
**Do:**
1. `query-keys.ts`: import `RequestListQuery` type and add to `myRequests`:
```ts
    list: (q: RequestListQuery) => ['requests', 'mine', 'list', q] as const,
```
2. Append to `features/requests/api.ts` (extend the imports with `CancelBody, CreateReviewBody, MyRequestList, RequestListQuery, Review`):
```ts
export const fetchMyRequests = (q: RequestListQuery): Promise<MyRequestList> =>
  http(pathOf(E.requests_list), { query: { status: q.status, page: q.page }, schema: E.requests_list.response });

export const cancelMyRequest = (ref: string, body: CancelBody): Promise<CustomerRequestView> =>
  http(pathOf(E.requests_cancel, { ref }), { method: 'POST', body, schema: E.requests_cancel.response });

export const postReview = (ref: string, body: CreateReviewBody): Promise<Review> =>
  http(pathOf(E.reviews_create, { ref }), { method: 'POST', body, schema: E.reviews_create.response });
```
(If `http()`'s option is named differently from `query`, use the existing name — see `HttpOpts` in `lib/http.ts`. Remove unused type imports.)
3. Append to `lib/format.ts` (import `addDays` from `@fixit/contracts`):
```ts
/** D-6: the last day the customer may cancel, `Sat, 21 Nov` (the day before the preferred date). */
export const formatCancelCutoffDay = (preferredDate: string): string => formatDateShort(addDays(preferredDate, -1));

/** `1,000` */
export const formatCount = (n: number): string => grouping.format(n);
```
**Test:** add to `lib/format.test.ts`:
```ts
describe('formatCancelCutoffDay', () => {
  it('is the day before the preferred date', () => {
    expect(formatCancelCutoffDay('2026-11-22')).toBe('Sat, 21 Nov');
  });
});
describe('formatCount', () => {
  it('groups thousands', () => {
    expect(formatCount(1000)).toBe('1,000');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- src/lib/format.test.ts` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): my-requests api, query key and formatters (M09-T10)"`

### T11 — Hooks: `useMyRequests`, `useCancelRequest`, `usePostReview`
- [x] done
**Files:** `src/features/requests/hooks.ts`, `src/features/requests/hooks.test.tsx`
**Context:** A12 (contact hidden, lists/eligibility/me refresh), A19 (invalidate `catalog` so the profile rating changes), ARCH §4.2 domain-wide invalidation.
**Do:** Append to `hooks.ts` (imports: `keepPreviousData` from TanStack; `CancelBody, CreateReviewBody, RequestListQuery` types; `cancelMyRequest, fetchMyRequests, postReview`):
```ts
export const useMyRequests = (q: RequestListQuery) =>
  useQuery({ queryKey: qk.myRequests.list(q), queryFn: () => fetchMyRequests(q), placeholderData: keepPreviousData });

function refreshMe(qc: ReturnType<typeof useQueryClient>) {
  void fetchMe()
    .then((me) => {
      authStore.setMe(me);
      qc.setQueryData(qk.me, me);
    })
    .catch(() => undefined);
}

/** A12. The view returned by the server replaces the cached detail (contact hidden, history updated). */
export function useCancelRequest(ref: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CancelBody) => cancelMyRequest(ref, body),
    onSuccess: (view) => {
      qc.setQueryData(qk.myRequests.detail(ref), view);
      void qc.invalidateQueries({ queryKey: [...qk.myRequests.all, 'list'] });
      void qc.invalidateQueries({ queryKey: qk.eligibility(view.provider.id) });
      refreshMe(qc); // openRequestCount
    },
  });
}

/** A19. Detail + lists refetch (review block, Leave a review button); catalog refetches (rating/count). */
export function usePostReview(ref: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReviewBody) => postReview(ref, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.myRequests.all });
      void qc.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
}
```
Also refactor `useCreateRequest`'s inline `fetchMe()` block to call `refreshMe(qc)` (same behaviour).
**Test:** add to `hooks.test.tsx` (follow the file's existing wrapper/QueryClient setup and fake-timer pattern):
```ts
describe('useCancelRequest', () => {
  it('replaces the cached detail with the cancelled view', async () => {
    signInAs('customer');
    const { result, queryClient } = renderHookWithClient(() => useCancelRequest('FX-2030'));
    result.current.mutate({ reason: undefined });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const view = queryClient.getQueryData<CustomerRequestView>(qk.myRequests.detail('FX-2030'));
    expect(view?.status).toBe('cancelled');
    expect(view?.provider.mobile).toBeNull();
  });
});
describe('usePostReview', () => {
  it('invalidates catalog queries', async () => {
    signInAs('customer');
    const { result, queryClient } = renderHookWithClient(() => usePostReview('FX-2046'));
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    result.current.mutate({ rating: 5, text: 'Great work, thank you!' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['catalog'] });
  });
});
```
`renderHookWithClient` = whatever helper the existing `hooks.test.tsx` uses to render a hook with a fresh `QueryClient`; if it doesn't return the client, create the client in the test and pass it to the wrapper.
**Verify:** `pnpm --filter @fixit/web test -- src/features/requests/hooks.test.tsx` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): my-requests, cancel and post-review hooks (M09-T11)"`

### T12 — S14 URL state helper
- [x] done
**Files:** `src/features/requests/list-search.ts`, `src/features/requests/list-search.test.ts`
**Context:** S14.E2 (`?status=`, page resets), S14.E5 (`?page=`); `RequestListQuery`.
**Do:**
```ts
import { RequestListQuery, type RequestStatusGroup } from '@fixit/contracts';

export const parseListSearch = (sp: URLSearchParams): RequestListQuery =>
  RequestListQuery.parse(Object.fromEntries(sp));

/** Defaults are left out of the URL: `/requests`, `/requests?status=open`, `/requests?status=open&page=2`. */
export function listHref(status: RequestStatusGroup, page = 1): string {
  const sp = new URLSearchParams();
  if (status !== 'all') sp.set('status', status);
  if (page > 1) sp.set('page', String(page));
  const s = sp.toString();
  return s ? `/requests?${s}` : '/requests';
}
```
**Test:**
```ts
import { describe, expect, it } from 'vitest';
import { listHref, parseListSearch } from './list-search';

describe('list-search', () => {
  it('parses with defaults', () => {
    expect(parseListSearch(new URLSearchParams('status=bogus'))).toEqual({ status: 'all', page: 1 });
  });
  it('round-trips', () => {
    expect(parseListSearch(new URLSearchParams(listHref('closed', 2).split('?')[1]))).toEqual({
      status: 'closed',
      page: 2,
    });
  });
  it('omits defaults (a tab link resets the page)', () => {
    expect(listHref('all')).toBe('/requests');
    expect(listHref('open')).toBe('/requests?status=open');
  });
});
```
**Verify:** test green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): my-requests URL state (M09-T12)"`

### T13 — S15 status panel copy
- [x] done
**Files:** `src/features/requests/status-panel.ts`, `src/features/requests/status-panel.test.ts`, `src/components/status-pill.tsx`
**Context:** SPEC S15 status panel table; D-6; BR-12; the UI never evaluates rules (uses `canCancel`).
**Do:**
1. In `status-pill.tsx`, export the dot classes and labels for reuse (no behaviour change):
```ts
export const REQUEST_DOT: Record<RequestStatus, string> = {
  pending: 'bg-warning',
  accepted: 'bg-primary',
  completed: 'bg-success',
  declined: 'bg-danger',
  cancelled: 'bg-icon-subtle',
  expired: 'bg-border-control',
};
export const REQUEST_LABEL: Record<RequestStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  expired: 'Expired',
};
```
(Build the existing private `REQUEST` map from `REQUEST_LABEL` if that's simple; otherwise leave it.)
2. Create `status-panel.ts`:
```ts
import type { CustomerRequestView, RequestStatus } from '@fixit/contracts';
import { formatCancelCutoffDay, formatDateLong, formatDeadline, formatLkr } from '@/lib/format';

export const PANEL_BORDER: Record<RequestStatus, string> = {
  pending: 'border-t-warning',
  accepted: 'border-t-primary',
  completed: 'border-t-success',
  declined: 'border-t-danger',
  cancelled: 'border-t-icon-subtle',
  expired: 'border-t-border-control',
};

export interface PanelCopy {
  title: string;
  /** Body lines, 15 muted, in order. */
  lines: string[];
  /** Agreed price line + subtle note (BR-12), Accepted/Completed only. */
  agreedPrice: string | null;
  showContact: boolean;
  showCancel: boolean;
  showReview: boolean;
  /** `Find another provider` target, closed statuses only. */
  findAnotherHref: string | null;
}

const PROVIDER_UNAVAILABLE = 'Reason: Provider unavailable';

export function statusPanel(v: CustomerRequestView): PanelCopy {
  const b = v.provider.businessName;
  const findAnother = `/discover?cat=${encodeURIComponent(v.provider.categoryId)}&loc=${encodeURIComponent(v.town.id)}`;
  const price = v.agreedPrice === null ? null : `Agreed price: ${formatLkr(v.agreedPrice)}`;
  const reasonLine = v.reason ? [`Reason: ${v.reason}`] : [];
  const base = { agreedPrice: null, showContact: false, showCancel: false, showReview: false, findAnotherHref: null };
  switch (v.status) {
    case 'pending':
      return {
        ...base,
        title: `Waiting for ${b} to reply`,
        lines: [`They have until ${formatDeadline(v.expiresAt)} to accept or decline. We'll email you either way.`],
        showCancel: v.canCancel,
      };
    case 'accepted':
      return {
        ...base,
        title: `${b} accepted your request`,
        lines: [
          v.canCancel
            ? `You can cancel until 11:59 PM on ${formatCancelCutoffDay(v.preferredDate)}.`
            : `It's too late to cancel online. Contact ${b} directly.`,
        ],
        agreedPrice: price,
        showContact: true,
        showCancel: v.canCancel,
      };
    case 'completed':
      return {
        ...base,
        title: `Job completed on ${formatDateLong(v.completedAt ?? v.updatedAt)}`,
        lines: [],
        agreedPrice: price,
        showContact: true,
        showReview: true,
      };
    case 'declined':
      return {
        ...base,
        title: `${b} declined this request`,
        lines: v.closedBy === 'system' ? [PROVIDER_UNAVAILABLE] : reasonLine,
        findAnotherHref: findAnother,
      };
    case 'cancelled':
      if (v.closedBy === 'admin')
        return { ...base, title: 'Fixit cancelled this request', lines: reasonLine, findAnotherHref: findAnother };
      if (v.closedBy === 'system')
        return { ...base, title: 'This request was cancelled', lines: [PROVIDER_UNAVAILABLE], findAnotherHref: findAnother };
      return { ...base, title: 'You cancelled this request', lines: reasonLine, findAnotherHref: findAnother };
    case 'expired':
      return { ...base, title: 'This request expired', lines: [`${b} didn't reply in time.`], findAnotherHref: findAnother };
  }
}
```
Note: S15.E4 says the contact block shows for Accepted **and** Completed (§6.3); the S15 Completed row doesn't list it, but E4 does, so `showContact` is true for both.
**Test:** `status-panel.test.ts` — build views from the mock db so the fixtures drive them:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seedDb } from '@/mocks/db/seed';
import { customerViewOf } from '@/mocks/lib/requests';
import { FIXED_NOW } from '@/test/fixed-now';
import { statusPanel } from './status-panel';

const view = (ref: string) => {
  const d = seedDb(FIXED_NOW);
  const r = Object.values(d.requests).find((x) => x.ref === ref);
  if (!r) throw new Error(ref);
  return customerViewOf(d, r, FIXED_NOW);
};

describe('statusPanel (S15)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('pending', () => {
    const p = statusPanel(view('FX-2061'));
    expect(p.title).toBe('Waiting for Bell & Sons Plumbing to reply');
    expect(p.lines[0]).toMatch(/^They have until .+ to accept or decline\. We'll email you either way\.$/);
    expect([p.showCancel, p.showContact]).toEqual([true, false]);
  });
  it('accepted before the cut-off', () => {
    const p = statusPanel(view('FX-2030'));
    expect(p.title).toBe('Fresh Nest Cleaning accepted your request');
    expect(p.lines).toEqual(['You can cancel until 11:59 PM on Thu, 26 Nov.']);
    expect(p.agreedPrice).toMatch(/^Agreed price: LKR /);
    expect([p.showCancel, p.showContact]).toEqual([true, true]);
  });
  it('accepted today → too late', () => {
    const p = statusPanel(view('FX-2031'));
    expect(p.lines).toEqual(["It's too late to cancel online. Contact GreenLeaf Gardens directly."]);
    expect(p.showCancel).toBe(false);
  });
  it.each([
    ['FX-2033', 'Oak & Iron Carpentry declined this request', ['Reason: Fully booked that week.']],
    ['FX-2034', 'ApplianceDoc declined this request', ['Reason: Provider unavailable']],
    ['FX-2035', 'Fixit cancelled this request', ['Reason: The provider reported a family emergency.']],
    ['FX-2036', 'This request expired', ["Fresh Nest Cleaning didn't reply in time."]],
  ])('%s', (ref, title, lines) => {
    const v = view(ref);
    const p = statusPanel(v);
    expect([p.title, p.lines]).toEqual([title, lines]);
    expect(p.findAnotherHref).toBe(`/discover?cat=${v.provider.categoryId}&loc=${v.town.id}`);
  });
  it('completed', () => {
    const p = statusPanel(view('FX-2046'));
    expect(p.title).toMatch(/^Job completed on /);
    expect(p.showReview).toBe(true);
  });
});
```
(The cut-off date for FX-2030 is FIXED_NOW + 5 days − 1 day = Thu, 26 Nov. If a business name differs from the fixture, use the fixture's name — don't change fixtures.)
**Verify:** test green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S15 status panel copy per status (M09-T13)"`

### T14 — S15 history actor wording
- [x] done
**Files:** `src/features/requests/history.ts`, `src/features/requests/history.test.ts`
**Context:** S15.E7: `by you` / `by {Business}` / `by Fixit` / `automatically`.
**Do:**
```ts
import type { RequestActor } from '@fixit/contracts';

export function actorLabel(actor: RequestActor, businessName: string): string {
  switch (actor) {
    case 'customer':
      return 'by you';
    case 'provider':
      return `by ${businessName}`;
    case 'admin':
      return 'by Fixit';
    case 'system':
      return 'automatically';
  }
}
```
**Test:**
```ts
import { describe, expect, it } from 'vitest';
import { actorLabel } from './history';

describe('actorLabel (S15.E7)', () => {
  it.each([
    ['customer', 'by you'],
    ['provider', 'by Bell & Sons'],
    ['admin', 'by Fixit'],
    ['system', 'automatically'],
  ] as const)('%s', (actor, label) => {
    expect(actorLabel(actor, 'Bell & Sons')).toBe(label);
  });
});
```
**Verify:** test green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S15 history actor wording (M09-T14)"`

### T15 — `MyRequestsList` (S14 table / phone cards)
- [x] done
**Files:** `src/features/requests/components/my-requests-list.tsx`
**Context:** S14 desktop + phone layouts, S14.E3; D-7; §6.9; `DataList`, `StatusPill`, `Button`, `CategoryIcon`, `formatDateShort`, `SLOT_LABEL`; lucide `Phone`, `CalendarDays`, `MapPin`.
**Do:** Create the component:
```tsx
interface Props { rows: readonly CustomerRequestView[]; loading: boolean; empty: ReactNode }
export function MyRequestsList({ rows, loading, empty }: Props) {
  const isTable = useMediaQuery(MQ.sm);
  const columns = isTable ? tableColumns : cardColumns;
  return (
    <DataList
      rows={rows}
      columns={columns}
      getRowKey={(r) => r.ref}
      caption="My requests"
      rowHref={(r) => `/requests/${r.ref}`}
      rowLabel={(r) => `${r.ref}, ${r.provider.businessName}, ${r.service.name}`}
      loading={loading}
      empty={empty}
    />
  );
}
```
Shared pieces:
- `reviewButton(r)`: when `r.review?.eligible` → `<Button asChild variant="outline" size="sm"><Link to={`/requests/${r.ref}/review`}>Leave a review</Link></Button>` (use the existing small size name in `button.tsx`; on phone DataList makes actions 44 high and full width).
- `contactLine(r)`: when `r.status === 'accepted'` → `<span className="text-meta text-text-muted flex items-center gap-1"><Phone aria-hidden className="size-3.5" />Contact details shown</span>`.

`tableColumns` (≥ 641; widths from SPEC `1.4fr 1.3fr 1fr .9fr 240px` as `className` on each column: `w-[26%]`, `w-[24%]`, `w-[18%]`, `w-[16%]`, `w-[240px]`):
1. `provider` (card `'title'`, header `Provider`): `flex items-center gap-3` → photo 36 `size-9 rounded-[10px] object-cover` (or `CategoryIcon` in a `bg-primary-soft text-primary size-9 rounded-[10px] grid place-items-center` tile when `photoUrl` is null) + column: `text-body-sm text-text font-bold` businessName, `font-mono text-mono text-text-subtle` ref.
2. `service` (`'meta'`, `Service`): `text-label text-text font-semibold` service name.
3. `date` (`'meta'`, `Date`): `text-label text-text` `formatDateShort(preferredDate)`, under it `text-meta text-text-subtle` `SLOT_LABEL[slot]`.
4. `town` (`'meta'`, `Town`): `text-label text-text-muted` town name.
5. `status` (`'actions'`, `Status`): `flex flex-col items-start gap-1.5` → `<StatusPill kind="request" status={r.status} />`, `contactLine(r)`, `reviewButton(r)`.

`cardColumns` (< 641, SPEC phone rows 1–5):
1. `provider` (`'title'`): `text-body-sm font-bold` businessName.
2. `status` (`'status'`): `<StatusPill kind="request" status={r.status} compact />`.
3. `ref` (`'meta'`): `<span className="font-mono text-mono text-text-subtle">{r.ref}</span>`.
4. `service` (`'meta'`): `<span className="text-label text-text font-semibold">{r.service.name}</span>`.
5. `when` (`'meta'`): `flex flex-wrap items-center gap-x-1.5` → `CalendarDays` (size-3.5, aria-hidden) `formatDateShort` · `SLOT_LABEL` · `MapPin` town.
6. `contact` (`'meta'`): `contactLine(r)` (renders nothing unless accepted).
7. `action` (`'actions'`, header `Action`): `reviewButton(r)` (nothing unless eligible). If `DataList` renders an empty actions row when the cell is `null`, guard so the column cell returns `null` and check DataList hides the row; if it doesn't, **STOP** and write a blocker rather than forking DataList.

States: loading → DataList skeletons (table rows ×5 / phone cards ×5, `aria-busy`); empty → the `empty` prop; rows → as above. No horizontal scroll at 390: every text cell uses `min-w-0` + `truncate` on the business name.
**Verify:** `pnpm verify` green (behaviour is tested in T19).
**Commit:** `git commit -m "feat(web): my-requests table and phone cards (M09-T15)"`

### T16 — `MyRequestsPage` (S14) and route wiring
- [x] done
**Files:** `src/features/requests/pages/my-requests-page.tsx`, `src/app/chunks/customer.tsx`
**Context:** S14 layout, E1–E7; L2 header (`CustomerPageHeader`); `SegmentedTabLinks` (S20 pattern), `Pagination`, `EmptyState` (`Inbox`), `SectionError`; `parseListSearch`, `listHref`.
**Do:**
1. Page:
```tsx
export function MyRequestsPage() {
  const [sp] = useSearchParams();
  const q = parseListSearch(sp);
  const list = useMyRequests(q);
  const counts = list.data?.counts;
  const tabs: SegmentedTabItem[] = (['all', 'open', 'completed', 'closed'] as const).map((g) => ({
    value: g,
    label: TAB_LABEL[g], // All · Open · Completed · Closed
    ...(counts ? { count: counts[g] } : {}),
    to: listHref(g),
  }));
  // …render (below)
}
```
2. Render:
   - `<CustomerPageHeader title="My requests" subtitle="Track the requests you've sent." tabs />`.
   - If `list.isError` → `<SectionError onRetry={() => void list.refetch()} />` in place of the card (the header and section tabs stay).
   - Else if `counts?.all === 0` → `<EmptyState icon={Inbox} title="No requests yet" body="Find a provider and send your first request." action={{ label: 'Find providers', to: '/discover' }} />` (no card, no status tabs).
   - Else the card: `<section className="border-border bg-surface overflow-hidden rounded-2xl border">` with a header row `flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5`: SPEC gives no H2 text, so render `<h2 className="text-title-md text-text">{TAB_LABEL[q.status]}</h2>` (the active tab name, e.g. `All`), then `<SegmentedTabLinks label="Filter by status" items={tabs} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" />` (phone: scrolls sideways; each tab ≥ 44 high comes from the component; if it doesn't, add `min-h-11 sm:min-h-0` via its `className` API, never by editing ui/).
   - Below the header, on phone add `p-4 sm:p-0` around `<MyRequestsList rows={list.data?.items ?? []} loading={list.isPending} empty={<p className="text-body-sm text-text-subtle px-4 py-10 text-center">No requests with this status.</p>} />`.
   - `<Pagination page={q.page} totalPages={list.data?.totalPages ?? 0} hrefFor={(p) => listHref(q.status, p)} className="p-4 sm:px-6" />` — the component hides itself for ≤ 1 page (check; if not, render it only when `totalPages > 1`).
   - Before data arrives the tabs render without counts.
3. Page reset: tab links come from `listHref(g)` (page 1). Nothing else.
4. In `src/app/chunks/customer.tsx`: delete the placeholder `MyRequestsPage` function and add `export { MyRequestsPage } from '@/features/requests/pages/my-requests-page';`.
**Verify:** `pnpm verify` green. Manual: `pnpm dev:mock`, Olivia, `/requests` at 1440 and 390.
**Commit:** `git commit -m "feat(web): My requests page S14 (M09-T16)"`

**Checkpoint after T16:** "Human: run `pnpm dev:mock`, sign in as Olivia, open `/requests` at 1440 and 390. INFERRED screen (no prototype image): compare with SPEC S14 and the S20 table pattern in `reference/screens/` (provider overview). Check tabs scroll at 390 and there is no horizontal page scroll."

### T17 — S15 building blocks: contact block, details card, history, provider aside
- [ ] done
**Files:** `src/features/requests/components/contact-block.tsx`, `request-details-card.tsx`, `request-history.tsx`, `provider-aside-card.tsx` (all under `src/features/requests/components/`)
**Context:** S15.E3, E4, E5, E7; D-8; `formatPhone`, `formatDateLong`, `formatDateTime`, `SLOT_LABEL`, `formatServicePrice`, `REQUEST_DOT`, `REQUEST_LABEL`, `actorLabel`, `VerifiedBadge`, `Stars`, `notify`, `notifyError`.
**Do:**
1. `ContactBlock({ businessName, mobile }: { businessName: string; mobile: string })`:
   - `rounded-xl bg-page p-4 flex flex-col gap-3`; label `text-meta text-text-muted` `{businessName}'s mobile`; value `text-lead text-text font-bold` `formatPhone(mobile)`.
   - Buttons `flex flex-col gap-2 sm:flex-row`: `<Button asChild variant="primary" size="md" className="w-full sm:w-auto"><a href={`tel:${mobile}`}><Phone aria-hidden className="size-4" />Call</a></Button>` and `<Button variant="secondary" size="md" className="w-full sm:w-auto" onClick={copy}>Copy</Button>`.
   - `copy = () => navigator.clipboard.writeText(formatPhone(mobile)).then(() => notify('Number copied.'), () => notifyError("Couldn't copy. Try again."))`.
2. `RequestDetailsCard({ view })`: card `border-border bg-surface rounded-2xl border p-5 sm:p-6 flex flex-col gap-4`; H2 `text-title-md` `Request details`; `<dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-x-4">`; rows (dt `text-label text-text-muted`, dd `text-body text-text break-words`): `Service` → `{service.name} · {formatServicePrice(service.price, service.unit)}`; `Preferred date` → `formatDateLong(preferredDate)`; `Time slot` → `SLOT_LABEL[slot]`; `Town` → `town.name`; `Address` → line1 and, if present, line2 on its own line; `Description` → `whitespace-pre-line`; `Your mobile` → `formatPhone(customerMobile)`.
3. `RequestHistory({ history, businessName })`: card as above; H2 `History`; `<ol className="relative flex flex-col gap-4 pl-5 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-px before:bg-border">`; each `<li className="relative">` with dot `<span aria-hidden className={cn('absolute -left-5 top-1.5 size-2 rounded-full', REQUEST_DOT[e.status])} />`, then `text-label text-text font-semibold` `REQUEST_LABEL[e.status]`, then `text-meta text-text-subtle` `{formatDateTime(e.at)} · {actorLabel(e.actor, businessName)}`. Oldest first (the order the view gives).
4. `ProviderAsideCard({ provider })`: card `p-5 flex flex-col gap-4 lg:sticky lg:top-24`; row: photo 56 `size-14 rounded-xl object-cover` (or category icon tile) + name `text-title-sm` + `VerifiedBadge` when `verified` + `<Stars rating={provider.rating} count={provider.reviewCount} />`. If `provider.listed`: `<Button asChild variant="secondary" size="md" className="w-full"><Link to={`/providers/${provider.id}`}>View profile</Link></Button>`. If not listed: name without link and `text-meta text-text-subtle` `No longer on Fixit`, no button.
**Verify:** `pnpm verify` green (behaviour tested in T21).
**Commit:** `git commit -m "feat(web): S15 contact, details, history and provider cards (M09-T17)"`

### T18 — Cancel dialog and conflict dialog
- [ ] done
**Files:** `src/features/requests/components/cancel-request-dialog.tsx`, `src/features/requests/components/conflict-dialog.tsx`
**Context:** §8.3 cancel dialog copy, A12, §6.10 (bottom sheet on phone, buttons stack, primary/danger first), §6.3 conflict + form-submit failure, D-5; `ResponsiveDialog`, `FormField`, `Textarea`, `SubmitButton`, `FormErrorBanner`, `FORM_COPY.saveFailed`, `mapApiErrorToForm`, `CancelBody` via `zodResolver`.
**Do:**
1. `CancelRequestDialog({ view, open, onOpenChange, onConflict })`:
   - `const cancel = useCancelRequest(view.ref)`; RHF `useForm<z.input<typeof CancelBody>>({ resolver: zodResolver(CancelBody), defaultValues: { reason: '' } })`.
   - `ResponsiveDialog` title `Cancel this request?`, description `{Business} will be emailed that you cancelled.`, `dismissible={!cancel.isPending}`.
   - Field: `FormField label="Reason" optional` + `Textarea rows={3} maxLength={600}` (`text-body` so phone input text ≥ 16px). Error message from the schema: `Keep the reason under 500 characters.`
   - Footer (DOM order = phone order, danger first; desktop reverses with `sm:flex-row-reverse` on the footer wrapper if `ResponsiveDialog` doesn't already right-align secondary-then-danger): `<SubmitButton variant="danger" pending={cancel.isPending} pendingLabel="Cancelling…">Cancel request</SubmitButton>` and `<Button variant="secondary" onClick={() => onOpenChange(false)} disabled={cancel.isPending}>Keep request</Button>`. Both `w-full sm:w-auto`.
   - Submit: `cancel.mutate(values, { onSuccess: () => { onOpenChange(false); notify('Request cancelled.'); }, onError: (e) => { if (e instanceof ApiError && e.status === 409) { onOpenChange(false); onConflict(e.envelope?.details?.reason ?? null); return; } if (!mapApiErrorToForm(e, form.setError)) setBanner(true); } })`.
   - Banner: when `banner` → `<FormErrorBanner>{FORM_COPY.saveFailed}</FormErrorBanner>` above the field. Reset banner and form on close.
   - (If `mapApiErrorToForm`'s signature differs, follow its existing callers in `request-form.tsx`.)
2. `ConflictDialog({ open, onOpenChange, body })`: `ResponsiveDialog` `align="center"`, title `This request has changed`, description `body`, footer `<Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">OK</Button>`.
   - The page (T21) computes `body`: reason `past_cancel_deadline` → `It's too late to cancel online. Contact {Business} directly.`; otherwise `It's now {REQUEST_LABEL[refetched.status]}, so this action isn't available.`
**Verify:** `pnpm verify` green (tested in T22).
**Commit:** `git commit -m "feat(web): cancel and conflict dialogs (M09-T18)"`

### T19 — S14 behaviour tests
- [ ] done
**Files:** `src/features/requests/pages/my-requests-page.test.tsx`
**Context:** AC1–AC3; `renderRoute`, `signInAs`, `armForcedError` (`@/mocks/lib/controls`), `setViewport`/media-query mocking — use whatever the existing page tests use for 390 vs 1440 (search `matchMedia` in `src/test/`).
**Do / Test:** write these cases (fake timers per conventions):
1. `Olivia at 1440: H1, tabs with counts, five column headers, newest update first` — `renderRoute('/requests')`; heading level 1 `My requests`; links `All 11`, `Open 4`, `Completed 3`, `Closed 4` (match by accessible name containing label and count, e.g. `getByRole('link', { name: /Open\s*4/ })`); column headers `Provider`, `Service`, `Date`, `Town`, `Status`; first data row contains `FX-2061` (created 2 h ago, the most recent update).
2. `Accepted rows say Contact details shown; the eligible completed row has Leave a review → /requests/FX-2046/review`; FX-2029 (window closed) row has no `Leave a review` (exactly one such link).
3. `Tab sets ?status= and resets the page` — `renderRoute('/requests?status=all&page=2')`, click link `Closed`, expect location `/requests?status=closed` (use the helper's router/location accessor) and 4 rows.
4. `390: each request is one card link; tabs region scrolls` — set phone viewport; expect a `list` named `My requests` with 11 `listitem`s; each has a link whose name starts with its ref; the compact pill is present.
5. `Nimal (no requests) → No requests yet + Find providers → /discover`.
6. `Empty tab → No requests with this status.` — sign in as `provider` (Marcus: only FX-2037, closed), open `/requests?status=open`.
7. `Forced 500 → section error with Try again, retry recovers` — `armForcedError('requests_list', '500')` before render; expect `We couldn't load this.`; click `Try again`; rows appear.
8. `Marcus sees only his own customer request` — rows = `FX-2037` only.
**Verify:** `pnpm --filter @fixit/web test -- my-requests-page` green; `pnpm verify` green.
**Commit:** `git commit -m "test(web): My requests behaviour (M09-T19)"`

### T20 — `ReviewBlock` (S15.E6) and `StatusPanelCard` (S15.E2)
- [ ] done
**Files:** `src/features/requests/components/review-block.tsx`, `src/features/requests/components/status-panel-card.tsx`
**Context:** S15 status panel (4px top border in the status dot colour, title `title-md`, body 15 muted, actions; phone actions full width), S15.E6; `statusPanel`, `PANEL_BORDER`, `ContactBlock`, `Stars`, `StatusPill kind="review"`.
**Do:**
1. `ReviewBlock({ view })` (only rendered when `view.review` is non-null):
   - `own` set → H3 `text-title-sm` `Your review`; `<Stars rating={own.rating} count={1} showValue={false} />`; `text-body-sm text-text whitespace-pre-line` text; `<StatusPill kind="review" visibility={own.visibility} />` (renders only when hidden → `Hidden`).
   - else `eligible` → H3 `How did it go?`; `text-body-sm text-text-muted` `You can review until {formatDateLong(review.deadline)}.`; `<Button asChild size="lg" className="w-full sm:w-auto"><Link to={`/requests/${ref}/review`}>Leave a review</Link></Button>`.
   - else → `text-body-sm text-text-muted` `The review window for this job has closed.`
   - Wrapper: `border-border mt-2 flex flex-col gap-3 border-t pt-4`.
2. `StatusPanelCard({ view, onCancel })`:
```tsx
const p = statusPanel(view);
return (
  <section aria-labelledby="status-title" className={cn('border-border bg-surface flex flex-col gap-4 rounded-2xl border border-t-4 p-5 sm:p-6', PANEL_BORDER[view.status])}>
    <h2 id="status-title" className="text-title-md text-text">{p.title}</h2>
    {p.showContact && view.provider.mobile && <ContactBlock businessName={view.provider.businessName} mobile={view.provider.mobile} />}
    {p.agreedPrice && (
      <p className="flex flex-col">
        <span className="text-body-sm text-text font-semibold">{p.agreedPrice}</span>
        <span className="text-meta text-text-subtle">For your records — you pay the provider directly.</span>
      </p>
    )}
    {p.lines.map((l) => <p key={l} className="text-body-sm text-text-muted">{l}</p>)}
    {(p.showCancel || p.findAnotherHref) && (
      <div className="flex flex-col gap-2 sm:flex-row">
        {p.showCancel && <Button variant="danger-outline" size="md" className="w-full sm:w-auto" onClick={onCancel}>Cancel request</Button>}
        {p.findAnotherHref && <Button asChild size="md" className="w-full sm:w-auto"><Link to={p.findAnotherHref}>Find another provider</Link></Button>}
      </div>
    )}
    {p.showReview && view.review && <ReviewBlock view={view} />}
  </section>
);
```
(Order inside the Accepted panel follows the SPEC cell: contact block, agreed price, cut-off sentence, then the action.)
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S15 status panel and review block (M09-T20)"`

### T21 — `CustomerRequestPage` (S15) and route wiring
- [ ] done
**Files:** `src/features/requests/pages/customer-request-page.tsx`, `src/app/chunks/customer.tsx`, `src/features/requests/pages/request-sent-page.test.tsx`
**Context:** S15 desktop/phone layouts; §6.4 (other owner → S39 request variant); §6.1 skeletons (`SkeletonSectionCard`); D-5; `useMyRequest`, `NotFoundPage variant="request"`, `BackLink`.
**Do:**
1. Page:
```tsx
export function CustomerRequestPage() {
  const { ref = '' } = useParams();
  const q = useMyRequest(ref);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFoundPage variant="request" />;
    throw q.error; // S41
  }
  const v = q.data;
  const onConflict = (reason: string | null) => {
    void q.refetch().then((res) => {
      const now = res.data ?? v;
      if (!now) return;
      setConflict(
        reason === 'past_cancel_deadline'
          ? `It's too late to cancel online. Contact ${now.provider.businessName} directly.`
          : `It's now ${REQUEST_LABEL[now.status]}, so this action isn't available.`,
      );
    });
  };
  // render below
}
```
2. Render:
   - `<BackLink to="/requests">Back to my requests</BackLink>`.
   - `<LoadingRegion loading={!v} skeleton={<DetailSkeleton />}>` where `DetailSkeleton` = header line blocks + `lg:grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6` with `SkeletonSectionCard` ×3 left and ×1 right.
   - Header: `<header className="flex flex-col gap-2">` H1 `text-title-lg text-text` service name; `flex flex-wrap items-center gap-x-3 gap-y-1` → `font-mono text-mono text-text-subtle` ref, `<StatusPill kind="request" status={v.status} />`, `text-body-sm text-text-muted` `with ` + (listed ? `<Link className="text-primary font-semibold" to={`/providers/${id}`}>{business}</Link>` : business).
   - Body: `<div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">`. Main column `flex min-w-0 flex-col gap-6`: `StatusPanelCard` (onCancel → `setCancelOpen(true)`), then on phone only the provider card (`<div className="lg:hidden"><ProviderAsideCard … /></div>`), `RequestDetailsCard`, `RequestHistory`. Aside `hidden lg:block` → `ProviderAsideCard` (sticky top-24). Phone order = SPEC: back link, header, status panel, provider card, details, history.
   - `<CancelRequestDialog view={v} open={cancelOpen} onOpenChange={setCancelOpen} onConflict={onConflict} />` and `<ConflictDialog open={conflict !== null} onOpenChange={(o) => { if (!o) setConflict(null); }} body={conflict ?? ''} />`.
3. `customer.tsx`: remove the placeholder `CustomerRequestPage` and export the real one. Remove now-unused imports (`PlaceholderScreen`, `BackLink` only if `LeaveReviewPage` placeholder no longer uses them — it still does until T25).
4. `request-sent-page.test.tsx`, case `no longer pending → S15`: replace `findByText('Request detail')` with `findByRole('heading', { level: 1, name: <FX-2046's service name> })`. Get the name from p01's service index 0 in `packages/fixtures/src/providers.ts`. This is the only allowed edit to that file.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): customer request detail page S15 (M09-T21)"`

**Checkpoint after T21:** "Human: `pnpm dev:mock`, Olivia, open FX-2061, FX-2030, FX-2031, FX-2033, FX-2034, FX-2035, FX-2036, FX-2046, FX-2029, FX-2028 at 1440 and 390. Compare each status panel with the SPEC S15 table. Cancel FX-2061 at 390 — the dialog is a bottom sheet."

### T22 — S15 behaviour tests
- [ ] done
**Files:** `src/features/requests/pages/customer-request-page.test.tsx`
**Context:** AC4–AC6, AC8; fake timers per conventions.
**Do / Test:** cases:
1. `pending: panel, cancel with reason → toast, panel and history update, no phone` — `/requests/FX-2061`; heading `Waiting for Bell & Sons Plumbing to reply`; body contains `They have until`; click `Cancel request`; dialog `Cancel this request?` with `Bell & Sons Plumbing will be emailed that you cancelled.`; type reason `Fixed it myself.`; click dialog button `Cancel request`; expect status text `Request cancelled.`; heading `You cancelled this request`; `Reason: Fixed it myself.`; history has `Cancelled` and text matching `· by you`; no `tel:` link on the page.
2. `cancel reason too long → field error, no request sent` — 501 chars → `Keep the reason under 500 characters.`
3. `accepted: mobile, Call tel:, Copy toast, price, cut-off` — `/requests/FX-2030`; heading `Fresh Nest Cleaning accepted your request`; link `Call` has `href` starting `tel:+94`; text matching `/^\+94 7\d \d{3} \d{4}$/`; mock `navigator.clipboard.writeText` (`vi.spyOn` / `Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })`), click `Copy` → `Number copied.`; text starting `Agreed price: LKR`; `You can cancel until 11:59 PM on Thu, 26 Nov.`; button `Cancel request` present.
4. `accepted today: no cancel, too-late copy` — `/requests/FX-2031`; `It's too late to cancel online. Contact GreenLeaf Gardens directly.`; no `Cancel request` button.
5. `cut-off passes while open → 409 → conflict dialog` — render FX-2030, then `vi.setSystemTime` to 00:00 Colombo on its preferred date (`colomboStartOfDay(view.preferredDate)`), click `Cancel request` → confirm → dialog `This request has changed` with `It's too late to cancel online. Contact Fresh Nest Cleaning directly.`; click `OK`; the panel now shows the too-late line and no cancel button.
6. `closed states show their panel and Find another provider → /discover?cat=…&loc=…` — `it.each` over FX-2033, FX-2034, FX-2035, FX-2036 with the titles/lines from T13; link `Find another provider` href starts `/discover?cat=`.
7. `pending past expiresAt shows Expired after reload (mock sweep)` — `vi.setSystemTime(FIXED_NOW + 10 min)`, render `/requests/FX-2032` → `This request expired`, history shows `Expired` with `automatically`.
8. `admin cancel history says by Fixit` — FX-2035 history contains `by Fixit`.
9. `another customer's ref → S39 request`, `admin → S40` — FX-2059 as Olivia → heading `We can't find that request`; as admin → heading `You don't have access to this page`.
10. `completed eligible → How did it go? + deadline + Leave a review → /requests/FX-2046/review`; `FX-2029 → The review window for this job has closed.`; `FX-2028 → Your review + Hidden`.
11. `forced 500 → S41` — `armForcedError('requests_get', '500')` → heading `Something went wrong`.
**Verify:** `pnpm --filter @fixit/web test -- customer-request-page` green; `pnpm verify` green.
**Commit:** `git commit -m "test(web): request detail behaviour (M09-T22)"`

### T23 — `StarRatingInput`
- [ ] done
**Files:** `src/features/requests/components/star-rating-input.tsx`
**Context:** S16 rating field: 5-star radio group, each 44×44, hover/focus preview + label `Poor` … `Excellent`; `RATING_LABELS`; lucide `Star` with `fill="currentColor"` when on; visible focus ring; no hover-only affordance (label also shows for the selected value).
**Do:**
```tsx
interface Props {
  id: string;
  value: number | undefined;
  onChange: (rating: number) => void;
  onBlur: () => void;
  invalid: boolean;
  describedBy?: string;
}
export function StarRatingInput({ id, value, onChange, onBlur, invalid, describedBy }: Props) {
  const [preview, setPreview] = useState<number | null>(null);
  const shown = preview ?? value ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="radiogroup" id={id} aria-label="Rating" aria-invalid={invalid} aria-describedby={describedBy} className="flex" onMouseLeave={() => setPreview(null)}>
        {RATING_LABELS.map((label, i) => {
          const n = i + 1;
          return (
            <label key={n} className="relative grid size-11 cursor-pointer place-items-center rounded-md has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring" onMouseEnter={() => setPreview(n)}>
              <input type="radio" name={id} value={n} checked={value === n} onChange={() => onChange(n)} onFocus={() => setPreview(n)} onBlur={() => { setPreview(null); onBlur(); }} className="sr-only" aria-label={`${n} star${n > 1 ? 's' : ''}, ${label}`} />
              <Star aria-hidden className={cn('size-7', n <= shown ? 'text-warning' : 'text-border')} fill={n <= shown ? 'currentColor' : 'none'} />
            </label>
          );
        })}
      </div>
      <span aria-live="polite" className="text-label text-text-muted min-w-20">{shown > 0 ? RATING_LABELS[shown - 1] : ''}</span>
    </div>
  );
}
```
(If the star colour token used elsewhere — see `components/stars.tsx` — is not `text-warning`, use that token.)
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): star rating input (M09-T23)"`

### T24 — `ReviewForm` (S16 card)
- [ ] done
**Files:** `src/features/requests/components/review-form.tsx`
**Context:** S16 layout (card max 640, r20, padding 28 / phone 20; provider mini row 48 photo; context line `{FX-2061} · {Service} · completed {date}`; phone sticky `Post review` bar), field table, E2 notice, E3 submit; `CreateReviewBody` via `zodResolver`; `FormField`, `Textarea`, `SubmitButton`, `FormErrorBanner`, `FORM_COPY.saveFailed`; `formatCount`, `formatDateLong`; `useAuth().me.displayName`.
**Do:**
```tsx
type Values = z.input<typeof CreateReviewBody>;
interface Props {
  view: CustomerRequestView;
  displayName: string; // "Olivia M."
  pending: boolean;
  serverError: boolean;
  onSubmit: (values: CreateReviewBody) => void;
  onDirtyChange: (dirty: boolean) => void;
}
```
1. `useForm<Values, unknown, CreateReviewBody>({ resolver: zodResolver(CreateReviewBody), defaultValues: { text: '' }, shouldFocusError: true })`. Report `formState.isDirty` through `onDirtyChange` in an effect.
2. Card `<form noValidate className="border-border bg-surface mx-auto flex w-full max-w-[640px] flex-col gap-6 rounded-2xl border p-5 sm:p-7">`:
   - Top: photo 48 (`size-12 rounded-xl`) or category tile + H1 `text-title-md text-text` `Review {Business}` + `text-meta text-text-subtle` `{ref} · {service.name} · completed {formatDateLong(completedAt)}` (ref in `font-mono`).
   - `serverError` → `<FormErrorBanner>{FORM_COPY.saveFailed}</FormErrorBanner>`.
   - `FormField label="Rating" required error={errors.rating?.message}` → `Controller` → `StarRatingInput` (`value`, `onChange`, `onBlur`, `invalid`, `describedBy` from the control props).
   - `FormField label="Review" required error={errors.text?.message} labelAside={<span className="text-meta text-text-subtle">{formatCount(textLength)} / 1,000</span>}` → `<Textarea rows={6} placeholder="What went well? What could have been better?" className="text-body" {...register('text')} />`; `textLength = watch('text')?.length ?? 0`.
   - Notice `text-meta text-text-muted`: `Reviews can't be edited after posting. Your name shows as {displayName}.`
   - Submit wrapper (M08 sticky pattern): `<div className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 border-t px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0">` → `<SubmitButton size="lg" className="w-full sm:w-auto" pending={pending} pendingLabel="Posting…">Post review</SubmitButton>`.
3. States: default (no stars, counter `0 / 1,000`); validation errors (both messages, focus first invalid); submitting (`Posting…`, disabled, fields stay editable); server error banner (values kept).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): leave-a-review form (M09-T24)"`

### T25 — `LeaveReviewPage` (S16) and route wiring
- [ ] done
**Files:** `src/features/requests/pages/leave-review-page.tsx`, `src/app/chunks/customer.tsx`
**Context:** S16 (ineligible: already reviewed → redirect S15; window closed / not completed → in-card message; other owner → S39), E3 (→ S15 + toast `Thanks — your review is live.`), §6.7 discard confirm, D-9; `useMyRequest`, `usePostReview`, `useBodyClass`, `DiscardChangesGuard`, `mapApiErrorToForm` not needed (server field errors equal client ones).
**Do:**
```tsx
export function LeaveReviewPage() {
  const { ref = '' } = useParams();
  const navigate = useNavigate();
  const { me } = useAuth();
  const q = useMyRequest(ref);
  const post = usePostReview(ref);
  const [dirty, setDirty] = useState(false);
  const [postedRef, setPostedRef] = useState<string | null>(null);
  const [serverError, setServerError] = useState(false);
  const v = q.data;
  const showForm = Boolean(v?.review?.eligible && me);
  useBodyClass(showForm ? 'pb-24 sm:pb-0' : '');
  useEffect(() => {
    if (postedRef) {
      notify('Thanks — your review is live.');
      void navigate(`/requests/${postedRef}`, { replace: true });
    }
  }, [postedRef, navigate]);
  const onDirtyChange = useCallback((d: boolean) => setDirty(d), []);

  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFoundPage variant="request" />;
    throw q.error;
  }
  if (v?.review?.own && postedRef === null) return <Navigate to={`/requests/${v.ref}`} replace />; // already reviewed
  const submit = (values: CreateReviewBody) => {
    setServerError(false);
    post.mutate(values, {
      onSuccess: () => setPostedRef(ref),
      onError: (e) => {
        if (e instanceof ApiError && e.rule === 'already_reviewed') return void navigate(`/requests/${ref}`, { replace: true });
        if (e instanceof ApiError && (e.rule === 'review_window_closed' || e.rule === 'review_not_eligible')) return void q.refetch();
        setServerError(true);
      },
    });
  };
  // render
}
```
Render:
- `<DiscardChangesGuard when={dirty && postedRef === null} />` (default SPEC copy `Discard changes?` / `What you've entered won't be saved.` / `Keep editing` · `Discard`).
- `<BackLink to={`/requests/${ref}`}>Back to request</BackLink>`.
- Loading (`!v || !me`) → `SkeletonSectionCard lines={6}` inside a `max-w-[640px] mx-auto w-full` wrapper.
- `v.review?.eligible` → `<ReviewForm view={v} displayName={me.displayName} pending={post.isPending} serverError={serverError} onSubmit={submit} onDirtyChange={onDirtyChange} />`.
- Otherwise (not completed, or window closed) → the same card shell with `text-body text-text-muted` `The review window for this job has closed.` and a secondary `Back to request` link button.
- `customer.tsx`: remove the `LeaveReviewPage` placeholder and export the real page; remove `PlaceholderScreen`/`BackLink` imports if now unused.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): leave-a-review page S16 (M09-T25)"`

### T26 — S16 behaviour tests
- [ ] done
**Files:** `src/features/requests/pages/leave-review-page.test.tsx`
**Context:** AC7, AC8.
**Do / Test:** cases (fake timers per conventions):
1. `empty submit → both SPEC errors, focus on the rating group` — `/requests/FX-2046/review`; heading `Review Bell & Sons Plumbing`; text `Reviews can't be edited after posting. Your name shows as Olivia M.`; click `Post review`; `Choose a star rating.` and `Write at least 10 characters.` visible.
2. `stars: 5 radios named 1 star, Poor … 5 stars, Excellent; choosing 4 shows Very good` — `getAllByRole('radio')` length 5; names in order; click radio `4 stars, Very good` → text `Very good`. (44×44 is the `size-11` class: assert `toHaveClass('size-11')` on each radio's parent label — styling assertion is allowed here because it is an AC.)
3. `counter shows n / 1,000` — type 12 chars → `12 / 1,000`.
4. `post → S15 + toast + Your review; provider rating/count updated` — read `db().providers.p01` before; choose 5, type `Fixed the leak quickly and cleanly.`, click `Post review`; expect `Thanks — your review is live.`; expect the S15 level-1 heading (FX-2046's service name) and the text `Your review`; then `expect(db().providers.p01?.reviewCount).toBe(before + 1)`. Then `renderRoute('/providers/p01')` (fresh render) shows the new count in the rating text (match `formatRating`/`reviewCount` output the profile uses).
5. `reopening after posting redirects to S15` — post via `fetch` first (or `usePostReview` flow from case 4), then `renderRoute('/requests/FX-2046/review')` → S15 heading, `Your review`.
6. `window closed` — `/requests/FX-2029/review` → `The review window for this job has closed.`; no `Post review` button.
7. `not completed` — `/requests/FX-2030/review` → same closed message.
8. `another customer's ref → S39 request` — `/requests/FX-2041/review` → `We can't find that request`. `admin → S40`.
9. `dirty form + Back to request → Discard changes? → Keep editing stays; Discard leaves` — type text, click `Back to request`, dialog `Discard changes?`; click `Keep editing` → still on S16; click link again, `Discard` → S15.
10. `server error → banner, values kept` — `armForcedError('reviews_create', '500')`; fill valid; submit → `We couldn't save your changes. Check your connection and try again.`; textarea still has the text.
**Verify:** `pnpm --filter @fixit/web test -- leave-review-page` green; `pnpm verify` green.
**Commit:** `git commit -m "test(web): leave-a-review behaviour (M09-T26)"`

**Checkpoint after T26:** "Human: `pnpm dev:mock`, Olivia, `/requests/FX-2046/review` at 390: sticky `Post review` bar at the bottom, star targets easy to tap, no horizontal scroll; post a review and check `/providers/p01` shows the new count."

### T27 — Acceptance checks
- [ ] done
**Files:** `docs/plans/PLAN-M09-my-requests-reviews.md` (tick boxes), `docs/milestones/M00-index.md` (mark M09 done, as M08 did)
**Do:** walk every acceptance criterion; record pass/fail next to each in the commit message body. Anything failing → **STOP**, write a blocker.
| AC | Check |
|---|---|
| 1 | `pnpm --filter @fixit/web test -- my-requests-page` (cases 1–3) + manual 1440 `/requests` as Olivia |
| 2 | test case 4 + manual 390: tabs scroll sideways, full-card links, no horizontal scroll (DevTools: `document.documentElement.scrollWidth === 390`) |
| 3 | test cases 5–7; manual: DevPanel latency `slow` → list skeletons; DevPanel force `500` on `requests_list` → section error + `Try again` |
| 4 | `customer-request-page` cases 1–2; manual 390: cancel dialog is a bottom sheet |
| 5 | cases 3–5 |
| 6 | cases 6–7; manual: in `pnpm dev:mock` wait 6 min after a fresh seed (DevPanel reset), reload `/requests/FX-2032` → Expired |
| 7 | `leave-review-page` cases 1–4 |
| 8 | `leave-review-page` cases 5–8; `my-requests-page` case 8; `customer-request-page` case 9 |
| 9 | `pnpm --filter @fixit/contracts test` (`reviewEligibility`, `ratingFrom`), `requests-mine.test.ts` (409 `past_cancel_deadline`) |
Then `pnpm verify` green, tick T27, commit.
**Commit:** `git commit -m "chore: M09 acceptance checks (M09-T27)"`

## Checkpoints
- After T9: "Human: run `pnpm dev:mock`; DevPanel endpoint list shows `requests_list`, `requests_cancel`, `reviews_create`."
- After T16: "Human: `pnpm dev:mock`, Olivia, `/requests` at 1440 and 390. INFERRED screen — compare with SPEC S14 and the S20 table pattern (`reference/screens/` provider overview image)."
- After T21: "Human: open each journey ref (FX-2028…FX-2036, FX-2046, FX-2061) at 1440 and 390 and compare panels with the SPEC S15 table; cancel at 390 is a bottom sheet."
- After T26: "Human: S16 at 390 — sticky bar, star targets, post a review, check `/providers/p01` count."

## Blockers
- **RESOLVED (user chose option 1; `DataList` now skips the actions wrapper when every actions cell renders nothing, with a test) — T15 — `DataList` does not hide an empty actions row on phone.** T15 step `action` says: if `DataList` renders an empty actions row when the cell returns `null`, check that it hides the row, and if it doesn't, STOP rather than fork `DataList`. In `src/components/data-list.tsx` the phone card renders `<div className="relative z-10 mt-1 flex gap-2 …">` whenever any column has `card: 'actions'`, with one inner `<div className="flex flex-1 gap-2">` per actions column, regardless of what `cell(row)` returns. So every card without a review button (10 of 11 for Olivia) gets an empty `mt-1` row, about 4 px of extra bottom space plus the card's `gap-2` (8 px).
  Options:
  1. Allow a small change to `DataList`: skip the actions wrapper when every actions cell renders `null` (needs `cell` results inspected, or an optional `hasActions?: (row) => boolean` on the column). Touches a shared component and its test.
  2. Drop the phone `action` column and render `reviewButton(r)` inside the `when`/`contact` meta rows (no forced 44 px height from `DataList`, so add `min-h-11` on the button). No change to shared code, but diverges from the plan's column list.
  3. Accept the cosmetic 12 px gap on cards without a button (keep the plan's column list as written).
  Executor recommendation: option 1 (smallest, keeps the SPEC layout and 44 px targets).
  Tasks T1–T14 are done and committed; T15 not started.

## Nice-to-haves / notes (not tasks)
- API milestone: D-3 and D-4 are recorded in decision 005 (ARCH §2.5/§4 updated). The API's 409 should carry `details.status` like the mock (D-5).
- A DevPanel shortcut "advance mock clock 10 min" would make AC6 instant instead of waiting 6 minutes.
- S14 card header H2 has no SPEC copy; the plan uses the active tab label. A copy decision would settle it.
- `Couldn't copy. Try again.` (D-8) is pattern-derived, not literal SPEC copy.
