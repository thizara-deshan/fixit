# PLAN-M10 — Provider overview & requests
Milestone: `docs/milestones/M10-provider-requests.md` · Start tag: `m10-start` · Verify-all: `pnpm verify`
Mock domains at start → end: all → all (`requests` gains the six provider-side endpoints; `providers` gets its first handler, `GET /me/provider/dashboard`). **No backend in this milestone** (`apps/api` does not exist yet), so there are no Nest tasks and no authorization-matrix rows. The mocks apply role rules through `mockEndpoint` (`access: ['provider']` → customer/admin 403, anonymous 401), ownership through `providerId = my listing` lookups (miss → 404) and every status change through `assertTransition` (via `transitionOr409`), as the API will.

Conventions for the executor (same as M09):
- T1 creates tag `m10-start` and branch `m10-provider-requests` from the current HEAD. One commit per task, using the message given, ending with the attribution lines from your session instructions.
- Run `pnpm format` before `pnpm verify` in every task. Code below may not be Prettier-exact.
- Code blocks are complete files unless the step says "add", "replace" or "edit". Tests import `describe/expect/it/vi` from `vitest` explicitly.
- Paths are under `apps/web/` unless they start with `packages/`, `docs/` or `/`. `@/` = `apps/web/src/`.
- Tailwind: only `sm` (≥641) and `lg` (≥1024) prefixes. Arbitrary **size/grid** values are allowed (`w-[288px]`, `lg:grid-cols-[minmax(0,1fr)_340px]`). Arbitrary colour values and lint-banned prefixes (`text-[`, `bg-[`, `border-[`, `shadow-[`, `ring-[`, `outline-[`) are not. Token classes used in this plan: `bg-surface bg-page bg-primary-soft bg-primary-flash bg-success-soft bg-warning-soft text-text text-text-muted text-text-subtle text-primary text-success text-warning-text text-danger-text border-border border-divider-subtle`, type scale `text-title-xl text-title-lg text-title-md text-stat text-lead text-body text-body-sm text-label text-meta text-caption text-mono`, radii `rounded-sm rounded-md rounded-lg rounded-xl rounded-2xl rounded-full`, `font-mono`, `shadow-hover`.
- Copy in backticks is SPEC copy, character for character.
- Time in tests: fixtures are seeded at `FIXED_NOW` (`@/test/fixed-now`, **Sun 22 Nov 2026 10:00 Colombo**). Every new test that calls the requests/providers handlers or renders a page uses `vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] })` in `beforeEach` and `vi.useRealTimers()` in `afterEach`.
- `exactOptionalPropertyTypes` is on: build optional keys with `...(x === undefined ? {} : { key: x })`, never `{ key: undefined }`.
- If a library API differs from what the code assumes (React Router 7, TanStack Query 5, zod 4, react-hook-form 7, sonner, lucide-react names), **STOP** and write a blocker.

Planner's decisions the executor must follow:
- **D-1 Dashboard contract.** ARCH §3.3 names `ProviderDashboard (stats, counts, checklist)` without a shape. It is `{ stats: { pending, accepted, completedThisMonth, rating, reviewCount }, services: Service[], checklist: null }`. `checklist` is `z.null()` for now; M24 widens it to `ProfileChecklist.nullable()` (additive). No checklist UI is built (flag `checklist` stays off). The S20 requests table does **not** come from the dashboard: it uses `GET /me/provider/requests` (page 1, first 8 rows), so there is one list implementation.
- **D-2 Accepted tile = every request in status Accepted** (prototype value 2 for p01; matches the tile's link `?status=accepted`). M17's "accepted upcoming" wording is read as the same set: an Accepted job is by definition still to do.
- **D-3 Search privacy.** `q` matches the ref and **only the name the provider can see**: `Olivia M.` while Pending/Declined/Cancelled/Expired, `Olivia Martinez` while Accepted/Completed. Searching a surname must not reveal which pending request it belongs to (§6.3).
- **D-4 Counts follow the search.** `counts` are computed after the `q` filter and before the status filter. `No requests yet` shows only when `q` is empty and `counts.all === 0`; with `q` and `counts.all === 0` the page shows the no-match empty state.
- **D-5 Mutations do not sweep first.** The accept/decline/complete/agreed-price handlers do **not** call `expireDue` before checking: a lapsed Pending is refused `expired` by the state machine (AC10), exactly as the API is before the cron runs. The 409 carries `details.status = 'pending'`; the web always refetches the request after a 409 (the GET handler sweeps) and shows the refreshed status in the conflict dialog.
- **D-6 Conflict copy.** On any 409 from accept/decline/complete/agreed-price: close the dialog, invalidate the inbox lists and the dashboard, refetch the request detail, then open the §6.3 dialog: title `This request has changed`, body `It's now {Status}, so this action isn't available.` (Status = `REQUEST_LABEL` of the refetched status), button `OK`. A DevPanel-forced 409 on a still-Pending request therefore reads `It's now Pending, …` — accepted for a forced error.
- **D-7 One flash mechanism.** Lists flash a row (`bg-primary-flash`, 900 ms) whenever a row's status differs from the status that list last rendered for that ref. This covers both the accept/decline result (the list refetches after the mutation) and §6.11 background refreshes. No explicit flash call in mutations.
- **D-8 Names in copy.** `{Olivia}` in toasts/dialogs/S22.E6 = first word of `customer.displayName` (`Olivia M.` → `Olivia`). Greeting `{Marcus}` = first word of `me.fullName`. Table/card names: `fullName` when revealed, else `displayName`.
- **D-9 S22.E6 copy not in SPEC.** System-cancelled (customer suspended): line `This request was cancelled.` + `Reason: {reason}` (S15's system wording; §8.3 gives the reason `Customer account closed`). System-declined: `Declined automatically — your account was suspended.` with no reason line.
- **D-10 `reviewDeadline`** in `ProviderRequestView` is non-null only while Completed, not yet reviewed (any visibility) and `now < completedAt + 30 days`. The UI prints `The customer can review until {date}.` only when it is non-null. `review` carries only a **visible** review.
- **D-11 Complete dialog price.** `Final agreed price (optional)` is prefilled with the current agreed price. Leaving it empty sends `{}` (price unchanged); to clear a price the provider uses the inline editor before completing.
- **D-12 Shared components move.** `ConflictDialog`, `ContactBlock` and `RequestHistory` are now used by two features, so T20 moves them to `src/components/` (CLAUDE.md "Component shared by 2+ features"). `ContactBlock` takes `label` instead of `businessName`; `RequestHistory` takes `actorLabel(actor)` instead of `businessName`.
- **D-13 New fixtures.** p01 has no Cancelled or Expired request, and no provider persona has zero requests. T7 adds FX-2038 (cancelled by the customer, Daniel Kim), FX-2039 (accepted, then cancelled by Fixit, Aisha Rahman), FX-2040 (expired, Sophia Nguyen) and the persona `providerNoRequests` (Chathura Ranasinghe, p12, listed, no requests, no reviews). `makeRequest` steps accept `actor: 'customer'`. `MOCK_DB_VERSION` 4 → 5.
- **D-14 Phone actions on S22.** At < 641 px the Pending Accept/Decline buttons render **only** in the sticky bottom bar; at ≥ 641 px only in the Actions card (chosen with `useMediaQuery(MQ.sm)`, so tests never see duplicates).

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `packages/contracts/src/requests/provider-bodies.ts` (+ test) | Create | `AgreedPrice`, `AgreedPriceText`, `AcceptBody`, `DeclineBody`, `CompleteBody`, `AgreedPriceBody`, `AgreedPriceForm` |
| `packages/contracts/src/requests/schemas.ts` (+ `provider-view.test.ts`) | Modify | `CustomerContact`, `ProviderRequestView` |
| `packages/contracts/src/requests/projections.ts` (+ test) | Modify | `isContactRevealed`, `toProviderView` |
| `packages/contracts/src/requests/inbox.ts` (+ test) | Create | `InboxStatus`, `ProviderRequestListQuery`, `InboxCounts`, `ProviderRequestList`, `matchesInboxSearch`, `compareInbox` |
| `packages/contracts/src/providers/schemas.ts`, `providers/dashboard.ts` (+ test) | Modify/Create | `DashboardStats`, `ProviderDashboard`, `dashboardStats()` |
| `packages/contracts/src/endpoints.ts` (+ test), `index.ts` | Modify | 7 registry entries, exports |
| `packages/fixtures/src/requests.ts`, `build.ts`, `users.ts`, `build.test.ts` | Modify | customer actor, FX-2038–2040, persona |
| `src/mocks/db/schema.ts` | Modify | `MOCK_DB_VERSION = 5` |
| `src/mocks/lib/requests.ts` (+ test) | Modify | `ownProvider`, `ownInboxRequest`, `providerViewOf`, `inboxList`, `applyTransition` |
| `src/mocks/handlers/requests.ts` (+ `requests-inbox.test.ts`, `requests-provider-actions.test.ts`) | Modify/Create | list, detail, accept, decline, complete, agreed price |
| `src/mocks/handlers/providers.ts` (+ test), `handlers/index.ts` | Create/Modify | dashboard |
| `src/lib/query-keys.ts` | Modify | `inbox`, `dashboard` |
| `src/features/auth/hooks.ts`, `src/features/requests/hooks.ts` | Modify | `refreshMe` exported from auth |
| `src/lib/format.ts` (+ test) | Modify | `formatReplyBy`, `formatMonthName` |
| `src/lib/row-flash.ts` (+ test), `src/components/data-list.tsx` | Create/Modify | flash store; `rowClassName` |
| `src/components/conflict-dialog.tsx`, `contact-block.tsx`, `request-history.tsx` | Move | shared by two features (D-12) |
| `src/features/provider-dashboard/api.ts`, `hooks.ts` (+ `hooks.test.tsx`) | Create | HTTP + query/mutation hooks |
| `src/features/provider-dashboard/copy.ts` (+ test) | Create | greeting, names, S22 copy, actor labels |
| `src/features/provider-dashboard/inbox-search.ts` (+ test) | Create | `?status=&q=&page=` |
| `src/features/provider-dashboard/components/*.tsx` | Create | price input, 3 dialogs, actions controller, list, tiles, header, sections, S22 cards |
| `src/features/provider-dashboard/pages/{overview,requests,request}-page.tsx` (+ tests) | Create | S20, S21, S22 |
| `src/app/chunks/provider.tsx`, `src/app/routes.test.tsx` | Modify | wiring |

## Tasks

### T1 — Agreed price and action bodies
- [x] done
**Files:** `packages/contracts/src/requests/provider-bodies.ts`, `packages/contracts/src/requests/provider-bodies.test.ts`, `packages/contracts/src/index.ts`
**Context:** SPEC S22 field table (`Whole number 1–10,000,000`, `Enter a whole amount in rupees, like 6500.`), §8.3 accept/decline/complete dialogs, reason ≤ 500 `Keep the reason under 500 characters.` (`OptionalReason` in `common/primitives.ts`); ARCH §3.4 bodies; BR-12.
**Do:**
1. `git tag m10-start && git switch -c m10-provider-requests`.
2. Create `packages/contracts/src/requests/provider-bodies.ts`:
```ts
import { z } from 'zod';
import { OptionalReason } from '../common/primitives';

export const AGREED_PRICE_MESSAGE = 'Enter a whole amount in rupees, like 6500.';
export const AGREED_PRICE_MAX = 10_000_000;

/** S22 / BR-12: whole LKR, 1–10,000,000. */
export const AgreedPrice = z
  .number({ error: AGREED_PRICE_MESSAGE })
  .int(AGREED_PRICE_MESSAGE)
  .min(1, AGREED_PRICE_MESSAGE)
  .max(AGREED_PRICE_MAX, AGREED_PRICE_MESSAGE);

/** Form text → number. '' → undefined. Spaces and thousands commas are ignored ('6,500' → 6500); '6.5' fails. */
export const AgreedPriceText = z.string().transform((raw, ctx): number | undefined => {
  const s = raw.replace(/[\s,]/g, '');
  if (s === '') return undefined;
  const parsed = AgreedPrice.safeParse(/^\d+$/.test(s) ? Number(s) : Number.NaN);
  if (!parsed.success) {
    ctx.addIssue({ code: 'custom', message: AGREED_PRICE_MESSAGE });
    return z.NEVER;
  }
  return parsed.data;
});

export const AcceptBody = z.object({ agreedPrice: AgreedPrice.optional() });
export type AcceptBody = z.infer<typeof AcceptBody>;

export const DeclineBody = z.object({ reason: OptionalReason });
export type DeclineBody = z.infer<typeof DeclineBody>;

export const CompleteBody = z.object({ agreedPrice: AgreedPrice.optional() });
export type CompleteBody = z.infer<typeof CompleteBody>;

/** PUT …/agreed-price: null clears it. */
export const AgreedPriceBody = z.object({ agreedPrice: AgreedPrice.nullable() });
export type AgreedPriceBody = z.infer<typeof AgreedPriceBody>;

/** Accept dialog, complete dialog and the S22 inline editor (one text field). */
export const AgreedPriceForm = z.object({ agreedPrice: AgreedPriceText });
export type AgreedPriceFormInput = z.input<typeof AgreedPriceForm>;
```
3. Add `export * from './requests/provider-bodies';` to `packages/contracts/src/index.ts`.
**Test:** `packages/contracts/src/requests/provider-bodies.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import {
  AcceptBody,
  AGREED_PRICE_MESSAGE,
  AgreedPriceBody,
  AgreedPriceForm,
  DeclineBody,
} from './provider-bodies';

const form = (agreedPrice: string) => AgreedPriceForm.safeParse({ agreedPrice });

describe('AgreedPriceForm (S22)', () => {
  it.each([
    ['', undefined],
    ['6500', 6500],
    [' 6,500 ', 6500],
    ['1', 1],
    ['10000000', 10_000_000],
  ])('%j → %j', (text, value) => {
    const r = form(text);
    expect(r.success && r.data.agreedPrice).toBe(value ?? undefined);
  });
  it.each(['6.5', '0', '10000001', 'abc', '-5'])('%j → SPEC message', (text) => {
    const r = form(text);
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe(AGREED_PRICE_MESSAGE);
  });
});

describe('bodies', () => {
  it('accept: price optional, whole rupees only', () => {
    expect(AcceptBody.parse({})).toEqual({});
    expect(AcceptBody.safeParse({ agreedPrice: 6.5 }).success).toBe(false);
  });
  it('agreed price body accepts null (clear)', () => {
    expect(AgreedPriceBody.parse({ agreedPrice: null })).toEqual({ agreedPrice: null });
  });
  it('decline reason: empty → undefined, 501 chars refused', () => {
    expect(DeclineBody.parse({ reason: '' }).reason).toBeUndefined();
    expect(DeclineBody.safeParse({ reason: 'x'.repeat(501) }).error?.issues[0]?.message).toBe(
      'Keep the reason under 500 characters.',
    );
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test provider-bodies` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): agreed price and provider action bodies (M10-T1)"`

### T2 — `CustomerContact` and `ProviderRequestView`
- [x] done
**Files:** `packages/contracts/src/requests/schemas.ts`, `packages/contracts/src/requests/provider-view.test.ts`
**Context:** ARCH §2.5 (`CustomerContact` discriminated union, `ProviderRequestView`), PRODUCT §6.3, D-10.
**Do:** Append to `packages/contracts/src/requests/schemas.ts`:
```ts
/** Privacy (§6.3) is structural: the unrevealed branch has no contact fields at all. */
export const CustomerContact = z.discriminatedUnion('revealed', [
  z.object({ revealed: z.literal(false), displayName: z.string() }),
  z.object({
    revealed: z.literal(true),
    displayName: z.string(),
    fullName: z.string(),
    mobile: Mobile,
    addressLine1: z.string(),
    addressLine2: z.string().nullable(),
  }),
]);
export type CustomerContact = z.infer<typeof CustomerContact>;

export const ProviderRequestView = RequestBase.extend({
  customer: CustomerContact,
  canComplete: z.boolean(),
  completeFrom: IsoDate, // = preferredDate (BR-32)
  review: z.object({ id: Id, rating: z.number().int(), authorDisplayName: z.string() }).nullable(), // visible review only
  reviewDeadline: IsoDateTime.nullable(), // D-10
});
export type ProviderRequestView = z.infer<typeof ProviderRequestView>;
```
**Test:** `packages/contracts/src/requests/provider-view.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { CustomerContact } from './schemas';

describe('CustomerContact', () => {
  it('unrevealed parse drops any contact field that slipped in', () => {
    const c = CustomerContact.parse({
      revealed: false,
      displayName: 'Olivia M.',
      fullName: 'Olivia Martinez',
      mobile: '+94770001001',
    });
    expect(c).toEqual({ revealed: false, displayName: 'Olivia M.' });
    expect('mobile' in c).toBe(false);
  });
  it('revealed requires the full contact', () => {
    expect(CustomerContact.safeParse({ revealed: true, displayName: 'Olivia M.' }).success).toBe(false);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test provider-view` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): ProviderRequestView with structural customer privacy (M10-T2)"`

