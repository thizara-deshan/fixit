# PLAN-M08 — Request form & confirmation
Milestone: `docs/milestones/M08-request-form.md` · Start tag: `m08-start` · Verify-all: `pnpm verify`
Mock domains at start → end: all → all (`requests` gains `POST /me/requests` and `GET /me/requests/:ref`). **No backend in this milestone** (`apps/api` does not exist yet), so there are no Nest tasks and no authorization-matrix rows. The mocks apply role rules through `mockEndpoint` and business rules through contracts functions, as the API will.

Conventions for the executor:
- T1 creates tag `m08-start` and branch `m08-request-form` from the current HEAD (`git tag m08-start && git switch -c m08-request-form`). One commit per task, using the message given, ending with the attribution lines from your session instructions.
- Run `pnpm format` before `pnpm verify` in every task. Code below may not be Prettier-exact.
- Code blocks are complete files unless the step says "add", "replace" or "edit". Tests import `describe/expect/it/vi` from `vitest` explicitly.
- Paths are under `apps/web/` unless they start with `packages/`, `docs/` or `/`. `@/` = `apps/web/src/`.
- Tailwind: only `sm` (≥641) and `lg` (≥1024) prefixes. Arbitrary **size/grid** values are allowed (`max-w-[560px]`, `grid-cols-[minmax(0,1fr)_380px]`, `pb-[calc(12px+env(safe-area-inset-bottom))]`). Arbitrary colour values and lint-banned prefixes (`text-[`, `bg-[`, `border-[`, `shadow-[`, `ring-[`, `outline-[`) are not. Token classes used: `bg-surface bg-page bg-primary-soft bg-success-soft bg-surface-muted text-text text-text-muted text-text-subtle text-primary text-success text-danger-text border-border border-border-control border-border-strong focus-visible:ring-ring`, type scale `text-title-lg text-title-md text-title-sm text-lead text-body text-body-sm text-label text-meta text-caption`, radii `rounded-md rounded-lg rounded-xl rounded-2xl rounded-full`, `font-mono`.
- Copy in backticks is SPEC copy, character for character.
- If a library API differs from what the code assumes (React Router 7, TanStack Query 5, zod 4, react-hook-form 7, lucide-react names), **STOP** and write a blocker.

Planner's decisions the executor must follow:
- **D-1 Required-field messages.** ARCH §2.5 sketches `serviceId: Id.min(1, 'Choose a service.')`. In zod 4 that reports `Id`'s own unlabelled `min(1)` first, so the form would show the wrong text. The schema uses `required(msg).pipe(Id)` instead (same SPEC messages, same output type). No contract shape changes.
- **D-2 Date window on the server is a rule, not a field error** (decision 004, ARCH §3.4/§7.2 updated). The mock handler parses the body with `CreateRequestBody` (no refinement) and lets `checkCreateRequest` return `date_out_of_window` (422). That is what produces the S12.E6 banner `That date is no longer available. Choose another date.` The form uses `makeCreateRequestSchema(now)` so the user sees the range message before submitting. The API milestone must follow the same rule (noted in "Nice-to-haves / notes").
- **D-3 Blocked-state source.** S12 decides its blocked card from `GET /me/request-eligibility/:providerId` (the M07 endpoint and `evaluateEligibility`). Guards already handle guest (`/login?next=…`) and admin (S40). If eligibility fails to load, the form renders (the server re-checks on submit), as on S3 (M07 D-4).
- **D-4 Native controls.** The date picker is `<input type="date" min max>` at every width. The town select is a native `<select>`. Both get RHF focus-on-error with no extra wiring and are native pickers on phone (SPEC "native on phone").
- **D-5 Phone sticky bar.** Below `sm` the submit button's wrapper is `fixed` at the bottom. While the form is shown the page adds `pb-24 sm:pb-0` to `<body>` (`useBodyClass`, as in M07 D-6).
- **D-6 Time in tests.** The mock `requests` handlers run `expireDue(db, now)` with the real clock, and fixtures are seeded at `FIXED_NOW`. Every new test that calls them uses `vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] })` in `beforeEach` and `vi.useRealTimers()` in `afterEach`.
- **D-7 Forced rule error.** The DevPanel gains a forced kind `rule_provider_paused` (422 `RULE_VIOLATION`, `details.rule = 'provider_paused'`) for AC6.
- **D-8 Provider pending count.** `buildMe()` already computes `provider.pendingRequestCount` from the db's requests. So a new Pending record bumps the L3 badge with no extra code. T8 has a test that proves it.

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `packages/contracts/src/requests/schemas.ts` | Modify | `CreateRequestBody`, `makeCreateRequestSchema`, `bookingWindowMessage`, `StatusEvent`, `CustomerRequestView` |
| `packages/contracts/src/requests/create-schema.test.ts` | Create | schema messages + window |
| `packages/contracts/src/requests/rules.ts` (+ `rules.test.ts`) | Modify | `checkCreateRequest` |
| `packages/contracts/src/reviews/rules.ts` (+ test) | Modify | `REVIEW_WINDOW_DAYS`, `reviewDeadline` |
| `packages/contracts/src/requests/projections.ts` (+ test) | Create | `toCustomerView` |
| `packages/contracts/src/endpoints.ts` (+ test) | Modify | `requests_create`, `requests_get` |
| `packages/contracts/src/index.ts` | Modify | export projections |
| `src/mocks/lib/controls.ts` (+ test), `src/mocks/dev/DevPanel.tsx` | Modify | forced `rule_provider_paused` |
| `src/mocks/lib/requests.ts` (+ test) | Create | `openRequestsOf`, `customerViewOf` |
| `src/mocks/handlers/requests.ts` (+ test) | Modify | POST create, GET by ref |
| `src/lib/query-keys.ts` | Modify | `myRequests` keys |
| `src/lib/format.ts` (+ test) | Modify | `formatDeadline`, `SLOT_LABEL` |
| `src/lib/last-discover.ts` (+ test) | Modify | `lastDiscoverLoc` |
| `src/lib/error-copy.ts` (+ `error-copy.test.ts`) | Modify/Create | `requestRuleBanner` |
| `src/components/discard-changes-guard.tsx` | Modify | optional title/description |
| `src/features/requests/api.ts` | Create | `createRequest`, `fetchMyRequest` |
| `src/features/requests/hooks.ts` (+ test) | Create | `useCreateRequest`, `useMyRequest`, `useEligibility` |
| `src/features/requests/blocked-state.ts` (+ test) | Create | Eligibility → S12 blocked card |
| `src/features/requests/town-prefill.ts` (+ test) | Create | `initialTownId` |
| `src/features/requests/components/request-fieldset.tsx` | Create | fieldset + legend + error |
| `src/features/requests/components/service-options.tsx` | Create | service radio cards |
| `src/features/requests/components/slot-control.tsx` | Create | 3-column slot control |
| `src/features/requests/components/mobile-field.tsx` | Create | read-only row or `+94` input |
| `src/features/requests/components/provider-mini-row.tsx` | Create | 56/48 photo + name + trust + rating |
| `src/features/requests/components/request-summary.tsx` | Create | aside summary + `WhatHappensNext` |
| `src/features/requests/components/blocked-card.tsx` | Create | renders a blocked state |
| `src/features/requests/components/request-form.tsx` | Create | the form card |
| `src/features/requests/components/request-form-skeleton.tsx` | Create | loading skeleton |
| `src/features/requests/pages/request-form-page.tsx` (+ test) | Create | S12 |
| `src/features/requests/pages/request-sent-page.tsx` (+ test) | Create | S13 |
| `src/app/chunks/customer.tsx` | Modify | wire S12, S13 |

## Tasks

### T1 — `CreateRequestBody` and `makeCreateRequestSchema`
- [x] done
**Files:** `packages/contracts/src/requests/schemas.ts`, `packages/contracts/src/requests/create-schema.test.ts`
**Context:** PRODUCT §6.2, BR-34; SPEC S12 field table; ARCH §2.5; D-1. `bookingWindow` exists in `requests/rules.ts`; `MobileInput`, `MOBILE_MESSAGE`, `Id`, `IsoDate` in `common/primitives.ts`; `formatInColombo`, `colomboStartOfDay` in `common/dates.ts`.
**Do:**
1. `git tag m08-start && git switch -c m08-request-form`.
2. Edit `packages/contracts/src/requests/schemas.ts`. Change the imports at the top to:
```ts
import { z } from 'zod';
import { colomboStartOfDay, formatInColombo } from '../common/dates';
import { CategoryIcon, PriceUnit, RequestActor, RequestStatus, ReviewVisibility, TimeSlot } from '../common/enums';
import { Id, IsoDate, IsoDateTime, Lkr, Mobile, MobileInput, RequestRef } from '../common/primitives';
import { bookingWindow } from './rules';
```
(`CategoryIcon`, `RequestActor`, `RequestStatus`, `ReviewVisibility`, `IsoDateTime`, `Mobile` are used in T2. If lint fails on unused imports in this task, add them in T2 instead.)
3. Add at the end of the file:
```ts
/** D-1: the SPEC message must be the first issue on an empty field. */
const required = (message: string) => z.string({ error: message }).min(1, message);

const longDate = (isoDate: string): string => formatInColombo(colomboStartOfDay(isoDate), 'EEE, d MMM yyyy');

/** SPEC S12 date range error, e.g. `Choose a date from Mon, 23 Nov 2026 to Thu, 21 Jan 2027.` */
export function bookingWindowMessage(now: Date): string {
  const { min, max } = bookingWindow(now);
  return `Choose a date from ${longDate(min)} to ${longDate(max)}.`;
}

export const CreateRequestBody = z.object({
  providerId: Id,
  serviceId: required('Choose a service.').pipe(Id),
  preferredDate: required('Choose a date.').pipe(IsoDate),
  slot: z.enum(TimeSlot.options, { error: 'Choose a time slot.' }),
  townId: required('Choose your town.').pipe(Id),
  addressLine1: z
    .string()
    .trim()
    .min(1, 'Enter your address.')
    .min(5, 'Enter a fuller address so the provider can find you.')
    .max(120, 'Keep each address line under 120 characters.'),
  addressLine2: z
    .string()
    .trim()
    .max(120, 'Keep each address line under 120 characters.')
    .optional()
    .transform((s) => (s === '' ? undefined : s)),
  description: z
    .string()
    .trim()
    .min(20, 'Describe the job in at least 20 characters.')
    .max(1000, 'Keep the description under 1,000 characters.'),
  mobile: MobileInput.optional(), // required only when the profile has none (rule mobile_missing)
});
export type CreateRequestBody = z.infer<typeof CreateRequestBody>;

/** Form schema: adds the BR-34 window for a given `now`. The server uses the rule `date_out_of_window` instead (D-2). */
export const makeCreateRequestSchema = (now: Date) =>
  CreateRequestBody.superRefine((v, ctx) => {
    if (typeof v.preferredDate !== 'string' || !IsoDate.safeParse(v.preferredDate).success) return;
    const { min, max } = bookingWindow(now);
    if (v.preferredDate < min || v.preferredDate > max)
      ctx.addIssue({ code: 'custom', path: ['preferredDate'], message: bookingWindowMessage(now) });
  });
```
**Test:** `packages/contracts/src/requests/create-schema.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { MOBILE_MESSAGE } from '../common/primitives';
import { bookingWindowMessage, makeCreateRequestSchema } from './schemas';

const now = new Date('2026-11-22T04:30:00.000Z'); // Sun 22 Nov 2026, 10:00 Colombo
const schema = makeCreateRequestSchema(now);
const valid = {
  providerId: 'p03',
  serviceId: 's-p03-1',
  preferredDate: '2026-11-25',
  slot: 'morning',
  townId: 'colombo',
  addressLine1: '12 Galle Road',
  addressLine2: '',
  description: 'Two sockets in the kitchen stopped working.',
};
const firstByPath = (e: z.ZodError): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const i of e.issues) out[i.path.join('.')] ??= i.message;
  return out;
};

describe('makeCreateRequestSchema', () => {
  it('empty form → the six SPEC messages and no range message', () => {
    const r = schema.safeParse({ providerId: 'p03', serviceId: '', preferredDate: '', townId: '', addressLine1: '', addressLine2: '', description: '' });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(firstByPath(r.error)).toEqual({
      serviceId: 'Choose a service.',
      preferredDate: 'Choose a date.',
      slot: 'Choose a time slot.',
      townId: 'Choose your town.',
      addressLine1: 'Enter your address.',
      description: 'Describe the job in at least 20 characters.',
    });
  });
  it('window message text', () => {
    expect(bookingWindowMessage(now)).toBe('Choose a date from Mon, 23 Nov 2026 to Thu, 21 Jan 2027.');
  });
  it.each(['2026-11-22', '2027-01-22'])('%s is outside the window', (d) => {
    const r = schema.safeParse({ ...valid, preferredDate: d });
    expect(r.success).toBe(false);
    if (!r.success) expect(firstByPath(r.error).preferredDate).toBe(bookingWindowMessage(now));
  });
  it.each(['2026-11-23', '2027-01-21'])('%s is inside the window', (d) => {
    expect(schema.safeParse({ ...valid, preferredDate: d }).success).toBe(true);
  });
  it('short address, empty line 2, mobile normalisation', () => {
    const short = schema.safeParse({ ...valid, addressLine1: 'abc' });
    expect(short.success).toBe(false);
    if (!short.success) expect(firstByPath(short.error).addressLine1).toBe('Enter a fuller address so the provider can find you.');
    const ok = schema.parse({ ...valid, mobile: '077 123 4567' });
    expect(ok.addressLine2).toBeUndefined();
    expect(ok.mobile).toBe('+94771234567');
    const bad = schema.safeParse({ ...valid, mobile: '' });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(firstByPath(bad.error).mobile).toBe(MOBILE_MESSAGE);
  });
  it('description over 1,000 characters', () => {
    const r = schema.safeParse({ ...valid, description: 'x'.repeat(1001) });
    expect(r.success).toBe(false);
    if (!r.success) expect(firstByPath(r.error).description).toBe('Keep the description under 1,000 characters.');
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green; then `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): CreateRequestBody and booking-window form schema (M08-T1)"`