### T3 — `toProviderView` projection
- [x] done
**Files:** `packages/contracts/src/requests/projections.ts`, `packages/contracts/src/requests/projections.test.ts`
**Context:** ARCH §2.9 (privacy exists once, tests assert absent fields), PRODUCT §6.3, BR-32, D-10; milestone AC10. Existing `toCustomerView` in the same file.
**Do:**
1. In `projections.ts` replace `const REVEALED: readonly RequestStatus[] = ['accepted', 'completed'];` with:
```ts
const REVEALED: readonly RequestStatus[] = ['accepted', 'completed'];
/** PRODUCT §6.3: contact details are shown to the other party only while Accepted or Completed. */
export const isContactRevealed = (status: RequestStatus): boolean => REVEALED.includes(status);
```
2. Add imports: `import { displayNameOf } from '../auth/names';` and `ProviderRequestView` to the type import from `./schemas`.
3. Append:
```ts
export interface ProviderViewContext {
  customer: { fullName: string };
  town: { id: string; name: string };
  /** The visible review of this request, if any. */
  review: { id: string; rating: number; authorDisplayName: string } | null;
  /** True when the customer has reviewed, whatever the visibility (D-10). */
  reviewed: boolean;
}

/** PRODUCT §6.3 for the provider: full name, address and mobile only while Accepted or Completed. */
export function toProviderView(r: RequestRecord, ctx: ProviderViewContext, now: Date): ProviderRequestView {
  const displayName = displayNameOf(ctx.customer.fullName);
  const customer: ProviderRequestView['customer'] = isContactRevealed(r.status)
    ? {
        revealed: true,
        displayName,
        fullName: ctx.customer.fullName,
        mobile: r.customerMobile,
        addressLine1: r.addressLine1,
        addressLine2: r.addressLine2,
      }
    : { revealed: false, displayName };
  let deadline: string | null = null;
  if (r.status === 'completed' && r.completedAt !== null && !ctx.reviewed) {
    const d = reviewDeadline(new Date(r.completedAt));
    if (now.getTime() < d.getTime()) deadline = d.toISOString();
  }
  return {
    ref: r.ref,
    status: r.status,
    service: r.service,
    preferredDate: r.preferredDate,
    slot: r.slot,
    town: ctx.town,
    description: r.description,
    agreedPrice: r.agreedPrice,
    reason: r.reason,
    closedBy: r.closedBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    expiresAt: r.expiresAt,
    completedAt: r.completedAt,
    history: r.events.map((e) => ({
      status: e.status,
      at: e.at,
      actor: e.actor,
      actorName: null,
      reason: e.reason,
    })),
    customer,
    canComplete: canTransition(
      toMachineRequest(r),
      'completed',
      { kind: 'provider', userId: r.providerUserId },
      now,
    ).ok,
    completeFrom: r.preferredDate,
    review: ctx.review,
    reviewDeadline: deadline,
  };
}
```
**Test:** append to `projections.test.ts` (reuses `base`, `now` from the file; `now` = Sun 22 Nov 10:00 Colombo, `base.preferredDate` = 2026-11-25):
```ts
import { toProviderView, type ProviderViewContext } from './projections'; // merge into the existing import
import { ProviderRequestView } from './schemas'; // merge into the existing import

const pctx: ProviderViewContext = {
  customer: { fullName: 'Olivia Martinez' },
  town: { id: 'colombo', name: 'Colombo' },
  review: null,
  reviewed: false,
};
const pview = (o: Partial<RequestRecord>, c: ProviderViewContext = pctx) =>
  ProviderRequestView.parse(toProviderView({ ...base, ...o }, c, now));

describe('toProviderView (§6.3)', () => {
  it.each<RequestStatus>(['pending', 'declined', 'cancelled', 'expired'])(
    '%s → Olivia M. only, contact keys absent',
    (status) => {
      const c = pview({ status }).customer;
      expect(c).toEqual({ revealed: false, displayName: 'Olivia M.' });
      for (const key of ['fullName', 'mobile', 'addressLine1', 'addressLine2']) expect(key in c).toBe(false);
    },
  );
  it.each<RequestStatus>(['accepted', 'completed'])('%s → full contact', (status) => {
    const completedAt = status === 'completed' ? '2026-11-21T10:00:00.000Z' : null;
    expect(pview({ status, completedAt }).customer).toEqual({
      revealed: true,
      displayName: 'Olivia M.',
      fullName: 'Olivia Martinez',
      mobile: '+94770001001',
      addressLine1: '12 Galle Road',
      addressLine2: null,
    });
  });
  it('canComplete: accepted from the preferred date only (BR-32)', () => {
    expect(pview({ status: 'accepted' }).canComplete).toBe(false);
    expect(pview({ status: 'accepted', preferredDate: '2026-11-22' }).canComplete).toBe(true);
    expect(pview({ status: 'pending', preferredDate: '2026-11-22' }).canComplete).toBe(false);
    expect(pview({}).completeFrom).toBe('2026-11-25');
  });
  it('reviewDeadline: completed, unreviewed, inside 30 days (D-10)', () => {
    const completedAt = '2026-11-21T10:00:00.000Z';
    expect(pview({ status: 'completed', completedAt }).reviewDeadline).toBe('2026-12-21T10:00:00.000Z');
    expect(pview({ status: 'completed', completedAt }, { ...pctx, reviewed: true }).reviewDeadline).toBeNull();
    expect(
      pview({ status: 'completed', completedAt: '2026-10-01T10:00:00.000Z' }).reviewDeadline,
    ).toBeNull();
    expect(pview({ status: 'accepted' }).reviewDeadline).toBeNull();
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test projections` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): toProviderView privacy projection (M10-T3)"`

### T4 — Inbox query, counts, search and order
- [x] done
**Files:** `packages/contracts/src/requests/inbox.ts`, `packages/contracts/src/requests/inbox.test.ts`, `packages/contracts/src/index.ts`
**Context:** SPEC S21 (7 tabs, `?status=&q=&page=`, Pending by `expiresAt` ascending, otherwise newest first, 20 per page `PAGE_SIZE.providerRequests`), D-3, D-4.
**Do:**
1. Create `packages/contracts/src/requests/inbox.ts`:
```ts
import { z } from 'zod';
import { displayNameOf } from '../auth/names';
import type { RequestStatus } from '../common/enums';
import { paginated } from '../common/pagination';
import { isContactRevealed } from './projections';
import { ProviderRequestView } from './schemas';

export const InboxStatus = z.enum(['all', 'pending', 'accepted', 'completed', 'declined', 'cancelled', 'expired']);
export type InboxStatus = z.infer<typeof InboxStatus>;

/** URL `?status=&q=&page=` and GET /me/provider/requests query. Invalid values fall back to defaults. */
export const ProviderRequestListQuery = z.object({
  status: InboxStatus.catch('all').default('all'),
  q: z.string().trim().max(100).catch('').default(''),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});
export type ProviderRequestListQuery = z.infer<typeof ProviderRequestListQuery>;

const count = z.number().int().min(0);
export const InboxCounts = z.object({
  all: count,
  pending: count,
  accepted: count,
  completed: count,
  declined: count,
  cancelled: count,
  expired: count,
});
export type InboxCounts = z.infer<typeof InboxCounts>;

export const ProviderRequestList = paginated(ProviderRequestView).extend({ counts: InboxCounts });
export type ProviderRequestList = z.infer<typeof ProviderRequestList>;

/** D-3: the search sees only what the provider sees — the ref and the visible name. */
export function matchesInboxSearch(
  q: string,
  row: { ref: string; status: RequestStatus; customerFullName: string },
): boolean {
  const needle = q.trim().toLowerCase();
  if (needle === '') return true;
  const name = isContactRevealed(row.status) ? row.customerFullName : displayNameOf(row.customerFullName);
  return row.ref.toLowerCase().includes(needle) || name.toLowerCase().includes(needle);
}

interface Sortable {
  ref: string;
  createdAt: string; // ISO, same format everywhere → string order = time order
  expiresAt: string;
}
/** S21: Pending tab = most urgent first; every other tab = newest first. Ties by ref. */
export function compareInbox(tab: InboxStatus): (a: Sortable, b: Sortable) => number {
  if (tab === 'pending') return (a, b) => a.expiresAt.localeCompare(b.expiresAt) || a.ref.localeCompare(b.ref);
  return (a, b) => b.createdAt.localeCompare(a.createdAt) || b.ref.localeCompare(a.ref);
}
```
2. Add `export * from './requests/inbox';` to `index.ts`.
**Test:** `packages/contracts/src/requests/inbox.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { compareInbox, matchesInboxSearch, ProviderRequestListQuery } from './inbox';

describe('ProviderRequestListQuery', () => {
  it('defaults and fallbacks', () => {
    expect(ProviderRequestListQuery.parse({})).toEqual({ status: 'all', q: '', page: 1 });
    expect(ProviderRequestListQuery.parse({ status: 'nope', page: '0', q: '  fx ' })).toEqual({
      status: 'all',
      q: 'fx',
      page: 1,
    });
    expect(ProviderRequestListQuery.parse({ status: 'expired', page: '3' })).toMatchObject({
      status: 'expired',
      page: 3,
    });
  });
});

describe('matchesInboxSearch (D-3)', () => {
  const row = { ref: 'FX-2061', customerFullName: 'Olivia Martinez' };
  it('matches the ref, case-insensitive', () => {
    expect(matchesInboxSearch('fx-2061', { ...row, status: 'pending' })).toBe(true);
  });
  it('pending: visible name only — the surname does not match', () => {
    expect(matchesInboxSearch('olivia m', { ...row, status: 'pending' })).toBe(true);
    expect(matchesInboxSearch('martinez', { ...row, status: 'pending' })).toBe(false);
    expect(matchesInboxSearch('martinez', { ...row, status: 'declined' })).toBe(false);
  });
  it('accepted/completed: full name matches', () => {
    expect(matchesInboxSearch('martinez', { ...row, status: 'accepted' })).toBe(true);
  });
  it('empty query matches everything', () => {
    expect(matchesInboxSearch('  ', { ...row, status: 'pending' })).toBe(true);
  });
});

describe('compareInbox', () => {
  const a = { ref: 'FX-1', createdAt: '2026-11-20T00:00:00.000Z', expiresAt: '2026-11-23T00:00:00.000Z' };
  const b = { ref: 'FX-2', createdAt: '2026-11-21T00:00:00.000Z', expiresAt: '2026-11-22T12:00:00.000Z' };
  it('pending → expiresAt ascending', () => {
    expect([a, b].sort(compareInbox('pending')).map((r) => r.ref)).toEqual(['FX-2', 'FX-1']);
  });
  it('others → newest first', () => {
    expect([a, b].sort(compareInbox('all')).map((r) => r.ref)).toEqual(['FX-2', 'FX-1']);
    expect([b, a].sort(compareInbox('completed')).map((r) => r.ref)).toEqual(['FX-2', 'FX-1']);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test inbox` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): provider inbox query, counts, search and order (M10-T4)"`

### T5 — `ProviderDashboard` and `dashboardStats`
- [x] done
**Files:** `packages/contracts/src/providers/schemas.ts`, `packages/contracts/src/providers/dashboard.ts`, `packages/contracts/src/providers/dashboard.test.ts`, `packages/contracts/src/index.ts`
**Context:** SPEC S20.E6 (four tiles; Completed this month in Colombo), D-1, D-2; milestone note on the checklist.
**Do:**
1. Append to `providers/schemas.ts`:
```ts
const count = z.number().int().min(0);
export const DashboardStats = z.object({
  pending: count,
  accepted: count, // D-2: every Accepted request
  completedThisMonth: count, // completedAt in the current Colombo month
  rating: z.number().min(1).max(5).nullable(), // null → "New"
  reviewCount: count,
});
export type DashboardStats = z.infer<typeof DashboardStats>;

export const ProviderDashboard = z.object({
  stats: DashboardStats,
  services: z.array(Service),
  /** F-21 profile completeness. Always null until M24 widens it to ProfileChecklist.nullable() (D-1). */
  checklist: z.null(),
});
export type ProviderDashboard = z.infer<typeof ProviderDashboard>;
```
2. Create `providers/dashboard.ts`:
```ts
import { formatInColombo } from '../common/dates';
import type { RequestRecord } from '../requests/record';
import type { DashboardStats } from './schemas';

const month = (instant: Date): string => formatInColombo(instant, 'yyyy-MM');

/** S20.E6 counts from the provider's own request rows (mock now, API in M17). */
export function dashboardStats(
  records: readonly Pick<RequestRecord, 'status' | 'completedAt'>[],
  rating: { rating: number | null; count: number },
  now: Date,
): DashboardStats {
  const thisMonth = month(now);
  return {
    pending: records.filter((r) => r.status === 'pending').length,
    accepted: records.filter((r) => r.status === 'accepted').length,
    completedThisMonth: records.filter(
      (r) => r.status === 'completed' && r.completedAt !== null && month(new Date(r.completedAt)) === thisMonth,
    ).length,
    rating: rating.count > 0 ? rating.rating : null,
    reviewCount: rating.count,
  };
}
```
3. Add `export * from './providers/dashboard';` to `index.ts`.
**Test:** `packages/contracts/src/providers/dashboard.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { dashboardStats } from './dashboard';

const now = new Date('2026-11-22T04:30:00.000Z'); // Sun 22 Nov 10:00 Colombo
describe('dashboardStats', () => {
  it('counts by status; completed this month uses the Colombo month', () => {
    const s = dashboardStats(
      [
        { status: 'pending', completedAt: null },
        { status: 'pending', completedAt: null },
        { status: 'accepted', completedAt: null },
        { status: 'completed', completedAt: '2026-10-31T18:30:00.000Z' }, // 1 Nov 00:00 Colombo → Nov
        { status: 'completed', completedAt: '2026-10-31T18:29:00.000Z' }, // 31 Oct 23:59 Colombo → Oct
        { status: 'declined', completedAt: null },
      ],
      { rating: 4.9, count: 212 },
      now,
    );
    expect(s).toEqual({ pending: 2, accepted: 1, completedThisMonth: 1, rating: 4.9, reviewCount: 212 });
  });
  it('no reviews → rating null', () => {
    expect(dashboardStats([], { rating: null, count: 0 }, now).rating).toBeNull();
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test dashboard` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): ProviderDashboard contract and stats (M10-T5)"`

### T6 — Endpoint registry entries
- [x] done
**Files:** `packages/contracts/src/endpoints.ts`, `packages/contracts/src/endpoints.test.ts`
**Context:** ARCH §2.7 (`requests_accept` example), §3.3 dashboard row, §3.4 provider rows (Roles **P**, ownership "providerId = mine else 404").
**Do:**
1. Add imports to `endpoints.ts`:
```ts
import { ProviderDashboard } from './providers/schemas';
import { ProviderRequestList, ProviderRequestListQuery } from './requests/inbox';
import { AcceptBody, AgreedPriceBody, CompleteBody, DeclineBody } from './requests/provider-bodies';
```
and `ProviderRequestView` to the `./requests/schemas` import.
2. Add these entries inside `ENDPOINTS` after `reviews_create`:
```ts
  provider_dashboard: {
    id: 'provider_dashboard',
    domain: 'providers',
    method: 'GET',
    path: '/me/provider/dashboard',
    access: ['provider'],
    owner: 'self',
    response: ProviderDashboard,
    refs: ['F-17', 'F-21', 'S20', 'L3'],
  },
  requests_inbox_list: {
    id: 'requests_inbox_list',
    domain: 'requests',
    method: 'GET',
    path: '/me/provider/requests',
    access: ['provider'],
    owner: 'self',
    query: ProviderRequestListQuery,
    response: ProviderRequestList,
    refs: ['F-17', 'F-25', 'S20', 'S21'],
  },
  requests_inbox_get: {
    id: 'requests_inbox_get',
    domain: 'requests',
    method: 'GET',
    path: '/me/provider/requests/:ref',
    access: ['provider'],
    owner: 'request_provider',
    response: ProviderRequestView,
    refs: ['F-17', 'S22'],
  },
  requests_accept: {
    id: 'requests_accept',
    domain: 'requests',
    method: 'POST',
    path: '/me/provider/requests/:ref/accept',
    access: ['provider'],
    owner: 'request_provider',
    body: AcceptBody,
    response: ProviderRequestView,
    refs: ['F-18', 'F-27', 'S20', 'S21', 'S22', 'A13'],
  },
  requests_decline: {
    id: 'requests_decline',
    domain: 'requests',
    method: 'POST',
    path: '/me/provider/requests/:ref/decline',
    access: ['provider'],
    owner: 'request_provider',
    body: DeclineBody,
    response: ProviderRequestView,
    refs: ['F-18', 'S20', 'S21', 'S22', 'A14'],
  },
  requests_complete: {
    id: 'requests_complete',
    domain: 'requests',
    method: 'POST',
    path: '/me/provider/requests/:ref/complete',
    access: ['provider'],
    owner: 'request_provider',
    body: CompleteBody,
    response: ProviderRequestView,
    refs: ['F-19', 'S22', 'A16', 'BR-32'],
  },
  requests_agreed_price: {
    id: 'requests_agreed_price',
    domain: 'requests',
    method: 'PUT',
    path: '/me/provider/requests/:ref/agreed-price',
    access: ['provider'],
    owner: 'request_provider',
    body: AgreedPriceBody,
    response: ProviderRequestView,
    refs: ['F-19', 'S22', 'A15', 'BR-12'],
  },
```
**Test:** add to `endpoints.test.ts`:
```ts
  it('M10 provider rows match ARCHITECTURE §3.3 / §3.4', () => {
    const rows = Object.fromEntries(
      Object.values(ENDPOINTS).map((d) => [`${d.method} ${d.path}`, `${d.domain} ${d.access.join(',')} ${d.owner}`]),
    );
    expect(rows).toMatchObject({
      'GET /me/provider/dashboard': 'providers provider self',
      'GET /me/provider/requests': 'requests provider self',
      'GET /me/provider/requests/:ref': 'requests provider request_provider',
      'POST /me/provider/requests/:ref/accept': 'requests provider request_provider',
      'POST /me/provider/requests/:ref/decline': 'requests provider request_provider',
      'POST /me/provider/requests/:ref/complete': 'requests provider request_provider',
      'PUT /me/provider/requests/:ref/agreed-price': 'requests provider request_provider',
    });
  });
```
**Verify:** `pnpm --filter @fixit/contracts test endpoints` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): provider dashboard and inbox endpoints (M10-T6)"`