### T2 — `StatusEvent` and `CustomerRequestView` schemas
- [ ] done
**Files:** `packages/contracts/src/requests/schemas.ts`
**Context:** ARCH §2.5 (`RequestBase`, `CustomerRequestView`); PRODUCT §6.3. Only the customer view is in scope. Provider and admin views come in later milestones.
**Do:** Add to `requests/schemas.ts` (inline town ref to avoid a `catalog` import cycle):
```ts
export const StatusEvent = z.object({
  status: RequestStatus,
  at: IsoDateTime,
  actor: RequestActor,
  actorName: z.string().nullable(), // filled in admin views only
  reason: z.string().nullable(),
});
export type StatusEvent = z.infer<typeof StatusEvent>;

const RequestBase = z.object({
  ref: RequestRef,
  status: RequestStatus,
  service: ServiceSnapshot,
  preferredDate: IsoDate,
  slot: TimeSlot,
  town: z.object({ id: Id, name: z.string() }),
  description: z.string(),
  agreedPrice: Lkr.nullable(),
  reason: z.string().nullable(),
  closedBy: RequestActor.nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
  expiresAt: IsoDateTime,
  completedAt: IsoDateTime.nullable(),
  history: z.array(StatusEvent),
});

export const CustomerRequestView = RequestBase.extend({
  provider: z.object({
    id: Id,
    businessName: z.string(),
    photoUrl: z.string().nullable(),
    categoryIcon: CategoryIcon,
    verified: z.boolean(),
    rating: z.number().nullable(),
    reviewCount: z.number().int(),
    listed: z.boolean(),
    mobile: Mobile.nullable(), // only when accepted | completed (§6.3)
  }),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  customerMobile: Mobile,
  cancelDeadline: IsoDateTime,
  canCancel: z.boolean(),
  review: z
    .object({
      eligible: z.boolean(),
      deadline: IsoDateTime.nullable(),
      own: z
        .object({ id: Id, rating: z.number().int(), text: z.string(), createdAt: IsoDateTime, visibility: ReviewVisibility })
        .nullable(),
    })
    .nullable(), // null unless completed
});
export type CustomerRequestView = z.infer<typeof CustomerRequestView>;
```
`ServiceSnapshot` is already defined at the top of the file. Keep `PriceUnit` imported (it is used by `ServiceSnapshot`).
**Verify:** `pnpm --filter @fixit/contracts typecheck` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): CustomerRequestView schema (M08-T2)"`

### T3 — `checkCreateRequest`
- [ ] done
**Files:** `packages/contracts/src/requests/rules.ts`, `packages/contracts/src/requests/rules.test.ts`
**Context:** ARCH §2.8 signature; SPEC S12 blocked-state order, then the field rules; BR-16, BR-15, BR-23, BR-33, BR-34; `RuleCode` in `common/errors.ts`.
**Do:** Add to `rules.ts`:
```ts
import type { RuleCode } from '../common/errors';
import type { CreateRequestBody } from './schemas';

export interface CreateRequestContext {
  now: Date;
  customer: { id: string; emailConfirmed: boolean; hasMobile: boolean };
  provider: { userId: string; listed: boolean; paused: boolean; serviceIds: readonly string[]; townIds: readonly string[] };
  openTotal: number;
  openWithProviderRef: string | null;
  body: CreateRequestBody;
}
export type CreateRequestCheck = { ok: true } | { ok: false; rule: RuleCode; ref?: string };

const fail = (rule: RuleCode): CreateRequestCheck => ({ ok: false, rule });

/** Pure pre-check for A11. Callers gather the inputs (API under row lock, mocks from db). Order = SPEC S12 blocked states, then field rules. */
export function checkCreateRequest(c: CreateRequestContext): CreateRequestCheck {
  if (c.provider.userId === c.customer.id) return fail('own_listing');
  if (!c.provider.listed) return fail('provider_unavailable');
  if (c.provider.paused) return fail('provider_paused');
  if (!c.customer.emailConfirmed) return fail('email_unconfirmed');
  if (c.openWithProviderRef !== null) return { ok: false, rule: 'open_with_provider', ref: c.openWithProviderRef };
  if (c.openTotal >= OPEN_LIMIT_TOTAL) return fail('open_limit_reached');
  if (!c.customer.hasMobile && c.body.mobile === undefined) return fail('mobile_missing');
  if (!c.provider.serviceIds.includes(c.body.serviceId)) return fail('service_not_offered');
  if (!c.provider.townIds.includes(c.body.townId)) return fail('town_not_served');
  const { min, max } = bookingWindow(c.now);
  if (c.body.preferredDate < min || c.body.preferredDate > max) return fail('date_out_of_window');
  return { ok: true };
}
```
(Put the imports at the top of the file. `schemas.ts` imports `bookingWindow` from `rules.ts`. This import is type-only, so there is no runtime cycle.)
**Test:** append to `rules.test.ts` (add `checkCreateRequest`, `CreateRequestContext` to its imports from `./rules`):
```ts
describe('checkCreateRequest (S12 order)', () => {
  const now = new Date('2026-11-22T04:30:00.000Z');
  const base: CreateRequestContext = {
    now,
    customer: { id: 'u-c', emailConfirmed: true, hasMobile: true },
    provider: { userId: 'u-p', listed: true, paused: false, serviceIds: ['s1'], townIds: ['colombo'] },
    openTotal: 0,
    openWithProviderRef: null,
    body: { providerId: 'p1', serviceId: 's1', preferredDate: '2026-11-25', slot: 'morning', townId: 'colombo', addressLine1: '12 Galle Road', description: 'Two sockets in the kitchen stopped working.' },
  };
  const all = (o: Partial<CreateRequestContext>): CreateRequestContext => ({ ...base, ...o });
  it('ok', () => { expect(checkCreateRequest(base)).toEqual({ ok: true }); });
  it.each([
    ['own_listing beats paused', all({ customer: { ...base.customer, id: 'u-p' }, provider: { ...base.provider, paused: true } }), 'own_listing'],
    ['provider_unavailable beats paused', all({ provider: { ...base.provider, listed: false, paused: true } }), 'provider_unavailable'],
    ['provider_paused beats unconfirmed', all({ provider: { ...base.provider, paused: true }, customer: { ...base.customer, emailConfirmed: false } }), 'provider_paused'],
    ['email_unconfirmed beats open', all({ customer: { ...base.customer, emailConfirmed: false }, openWithProviderRef: 'FX-2061' }), 'email_unconfirmed'],
    ['open_limit_reached', all({ openTotal: 5 }), 'open_limit_reached'],
    ['mobile_missing', all({ customer: { ...base.customer, hasMobile: false } }), 'mobile_missing'],
    ['service_not_offered', all({ body: { ...base.body, serviceId: 's9' } }), 'service_not_offered'],
    ['town_not_served', all({ body: { ...base.body, townId: 'galle' } }), 'town_not_served'],
    ['date today', all({ body: { ...base.body, preferredDate: '2026-11-22' } }), 'date_out_of_window'],
    ['date +61', all({ body: { ...base.body, preferredDate: '2027-01-22' } }), 'date_out_of_window'],
  ] as const)('%s', (_name, ctx, rule) => {
    expect(checkCreateRequest(ctx)).toEqual({ ok: false, rule });
  });
  it('open_with_provider carries the ref and beats the total limit', () => {
    expect(checkCreateRequest(all({ openWithProviderRef: 'FX-2061', openTotal: 5 }))).toEqual({ ok: false, rule: 'open_with_provider', ref: 'FX-2061' });
  });
  it('a mobile in the body satisfies BR-23', () => {
    expect(checkCreateRequest(all({ customer: { ...base.customer, hasMobile: false }, body: { ...base.body, mobile: '+94771234567' } }))).toEqual({ ok: true });
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): checkCreateRequest in SPEC S12 order (M08-T3)"`

### T4 — `reviewDeadline`
- [ ] done
**Files:** `packages/contracts/src/reviews/rules.ts`, `packages/contracts/src/reviews/rules.test.ts`
**Context:** BR-24 (30 days after completion). Needed by `toCustomerView` (T5).
**Do:** Add to `reviews/rules.ts`:
```ts
export const REVIEW_WINDOW_DAYS = 30;
/** BR-24: reviews are accepted while now < completedAt + 30 days. */
export function reviewDeadline(completedAt: Date): Date {
  return new Date(completedAt.getTime() + REVIEW_WINDOW_DAYS * 86_400_000);
}
```
**Test:** append to `reviews/rules.test.ts`:
```ts
describe('reviewDeadline', () => {
  it('is 30 days after completion', () => {
    expect(reviewDeadline(new Date('2026-11-21T10:00:00.000Z')).toISOString()).toBe('2026-12-21T10:00:00.000Z');
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test`; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): reviewDeadline (M08-T4)"`