### T7 — Fixtures: closed p01 requests and a provider with no requests
- [x] done
**Files:** `packages/fixtures/src/requests.ts`, `packages/fixtures/src/build.ts`, `packages/fixtures/src/users.ts`, `packages/fixtures/src/build.test.ts`, `apps/web/src/mocks/db/schema.ts`
**Context:** D-13; milestone AC6, AC8. `makeRequest` in `requests.ts`; refs FX-2038–FX-2040 are unused; p12 (owner `u-chathura`) has no requests and no reviews.
**Do:**
1. In `requests.ts`, `RequestSeed.steps[].actor`: change the type to `actor?: 'customer' | 'provider' | 'admin' | 'system'; // default provider (D-2)`. In `makeRequest`'s `events` map replace the `actorUserId` expression with:
```ts
          actorUserId:
            actor === 'provider'
              ? s.provider.userId
              : actor === 'admin'
                ? 'u-admin'
                : actor === 'customer'
                  ? s.customer.id
                  : null,
```
(`closedBy` already takes `last?.actor`, so a customer cancel gives `closedBy: 'customer'`.)
2. Append to `requests.ts`:
```ts
interface InboxClosedRow {
  ref: string;
  customerId: string;
  service: number; // index in p01's services
  prefDays: number;
  createdHoursAgo: number;
  steps: readonly {
    status: Exclude<RequestStatus, 'pending'>;
    hoursAgo: number;
    actor?: 'customer' | 'provider' | 'admin' | 'system';
    reason?: string;
  }[];
}

/** M10 (D-13): p01's closed requests that S22.E6 renders. */
const INBOX_CLOSED: readonly InboxClosedRow[] = [
  {
    ref: 'FX-2038',
    customerId: 'u-daniel-kim',
    service: 1,
    prefDays: 2,
    createdHoursAgo: 60,
    steps: [{ status: 'cancelled', hoursAgo: 50, actor: 'customer', reason: 'Found someone closer to home.' }],
  },
  {
    ref: 'FX-2039',
    customerId: 'u-aisha-rahman',
    service: 0,
    prefDays: -4,
    createdHoursAgo: 240,
    steps: [
      { status: 'accepted', hoursAgo: 230 },
      { status: 'cancelled', hoursAgo: 150, actor: 'admin', reason: 'The customer asked us to cancel this job.' },
    ],
  },
  {
    ref: 'FX-2040',
    customerId: 'u-sophia-nguyen',
    service: 3,
    prefDays: -8,
    createdHoursAgo: 500,
    steps: [{ status: 'expired', hoursAgo: 428, actor: 'system' }], // createdAt + 72 h
  },
];

export function buildInboxClosedRequests(
  now: Date,
  ctx: { users: readonly FxUser[]; providers: readonly FxProvider[]; services: readonly FxService[] },
): RequestRecord[] {
  const today = colomboToday(now);
  const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * HOUR);
  const p01 = ctx.providers.find((p) => p.id === 'p01');
  if (!p01) throw new Error('fixtures: p01 missing');
  return INBOX_CLOSED.map((row) => {
    const customer = ctx.users.find((u) => u.id === row.customerId);
    const service = ctx.services.find((s) => s.id === serviceId('p01', row.service));
    if (!customer || !service) throw new Error(`fixtures: bad inbox request ${row.ref}`);
    return makeRequest({
      ref: row.ref,
      customer,
      provider: p01,
      service,
      townId: 'colombo',
      preferredDate: addDays(today, row.prefDays),
      slot: 'morning',
      addressLine1: '9 Lake Drive',
      description: 'Please check the pipes under the kitchen sink.',
      createdAt: at(row.createdHoursAgo),
      steps: row.steps.map((st) => ({
        status: st.status,
        at: at(st.hoursAgo),
        ...(st.actor ? { actor: st.actor } : {}),
        ...(st.reason ? { reason: st.reason } : {}),
      })),
    });
  });
}
```
3. In `build.ts` import `buildInboxClosedRequests`, call `const inboxClosed = buildInboxClosedRequests(now, { users, providers, services });` and append `...inboxClosed` to the `requests` array.
4. In `users.ts` `DEMO_PERSONAS`, insert after the `providerNotSubmitted` entry:
```ts
  {
    key: 'providerNoRequests',
    label: 'Provider, no requests (Chathura Ranasinghe)',
    email: 'chathura@fixit.test',
    userId: 'u-chathura',
  },
```
5. In `apps/web/src/mocks/db/schema.ts` set `MOCK_DB_VERSION = 5`.
**Test:** append to `build.test.ts`:
```ts
describe('M10 inbox fixtures (D-13)', () => {
  it('p01 has every status, incl. cancelled by the customer and by Fixit, and expired', () => {
    const p01 = world.requests.filter((r) => r.providerId === 'p01');
    for (const s of ['pending', 'accepted', 'completed', 'declined', 'cancelled', 'expired'])
      expect(p01.some((r) => r.status === s)).toBe(true);
    expect(byRef('FX-2038')).toMatchObject({
      status: 'cancelled',
      closedBy: 'customer',
      reason: 'Found someone closer to home.',
    });
    expect(byRef('FX-2038')?.events.at(-1)).toMatchObject({ actor: 'customer', actorUserId: 'u-daniel-kim' });
    expect(byRef('FX-2039')).toMatchObject({ status: 'cancelled', closedBy: 'admin' });
    expect(byRef('FX-2040')).toMatchObject({ status: 'expired', closedBy: 'system' });
  });
  it('Chathura (p12) is a listed provider with no requests', () => {
    expect(world.providers.find((p) => p.id === 'p12')?.userId).toBe('u-chathura');
    expect(world.requests.some((r) => r.providerId === 'p12')).toBe(false);
  });
});
```
If `byRef` or `world` are named differently in the file, use the file's existing helpers.
**Verify:** `pnpm --filter @fixit/fixtures test` passes; `pnpm verify` green (existing web tests must stay green: the new requests use customers no test counts).
**Commit:** `git commit -m "feat(fixtures): closed p01 requests and a provider with no requests (M10-T7)"`

### T8 — Mock helpers for the provider side
- [x] done
**Files:** `src/mocks/lib/requests.ts`, `src/mocks/lib/requests.test.ts`
**Context:** ARCH §4.3 mock rules; D-3, D-4, D-10. Existing `customerViewOf`, `transitionOr409` in the same file.
**Do:** Add to `src/mocks/lib/requests.ts` (merge imports: `compareInbox, displayNameOf, matchesInboxSearch, PAGE_SIZE, toProviderView, type InboxCounts, type ProviderRequestList, type ProviderRequestListQuery, type ProviderRequestView, type RequestActor` from `@fixit/contracts`; `type FxProvider` from `@fixit/fixtures`):
```ts
/** The caller's published listing. assertAccess already required role provider, so a miss is a server bug. */
export function ownProvider(d: MockDb, userId: string): FxProvider {
  const p = Object.values(d.providers).find((x) => x.userId === userId && x.onboardingComplete);
  if (!p) throw mockError(403, 'FORBIDDEN', 'No published listing');
  return p;
}

/** Another provider's or an unknown ref → 404, never 403 (ARCH §3). */
export function ownInboxRequest(d: MockDb, providerId: string, ref: string): RequestRecord {
  const r = Object.values(d.requests).find((x) => x.ref === ref && x.providerId === providerId);
  if (!r) throw mockError(404, 'NOT_FOUND', 'Request not found');
  return r;
}

export function providerViewOf(d: MockDb, r: RequestRecord, now: Date): ProviderRequestView {
  const customer = d.users[r.customerId];
  if (!customer) throw mockError(500, 'INTERNAL', `Request ${r.ref} references a missing customer`);
  const town = d.towns.find((t) => t.id === r.townId);
  const reviews = Object.values(d.reviews).filter((x) => x.requestId === r.id);
  const visible = reviews.find((x) => x.visibility === 'visible');
  return toProviderView(
    r,
    {
      customer: { fullName: customer.fullName },
      town: { id: r.townId, name: town?.name ?? r.townId },
      review: visible
        ? {
            id: visible.id,
            rating: visible.rating,
            authorDisplayName: displayNameOf(d.users[visible.authorId]?.fullName ?? ''),
          }
        : null,
      reviewed: reviews.length > 0,
    },
    now,
  );
}

/** GET /me/provider/requests: own rows, search (D-3), counts after search (D-4), S21 order, 20 per page. */
export function inboxList(
  d: MockDb,
  providerId: string,
  q: ProviderRequestListQuery,
  now: Date,
): ProviderRequestList {
  const nameOf = (r: RequestRecord) => d.users[r.customerId]?.fullName ?? '';
  const mine = Object.values(d.requests).filter(
    (r) =>
      r.providerId === providerId &&
      matchesInboxSearch(q.q, { ref: r.ref, status: r.status, customerFullName: nameOf(r) }),
  );
  const counts: InboxCounts = {
    all: mine.length,
    pending: 0,
    accepted: 0,
    completed: 0,
    declined: 0,
    cancelled: 0,
    expired: 0,
  };
  for (const r of mine) counts[r.status] += 1;
  const filtered = (q.status === 'all' ? mine : mine.filter((r) => r.status === q.status)).sort(
    compareInbox(q.status),
  );
  const pageSize = PAGE_SIZE.providerRequests;
  const start = (q.page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize).map((r) => providerViewOf(d, r, now)),
    page: q.page,
    pageSize,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize),
    counts,
  };
}

/** Applies an already-checked transition: status, closedBy, reason, timestamps, history event. */
export function applyTransition(
  r: RequestRecord,
  to: Exclude<RequestStatus, 'pending'>,
  actor: RequestActor,
  actorUserId: string | null,
  now: Date,
  reason: string | null = null,
): void {
  const at = now.toISOString();
  r.status = to;
  if (to !== 'accepted') r.closedBy = actor;
  if (to === 'declined' || to === 'cancelled') r.reason = reason;
  if (to === 'completed') r.completedAt = at;
  r.updatedAt = at;
  r.events.push({ status: to, at, actor, actorUserId, reason });
}
```
Note: `closedBy` for `completed` is `'provider'` — the fixtures already do this (makeRequest sets the last actor for every final status).
**Test:** append to `src/mocks/lib/requests.test.ts` (add `beforeEach/afterEach` fake timers at `FIXED_NOW` if the file doesn't already; `db()` from `../db/store`):
```ts
describe('inboxList (p01)', () => {
  const q = (o: Partial<{ status: InboxStatus; q: string; page: number }> = {}) =>
    inboxList(db(), 'p01', { status: 'all', q: '', page: 1, ...o }, FIXED_NOW);
  it('counts every status; pending tab is most urgent first', () => {
    const all = q();
    expect(all.counts).toMatchObject({ pending: 3, accepted: 2, declined: 1, cancelled: 2, expired: 1 });
    expect(q({ status: 'pending' }).items.map((r) => r.ref)).toEqual(['FX-2058', 'FX-2059', 'FX-2061']);
  });
  it('all tab: newest first, 20 per page', () => {
    const all = q();
    expect(all.items[0]?.ref).toBe('FX-2061');
    expect(all.items).toHaveLength(20);
    expect(all.totalPages).toBe(Math.ceil(all.total / 20));
  });
  it('search uses the visible name (D-3) and counts follow it (D-4)', () => {
    const r = q({ q: 'martinez' });
    expect(r.items.map((x) => x.ref)).toEqual(['FX-2046']);
    expect(r.counts.all).toBe(1);
    expect(q({ q: 'olivia m' }).items.map((x) => x.ref)).toContain('FX-2061');
  });
  it('pending views carry no contact keys', () => {
    const v = q({ status: 'pending' }).items[0];
    expect(v?.customer).toEqual({ revealed: false, displayName: expect.any(String) });
  });
});
```
(import `InboxStatus` type from `@fixit/contracts`, `inboxList` from `./requests`.)
**Verify:** `pnpm --filter @fixit/web test src/mocks/lib/requests` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock helpers for the provider inbox (M10-T8)"`

### T9 — Mock handlers: inbox list and detail
- [x] done
**Files:** `src/mocks/handlers/requests.ts`, `src/mocks/handlers/requests-inbox.test.ts`
**Context:** ARCH §3.4 rows 7–8; mock rules (expiry sweep at the start of reads).
**Do:** Add to `requestsHandlers` (import `ownInboxRequest, ownProvider, inboxList, providerViewOf` from `../lib/requests`):
```ts
  mockEndpoint(E.requests_inbox_list, ({ db: d, actor, query, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const p = ownProvider(d, actor.userId);
    return inboxList(d, p.id, query, now);
  }),

  mockEndpoint(E.requests_inbox_get, ({ db: d, actor, params, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const p = ownProvider(d, actor.userId);
    return providerViewOf(d, ownInboxRequest(d, p.id, params.ref ?? ''), now);
  }),
```
**Test:** `src/mocks/handlers/requests-inbox.test.ts`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderRequestList, ProviderRequestView } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const get = (path: string, persona?: PersonaKey) =>
  fetch(new URL(`/api${path}`, window.location.origin), {
    headers: persona ? { Authorization: `Bearer ${signInAs(persona).accessToken}` } : {},
  });

describe('GET /me/provider/requests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('Marcus: own requests, counts, pending order', async () => {
    const res = await get('/me/provider/requests?status=pending', 'provider');
    expect(res.status).toBe(200);
    const list = ProviderRequestList.parse(await res.json());
    expect(list.counts.pending).toBe(3);
    expect(list.items.map((r) => r.ref)).toEqual(['FX-2058', 'FX-2059', 'FX-2061']);
  });
  it('raw JSON of a pending row has no contact fields (§6.3)', async () => {
    const raw = (await (await get('/me/provider/requests?q=FX-2061', 'provider')).json()) as {
      items: { customer: Record<string, unknown> }[];
    };
    expect(Object.keys(raw.items[0]?.customer ?? {}).sort()).toEqual(['displayName', 'revealed']);
  });
  it('a provider with no requests gets an empty list', async () => {
    const list = ProviderRequestList.parse(await (await get('/me/provider/requests', 'providerNoRequests')).json());
    expect([list.items.length, list.counts.all]).toEqual([0, 0]);
  });
  it('anonymous 401, customer 403, admin 403', async () => {
    expect((await get('/me/provider/requests')).status).toBe(401);
    expect((await get('/me/provider/requests', 'customer')).status).toBe(403);
    expect((await get('/me/provider/requests', 'admin')).status).toBe(403);
  });
});

describe('GET /me/provider/requests/:ref', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('own pending → Olivia M.', async () => {
    const v = ProviderRequestView.parse(await (await get('/me/provider/requests/FX-2061', 'provider')).json());
    expect(v.customer).toEqual({ revealed: false, displayName: 'Olivia M.' });
  });
  it('own completed → full contact', async () => {
    const v = ProviderRequestView.parse(await (await get('/me/provider/requests/FX-2046', 'provider')).json());
    expect(v.customer).toMatchObject({ revealed: true, fullName: 'Olivia Martinez' });
  });
  it("another provider's ref → 404, never 403", async () => {
    expect((await get('/me/provider/requests/FX-2061', 'providerNotSubmitted')).status).toBe(404);
    expect((await get('/me/provider/requests/FX-9999', 'provider')).status).toBe(404);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test requests-inbox` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock provider inbox list and detail (M10-T9)"`

### T10 — Mock handler: accept
- [x] done
**Files:** `src/mocks/handlers/requests.ts`, `src/mocks/handlers/requests-provider-actions.test.ts`
**Context:** A13, F-18, F-27, BR-12; D-5. `transitionOr409` (409 with `details.reason` + `details.status`).
**Do:** Add to `requestsHandlers` (import `applyTransition`):
```ts
  mockEndpoint(E.requests_accept, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    const r = ownInboxRequest(d, p.id, params.ref ?? '');
    // D-5: no sweep first — a lapsed Pending is refused `expired` by the state machine.
    transitionOr409(r, 'accepted', { kind: 'provider', userId: actor.userId }, now);
    applyTransition(r, 'accepted', 'provider', actor.userId, now);
    r.agreedPrice = body.agreedPrice ?? null;
    return providerViewOf(d, r, now);
  }),
```
**Test:** `src/mocks/handlers/requests-provider-actions.test.ts`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerRequestView, ErrorEnvelope, Me, ProviderRequestView } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

export const call = (method: 'GET' | 'POST' | 'PUT', path: string, persona?: PersonaKey, body?: unknown) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (persona) headers.Authorization = `Bearer ${signInAs(persona).accessToken}`;
  return fetch(new URL(`/api${path}`, window.location.origin), {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
};
const view = async (res: Response) => ProviderRequestView.parse(await res.json());
const err = async (res: Response) => ErrorEnvelope.parse(await res.json()).error;

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('POST …/accept (A13)', () => {
  it('pending → accepted with a price; contact revealed both ways; pending count −1', async () => {
    const res = await call('POST', '/me/provider/requests/FX-2061/accept', 'provider', { agreedPrice: 6500 });
    expect(res.status).toBe(200);
    const v = await view(res);
    expect([v.status, v.agreedPrice]).toEqual(['accepted', 6500]);
    expect(v.customer).toMatchObject({ revealed: true, fullName: 'Olivia Martinez' });
    expect(v.history.at(-1)).toMatchObject({ status: 'accepted', actor: 'provider' });
    const olivia = CustomerRequestView.parse(await (await call('GET', '/me/requests/FX-2061', 'customer')).json());
    expect(olivia.agreedPrice).toBe(6500);
    expect(olivia.provider.mobile).not.toBeNull();
    const me = Me.parse(await (await call('GET', '/auth/me', 'provider')).json());
    expect(me.provider?.pendingRequestCount).toBe(2);
  });
  it('no price → agreedPrice null', async () => {
    expect((await view(await call('POST', '/me/provider/requests/FX-2059/accept', 'provider', {}))).agreedPrice).toBeNull();
  });
  it('6.5 → 400 with the SPEC message', async () => {
    const res = await call('POST', '/me/provider/requests/FX-2061/accept', 'provider', { agreedPrice: 6.5 });
    expect(res.status).toBe(400);
    expect((await err(res)).fieldErrors?.agreedPrice).toEqual(['Enter a whole amount in rupees, like 6500.']);
  });
  it('already accepted → 409 invalid_transition', async () => {
    const res = await call('POST', '/me/provider/requests/FX-2054/accept', 'provider', {});
    expect(res.status).toBe(409);
    expect(await err(res)).toMatchObject({ code: 'INVALID_TRANSITION', details: { reason: 'invalid_transition', status: 'accepted' } });
  });
  it('lapsed pending (sweep not run) → 409 expired (AC10, D-5)', async () => {
    vi.setSystemTime(new Date(FIXED_NOW.getTime() + 71 * 3_600_000));
    const res = await call('POST', '/me/provider/requests/FX-2061/accept', 'provider', {});
    expect(res.status).toBe(409);
    expect((await err(res)).details?.reason).toBe('expired');
  });
  it('other provider 404, customer 403, anonymous 401', async () => {
    expect((await call('POST', '/me/provider/requests/FX-2061/accept', 'providerNotSubmitted', {})).status).toBe(404);
    expect((await call('POST', '/me/provider/requests/FX-2061/accept', 'customer', {})).status).toBe(403);
    expect((await call('POST', '/me/provider/requests/FX-2061/accept', undefined, {})).status).toBe(401);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test requests-provider-actions` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock accept request (M10-T10)"`

### T11 — Mock handler: decline
- [x] done
**Files:** `src/mocks/handlers/requests.ts`, `src/mocks/handlers/requests-provider-actions.test.ts`
**Context:** A14, F-18; S15 shows the reason to the customer.
**Do:** Add to `requestsHandlers`:
```ts
  mockEndpoint(E.requests_decline, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    const r = ownInboxRequest(d, p.id, params.ref ?? '');
    transitionOr409(r, 'declined', { kind: 'provider', userId: actor.userId }, now); // D-5
    applyTransition(r, 'declined', 'provider', actor.userId, now, body.reason ?? null);
    return providerViewOf(d, r, now);
  }),
```
**Test:** append to `requests-provider-actions.test.ts`:
```ts
describe('POST …/decline (A14)', () => {
  it('pending → declined with reason; Olivia sees the reason; contact stays hidden', async () => {
    const v = await view(
      await call('POST', '/me/provider/requests/FX-2061/decline', 'provider', { reason: 'Not available that week.' }),
    );
    expect([v.status, v.reason, v.closedBy]).toEqual(['declined', 'Not available that week.', 'provider']);
    expect(v.customer).toEqual({ revealed: false, displayName: 'Olivia M.' });
    const olivia = CustomerRequestView.parse(await (await call('GET', '/me/requests/FX-2061', 'customer')).json());
    expect([olivia.status, olivia.reason]).toEqual(['declined', 'Not available that week.']);
  });
  it('empty reason → null', async () => {
    expect((await view(await call('POST', '/me/provider/requests/FX-2059/decline', 'provider', { reason: '' }))).reason).toBeNull();
  });
  it('accepted → 409', async () => {
    expect((await call('POST', '/me/provider/requests/FX-2050/decline', 'provider', {})).status).toBe(409);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test requests-provider-actions` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock decline request (M10-T11)"`

### T12 — Mock handler: complete
- [x] done
**Files:** `src/mocks/handlers/requests.ts`, `src/mocks/handlers/requests-provider-actions.test.ts`
**Context:** A16, F-19, BR-32 (`before_preferred_date`); D-11.
**Do:** Add to `requestsHandlers`:
```ts
  mockEndpoint(E.requests_complete, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    const r = ownInboxRequest(d, p.id, params.ref ?? '');
    transitionOr409(r, 'completed', { kind: 'provider', userId: actor.userId }, now);
    if (body.agreedPrice !== undefined) r.agreedPrice = body.agreedPrice; // D-11: omitted = unchanged
    applyTransition(r, 'completed', 'provider', actor.userId, now);
    return providerViewOf(d, r, now);
  }),
```
**Test:** append:
```ts
describe('POST …/complete (A16)', () => {
  it('accepted on its preferred date → completed, review window open', async () => {
    const v = await view(await call('POST', '/me/provider/requests/FX-2054/complete', 'provider', { agreedPrice: 4000 }));
    expect([v.status, v.agreedPrice, v.completedAt]).toEqual(['completed', 4000, FIXED_NOW.toISOString()]);
    expect(v.reviewDeadline).toBe(new Date(FIXED_NOW.getTime() + 30 * 86_400_000).toISOString());
    expect(v.canComplete).toBe(false);
  });
  it('no price → keeps the existing price', async () => {
    const v = await view(await call('POST', '/me/provider/requests/FX-2054/complete', 'provider', {}));
    expect(v.agreedPrice).toBe(3500);
  });
  it('before the preferred date → 409 before_preferred_date (BR-32)', async () => {
    const res = await call('POST', '/me/provider/requests/FX-2050/complete', 'provider', {});
    expect(res.status).toBe(409);
    expect((await err(res)).details?.reason).toBe('before_preferred_date');
  });
  it('pending → 409 invalid_transition', async () => {
    expect((await err(await call('POST', '/me/provider/requests/FX-2061/complete', 'provider', {}))).details?.reason).toBe(
      'invalid_transition',
    );
  });
});
```
**Verify:** `pnpm --filter @fixit/web test requests-provider-actions` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock mark request completed (M10-T12)"`

### T13 — Mock handler: agreed price
- [x] done
**Files:** `src/mocks/handlers/requests.ts`, `src/mocks/handlers/requests-provider-actions.test.ts`
**Context:** A15, F-19, BR-12; ARCH §3.4 "mine; status accepted". Not a status change, so no event.
**Do:** Add to `requestsHandlers`:
```ts
  mockEndpoint(E.requests_agreed_price, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    const r = ownInboxRequest(d, p.id, params.ref ?? '');
    if (r.status !== 'accepted')
      throw mockError(409, 'INVALID_TRANSITION', 'Agreed price can only change while Accepted', {
        details: { reason: 'invalid_transition', status: r.status },
      });
    r.agreedPrice = body.agreedPrice;
    r.updatedAt = now.toISOString();
    return providerViewOf(d, r, now);
  }),
```
**Test:** append:
```ts
describe('PUT …/agreed-price (A15)', () => {
  it('sets and clears the price; Olivia-side view shows it', async () => {
    expect((await view(await call('PUT', '/me/provider/requests/FX-2050/agreed-price', 'provider', { agreedPrice: 8000 }))).agreedPrice).toBe(8000);
    expect((await view(await call('PUT', '/me/provider/requests/FX-2050/agreed-price', 'provider', { agreedPrice: null }))).agreedPrice).toBeNull();
  });
  it('completed → 409', async () => {
    expect((await call('PUT', '/me/provider/requests/FX-2046/agreed-price', 'provider', { agreedPrice: 1 })).status).toBe(409);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test requests-provider-actions` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock set agreed price (M10-T13)"`

### T14 — Mock handler: provider dashboard
- [x] done
**Files:** `src/mocks/handlers/providers.ts`, `src/mocks/handlers/providers.test.ts`, `src/mocks/handlers/index.ts`
**Context:** ARCH §3.3 dashboard row; D-1, D-2.
**Do:**
1. Create `src/mocks/handlers/providers.ts`:
```ts
import { dashboardStats, ENDPOINTS as E } from '@fixit/contracts';
import { expireDue } from '../db/expire';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
import { ownProvider } from '../lib/requests';

export const providersHandlers = [
  mockEndpoint(E.provider_dashboard, ({ db: d, actor, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const p = ownProvider(d, actor.userId);
    const records = Object.values(d.requests).filter((r) => r.providerId === p.id);
    return {
      stats: dashboardStats(records, { rating: p.ratingAvg, count: p.reviewCount }, now),
      services: Object.values(d.services)
        .filter((s) => s.providerId === p.id)
        .map((s) => ({ id: s.id, name: s.name, price: s.price, unit: s.unit })),
      checklist: null, // D-1: M24
    };
  }),
];
```
2. In `handlers/index.ts`: `import { providersHandlers } from './providers';` and set `providers: providersHandlers,`.
**Test:** `src/mocks/handlers/providers.test.ts`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dashboardStats, ProviderDashboard } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const get = (persona?: PersonaKey) =>
  fetch(new URL('/api/me/provider/dashboard', window.location.origin), {
    headers: persona ? { Authorization: `Bearer ${signInAs(persona).accessToken}` } : {},
  });

describe('GET /me/provider/dashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('Marcus: tiles and services', async () => {
    const dash = ProviderDashboard.parse(await (await get('provider')).json());
    const expected = dashboardStats(
      Object.values(db().requests).filter((r) => r.providerId === 'p01'),
      { rating: 4.9, count: 212 },
      FIXED_NOW,
    );
    expect(dash.stats).toEqual(expected);
    expect(dash.stats).toMatchObject({ pending: 3, accepted: 2, rating: 4.9, reviewCount: 212 });
    expect(dash.stats.completedThisMonth).toBeGreaterThan(0);
    expect(dash.services[0]).toMatchObject({ name: 'Leak repair', price: 2500, unit: 'per_hour' });
    expect(dash.checklist).toBeNull();
  });
  it('a provider with no requests or reviews', async () => {
    const dash = ProviderDashboard.parse(await (await get('providerNoRequests')).json());
    expect(dash.stats).toEqual({ pending: 0, accepted: 0, completedThisMonth: 0, rating: null, reviewCount: 0 });
  });
  it('customer 403, anonymous 401', async () => {
    expect((await get('customer')).status).toBe(403);
    expect((await get()).status).toBe(401);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test handlers/providers` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock provider dashboard (M10-T14)"`

### T15 — Query keys and a shared `refreshMe`
- [x] done
**Files:** `src/lib/query-keys.ts`, `src/features/auth/hooks.ts`, `src/features/requests/hooks.ts`
**Context:** ARCH §4.2 (`qk.inbox`, `qk.dashboard`); milestone note "refetch `/auth/me` after accept/decline".
**Do:**
1. In `query-keys.ts` add `ProviderRequestListQuery` to the type import and these keys inside `qk`:
```ts
  inbox: {
    all: ['requests', 'inbox'] as const,
    list: (q: ProviderRequestListQuery) => ['requests', 'inbox', 'list', q] as const,
    detail: (ref: string) => ['requests', 'inbox', ref] as const,
  },
  dashboard: ['providers', 'dashboard'] as const,
```
2. In `features/auth/hooks.ts` add (import `type QueryClient` from `@tanstack/react-query`):
```ts
/** Re-reads `me` after an action that changes its counters (openRequestCount, pendingRequestCount). Failures are ignored. */
export function refreshMe(qc: QueryClient): void {
  void fetchMe()
    .then((me) => {
      authStore.setMe(me);
      qc.setQueryData(qk.me, me);
    })
    .catch(() => undefined);
}
```
3. In `features/requests/hooks.ts` delete the local `refreshMe` function and `import { refreshMe } from '@/features/auth/hooks';`. Remove the now-unused `fetchMe`/`authStore` imports.
**Verify:** `pnpm --filter @fixit/web test features/requests features/auth` passes unchanged; `pnpm verify` green.
**Commit:** `git commit -m "refactor(web): inbox/dashboard query keys and shared refreshMe (M10-T15)"`

### T16 — Format helpers
- [x] done
**Files:** `src/lib/format.ts`, `src/lib/format.test.ts`
**Context:** S21 `Reply by {Sat 3:42 PM}`; S20.E6 `in {November}`.
**Do:** Append to `format.ts`:
```ts
/** S21 `Sat 3:42 PM` (Reply by …). */
export const formatReplyBy = (value: string | Date): string => formatInColombo(toInstant(value), 'EEE h:mm a');

/** S20.E6 `November` (Colombo month of the instant). */
export const formatMonthName = (value: string | Date): string => formatInColombo(toInstant(value), 'MMMM');
```
**Test:** append to `format.test.ts`:
```ts
describe('M10 formats', () => {
  it('formatReplyBy', () => {
    expect(formatReplyBy('2026-11-23T22:30:00.000Z')).toBe('Tue 4:00 AM');
  });
  it('formatMonthName uses Colombo', () => {
    expect(formatMonthName('2026-10-31T18:30:00.000Z')).toBe('November');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test lib/format` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): reply-by and month formatters (M10-T16)"`

### T17 — Provider dashboard API and query hooks
- [x] done
**Files:** `src/features/provider-dashboard/api.ts`, `src/features/provider-dashboard/hooks.ts`, `src/features/provider-dashboard/hooks.test.tsx`
**Context:** ARCH §4.2 (api/hook pattern), SPEC §6.11 (refetch on focus + every 60 s on S20/S21/S22).
**Do:**
1. Create `api.ts`:
```ts
import {
  ENDPOINTS as E,
  type AcceptBody,
  type AgreedPriceBody,
  type CompleteBody,
  type DeclineBody,
  type ProviderDashboard,
  type ProviderRequestList,
  type ProviderRequestListQuery,
  type ProviderRequestView,
} from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export const fetchDashboard = (): Promise<ProviderDashboard> =>
  http(pathOf(E.provider_dashboard), { schema: E.provider_dashboard.response });

export const fetchInbox = (q: ProviderRequestListQuery): Promise<ProviderRequestList> =>
  http(pathOf(E.requests_inbox_list), {
    query: { status: q.status, q: q.q === '' ? undefined : q.q, page: q.page },
    schema: E.requests_inbox_list.response,
  });

export const fetchInboxRequest = (ref: string): Promise<ProviderRequestView> =>
  http(pathOf(E.requests_inbox_get, { ref }), { schema: E.requests_inbox_get.response });

export const acceptRequest = (ref: string, body: AcceptBody): Promise<ProviderRequestView> =>
  http(pathOf(E.requests_accept, { ref }), { method: 'POST', body, schema: E.requests_accept.response });

export const declineRequest = (ref: string, body: DeclineBody): Promise<ProviderRequestView> =>
  http(pathOf(E.requests_decline, { ref }), { method: 'POST', body, schema: E.requests_decline.response });

export const completeRequest = (ref: string, body: CompleteBody): Promise<ProviderRequestView> =>
  http(pathOf(E.requests_complete, { ref }), { method: 'POST', body, schema: E.requests_complete.response });

export const setAgreedPrice = (ref: string, body: AgreedPriceBody): Promise<ProviderRequestView> =>
  http(pathOf(E.requests_agreed_price, { ref }), { method: 'PUT', body, schema: E.requests_agreed_price.response });
```
2. Create `hooks.ts`:
```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ProviderRequestListQuery } from '@fixit/contracts';
import { qk } from '@/lib/query-keys';
import { fetchDashboard, fetchInbox, fetchInboxRequest } from './api';

/** SPEC §6.11: provider screens refetch on focus and every 60 s. */
const LIVE = { refetchInterval: 60_000, refetchOnWindowFocus: true } as const;

export const useDashboard = () => useQuery({ queryKey: qk.dashboard, queryFn: fetchDashboard, ...LIVE });

export const useInbox = (q: ProviderRequestListQuery) =>
  useQuery({ queryKey: qk.inbox.list(q), queryFn: () => fetchInbox(q), placeholderData: keepPreviousData, ...LIVE });

export const useInboxRequest = (ref: string) =>
  useQuery({ queryKey: qk.inbox.detail(ref), queryFn: () => fetchInboxRequest(ref), retry: false, ...LIVE });
```
**Test:** `hooks.test.tsx`
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '@/lib/http';
import { FIXED_NOW } from '@/test/fixed-now';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useDashboard, useInbox, useInboxRequest } from './hooks';

describe('provider dashboard queries', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    signInAs('provider');
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('useDashboard loads the stats', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.data?.stats.pending).toBe(3);
    });
  });
  it('useInbox passes status and q', async () => {
    const { result } = renderHook(() => useInbox({ status: 'pending', q: 'fx-2059', page: 1 }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.data?.items.map((r) => r.ref)).toEqual(['FX-2059']);
    });
  });
  it('useInboxRequest: unknown ref is an ApiError 404', async () => {
    const { result } = renderHook(() => useInboxRequest('FX-9999'), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(ApiError);
    });
    expect((result.current.error as ApiError).status).toBe(404);
  });
});
```
If the `as ApiError` cast is rejected by lint, replace the last assertion with `expect(result.current.error).toMatchObject({ status: 404 });`.
**Verify:** `pnpm --filter @fixit/web test provider-dashboard/hooks` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): provider dashboard api and query hooks (M10-T17)"`

### T18 — Mutation hooks
- [x] done
**Files:** `src/features/provider-dashboard/hooks.ts`, `src/features/provider-dashboard/hooks.test.tsx`
**Context:** ARCH §4.2 `useAcceptRequest` (setQueryData + domain-wide invalidation), milestone note (refetch `/auth/me` after accept/decline), D-7 (no explicit flash).
**Do:** Append to `hooks.ts` (merge imports: `useMutation, useQueryClient, type QueryClient`; types `AcceptBody, AgreedPriceBody, CompleteBody, DeclineBody, ProviderRequestView`; `refreshMe` from `@/features/auth/hooks`; `acceptRequest, completeRequest, declineRequest, setAgreedPrice` from `./api`):
```ts
/** After any provider action: the detail takes the server view; lists and tiles refetch; the badge (me) optionally. */
function afterChange(qc: QueryClient, view: ProviderRequestView, me: boolean): void {
  qc.setQueryData(qk.inbox.detail(view.ref), view);
  void qc.invalidateQueries({ queryKey: [...qk.inbox.all, 'list'] });
  void qc.invalidateQueries({ queryKey: qk.dashboard });
  if (me) refreshMe(qc); // pendingRequestCount → sidebar + top-bar badge
}

type Vars<B> = { ref: string; body: B };

/** A13 — not optimistic (SPEC §6.5). */
export function useAcceptRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, body }: Vars<AcceptBody>) => acceptRequest(ref, body),
    onSuccess: (view) => {
      afterChange(qc, view, true);
    },
  });
}

/** A14 — not optimistic, no Undo. */
export function useDeclineRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, body }: Vars<DeclineBody>) => declineRequest(ref, body),
    onSuccess: (view) => {
      afterChange(qc, view, true);
    },
  });
}

/** A16. */
export function useCompleteRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, body }: Vars<CompleteBody>) => completeRequest(ref, body),
    onSuccess: (view) => {
      afterChange(qc, view, false);
    },
  });
}

/** A15. */
export function useSetAgreedPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, body }: Vars<AgreedPriceBody>) => setAgreedPrice(ref, body),
    onSuccess: (view) => {
      afterChange(qc, view, false);
    },
  });
}
```
**Test:** append to `hooks.test.tsx`:
```tsx
describe('provider mutations', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    signInAs('provider');
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('accept caches the revealed view and refreshes the badge count', async () => {
    const qc = createTestQueryClient();
    const { result } = renderHook(() => useAcceptRequest(), { wrapper: createWrapper(qc) });
    result.current.mutate({ ref: 'FX-2061', body: { agreedPrice: 6500 } });
    await waitFor(() => {
      expect(qc.getQueryData<ProviderRequestView>(qk.inbox.detail('FX-2061'))?.customer.revealed).toBe(true);
    });
    await waitFor(() => {
      expect(authStore.getState().me?.provider?.pendingRequestCount).toBe(2);
    });
  });
  it('decline, complete and agreed price return the new view', async () => {
    const wrapper = createWrapper();
    const d = renderHook(() => useDeclineRequest(), { wrapper });
    await expect(d.result.current.mutateAsync({ ref: 'FX-2059', body: {} })).resolves.toMatchObject({ status: 'declined' });
    const c = renderHook(() => useCompleteRequest(), { wrapper });
    await expect(c.result.current.mutateAsync({ ref: 'FX-2054', body: {} })).resolves.toMatchObject({ status: 'completed' });
    const p = renderHook(() => useSetAgreedPrice(), { wrapper });
    await expect(p.result.current.mutateAsync({ ref: 'FX-2050', body: { agreedPrice: 8000 } })).resolves.toMatchObject({
      agreedPrice: 8000,
    });
  });
});
```
(imports: `createTestQueryClient` from `@/test/render`, `qk`, `authStore`, `type ProviderRequestView`.)
**Verify:** `pnpm --filter @fixit/web test provider-dashboard/hooks` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): accept, decline, complete and agreed price mutations (M10-T18)"`

### T19 — Row flash store and `DataList.rowClassName`
- [x] done
**Files:** `src/lib/row-flash.ts`, `src/lib/row-flash.test.tsx`, `src/components/data-list.tsx`
**Context:** SPEC §2.8 (row flash .3 s fade, held 900 ms), §6.11, ARCH §5.5 (`useRowFlash` keyed by ref), D-7.
**Do:**
1. Create `src/lib/row-flash.ts`:
```ts
import { useEffect, useRef, useSyncExternalStore } from 'react';

export const ROW_FLASH_MS = 900; // SPEC §2.8

let snapshot: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();
const emit = (next: ReadonlySet<string>) => {
  snapshot = next;
  for (const l of listeners) l();
};

/** Marks a row (by ref) as flashing for 900 ms. */
export function flashRow(key: string): void {
  emit(new Set([...snapshot, key]));
  setTimeout(() => {
    emit(new Set([...snapshot].filter((k) => k !== key)));
  }, ROW_FLASH_MS);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** The refs flashing right now. */
export const useFlashingRows = (): ReadonlySet<string> => useSyncExternalStore(subscribe, () => snapshot);

/** D-7 / SPEC §6.11: flash every row whose status changed since this list last rendered it. */
export function useFlashOnStatusChange(rows: readonly { ref: string; status: string }[]): void {
  const last = useRef(new Map<string, string>());
  useEffect(() => {
    for (const r of rows) {
      const prev = last.current.get(r.ref);
      if (prev !== undefined && prev !== r.status) flashRow(r.ref);
      last.current.set(r.ref, r.status);
    }
  }, [rows]);
}
```
2. In `components/data-list.tsx` add the prop to `DataListProps<T>`:
```ts
  /** Extra classes per row/card, e.g. the status-change flash. */
  rowClassName?: (row: T) => string | undefined;
```
destructure it, and append `rowClassName?.(row)` as the last argument of `cn(...)` on both the `<tr>` and the phone `<li>`. Add `transition-colors duration-300` to both base class lists.
**Test:** `src/lib/row-flash.test.tsx`
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { flashRow, ROW_FLASH_MS, useFlashingRows, useFlashOnStatusChange } from './row-flash';