### T5 — `toCustomerView` projection
- [ ] done
**Files:** `packages/contracts/src/requests/projections.ts`, `packages/contracts/src/requests/projections.test.ts`, `packages/contracts/src/index.ts`
**Context:** ARCH §2.9 projections; PRODUCT §6.3 (provider mobile only when Accepted/Completed); BR-30 `canCancel` via `canTransition`; `RequestRecord`, `toMachineRequest` in `record.ts`; `cancelDeadline` in `rules.ts`.
**Do:**
1. Create `projections.ts`:
```ts
import type { CategoryIcon, RequestStatus, ReviewVisibility } from '../common/enums';
import { reviewDeadline } from '../reviews/rules';
import { toMachineRequest, type RequestRecord } from './record';
import { cancelDeadline } from './rules';
import type { CustomerRequestView } from './schemas';
import { canTransition } from './state-machine';

const REVEALED: readonly RequestStatus[] = ['accepted', 'completed'];

export interface CustomerViewContext {
  provider: {
    id: string; businessName: string; photoUrl: string | null; categoryIcon: CategoryIcon;
    verified: boolean; rating: number | null; reviewCount: number; listed: boolean; mobile: string | null;
  };
  town: { id: string; name: string };
  ownReview: { id: string; rating: number; text: string; createdAt: string; visibility: ReviewVisibility } | null;
}

/** PRODUCT §6.3 for the customer: the provider's mobile only while Accepted or Completed. */
export function toCustomerView(r: RequestRecord, ctx: CustomerViewContext, now: Date): CustomerRequestView {
  let review: CustomerRequestView['review'] = null;
  if (r.status === 'completed' && r.completedAt !== null) {
    const deadline = reviewDeadline(new Date(r.completedAt));
    review = {
      eligible: ctx.ownReview === null && now.getTime() < deadline.getTime(),
      deadline: deadline.toISOString(),
      own: ctx.ownReview,
    };
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
    history: r.events.map((e) => ({ status: e.status, at: e.at, actor: e.actor, actorName: null, reason: e.reason })),
    provider: { ...ctx.provider, mobile: REVEALED.includes(r.status) ? ctx.provider.mobile : null },
    addressLine1: r.addressLine1,
    addressLine2: r.addressLine2,
    customerMobile: r.customerMobile,
    cancelDeadline: cancelDeadline(r.preferredDate).toISOString(),
    canCancel: canTransition(toMachineRequest(r), 'cancelled', { kind: 'customer', userId: r.customerId }, now).ok,
  };
}
```
2. `index.ts`: add `export * from './requests/projections';`.
**Test:** `projections.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import type { RequestStatus } from '../common/enums';
import type { RequestRecord } from './record';
import { toCustomerView, type CustomerViewContext } from './projections';
import { CustomerRequestView } from './schemas';

const now = new Date('2026-11-22T04:30:00.000Z');
const at = '2026-11-22T04:00:00.000Z';
const base: RequestRecord = {
  id: 'r-FX-3000', ref: 'FX-3000', customerId: 'u-c', providerId: 'p-1', providerUserId: 'u-p', serviceId: 's-1',
  service: { name: 'Leak repair', price: 2500, unit: 'per_hour' }, preferredDate: '2026-11-25', slot: 'morning',
  townId: 'colombo', addressLine1: '12 Galle Road', addressLine2: null, description: 'Kitchen tap is leaking badly.',
  customerMobile: '+94770001001', agreedPrice: null, status: 'pending', reason: null, closedBy: null,
  createdAt: at, updatedAt: at, expiresAt: '2026-11-24T18:30:00.000Z', completedAt: null,
  events: [{ status: 'pending', at, actor: 'customer', actorUserId: 'u-c', reason: null }],
};
const ctx: CustomerViewContext = {
  provider: { id: 'p-1', businessName: 'Bell & Sons Plumbing', photoUrl: null, categoryIcon: 'wrench', verified: true, rating: 4.9, reviewCount: 212, listed: true, mobile: '+94770001101' },
  town: { id: 'colombo', name: 'Colombo' },
  ownReview: null,
};
const view = (o: Partial<RequestRecord>, c: CustomerViewContext = ctx) =>
  CustomerRequestView.parse(toCustomerView({ ...base, ...o }, c, now));

describe('toCustomerView', () => {
  it.each<[RequestStatus, string | null]>([
    ['pending', null], ['accepted', '+94770001101'], ['completed', '+94770001101'],
    ['declined', null], ['cancelled', null], ['expired', null],
  ])('%s → provider mobile %s', (status, mobile) => {
    const completedAt = status === 'completed' ? '2026-11-21T10:00:00.000Z' : null;
    expect(view({ status, completedAt }).provider.mobile).toBe(mobile);
  });
  it('pending: history, cancel deadline, canCancel, no review block', () => {
    const v = view({});
    expect(v.history).toEqual([{ status: 'pending', at, actor: 'customer', actorName: null, reason: null }]);
    expect(v.cancelDeadline).toBe('2026-11-24T18:30:00.000Z');
    expect(v.canCancel).toBe(true);
    expect(v.review).toBeNull();
    expect(v.addressLine1).toBe('12 Galle Road');
  });
  it('expired: cannot cancel', () => {
    expect(view({ status: 'expired' }).canCancel).toBe(false);
  });
  it('completed: review window, then own review closes eligibility', () => {
    const completedAt = '2026-11-21T10:00:00.000Z';
    expect(view({ status: 'completed', completedAt }).review).toEqual({ eligible: true, deadline: '2026-12-21T10:00:00.000Z', own: null });
    const own = { id: 'rv1', rating: 5, text: 'Great work, on time.', createdAt: at, visibility: 'visible' as const };
    expect(view({ status: 'completed', completedAt }, { ...ctx, ownReview: own }).review?.eligible).toBe(false);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test`; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): toCustomerView projection (M08-T5)"`

### T6 — Endpoint entries `requests_create`, `requests_get`
- [ ] done
**Files:** `packages/contracts/src/endpoints.ts`, `packages/contracts/src/endpoints.test.ts`
**Context:** ARCH §3.4 rows `POST /me/requests` and `GET /me/requests/:ref`.
**Do:**
1. Import `CreateRequestBody, CustomerRequestView` from `./requests/schemas` (same import line as `Eligibility`).
2. Add after `requests_eligibility`:
```ts
  requests_create: {
    id: 'requests_create',
    domain: 'requests',
    method: 'POST',
    path: '/me/requests',
    access: ['user'],
    owner: 'self',
    body: CreateRequestBody,
    response: CustomerRequestView,
    refs: ['F-11', 'F-14', 'S12', 'A11'],
  },
  requests_get: {
    id: 'requests_get',
    domain: 'requests',
    method: 'GET',
    path: '/me/requests/:ref',
    access: ['user'],
    owner: 'request_customer',
    response: CustomerRequestView,
    refs: ['S13', 'S15'],
  },
```
**Test:** add to `endpoints.test.ts`:
```ts
  it('M08 request rows match ARCHITECTURE §3.4', () => {
    expect(ENDPOINTS.requests_create).toMatchObject({ method: 'POST', path: '/me/requests', access: ['user'], owner: 'self', domain: 'requests' });
    expect(ENDPOINTS.requests_get).toMatchObject({ method: 'GET', path: '/me/requests/:ref', access: ['user'], owner: 'request_customer', domain: 'requests' });
  });
```
**Verify:** `pnpm --filter @fixit/contracts test`. If a web test fails with "every endpoint has an MSW handler", that is expected until T9. In that case run `pnpm verify` at the end of T9 and say so in this commit message body. Otherwise `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): request create/get endpoint entries (M08-T6)"`

### T7 — Forced `rule_provider_paused` in mock controls
- [ ] done
**Files:** `src/mocks/lib/controls.ts`, `src/mocks/lib/controls.test.ts`, `src/mocks/dev/DevPanel.tsx`
**Context:** AC6; D-7; ARCH §4.5 "Force next error".
**Do:**
1. `controls.ts`: `export const FORCED_KINDS = ['500', '409', '401', 'network', 'rule_provider_paused'] as const;` and add to the `forcedResponse` switch:
```ts
    case 'rule_provider_paused':
      return errorResponse(422, 'RULE_VIOLATION', 'Forced provider_paused (DevPanel)', {
        details: { rule: 'provider_paused' },
      });
```
2. `DevPanel.tsx` `FORCED_LABEL`: add `rule_provider_paused: '422 RULE_VIOLATION provider_paused',`.
**Test:** append to `controls.test.ts`:
```ts
  it('rule_provider_paused → 422 with details.rule', async () => {
    const res = forcedResponse('rule_provider_paused');
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: { code: string; details: { rule: string } } };
    expect(body.error.code).toBe('RULE_VIOLATION');
    expect(body.error.details.rule).toBe('provider_paused');
  });
```
(import `forcedResponse` if not yet imported.)
**Verify:** `pnpm --filter @fixit/web test -- controls`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): DevPanel forced provider_paused rule error (M08-T7)"`

### T8 — Mock helpers `openRequestsOf`, `customerViewOf`
- [ ] done
**Files:** `src/mocks/lib/requests.ts`, `src/mocks/lib/requests.test.ts`
**Context:** CLAUDE mock rules (project with `toCustomerView`); `isListed` in `mocks/lib/cards.ts`; fixture request FX-2061 (Olivia → p01, pending), FX-2046 (Olivia, completed).
**Do:** Create `requests.ts`:
```ts
import { OPEN_STATUSES, toCustomerView, type CustomerRequestView, type RequestRecord, type RequestStatus } from '@fixit/contracts';
import type { MockDb } from '../db/schema';
import { isListed } from './cards';
import { mockError } from './errors';

const isOpen = (s: RequestStatus): boolean => (OPEN_STATUSES as readonly RequestStatus[]).includes(s);

export function openRequestsOf(d: MockDb, customerId: string): RequestRecord[] {
  return Object.values(d.requests).filter((r) => r.customerId === customerId && isOpen(r.status));
}

/** Gathers what the API mapper will gather, then projects with contracts (D18: privacy exists once). */
export function customerViewOf(d: MockDb, r: RequestRecord, now: Date): CustomerRequestView {
  const p = d.providers[r.providerId];
  const owner = p ? d.users[p.userId] : undefined;
  const category = d.categories.find((c) => c.id === p?.categoryId);
  if (!p || !owner || !category) throw mockError(500, 'INTERNAL', `Request ${r.ref} references a missing provider`);
  const town = d.towns.find((t) => t.id === r.townId);
  const review = Object.values(d.reviews).find((x) => x.requestId === r.id && x.authorId === r.customerId);
  return toCustomerView(
    r,
    {
      provider: {
        id: p.id,
        businessName: p.businessName ?? '',
        photoUrl: p.photoKey ? `/api/files/photos/${p.photoKey}` : null,
        categoryIcon: category.icon,
        verified: p.verificationStatus === 'verified',
        rating: p.reviewCount > 0 ? p.ratingAvg : null,
        reviewCount: p.reviewCount,
        listed: isListed(d, p),
        mobile: owner.mobile,
      },
      town: { id: r.townId, name: town?.name ?? r.townId },
      ownReview: review
        ? { id: review.id, rating: review.rating, text: review.text, createdAt: review.createdAt, visibility: review.visibility }
        : null,
    },
    now,
  );
}
```
**Test:** `requests.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { CustomerRequestView } from '@fixit/contracts';
import { db } from '../db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { customerViewOf, openRequestsOf } from './requests';

const byRef = (ref: string) => {
  const r = Object.values(db().requests).find((x) => x.ref === ref);
  if (!r) throw new Error(ref);
  return r;
};

describe('mock request helpers', () => {
  it('Olivia has FX-2061 open', () => {
    expect(openRequestsOf(db(), 'u-olivia').map((r) => r.ref)).toContain('FX-2061');
  });
  it('pending view hides the provider mobile', () => {
    const v = CustomerRequestView.parse(customerViewOf(db(), byRef('FX-2061'), FIXED_NOW));
    expect(v.provider.businessName).toBe('Bell & Sons Plumbing');
    expect(v.provider.mobile).toBeNull();
  });
  it('completed view shows it and has a review block', () => {
    const v = customerViewOf(db(), byRef('FX-2046'), FIXED_NOW);
    expect(v.provider.mobile).not.toBeNull();
    expect(v.review).not.toBeNull();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- mocks/lib/requests`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock request view helpers (M08-T8)"`