describe('row flash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('flashRow holds for 900 ms', () => {
    const { result } = renderHook(() => useFlashingRows());
    act(() => {
      flashRow('FX-1');
    });
    expect(result.current.has('FX-1')).toBe(true);
    act(() => {
      vi.advanceTimersByTime(ROW_FLASH_MS);
    });
    expect(result.current.has('FX-1')).toBe(false);
  });
  it('flashes only rows whose status changed', () => {
    const flashing = renderHook(() => useFlashingRows());
    const { rerender } = renderHook(({ rows }) => {
      useFlashOnStatusChange(rows);
    }, { initialProps: { rows: [{ ref: 'FX-2', status: 'pending' }, { ref: 'FX-3', status: 'pending' }] } });
    expect(flashing.result.current.size).toBe(0);
    rerender({ rows: [{ ref: 'FX-2', status: 'accepted' }, { ref: 'FX-3', status: 'pending' }] });
    expect([...flashing.result.current]).toEqual(['FX-2']);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test row-flash data-list` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): row flash store and DataList row classes (M10-T19)"`

### T20 — Move shared request components
- [x] done
**Files:** `src/components/conflict-dialog.tsx`, `src/components/contact-block.tsx`, `src/components/request-history.tsx` (moved from `src/features/requests/components/`), `src/features/requests/pages/customer-request-page.tsx`, `src/features/requests/components/status-panel-card.tsx`
**Context:** D-12; CLAUDE.md "Component shared by 2+ features → `apps/web/src/components/`".
**Do:**
1. `git mv src/features/requests/components/conflict-dialog.tsx src/components/conflict-dialog.tsx` (no code change; update the doc comment to `§6.3 conflict: the request changed while the user was acting on it.`).
2. `git mv src/features/requests/components/contact-block.tsx src/components/contact-block.tsx`; change the props to `{ label, mobile }: { label: string; mobile: string }` and render `{label}` where it rendered `` `${businessName}'s mobile` ``. In `status-panel-card.tsx` pass `label={`${view.provider.businessName}'s mobile`}`.
3. `git mv src/features/requests/components/request-history.tsx src/components/request-history.tsx`; replace the props with:
```ts
{
  history: readonly StatusEvent[];
  actorLabel: (actor: RequestActor) => string;
}
```
(import `type RequestActor, type StatusEvent` from `@fixit/contracts`; drop the `../history` import) and render `{actorLabel(e.actor)}`. Update the doc comment to `S15.E7 / S22.E7, oldest first.`
4. In `customer-request-page.tsx` import the three from `@/components/...` and pass `actorLabel={(a) => actorLabel(a, v.provider.businessName)}` (import `actorLabel` from `../history`).
**Verify:** `pnpm --filter @fixit/web test features/requests` passes unchanged; `pnpm verify` green.
**Commit:** `git commit -m "refactor(web): share conflict dialog, contact block and history (M10-T20)"`

### T21 — Provider copy helpers
- [x] done
**Files:** `src/features/provider-dashboard/copy.ts`, `src/features/provider-dashboard/copy.test.ts`
**Context:** S20.E2 (morning 05:00–11:59, afternoon 12:00–16:59, evening otherwise; Colombo), S20.E3, S22.E1 notes, S22.E6, S22.E7 actors; D-8, D-9.
**Do:** Create `copy.ts`:
```ts
import { formatInColombo, type ProviderRequestView, type RequestActor, type RequestStatus } from '@fixit/contracts';
import { formatDateLong } from '@/lib/format';

/** S20.E2 (Asia/Colombo hour). */
export function greeting(now: Date, firstName: string): string {
  const h = Number(formatInColombo(now, 'H'));
  const part = h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : 'evening';
  return `Good ${part}, ${firstName}`;
}

/** S20.E3. */
export function greetingSub(pending: number): string {
  if (pending === 0) return "You're all caught up.";
  if (pending === 1) return 'You have 1 new request waiting for a reply.';
  return `You have ${String(pending)} new requests waiting for a reply.`;
}

/** D-8: `Olivia M.` → `Olivia`; `Marcus Bell` → `Marcus`. */
export const firstNameOf = (name: string): string => name.trim().split(/\s+/)[0] ?? name;

/** Table/card name: full name once revealed, else `Olivia M.` (§6.3). */
export const customerName = (v: Pick<ProviderRequestView, 'customer'>): string =>
  v.customer.revealed ? v.customer.fullName : v.customer.displayName;

/** S22.E7. */
export function providerActorLabel(actor: RequestActor): string {
  switch (actor) {
    case 'provider':
      return 'by you';
    case 'customer':
      return 'by the customer';
    case 'admin':
      return 'by Fixit';
    case 'system':
      return 'automatically';
  }
}

export const PENDING_PRIVACY_NOTE = 'Full name, address and mobile number are shown after you accept.';

/** S22.E1 closed note; null while Pending/Accepted/Completed. */
export function closedPrivacyNote(status: RequestStatus): string | null {
  if (status === 'declined' || status === 'cancelled' || status === 'expired')
    return `Contact details are hidden because this request is ${status}.`;
  return null;
}

/** S22.E6 (+ D-9). null for open/completed requests. */
export function closedCopy(
  v: Pick<ProviderRequestView, 'status' | 'closedBy' | 'reason' | 'expiresAt' | 'customer'>,
): { line: string; reason: string | null } | null {
  const first = firstNameOf(v.customer.displayName);
  switch (v.status) {
    case 'declined':
      return v.closedBy === 'system'
        ? { line: 'Declined automatically — your account was suspended.', reason: null }
        : { line: 'You declined this request.', reason: v.reason };
    case 'cancelled': {
      const line =
        v.closedBy === 'customer'
          ? `${first} cancelled this request.`
          : v.closedBy === 'admin'
            ? 'Fixit cancelled this request.'
            : 'This request was cancelled.';
      return { line, reason: v.reason };
    }
    case 'expired':
      return {
        line: `This request expired on ${formatDateLong(v.expiresAt)} because it wasn't answered in time.`,
        reason: null,
      };
    default:
      return null;
  }
}
```
**Test:** `copy.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { closedCopy, closedPrivacyNote, firstNameOf, greeting, greetingSub, providerActorLabel } from './copy';

const at = (iso: string) => new Date(iso);
describe('greeting (Colombo = UTC+5:30)', () => {
  it.each([
    ['2026-11-21T23:29:00.000Z', 'evening'], // 04:59
    ['2026-11-21T23:30:00.000Z', 'morning'], // 05:00
    ['2026-11-22T06:29:00.000Z', 'morning'], // 11:59
    ['2026-11-22T06:30:00.000Z', 'afternoon'], // 12:00
    ['2026-11-22T11:29:00.000Z', 'afternoon'], // 16:59
    ['2026-11-22T11:30:00.000Z', 'evening'], // 17:00
  ])('%s → %s', (iso, part) => {
    expect(greeting(at(iso), 'Marcus')).toBe(`Good ${part}, Marcus`);
  });
});

describe('copy', () => {
  it('greetingSub', () => {
    expect(greetingSub(0)).toBe("You're all caught up.");
    expect(greetingSub(1)).toBe('You have 1 new request waiting for a reply.');
    expect(greetingSub(3)).toBe('You have 3 new requests waiting for a reply.');
  });
  it('names and actors', () => {
    expect(firstNameOf('Olivia M.')).toBe('Olivia');
    expect(providerActorLabel('customer')).toBe('by the customer');
  });
  it('closed copy per status and actor', () => {
    const base = { reason: 'Busy.', expiresAt: '2026-11-04T08:30:00.000Z', customer: { revealed: false as const, displayName: 'Daniel K.' } };
    expect(closedCopy({ ...base, status: 'cancelled', closedBy: 'customer' })).toEqual({ line: 'Daniel cancelled this request.', reason: 'Busy.' });
    expect(closedCopy({ ...base, status: 'cancelled', closedBy: 'admin' })?.line).toBe('Fixit cancelled this request.');
    expect(closedCopy({ ...base, status: 'declined', closedBy: 'provider' })?.line).toBe('You declined this request.');
    expect(closedCopy({ ...base, status: 'declined', closedBy: 'system' })).toEqual({
      line: 'Declined automatically — your account was suspended.',
      reason: null,
    });
    expect(closedCopy({ ...base, status: 'expired', closedBy: 'system' })?.line).toBe(
      "This request expired on Wed, 4 Nov 2026 because it wasn't answered in time.",
    );
    expect(closedCopy({ ...base, status: 'accepted', closedBy: null })).toBeNull();
    expect(closedPrivacyNote('expired')).toBe('Contact details are hidden because this request is expired.');
    expect(closedPrivacyNote('pending')).toBeNull();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test provider-dashboard/copy` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): provider dashboard copy helpers (M10-T21)"`

### T22 — Inbox URL state
- [x] done
**Files:** `src/features/provider-dashboard/inbox-search.ts`, `src/features/provider-dashboard/inbox-search.test.ts`
**Context:** S21 `?status=&q=&page=`; same pattern as `features/requests/list-search.ts`.
**Do:** Create `inbox-search.ts`:
```ts
import { ProviderRequestListQuery, type InboxStatus } from '@fixit/contracts';

export const parseInboxSearch = (sp: URLSearchParams): ProviderRequestListQuery =>
  ProviderRequestListQuery.parse(Object.fromEntries(sp));

/** Defaults are left out: `/dashboard/requests`, `…?status=pending&q=olivia&page=2`. */
export function inboxHref({ status = 'all', q = '', page = 1 }: { status?: InboxStatus; q?: string; page?: number }): string {
  const sp = new URLSearchParams();
  if (status !== 'all') sp.set('status', status);
  if (q.trim() !== '') sp.set('q', q.trim());
  if (page > 1) sp.set('page', String(page));
  const s = sp.toString();
  return s ? `/dashboard/requests?${s}` : '/dashboard/requests';
}
```
**Test:** `inbox-search.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { inboxHref, parseInboxSearch } from './inbox-search';

describe('inbox URL state', () => {
  it('round-trips', () => {
    const href = inboxHref({ status: 'pending', q: ' olivia ', page: 2 });
    expect(href).toBe('/dashboard/requests?status=pending&q=olivia&page=2');
    expect(parseInboxSearch(new URLSearchParams(href.split('?')[1]))).toEqual({ status: 'pending', q: 'olivia', page: 2 });
  });
  it('defaults are omitted; junk falls back', () => {
    expect(inboxHref({})).toBe('/dashboard/requests');
    expect(parseInboxSearch(new URLSearchParams('status=bogus&page=-1'))).toEqual({ status: 'all', q: '', page: 1 });
  });
});
```
**Verify:** `pnpm --filter @fixit/web test inbox-search` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): provider inbox URL state (M10-T22)"`

### T23 — `AgreedPriceInput`
- [x] done
**Files:** `src/features/provider-dashboard/components/agreed-price-input.tsx`
**Context:** S22 field table (`number, LKR prefix, step 1`); input text 16px on phone (SPEC §2.3).
**Do:** Create:
```tsx
import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Text input with a fixed `LKR` prefix. Text (not type=number) so `6,500` and `6.5` reach validation with the SPEC message. */
export function AgreedPriceInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="text-label text-text-muted pointer-events-none absolute inset-y-0 left-3 flex items-center font-semibold"
      >
        LKR
      </span>
      <Input inputMode="numeric" autoComplete="off" className={cn('text-body pl-14', className)} {...props} />
    </div>
  );
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): agreed price input (M10-T23)"`

### T24 — Accept dialog
- [x] done
**Files:** `src/features/provider-dashboard/components/accept-dialog.tsx`
**Context:** §8.3 Accept dialog copy; S20.E14 toast; §6.10 (sheet on phone via `ResponsiveDialog`); pattern of `features/requests/components/cancel-request-dialog.tsx`; D-6, D-8.
**Form:** one field `agreedPrice` — schema `AgreedPriceForm`; label `Agreed price` + `optional`; help `You can change it until the job is completed.`; error `Enter a whole amount in rupees, like 6500.`. Server/network failure → `FormErrorBanner` with `FORM_COPY.saveFailed`. 409 → close + `onConflict(ref)`.
**Do:** Create:
```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { AgreedPriceForm, type AgreedPriceFormInput, type ProviderRequestView } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { FORM_COPY } from '@/lib/error-copy';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { firstNameOf } from '../copy';
import { useAcceptRequest } from '../hooks';
import { AgreedPriceInput } from './agreed-price-input';

export interface ActionDialogProps {
  view: ProviderRequestView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A 409: the request changed meanwhile (D-6). */
  onConflict: (ref: string) => void;
}

/** §8.3 Accept dialog (A13). Not optimistic, no Undo (SPEC §6.5). */
export function AcceptDialog({ view, open, onOpenChange, onConflict }: ActionDialogProps) {
  const accept = useAcceptRequest();
  const [banner, setBanner] = useState(false);
  const form = useForm<AgreedPriceFormInput>({
    resolver: zodResolver(AgreedPriceForm),
    defaultValues: { agreedPrice: '' },
  });
  const first = firstNameOf(view.customer.displayName);
  const formId = `accept-${view.ref}`;

  const close = (next: boolean) => {
    if (!next) {
      form.reset();
      setBanner(false);
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit((values) => {
    const { agreedPrice } = AgreedPriceForm.parse(values);
    setBanner(false);
    accept.mutate(
      { ref: view.ref, body: agreedPrice === undefined ? {} : { agreedPrice } },
      {
        onSuccess: (v) => {
          close(false);
          notify(`Accepted ${firstNameOf(v.customer.displayName)}'s request`);
        },
        onError: (e) => {
          if (e instanceof ApiError && e.status === 409) {
            close(false);
            onConflict(view.ref);
            return;
          }
          if (mapApiErrorToForm(e, form.setError) !== null) setBanner(true);
        },
      },
    );
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={close}
      title={`Accept ${first}'s request?`}
      description={`${first} will be emailed, and you'll see their full name, address and mobile number.`}
      dismissible={!accept.isPending}
      footer={
        <>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={accept.isPending}
            onClick={() => {
              close(false);
            }}
          >
            Cancel
          </Button>
          <SubmitButton form={formId} className="w-full sm:w-auto" pending={accept.isPending} pendingLabel="Accepting…">
            <Check aria-hidden="true" className="size-4" />
            Accept request
          </SubmitButton>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(e) => {
          void onSubmit(e);
        }}
        className="flex flex-col gap-4"
      >
        {banner && <FormErrorBanner>{FORM_COPY.saveFailed}</FormErrorBanner>}
        <FormField
          label="Agreed price"
          optional
          help="You can change it until the job is completed."
          error={form.formState.errors.agreedPrice?.message}
        >
          {(p) => <AgreedPriceInput {...p} {...form.register('agreedPrice')} />}
        </FormField>
      </form>
    </ResponsiveDialog>
  );
}
```
If `mapApiErrorToForm`'s return contract differs from the cancel dialog's usage, copy exactly what `cancel-request-dialog.tsx` does.
**Verify:** `pnpm verify` green (behaviour covered by the S20 page test, T33).
**Commit:** `git commit -m "feat(web): accept request dialog (M10-T24)"`

### T25 — Decline dialog
- [ ] done
**Files:** `src/features/provider-dashboard/components/decline-dialog.tsx`
**Context:** §8.3 Decline dialog; S20.E14 toast; D-6, D-8.
**Form:** `reason` — schema `DeclineBody`; textarea, 3 rows, label `Reason` + `optional`, help `Shown to the customer.`, error `Keep the reason under 500 characters.`.
**Do:** Create the component with the same structure as `AcceptDialog` (reuse `ActionDialogProps` exported from `./accept-dialog`), with these differences:
- `useDeclineRequest()`; `useForm<z.input<typeof DeclineBody>>({ resolver: zodResolver(DeclineBody), defaultValues: { reason: '' } })`; submit: `const body = DeclineBody.parse(values); decline.mutate({ ref: view.ref, body: body.reason === undefined ? {} : { reason: body.reason } }, …)`.
- Title `` `Decline ${first}'s request?` ``; description `` `${first} will be emailed. This can't be undone.` ``.
- Footer: secondary `Cancel`; `SubmitButton variant="danger"` label `Decline request`, pending `Declining…` (no icon).
- Success toast `` `Declined ${firstNameOf(v.customer.displayName)}'s request` `` with **no action** (no Undo, SPEC §6.5).
- Field: `<Textarea {...p} rows={3} maxLength={600} className="text-body" {...form.register('reason')} />` (import `Textarea` from `@/components/ui/textarea`).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): decline request dialog (M10-T25)"`

### T26 — Complete dialog
- [ ] done
**Files:** `src/features/provider-dashboard/components/complete-dialog.tsx`
**Context:** §8.3 Complete dialog; A16 toast `Job marked completed.`; D-11.
**Form:** `agreedPrice` — schema `AgreedPriceForm`; label `Final agreed price` + `optional`; default `view.agreedPrice === null ? '' : String(view.agreedPrice)`; error `Enter a whole amount in rupees, like 6500.`.
**Do:** Same structure as `AcceptDialog` with:
- `useCompleteRequest()`; body `agreedPrice === undefined ? {} : { agreedPrice }`.
- Title `Mark this job completed?`; description `` `${first} will get an email asking for a review. This can't be undone.` ``.
- Footer: secondary `Not yet`; primary `SubmitButton` label `Mark completed`, pending `Completing…`.
- Success: `close(false); notify('Job marked completed.');`.
- `close(false)` resets the form to the prefilled value: `form.reset({ agreedPrice: view.agreedPrice === null ? '' : String(view.agreedPrice) })`.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mark completed dialog (M10-T26)"`