### T9 — `POST /me/requests` and `GET /me/requests/:ref` handlers
- [ ] done
**Files:** `src/mocks/handlers/requests.ts`, `src/mocks/handlers/requests-create.test.ts`
**Context:** ARCH §3.4, §4.3 (expireDue at the start of request handlers), §7.5 (`FX-` + `refSeq`, seeded 2062); A11; D-2, D-6, D-8. `mockEndpoint` already returns 401 (anon) / 403 (admin) and 400 `VALIDATION_FAILED` with `fieldErrors` for a bad body.
**Do:** Replace `requests.ts` with:
```ts
import { checkCreateRequest, ENDPOINTS as E, expiresAt, type RequestRecord } from '@fixit/contracts';
import { expireDue } from '../db/expire';
import { isListed } from '../lib/cards';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
import { eligibilityFor } from '../lib/profile';
import { customerViewOf, openRequestsOf } from '../lib/requests';

export const requestsHandlers = [
  mockEndpoint(E.requests_eligibility, ({ db: d, actor, params }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required'); // assertAccess already guarantees this
    return eligibilityFor(d, actor.userId, params.providerId ?? '');
  }),

  mockEndpoint(E.requests_create, ({ db: d, actor, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const user = d.users[actor.userId];
    if (!user) throw mockError(401, 'UNAUTHENTICATED', 'Unknown user');
    const p = d.providers[body.providerId];
    const open = openRequestsOf(d, user.id);
    const check = checkCreateRequest({
      now,
      customer: { id: user.id, emailConfirmed: user.emailConfirmedAt !== null, hasMobile: user.mobile !== null },
      provider: p
        ? {
            userId: p.userId,
            listed: isListed(d, p),
            paused: p.paused,
            serviceIds: Object.values(d.services).filter((s) => s.providerId === p.id).map((s) => s.id),
            townIds: d.areas.filter((a) => a.providerId === p.id).map((a) => a.townId),
          }
        : { userId: '', listed: false, paused: false, serviceIds: [], townIds: [] },
      openTotal: open.length,
      openWithProviderRef: open.find((r) => r.providerId === body.providerId)?.ref ?? null,
      body,
    });
    if (!check.ok)
      throw mockError(422, 'RULE_VIOLATION', check.rule, {
        details: { rule: check.rule, ...(check.ref ? { ref: check.ref } : {}) },
      });
    const service = d.services[body.serviceId];
    // unreachable after checkCreateRequest (listed + service_not_offered), but narrows the types
    if (!p || !service) throw mockError(500, 'INTERNAL', 'Provider or service vanished');
    if (user.mobile === null && body.mobile !== undefined) user.mobile = body.mobile; // BR-23: saved to the profile
    if (user.mobile === null) throw mockError(500, 'INTERNAL', 'mobile_missing passed without a mobile');
    const at = now.toISOString();
    const ref = `FX-${String(d.refSeq)}`;
    d.refSeq += 1;
    const record: RequestRecord = {
      id: `r-${ref}`,
      ref,
      customerId: user.id,
      providerId: p.id,
      providerUserId: p.userId,
      serviceId: service.id,
      service: { name: service.name, price: service.price, unit: service.unit },
      preferredDate: body.preferredDate,
      slot: body.slot,
      townId: body.townId,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2 ?? null,
      description: body.description,
      customerMobile: user.mobile,
      agreedPrice: null,
      status: 'pending',
      reason: null,
      closedBy: null,
      createdAt: at,
      updatedAt: at,
      expiresAt: expiresAt(now, body.preferredDate).toISOString(),
      completedAt: null,
      events: [{ status: 'pending', at, actor: 'customer', actorUserId: user.id, reason: null }],
    };
    d.requests[record.id] = record;
    return customerViewOf(d, record, now);
  }),

  mockEndpoint(E.requests_get, ({ db: d, actor, params, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const r = Object.values(d.requests).find((x) => x.ref === params.ref && x.customerId === actor.userId);
    if (!r) throw mockError(404, 'NOT_FOUND', 'Request not found'); // other owner → 404, never 403
    return customerViewOf(d, r, now);
  }),
];
```
**Test:** `requests-create.test.ts`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bookingWindow, colomboToday, CustomerRequestView, ErrorEnvelope } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { commit, db } from '@/mocks/db/store';
import { buildMe } from '@/mocks/lib/me';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const api = (path: string, persona?: PersonaKey, body?: unknown) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (persona) headers.Authorization = `Bearer ${signInAs(persona).accessToken}`;
  return fetch(new URL(`/api${path}`, window.location.origin), {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
};
const serviceOf = (providerId: string) => {
  const s = Object.values(db().services).find((x) => x.providerId === providerId);
  if (!s) throw new Error(providerId);
  return s.id;
};
const townOf = (providerId: string) => {
  const a = db().areas.find((x) => x.providerId === providerId);
  if (!a) throw new Error(providerId);
  return a.townId;
};
const bodyFor = (providerId: string, extra: Record<string, unknown> = {}) => ({
  providerId,
  serviceId: serviceOf(providerId),
  preferredDate: bookingWindow(FIXED_NOW).min,
  slot: 'morning',
  townId: townOf(providerId),
  addressLine1: '12 Galle Road',
  description: 'Two sockets in the kitchen stopped working.',
  ...extra,
});
const ruleOf = async (res: Response) => ErrorEnvelope.parse(await res.json()).error.details?.rule;

describe('POST /me/requests', () => {
  beforeEach(() => { vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }); });
  afterEach(() => { vi.useRealTimers(); });

  it('Olivia → p03: 200, FX-2062, pending, mobile hidden, provider pending count +1', async () => {
    const before = buildMe(db(), 'u-priya').provider?.pendingRequestCount ?? 0;
    const res = await api('/me/requests', 'customer', bodyFor('p03'));
    expect(res.status).toBe(200);
    const v = CustomerRequestView.parse(await res.json());
    expect(v.ref).toBe('FX-2062');
    expect(v.status).toBe('pending');
    expect(v.provider.mobile).toBeNull();
    expect(buildMe(db(), 'u-priya').provider?.pendingRequestCount).toBe(before + 1);
    const again = await api('/me/request-eligibility/p03', 'customer');
    expect(await again.json()).toEqual({ state: 'open_with_provider', ref: 'FX-2062' });
  });
  it.each([
    ['provider', 'p01', 'own_listing'],
    ['customer', 'p13', 'provider_paused'],
    ['customer', 'p14', 'provider_unavailable'],
    ['customerUnconfirmed', 'p03', 'email_unconfirmed'],
    ['customer', 'p01', 'open_with_provider'],
    ['customerAtLimit', 'p02', 'open_limit_reached'],
  ] as const)('%s → %s: 422 %s', async (persona, providerId, rule) => {
    const res = await api('/me/requests', persona, bodyFor(providerId));
    expect(res.status).toBe(422);
    expect(await ruleOf(res)).toBe(rule);
  });
  it('open_with_provider carries the existing ref', async () => {
    const res = await api('/me/requests', 'customer', bodyFor('p01'));
    expect(ErrorEnvelope.parse(await res.json()).error.details?.ref).toBe('FX-2061');
  });
  it('field rules: service, town, date', async () => {
    expect(await ruleOf(await api('/me/requests', 'customer', bodyFor('p03', { serviceId: serviceOf('p02') })))).toBe('service_not_offered');
    const served = new Set(db().areas.filter((a) => a.providerId === 'p03').map((a) => a.townId));
    const other = db().towns.find((t) => !served.has(t.id));
    expect(await ruleOf(await api('/me/requests', 'customer', bodyFor('p03', { townId: other?.id })))).toBe('town_not_served');
    expect(await ruleOf(await api('/me/requests', 'customer', bodyFor('p03', { preferredDate: colomboToday(FIXED_NOW) })))).toBe('date_out_of_window');
  });
  it('mobile: missing → mobile_missing; given → saved to the user', async () => {
    const nimal = db().users['u-nimal'];
    if (!nimal) throw new Error('u-nimal');
    nimal.emailConfirmedAt = FIXED_NOW.toISOString();
    commit();
    expect(await ruleOf(await api('/me/requests', 'customerUnconfirmed', bodyFor('p03')))).toBe('mobile_missing');
    const res = await api('/me/requests', 'customerUnconfirmed', bodyFor('p03', { mobile: '077 123 4567' }));
    expect(res.status).toBe(200);
    expect(db().users['u-nimal']?.mobile).toBe('+94771234567');
  });
  it('empty body → 400 with field errors', async () => {
    const res = await api('/me/requests', 'customer', { providerId: 'p03' });
    expect(res.status).toBe(400);
    const env = ErrorEnvelope.parse(await res.json());
    expect(Object.keys(env.error.fieldErrors ?? {})).toEqual(expect.arrayContaining(['serviceId', 'preferredDate', 'slot', 'townId', 'addressLine1', 'description']));
  });
  it('anonymous → 401, admin → 403', async () => {
    expect((await api('/me/requests', undefined, bodyFor('p03'))).status).toBe(401);
    expect((await api('/me/requests', 'admin', bodyFor('p03'))).status).toBe(403);
  });
});

describe('GET /me/requests/:ref', () => {
  beforeEach(() => { vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }); });
  afterEach(() => { vi.useRealTimers(); });
  it('owner → 200', async () => {
    const res = await api('/me/requests/FX-2061', 'customer');
    expect(res.status).toBe(200);
    expect(CustomerRequestView.parse(await res.json()).ref).toBe('FX-2061');
  });
  it.each([
    ['customer', 'FX-2059'], // another customer's
    ['provider', 'FX-2061'], // the provider of it, as a customer
    ['customer', 'FX-9999'], // unknown
  ] as const)('%s on %s → 404', async (persona, ref) => {
    expect((await api(`/me/requests/${ref}`, persona)).status).toBe(404);
  });
  it('anonymous → 401, admin → 403', async () => {
    expect((await api('/me/requests/FX-2061')).status).toBe(401);
    expect((await api('/me/requests/FX-2061', 'admin')).status).toBe(403);
  });
});
```
If `commit` is not exported from `@/mocks/db/store`, use whatever `store.ts` exports to persist (read it). Do not add a new export.
**Verify:** `pnpm --filter @fixit/web test -- requests-create`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock create-request and get-request handlers (M08-T9)"`

### T10 — Query keys and requests api
- [ ] done
**Files:** `src/lib/query-keys.ts`, `src/features/requests/api.ts`
**Context:** ARCH §4.2.
**Do:**
1. `query-keys.ts`: add to `qk`:
```ts
  myRequests: {
    all: ['requests', 'mine'] as const,
    detail: (ref: string) => ['requests', 'mine', ref] as const,
  },
```
2. Create `features/requests/api.ts`:
```ts
import { ENDPOINTS as E, type CreateRequestBody, type CustomerRequestView } from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export const createRequest = (body: CreateRequestBody): Promise<CustomerRequestView> =>
  http(pathOf(E.requests_create), { method: 'POST', body, schema: E.requests_create.response });

export const fetchMyRequest = (ref: string): Promise<CustomerRequestView> =>
  http(pathOf(E.requests_get, { ref }), { schema: E.requests_get.response });
```
**Verify:** `pnpm --filter @fixit/web typecheck`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): request api functions and query keys (M08-T10)"`

### T11 — `formatDeadline` and `SLOT_LABEL`
- [ ] done
**Files:** `src/lib/format.ts`, `src/lib/format.test.ts`
**Context:** SPEC S13.E2 `{Sat, 21 Nov, 3:42 PM}`; S12 slot labels `Morning` · `Afternoon` · `Evening`.
**Do:** Add to `format.ts`:
```ts
import type { TimeSlot } from '@fixit/contracts'; // merge into the existing contracts import

/** `Sat, 21 Nov, 3:42 PM` (S13 reply deadline) */
export const formatDeadline = (value: string | Date): string =>
  formatInColombo(toInstant(value), 'EEE, d MMM, h:mm a');

export const SLOT_LABEL: Record<TimeSlot, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
```
**Test:** append to `format.test.ts`:
```ts
describe('formatDeadline', () => {
  it('formats in Colombo', () => {
    expect(formatDeadline('2026-11-21T10:12:00.000Z')).toBe('Sat, 21 Nov, 3:42 PM');
    expect(formatDeadline('2026-11-22T18:30:00.000Z')).toBe('Mon, 23 Nov, 12:00 AM');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- format`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): deadline formatter and slot labels (M08-T11)"`

### T12 — `lastDiscoverLoc` and `initialTownId`
- [ ] done
**Files:** `src/lib/last-discover.ts`, `src/lib/last-discover.test.ts`, `src/features/requests/town-prefill.ts`, `src/features/requests/town-prefill.test.ts`
**Context:** SPEC S12 Town "Prefilled from the Discover `loc` if it's in the list"; §8.2 last Discover URL.
**Do:**
1. Add to `last-discover.ts`:
```ts
/** The `loc` of the last Discover URL, or null. */
export function lastDiscoverLoc(): string | null {
  const url = lastDiscoverUrl();
  const i = url.indexOf('?');
  return i === -1 ? null : new URLSearchParams(url.slice(i)).get('loc');
}
```
2. Create `town-prefill.ts`:
```ts
/** S12: the Discover `loc` if the provider serves it, else empty (no choice). */
export function initialTownId(areas: readonly { id: string }[], loc: string | null): string {
  return loc !== null && areas.some((a) => a.id === loc) ? loc : '';
}
```
**Test:** append to `last-discover.test.ts`:
```ts
describe('lastDiscoverLoc', () => {
  it('reads loc or null', () => {
    expect(lastDiscoverLoc()).toBeNull();
    rememberDiscover('?q=plumb&loc=colombo');
    expect(lastDiscoverLoc()).toBe('colombo');
    rememberDiscover('?q=plumb');
    expect(lastDiscoverLoc()).toBeNull();
  });
});
```
(clear `sessionStorage` in a `beforeEach` if the file doesn't already.) `town-prefill.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { initialTownId } from './town-prefill';

const areas = [{ id: 'kotte' }, { id: 'colombo' }];
describe('initialTownId', () => {
  it.each([
    ['colombo', 'colombo'],
    ['galle', ''],
    [null, ''],
  ] as const)('%s → %s', (loc, out) => {
    expect(initialTownId(areas, loc)).toBe(out);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- last-discover town-prefill`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): town prefill from last Discover loc (M08-T12)"`

### T13 — Request rule banner copy
- [ ] done
**Files:** `src/lib/error-copy.ts`, `src/lib/error-copy.test.ts`
**Context:** SPEC S12.E6 (+ blocked-state copy for the limits), §6.3. Copy is written once in `lib/error-copy.ts` (CLAUDE).
**Do:** Add to `error-copy.ts`:
```ts
import { ApiError } from './http';

/** S12.E6. Returns the banner for a create-request rule, or null (caller falls back to mapApiErrorToForm → §6.3). */
export function requestRuleBanner(err: unknown, business: string): string | null {
  if (!(err instanceof ApiError)) return null;
  switch (err.rule) {
    case 'provider_paused':
    case 'provider_unavailable':
      return `${business} can't take requests right now. Your request wasn't sent.`;
    case 'open_with_provider':
      return `You already have an open request with ${business}. You can send another once this one is finished.`;
    case 'open_limit_reached':
      return 'You have 5 open requests. You can have up to 5 open requests at a time. Cancel one or wait for one to finish.';
    case 'date_out_of_window':
      return 'That date is no longer available. Choose another date.';
    default:
      return null;
  }
}
```
If importing `./http` into `error-copy.ts` creates an import cycle that lint reports (`import/no-cycle`), put the function in a new file `src/lib/request-error-copy.ts` instead and adjust imports. The copy stays in `lib/`.
**Test:** `error-copy.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { ApiError } from './http';
import { requestRuleBanner } from './error-copy';

const ruleErr = (rule: string) =>
  new ApiError(422, 'RULE_VIOLATION', 'x', { code: 'RULE_VIOLATION', message: 'x', requestId: 'r', details: { rule: rule as never } });

describe('requestRuleBanner', () => {
  it('paused / unavailable', () => {
    expect(requestRuleBanner(ruleErr('provider_paused'), 'BrightSpark Electric')).toBe("BrightSpark Electric can't take requests right now. Your request wasn't sent.");
    expect(requestRuleBanner(ruleErr('provider_unavailable'), 'X')).toBe("X can't take requests right now. Your request wasn't sent.");
  });
  it('date', () => {
    expect(requestRuleBanner(ruleErr('date_out_of_window'), 'X')).toBe('That date is no longer available. Choose another date.');
  });
  it('anything else → null', () => {
    expect(requestRuleBanner(new ApiError(500, 'INTERNAL', 'x'), 'X')).toBeNull();
    expect(requestRuleBanner(new Error('x'), 'X')).toBeNull();
  });
});
```
(Check the `ApiError` constructor signature in `lib/http.ts` and match it. If `details.rule` typing rejects the cast, build the envelope with a valid `RuleCode` literal per case instead.)
**Verify:** `pnpm --filter @fixit/web test -- error-copy`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): request rule banner copy (M08-T13)"`

### T14 — Requests hooks
- [ ] done
**Files:** `src/features/requests/hooks.ts`, `src/features/requests/hooks.test.tsx`
**Context:** ARCH §4.2; AC4 (mobile shows in `/account` afterwards → refresh `me`); `fetchEligibility` in `features/provider-profile/api.ts`; `fetchMe` in `features/auth/api.ts`.
**Do:** Create `hooks.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateRequestBody } from '@fixit/contracts';
import { fetchMe } from '@/features/auth/api';
import { fetchEligibility } from '@/features/provider-profile/api';
import { authStore } from '@/lib/auth-store';
import { qk } from '@/lib/query-keys';
import { createRequest, fetchMyRequest } from './api';

export const useEligibility = (providerId: string) =>
  useQuery({ queryKey: qk.eligibility(providerId), queryFn: () => fetchEligibility(providerId), retry: false });

export const useMyRequest = (ref: string) =>
  useQuery({ queryKey: qk.myRequests.detail(ref), queryFn: () => fetchMyRequest(ref), retry: false });

/** A11. Afterwards: S13 has the view cached, eligibility and lists refetch, `me` refreshes (mobile, openRequestCount). */
export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRequestBody) => createRequest(body),
    onSuccess: (view, body) => {
      qc.setQueryData(qk.myRequests.detail(view.ref), view);
      void qc.invalidateQueries({ queryKey: qk.eligibility(body.providerId) });
      void fetchMe()
        .then((me) => {
          authStore.setMe(me);
          qc.setQueryData(qk.me, me);
        })
        .catch(() => undefined); // the session layer handles auth failures
    },
  });
}
```
**Test:** `hooks.test.tsx`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { bookingWindow } from '@fixit/contracts';
import { authStore } from '@/lib/auth-store';
import { db, commit } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useCreateRequest, useMyRequest } from './hooks';

describe('requests hooks', () => {
  beforeEach(() => { vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }); });
  afterEach(() => { vi.useRealTimers(); });

  it('useMyRequest loads a view', async () => {
    signInAs('customer');
    const { result } = renderHook(() => useMyRequest('FX-2061'), { wrapper: createWrapper() });
    await waitFor(() => { expect(result.current.data?.ref).toBe('FX-2061'); });
  });
  it('useCreateRequest refreshes me with the saved mobile', async () => {
    const nimal = db().users['u-nimal'];
    if (!nimal) throw new Error('u-nimal');
    nimal.emailConfirmedAt = FIXED_NOW.toISOString();
    commit();
    signInAs('customerUnconfirmed');
    const service = Object.values(db().services).find((s) => s.providerId === 'p03');
    const { result } = renderHook(() => useCreateRequest(), { wrapper: createWrapper() });
    result.current.mutate({
      providerId: 'p03', serviceId: service?.id ?? '', preferredDate: bookingWindow(FIXED_NOW).min, slot: 'evening',
      townId: 'sri-jayawardenepura-kotte', addressLine1: '12 Galle Road', description: 'Two sockets in the kitchen stopped working.', mobile: '+94771234567',
    });
    await waitFor(() => { expect(authStore.getState().me?.mobile).toBe('+94771234567'); });
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- features/requests/hooks`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): requests hooks (M08-T14)"`

### T15 — Eligibility → S12 blocked state
- [ ] done
**Files:** `src/features/requests/blocked-state.ts`, `src/features/requests/blocked-state.test.ts`
**Context:** SPEC S12 "Blocked states" table (copy, icons, buttons); D-3.
**Do:** Create `blocked-state.ts`:
```ts
import type { Eligibility } from '@fixit/contracts';

export type BlockIcon = 'lock' | 'pause' | 'mail' | 'inbox';
export type BlockAction = { label: string; to: string } | { label: 'Resend email'; resend: true };
export type Block =
  | { kind: 'none' }
  | { kind: 'not_found' }
  | { kind: 'card'; icon: BlockIcon; title: string; body: string; action: BlockAction; secondary?: { label: string; to: string } };

export interface BlockContext {
  providerId: string;
  businessName: string;
  categoryId: string;
  email: string;
  loc: string | null;
}

/** SPEC S12 blocked states. undefined (eligibility failed to load), ok, guest, admin → no block (D-3). */
export function toBlock(e: Eligibility | undefined, c: BlockContext): Block {
  if (!e) return { kind: 'none' };
  switch (e.state) {
    case 'own_listing':
      return { kind: 'card', icon: 'lock', title: "You can't request your own listing", body: 'Customers see this page when they want to book you.', action: { label: 'Go to your dashboard', to: '/dashboard' } };
    case 'provider_unavailable':
      return { kind: 'not_found' };
    case 'provider_paused': {
      const q = new URLSearchParams({ cat: c.categoryId });
      if (c.loc) q.set('loc', c.loc);
      return { kind: 'card', icon: 'pause', title: `${c.businessName} isn't taking new requests right now`, body: 'Try again later or choose another provider.', action: { label: 'Find another provider', to: `/discover?${q.toString()}` } };
    }
    case 'email_unconfirmed':
      return { kind: 'card', icon: 'mail', title: 'Confirm your email first', body: `We sent a link to ${c.email}. Confirm it, then come back to send your request.`, action: { label: 'Resend email', resend: true }, secondary: { label: 'Back to profile', to: `/providers/${c.providerId}` } };
    case 'open_with_provider':
      return { kind: 'card', icon: 'inbox', title: `You already have an open request with ${c.businessName}`, body: 'You can send another once this one is finished.', action: { label: 'View request', to: `/requests/${e.ref}` } };
    case 'open_limit_reached':
      return { kind: 'card', icon: 'inbox', title: 'You have 5 open requests', body: 'You can have up to 5 open requests at a time. Cancel one or wait for one to finish.', action: { label: 'Go to my requests', to: '/requests' } };
    case 'ok':
    case 'guest':
    case 'admin':
      return { kind: 'none' };
  }
}
```
**Test:** `blocked-state.test.ts`. One case per state, asserting `kind`, `title` and the action. Include:
```ts
import { describe, expect, it } from 'vitest';
import { toBlock, type BlockContext } from './blocked-state';

const c: BlockContext = { providerId: 'p13', businessName: 'Lanka Paint Works', categoryId: 'painting', email: 'nimal@fixit.test', loc: 'colombo' };
describe('toBlock', () => {
  it('no data / ok → none', () => {
    expect(toBlock(undefined, c)).toEqual({ kind: 'none' });
    expect(toBlock({ state: 'ok' }, c)).toEqual({ kind: 'none' });
  });
  it('unavailable → not_found', () => { expect(toBlock({ state: 'provider_unavailable' }, c)).toEqual({ kind: 'not_found' }); });
  it('paused → discover link with cat and loc', () => {
    expect(toBlock({ state: 'provider_paused' }, c)).toMatchObject({ title: "Lanka Paint Works isn't taking new requests right now", action: { label: 'Find another provider', to: '/discover?cat=painting&loc=colombo' } });
    expect(toBlock({ state: 'provider_paused' }, { ...c, loc: null })).toMatchObject({ action: { to: '/discover?cat=painting' } });
  });
  it('own listing', () => { expect(toBlock({ state: 'own_listing' }, c)).toMatchObject({ icon: 'lock', title: "You can't request your own listing", action: { to: '/dashboard' } }); });
  it('email', () => { expect(toBlock({ state: 'email_unconfirmed' }, c)).toMatchObject({ icon: 'mail', body: 'We sent a link to nimal@fixit.test. Confirm it, then come back to send your request.', action: { resend: true }, secondary: { to: '/providers/p13' } }); });
  it('open with provider', () => { expect(toBlock({ state: 'open_with_provider', ref: 'FX-2061' }, c)).toMatchObject({ action: { label: 'View request', to: '/requests/FX-2061' } }); });
  it('limit', () => { expect(toBlock({ state: 'open_limit_reached' }, c)).toMatchObject({ title: 'You have 5 open requests', action: { to: '/requests' } }); });
});
```
**Verify:** `pnpm --filter @fixit/web test -- blocked-state`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S12 blocked-state mapping (M08-T15)"`

### T16 — `DiscardChangesGuard` title and description props
- [ ] done
**Files:** `src/components/discard-changes-guard.tsx`
**Context:** SPEC S12.E5: `Discard this request?` / `Your details won't be saved.` (S12-specific copy; §6.7 generic copy stays the default).
**Do:** Change the signature to
```ts
export function DiscardChangesGuard({
  when,
  title = 'Discard changes?',
  description = "What you've entered won't be saved.",
}: { when: boolean; title?: string; description?: string }) {
```
and pass `title={title}` `description={description}` to `ResponsiveDialog`. No other change.
**Verify:** `pnpm verify` green (existing callers unchanged).
**Commit:** `git commit -m "feat(web): discard guard accepts screen-specific copy (M08-T16)"`

### T17 — `RequestFieldset`
- [ ] done
**Files:** `src/features/requests/components/request-fieldset.tsx`
**Context:** radio groups (Service, Time slot) need a `<fieldset>` + `<legend>` with the same help/error look as `components/form-field.tsx`.
**Do:**
```tsx
import { useId, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RequestFieldset({ legend, help, error, children, className }: {
  legend: string; help?: ReactNode; error?: string | undefined; children: ReactNode; className?: string;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [help !== undefined ? helpId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset aria-describedby={describedBy} className={cn('flex min-w-0 flex-col gap-2', className)}>
      <legend className="text-label text-text mb-1.5 font-semibold">
        {legend}
        <span className="sr-only"> (required)</span>
      </legend>
      {children}
      {help !== undefined && <p id={helpId} className="text-meta text-text-muted">{help}</p>}
      {error && (
        <p id={errorId} className="text-meta text-danger-text flex items-start gap-1.5">
          <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): request fieldset (M08-T17)"`

### T18 — `ServiceOptions` radio cards
- [ ] done
**Files:** `src/features/requests/components/service-options.tsx`
**Context:** SPEC S12 field "Service": radio cards, name 15/600 + price label (BR-09); §2.9 "Option row" (selected = `primary` border + `primary-soft` bg); phone: full-width cards.
**Do:**
```tsx
import type { UseFormRegisterReturn } from 'react-hook-form';
import type { Service } from '@fixit/contracts';
import { formatServicePrice } from '@/lib/format';
import { RequestFieldset } from './request-fieldset';

export function ServiceOptions({ services, field, error }: { services: readonly Service[]; field: UseFormRegisterReturn; error?: string | undefined }) {
  return (
    <RequestFieldset legend="Service" error={error}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {services.map((s) => (
          <label
            key={s.id}
            className="border-border bg-surface has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:ring-ring flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 has-focus-visible:ring-2"
          >
            <input type="radio" value={s.id} aria-invalid={error ? true : undefined} className="accent-primary size-4 shrink-0" {...field} />
            <span className="flex min-w-0 flex-col">
              <span className="text-body text-text font-semibold">{s.name}</span>
              <span className="text-body-sm text-text-muted">{formatServicePrice(s.price, s.unit)}</span>
            </span>
          </label>
        ))}
      </div>
    </RequestFieldset>
  );
}
```
States: unselected (white, `border-border`); selected (`border-primary bg-primary-soft`); keyboard focus (ring); error (message under the grid). If `accent-primary` is not a generated token utility, drop it (the native radio stays visible either way). Do not use an arbitrary colour.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): service radio cards (M08-T18)"`

### T19 — `SlotControl` segmented radio
- [ ] done
**Files:** `src/features/requests/components/slot-control.tsx`
**Context:** SPEC S12 "Time slot": segmented radio `Morning` · `Afternoon` · `Evening`; phone: 3-column, 48 high (AC7).
**Do:**
```tsx
import type { UseFormRegisterReturn } from 'react-hook-form';
import { TimeSlot } from '@fixit/contracts';
import { SLOT_LABEL } from '@/lib/format';
import { RequestFieldset } from './request-fieldset';

export function SlotControl({ field, error }: { field: UseFormRegisterReturn; error?: string | undefined }) {
  return (
    <RequestFieldset legend="Time slot" error={error}>
      <div className="bg-page grid grid-cols-3 gap-1 rounded-lg p-1">
        {TimeSlot.options.map((slot) => (
          <label
            key={slot}
            className="text-body-sm text-text-muted has-checked:bg-surface has-checked:text-text has-checked:shadow-xs has-focus-visible:ring-ring relative flex h-12 cursor-pointer items-center justify-center rounded-md font-semibold has-focus-visible:ring-2"
          >
            <input type="radio" value={slot} aria-invalid={error ? true : undefined} className="sr-only" {...field} />
            {SLOT_LABEL[slot]}
          </label>
        ))}
      </div>
    </RequestFieldset>
  );
}
```
Same 3 columns and `h-12` at every width. If `shadow-xs` is not a token in `globals.css`, use `shadow-sm`, or whichever shadow token the segmented tabs use (`components/segmented-tabs.tsx`).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): time slot control (M08-T19)"`