### T27 — Request actions controller
- [ ] done
**Files:** `src/features/provider-dashboard/components/request-actions.tsx`
**Context:** D-6 conflict flow; §6.3 conflict dialog; shared by S20, S21, S22.
**Do:** Create:
```tsx
import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProviderRequestView } from '@fixit/contracts';
import { ConflictDialog } from '@/components/conflict-dialog';
import { REQUEST_LABEL } from '@/components/status-pill';
import { qk } from '@/lib/query-keys';
import { fetchInboxRequest } from '../api';
import { AcceptDialog } from './accept-dialog';
import { CompleteDialog } from './complete-dialog';
import { DeclineDialog } from './decline-dialog';

type Kind = 'accept' | 'decline' | 'complete';

export interface RequestActions {
  openAccept: (view: ProviderRequestView) => void;
  openDecline: (view: ProviderRequestView) => void;
  openComplete: (view: ProviderRequestView) => void;
  /** D-6: refresh, then explain. Also used by the inline price editor. */
  onConflict: (ref: string) => void;
  /** Render once per page. */
  dialogs: ReactNode;
}

export function useRequestActions(): RequestActions {
  const qc = useQueryClient();
  const [active, setActive] = useState<{ kind: Kind; view: ProviderRequestView } | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const onConflict = (ref: string) => {
    void qc.invalidateQueries({ queryKey: [...qk.inbox.all, 'list'] });
    void qc.invalidateQueries({ queryKey: qk.dashboard });
    void qc
      .fetchQuery({ queryKey: qk.inbox.detail(ref), queryFn: () => fetchInboxRequest(ref), staleTime: 0 })
      .then(
        (v) => {
          setConflict(`It's now ${REQUEST_LABEL[v.status]}, so this action isn't available.`);
        },
        () => undefined, // the page's own query shows the error state
      );
  };
  const open = (kind: Kind) => (view: ProviderRequestView) => {
    setActive({ kind, view });
  };
  const onOpenChange = (o: boolean) => {
    if (!o) setActive(null);
  };
  const props = active ? { view: active.view, open: true, onOpenChange, onConflict } : null;

  return {
    openAccept: open('accept'),
    openDecline: open('decline'),
    openComplete: open('complete'),
    onConflict,
    dialogs: (
      <>
        {props && active?.kind === 'accept' && <AcceptDialog key={props.view.ref} {...props} />}
        {props && active?.kind === 'decline' && <DeclineDialog key={props.view.ref} {...props} />}
        {props && active?.kind === 'complete' && <CompleteDialog key={props.view.ref} {...props} />}
        <ConflictDialog
          open={conflict !== null}
          onOpenChange={(o) => {
            if (!o) setConflict(null);
          }}
          body={conflict ?? ''}
        />
      </>
    ),
  };
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): request actions controller with conflict handling (M10-T27)"`

### T28 — `ProviderRequestsList` (table + phone cards)
- [ ] done
**Files:** `src/features/provider-dashboard/components/provider-requests-list.tsx`
**Context:** S20.E9–E10 (columns `Customer · Service · Date · Area · Status`, grid `1.4fr 1.5fr 1fr .9fr 288px`, Pending: `[Check] Accept` + `Decline` before the pill), S20 phone card rows, S21 `Reply by …` (12 `warning-text`), §6.9, D-7, D-8; screenshot `07-provider-dashboard-desktop.png` table. Existing `DataList`, `StatusPill`, `my-requests-list.tsx` (column-set per width).
**States:** loading → `DataList` skeleton (table rows / phone cards); empty → `empty` prop; flashing rows → `bg-primary-flash`.
**Do:** Create:
```tsx
import type { ReactNode } from 'react';
import { CalendarDays, Check, MapPin } from 'lucide-react';
import type { ProviderRequestView } from '@fixit/contracts';
import { DataList, type DataListColumn } from '@/components/data-list';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { SLOT_LABEL, formatDateShort, formatReplyBy, initialsOf } from '@/lib/format';
import { useFlashingRows, useFlashOnStatusChange } from '@/lib/row-flash';
import { MQ, useMediaQuery } from '@/lib/use-media-query';
import { customerName } from '../copy';

type Row = ProviderRequestView;
interface Props {
  rows: readonly Row[];
  loading: boolean;
  empty: ReactNode;
  caption: string;
  /** S21 only. */
  showReplyBy?: boolean;
  onAccept: (row: Row) => void;
  onDecline: (row: Row) => void;
}

function Avatar({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="bg-primary-soft text-primary text-meta grid size-9 shrink-0 place-items-center rounded-full font-extrabold">
      {initialsOf(name)}
    </span>
  );
}

function Identity({ r }: { r: Row }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar name={customerName(r)} />
      <span className="flex min-w-0 flex-col">
        <span className="text-body-sm text-text truncate font-bold">{customerName(r)}</span>
        <span className="text-mono text-text-subtle font-mono">{r.ref}</span>
      </span>
    </span>
  );
}

const replyBy = (r: Row, show: boolean) =>
  show && r.status === 'pending' ? (
    <span className="text-caption text-warning-text font-normal">{`Reply by ${formatReplyBy(r.expiresAt)}`}</span>
  ) : null;

export function ProviderRequestsList({ rows, loading, empty, caption, showReplyBy = false, onAccept, onDecline }: Props) {
  const isTable = useMediaQuery(MQ.sm);
  const flashing = useFlashingRows();
  useFlashOnStatusChange(rows);

  const acceptBtn = (r: Row, size: 'sm' | 'md') => (
    <Button size={size} aria-label={`Accept request ${r.ref}`} onClick={() => { onAccept(r); }}>
      <Check aria-hidden="true" className="size-4" />
      Accept
    </Button>
  );
  const declineBtn = (r: Row, variant: 'danger-outline' | 'secondary', size: 'sm' | 'md') => (
    <Button variant={variant} size={size} aria-label={`Decline request ${r.ref}`} onClick={() => { onDecline(r); }}>
      Decline
    </Button>
  );

  const tableColumns: DataListColumn<Row>[] = [
    { id: 'customer', header: 'Customer', card: 'title', className: 'w-[22%]', cell: (r) => <Identity r={r} /> },
    {
      id: 'service',
      header: 'Service',
      card: 'meta',
      className: 'w-[24%] max-w-0',
      cell: (r) => (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-label text-text font-semibold">{r.service.name}</span>
          <span className="text-meta text-text-subtle truncate">{r.description}</span>
        </span>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      card: 'meta',
      className: 'w-[16%]',
      cell: (r) => (
        <span className="flex flex-col gap-0.5">
          <span className="text-label text-text font-semibold">{formatDateShort(r.preferredDate)}</span>
          <span className="text-meta text-text-subtle">{SLOT_LABEL[r.slot]}</span>
          {replyBy(r, showReplyBy)}
        </span>
      ),
    },
    { id: 'area', header: 'Area', card: 'meta', className: 'w-[14%]', cell: (r) => <span className="text-label text-text-muted truncate">{r.town.name}</span> },
    {
      id: 'status',
      header: 'Status',
      card: 'actions',
      className: 'w-[288px]',
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-2">
          {r.status === 'pending' && (
            <>
              {acceptBtn(r, 'sm')}
              {declineBtn(r, 'danger-outline', 'sm')}
            </>
          )}
          <StatusPill kind="request" status={r.status} />
        </span>
      ),
    },
  ];

  const cardColumns: DataListColumn<Row>[] = [
    { id: 'customer', header: 'Customer', card: 'title', cell: (r) => <Identity r={r} /> },
    { id: 'status', header: 'Status', card: 'status', cell: (r) => <StatusPill kind="request" status={r.status} compact /> },
    {
      id: 'service',
      header: 'Service',
      card: 'meta',
      cell: (r) => (
        <span className="flex min-w-0 flex-col">
          <span className="text-label text-text font-semibold">{r.service.name}</span>
          <span className="truncate">{r.description}</span>
        </span>
      ),
    },
    {
      id: 'when',
      header: 'When',
      card: 'meta',
      cell: (r) => (
        <span className="flex flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-1.5">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {formatDateShort(r.preferredDate)} · {SLOT_LABEL[r.slot]}
            <MapPin aria-hidden="true" className="size-3.5" />
            {r.town.name}
          </span>
          {replyBy(r, showReplyBy)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      card: 'actions',
      cell: (r) =>
        r.status === 'pending' ? (
          <>
            {acceptBtn(r, 'md')}
            {declineBtn(r, 'secondary', 'md')}
          </>
        ) : null,
    },
  ];

  return (
    <DataList
      rows={rows}
      columns={isTable ? tableColumns : cardColumns}
      getRowKey={(r) => r.ref}
      caption={caption}
      rowHref={(r) => `/dashboard/requests/${r.ref}`}
      rowLabel={(r) => `${r.ref}, ${customerName(r)}, ${r.service.name}`}
      rowClassName={(r) => (flashing.has(r.ref) ? 'bg-primary-flash' : undefined)}
      loading={loading}
      empty={empty}
    />
  );
}
```
390px: each card = avatar+name+ref with compact pill right; service + one-line note; date · slot · area; Pending cards get a full-width row with `Accept` and `Decline` at 50/50, 44 high (DataList's action row makes buttons `flex-1 min-h-11`).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): provider requests list (M10-T28)"`

### T29 — Stat tiles
- [ ] done
**Files:** `src/features/provider-dashboard/components/stat-tiles.tsx`
**Context:** S20.E6 (labels, subs, icons, tints, links; rating link only when `features.providerReviews`), SPEC §2.9 stat tile, phone 2×2 gap 12 / padding 16 / icon 36 / sub on its own line; screenshot `07-provider-dashboard-desktop.png` top row.
**States:** loading → `StatTilesSkeleton` (4 × `SkeletonStatTile` in the same grid); error handled by the page.
**Do:** Create:
```tsx
import { CalendarCheck, CircleCheckBig, Inbox, Star, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import type { DashboardStats } from '@fixit/contracts';
import { SkeletonStatTile } from '@/components/skeletons';
import { features } from '@/lib/features';
import { formatCount, formatMonthName, formatRating } from '@/lib/format';
import { cn } from '@/lib/utils';

type Tint = 'warning' | 'primary' | 'success';
const TINT: Record<Tint, string> = {
  warning: 'bg-warning-soft text-warning-text',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
};
interface Tile { label: string; value: string; sub: string; icon: LucideIcon; tint: Tint; to: string | null }

const GRID = 'grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4';
const BOX = 'border-border bg-surface flex h-full flex-col gap-3.5 rounded-xl border p-4 sm:p-5';

export function tilesFor(s: DashboardStats, now: Date): Tile[] {
  return [
    { label: 'New requests', value: String(s.pending), sub: 'awaiting reply', icon: Inbox, tint: 'warning', to: '/dashboard/requests?status=pending' },
    { label: 'Accepted', value: String(s.accepted), sub: 'upcoming jobs', icon: CalendarCheck, tint: 'primary', to: '/dashboard/requests?status=accepted' },
    { label: 'Completed this month', value: String(s.completedThisMonth), sub: `in ${formatMonthName(now)}`, icon: CircleCheckBig, tint: 'success', to: '/dashboard/requests?status=completed' },
    {
      label: 'Average rating',
      value: formatRating(s.rating, s.reviewCount),
      sub: s.reviewCount === 0 ? 'no reviews yet' : `★ ${formatCount(s.reviewCount)} ${s.reviewCount === 1 ? 'review' : 'reviews'}`,
      icon: Star,
      tint: 'warning',
      to: features.providerReviews ? '/dashboard/reviews' : null,
    },
  ];
}

function TileBody({ t }: { t: Tile }) {
  const Icon = t.icon;
  return (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="text-label text-text-muted font-semibold">{t.label}</span>
        <span aria-hidden="true" className={cn('grid size-9 shrink-0 place-items-center rounded-sm sm:size-10 sm:rounded-md', TINT[t.tint])}>
          <Icon className="size-5" />
        </span>
      </span>
      <span className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
        <span className="text-stat text-text">{t.value}</span>
        <span className="text-meta text-text-subtle">{t.sub}</span>
      </span>
    </>
  );
}

/** S20.E6. */
export function StatTiles({ stats, now }: { stats: DashboardStats; now: Date }) {
  return (
    <ul className={GRID} aria-label="Summary">
      {tilesFor(stats, now).map((t) => (
        <li key={t.label}>
          {t.to ? (
            <Link to={t.to} className={cn(BOX, 'hover:shadow-hover transition-shadow')}>
              <TileBody t={t} />
            </Link>
          ) : (
            <div className={BOX}>
              <TileBody t={t} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function StatTilesSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonStatTile key={i} />
      ))}
    </div>
  );
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): dashboard stat tiles (M10-T29)"`

### T30 — Overview header
- [ ] done
**Files:** `src/features/provider-dashboard/components/overview-header.tsx`
**Context:** S20.E1–E3, E5 (`[Eye] View public profile`, new tab); availability switch E4 is **not** built (flag `pause` off); screenshot header row.
**Do:** Create:
```tsx
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateLong } from '@/lib/format';
import { greeting, greetingSub } from '../copy';

/** S20.E1–E3, E5. Desktop: text left, button bottom-right. Phone: stacked, full-width 44 button. */
export function OverviewHeader({ firstName, pending, providerId, now }: { firstName: string; pending: number; providerId: string; now: Date }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-label text-text-subtle font-semibold">{formatDateLong(now)}</p>
        <h1 className="text-title-xl text-text">{greeting(now, firstName)}</h1>
        <p className="text-body text-text-muted">{greetingSub(pending)}</p>
      </div>
      <Button asChild variant="outline" size="md" className="w-full sm:w-auto">
        <a href={`/providers/${providerId}`} target="_blank" rel="noopener noreferrer">
          <Eye aria-hidden="true" className="size-5" />
          View public profile
        </a>
      </Button>
    </header>
  );
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): dashboard greeting header (M10-T30)"`

### T31 — Recent requests section (S20)
- [ ] done
**Files:** `src/features/provider-dashboard/components/recent-requests-section.tsx`
**Context:** S20.E7–E13 (H2 `Incoming service requests`, tabs `All · Pending · Accepted · Completed · Declined` with counts filtering in place, ≤ 8 rows newest first, `View all requests →` when more than 8, empties), §6.3 section error; screenshot requests card.
**States:** loading (list skeleton), error (`SectionError` replaces the card), no requests ever (compact `EmptyState`: `Inbox`, `No requests yet`, `When customers send you a request, it shows up here and we email you.`), tab empty (`No requests with this status.` 15 subtle centred, padding 40), default.
**Do:** Create:
```tsx
import { useState } from 'react';
import { ArrowRight, Inbox } from 'lucide-react';
import { Link } from 'react-router';
import type { ProviderRequestView } from '@fixit/contracts';
import { EmptyState } from '@/components/empty-state';
import { SectionError } from '@/components/section-error';
import { SegmentedTabs } from '@/components/segmented-tabs';
import { useInbox } from '../hooks';
import { ProviderRequestsList } from './provider-requests-list';

const TABS = ['all', 'pending', 'accepted', 'completed', 'declined'] as const;
type Tab = (typeof TABS)[number];
const LABEL: Record<Tab, string> = { all: 'All', pending: 'Pending', accepted: 'Accepted', completed: 'Completed', declined: 'Declined' };
const MAX_ROWS = 8;

export function RecentRequestsSection({ onAccept, onDecline }: { onAccept: (v: ProviderRequestView) => void; onDecline: (v: ProviderRequestView) => void }) {
  const [tab, setTab] = useState<Tab>('all');
  const list = useInbox({ status: tab, q: '', page: 1 });
  const counts = list.data?.counts;

  if (list.isError)
    return <SectionError onRetry={() => { void list.refetch(); }} />;
  if (counts?.all === 0)
    return (
      <EmptyState
        icon={Inbox}
        title="No requests yet"
        body="When customers send you a request, it shows up here and we email you."
        className="py-10"
      />
    );

  return (
    <section aria-labelledby="incoming-requests" className="border-border bg-surface overflow-hidden rounded-2xl border">
      <div className="border-border flex flex-col gap-3 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <h2 id="incoming-requests" className="text-title-md text-text">Incoming service requests</h2>
        <SegmentedTabs
          label="Filter by status"
          items={TABS.map((t) => ({ value: t, label: LABEL[t], ...(counts ? { count: counts[t] } : {}) }))}
          value={tab}
          onValueChange={(v) => {
            const next = TABS.find((t) => t === v);
            if (next) setTab(next);
          }}
          className="-mx-4 px-4 sm:mx-0 sm:px-0"
        />
      </div>
      <div className="p-4 sm:p-0">
        <ProviderRequestsList
          caption="Incoming service requests"
          rows={(list.data?.items ?? []).slice(0, MAX_ROWS)}
          loading={list.isPending}
          onAccept={onAccept}
          onDecline={onDecline}
          empty={<p className="text-body-sm text-text-subtle px-4 py-10 text-center">No requests with this status.</p>}
        />
      </div>
      {(list.data?.total ?? 0) > MAX_ROWS && (
        <div className="border-border border-t px-4 py-2 sm:px-6 sm:py-4">
          <Link to="/dashboard/requests" className="text-label text-primary hover:text-primary-hover inline-flex min-h-11 items-center gap-1 font-bold sm:min-h-0">
            View all requests
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
        </div>
      )}
    </section>
  );
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): dashboard incoming requests section (M10-T31)"`

### T32 — My Services card
- [ ] done
**Files:** `src/features/provider-dashboard/components/my-services-card.tsx`
**Context:** S20.E16 (`My Services`, `[Pencil] Edit` → `/dashboard/services`, rows `{name}` + `from LKR 2,500 / hour` per BR-09 via `formatServicePrice`); screenshot bottom-right card (row padding 11, `divider-subtle` rules).
**Do:** Create:
```tsx
import { Pencil } from 'lucide-react';
import { Link } from 'react-router';
import type { Service } from '@fixit/contracts';
import { Button } from '@/components/ui/button';
import { formatServicePrice } from '@/lib/format';

/** S20.E16. */
export function MyServicesCard({ services }: { services: readonly Service[] }) {
  return (
    <section aria-labelledby="my-services" className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 sm:p-[22px]">
      <div className="flex items-center justify-between gap-3">
        <h2 id="my-services" className="text-title-md text-text">My Services</h2>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/services">
            <Pencil aria-hidden="true" className="size-4" />
            Edit
          </Link>
        </Button>
      </div>
      <ul className="flex flex-col">
        {services.map((s) => (
          <li key={s.id} className="border-divider-subtle text-label flex flex-wrap items-center gap-x-2.5 border-b py-[11px]">
            <span className="text-text flex-1 font-semibold">{s.name}</span>
            <span className="text-text-muted font-semibold">{formatServicePrice(s.price, s.unit)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): dashboard My Services card (M10-T32)"`

### T33 — S20 overview page
- [ ] done
**Files:** `src/features/provider-dashboard/pages/overview-page.tsx`, `src/features/provider-dashboard/pages/overview-page.test.tsx`, `src/app/chunks/provider.tsx`, `src/app/routes.test.tsx`
**Context:** SPEC S20 order (header, tiles, requests, bottom grid `repeat(auto-fit,minmax(320px,1fr))` gap 24), §6.1 skeletons, §6.3 section errors; milestone AC1, AC2, AC7, AC8. The shell's `<main>` already provides the 20/28 px gap, so the page returns a fragment.
**States:** tiles loading → `StatTilesSkeleton`; services loading → `SkeletonSectionCard lines={5}`; dashboard error → `SectionError` in place of the tiles and of the services card (one refetch); requests states per T31.
**Do:**
1. Create `overview-page.tsx`:
```tsx
import { useState } from 'react';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { useAuth } from '@/lib/auth-store';
import { firstNameOf } from '../copy';
import { useDashboard } from '../hooks';
import { MyServicesCard } from '../components/my-services-card';
import { OverviewHeader } from '../components/overview-header';
import { RecentRequestsSection } from '../components/recent-requests-section';
import { useRequestActions } from '../components/request-actions';
import { StatTiles, StatTilesSkeleton } from '../components/stat-tiles';

/** S20. */
export function ProviderOverviewPage() {
  const { me } = useAuth();
  const dash = useDashboard();
  const actions = useRequestActions();
  const [now] = useState(() => new Date());
  if (!me?.provider) return null; // RequireProvider guarantees it
  const retry = () => {
    void dash.refetch();
  };
  return (
    <>
      <OverviewHeader
        firstName={firstNameOf(me.fullName)}
        pending={dash.data?.stats.pending ?? me.provider.pendingRequestCount}
        providerId={me.provider.id}
        now={now}
      />
      {dash.isError ? (
        <SectionError onRetry={retry} />
      ) : (
        <LoadingRegion loading={dash.isPending} skeleton={<StatTilesSkeleton />}>
          {dash.data && <StatTiles stats={dash.data.stats} now={now} />}
        </LoadingRegion>
      )}
      <RecentRequestsSection onAccept={actions.openAccept} onDecline={actions.openDecline} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start gap-6">
        {dash.isError ? (
          <SectionError onRetry={retry} />
        ) : (
          <LoadingRegion loading={dash.isPending} skeleton={<SkeletonSectionCard lines={5} />}>
            {dash.data && <MyServicesCard services={dash.data.services} />}
          </LoadingRegion>
        )}
      </div>
      {actions.dialogs}
    </>
  );
}
```
2. In `src/app/chunks/provider.tsx` delete the placeholder `ProviderOverviewPage` and add `export { ProviderOverviewPage } from '@/features/provider-dashboard/pages/overview-page';`.
3. In `src/app/routes.test.tsx` change the `Marcus reaches /dashboard inside L3` assertion to `name: /^Good (morning|afternoon|evening), Marcus$/`.
**Test:** `overview-page.test.tsx`
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { armForcedError } from '@/mocks/lib/controls';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('S20 provider overview', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC1: header, tiles, table and services', async () => {
    signInAs('provider');
    renderRoute('/dashboard');
    expect(await screen.findByRole('heading', { level: 1, name: 'Good morning, Marcus' })).toBeTruthy();
    expect(screen.getByText('Sun, 22 Nov 2026')).toBeTruthy();
    expect(screen.getByText('You have 3 new requests waiting for a reply.')).toBeTruthy();
    const profile = screen.getByRole('link', { name: 'View public profile' });
    expect([profile.getAttribute('href'), profile.getAttribute('target')]).toEqual(['/providers/p01', '_blank']);
    const tile = await screen.findByRole('link', { name: /New requests/ });
    expect(tile.getAttribute('href')).toBe('/dashboard/requests?status=pending');
    expect(within(tile).getByText('3')).toBeTruthy();
    expect(screen.getByText('in November')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Average rating/ })).toBeNull(); // F-24 flag off
    expect(await screen.findByRole('link', { name: 'FX-2061, Olivia M., Leak repair' })).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(9); // header + 8
    expect(screen.getByRole('link', { name: 'View all requests' })).toBeTruthy();
    expect(screen.getByText('from LKR 2,500 / hour')).toBeTruthy();
  });

  it('AC2: accept with a price → toast, revealed name, counts −1, no Undo', async () => {
    const user = userEvent.setup();
    signInAs('provider');
    renderRoute('/dashboard');
    await user.click(await screen.findByRole('button', { name: 'Accept request FX-2061' }));
    const price = await screen.findByLabelText(/Agreed price/);
    await user.type(price, '6.5');
    await user.click(screen.getByRole('button', { name: 'Accept request' }));
    expect(await screen.findByText('Enter a whole amount in rupees, like 6500.')).toBeTruthy();
    await user.clear(price);
    await user.type(price, '6500');
    await user.click(screen.getByRole('button', { name: 'Accept request' }));
    expect(await screen.findByText("Accepted Olivia's request")).toBeTruthy();
    expect(await screen.findByRole('link', { name: 'FX-2061, Olivia Martinez, Leak repair' })).toBeTruthy();
    await waitFor(() => {
      expect(within(screen.getByRole('link', { name: /New requests/ })).getByText('2')).toBeTruthy();
    });
    expect(await screen.findByText('2 new requests')).toBeTruthy(); // sidebar badge (sr text)
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it('AC3 (S20): decline with a reason', async () => {
    const user = userEvent.setup();
    signInAs('provider');
    renderRoute('/dashboard');
    await user.click(await screen.findByRole('button', { name: 'Decline request FX-2059' }));
    await user.type(await screen.findByLabelText(/Reason/), 'Fully booked.');
    await user.click(screen.getByRole('button', { name: 'Decline request' }));
    expect(await screen.findByText("Declined James's request")).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it('AC8: forced 409 → conflict dialog; forced 500 → section errors', async () => {
    const user = userEvent.setup();
    signInAs('provider');
    renderRoute('/dashboard');
    await user.click(await screen.findByRole('button', { name: 'Accept request FX-2061' }));
    armForcedError('requests_accept', '409');
    await user.click(await screen.findByRole('button', { name: 'Accept request' }));
    expect(await screen.findByText('This request has changed')).toBeTruthy();
    expect(screen.getByText("It's now Pending, so this action isn't available.")).toBeTruthy();
  });

  it('AC8: dashboard 500 → both dashboard sections show the section error', async () => {
    armForcedError('provider_dashboard', '500');
    signInAs('provider');
    renderRoute('/dashboard');
    expect(await screen.findAllByText("We couldn't load this.")).toHaveLength(2);
  });

  it('AC8: provider with no requests', async () => {
    signInAs('providerNoRequests');
    renderRoute('/dashboard');
    expect(await screen.findByText('No requests yet')).toBeTruthy();
    expect(screen.getByText("You're all caught up.")).toBeTruthy();
    expect(await screen.findByText('no reviews yet')).toBeTruthy();
  });
});
```
If `userEvent` is not a dependency of `apps/web`, use the event helper the existing page tests use (e.g. M09's `leave-review-page.test.tsx`).
**Verify:** `pnpm --filter @fixit/web test overview-page routes` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): provider overview page S20 (M10-T33)"`

### T34 — S21 requests inbox page
- [ ] done
**Files:** `src/features/provider-dashboard/pages/requests-page.tsx`, `src/features/provider-dashboard/pages/requests-page.test.tsx`, `src/app/chunks/provider.tsx`
**Context:** SPEC S21 (H1 `Requests` `title-xl`, sub `Every request customers have sent you.`, search 40 high, `Search` icon, placeholder `Search by name or reference`, 260 wide / full width on phone; 7 tabs with counts; pagination 20; `Reply by …`), §6.2 search empty (`SearchX`, `No requests match "{q}".`, `Check the spelling or try something else.`, `Clear search`); D-3, D-4; AC3, AC4.
**States:** loading (list skeleton, counts absent), error (`SectionError`), no requests ever (`EmptyState` as S20.E13 with default padding), search no match, tab empty, default, paginated.
**Do:**
1. Create `requests-page.tsx`:
```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { Inbox, Search, SearchX } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import type { InboxStatus } from '@fixit/contracts';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { SectionError } from '@/components/section-error';
import { SegmentedTabLinks } from '@/components/segmented-tabs';
import { Input } from '@/components/ui/input';
import { useInbox } from '../hooks';
import { inboxHref, parseInboxSearch } from '../inbox-search';
import { ProviderRequestsList } from '../components/provider-requests-list';
import { useRequestActions } from '../components/request-actions';

const TABS: readonly InboxStatus[] = ['all', 'pending', 'accepted', 'completed', 'declined', 'cancelled', 'expired'];
const LABEL: Record<InboxStatus, string> = {
  all: 'All', pending: 'Pending', accepted: 'Accepted', completed: 'Completed',
  declined: 'Declined', cancelled: 'Cancelled', expired: 'Expired',
};

/** S21. */
export function ProviderRequestsPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const q = parseInboxSearch(sp);
  const list = useInbox(q);
  const actions = useRequestActions();
  const [text, setText] = useState(q.q);
  useEffect(() => {
    setText(q.q); // Back/Forward
  }, [q.q]);
  const counts = list.data?.counts;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    void navigate(inboxHref({ status: q.status, q: text }));
  };

  let body;
  if (list.isError) body = <SectionError onRetry={() => { void list.refetch(); }} />;
  else if (q.q === '' && counts?.all === 0)
    body = <EmptyState icon={Inbox} title="No requests yet" body="When customers send you a request, it shows up here and we email you." />;
  else
    body = (
      <section aria-label="Requests" className="border-border bg-surface overflow-hidden rounded-2xl border">
        <div className="border-border flex flex-col gap-3 border-b p-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
          <SegmentedTabLinks
            label="Filter by status"
            items={TABS.map((s) => ({
              value: s,
              label: LABEL[s],
              ...(counts ? { count: counts[s] } : {}),
              to: inboxHref({ status: s, q: q.q }),
              active: s === q.status,
            }))}
            className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          />
          <form role="search" onSubmit={onSearch} className="relative w-full lg:w-[260px]">
            <Search aria-hidden="true" className="text-icon-subtle pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2" />
            <Input
              type="search"
              aria-label="Search requests"
              placeholder="Search by name or reference"
              value={text}
              onChange={(e) => { setText(e.target.value); }}
              className="text-body h-11 pl-10 sm:h-10"
            />
          </form>
        </div>
        {q.q !== '' && counts?.all === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={SearchX}
              title={`No requests match "${q.q}".`}
              body="Check the spelling or try something else."
              action={{ label: 'Clear search', to: inboxHref({ status: q.status }) }}
            />
          </div>
        ) : (
          <div className="p-4 sm:p-0">
            <ProviderRequestsList
              caption="Requests"
              rows={list.data?.items ?? []}
              loading={list.isPending}
              showReplyBy
              onAccept={actions.openAccept}
              onDecline={actions.openDecline}
              empty={<p className="text-body-sm text-text-subtle px-4 py-10 text-center">No requests with this status.</p>}
            />
          </div>
        )}
        <Pagination
          page={q.page}
          totalPages={list.data?.totalPages ?? 0}
          hrefFor={(p) => inboxHref({ status: q.status, q: q.q, page: p })}
          className="p-4 sm:px-6"
        />
      </section>
    );

  return (
    <>
      <header className="flex flex-col gap-1.5">
        <h1 className="text-title-xl text-text">Requests</h1>
        <p className="text-body text-text-muted">Every request customers have sent you.</p>
      </header>
      {body}
      {actions.dialogs}
    </>
  );
}
```
If `text-icon-subtle` is not a defined token class, use `text-text-subtle`.
2. In `chunks/provider.tsx` replace the placeholder with `export { ProviderRequestsPage } from '@/features/provider-dashboard/pages/requests-page';`.
**Test:** `requests-page.test.tsx`
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('S21 provider requests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    signInAs('provider');
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC4: H1, 7 tabs, pending order with Reply by', async () => {
    renderRoute('/dashboard/requests?status=pending');
    expect(await screen.findByRole('heading', { level: 1, name: 'Requests' })).toBeTruthy();
    const tabs = screen.getByRole('navigation', { name: 'Filter by status' });
    expect(tabs.querySelectorAll('a')).toHaveLength(7);
    const links = await screen.findAllByRole('link', { name: /^FX-20/ });
    expect(links.map((l) => l.textContent?.match(/FX-\d+/)?.[0])).toEqual(['FX-2058', 'FX-2059', 'FX-2061']);
    expect(screen.getByText('Reply by Tue 4:00 AM')).toBeTruthy();
  });

  it('AC4: search, no match, clear', async () => {
    const user = userEvent.setup();
    const { location } = renderRoute('/dashboard/requests');
    await user.type(await screen.findByRole('searchbox', { name: 'Search requests' }), 'zzz{Enter}');
    expect(await screen.findByText('No requests match "zzz".')).toBeTruthy();
    expect(location()).toBe('/dashboard/requests?q=zzz');
    await user.click(screen.getByRole('link', { name: 'Clear search' }));
    expect(await screen.findByRole('link', { name: 'FX-2061, Olivia M., Leak repair' })).toBeTruthy();
  });

  it('AC4: URL state survives reload (page 2 of completed)', async () => {
    renderRoute('/dashboard/requests?status=completed&page=2');
    const current = await screen.findByRole('link', { current: 'page' });
    expect(current.textContent).toBe('2');
  });

  it('AC3: decline from S21; Olivia sees the reason on S15', async () => {
    const user = userEvent.setup();
    const first = renderRoute('/dashboard/requests');
    await user.click(await screen.findByRole('button', { name: 'Decline request FX-2061' }));
    await user.type(await screen.findByLabelText(/Reason/), 'Not available that week.');
    await user.click(screen.getByRole('button', { name: 'Decline request' }));
    expect(await screen.findByText("Declined Olivia's request")).toBeTruthy();
    first.unmount();
    signInAs('customer');
    renderRoute('/requests/FX-2061');
    expect(await screen.findByText('Reason: Not available that week.')).toBeTruthy();
  });
});
```
The `current: 'page'` query needs `@testing-library/dom` ≥ 9; if unsupported, use `screen.getAllByRole('link').find((a) => a.getAttribute('aria-current') === 'page')`. The tabs nav also contains `aria-current` links — scope the pagination lookup with `within(screen.getByRole('navigation', { name: 'Pagination' }))`.
**Verify:** `pnpm --filter @fixit/web test requests-page` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): provider requests inbox page S21 (M10-T34)"`