### T20 — `MobileField`
- [ ] done
**Files:** `src/features/requests/components/mobile-field.tsx`
**Context:** SPEC S12 field "Mobile number"; BR-23; AC4; `PhoneInput`, `FormField`, `formatPhone`.
**Do:**
```tsx
import { Link } from 'react-router';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { FormField } from '@/components/form-field';
import { PhoneInput } from '@/components/phone-input';
import { formatPhone } from '@/lib/format';

export function MobileField({ mobile, businessName, field, error }: {
  mobile: string | null; businessName: string; field: UseFormRegisterReturn; error?: string | undefined;
}) {
  if (mobile !== null) {
    return (
      <p className="text-body text-text flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Your mobile: {formatPhone(mobile)}</span>
        <Link to="/account" className="text-label text-primary inline-flex min-h-11 items-center font-semibold sm:min-h-0">Change</Link>
      </p>
    );
  }
  return (
    <FormField label="Mobile number" required error={error} help={`Saved to your account. ${businessName} sees it only after accepting.`}>
      {(p) => <PhoneInput {...p} {...field} />}
    </FormField>
  );
}
```
The form only calls `register('mobile')` when `mobile === null` (T23). Pass a no-op `field` otherwise; see T23.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): request mobile field (M08-T20)"`

### T21 — `ProviderMiniRow`
- [ ] done
**Files:** `src/features/requests/components/provider-mini-row.tsx`
**Context:** SPEC S12 summary "provider mini row (56 photo r12, name 17/700, Verified badge or `Not yet verified`, rating line)"; phone "compact provider row (48 photo, name, rating)". Reuse `StatusPill kind="trust"`, `Stars`, `CategoryIcon`.
**Do:**
```tsx
import type { ProviderPublicProfile } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { Stars } from '@/components/stars';
import { StatusPill } from '@/components/status-pill';
import { cn } from '@/lib/utils';

export function ProviderMiniRow({ profile, compact = false, className }: {
  profile: ProviderPublicProfile; compact?: boolean; className?: string;
}) {
  const box = compact ? 'size-12' : 'size-14';
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      {profile.photoUrl ? (
        <img src={profile.photoUrl} alt="" className={cn(box, 'shrink-0 rounded-md object-cover')} />
      ) : (
        <span aria-hidden="true" className={cn(box, 'bg-primary-soft text-primary grid shrink-0 place-items-center rounded-md')}>
          <CategoryIcon icon={profile.category.icon} className="size-6" />
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-lead text-text truncate font-bold">{profile.businessName}</p>
        {!compact && <StatusPill kind="trust" verified={profile.verified} compact />}
        <Stars rating={profile.rating} count={profile.reviewCount} />
      </div>
    </div>
  );
}
```
Check the `Stars` and `CategoryIcon` prop names in their files and match them.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): provider mini row (M08-T21)"`

### T22 — `RequestSummary` and `WhatHappensNext`
- [ ] done
**Files:** `src/features/requests/components/request-summary.tsx`
**Context:** SPEC S12 desktop right column (sticky top 96, card r20); S12.E7 copy; BR-11 note copy; phone: "What happens next" below the form as a plain list.
**Do:**
```tsx
import type { ProviderPublicProfile } from '@fixit/contracts';
import { formatServicePrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ProviderMiniRow } from './provider-mini-row';

export const BR11_NOTE = 'Final price is confirmed by the provider after reviewing your request.';

export function WhatHappensNext({ businessName, className }: { businessName: string; className?: string }) {
  return (
    <section aria-labelledby="next-h" className={cn('flex flex-col gap-2', className)}>
      <h3 id="next-h" className="text-label text-text font-bold">What happens next</h3>
      <ul className="text-body-sm text-text-muted flex list-disc flex-col gap-1.5 pl-5">
        <li>{businessName} has up to 3 days to accept or decline.</li>
        <li>We&apos;ll email you as soon as they reply.</li>
        <li>Their phone number is shown once they accept.</li>
      </ul>
    </section>
  );
}

/** Desktop aside (lg+). `serviceId` = the currently selected service, '' if none. */
export function RequestSummary({ profile, serviceId }: { profile: ProviderPublicProfile; serviceId: string }) {
  const service = profile.services.find((s) => s.id === serviceId);
  return (
    <aside className="border-border bg-surface sticky top-24 hidden flex-col gap-5 rounded-2xl border p-6 lg:flex">
      <ProviderMiniRow profile={profile} />
      <div className="border-border flex flex-col gap-1 border-t pt-5">
        <p className="text-meta text-text-subtle">Service</p>
        <p className="text-body text-text font-semibold">{service ? service.name : 'Choose a service'}</p>
        {service && <p className="text-body-sm text-text-muted">{formatServicePrice(service.price, service.unit)}</p>}
        <p className="text-meta text-text-subtle mt-2">{BR11_NOTE}</p>
      </div>
      <WhatHappensNext businessName={profile.businessName} className="border-border border-t pt-5" />
    </aside>
  );
}
```
States: no service selected → `Choose a service` placeholder line (13 subtle label `Service` above). Selected → name + BR-09 price.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): request summary card (M08-T22)"`

### T23 — `BlockedCard`
- [ ] done
**Files:** `src/features/requests/components/blocked-card.tsx`
**Context:** T15 `Block`; `EmptyState` (§2.9); `useResendConfirmation` (toast `Email sent again.` already built in).
**Do:**
```tsx
import { CirclePause, Inbox, Lock, Mail, type LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { useResendConfirmation } from '@/features/auth/hooks';
import type { Block, BlockIcon } from '../blocked-state';

const ICONS: Record<BlockIcon, LucideIcon> = { lock: Lock, pause: CirclePause, mail: Mail, inbox: Inbox };

export function BlockedCard({ block }: { block: Extract<Block, { kind: 'card' }> }) {
  const resend = useResendConfirmation();
  const a = block.action;
  const action = 'resend' in a
    ? { label: a.label, onClick: () => { if (!resend.isPending) resend.mutate(); } }
    : a;
  return <EmptyState icon={ICONS[block.icon]} title={block.title} body={block.body} action={action} secondaryAction={block.secondary} />;
}
```
Layout: `EmptyState` already stacks buttons full-width on phone (`w-full sm:w-auto`).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S12 blocked card (M08-T23)"`

### T24 — `RequestForm` card
- [ ] done
**Files:** `src/features/requests/components/request-form.tsx`
**Context:** SPEC S12 field table (order, labels, help, placeholder), S12.E3, E4, E6; §6.1 submitting; §6.3 server banner; §6.6 draft (`useFormDraft`); D-4, D-5; `mapApiErrorToForm`, `requestRuleBanner` (T13), `MOBILE_MESSAGE`.
**Do:** Create the component. Full code:
```tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { bookingWindow, makeCreateRequestSchema, MOBILE_MESSAGE, type Me, type ProviderPublicProfile } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { requestRuleBanner } from '@/lib/error-copy';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { ApiError } from '@/lib/http';
import { useFormDraft } from '@/lib/use-form-draft';
import { useCreateRequest } from '../hooks';
import { MobileField } from './mobile-field';
import { BR11_NOTE } from './request-summary';
import { ServiceOptions } from './service-options';
import { SlotControl } from './slot-control';

const selectClass =
  'border-border-control bg-surface text-body text-text focus-visible:ring-ring h-12 w-full rounded-md border px-3 focus-visible:ring-2 focus-visible:outline-none aria-invalid:border-danger';
const grouping = new Intl.NumberFormat('en-US');

interface Props {
  profile: ProviderPublicProfile;
  me: Me;
  initialTownId: string;
  onServiceChange: (serviceId: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  onSent: (ref: string) => void;
}

export function RequestForm({ profile, me, initialTownId, onServiceChange, onDirtyChange, onSent }: Props) {
  const now = useMemo(() => new Date(), []);
  const schema = useMemo(() => makeCreateRequestSchema(now), [now]);
  const window = bookingWindow(now);
  const create = useCreateRequest();
  const [banner, setBanner] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      providerId: profile.id,
      serviceId: '',
      preferredDate: '',
      townId: initialTownId,
      addressLine1: '',
      addressLine2: '',
      description: '',
      ...(me.mobile === null ? { mobile: '' } : {}),
    },
  });
  useFormDraft(`request.${profile.id}`, form);
  const { errors, isDirty } = form.formState;
  const serviceId = useWatch({ control: form.control, name: 'serviceId' });
  const description = useWatch({ control: form.control, name: 'description' });
  useEffect(() => { onServiceChange(serviceId ?? ''); }, [serviceId, onServiceChange]);
  useEffect(() => { onDirtyChange(isDirty); }, [isDirty, onDirtyChange]);

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);
    try {
      const view = await create.mutateAsync(values);
      onSent(view.ref);
    } catch (e) {
      if (e instanceof ApiError && e.rule === 'mobile_missing') {
        form.setError('mobile', { type: 'server', message: MOBILE_MESSAGE }, { shouldFocus: true });
        return;
      }
      setBanner(requestRuleBanner(e, profile.businessName) ?? mapApiErrorToForm(e, form.setError));
    }
  });

  return (
    <form noValidate onSubmit={(e) => void onSubmit(e)} className="border-border bg-surface flex flex-col gap-6 rounded-2xl border p-5 sm:p-7">
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <ServiceOptions services={profile.services} field={form.register('serviceId')} error={errors.serviceId?.message} />
      <FormField label="Preferred date" required error={errors.preferredDate?.message} help="Same-day bookings aren't available.">
        {(p) => <Input {...p} type="date" min={window.min} max={window.max} {...form.register('preferredDate')} />}
      </FormField>
      <SlotControl field={form.register('slot')} error={errors.slot?.message} />
      <FormField label="Town" required error={errors.townId?.message} help={`${profile.businessName} works in these towns.`}>
        {(p) => (
          <select {...p} className={selectClass} {...form.register('townId')}>
            <option value="">Choose your town</option>
            {profile.areas.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>
        )}
      </FormField>
      <div className="flex flex-col gap-4">
        <FormField label="Address line 1" required error={errors.addressLine1?.message}>
          {(p) => <Input {...p} autoComplete="address-line1" {...form.register('addressLine1')} />}
        </FormField>
        <FormField label="Address line 2" optional error={errors.addressLine2?.message}>
          {(p) => <Input {...p} autoComplete="address-line2" {...form.register('addressLine2')} />}
        </FormField>
        <p className="text-meta text-text-muted">Only shared with {profile.businessName} if they accept.</p>
      </div>
      <FormField label="Description" required error={errors.description?.message} help={`${grouping.format((description ?? '').length)} / 1,000`}>
        {(p) => (
          <Textarea {...p} rows={5} placeholder="What needs doing? Include anything that helps the provider quote — the problem, the size of the job, access details." {...form.register('description')} />
        )}
      </FormField>
      <MobileField
        mobile={me.mobile}
        businessName={profile.businessName}
        field={me.mobile === null ? form.register('mobile') : { name: 'mobile', onChange: async () => undefined, onBlur: async () => undefined, ref: () => undefined }}
        error={errors.mobile?.message}
      />
      <div className="flex flex-col gap-3">
        <p className="text-meta text-text-subtle">{BR11_NOTE}</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Link to={`/providers/${profile.id}`} className="text-label text-text-muted hover:text-primary inline-flex min-h-11 items-center justify-center font-semibold sm:justify-start">
            Cancel
          </Link>
          <div className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 border-t px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 sm:static sm:z-auto sm:order-first sm:border-0 sm:bg-transparent sm:p-0">
            <SubmitButton pending={create.isPending} pendingLabel="Sending…" size="lg" className="h-12 w-full sm:w-auto">
              <Send aria-hidden="true" className="size-4" />
              Send request
            </SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}
```
Rules for the executor:
- Field order in the JSX = focus order on errors (AC2 "focus moves to the first"). Do not reorder.
- `Textarea` lives in `components/ui/textarea.tsx`. If `SubmitButton`/`Button` has no `size="lg"`, drop the prop and keep `h-12`.
- The no-op `field` for `MobileField` exists only because the read-only branch ignores it. If TypeScript rejects the literal as `UseFormRegisterReturn`, make `field` optional in `MobileField` and pass `undefined` instead. Then the input branch renders only when `field` is defined.
- If `aria-invalid:border-danger` is not a valid utility, drop it.
- `useWatch` may return `undefined` typing for `serviceId`; the `?? ''` handles it.
States: default (town prefilled or empty), field errors (inline, focus first), submitting (`Sending…`, spinner, disabled), server rule banner (S12.E6) or §6.3 banner (`We couldn't save your changes. Check your connection and try again.`) with values kept.
390px: card `p-5`, service cards 1 column, slot 3 columns × 48, submit in fixed bottom bar, Cancel centred above the bar. ≥641: submit + Cancel inline, left-aligned.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): request form card (M08-T24)"`