### T35 — S22 Customer card
- [ ] done
**Files:** `src/features/provider-dashboard/components/customer-card.tsx`
**Context:** S22.E1 (§6.3 privacy; `Lock` note; Accepted/Completed: full name, address lines, mobile with `Call`/`Copy` → toast `Number copied.`), D-8; shared `ContactBlock` (T20).
**States:** unrevealed + pending note; unrevealed + closed note; revealed.
**Do:** Create:
```tsx
import { Lock } from 'lucide-react';
import type { ProviderRequestView } from '@fixit/contracts';
import { ContactBlock } from '@/components/contact-block';
import { initialsOf } from '@/lib/format';
import { closedPrivacyNote, PENDING_PRIVACY_NOTE } from '../copy';

/** S22.E1. Privacy is decided by the server view (`customer.revealed`), never by the UI. */
export function CustomerCard({ view }: { view: ProviderRequestView }) {
  const c = view.customer;
  const name = c.revealed ? c.fullName : c.displayName;
  const note = c.revealed ? null : (closedPrivacyNote(view.status) ?? PENDING_PRIVACY_NOTE);
  return (
    <section aria-labelledby="customer-h" className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
      <h2 id="customer-h" className="text-title-md text-text">Customer</h2>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="bg-primary-soft text-primary text-label grid size-11 shrink-0 place-items-center rounded-full font-extrabold">
          {initialsOf(name)}
        </span>
        <div className="min-w-0">
          <p className="text-body-sm text-text truncate font-bold">{name}</p>
          <p className="text-meta text-text-muted">{view.town.name}</p>
        </div>
      </div>
      {c.revealed ? (
        <>
          <div className="flex flex-col gap-0.5">
            <p className="text-meta text-text-muted">Address</p>
            <p className="text-body-sm text-text">{c.addressLine1}</p>
            {c.addressLine2 && <p className="text-body-sm text-text">{c.addressLine2}</p>}
          </div>
          <ContactBlock label="Mobile" mobile={c.mobile} />
        </>
      ) : (
        <p className="text-meta text-text-muted flex items-start gap-2">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {note}
        </p>
      )}
    </section>
  );
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S22 customer card (M10-T35)"`

### T36 — S22 Job details card
- [ ] done
**Files:** `src/features/provider-dashboard/components/job-details-card.tsx`
**Context:** S22.E2 (H2 `Job details`; labels `Service`, `Preferred date`, `Time slot`, `Town`, `Description`); same layout as S15 `request-details-card.tsx`.
**Do:** Create:
```tsx
import type { ProviderRequestView } from '@fixit/contracts';
import { SLOT_LABEL, formatDateLong, formatServicePrice } from '@/lib/format';

const ROW = 'flex flex-col gap-0.5';
const DT = 'text-meta text-text-muted';
const DD = 'text-body-sm text-text';

/** S22.E2. */
export function JobDetailsCard({ view }: { view: ProviderRequestView }) {
  return (
    <section aria-labelledby="job-h" className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
      <h2 id="job-h" className="text-title-md text-text">Job details</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className={ROW}><dt className={DT}>Service</dt><dd className={DD}>{`${view.service.name} · ${formatServicePrice(view.service.price, view.service.unit)}`}</dd></div>
        <div className={ROW}><dt className={DT}>Preferred date</dt><dd className={DD}>{formatDateLong(view.preferredDate)}</dd></div>
        <div className={ROW}><dt className={DT}>Time slot</dt><dd className={DD}>{SLOT_LABEL[view.slot]}</dd></div>
        <div className={ROW}><dt className={DT}>Town</dt><dd className={DD}>{view.town.name}</dd></div>
        <div className={`${ROW} sm:col-span-2`}><dt className={DT}>Description</dt><dd className={`${DD} whitespace-pre-line`}>{view.description}</dd></div>
      </dl>
    </section>
  );
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S22 job details card (M10-T36)"`