### T25 — `RequestFormSkeleton`
- [ ] done
**Files:** `src/features/requests/components/request-form-skeleton.tsx`
**Context:** AC8 "form skeleton while provider + eligibility load"; §6.1 `SkeletonSectionCard`.
**Do:**
```tsx
import { SkeletonSectionCard } from '@/components/skeletons';

export function RequestFormSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <SkeletonSectionCard lines={10} />
      <div className="hidden lg:block"><SkeletonSectionCard lines={5} /></div>
    </div>
  );
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): request form skeleton (M08-T25)"`

### T26 — `RequestFormPage` (S12) and route wiring
- [ ] done
**Files:** `src/features/requests/pages/request-form-page.tsx`, `src/app/chunks/customer.tsx`
**Context:** SPEC S12 desktop/phone layouts, E1, E5; AC1, AC5, AC7, AC8; D-3, D-5; `useProviderProfile` (provider-profile hooks), `NotFoundPage variant="provider"`, `DiscardChangesGuard` (T16), `useBodyClass`, `lastDiscoverLoc`.
**Do:**
1. Create the page:
```tsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { NotFoundPage } from '@/app/errors/not-found-page';
import { BackLink } from '@/components/back-link';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { LoadingRegion } from '@/components/loading-region';
import { useProviderProfile } from '@/features/provider-profile/hooks';
import { useAuth } from '@/lib/auth-store';
import { ApiError } from '@/lib/http';
import { lastDiscoverLoc } from '@/lib/last-discover';
import { useBodyClass } from '@/lib/use-body-class';
import { toBlock } from '../blocked-state';
import { BlockedCard } from '../components/blocked-card';
import { ProviderMiniRow } from '../components/provider-mini-row';
import { RequestForm } from '../components/request-form';
import { RequestFormSkeleton } from '../components/request-form-skeleton';
import { RequestSummary, WhatHappensNext } from '../components/request-summary';
import { useEligibility } from '../hooks';
import { initialTownId } from '../town-prefill';

/** S12. Guards already sent guests to /login?next=… and admins to S40. */
export function RequestFormPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { me } = useAuth();
  const profile = useProviderProfile(id);
  const eligibility = useEligibility(id);
  const [serviceId, setServiceId] = useState('');
  const [dirty, setDirty] = useState(false);
  const [sentRef, setSentRef] = useState<string | null>(null);
  const p = profile.data;
  const loc = lastDiscoverLoc();
  const block = p && me ? toBlock(eligibility.data, { providerId: p.id, businessName: p.businessName, categoryId: p.category.id, email: me.email, loc }) : { kind: 'none' as const };
  const showForm = Boolean(p && me && !eligibility.isPending && block.kind === 'none');
  useBodyClass(showForm ? 'pb-24 sm:pb-0' : '');
  useEffect(() => {
    if (sentRef) void navigate(`/requests/${sentRef}/sent`);
  }, [sentRef, navigate]);
  const onDirtyChange = useCallback((d: boolean) => { setDirty(d); }, []);

  if (profile.isError) {
    if (profile.error instanceof ApiError && profile.error.status === 404) return <NotFoundPage variant="provider" />;
    throw profile.error; // S41
  }
  if (block.kind === 'not_found') return <NotFoundPage variant="provider" />;

  const loading = !p || !me || eligibility.isPending;
  return (
    <div className="max-w-content lg:pb-22 mx-auto flex w-full flex-col gap-4 px-4 pb-14 pt-6 sm:px-6 lg:gap-6 lg:px-8">
      <DiscardChangesGuard when={dirty && sentRef === null} title="Discard this request?" description="Your details won't be saved." />
      <BackLink to={`/providers/${id}`}>{p ? `Back to ${p.businessName}` : 'Back'}</BackLink>
      <header className="flex flex-col gap-1">
        <h1 className="text-title-md lg:text-title-lg text-text">Request a service</h1>
        {p && <p className="text-body text-text-muted">from {p.businessName}</p>}
      </header>
      <LoadingRegion loading={loading} skeleton={<RequestFormSkeleton />}>
        {p && me && (
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="flex min-w-0 flex-col gap-6">
              <ProviderMiniRow profile={p} compact className="border-border bg-surface rounded-xl border p-4 lg:hidden" />
              {block.kind === 'card' ? (
                <BlockedCard block={block} />
              ) : (
                <RequestForm profile={p} me={me} initialTownId={initialTownId(p.areas, loc)} onServiceChange={setServiceId} onDirtyChange={onDirtyChange} onSent={setSentRef} />
              )}
              {block.kind === 'none' && <WhatHappensNext businessName={p.businessName} className="lg:hidden" />}
            </div>
            <RequestSummary profile={p} serviceId={serviceId} />
          </div>
        )}
      </LoadingRegion>
    </div>
  );
}
```
2. `app/chunks/customer.tsx`: replace the `RequestFormPage` placeholder function with `export { RequestFormPage } from '@/features/requests/pages/request-form-page';`.
Notes:
- `RequestSummary` renders `hidden lg:flex`, so below 1024 the compact row and the plain "What happens next" list take its place (SPEC phone layout). 641–1023 uses the phone arrangement in one column, with the submit inline (≥ sm).
- `useNavigate()` returns `void | Promise<void>` in RR7. Keep the `void` operator.
- H1 at 390 is `text-title-md` (20/28), the nearest token to SPEC's 22/30. No arbitrary font size (lint-banned).
- If `Me` in `useAuth()` is typed as possibly null while signed in, the `me &&` checks above already cover it.
States: loading (skeleton after 150 ms, `aria-busy`), not found (S39 provider box), blocked card (with aside still visible on desktop), form, submit error banner, discard dialog on Cancel/back when dirty.
**Verify:** `pnpm verify` green; `pnpm dev:mock`, sign in as Olivia, open `/providers/p03/request`: the form renders.
**Commit:** `git commit -m "feat(web): request form page (M08-T26)"`

### T27 — `RequestSentPage` (S13) and route wiring
- [ ] done
**Files:** `src/features/requests/pages/request-sent-page.tsx`, `src/app/chunks/customer.tsx`
**Context:** SPEC S13 (layout, E1–E4, redirect to S15 when not Pending); AC3, AC8; `useMyRequest`; `formatDeadline`, `formatDateLong`, `SLOT_LABEL`; `StatusPill kind="request"`; `lastDiscoverUrl`.
**Do:**
1. Create the page:
```tsx
import { CircleCheck } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { NotFoundPage } from '@/app/errors/not-found-page';
import { LoadingRegion } from '@/components/loading-region';
import { SkeletonSectionCard } from '@/components/skeletons';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { formatDateLong, formatDeadline, SLOT_LABEL } from '@/lib/format';
import { ApiError } from '@/lib/http';
import { lastDiscoverUrl } from '@/lib/last-discover';
import { useMyRequest } from '../hooks';

/** S13. */
export function RequestSentPage() {
  const { ref = '' } = useParams();
  const q = useMyRequest(ref);
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFoundPage variant="request" />;
    throw q.error;
  }
  const r = q.data;
  if (r && r.status !== 'pending') return <Navigate to={`/requests/${r.ref}`} replace />;
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-10 sm:py-14">
      <LoadingRegion loading={!r} skeleton={<SkeletonSectionCard lines={6} />}>
        {r && (
          <div className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-6 sm:p-8">
            <span aria-hidden="true" className="bg-success-soft text-success grid size-14 place-items-center rounded-xl">
              <CircleCheck className="size-7" />
            </span>
            <h1 className="text-title-md text-text">Request sent to {r.provider.businessName}</h1>
            <p className="text-body text-text-muted">
              We&apos;ve emailed {r.provider.businessName}. They have until {formatDeadline(r.expiresAt)} to accept or decline — we&apos;ll email you as soon as they reply.
            </p>
            <dl className="border-border grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 gap-y-3 border-t pt-5">
              <dt className="text-body-sm text-text-muted">Reference</dt>
              <dd className="text-body text-text font-mono">{r.ref}</dd>
              <dt className="text-body-sm text-text-muted">Service</dt>
              <dd className="text-body text-text">{r.service.name}</dd>
              <dt className="text-body-sm text-text-muted">Date</dt>
              <dd className="text-body text-text">{formatDateLong(r.preferredDate)} · {SLOT_LABEL[r.slot]}</dd>
              <dt className="text-body-sm text-text-muted">Town</dt>
              <dd className="text-body text-text">{r.town.name}</dd>
              <dt className="text-body-sm text-text-muted">Status</dt>
              <dd><StatusPill kind="request" status={r.status} /></dd>
            </dl>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto"><Link to={`/requests/${r.ref}`}>View request</Link></Button>
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto"><Link to={lastDiscoverUrl()}>Back to search</Link></Button>
            </div>
          </div>
        )}
      </LoadingRegion>
    </div>
  );
}
```
2. `customer.tsx`: replace the `RequestSentPage` placeholder with `export { RequestSentPage } from '@/features/requests/pages/request-sent-page';`. If `PlaceholderScreen` is now unused in that file, remove only its import.
390px: card `p-6` with 16px gutter (`px-4`), buttons full width stacked. ≥641: `p-8`, buttons inline.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): request sent page (M08-T27)"`

### T28 — S12 behaviour tests
- [ ] done
**Files:** `src/features/requests/pages/request-form-page.test.tsx`
**Context:** AC1, AC2, AC3, AC4, AC5, AC6, AC7 (dialog), AC8 (500). `renderRoute`, `signInAs`, `armForcedError`, `rememberDiscover`; D-6.
**Do:** Write the tests:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { FORM_COPY } from '@/lib/error-copy';
import { rememberDiscover } from '@/lib/last-discover';
import { commit, db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const send = () => screen.findByRole('button', { name: /Send request/ });

async function fillValid(u: ReturnType<typeof user>) {
  await u.click(await screen.findByRole('radio', { name: /Outlet & switch install/ }));
  fireEvent.change(screen.getByLabelText(/^Preferred date/), { target: { value: '2026-11-23' } });
  await u.click(screen.getByRole('radio', { name: 'Morning' }));
  await u.selectOptions(screen.getByRole('combobox', { name: /^Town/ }), 'colombo');
  await u.type(screen.getByLabelText(/^Address line 1/), '12 Galle Road');
  await u.type(screen.getByLabelText(/^Description/), 'Two sockets in the kitchen stopped working.');
}

describe('RequestFormPage (S12)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => { vi.useRealTimers(); });

  it('AC1: header, services, towns base-first, loc prefill, summary', async () => {
    rememberDiscover('?loc=colombo');
    signInAs('customer');
    renderRoute('/providers/p03/request');
    expect(await screen.findByRole('link', { name: 'Back to BrightSpark Electric' })).toHaveAttribute('href', '/providers/p03');
    expect(screen.getByRole('heading', { level: 1, name: 'Request a service' })).toBeInTheDocument();
    expect(await screen.findAllByRole('radio', { name: /from LKR|fixed/ })).toHaveLength(5);
    const town = screen.getByRole('combobox', { name: /^Town/ });
    const options = within(town).getAllByRole('option');
    expect(options[1]).toHaveValue('sri-jayawardenepura-kotte');
    expect(town).toHaveValue('colombo');
    expect(screen.getAllByText('What happens next').length).toBeGreaterThan(0);
    expect(screen.getAllByText('BrightSpark Electric has up to 3 days to accept or decline.').length).toBeGreaterThan(0);
  });

  it('AC2: empty submit shows six messages and focuses the first; range; counter', async () => {
    signInAs('customer');
    renderRoute('/providers/p03/request');
    const u = user();
    await u.click(await send());
    for (const m of ['Choose a service.', 'Choose a date.', 'Choose a time slot.', 'Choose your town.', 'Enter your address.', 'Describe the job in at least 20 characters.'])
      expect(await screen.findByText(m)).toBeInTheDocument();
    expect(screen.getAllByRole('radio', { name: /from LKR|fixed/ })[0]).toHaveFocus();
    const date = screen.getByLabelText(/^Preferred date/);
    expect(date).toHaveAttribute('min', '2026-11-23');
    expect(date).toHaveAttribute('max', '2027-01-21');
    fireEvent.change(date, { target: { value: '2026-11-22' } });
    await u.click(await send());
    expect(await screen.findByText('Choose a date from Mon, 23 Nov 2026 to Thu, 21 Jan 2027.')).toBeInTheDocument();
    await u.type(screen.getByLabelText(/^Description/), 'x'.repeat(25));
    expect(screen.getByText('25 / 1,000')).toBeInTheDocument();
  });

  it('AC3: valid submit → S13 with ref, deadline, summary', async () => {
    signInAs('customer');
    renderRoute('/providers/p03/request');
    const u = user();
    await fillValid(u);
    await u.click(await send());
    expect(await screen.findByRole('heading', { level: 1, name: 'Request sent to BrightSpark Electric' })).toBeInTheDocument();
    expect(screen.getByText('FX-2062')).toBeInTheDocument();
    expect(screen.getByText(/They have until Mon, 23 Nov, 12:00 AM to accept or decline/)).toBeInTheDocument();
    expect(screen.getByText('Mon, 23 Nov 2026 · Morning')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View request' })).toHaveAttribute('href', '/requests/FX-2062');
  });

  it('AC4: with a mobile → read-only row; without → +94 input saved to the account', async () => {
    signInAs('customer');
    const view = renderRoute('/providers/p03/request');
    expect(await screen.findByText('Your mobile: +94 77 000 1001')).toBeInTheDocument();
    view.unmount();
    authStore.reset();
    const nimal = db().users['u-nimal'];
    if (!nimal) throw new Error('u-nimal');
    nimal.emailConfirmedAt = FIXED_NOW.toISOString();
    commit();
    signInAs('customerUnconfirmed');
    renderRoute('/providers/p03/request');
    const u = user();
    await fillValid(u);
    await u.type(screen.getByLabelText(/^Mobile number/), '077 123 4567');
    await u.click(await send());
    expect(await screen.findByRole('heading', { level: 1, name: /Request sent to/ })).toBeInTheDocument();
    expect(db().users['u-nimal']?.mobile).toBe('+94771234567');
  });

  it.each([
    ['provider', 'p01', "You can't request your own listing", 'Go to your dashboard'],
    ['customer', 'p13', "Lanka Paint Works isn't taking new requests right now", 'Find another provider'],
    ['customerUnconfirmed', 'p03', 'Confirm your email first', 'Resend email'],
    ['customer', 'p01', 'You already have an open request with Bell & Sons Plumbing', 'View request'],
    ['customerAtLimit', 'p02', 'You have 5 open requests', 'Go to my requests'],
  ] as const)('AC5: %s on %s → %s', async (persona, providerId, title, action) => {
    signInAs(persona);
    renderRoute(`/providers/${providerId}/request`);
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByRole(action === 'Resend email' ? 'button' : 'link', { name: action })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Send request/ })).not.toBeInTheDocument();
  });

  it.each(['p14', 'nope'])('AC5: %s → provider not found', async (providerId) => {
    signInAs('customer');
    renderRoute(`/providers/${providerId}/request`);
    expect(await screen.findByText("This provider couldn't be found.")).toBeInTheDocument();
  });

  it('AC6: forced provider_paused → banner, values kept', async () => {
    signInAs('customer');
    renderRoute('/providers/p03/request');
    const u = user();
    await fillValid(u);
    armForcedError('requests_create', 'rule_provider_paused');
    await u.click(await send());
    expect(await screen.findByRole('alert')).toHaveTextContent("BrightSpark Electric can't take requests right now. Your request wasn't sent.");
    expect(screen.getByLabelText(/^Description/)).toHaveValue('Two sockets in the kitchen stopped working.');
  });

  it('AC8: forced 500 → §6.3 banner, values kept', async () => {
    signInAs('customer');
    renderRoute('/providers/p03/request');
    const u = user();
    await fillValid(u);
    armForcedError('requests_create', '500');
    await u.click(await send());
    expect(await screen.findByRole('alert')).toHaveTextContent(FORM_COPY.saveFailed);
    expect(screen.getByLabelText(/^Address line 1/)).toHaveValue('12 Galle Road');
  });

  it('AC7: Cancel on a dirty form asks to discard', async () => {
    signInAs('customer');
    renderRoute('/providers/p03/request');
    const u = user();
    await u.type(await screen.findByLabelText(/^Description/), 'Something');
    await u.click(screen.getByRole('link', { name: 'Cancel' }));
    expect(await screen.findByText('Discard this request?')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Keep editing' }));
    await waitFor(() => { expect(screen.queryByText('Discard this request?')).not.toBeInTheDocument(); });
    expect(screen.getByLabelText(/^Description/)).toHaveValue('Something');
  });
});
```
Adjustments the executor may make **without** changing what is asserted: the exact `renderRoute` return value (if it does not return `unmount`, call `cleanup()` from Testing Library instead); `userEvent.setup` options, if fake Date-only timers make `advanceTimers` unnecessary (then use `userEvent.setup()`). If the fixture services of p03 have different ids, nothing changes (radios are found by name). If AC1's prefilled `colombo` is not one of p03's areas, read p03's `otherTowns` in `packages/fixtures/src/providers.ts` (it is: `colombo`).
**Verify:** `pnpm --filter @fixit/web test -- request-form-page` green; `pnpm verify` green.
**Commit:** `git commit -m "test(web): request form behaviour (M08-T28)"`

### T29 — S13 behaviour tests
- [ ] done
**Files:** `src/features/requests/pages/request-sent-page.test.tsx`
**Context:** AC3 (`Back to search`), AC8 (no longer Pending → S15; another customer's ref → S39 request).
**Do:**
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { rememberDiscover } from '@/lib/last-discover';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('RequestSentPage (S13)', () => {
  beforeEach(() => { vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }); });
  afterEach(() => { vi.useRealTimers(); });

  it('pending → summary and Back to search uses the last Discover URL', async () => {
    rememberDiscover('?q=plumb');
    signInAs('customer');
    renderRoute('/requests/FX-2061/sent');
    expect(await screen.findByRole('heading', { level: 1, name: 'Request sent to Bell & Sons Plumbing' })).toBeInTheDocument();
    expect(screen.getByText('FX-2061')).toHaveClass('font-mono');
    expect(screen.getByRole('link', { name: 'Back to search' })).toHaveAttribute('href', '/discover?q=plumb');
  });
  it('no longer pending → S15', async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2046/sent');
    expect(await screen.findByText('Request detail')).toBeInTheDocument();
  });
  it("another customer's ref → S39 request", async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2059/sent');
    expect(await screen.findByRole('heading', { name: "We can't find that request" })).toBeInTheDocument();
  });
});
```
(`Request detail` is the M09 placeholder title on `/requests/:ref`.)
**Verify:** `pnpm --filter @fixit/web test -- request-sent-page`; `pnpm verify` green.
**Commit:** `git commit -m "test(web): request sent behaviour (M08-T29)"`

### T30 — Acceptance checks
- [ ] done
**Files:** this plan (tick boxes); `docs/milestones/M00-index.md` only if it tracks milestone status (tick M08 there in the same format as M07).
**Do:** Run `pnpm verify` (green). Then `pnpm dev:mock` and walk each criterion. Use the DevPanel to switch personas, set Latency `slow` for loading checks, and **Reset demo data** between checks that create requests.
| AC | Check |
|---|---|
| 1 | Olivia, 1440px. Open `/discover?loc=colombo`, then `/providers/p03/request`. Back link `Back to BrightSpark Electric`; form card + sticky summary (mini row, `Choose a service` → pick one → name + price, BR-11 note, 3 "What happens next" lines). 5 service cards with price labels; Town lists Sri Jayawardenepura Kotte first, `Colombo` preselected. Automated: T28 AC1. |
| 2 | Click `Send request` empty → 6 messages, focus on the first service card. The date picker can't go before tomorrow or after +60. Type an out-of-range date (desktop keyboard entry) → range message. Counter `n / 1,000`. Automated: T28 AC2, T1. |
| 3 | Valid submit with Latency `slow` → `Sending…` + spinner → `/requests/FX-2062/sent`: title, deadline, mono ref, service, `date · slot`, town, Pending pill. `View request` → `/requests/FX-2062` (placeholder); `Back to search` → last Discover URL. Automated: T28 AC3, T29. |
| 4 | Olivia sees `Your mobile: +94 77 000 1001` + `Change` → `/account`. As Nimal: DevPanel → Resend email → open "Last email link" → confirm, then `/providers/p03/request` shows the `+94` input. Enter `077 123 4567`, send, then open `/account`: mobile shown. Automated: T28 AC4, T9. |
| 5 | Marcus on `/providers/p01/request`; Olivia on `/providers/p13/request`; Nimal (unconfirmed) on `/providers/p03/request`; Olivia on `/providers/p01/request`; Dilani on `/providers/p02/request`; any customer on `/providers/p14/request` and `/providers/nope/request`. Admin on any `/providers/p03/request` → S40. Sign out → `/login?next=/providers/p03/request`. Automated: T28 AC5 (guards: existing M03 tests). |
| 6 | Olivia, fill the form, DevPanel → Force next error → `requests_create` → `422 RULE_VIOLATION provider_paused` → Arm → submit → banner, values kept. Automated: T28 AC6. |
| 7 | 390px (DevTools): compact provider row, full-width service cards, 3-column 48-high slots, "What happens next" below the form, fixed `Send request` bar, no horizontal scroll (`document.documentElement.scrollWidth === 390`). Type something, press `Cancel` and the browser back button → `Discard this request?` both times. Automated (dialog): T28 AC7. |
| 8 | Latency `slow`: skeleton shows on load. Force `500` on `requests_create` → `We couldn't save your changes. Check your connection and try again.`, values kept. `/requests/FX-2046/sent` → redirected to `/requests/FX-2046`. `/requests/FX-2059/sent` as Olivia → `We can't find that request`. After sending a request as Olivia, switch to the owner of p03 (no persona: check via test T9 "provider pending count +1"). Automated: T28 AC8, T29, T9. |
Write any failing check under `## Blockers` and stop.
**Verify:** all rows pass; `pnpm verify` green.
**Commit:** `git commit -m "chore: M08 acceptance checks (M08-T30)"`

## Checkpoints
- After T9: "Human: run `pnpm dev:mock` and check that the DevPanel lists `422 RULE_VIOLATION provider_paused` under Force next error and the endpoint list has `requests_create` and `requests_get`."
- After T26: "Human: run `pnpm dev:mock`, open `/providers/p03/request` as Olivia at 1440 and 390. Check the two-column layout vs the phone layout (compact row, fixed send bar, no horizontal scroll). There is no prototype screenshot for S12 (INFERRED screen), so compare with SPEC S12 text."
- After T27: "Human: send a request and look at S13 at 1440 and 390."

## Blockers
(executor writes here; leave empty)

## Nice-to-haves / notes (not tasks)
- API milestone: `POST /me/requests` parses with `CreateRequestBody` and leaves the window to `checkCreateRequest` (decision 004).
- `evaluateEligibility` (S3 order, M07 D-3) puts `email_unconfirmed` after the open-request limits, but S12 lists it before them. An unconfirmed customer who also has open requests sees the limit card on S12 instead of `Confirm your email first`. The server's `checkCreateRequest` uses S12 order, so nothing unsafe happens. Candidate for a decision record.
- A DevPanel persona "confirmed customer without a mobile" would make AC4 a one-click check.
- Town select grouped by district (SPEC shows districts only in grouped selects; the provider's list is short, so it's flat here).