### T37 — Inline agreed price editor
- [ ] done
**Files:** `src/features/provider-dashboard/components/agreed-price-editor.tsx`
**Context:** S22.E4 (H3 `Agreed price`: `LKR 6,500` or `Not set` + `Edit` / `Add`; help `For your records only — the customer pays you directly.`; edit: input + `Save` / `Cancel`; toast `Agreed price saved.`), A15, §6.3 (form submit failure → danger banner), D-6.
**Form:** `agreedPrice` — schema `AgreedPriceForm`; empty saves `null` (clears); error `Enter a whole amount in rupees, like 6500.`.
**States:** view, editing, saving (`Saving…`), field error, server error banner, 409 → leave edit mode + `onConflict`.
**Do:** Create:
```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AgreedPriceForm, type AgreedPriceFormInput, type ProviderRequestView } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { FORM_COPY } from '@/lib/error-copy';
import { formatLkr } from '@/lib/format';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { useSetAgreedPrice } from '../hooks';
import { AgreedPriceInput } from './agreed-price-input';

const asText = (n: number | null) => (n === null ? '' : String(n));

/** S22.E4 inline editor (A15). */
export function AgreedPriceEditor({ view, onConflict }: { view: ProviderRequestView; onConflict: (ref: string) => void }) {
  const save = useSetAgreedPrice();
  const [editing, setEditing] = useState(false);
  const [banner, setBanner] = useState(false);
  const form = useForm<AgreedPriceFormInput>({ resolver: zodResolver(AgreedPriceForm), defaultValues: { agreedPrice: asText(view.agreedPrice) } });

  const start = () => {
    form.reset({ agreedPrice: asText(view.agreedPrice) });
    setBanner(false);
    setEditing(true);
  };
  const onSubmit = form.handleSubmit((values) => {
    const { agreedPrice } = AgreedPriceForm.parse(values);
    setBanner(false);
    save.mutate(
      { ref: view.ref, body: { agreedPrice: agreedPrice ?? null } },
      {
        onSuccess: () => {
          setEditing(false);
          notify('Agreed price saved.');
        },
        onError: (e) => {
          if (e instanceof ApiError && e.status === 409) {
            setEditing(false);
            onConflict(view.ref);
            return;
          }
          if (mapApiErrorToForm(e, form.setError) !== null) setBanner(true);
        },
      },
    );
  });

  if (!editing)
    return (
      <div className="flex flex-col gap-1">
        <h3 className="text-label text-text font-bold">Agreed price</h3>
        <div className="flex items-center gap-3">
          <span className="text-lead text-text font-bold">{view.agreedPrice === null ? 'Not set' : formatLkr(view.agreedPrice)}</span>
          <Button variant="link" size="inline" className="min-h-11 sm:min-h-0" onClick={start}>
            {view.agreedPrice === null ? 'Add' : 'Edit'}
          </Button>
        </div>
        <p className="text-meta text-text-subtle">For your records only — the customer pays you directly.</p>
      </div>
    );

  return (
    <form noValidate onSubmit={(e) => { void onSubmit(e); }} className="flex flex-col gap-3">
      {banner && <FormErrorBanner>{FORM_COPY.saveFailed}</FormErrorBanner>}
      <FormField label="Agreed price" help="For your records only — the customer pays you directly." error={form.formState.errors.agreedPrice?.message}>
        {(p) => <AgreedPriceInput {...p} autoFocus {...form.register('agreedPrice')} />}
      </FormField>
      <div className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton className="w-full sm:w-auto" pending={save.isPending} pendingLabel="Saving…">Save</SubmitButton>
        <Button variant="secondary" className="w-full sm:w-auto" disabled={save.isPending} onClick={() => { setEditing(false); }}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): inline agreed price editor (M10-T37)"`

### T38 — S22 Actions card
- [ ] done
**Files:** `src/features/provider-dashboard/components/actions-card.tsx`
**Context:** S22.E3–E6; BR-32; D-9, D-10, D-14; `CONTACT_EMAIL` from `@/lib/env`; `View review` link only when `features.providerReviews` (S27 not built).
**States:** Pending (with/without buttons per D-14), Accepted (complete enabled / disabled + help), Completed (with review / with deadline / neither), Declined, Cancelled (customer / admin / system), Expired.
**Do:** Create:
```tsx
import { Check, CircleCheckBig } from 'lucide-react';
import { Link } from 'react-router';
import type { ProviderRequestView } from '@fixit/contracts';
import { Button } from '@/components/ui/button';
import { CONTACT_EMAIL } from '@/lib/env';
import { features } from '@/lib/features';
import { formatDateLong, formatDateShort, formatDeadline, formatLkr } from '@/lib/format';
import { closedCopy } from '../copy';
import { AgreedPriceEditor } from './agreed-price-editor';

interface Props {
  view: ProviderRequestView;
  /** D-14: false on phone, where Pending buttons live in the sticky bar. */
  showPendingButtons: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onComplete: () => void;
  onConflict: (ref: string) => void;
}

const P = 'text-body-sm text-text';
const NOTE = 'text-meta text-text-muted';

/** S22.E3–E6. Every flag comes from the server view. */
export function ActionsCard({ view: v, showPendingButtons, onAccept, onDecline, onComplete, onConflict }: Props) {
  let content;
  if (v.status === 'pending') {
    content = (
      <>
        <p className={P}>{`Respond by ${formatDeadline(v.expiresAt)}`}</p>
        {showPendingButtons && (
          <div className="flex flex-col gap-2">
            <Button size="lg" className="w-full" onClick={onAccept}>
              <Check aria-hidden="true" className="size-5" />
              Accept
            </Button>
            <Button size="lg" variant="danger-outline" className="w-full" onClick={onDecline}>
              Decline
            </Button>
          </div>
        )}
      </>
    );
  } else if (v.status === 'accepted') {
    content = (
      <>
        <AgreedPriceEditor view={v} onConflict={onConflict} />
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full" disabled={!v.canComplete} onClick={onComplete} aria-describedby={v.canComplete ? undefined : 'complete-help'}>
            <CircleCheckBig aria-hidden="true" className="size-5" />
            Mark as completed
          </Button>
          {!v.canComplete && (
            <p id="complete-help" className={NOTE}>{`You can mark this job completed from ${formatDateShort(v.completeFrom)}.`}</p>
          )}
        </div>
        <p className={NOTE}>{`Need to cancel? Call the customer, then email us at ${CONTACT_EMAIL} — providers can't cancel accepted jobs.`}</p>
      </>
    );
  } else if (v.status === 'completed') {
    content = (
      <>
        {v.completedAt && <p className={`${P} font-bold`}>{`Completed on ${formatDateLong(v.completedAt)}`}</p>}
        {v.agreedPrice !== null && <p className={P}>{`Agreed price: ${formatLkr(v.agreedPrice)}`}</p>}
        {v.review ? (
          <p className={P}>
            {`${v.review.authorDisplayName} left a ${String(v.review.rating)}-star review`}
            {features.providerReviews && (
              <>
                {' '}
                <Link className="text-primary font-semibold" to={`/dashboard/reviews#${v.review.id}`}>View review</Link>
              </>
            )}
          </p>
        ) : (
          v.reviewDeadline && <p className={NOTE}>{`The customer can review until ${formatDateLong(v.reviewDeadline)}.`}</p>
        )}
      </>
    );
  } else {
    const c = closedCopy(v);
    content = c && (
      <>
        <p className={P}>{c.line}</p>
        {c.reason && <p className={NOTE}>{`Reason: ${c.reason}`}</p>}
      </>
    );
  }
  return (
    <section aria-label="Actions" className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
      {content}
    </section>
  );
}
```
If `CONTACT_EMAIL` is not exported from `@/lib/env`, import it from where `lib/error-copy.ts` imports it.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S22 actions card (M10-T38)"`

### T39 — S22 provider request page
- [ ] done
**Files:** `src/features/provider-dashboard/pages/request-page.tsx`, `src/features/provider-dashboard/pages/request-page.test.tsx`, `src/app/chunks/provider.tsx`
**Context:** SPEC S22 layout (back link `Back to requests`; header: H1 service `title-lg`, ref mono, pill, `Requested {21 Nov 2026, 3:42 PM}`; grid `minmax(0,1fr) 340px` gap 24; aside sticky top 32; phone order header → Actions → Customer → Job details → History; sticky bottom bar `Decline` (secondary) / `Accept` (primary) 50/50 48 high), §5.E S39 request variant (`Go to requests`), D-14; AC5, AC6, AC7, AC9.
**States:** loading (`SkeletonSectionCard` ×3 + aside), 404 → S39 request variant in L3, other errors → thrown (S41), every status per T35/T38.
**Do:**
1. Create `request-page.tsx`:
```tsx
import { Check } from 'lucide-react';
import { useParams } from 'react-router';
import { NotFoundPage } from '@/app/errors/not-found-page';
import { BackLink } from '@/components/back-link';
import { LoadingRegion } from '@/components/loading-region';
import { RequestHistory } from '@/components/request-history';
import { SkeletonSectionCard } from '@/components/skeletons';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import { ApiError } from '@/lib/http';
import { MQ, useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { providerActorLabel } from '../copy';
import { useInboxRequest } from '../hooks';
import { ActionsCard } from '../components/actions-card';
import { CustomerCard } from '../components/customer-card';
import { JobDetailsCard } from '../components/job-details-card';
import { useRequestActions } from '../components/request-actions';

const GRID = 'flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start';

function DetailSkeleton() {
  return (
    <div className={GRID}>
      <SkeletonSectionCard lines={2} />
      <div className="flex min-w-0 flex-col gap-6 lg:order-first">
        <SkeletonSectionCard lines={3} />
        <SkeletonSectionCard lines={5} />
        <SkeletonSectionCard lines={3} />
      </div>
    </div>
  );
}

/** S22. */
export function ProviderRequestPage() {
  const { ref = '' } = useParams();
  const q = useInboxRequest(ref);
  const actions = useRequestActions();
  const isWide = useMediaQuery(MQ.sm);
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFoundPage area="provider" variant="request" />;
    throw q.error; // S41
  }
  const v = q.data;
  const stickyBar = v?.status === 'pending' && !isWide;

  return (
    <div className={cn('flex flex-col gap-6', stickyBar && 'pb-24')}>
      <BackLink to="/dashboard/requests">Back to requests</BackLink>
      <LoadingRegion loading={!v} skeleton={<DetailSkeleton />}>
        {v && (
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
              <h1 className="text-title-lg text-text">{v.service.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-mono text-text-subtle font-mono">{v.ref}</span>
                <StatusPill kind="request" status={v.status} />
                <span className="text-body-sm text-text-muted">{`Requested ${formatDateTime(v.createdAt)}`}</span>
              </div>
            </header>
            <div className={GRID}>
              {/* Phone: Actions first. Desktop: right column, sticky. */}
              <div className="lg:sticky lg:top-8 lg:col-start-2 lg:row-start-1">
                <ActionsCard
                  view={v}
                  showPendingButtons={isWide}
                  onAccept={() => { actions.openAccept(v); }}
                  onDecline={() => { actions.openDecline(v); }}
                  onComplete={() => { actions.openComplete(v); }}
                  onConflict={actions.onConflict}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
                <CustomerCard view={v} />
                <JobDetailsCard view={v} />
                <RequestHistory history={v.history} actorLabel={providerActorLabel} />
              </div>
            </div>
            {stickyBar && (
              <div className="border-border bg-surface fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button variant="secondary" size="lg" className="flex-1" onClick={() => { actions.openDecline(v); }}>
                  Decline
                </Button>
                <Button size="lg" className="flex-1" onClick={() => { actions.openAccept(v); }}>
                  <Check aria-hidden="true" className="size-5" />
                  Accept
                </Button>
              </div>
            )}
          </div>
        )}
      </LoadingRegion>
      {actions.dialogs}
    </div>
  );
}
```
2. In `chunks/provider.tsx` replace the placeholder with `export { ProviderRequestPage } from '@/features/provider-dashboard/pages/request-page';`. Delete `PlaceholderScreen` import only if nothing else in the file uses it (other placeholders remain).
**Test:** `request-page.test.tsx`
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FIXED_NOW } from '@/test/fixed-now';
import { setViewportWidth } from '@/test/media';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

const open = async (ref: string, persona: 'provider' | 'providerNotSubmitted' = 'provider') => {
  signInAs(persona);
  renderRoute(`/dashboard/requests/${ref}`);
};

describe('S22 provider request detail', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC5: pending is private; accept reveals the contact', async () => {
    const user = userEvent.setup();
    await open('FX-2061');
    expect(await screen.findByRole('heading', { level: 1, name: 'Leak repair' })).toBeTruthy();
    expect(screen.getByText('Olivia M.')).toBeTruthy();
    expect(screen.getByText('Full name, address and mobile number are shown after you accept.')).toBeTruthy();
    expect(screen.getByText('Respond by Wed, 25 Nov, 12:00 AM')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    await user.click(await screen.findByRole('button', { name: 'Accept request' }));
    expect(await screen.findByText('Olivia Martinez')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Call' }).getAttribute('href')).toMatch(/^tel:\+947/);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('AC5: future accepted → complete disabled; agreed price edit', async () => {
    const user = userEvent.setup();
    await open('FX-2050');
    const complete = await screen.findByRole('button', { name: 'Mark as completed' });
    expect(complete).toHaveProperty('disabled', true);
    expect(screen.getByText('You can mark this job completed from Tue, 24 Nov.')).toBeTruthy();
    expect(screen.getByText('LKR 4,500')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const input = screen.getByLabelText(/Agreed price/);
    await user.clear(input);
    await user.type(input, '8000');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Agreed price saved.')).toBeTruthy();
    expect(await screen.findByText('LKR 8,000')).toBeTruthy();
  });

  it('AC5: accepted-today → complete → completed card', async () => {
    const user = userEvent.setup();
    await open('FX-2054');
    await user.click(await screen.findByRole('button', { name: 'Mark as completed' }));
    expect(await screen.findByText('Ethan will get an email asking for a review. This can\'t be undone.')).toBeTruthy();
    expect(screen.getByLabelText(/Final agreed price/)).toHaveProperty('value', '3500');
    await user.click(screen.getByRole('button', { name: 'Mark completed' }));
    expect(await screen.findByText('Job marked completed.')).toBeTruthy();
    expect(await screen.findByText('Completed on Sun, 22 Nov 2026')).toBeTruthy();
    expect(screen.getByText('The customer can review until Tue, 22 Dec 2026.')).toBeTruthy();
  });

  it.each([
    ['FX-2038', 'Daniel cancelled this request.', 'Reason: Found someone closer to home.', 'cancelled'],
    ['FX-2039', 'Fixit cancelled this request.', 'Reason: The customer asked us to cancel this job.', 'cancelled'],
    ['FX-2037', 'You declined this request.', 'Reason: Outside my service area.', 'declined'],
  ])('AC6: %s closed copy and privacy', async (ref, line, reason, status) => {
    await open(ref);
    expect(await screen.findByText(line)).toBeTruthy();
    expect(screen.getByText(reason)).toBeTruthy();
    expect(screen.getByText(`Contact details are hidden because this request is ${status}.`)).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Call' })).toBeNull();
  });

  it('AC6: expired', async () => {
    await open('FX-2040');
    expect(await screen.findByText("This request expired on Wed, 4 Nov 2026 because it wasn't answered in time.")).toBeTruthy();
    expect(screen.getByText('Sophia N.')).toBeTruthy();
  });

  it("AC9: another provider's ref → S39 request variant", async () => {
    await open('FX-2061', 'providerNotSubmitted');
    expect(await screen.findByText("We can't find that request")).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to requests' }).getAttribute('href')).toBe('/dashboard/requests');
  });

  it('AC7: phone → sticky Decline/Accept bar, dialog as bottom sheet', async () => {
    const user = userEvent.setup();
    setViewportWidth(390);
    await open('FX-2061');
    await user.click(await screen.findByRole('button', { name: 'Accept' }));
    expect(await screen.findByRole('button', { name: 'Accept request' })).toBeTruthy();
    expect(document.querySelector('[data-variant="sheet"]')).not.toBeNull();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test request-page` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): provider request detail page S22 (M10-T39)"`

### T40 — M10 acceptance checks
- [ ] done
**Files:** this plan (tick boxes), `docs/milestones/M00-index.md` (mark M10 done the way M09 was marked)
**Context:** milestone acceptance criteria 1–10.
**Do:** Reset the dev mock db (DevPanel → reset demo data) before each manual check. Walk every criterion; write `✓` or the failure under each in a short "Acceptance results" list appended to this plan:
1. **AC1** — automated: `overview-page.test.tsx › AC1`. Manual: `pnpm dev:mock`, sign in as Marcus, `/dashboard` at 1440; compare with `reference/screens/07-provider-dashboard-desktop.png` (no "Sample requests" badge, no completeness card, `from LKR … / hour` rows, `View public profile` opens a new tab).
2. **AC2** — automated: `overview-page.test.tsx › AC2`. Manual: accept FX-2061 from the S20 row with `6.5` (error) then `6500`; watch the row flash ~0.9 s, the pill turn Accepted, the name become `Olivia Martinez`, tile and sidebar badge go 3 → 2.
3. **AC3** — automated: `requests-page.test.tsx › AC3`. Manual: decline FX-2059 from S21 with a reason; DevPanel → switch to Olivia is not possible for FX-2059 (James), so decline FX-2061 instead and open `/requests/FX-2061` as Olivia: `Reason: …` shown.
4. **AC4** — automated: `requests-page.test.tsx › AC4 ×3`. Manual: reload `/dashboard/requests?status=completed&q=fx&page=2`; state survives.
5. **AC5** — automated: `request-page.test.tsx › AC5 ×3`. Manual: accept FX-2061 with a price on S22, then as Olivia see the price on S15.
6. **AC6** — automated: `request-page.test.tsx › AC6`.
7. **AC7** — automated: `request-page.test.tsx › AC7`. Manual at 390 px: S20 tiles 2×2, no availability row, cards with 50/50 Accept/Decline, dialogs as bottom sheets; at 800 px the sidebar is a drawer; no horizontal scroll on S20/S21/S22 (`document.documentElement.scrollWidth === innerWidth` in the console).
8. **AC8** — automated: `overview-page.test.tsx › AC8 ×3`. Manual: DevPanel latency `slow` → skeletons on tiles and table; force 409 on `requests_accept`; force 500 on `requests_inbox_list` → section error on S21.
9. **AC9** — automated: `routes.test.tsx` (customer → `/become-a-provider/1`, Admin → S40) and `request-page.test.tsx › AC9`.
10. **AC10** — automated: `packages/contracts/src/requests/projections.test.ts › toProviderView` and `requests-provider-actions.test.ts › lapsed pending`.
11. Run `pnpm verify`; it must be green. Mark M10 done in `docs/milestones/M00-index.md`.
**Verify:** all of the above ✓; `pnpm verify` green.
**Commit:** `git commit -m "chore: M10 acceptance checks (M10-T40)"`

## Checkpoints
- After T14: "Human: read `requests-inbox.test.ts` and `requests-provider-actions.test.ts` and confirm the privacy and 404/403 cases match what you expect from the real API in M18."
- After T33: "Human: run `pnpm dev:mock`, open `/dashboard` as Marcus at 1440 and 390, compare with `reference/screens/07-provider-dashboard-desktop.png` (phone: SPEC S20 phone layout, not the broken prototype phone screenshot). Accept and decline a row and watch the flash."
- After T34: "Human: open `/dashboard/requests` at 1440, 800 and 390; try every tab, a search with and without results, and page 2 of Completed."
- After T39: "Human: open `/dashboard/requests/FX-2061`, `FX-2050`, `FX-2054`, `FX-2038`, `FX-2040` at 1440 and 390; check the sticky bar on phone and the sticky Actions card on desktop."

## Blockers
(executor writes here; leave empty)

## Nice-to-haves (not tasks)
- `Me.pendingRequestCount` in the mock `auth_me` doesn't sweep expired requests first, so the badge can lag the inbox by one refresh after an expiry.
- Lift the toast above the S22 phone sticky bar (SPEC §6.5 "bottom 16 plus any sticky bar height").
- Debounced live search on S21 instead of submit-on-Enter.
- A "Clear" (×) button inside the S21 search input.
