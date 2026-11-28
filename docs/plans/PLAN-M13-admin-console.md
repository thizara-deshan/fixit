# PLAN-M13 — Admin console
Milestone: `docs/milestones/M13-admin-console.md` · Start tag: `m13-start` · Verify-all: `pnpm verify`
Mock domains at start → end: all → all (`admin` goes from 0 handlers to 12). **No backend in this milestone** (`apps/api` does not exist yet), so there are no Nest tasks and no authorization-matrix rows. The mocks apply roles through `mockEndpoint` (`access: ['admin']`), the BR-41/42 cascade through the pure contracts function `planSuspension` + `assertTransition` (actor `system`), and BR-27 through `ratingFrom`, as the API will in M20. Every admin mutation writes a mock `audit` row in the same handler run (= same "transaction").

Conventions for the executor (same as M11/M12):
- T1 creates tag `m13-start` and branch `m13-admin-console` from the current HEAD. One commit per task, using the message given, ending with the attribution lines from your session instructions.
- Run `pnpm format` before `pnpm verify` in every task. Code below may not be Prettier-exact.
- Code blocks are complete files unless the step says "add", "replace" or "edit". Tests import `describe/expect/it/vi` from `vitest` explicitly.
- Paths are under `apps/web/` unless they start with `packages/`, `docs/` or `/`. `@/` = `apps/web/src/`.
- Tailwind: only `sm` (≥641) and `lg` (≥1024) prefixes (no `max-sm:`). Arbitrary **size/grid** values are allowed (`lg:w-[320px]`, `grid-cols-[minmax(0,1fr)_340px]`, `border-l-[3px]`). Arbitrary colour values and lint-banned prefixes (`text-[`, `bg-[`, `border-[`, `shadow-[`, `ring-[`, `outline-[`) are not. Token classes used in this plan: `bg-surface bg-page bg-primary-soft bg-warning-soft bg-danger-soft bg-success-soft bg-surface-muted bg-footer-bg text-text text-text-muted text-text-subtle text-primary text-warning-text text-danger-text text-success-text text-icon-subtle border-border border-border-strong border-primary-soft`, type scale `text-title-xl text-title-lg text-title-md text-title-sm text-body text-body-sm text-label text-meta text-caption text-mono`, radii `rounded-sm rounded-md rounded-lg rounded-xl rounded-2xl rounded-full`.
- Copy in backticks is SPEC copy, character for character, unless the decision list below marks it as planner copy.
- Time in tests: every new test that calls handlers or renders a page uses `vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] })` in `beforeEach` and `vi.useRealTimers()` in `afterEach` (`FIXED_NOW` from `@/test/fixed-now`). `src/test/setup.ts` already resets the mock db to the fixtures before each test.
- `exactOptionalPropertyTypes` is on: build optional keys with `...(x === undefined ? {} : { key: x })`.
- Toasts in page tests: `vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }))` and assert `notify` was called with the exact message.
- Page tests that open dialogs set `Element.prototype.scrollIntoView = vi.fn()` in `beforeEach`.
- Handler tests call the mock API the same way `src/mocks/handlers/requests-inbox.test.ts` does (copy its `get`/`call` helpers that sign in a persona with `signInAs` and `fetch` an absolute `/api/...` URL). Persona keys: `customer` (Olivia), `provider` (Marcus, p01), `providerNotSubmitted` (Hank, p08), `customerAtLimit` (Dilani), `admin`.
- If a library API differs from what the code assumes (React Router 7, TanStack Query 5, zod 4, react-hook-form 7, MSW 2, Radix Dialog, lucide-react names), **STOP** and write a blocker.

Planner's decisions the executor must follow:
- **D-1 AdminOverview shape (milestone note).** `AdminOverview = { attention: { pendingVerifications, oldestPendingAt, suspendedUsers } }`. M25 adds `metrics: AdminMetrics.optional()` — an additive, optional key; zod objects strip unknown keys, so a server that already sends metrics doesn't break this client. No blocker needed.
- **D-2 Queue tabs = submission status.** `VerificationQueueQuery {status: pending_review|approved|rejected (default pending_review), page}`. Pending: `submittedAt` ascending (oldest first). Approved/Rejected: `decidedAt` descending. 25 per page (`PAGE_SIZE.admin`). URL `/admin/verifications?status=approved&page=2` (defaults left out).
- **D-3 Attempt label.** attempt 1 → `First`; attempt n ≥ 2 → `Resubmission {n − 1}`. When `trigger` is `business_name` / `category`, a second 13-subtle line shows `Business name changed` / `Category changed` (SPEC §8.5 step 4).
- **D-4 Relative days (planner copy).** S31 sub: 0 days → `today`, 1 → `yesterday`, n → `{n} days ago`. S30.E1 sub: 0 → `oldest today`, 1 → `oldest 1 day`, n → `oldest {n} days`. Days are Colombo calendar days (`colomboDaysSince`).
- **D-5 "Already decided" errors.** Approve/reject a submission that is not `pending_review`, suspend an already suspended user, reactivate an active user, hide a hidden review, restore a visible review → `409 CONFLICT details.rule = 'already_in_state', details.status = <current status>`. Suspending an admin → `422 RULE_VIOLATION cannot_suspend_admin` (AC10). `GET /admin/users/:id` for an admin or unknown id → `404`.
- **D-6 Conflict copy (planner copy, SPEC has only the request variant).** `ConflictDialog` gains an optional `title`. Verification: `This submission has changed` / `Another admin has already decided it. The page now shows the latest status.` Account: `This account has changed` / `Its status changed while you were looking at it. The page now shows the latest status.` Review: `This review has changed` / `Its visibility changed while you were looking at it. The list now shows the latest status.` Button `OK` (existing). On close the item refetches.
- **D-7 Users tabs.** `AdminUserListQuery {q, role: all|customer|provider, status: all|suspended, page}`. Tabs: `All` (role all, status all) · `Customers` (`role=customer`) · `Providers` (`role=provider`) · `Suspended` (`status=suspended`). `customer` = accounts **without** a published listing; `provider` = accounts with one (drafts count as customers). Recorded in `docs/decisions/007-admin-customer-means-no-listing.md`. Admin accounts never appear. Order: `createdAt` descending, ties by `fullName`. Search (trimmed, case-insensitive substring): full name, email, business name; and mobile when the query is ≥ 3 digits (matches `+9477…` or `077…`).
- **D-8 Recent requests on S34.** New compact schema `AdminRequestRow` (ref, status, customer name, business, service, date, slot, town). Rows are not links while F-35 is off (S36 hidden). Last 5 by `createdAt` descending; counts `open` (pending+accepted) and `total`.
- **D-9 Suspension cascade.** `planSuspension(requests, userId, now)` (contracts, pure): for each open request where the user is the **provider**: pending → `declined`, accepted → `cancelled`, reason `Provider unavailable`; where the user is the **customer**: pending/accepted → `cancelled`, reason `Customer account closed`. Each effect is kept only if `canTransition(…, {kind:'system'}, now).ok`. The mock first runs `expireDue`, then applies each effect with `transitionOr409` + `applyTransition(r, to, 'system', null, now, reason)`. `suspendImpact(effects)` gives the dialog counts.
- **D-10 Suspend dialog effect lines.** Always `They won't be able to sign in.` and `Their reviews stay visible unless you hide them.` (last). Providers (user has a published listing) add `Their listing will be hidden from search and their profile link will stop working.` and `{n} pending requests will be declined and {m} accepted requests cancelled. Customers are emailed.` The customer line `{k} of their open requests will be cancelled. Providers are emailed.` shows when the user is not a provider, or `k > 0`. Numbers are not singularised (SPEC copy literal).
- **D-11 Reason schemas.** `RejectBody`, `HideReviewBody` carry the SPEC messages. `SuspendBody`/`ReactivateBody` (API bodies) use `Give a reason. It's included in the email to them.`; the S34 forms validate with `makeAccountReasonBody(fullName)` so the user sees `Give a reason. It's included in the email to {name}.` (same pattern as `makeCreateRequestSchema`).
- **D-12 Rejection pre-stages files.** Reject copies the submission's documents to new **staged** rows (`submissionId: null`, same bytes), like fixture `d-p10-*-r`, so S26 opens with prefilled slots (ARCH §8.1 note).
- **D-13 Audit.** `FxAudit` (fixtures) = `MockAudit` (mock db) = Prisma `AuditLog` columns minus `data`. Fixtures seed 4 rows (p01 approve, p10 reject, Ruwan suspend, FX-2028 review hide) so S34 history and S37 hidden metadata have data. `FxSubmission` gains `decidedById` (Prisma `decidedById`) for S32 "by {admin}". `MOCK_DB_VERSION` 7 → 8.
- **D-14 p08 demo requests.** Hank's p08 has no requests today, so AC5's cascade can't be seen. T8 adds `FX-2042` (pending, James Carter, `james.carter@fixit.test` / `demo1234`) and `FX-2043` (accepted, Ethan Brooks) on p08.
- **D-15 Documents in the viewer.** `/api/files/documents/:id` needs the Bearer token, so `<img src>` can't load it. New `httpBlob()` in `lib/http.ts` fetches with the same auth + single refresh as `http()`; the viewer shows an object URL. Tiles show an icon + title + file name/size (no thumbnails, one fetch per opened document).
- **D-16 Submitting labels (planner copy).** `Approving…`, `Rejecting…`, `Suspending…`, `Reactivating…`, `Hiding…`, `Restoring…`. Empty-tab lines: `No submissions with this status.`, `No users with this status.`, `No reviews with this status.`; S34 empties `No requests yet.` and `No account changes yet.`; S34 history labels `Suspended` / `Reactivated`.
- **D-17 Badge.** The L4 Verification nav item and the phone top-bar icon show `attention.pendingVerifications` from `GET /admin/overview` (refetch every 60 s and on focus, SPEC §6.11). Mutations that change it invalidate `['admin']`.
- **D-18 DevPanel suspended banner (AC5).** DevPanel persona sign-in that fails with `ACCOUNT_SUSPENDED` shows `FORM_COPY.suspended` in a danger `NoticeBanner` instead of `Failed: ACCOUNT_SUSPENDED`.
- **D-19 SLOT_TITLE moves** to `src/components/document-titles.ts` (now used by provider-business and admin); `document-slot.tsx` re-exports it so existing imports keep working.

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `packages/contracts/src/common/enums.ts` | Modify | `AuditAction`, `AuditTargetType` |
| `packages/contracts/src/common/dates.ts` (+ test) | Modify | `colomboDaysSince` |
| `packages/contracts/src/admin/schemas.ts` (+ test) | Create | all admin schemas (bodies, overview, queue, detail, users, moderation, audit) |
| `packages/contracts/src/admin/search.ts` (+ test) | Create | `matchesUserSearch`, `matchesReviewSearch` |
| `packages/contracts/src/admin/suspension.ts` (+ test) | Create | `planSuspension`, `suspendImpact` (BR-41/42) |
| `packages/contracts/src/endpoints.ts` (+ test), `index.ts` | Modify | 12 admin registry entries, exports |
| `packages/fixtures/src/{types,providers,requests,audit,build,index}.ts`, `build.test.ts` | Modify/Create | `decidedById`, `FxAudit`, audit rows, p08 requests |
| `src/mocks/db/schema.ts`, `seed.ts`, `store.test.ts` | Modify | `MockAudit = FxAudit`, seed audit, version 8 |
| `src/mocks/lib/verification.ts` | Modify | `decidedById: null` on new submissions |
| `src/mocks/lib/admin-audit.ts` | Create | `recordAudit`, `toAuditEntry`, `alreadyInState`, `paginate` |
| `src/mocks/lib/admin-verification.ts` (+ test) | Create | queue, detail, approve, reject, next |
| `src/mocks/lib/admin-users.ts` (+ test) | Create | list, detail, impact |
| `src/mocks/lib/admin-suspension.ts` (+ test) | Create | suspend (cascade), reactivate |
| `src/mocks/lib/admin-reviews.ts` (+ test) | Create | moderation list, hide, restore, rating recompute |
| `src/mocks/handlers/admin.ts` (+ `admin.test.ts`), `handlers/index.ts` | Create/Modify | 12 handlers |
| `src/mocks/dev/DevPanel.tsx` | Modify | suspended banner (D-18) |
| `src/lib/format.ts` (+ test), `src/lib/http.ts` (+ test), `src/lib/query-keys.ts` | Modify | `formatDayMonth`, `formatDaysAgo`, `httpBlob`, `qk.admin` |
| `src/components/conflict-dialog.tsx`, `src/components/document-titles.ts`, `src/features/provider-business/components/document-slot.tsx` | Modify/Create | `title` prop; shared slot titles |
| `src/features/admin/{api,hooks,url-state,copy}.ts` (+ tests) | Create | HTTP, queries/mutations, URL state, copy helpers |
| `src/app/layouts/nav-config.ts` (+ test), `admin-layout.tsx` | Modify | Verification badge |
| `src/features/admin/components/*.tsx` | Create | tiles, reason dialog, viewer, S32/S34/S37 parts |
| `src/features/admin/pages/*.tsx` (+ tests) | Create | S30, S31, S32, S33, S34, S37 |
| `src/app/chunks/admin.tsx`, `src/app/routes.test.tsx` | Modify | wiring, access tests |

## Tasks

### T1 — Audit enums and the Colombo day difference
- [x] done
**Files:** `packages/contracts/src/common/enums.ts`, `packages/contracts/src/common/dates.ts`, `packages/contracts/src/common/dates.test.ts`
**Context:** ARCH §8.1 `enum AuditAction`, `AuditLog.targetType` comment; D-4, D-13.
**Do:**
1. `git tag m13-start && git checkout -b m13-admin-console`.
2. Append to `enums.ts`:
```ts
export const AuditAction = z.enum([
  'verification_approve', 'verification_reject', 'user_suspend', 'user_reactivate', 'review_hide', 'review_restore',
  'request_cancel', 'category_create', 'category_update', 'category_reorder', 'district_create', 'district_update',
  'town_create', 'town_update',
]);
export type AuditAction = z.infer<typeof AuditAction>;

export const AuditTargetType = z.enum(['user', 'provider', 'submission', 'review', 'request', 'category', 'district', 'town']);
export type AuditTargetType = z.infer<typeof AuditTargetType>;
```
3. Append to `dates.ts`:
```ts
/** Whole Colombo calendar days from `instant`'s day to `now`'s day (never negative). Colombo has no DST. */
export function colomboDaysSince(instant: Date, now: Date): number {
  const a = colomboStartOfDay(colomboToday(instant)).getTime();
  const b = colomboStartOfDay(colomboToday(now)).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}
```
**Test:** append to `dates.test.ts`:
```ts
describe('colomboDaysSince', () => {
  const now = new Date('2026-11-24T06:00:00Z'); // 11:30 Colombo, 24 Nov
  it('same Colombo day → 0', () => {
    expect(colomboDaysSince(new Date('2026-11-23T19:00:00Z'), now)).toBe(0); // 00:30 Colombo 24 Nov
  });
  it('23:59 Colombo the day before → 1', () => {
    expect(colomboDaysSince(new Date('2026-11-23T18:29:00Z'), now)).toBe(1);
  });
  it('three days back → 3', () => {
    expect(colomboDaysSince(new Date('2026-11-21T04:00:00Z'), now)).toBe(3);
  });
  it('future instant → 0', () => {
    expect(colomboDaysSince(new Date('2026-11-30T00:00:00Z'), now)).toBe(0);
  });
});
```
(Add `colomboDaysSince` to the file's existing import from `./dates`.)
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): audit enums and colomboDaysSince (M13-T1)"`

### T2 — Admin reason bodies, audit entry and overview schemas
- [x] done
**Files:** `packages/contracts/src/admin/schemas.ts`, `packages/contracts/src/admin/schemas.test.ts`, `packages/contracts/src/index.ts`
**Context:** SPEC S32 reject field, S34 field, S37 field, S30.E1–E2; ARCH §2.3 `adminReason`; D-1, D-11.
**Do:**
1. Create `packages/contracts/src/admin/schemas.ts` (T3–T5 append to it):
```ts
import { z } from 'zod';
import {
  AccountStatus,
  AuditAction,
  AuditTargetType,
  CategoryIcon,
  RequestStatus,
  ReviewVisibility,
  Role,
  SubmissionStatus,
  SubmissionTrigger,
  TimeSlot,
  VerificationStatus,
} from '../common/enums';
import { PageQuery, paginated } from '../common/pagination';
import { adminReason, Id, IsoDate, IsoDateTime, Mobile, RequestRef } from '../common/primitives';
import { DocumentMeta } from '../providers/own';

/* ---------- Reasons (SPEC §8.7: admin reasons 10–500, required) ---------- */
export const REJECT_REASON_MESSAGE = 'Give a reason so the provider knows what to fix.';
export const HIDE_REASON_MESSAGE = 'Give a reason for the moderation log.';
export const accountReasonMessage = (name: string): string => `Give a reason. It's included in the email to ${name}.`;

export const RejectBody = z.object({ reason: adminReason(REJECT_REASON_MESSAGE) });
export type RejectBody = z.infer<typeof RejectBody>;
export const HideReviewBody = z.object({ reason: adminReason(HIDE_REASON_MESSAGE) });
export type HideReviewBody = z.infer<typeof HideReviewBody>;
/** API bodies (D-11). The S34 forms use makeAccountReasonBody(name) for the named message. */
export const SuspendBody = z.object({ reason: adminReason(accountReasonMessage('them')) });
export type SuspendBody = z.infer<typeof SuspendBody>;
export const ReactivateBody = z.object({ reason: adminReason(accountReasonMessage('them')) });
export type ReactivateBody = z.infer<typeof ReactivateBody>;
export const makeAccountReasonBody = (name: string) =>
  z.object({ reason: adminReason(accountReasonMessage(name)) });

/* ---------- Audit (ARCH §7.9, D14) ---------- */
export const AuditEntry = z.object({
  id: Id,
  action: AuditAction,
  targetType: AuditTargetType,
  targetId: Id,
  reason: z.string().nullable(),
  at: IsoDateTime,
  adminId: Id,
  adminName: z.string(),
});
export type AuditEntry = z.infer<typeof AuditEntry>;

/* ---------- Overview (S30.E1–E2; D-1: M25 adds `metrics` as an optional key) ---------- */
export const AdminAttention = z.object({
  pendingVerifications: z.number().int().min(0),
  oldestPendingAt: IsoDateTime.nullable(),
  suspendedUsers: z.number().int().min(0),
});
export type AdminAttention = z.infer<typeof AdminAttention>;
export const AdminOverview = z.object({ attention: AdminAttention });
export type AdminOverview = z.infer<typeof AdminOverview>;
```
(Unused imports at this point are fine only if lint allows; if `pnpm lint` flags unused imports, import only what this task uses and add the rest in T3–T5.)
2. `index.ts`: add `export * from './admin/schemas';`.
**Test:** `packages/contracts/src/admin/schemas.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { AdminOverview, HideReviewBody, makeAccountReasonBody, RejectBody, SuspendBody } from './schemas';

const msg = (r: { success: boolean; error?: { issues: { message: string }[] } }) => r.error?.issues[0]?.message;

describe('admin reason bodies', () => {
  it('reject: 9 trimmed chars fail with the SPEC message, 10 pass', () => {
    expect(msg(RejectBody.safeParse({ reason: '  123456789  ' }))).toBe(
      'Give a reason so the provider knows what to fix.',
    );
    expect(RejectBody.parse({ reason: ' 1234567890 ' }).reason).toBe('1234567890');
  });
  it('501 chars fail', () => {
    expect(RejectBody.safeParse({ reason: 'x'.repeat(501) }).success).toBe(false);
  });
  it('hide uses the moderation message', () => {
    expect(msg(HideReviewBody.safeParse({ reason: 'short' }))).toBe('Give a reason for the moderation log.');
  });
  it('account reason names the user in the form schema', () => {
    expect(msg(makeAccountReasonBody('Hank Morales').safeParse({ reason: '' }))).toBe(
      "Give a reason. It's included in the email to Hank Morales.",
    );
    expect(SuspendBody.safeParse({ reason: 'Repeated no-shows.' }).success).toBe(true);
  });
});

describe('AdminOverview', () => {
  it('accepts attention only and strips a future metrics key (D-1)', () => {
    const v = AdminOverview.parse({
      attention: { pendingVerifications: 1, oldestPendingAt: null, suspendedUsers: 0 },
      metrics: { anything: 1 },
    });
    expect(v).toEqual({ attention: { pendingVerifications: 1, oldestPendingAt: null, suspendedUsers: 0 } });
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): admin reason bodies, audit entry, overview (M13-T2)"`

### T3 — Verification queue and detail schemas
- [x] done
**Files:** `packages/contracts/src/admin/schemas.ts`, `packages/contracts/src/admin/schemas.test.ts`
**Context:** SPEC S31, S32.E1–E4, §8.5; ARCH §3.6 rows 2–5; D-2, D-3.
**Do:** append to `schemas.ts`:
```ts
/* ---------- Verification queue (S31) and review (S32) ---------- */
export const VerificationQueueQuery = PageQuery.extend({
  status: SubmissionStatus.catch('pending_review').default('pending_review'),
});
export type VerificationQueueQuery = z.infer<typeof VerificationQueueQuery>;

export const AdminProviderBrief = z.object({
  id: Id,
  businessName: z.string(),
  ownerName: z.string(),
  photoUrl: z.string().nullable(),
  category: z.object({ id: Id, name: z.string(), icon: CategoryIcon }),
});
export type AdminProviderBrief = z.infer<typeof AdminProviderBrief>;

export const VerificationQueueRow = z.object({
  id: Id,
  status: SubmissionStatus,
  attempt: z.number().int().min(1),
  trigger: SubmissionTrigger,
  submittedAt: IsoDateTime,
  decidedAt: IsoDateTime.nullable(),
  provider: AdminProviderBrief,
});
export type VerificationQueueRow = z.infer<typeof VerificationQueueRow>;
export const VerificationQueue = paginated(VerificationQueueRow);
export type VerificationQueue = z.infer<typeof VerificationQueue>;

export const PreviousDecision = z.object({
  id: Id,
  attempt: z.number().int().min(1),
  status: SubmissionStatus,
  submittedAt: IsoDateTime,
  decidedAt: IsoDateTime.nullable(),
  rejectionReason: z.string().nullable(),
  decidedByName: z.string().nullable(),
});
export type PreviousDecision = z.infer<typeof PreviousDecision>;

export const VerificationDetail = z.object({
  id: Id,
  status: SubmissionStatus,
  attempt: z.number().int().min(1),
  trigger: SubmissionTrigger,
  submittedAt: IsoDateTime,
  decidedAt: IsoDateTime.nullable(),
  rejectionReason: z.string().nullable(),
  documents: z.array(DocumentMeta), // this submission's files, S26 slot order
  provider: AdminProviderBrief.extend({
    userId: Id,
    accountName: z.string(),
    email: z.string(),
    mobile: Mobile.nullable(),
    baseTownName: z.string(),
    joinedAt: IsoDateTime,
    verificationStatus: VerificationStatus,
  }),
  previous: z.array(PreviousDecision), // earlier attempts, newest first; [] on a first submission
});
export type VerificationDetail = z.infer<typeof VerificationDetail>;

/** approve / reject response: the decided submission + the next pending one (oldest first) or null. */
export const VerificationDecisionResult = z.object({ detail: VerificationDetail, nextId: Id.nullable() });
export type VerificationDecisionResult = z.infer<typeof VerificationDecisionResult>;
```
**Test:** append:
```ts
describe('VerificationQueueQuery', () => {
  it('defaults to pending_review, page 1; bad values fall back', () => {
    expect(VerificationQueueQuery.parse({})).toEqual({ status: 'pending_review', page: 1 });
    expect(VerificationQueueQuery.parse({ status: 'nope', page: '0' })).toEqual({ status: 'pending_review', page: 1 });
    expect(VerificationQueueQuery.parse({ status: 'rejected', page: '2' })).toEqual({ status: 'rejected', page: 2 });
  });
});
```
(add `VerificationQueueQuery` to the test's import)
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): verification queue and detail schemas (M13-T3)"`

### T4 — Users and moderation schemas
- [x] done
**Files:** `packages/contracts/src/admin/schemas.ts`, `packages/contracts/src/admin/schemas.test.ts`
**Context:** SPEC S33, S34, S37; ARCH §3.6 rows 6–9, 13–15; D-7, D-8.
**Do:** append to `schemas.ts`:
```ts
/* ---------- Users (S33, S34) ---------- */
const SearchText = z.string().trim().max(80).catch('').default('');

export const AdminUserRoleFilter = z.enum(['all', 'customer', 'provider']);
export type AdminUserRoleFilter = z.infer<typeof AdminUserRoleFilter>;
export const AdminUserStatusFilter = z.enum(['all', 'suspended']);
export type AdminUserStatusFilter = z.infer<typeof AdminUserStatusFilter>;

export const AdminUserListQuery = PageQuery.extend({
  q: SearchText,
  role: AdminUserRoleFilter.catch('all').default('all'),
  status: AdminUserStatusFilter.catch('all').default('all'),
});
export type AdminUserListQuery = z.infer<typeof AdminUserListQuery>;

export const AdminUserRow = z.object({
  id: Id,
  fullName: z.string(),
  email: z.string(),
  mobile: Mobile.nullable(),
  roles: z.array(Role), // ['customer'] | ['customer','provider']
  verificationStatus: VerificationStatus.nullable(), // null = no published listing
  joinedAt: IsoDateTime,
  status: AccountStatus,
});
export type AdminUserRow = z.infer<typeof AdminUserRow>;
export const AdminUserList = paginated(AdminUserRow);
export type AdminUserList = z.infer<typeof AdminUserList>;

/** D-8: compact S35-format row for S34's recent lists. */
export const AdminRequestRow = z.object({
  ref: RequestRef,
  status: RequestStatus,
  customerName: z.string(),
  businessName: z.string(),
  serviceName: z.string(),
  preferredDate: IsoDate,
  slot: TimeSlot,
  townName: z.string(),
});
export type AdminRequestRow = z.infer<typeof AdminRequestRow>;
export const AdminRequestSummary = z.object({
  open: z.number().int().min(0),
  total: z.number().int().min(0),
  recent: z.array(AdminRequestRow).max(5),
});
export type AdminRequestSummary = z.infer<typeof AdminRequestSummary>;

export const SuspendImpact = z.object({
  providerPending: z.number().int().min(0),
  providerAccepted: z.number().int().min(0),
  customerOpen: z.number().int().min(0),
});
export type SuspendImpact = z.infer<typeof SuspendImpact>;

export const AdminUserDetail = z.object({
  id: Id,
  fullName: z.string(),
  email: z.string(),
  mobile: Mobile.nullable(),
  joinedAt: IsoDateTime,
  roles: z.array(Role),
  status: AccountStatus,
  provider: z
    .object({
      id: Id,
      businessName: z.string(),
      categoryName: z.string(),
      verificationStatus: VerificationStatus,
      latestSubmissionId: Id.nullable(),
      rating: z.number().nullable(),
      reviewCount: z.number().int().min(0),
      paused: z.boolean(),
      listed: z.boolean(),
    })
    .nullable(), // published listing only
  asCustomer: AdminRequestSummary,
  asProvider: AdminRequestSummary.nullable(),
  history: z.array(AuditEntry), // user_suspend / user_reactivate, newest first
  impact: SuspendImpact, // what Suspend would do now (zeros when suspended)
});
export type AdminUserDetail = z.infer<typeof AdminUserDetail>;

/* ---------- Reviews moderation (S37) ---------- */
export const ModerationVisibilityFilter = z.enum(['all', 'visible', 'hidden']);
export type ModerationVisibilityFilter = z.infer<typeof ModerationVisibilityFilter>;
export const ModerationQuery = PageQuery.extend({
  q: SearchText,
  visibility: ModerationVisibilityFilter.catch('all').default('all'),
});
export type ModerationQuery = z.infer<typeof ModerationQuery>;

export const ModerationRow = z.object({
  id: Id,
  requestRef: RequestRef,
  provider: z.object({ id: Id, businessName: z.string() }),
  authorDisplayName: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string(),
  createdAt: IsoDateTime,
  reply: z.object({ text: z.string(), createdAt: IsoDateTime }).nullable(),
  visibility: ReviewVisibility,
  hidden: z.object({ at: IsoDateTime, by: z.string(), reason: z.string().nullable() }).nullable(),
});
export type ModerationRow = z.infer<typeof ModerationRow>;
export const ModerationList = paginated(ModerationRow);
export type ModerationList = z.infer<typeof ModerationList>;
```
**Test:** append:
```ts
describe('list queries', () => {
  it('users: defaults, trims q, bad role/status fall back', () => {
    expect(AdminUserListQuery.parse({})).toEqual({ q: '', role: 'all', status: 'all', page: 1 });
    expect(AdminUserListQuery.parse({ q: '  marcus ', role: 'admin', status: 'x' })).toEqual({
      q: 'marcus', role: 'all', status: 'all', page: 1,
    });
  });
  it('moderation: visibility default all', () => {
    expect(ModerationQuery.parse({ visibility: 'hidden' })).toEqual({ q: '', visibility: 'hidden', page: 1 });
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): admin users and moderation schemas (M13-T4)"`

### T5 — Admin search matchers
- [x] done
**Files:** `packages/contracts/src/admin/search.ts`, `packages/contracts/src/admin/search.test.ts`, `packages/contracts/src/index.ts`
**Context:** SPEC S33 toolbar, S37 search; D-7.
**Do:**
1. Create `search.ts`:
```ts
/** S33 (D-7): name, email, business — substring, case-insensitive; mobile when the query is ≥ 3 digits. */
export function matchesUserSearch(
  q: string,
  u: { fullName: string; email: string; mobile: string | null; businessName: string | null },
): boolean {
  const needle = q.trim().toLowerCase();
  if (needle === '') return true;
  const digits = needle.replace(/[\s-]/g, '');
  if (u.mobile && /^\+?\d{3,}$/.test(digits)) {
    const local = u.mobile.replace(/^\+94/, '0'); // +94771234567 → 0771234567
    if (u.mobile.includes(digits) || local.includes(digits)) return true;
  }
  return [u.fullName, u.email, u.businessName ?? ''].some((s) => s.toLowerCase().includes(needle));
}

/** S37: provider business, author full name or review text. */
export function matchesReviewSearch(
  q: string,
  r: { businessName: string; authorName: string; text: string },
): boolean {
  const needle = q.trim().toLowerCase();
  if (needle === '') return true;
  return [r.businessName, r.authorName, r.text].some((s) => s.toLowerCase().includes(needle));
}
```
2. `index.ts`: `export * from './admin/search';`.
**Test:** `search.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { matchesReviewSearch, matchesUserSearch } from './search';

const marcus = { fullName: 'Marcus Bell', email: 'marcus@fixit.test', mobile: '+94770001101', businessName: 'Bell & Sons Plumbing' };
describe('matchesUserSearch', () => {
  it.each([['marcus'], ['MARCUS'], ['bell &'], ['fixit.test'], ['0770001101'], ['077 000 1101'], ['+9477000']])(
    '%s matches', (q) => { expect(matchesUserSearch(q, marcus)).toBe(true); },
  );
  it('empty query matches everyone', () => { expect(matchesUserSearch('  ', marcus)).toBe(true); });
  it('two digits do not search mobiles', () => {
    expect(matchesUserSearch('11', { ...marcus, fullName: 'X', email: 'x@y.z', businessName: null })).toBe(false);
  });
  it('no match', () => { expect(matchesUserSearch('olivia', marcus)).toBe(false); });
});
describe('matchesReviewSearch', () => {
  it('matches business, author or text', () => {
    const r = { businessName: 'Bell & Sons', authorName: 'Sarah Kim', text: 'Fixed the leak fast.' };
    expect(matchesReviewSearch('bell', r)).toBe(true);
    expect(matchesReviewSearch('sarah', r)).toBe(true);
    expect(matchesReviewSearch('LEAK', r)).toBe(true);
    expect(matchesReviewSearch('paint', r)).toBe(false);
  });
});
```
If Marcus's real mobile in fixtures differs, the test uses its own literal object, so it is independent of fixtures.
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): admin user and review search matchers (M13-T5)"`

### T6 — Suspension cascade rule (BR-41/42)
- [x] done
**Files:** `packages/contracts/src/admin/suspension.ts`, `packages/contracts/src/admin/suspension.test.ts`, `packages/contracts/src/index.ts`
**Context:** PRODUCT §6.1 system rows, BR-41, BR-42; SPEC A31; ARCH §2.8 (system actor); D-9. Reuses `canTransition`, `toMachineRequest`, `RequestRecord`.
**Do:**
1. Create `suspension.ts`:
```ts
import { toMachineRequest, type RequestRecord } from '../requests/record';
import { canTransition, type MachineActor } from '../requests/state-machine';
import type { SuspendImpact } from './schemas';

export const PROVIDER_UNAVAILABLE = 'Provider unavailable';
export const CUSTOMER_ACCOUNT_CLOSED = 'Customer account closed';

export interface SuspensionEffect {
  requestId: string;
  to: 'declined' | 'cancelled';
  side: 'provider' | 'customer';
  reason: string;
}

const SYSTEM: MachineActor = { kind: 'system' };

/** BR-41/BR-42 (A31): what suspending `userId` does to open requests. Pure — the API runs it under row locks, the mock inside one handler. */
export function planSuspension(requests: readonly RequestRecord[], userId: string, now: Date): SuspensionEffect[] {
  const out: SuspensionEffect[] = [];
  for (const r of requests) {
    if (r.status !== 'pending' && r.status !== 'accepted') continue;
    let effect: SuspensionEffect | null = null;
    if (r.providerUserId === userId)
      effect = {
        requestId: r.id,
        to: r.status === 'pending' ? 'declined' : 'cancelled',
        side: 'provider',
        reason: PROVIDER_UNAVAILABLE,
      };
    else if (r.customerId === userId)
      effect = { requestId: r.id, to: 'cancelled', side: 'customer', reason: CUSTOMER_ACCOUNT_CLOSED };
    if (effect && canTransition(toMachineRequest(r), effect.to, SYSTEM, now).ok) out.push(effect);
  }
  return out;
}

export function suspendImpact(effects: readonly SuspensionEffect[]): SuspendImpact {
  return {
    providerPending: effects.filter((e) => e.side === 'provider' && e.to === 'declined').length,
    providerAccepted: effects.filter((e) => e.side === 'provider' && e.to === 'cancelled').length,
    customerOpen: effects.filter((e) => e.side === 'customer').length,
  };
}
```
2. `index.ts`: `export * from './admin/suspension';`.
**Test:** `suspension.test.ts` — builds records with `buildWorld` from fixtures? No: contracts must not depend on fixtures. Build records inline:
```ts
import { describe, expect, it } from 'vitest';
import type { RequestRecord } from '../requests/record';
import { CUSTOMER_ACCOUNT_CLOSED, planSuspension, PROVIDER_UNAVAILABLE, suspendImpact } from './suspension';

const now = new Date('2026-11-24T06:00:00Z');
const rec = (id: string, status: RequestRecord['status'], customerId: string, providerUserId: string): RequestRecord =>
  ({
    id, ref: `FX-${id}`, customerId, providerId: `p-${providerUserId}`, providerUserId, serviceId: 'svc',
    service: { name: 'Leak repair', price: 2500, unit: 'per_hour' }, preferredDate: '2026-11-28', slot: 'morning',
    townId: 'colombo', addressLine1: '1 Main St', addressLine2: null, description: 'x'.repeat(20),
    customerMobile: '+94770000001', agreedPrice: null, status, reason: null, closedBy: null,
    createdAt: '2026-11-24T00:00:00Z', updatedAt: '2026-11-24T00:00:00Z', expiresAt: '2026-11-27T00:00:00Z',
    completedAt: null, events: [],
  }) satisfies RequestRecord;

describe('planSuspension', () => {
  const rows = [
    rec('1001', 'pending', 'c1', 'hank'),
    rec('1002', 'accepted', 'c2', 'hank'),
    rec('1003', 'completed', 'c3', 'hank'),
    rec('1004', 'pending', 'hank', 'other'),
    rec('1005', 'accepted', 'hank', 'other2'),
    rec('1006', 'pending', 'c4', 'other'),
  ];
  it('provider side: pending → declined, accepted → cancelled, "Provider unavailable"', () => {
    const e = planSuspension(rows, 'hank', now).filter((x) => x.side === 'provider');
    expect(e).toEqual([
      { requestId: '1001', to: 'declined', side: 'provider', reason: PROVIDER_UNAVAILABLE },
      { requestId: '1002', to: 'cancelled', side: 'provider', reason: PROVIDER_UNAVAILABLE },
    ]);
  });
  it('customer side: open → cancelled, "Customer account closed"', () => {
    const e = planSuspension(rows, 'hank', now).filter((x) => x.side === 'customer');
    expect(e.map((x) => [x.requestId, x.to, x.reason])).toEqual([
      ['1004', 'cancelled', CUSTOMER_ACCOUNT_CLOSED],
      ['1005', 'cancelled', CUSTOMER_ACCOUNT_CLOSED],
    ]);
  });
  it('final and unrelated requests are untouched', () => {
    const ids = planSuspension(rows, 'hank', now).map((x) => x.requestId);
    expect(ids).not.toContain('1003');
    expect(ids).not.toContain('1006');
  });
  it('suspendImpact counts each bucket', () => {
    expect(suspendImpact(planSuspension(rows, 'hank', now))).toEqual({
      providerPending: 1, providerAccepted: 1, customerOpen: 2,
    });
  });
});
```
If `RequestRecord` has fields not listed (check `requests/record.ts`), add them with neutral values; do not change the record schema.
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): suspension cascade plan BR-41/42 (M13-T6)"`

### T7 — Admin endpoint registry entries
- [x] done
**Files:** `packages/contracts/src/endpoints.ts`, `packages/contracts/src/endpoints.test.ts`
**Context:** ARCH §3.6 rows 1–9 and 13–15 (requests and catalog rows stay for M23/M26); §2.7.
**Do:**
1. Add to the imports of `endpoints.ts`:
```ts
import {
  AdminOverview, AdminUserDetail, AdminUserList, AdminUserListQuery, HideReviewBody, ModerationList, ModerationQuery,
  ModerationRow, ReactivateBody, RejectBody, SuspendBody, VerificationDecisionResult, VerificationDetail,
  VerificationQueue, VerificationQueueQuery,
} from './admin/schemas';
```
2. Add these entries before the closing `} as const satisfies …`:
```ts
  admin_overview: {
    id: 'admin_overview', domain: 'admin', method: 'GET', path: '/admin/overview',
    access: ['admin'], owner: 'none', response: AdminOverview, refs: ['F-36', 'S30', 'L4'],
  },
  admin_verifications_list: {
    id: 'admin_verifications_list', domain: 'admin', method: 'GET', path: '/admin/verifications',
    access: ['admin'], owner: 'none', query: VerificationQueueQuery, response: VerificationQueue, refs: ['F-31', 'S31'],
  },
  admin_verification_get: {
    id: 'admin_verification_get', domain: 'admin', method: 'GET', path: '/admin/verifications/:id',
    access: ['admin'], owner: 'none', response: VerificationDetail, refs: ['F-31', 'S32'],
  },
  admin_verification_approve: {
    id: 'admin_verification_approve', domain: 'admin', method: 'POST', path: '/admin/verifications/:id/approve',
    access: ['admin'], owner: 'none', response: VerificationDecisionResult, refs: ['F-31', 'S32', 'A29', 'BR-19', 'BR-20'],
  },
  admin_verification_reject: {
    id: 'admin_verification_reject', domain: 'admin', method: 'POST', path: '/admin/verifications/:id/reject',
    access: ['admin'], owner: 'none', body: RejectBody, response: VerificationDecisionResult, refs: ['F-31', 'S32', 'A30', 'BR-18'],
  },
  admin_users_list: {
    id: 'admin_users_list', domain: 'admin', method: 'GET', path: '/admin/users',
    access: ['admin'], owner: 'none', query: AdminUserListQuery, response: AdminUserList, refs: ['F-32', 'S33'],
  },
  admin_user_get: {
    id: 'admin_user_get', domain: 'admin', method: 'GET', path: '/admin/users/:id',
    access: ['admin'], owner: 'none', response: AdminUserDetail, refs: ['F-32', 'S34'],
  },
  admin_user_suspend: {
    id: 'admin_user_suspend', domain: 'admin', method: 'POST', path: '/admin/users/:id/suspend',
    access: ['admin'], owner: 'none', body: SuspendBody, response: AdminUserDetail, refs: ['F-32', 'S34', 'A31', 'BR-40', 'BR-41', 'BR-42'],
  },
  admin_user_reactivate: {
    id: 'admin_user_reactivate', domain: 'admin', method: 'POST', path: '/admin/users/:id/reactivate',
    access: ['admin'], owner: 'none', body: ReactivateBody, response: AdminUserDetail, refs: ['F-32', 'S34', 'A32', 'BR-43'],
  },
  admin_reviews_list: {
    id: 'admin_reviews_list', domain: 'admin', method: 'GET', path: '/admin/reviews',
    access: ['admin'], owner: 'none', query: ModerationQuery, response: ModerationList, refs: ['F-33', 'S37'],
  },
  admin_review_hide: {
    id: 'admin_review_hide', domain: 'admin', method: 'POST', path: '/admin/reviews/:id/hide',
    access: ['admin'], owner: 'none', body: HideReviewBody, response: ModerationRow, refs: ['F-33', 'S37', 'A33', 'BR-29'],
  },
  admin_review_restore: {
    id: 'admin_review_restore', domain: 'admin', method: 'POST', path: '/admin/reviews/:id/restore',
    access: ['admin'], owner: 'none', response: ModerationRow, refs: ['F-33', 'S37', 'A33', 'BR-29'],
  },
```
**Test:** append to `endpoints.test.ts`:
```ts
  it('M13 admin rows match ARCHITECTURE §3.6', () => {
    const admin = Object.values(ENDPOINTS).filter((d) => d.domain === 'admin');
    expect(admin.map((d) => `${d.method} ${d.path}`).sort()).toEqual(
      [
        'GET /admin/overview', 'GET /admin/verifications', 'GET /admin/verifications/:id',
        'POST /admin/verifications/:id/approve', 'POST /admin/verifications/:id/reject',
        'GET /admin/users', 'GET /admin/users/:id', 'POST /admin/users/:id/suspend', 'POST /admin/users/:id/reactivate',
        'GET /admin/reviews', 'POST /admin/reviews/:id/hide', 'POST /admin/reviews/:id/restore',
      ].sort(),
    );
    for (const d of admin) expect(d.access).toEqual(['admin']);
  });
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green. (No test currently requires a handler for every registry entry, so the 12 entries can land before their handlers in T15–T17.)
**Commit:** `git commit -m "feat(contracts): admin endpoint registry entries (M13-T7)"`

### T8 — Fixtures: decidedById, audit rows, p08 open requests
- [x] done
**Files:** `packages/fixtures/src/types.ts`, `packages/fixtures/src/providers.ts`, `packages/fixtures/src/requests.ts`, `packages/fixtures/src/audit.ts`, `packages/fixtures/src/build.ts`, `packages/fixtures/src/index.ts`, `packages/fixtures/src/build.test.ts`, `apps/web/src/mocks/lib/verification.ts`
**Context:** D-13, D-14; ARCH §8.1 `VerificationSubmission.decidedById`, `AuditLog`.
**Do:**
1. `types.ts`: add `decidedById: string | null;` to `FxSubmission` (after `decidedAt`). Add:
```ts
export interface FxAudit {
  id: string;
  adminId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  reason: string | null;
  at: string;
}
```
(import `AuditAction`, `AuditTargetType` types from `@fixit/contracts`) and `audit: FxAudit[];` in `World`.
2. `providers.ts` submissions: `s-p01-1` → `decidedById: 'u-admin'`; `s-p02-1` → `decidedById: null`; `s-p10-1` → `decidedById: 'u-admin'`.
3. `apps/web/src/mocks/lib/verification.ts`: in both `submitVerification` and `requeueForReverification` add `decidedById: null,` after `decidedAt: null,`. Run `pnpm typecheck`; add `decidedById: null` to any other `FxSubmission` literal it reports (tests included).
4. Create `audit.ts`:
```ts
import type { FxAudit } from './types';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** D-13: admin history for S34 / S37 / S32 that matches the seeded states. */
export function buildAudit(now: Date): FxAudit[] {
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  return [
    { id: 'a-s-p01-1', adminId: 'u-admin', action: 'verification_approve', targetType: 'submission', targetId: 's-p01-1', reason: null, at: ago(370 * DAY) },
    { id: 'a-s-p10-1', adminId: 'u-admin', action: 'verification_reject', targetType: 'submission', targetId: 's-p10-1', reason: 'The photo of the back of your NIC is blurry. Upload a clearer photo.', at: ago(2 * DAY) },
    { id: 'a-u-ruwan', adminId: 'u-admin', action: 'user_suspend', targetType: 'user', targetId: 'u-ruwan', reason: 'Several providers reported repeated no-shows and abusive messages.', at: ago(10 * DAY) },
    { id: 'a-v-FX-2028', adminId: 'u-admin', action: 'review_hide', targetType: 'review', targetId: 'v-FX-2028', reason: 'Personal remarks about the provider that break the review rules.', at: ago(330 * HOUR) },
  ];
}
```
5. `requests.ts`: append
```ts
/** M13 (D-14): open requests on p08 so suspending Hank shows the BR-41 cascade. */
export function buildSuspensionDemoRequests(
  now: Date,
  ctx: { users: readonly FxUser[]; providers: readonly FxProvider[]; services: readonly FxService[] },
): RequestRecord[] {
  const today = colomboToday(now);
  const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * HOUR);
  const p08 = ctx.providers.find((p) => p.id === 'p08');
  const service = ctx.services.find((s) => s.id === serviceId('p08', 0));
  const james = ctx.users.find((u) => u.id === 'u-james-carter');
  const ethan = ctx.users.find((u) => u.id === 'u-ethan-brooks');
  if (!p08 || !service || !james || !ethan) throw new Error('fixtures: bad p08 demo requests');
  const base = {
    provider: p08,
    service,
    townId: 'colombo',
    slot: 'afternoon' as const,
    addressLine1: '27 Galle Road',
    description: 'Please mount a 55-inch TV on the living room wall.',
  };
  return [
    makeRequest({ ...base, ref: 'FX-2042', customer: james, preferredDate: addDays(today, 3), createdAt: at(6), steps: [] }),
    makeRequest({
      ...base,
      ref: 'FX-2043',
      customer: ethan,
      preferredDate: addDays(today, 6),
      createdAt: at(30),
      steps: [{ status: 'accepted', at: at(20) }],
    }),
  ];
}
```
6. `build.ts`: import `buildAudit` and `buildSuspensionDemoRequests`; `const suspensionDemo = buildSuspensionDemoRequests(now, { users, providers, services });` add `...suspensionDemo` at the end of `requests`, and `audit: buildAudit(now),` to the returned world. `index.ts`: `export * from './audit';`.
**Test:** append to `build.test.ts` (inside the top-level describe that has `world` and `today`; follow the file's existing setup):
```ts
  it('M13: p08 has one pending and one accepted request', () => {
    const p08 = world.requests.filter((r) => r.providerId === 'p08');
    expect(p08.map((r) => [r.ref, r.status]).sort()).toEqual([['FX-2042', 'pending'], ['FX-2043', 'accepted']]);
  });
  it('M13: audit rows point at existing targets; decided submissions name an admin', () => {
    expect(world.audit.map((a) => a.targetId).sort()).toEqual(['s-p01-1', 's-p10-1', 'u-ruwan', 'v-FX-2028']);
    expect(world.reviews.find((v) => v.id === 'v-FX-2028')?.visibility).toBe('hidden');
    for (const s of world.submissions) expect(s.decidedById).toBe(s.decidedAt ? 'u-admin' : null);
  });
```
**Verify:** `pnpm --filter @fixit/fixtures test` green; `pnpm verify` green (if an existing count assertion breaks because of the two new requests, update only that number and say so in the commit body).
**Commit:** `git commit -m "feat(fixtures): audit rows, decidedById, p08 open requests (M13-T8)"`

### T9 — Mock db: audit rows and version 8
- [x] done
**Files:** `src/mocks/db/schema.ts`, `src/mocks/db/seed.ts`, `src/mocks/db/store.test.ts`
**Context:** CLAUDE.md mock rules (bump version); D-13.
**Do:**
1. `schema.ts`: `MOCK_DB_VERSION = 8`; replace the `MockAudit` interface with `export type MockAudit = FxAudit;` (import `FxAudit`).
2. `seed.ts`: `audit: w.audit,` (was `[]`).
3. `store.test.ts`: update any literal `fixit.mockdb.v7` / version `7` to `8`.
**Verify:** `pnpm --filter @fixit/web test -- src/mocks/db` green; `pnpm verify` green.
**Commit:** `git commit -m "chore(web): mock db seeds audit rows, version 8 (M13-T9)"`

### T10 — Mock audit helpers
- [x] done
**Files:** `src/mocks/lib/admin-audit.ts`
**Context:** ARCH §7.9; D-5, D-13.
**Do:** create:
```ts
import { PAGE_SIZE, type AuditEntry, type AuditTargetType } from '@fixit/contracts';
import type { FxAudit } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';

/** Same-"transaction" audit write: call inside the handler that makes the change (ARCH §7.9). */
export function recordAudit(d: MockDb, row: Omit<FxAudit, 'id' | 'at'>, now: Date): FxAudit {
  const entry: FxAudit = { id: `a-${crypto.randomUUID().slice(0, 8)}`, at: now.toISOString(), ...row };
  d.audit.push(entry);
  return entry;
}

export const auditFor = (d: MockDb, targetType: AuditTargetType, targetId: string): FxAudit[] =>
  d.audit
    .filter((a) => a.targetType === targetType && a.targetId === targetId)
    .sort((a, b) => b.at.localeCompare(a.at)); // newest first

export const toAuditEntry = (d: MockDb, a: FxAudit): AuditEntry => ({
  id: a.id,
  action: a.action,
  targetType: a.targetType,
  targetId: a.targetId,
  reason: a.reason,
  at: a.at,
  adminId: a.adminId,
  adminName: d.users[a.adminId]?.fullName ?? 'Fixit admin',
});

/** D-5: the thing was already changed (by another admin or an earlier click). */
export const alreadyInState = (status: string) =>
  mockError(409, 'CONFLICT', `Already ${status}`, { details: { rule: 'already_in_state', status } });

export function paginate<T>(rows: readonly T[], page: number) {
  const pageSize = PAGE_SIZE.admin;
  const start = (page - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    page,
    pageSize,
    total: rows.length,
    totalPages: Math.ceil(rows.length / pageSize),
  };
}
```
**Verify:** `pnpm verify` green (covered by T11–T14 tests).
**Commit:** `git commit -m "feat(web): mock admin audit helpers (M13-T10)"`

### T11 — Mock verification queue, detail and decisions
- [x] done
**Files:** `src/mocks/lib/admin-verification.ts`, `src/mocks/lib/admin-verification.test.ts`
**Context:** SPEC S31, S32, A29, A30, §8.5; D-2, D-5, D-12. Reuses `toDocumentMeta` (`mocks/lib/verification.ts`), `getFile/putFile` (`mocks/lib/files.ts`).
**Do:** create:
```ts
import type {
  AdminProviderBrief,
  DocumentType,
  VerificationDetail,
  VerificationQueue,
  VerificationQueueQuery,
} from '@fixit/contracts';
import type { FxProvider, FxSubmission } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { alreadyInState, paginate, recordAudit } from './admin-audit';
import { mockError } from './errors';
import { getFile, putFile } from './files';
import { toDocumentMeta } from './verification';

const ORDER: Record<DocumentType, number> = { nic_front: 0, nic_back: 1, trade_certificate: 2, business_registration: 3 };

function providerOf(d: MockDb, s: FxSubmission): FxProvider {
  const p = d.providers[s.providerId];
  if (!p) throw mockError(500, 'INTERNAL', `Submission ${s.id} has no provider`);
  return p;
}

function briefOf(d: MockDb, p: FxProvider): AdminProviderBrief {
  const owner = d.users[p.userId];
  const category = d.categories.find((c) => c.id === p.categoryId);
  if (!owner || !category) throw mockError(500, 'INTERNAL', `Provider ${p.id} is incomplete`);
  return {
    id: p.id,
    businessName: p.businessName ?? '',
    ownerName: owner.fullName,
    photoUrl: p.photoKey ? `/api/files/photos/${p.photoKey}` : null,
    category: { id: category.id, name: category.name, icon: category.icon },
  };
}

const pendingOldestFirst = (d: MockDb): FxSubmission[] =>
  Object.values(d.submissions)
    .filter((s) => s.status === 'pending_review')
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt) || a.id.localeCompare(b.id));

export function queuePage(d: MockDb, q: VerificationQueueQuery): VerificationQueue {
  const rows =
    q.status === 'pending_review'
      ? pendingOldestFirst(d)
      : Object.values(d.submissions)
          .filter((s) => s.status === q.status)
          .sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? '') || a.id.localeCompare(b.id));
  const page = paginate(rows, q.page);
  return {
    ...page,
    items: page.items.map((s) => ({
      id: s.id,
      status: s.status,
      attempt: s.attempt,
      trigger: s.trigger,
      submittedAt: s.submittedAt,
      decidedAt: s.decidedAt,
      provider: briefOf(d, providerOf(d, s)),
    })),
  };
}

export const nextPendingId = (d: MockDb, excludeId: string): string | null =>
  pendingOldestFirst(d).find((s) => s.id !== excludeId)?.id ?? null;

export function submissionOr404(d: MockDb, id: string): FxSubmission {
  const s = d.submissions[id];
  if (!s) throw mockError(404, 'NOT_FOUND', 'No such submission');
  return s;
}

export function verificationDetailOf(d: MockDb, s: FxSubmission): VerificationDetail {
  const p = providerOf(d, s);
  const owner = d.users[p.userId];
  if (!owner) throw mockError(500, 'INTERNAL', `Provider ${p.id} has no owner`);
  const town = d.towns.find((t) => t.id === p.baseTownId);
  return {
    id: s.id,
    status: s.status,
    attempt: s.attempt,
    trigger: s.trigger,
    submittedAt: s.submittedAt,
    decidedAt: s.decidedAt,
    rejectionReason: s.rejectionReason,
    documents: Object.values(d.documents)
      .filter((x) => x.submissionId === s.id)
      .sort((a, b) => ORDER[a.type] - ORDER[b.type])
      .map(toDocumentMeta),
    provider: {
      ...briefOf(d, p),
      userId: owner.id,
      accountName: owner.fullName,
      email: owner.email,
      mobile: owner.mobile,
      baseTownName: town?.name ?? '',
      joinedAt: owner.createdAt,
      verificationStatus: p.verificationStatus,
    },
    previous: Object.values(d.submissions)
      .filter((x) => x.providerId === p.id && x.attempt < s.attempt)
      .sort((a, b) => b.attempt - a.attempt)
      .map((x) => ({
        id: x.id,
        attempt: x.attempt,
        status: x.status,
        submittedAt: x.submittedAt,
        decidedAt: x.decidedAt,
        rejectionReason: x.rejectionReason,
        decidedByName: x.decidedById ? (d.users[x.decidedById]?.fullName ?? null) : null,
      })),
  };
}

function decide(d: MockDb, s: FxSubmission, adminId: string, now: Date): FxProvider {
  if (s.status !== 'pending_review') throw alreadyInState(s.status);
  s.decidedAt = now.toISOString();
  s.decidedById = adminId;
  return providerOf(d, s);
}

/** A29: badge on (BR-20). */
export function approveSubmission(d: MockDb, s: FxSubmission, adminId: string, now: Date): void {
  const p = decide(d, s, adminId, now);
  s.status = 'approved';
  p.verificationStatus = 'verified';
  p.verifiedAt = now.toISOString();
  p.reverificationReason = null;
  recordAudit(d, { adminId, action: 'verification_approve', targetType: 'submission', targetId: s.id, reason: null }, now);
}

/** A30 + D-12: the provider's S26 opens with copies of these files staged. */
export function rejectSubmission(d: MockDb, s: FxSubmission, adminId: string, reason: string, now: Date): void {
  const p = decide(d, s, adminId, now);
  s.status = 'rejected';
  s.rejectionReason = reason;
  p.verificationStatus = 'rejected';
  p.verifiedAt = null;
  for (const doc of Object.values(d.documents).filter((x) => x.submissionId === s.id)) {
    const copyId = `d-${crypto.randomUUID().slice(0, 8)}`;
    d.documents[copyId] = { ...doc, id: copyId, submissionId: null, createdAt: now.toISOString() };
    const blob = getFile(`doc:${doc.id}`);
    if (blob) putFile(`doc:${copyId}`, blob);
  }
  recordAudit(d, { adminId, action: 'verification_reject', targetType: 'submission', targetId: s.id, reason }, now);
}
```
**Test:** `admin-verification.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXED_NOW } from '@/test/fixed-now';
import { db } from '../db/store';
import { approveSubmission, nextPendingId, queuePage, rejectSubmission, submissionOr404, verificationDetailOf } from './admin-verification';
import { MockHttpError } from './errors';
import { verificationStateOf } from './verification';

beforeEach(() => { vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }); });
afterEach(() => { vi.useRealTimers(); });

describe('admin verification (mock)', () => {
  it('pending queue lists p02 first (oldest first) and approved lists p01', () => {
    const d = db();
    expect(queuePage(d, { status: 'pending_review', page: 1 }).items[0]?.provider.id).toBe('p02');
    expect(queuePage(d, { status: 'approved', page: 1 }).items.map((r) => r.provider.id)).toContain('p01');
  });
  it('detail: p02 has NIC front + back and no previous decisions', () => {
    const v = verificationDetailOf(db(), submissionOr404(db(), 's-p02-1'));
    expect(v.documents.map((x) => x.type)).toEqual(['nic_front', 'nic_back']);
    expect(v.previous).toEqual([]);
    expect(v.provider.accountName).toBe(v.provider.ownerName);
  });
  it('approve: provider verified, audit row, second approve → 409 already_in_state', () => {
    const d = db();
    const s = submissionOr404(d, 's-p02-1');
    approveSubmission(d, s, 'u-admin', new Date());
    expect(d.providers.p02?.verificationStatus).toBe('verified');
    expect(d.audit.at(-1)).toMatchObject({ action: 'verification_approve', targetId: 's-p02-1', adminId: 'u-admin' });
    expect(nextPendingId(d, 's-p02-1')).toBeNull();
    try { approveSubmission(d, s, 'u-admin', new Date()); expect.unreachable(); }
    catch (e) { expect(e).toBeInstanceOf(MockHttpError); expect((e as MockHttpError).status).toBe(409); }
  });
  it('reject: provider rejected with reason; S26 state shows the reason and prefilled staged docs', () => {
    const d = db();
    rejectSubmission(d, submissionOr404(d, 's-p02-1'), 'u-admin', 'The NIC photo is cut off on the left.', new Date());
    const p = d.providers.p02;
    if (!p) throw new Error('p02 missing');
    const state = verificationStateOf(d, p);
    expect(state.status).toBe('rejected');
    expect(state.rejectionReason).toBe('The NIC photo is cut off on the left.');
    expect(state.documents.map((x) => x.type)).toEqual(['nic_front', 'nic_back']);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- admin-verification` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock verification queue and decisions (M13-T11)"`

### T12 — Mock users list and detail
- [x] done
**Files:** `src/mocks/lib/admin-users.ts`, `src/mocks/lib/admin-users.test.ts`
**Context:** SPEC S33, S34; D-7, D-8, D-9. Reuses `isListed` (`cards.ts`), `matchesUserSearch`, `planSuspension`, `suspendImpact`, `OPEN_STATUSES`.
**Do:** create:
```ts
import {
  matchesUserSearch,
  OPEN_STATUSES,
  planSuspension,
  suspendImpact,
  type AdminRequestRow,
  type AdminRequestSummary,
  type AdminUserDetail,
  type AdminUserList,
  type AdminUserListQuery,
  type RequestRecord,
  type RequestStatus,
  type Role,
} from '@fixit/contracts';
import type { FxProvider } from '@fixit/fixtures';
import type { MockDb, MockUser } from '../db/schema';
import { auditFor, paginate, toAuditEntry } from './admin-audit';
import { isListed } from './cards';
import { mockError } from './errors';

export const publishedOf = (d: MockDb, userId: string): FxProvider | undefined =>
  Object.values(d.providers).find((p) => p.userId === userId && p.onboardingComplete);

const rolesOf = (d: MockDb, u: MockUser): Role[] => (publishedOf(d, u.id) ? ['customer', 'provider'] : ['customer']);

export function userListPage(d: MockDb, q: AdminUserListQuery): AdminUserList {
  const rows = Object.values(d.users)
    .filter((u) => !u.isAdmin)
    .filter((u) => {
      const p = publishedOf(d, u.id);
      if (q.role === 'customer' && p) return false;
      if (q.role === 'provider' && !p) return false;
      if (q.status === 'suspended' && u.status !== 'suspended') return false;
      return matchesUserSearch(q.q, { fullName: u.fullName, email: u.email, mobile: u.mobile, businessName: p?.businessName ?? null });
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.fullName.localeCompare(b.fullName));
  const page = paginate(rows, q.page);
  return {
    ...page,
    items: page.items.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      mobile: u.mobile,
      roles: rolesOf(d, u),
      verificationStatus: publishedOf(d, u.id)?.verificationStatus ?? null,
      joinedAt: u.createdAt,
      status: u.status,
    })),
  };
}

/** Unknown id → 404. Admin accounts are not managed in the app (BR-40) → 404 on GET. */
export function userOr404(d: MockDb, id: string): MockUser {
  const u = d.users[id];
  if (!u) throw mockError(404, 'NOT_FOUND', 'No such user');
  return u;
}
export function managedUserOr404(d: MockDb, id: string): MockUser {
  const u = userOr404(d, id);
  if (u.isAdmin) throw mockError(404, 'NOT_FOUND', 'No such user');
  return u;
}

function rowOf(d: MockDb, r: RequestRecord): AdminRequestRow {
  return {
    ref: r.ref,
    status: r.status,
    customerName: d.users[r.customerId]?.fullName ?? '',
    businessName: d.providers[r.providerId]?.businessName ?? '',
    serviceName: r.service.name,
    preferredDate: r.preferredDate,
    slot: r.slot,
    townName: d.towns.find((t) => t.id === r.townId)?.name ?? r.townId,
  };
}

const isOpen = (s: RequestStatus) => (OPEN_STATUSES as readonly RequestStatus[]).includes(s);
function summaryOf(d: MockDb, rows: RequestRecord[]): AdminRequestSummary {
  const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.ref.localeCompare(a.ref));
  return { open: rows.filter((r) => isOpen(r.status)).length, total: rows.length, recent: sorted.slice(0, 5).map((r) => rowOf(d, r)) };
}

export function userDetailOf(d: MockDb, u: MockUser, now: Date): AdminUserDetail {
  const p = publishedOf(d, u.id);
  const all = Object.values(d.requests);
  const category = p ? d.categories.find((c) => c.id === p.categoryId) : undefined;
  const latest = p
    ? Object.values(d.submissions).filter((s) => s.providerId === p.id).sort((a, b) => b.attempt - a.attempt)[0]
    : undefined;
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    mobile: u.mobile,
    joinedAt: u.createdAt,
    roles: rolesOf(d, u),
    status: u.status,
    provider: p
      ? {
          id: p.id,
          businessName: p.businessName ?? '',
          categoryName: category?.name ?? '',
          verificationStatus: p.verificationStatus,
          latestSubmissionId: latest?.id ?? null,
          rating: p.reviewCount > 0 ? p.ratingAvg : null,
          reviewCount: p.reviewCount,
          paused: p.paused,
          listed: isListed(d, p),
        }
      : null,
    asCustomer: summaryOf(d, all.filter((r) => r.customerId === u.id)),
    asProvider: p ? summaryOf(d, all.filter((r) => r.providerId === p.id)) : null,
    history: auditFor(d, 'user', u.id).map((a) => toAuditEntry(d, a)),
    impact: u.status === 'suspended'
      ? { providerPending: 0, providerAccepted: 0, customerOpen: 0 }
      : suspendImpact(planSuspension(all, u.id, now)),
  };
}
```
**Test:** `admin-users.test.ts` (fake timers as in T11):
```ts
describe('admin users (mock)', () => {
  it('search "marcus" finds Marcus Bell (and Marcus Lee); admins never listed', () => {
    const names = userListPage(db(), { q: 'marcus', role: 'all', status: 'all', page: 1 }).items.map((u) => u.fullName);
    expect(names).toContain('Marcus Bell');
    expect(userListPage(db(), { q: 'admin@fixit', role: 'all', status: 'all', page: 1 }).total).toBe(0);
  });
  it('role and status filters (D-7)', () => {
    const prov = userListPage(db(), { q: '', role: 'provider', status: 'all', page: 1 }).items;
    expect(prov.every((u) => u.roles.includes('provider'))).toBe(true);
    const cust = userListPage(db(), { q: 'kasun', role: 'customer', status: 'all', page: 1 }).items; // draft = customer
    expect(cust.map((u) => u.id)).toEqual(['u-kasun']);
    const susp = userListPage(db(), { q: '', role: 'all', status: 'suspended', page: 1 }).items;
    expect(susp.map((u) => u.id)).toEqual(['u-ruwan']);
  });
  it('page size 25', () => {
    expect(userListPage(db(), { q: '', role: 'all', status: 'all', page: 1 }).pageSize).toBe(25);
  });
  it('Hank detail: provider listing, impact 1 pending + 1 accepted', () => {
    const v = userDetailOf(db(), managedUserOr404(db(), 'u-hank'), new Date());
    expect(v.provider?.id).toBe('p08');
    expect(v.impact).toEqual({ providerPending: 1, providerAccepted: 1, customerOpen: 0 });
    expect(v.asProvider?.open).toBe(2);
  });
  it('Ruwan history shows the seeded suspension', () => {
    const v = userDetailOf(db(), managedUserOr404(db(), 'u-ruwan'), new Date());
    expect(v.history[0]).toMatchObject({ action: 'user_suspend', adminName: 'Fixit Admin' });
  });
  it('admin account → 404', () => {
    expect(() => managedUserOr404(db(), 'u-admin')).toThrow();
  });
});
```
(imports: `db` from `../db/store`, the three functions, fake-timer hooks.)
**Verify:** `pnpm --filter @fixit/web test -- admin-users` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock admin users list and detail (M13-T12)"`

### T13 — Mock suspend and reactivate
- [ ] done
**Files:** `src/mocks/lib/admin-suspension.ts`, `src/mocks/lib/admin-suspension.test.ts`
**Context:** BR-40–BR-43, A31, A32; D-5, D-9; AC10. Reuses `expireDue`, `transitionOr409`, `applyTransition`.
**Do:** create:
```ts
import { planSuspension } from '@fixit/contracts';
import type { MockDb, MockUser } from '../db/schema';
import { expireDue } from '../db/expire';
import { alreadyInState, recordAudit } from './admin-audit';
import { mockError } from './errors';
import { applyTransition, transitionOr409 } from './requests';

/** A31: cascade (BR-41/42) through the state machine as `system`, then the status, then the audit row. */
export function suspendUser(d: MockDb, u: MockUser, adminId: string, reason: string, now: Date): void {
  if (u.isAdmin)
    throw mockError(422, 'RULE_VIOLATION', 'Admins cannot be suspended', { details: { rule: 'cannot_suspend_admin' } });
  if (u.status === 'suspended') throw alreadyInState('suspended');
  expireDue(d, now);
  for (const e of planSuspension(Object.values(d.requests), u.id, now)) {
    const r = d.requests[e.requestId];
    if (!r) continue;
    transitionOr409(r, e.to, { kind: 'system' }, now);
    applyTransition(r, e.to, 'system', null, now, e.reason);
  }
  u.status = 'suspended'; // resolveActor + refresh already refuse suspended users → sessions end
  recordAudit(d, { adminId, action: 'user_suspend', targetType: 'user', targetId: u.id, reason }, now);
}

/** A32 / BR-43: sign-in and listing back; closed requests stay closed; verification unchanged. */
export function reactivateUser(d: MockDb, u: MockUser, adminId: string, reason: string, now: Date): void {
  if (u.isAdmin) throw mockError(404, 'NOT_FOUND', 'No such user');
  if (u.status === 'active') throw alreadyInState('active');
  u.status = 'active';
  recordAudit(d, { adminId, action: 'user_reactivate', targetType: 'user', targetId: u.id, reason }, now);
}
```
**Test:** `admin-suspension.test.ts` (fake timers; AC10):
```ts
describe('suspension cascade (mock)', () => {
  it('provider: pending → declined "Provider unavailable", accepted → cancelled; listing hidden; audit', () => {
    const d = db();
    const hank = d.users['u-hank'];
    if (!hank) throw new Error('hank');
    suspendUser(d, hank, 'u-admin', 'Repeated complaints from customers.', new Date());
    const byRef = (ref: string) => Object.values(d.requests).find((r) => r.ref === ref);
    expect(byRef('FX-2042')).toMatchObject({ status: 'declined', reason: 'Provider unavailable', closedBy: 'system' });
    expect(byRef('FX-2043')).toMatchObject({ status: 'cancelled', reason: 'Provider unavailable', closedBy: 'system' });
    expect(byRef('FX-2042')?.events.at(-1)).toMatchObject({ actor: 'system', status: 'declined' });
    const p08 = d.providers.p08;
    if (!p08) throw new Error('p08');
    expect(isListed(d, p08)).toBe(false);
    expect(d.audit.at(-1)).toMatchObject({ action: 'user_suspend', targetId: 'u-hank' });
  });
  it('customer: open requests → cancelled "Customer account closed"', () => {
    const d = db();
    const dilani = d.users['u-dilani'];
    if (!dilani) throw new Error('dilani');
    suspendUser(d, dilani, 'u-admin', 'Fraudulent bookings reported.', new Date());
    const mine = Object.values(d.requests).filter((r) => r.customerId === 'u-dilani' && r.ref.startsWith('FX-199'));
    expect(mine).toHaveLength(5);
    for (const r of mine) expect(r).toMatchObject({ status: 'cancelled', reason: 'Customer account closed' });
  });
  it('refuses to suspend an admin (cannot_suspend_admin) and a suspended user (409)', () => {
    const d = db();
    const admin = d.users['u-admin'];
    const ruwan = d.users['u-ruwan'];
    if (!admin || !ruwan) throw new Error('users');
    expect(() => { suspendUser(d, admin, 'u-admin', 'Testing the guard rail.', new Date()); }).toThrow(
      expect.objectContaining({ status: 422, extra: { details: { rule: 'cannot_suspend_admin' } } }),
    );
    expect(() => { suspendUser(d, ruwan, 'u-admin', 'Testing the guard rail.', new Date()); }).toThrow(
      expect.objectContaining({ status: 409 }),
    );
  });
  it('reactivate: listing back, closed requests stay closed, verification unchanged', () => {
    const d = db();
    const hank = d.users['u-hank'];
    const p08 = d.providers.p08;
    if (!hank || !p08) throw new Error('fixtures');
    suspendUser(d, hank, 'u-admin', 'Repeated complaints from customers.', new Date());
    reactivateUser(d, hank, 'u-admin', 'Complaints were resolved by phone.', new Date());
    expect(isListed(d, p08)).toBe(true);
    expect(Object.values(d.requests).find((r) => r.ref === 'FX-2042')?.status).toBe('declined');
    expect(p08.verificationStatus).toBe('not_submitted');
    expect(d.audit.at(-1)).toMatchObject({ action: 'user_reactivate' });
  });
});
```
(imports: `db`, `isListed` from `./cards`, `suspendUser`, `reactivateUser`, fake timers.)
**Verify:** `pnpm --filter @fixit/web test -- admin-suspension` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock suspension cascade and reactivation (M13-T13)"`

### T14 — Mock review moderation
- [ ] done
**Files:** `src/mocks/lib/admin-reviews.ts`, `src/mocks/lib/admin-reviews.test.ts`
**Context:** SPEC S37, A33; BR-27, BR-29; ARCH §7.7 (recompute in the same write); D-5. Reuses `ratingFrom`, `displayNameOf`, `matchesReviewSearch`.
**Do:** create:
```ts
import {
  displayNameOf,
  matchesReviewSearch,
  ratingFrom,
  type ModerationList,
  type ModerationQuery,
  type ModerationRow,
} from '@fixit/contracts';
import type { FxReview } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { alreadyInState, auditFor, paginate, recordAudit } from './admin-audit';
import { mockError } from './errors';

export function reviewOr404(d: MockDb, id: string): FxReview {
  const v = d.reviews[id];
  if (!v) throw mockError(404, 'NOT_FOUND', 'No such review');
  return v;
}

/** BR-27 / F-29: same write as the visibility change. */
export function recomputeRating(d: MockDb, providerId: string): void {
  const p = d.providers[providerId];
  if (!p) return;
  const agg = ratingFrom(
    Object.values(d.reviews).filter((v) => v.providerId === providerId && v.visibility === 'visible').map((v) => v.rating),
  );
  p.ratingAvg = agg.rating;
  p.reviewCount = agg.count;
}

export function moderationRowOf(d: MockDb, v: FxReview): ModerationRow {
  const req = d.requests[v.requestId];
  const hide = v.visibility === 'hidden' ? auditFor(d, 'review', v.id).find((a) => a.action === 'review_hide') : undefined;
  return {
    id: v.id,
    requestRef: req?.ref ?? 'FX-0000',
    provider: { id: v.providerId, businessName: d.providers[v.providerId]?.businessName ?? '' },
    authorDisplayName: displayNameOf(d.users[v.authorId]?.fullName ?? ''),
    rating: v.rating,
    text: v.text,
    createdAt: v.createdAt,
    reply: v.replyText && v.replyCreatedAt ? { text: v.replyText, createdAt: v.replyCreatedAt } : null,
    visibility: v.visibility,
    hidden: hide ? { at: hide.at, by: d.users[hide.adminId]?.fullName ?? 'Fixit admin', reason: hide.reason } : null,
  };
}

export function moderationPage(d: MockDb, q: ModerationQuery): ModerationList {
  const rows = Object.values(d.reviews)
    .filter((v) => q.visibility === 'all' || v.visibility === q.visibility)
    .filter((v) =>
      matchesReviewSearch(q.q, {
        businessName: d.providers[v.providerId]?.businessName ?? '',
        authorName: d.users[v.authorId]?.fullName ?? '',
        text: v.text,
      }),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  const page = paginate(rows, q.page);
  return { ...page, items: page.items.map((v) => moderationRowOf(d, v)) };
}

export function hideReview(d: MockDb, v: FxReview, adminId: string, reason: string, now: Date): void {
  if (v.visibility === 'hidden') throw alreadyInState('hidden');
  v.visibility = 'hidden';
  recomputeRating(d, v.providerId);
  recordAudit(d, { adminId, action: 'review_hide', targetType: 'review', targetId: v.id, reason }, now);
}

export function restoreReview(d: MockDb, v: FxReview, adminId: string, now: Date): void {
  if (v.visibility === 'visible') throw alreadyInState('visible');
  v.visibility = 'visible';
  recomputeRating(d, v.providerId);
  recordAudit(d, { adminId, action: 'review_restore', targetType: 'review', targetId: v.id, reason: null }, now);
}
```
If `FxReview.requestId` lookup by id doesn't hit because requests are keyed by `id = r-FX-…` — it does (`requests: byId`), so `d.requests[v.requestId]` is correct.
**Test:** `admin-reviews.test.ts` (fake timers; AC10):
```ts
describe('review moderation (mock)', () => {
  it('hidden tab shows FX-2028 with seeded metadata', () => {
    const rows = moderationPage(db(), { q: '', visibility: 'hidden', page: 1 }).items;
    expect(rows.find((r) => r.requestRef === 'FX-2028')?.hidden).toMatchObject({ by: 'Fixit Admin' });
  });
  it('hide then restore recomputes rating/count with ratingFrom', () => {
    const d = db();
    const v = Object.values(d.reviews).find((x) => x.providerId === 'p01' && x.visibility === 'visible');
    if (!v) throw new Error('no p01 review');
    const visible = () => Object.values(d.reviews).filter((x) => x.providerId === 'p01' && x.visibility === 'visible').map((x) => x.rating);
    const before = d.providers.p01?.reviewCount ?? 0;
    hideReview(d, v, 'u-admin', 'Contains a phone number.', new Date());
    expect(d.providers.p01?.reviewCount).toBe(before - 1);
    expect(d.providers.p01?.ratingAvg).toBe(ratingFrom(visible()).rating);
    expect(moderationRowOf(d, v).hidden?.reason).toBe('Contains a phone number.');
    restoreReview(d, v, 'u-admin', new Date());
    expect(d.providers.p01?.reviewCount).toBe(before);
    expect(d.providers.p01?.ratingAvg).toBe(ratingFrom(visible()).rating);
  });
  it('hiding a hidden review → 409', () => {
    const d = db();
    expect(() => { hideReview(d, reviewOr404(d, 'v-FX-2028'), 'u-admin', 'Second attempt at hiding.', new Date()); }).toThrow(
      expect.objectContaining({ status: 409 }),
    );
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- admin-reviews` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock review moderation with rating recompute (M13-T14)"`

### T15 — MSW handlers: overview and verification
- [ ] done
**Files:** `src/mocks/handlers/admin.ts`, `src/mocks/handlers/index.ts`, `src/mocks/handlers/admin.test.ts`
**Context:** ARCH §3.6; mock rules (contracts schemas, roles via `mockEndpoint`); D-1, D-5.
**Do:**
1. Create `admin.ts`:
```ts
import { ENDPOINTS as E } from '@fixit/contracts';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
import type { MockActor } from '../lib/identity';
import {
  approveSubmission,
  nextPendingId,
  queuePage,
  rejectSubmission,
  submissionOr404,
  verificationDetailOf,
} from '../lib/admin-verification';

/** assertAccess already required role admin; null here is a mock bug. */
export const adminIdOf = (actor: MockActor | null): string => {
  if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
  return actor.userId;
};

export const adminHandlers = [
  mockEndpoint(E.admin_overview, ({ db: d }) => {
    const pending = Object.values(d.submissions)
      .filter((s) => s.status === 'pending_review')
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    return {
      attention: {
        pendingVerifications: pending.length,
        oldestPendingAt: pending[0]?.submittedAt ?? null,
        suspendedUsers: Object.values(d.users).filter((u) => !u.isAdmin && u.status === 'suspended').length,
      },
    };
  }),
  mockEndpoint(E.admin_verifications_list, ({ db: d, query }) => queuePage(d, query)),
  mockEndpoint(E.admin_verification_get, ({ db: d, params }) =>
    verificationDetailOf(d, submissionOr404(d, params.id ?? '')),
  ),
  mockEndpoint(E.admin_verification_approve, ({ db: d, params, actor, now }) => {
    const s = submissionOr404(d, params.id ?? '');
    approveSubmission(d, s, adminIdOf(actor), now);
    return { detail: verificationDetailOf(d, s), nextId: nextPendingId(d, s.id) };
  }),
  mockEndpoint(E.admin_verification_reject, ({ db: d, params, actor, body, now }) => {
    const s = submissionOr404(d, params.id ?? '');
    rejectSubmission(d, s, adminIdOf(actor), body.reason, now);
    return { detail: verificationDetailOf(d, s), nextId: nextPendingId(d, s.id) };
  }),
];
```
2. `handlers/index.ts`: import `adminHandlers` from `./admin` and set `admin: adminHandlers`.
**Test:** `admin.test.ts` (copy the `call(method, path, persona, body?)` helper from `requests-provider-actions.test.ts`; fake timers):
```ts
describe('admin handlers — overview & verification', () => {
  it.each([['customer'], ['provider']] as const)('%s → 403', async (persona) => {
    expect((await call('GET', '/admin/overview', persona)).status).toBe(403);
  });
  it('anonymous → 401', async () => {
    expect((await fetch(new URL('/api/admin/overview', location.origin))).status).toBe(401);
  });
  it('overview counts p02 pending and Ruwan suspended', async () => {
    const res = await call('GET', '/admin/overview', 'admin');
    const body = AdminOverview.parse(await res.json());
    expect(body.attention).toMatchObject({ pendingVerifications: 1, suspendedUsers: 1 });
  });
  it('approve returns nextId null and the detail approved; again → 409 already_in_state', async () => {
    const res = await call('POST', '/admin/verifications/s-p02-1/approve', 'admin');
    expect(VerificationDecisionResult.parse(await res.json())).toMatchObject({ nextId: null, detail: { status: 'approved' } });
    const again = await call('POST', '/admin/verifications/s-p02-1/approve', 'admin');
    expect(again.status).toBe(409);
    expect(ErrorEnvelope.parse(await again.json()).error.details?.rule).toBe('already_in_state');
  });
  it('reject with 5 chars → 400 with the SPEC message', async () => {
    const res = await call('POST', '/admin/verifications/s-p02-1/reject', 'admin', { reason: 'blurr' });
    expect(res.status).toBe(400);
    expect(ErrorEnvelope.parse(await res.json()).error.fieldErrors?.reason).toEqual([
      'Give a reason so the provider knows what to fix.',
    ]);
  });
  it('unknown submission → 404', async () => {
    expect((await call('GET', '/admin/verifications/s-nope', 'admin')).status).toBe(404);
  });
});
```
If the anonymous helper differs in this repo (e.g. `apiUrl`), use the same URL building as the copied helper.
**Verify:** `pnpm --filter @fixit/web test -- handlers/admin` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): admin overview and verification mock handlers (M13-T15)"`

### T16 — MSW handlers: users
- [ ] done
**Files:** `src/mocks/handlers/admin.ts`, `src/mocks/handlers/admin.test.ts`
**Context:** ARCH §3.6 users rows; D-5, D-7; AC4, AC5, AC10.
**Do:** add imports from `../lib/admin-users` (`managedUserOr404`, `userDetailOf`, `userListPage`, `userOr404`) and `../lib/admin-suspension` (`reactivateUser`, `suspendUser`), then append to `adminHandlers`:
```ts
  mockEndpoint(E.admin_users_list, ({ db: d, query }) => userListPage(d, query)),
  mockEndpoint(E.admin_user_get, ({ db: d, params, now }) => userDetailOf(d, managedUserOr404(d, params.id ?? ''), now)),
  mockEndpoint(E.admin_user_suspend, ({ db: d, params, actor, body, now }) => {
    const u = userOr404(d, params.id ?? ''); // admin target → 422 cannot_suspend_admin inside suspendUser (AC10)
    suspendUser(d, u, adminIdOf(actor), body.reason, now);
    return userDetailOf(d, u, now);
  }),
  mockEndpoint(E.admin_user_reactivate, ({ db: d, params, actor, body, now }) => {
    const u = managedUserOr404(d, params.id ?? '');
    reactivateUser(d, u, adminIdOf(actor), body.reason, now);
    return userDetailOf(d, u, now);
  }),
```
**Test:** append:
```ts
describe('admin handlers — users', () => {
  it('list search marcus', async () => {
    const body = AdminUserList.parse(await (await call('GET', '/admin/users?q=marcus', 'admin')).json());
    expect(body.items.map((u) => u.fullName)).toContain('Marcus Bell');
  });
  it('admin detail → 404', async () => {
    expect((await call('GET', '/admin/users/u-admin', 'admin')).status).toBe(404);
  });
  it('suspend admin → 422 cannot_suspend_admin', async () => {
    const res = await call('POST', '/admin/users/u-admin/suspend', 'admin', { reason: 'Trying the guard rail.' });
    expect(res.status).toBe(422);
    expect(ErrorEnvelope.parse(await res.json()).error.details?.rule).toBe('cannot_suspend_admin');
  });
  it('suspend Hank: detail suspended with history; Hank can no longer log in; profile 404', async () => {
    const res = await call('POST', '/admin/users/u-hank/suspend', 'admin', { reason: 'Repeated complaints from customers.' });
    const v = AdminUserDetail.parse(await res.json());
    expect(v.status).toBe('suspended');
    expect(v.history[0]?.action).toBe('user_suspend');
    const login = await fetch(new URL('/api/auth/login', location.origin), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hank@fixit.test', password: 'demo1234' }),
    });
    expect(ErrorEnvelope.parse(await login.json()).error.code).toBe('ACCOUNT_SUSPENDED');
    expect((await fetch(new URL('/api/providers/p08', location.origin))).status).toBe(404);
  });
  it('reason 9 chars → 400', async () => {
    expect((await call('POST', '/admin/users/u-hank/suspend', 'admin', { reason: '123456789' })).status).toBe(400);
  });
});
```
(Use `DEMO_PASSWORD` from `@fixit/fixtures` instead of the literal if the helper file already imports it.)
**Verify:** `pnpm --filter @fixit/web test -- handlers/admin` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): admin users mock handlers with suspension (M13-T16)"`

### T17 — MSW handlers: review moderation
- [ ] done
**Files:** `src/mocks/handlers/admin.ts`, `src/mocks/handlers/admin.test.ts`
**Context:** ARCH §3.6 reviews rows; AC6.
**Do:** import from `../lib/admin-reviews` (`hideReview`, `moderationPage`, `moderationRowOf`, `restoreReview`, `reviewOr404`), append:
```ts
  mockEndpoint(E.admin_reviews_list, ({ db: d, query }) => moderationPage(d, query)),
  mockEndpoint(E.admin_review_hide, ({ db: d, params, actor, body, now }) => {
    const v = reviewOr404(d, params.id ?? '');
    hideReview(d, v, adminIdOf(actor), body.reason, now);
    return moderationRowOf(d, v);
  }),
  mockEndpoint(E.admin_review_restore, ({ db: d, params, actor, now }) => {
    const v = reviewOr404(d, params.id ?? '');
    restoreReview(d, v, adminIdOf(actor), now);
    return moderationRowOf(d, v);
  }),
```
**Test:** append:
```ts
describe('admin handlers — reviews', () => {
  it('hide changes the public profile count; restore brings it back', async () => {
    const profile = async () => ProviderPublicProfile.parse(await (await fetch(new URL('/api/providers/p01', location.origin))).json());
    const before = (await profile()).reviewCount;
    const list = ModerationList.parse(await (await call('GET', '/admin/reviews?visibility=visible&q=bell', 'admin')).json());
    const row = list.items.find((r) => r.provider.id === 'p01');
    if (!row) throw new Error('no p01 review');
    const hidden = ModerationRow.parse(await (await call('POST', `/admin/reviews/${row.id}/hide`, 'admin', { reason: 'Contains a phone number.' })).json());
    expect(hidden.hidden?.reason).toBe('Contains a phone number.');
    expect((await profile()).reviewCount).toBe(before - 1);
    await call('POST', `/admin/reviews/${row.id}/restore`, 'admin');
    expect((await profile()).reviewCount).toBe(before);
  });
});
```
(If p01's business name doesn't contain "bell", drop `&q=bell`.)
**Verify:** `pnpm --filter @fixit/web test -- handlers/admin` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): admin review moderation mock handlers (M13-T17)"`

### T18 — DevPanel shows the suspended banner
- [ ] done
**Files:** `src/mocks/dev/DevPanel.tsx`
**Context:** AC5 ("DevPanel login shows the suspended banner"); D-18; `FORM_COPY.suspended` (`lib/error-copy.ts`), `NoticeBanner` (`components/notice-banner.tsx`).
**Do:** in `SessionSection.run`'s catch: if `e instanceof ApiError && e.code === 'ACCOUNT_SUSPENDED'` call `setError(FORM_COPY.suspended)` and set a new state `setSuspended(true)`; otherwise keep the current message and `setSuspended(false)`. Where `error` is rendered, render `<NoticeBanner variant="danger">{error}</NoticeBanner>` when `suspended` is true (check `NoticeBanner`'s prop names in its file and use its danger variant), else the existing element. Reset `suspended` to false at the start of `run`.
**Verify:** `pnpm verify` green. The manual check runs in T41 (AC5): once Hank is suspended (possible from T16 by calling the handler, or from T37 in the UI), signing in as "Provider, not submitted (Hank Morales)" shows the banner text `Your account is suspended. If you think this is a mistake, email us at …`.
**Commit:** `git commit -m "feat(web): DevPanel suspended-account banner (M13-T18)"`

### T19 — Formatters and authenticated blob download
- [ ] done
**Files:** `src/lib/format.ts`, `src/lib/format.test.ts`, `src/lib/http.ts`, `src/lib/http.test.ts`
**Context:** SPEC S31 Submitted column; D-4, D-15.
**Do:**
1. `format.ts` (import `colomboDaysSince` from `@fixit/contracts`), add:
```ts
/** `21 Nov` (S31 Submitted) */
export const formatDayMonth = (value: string | Date): string => formatInColombo(toInstant(value), 'd MMM');

/** S31 sub line (D-4): `today` · `yesterday` · `3 days ago`. */
export function formatDaysAgo(value: string | Date, now: Date): string {
  const n = colomboDaysSince(toInstant(value), now);
  if (n === 0) return 'today';
  if (n === 1) return 'yesterday';
  return `${String(n)} days ago`;
}
```
2. `http.ts`, add after `http()`:
```ts
/** D-15: authenticated file download (S32 viewer). Same auth and single refresh as http(). */
export async function httpBlob(path: string, signal?: AbortSignal): Promise<Blob> {
  const opts: HttpOpts<undefined> = { schema: undefined, ...(signal ? { signal } : {}) };
  const hadToken = authStore.accessToken() !== null;
  let res = await send(path, opts);
  if (res.status === 401 && hadToken) {
    if (await refreshOnce()) res = await send(path, opts);
    else authStore.signOut(lastRefreshFailure === 'ACCOUNT_SUSPENDED' ? 'suspended' : 'expired');
  }
  if (!res.ok) throw await toApiError(res);
  return res.blob();
}
```
(`lastRefreshFailure` is a module `let` declared below `http()`; it is hoisted as a binding and read at call time, so this works.)
**Test:**
- `format.test.ts` (fixed `now = new Date('2026-11-24T06:00:00Z')`): `formatDayMonth('2026-11-21T04:00:00Z') === '21 Nov'`; `formatDaysAgo` → `'today'` for `2026-11-24T01:00:00Z`, `'yesterday'` for `2026-11-23T10:00:00Z`, `'3 days ago'` for `2026-11-21T04:00:00Z`.
- `http.test.ts`: signed in as admin (`signInAs('admin')`), `await httpBlob('/files/documents/d-p02-nic-front')` resolves to a `Blob` with `size > 0`; signed in as Olivia it rejects with `ApiError` status 404.
**Verify:** `pnpm --filter @fixit/web test -- src/lib` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): day/month and days-ago formatters, httpBlob (M13-T19)"`

### T20 — Shared conflict title and document titles
- [ ] done
**Files:** `src/components/conflict-dialog.tsx`, `src/components/document-titles.ts`, `src/features/provider-business/components/document-slot.tsx`
**Context:** D-6, D-19.
**Do:**
1. `conflict-dialog.tsx`: add prop `title?: string` (default `'This request has changed'`) and pass it to `ResponsiveDialog`'s `title`. Existing callers unchanged.
2. Create `document-titles.ts`:
```ts
import type { DocumentType } from '@fixit/contracts';

/** S26.E1 / S32.E1 slot titles. */
export const SLOT_TITLE: Record<DocumentType, string> = {
  nic_front: 'NIC — front',
  nic_back: 'NIC — back',
  trade_certificate: 'Trade certificate or NVQ',
  business_registration: 'Business registration',
};
export const DOCUMENT_ORDER: readonly DocumentType[] = ['nic_front', 'nic_back', 'trade_certificate', 'business_registration'];
```
3. `document-slot.tsx`: delete its local `SLOT_TITLE` definition and add `export { SLOT_TITLE } from '@/components/document-titles';` (plus an `import { SLOT_TITLE } from '@/components/document-titles';` if the file uses it).
**Verify:** `pnpm verify` green (existing S26 tests still pass).
**Commit:** `git commit -m "refactor(web): conflict dialog title prop, shared document titles (M13-T20)"`

### T21 — Admin api.ts and query keys
- [ ] done
**Files:** `src/features/admin/api.ts`, `src/lib/query-keys.ts`
**Context:** ARCH §4.2; T7 entries.
**Do:**
1. `query-keys.ts`: add imports `AdminUserListQuery, ModerationQuery, VerificationQueueQuery` and:
```ts
  admin: {
    all: ['admin'] as const,
    overview: ['admin', 'overview'] as const,
    queue: (q: VerificationQueueQuery) => ['admin', 'queue', q] as const,
    verification: (id: string) => ['admin', 'verification', id] as const,
    users: (q: AdminUserListQuery) => ['admin', 'users', q] as const,
    user: (id: string) => ['admin', 'user', id] as const,
    reviews: (q: ModerationQuery) => ['admin', 'reviews', q] as const,
    document: (id: string) => ['admin', 'document', id] as const,
  },
```
2. Create `api.ts`:
```ts
import {
  ENDPOINTS as E,
  type AdminOverview, type AdminUserDetail, type AdminUserList, type AdminUserListQuery, type HideReviewBody,
  type ModerationList, type ModerationQuery, type ModerationRow, type ReactivateBody, type RejectBody,
  type SuspendBody, type VerificationDecisionResult, type VerificationDetail, type VerificationQueue,
  type VerificationQueueQuery,
} from '@fixit/contracts';
import { http, httpBlob, pathOf } from '@/lib/http';

export const fetchOverview = (): Promise<AdminOverview> =>
  http(pathOf(E.admin_overview), { schema: E.admin_overview.response });

export const fetchQueue = (q: VerificationQueueQuery): Promise<VerificationQueue> =>
  http(pathOf(E.admin_verifications_list), { query: { status: q.status, page: q.page }, schema: E.admin_verifications_list.response });
export const fetchVerification = (id: string): Promise<VerificationDetail> =>
  http(pathOf(E.admin_verification_get, { id }), { schema: E.admin_verification_get.response });
export const approveVerification = (id: string): Promise<VerificationDecisionResult> =>
  http(pathOf(E.admin_verification_approve, { id }), { method: 'POST', schema: E.admin_verification_approve.response });
export const rejectVerification = (id: string, body: RejectBody): Promise<VerificationDecisionResult> =>
  http(pathOf(E.admin_verification_reject, { id }), { method: 'POST', body, schema: E.admin_verification_reject.response });
export const fetchDocumentBlob = (id: string, signal?: AbortSignal): Promise<Blob> =>
  httpBlob(pathOf(E.files_document, { id }), signal);

export const fetchUsers = (q: AdminUserListQuery): Promise<AdminUserList> =>
  http(pathOf(E.admin_users_list), {
    query: { q: q.q === '' ? undefined : q.q, role: q.role, status: q.status, page: q.page },
    schema: E.admin_users_list.response,
  });
export const fetchUser = (id: string): Promise<AdminUserDetail> =>
  http(pathOf(E.admin_user_get, { id }), { schema: E.admin_user_get.response });
export const suspendUser = (id: string, body: SuspendBody): Promise<AdminUserDetail> =>
  http(pathOf(E.admin_user_suspend, { id }), { method: 'POST', body, schema: E.admin_user_suspend.response });
export const reactivateUser = (id: string, body: ReactivateBody): Promise<AdminUserDetail> =>
  http(pathOf(E.admin_user_reactivate, { id }), { method: 'POST', body, schema: E.admin_user_reactivate.response });

export const fetchModeration = (q: ModerationQuery): Promise<ModerationList> =>
  http(pathOf(E.admin_reviews_list), {
    query: { q: q.q === '' ? undefined : q.q, visibility: q.visibility, page: q.page },
    schema: E.admin_reviews_list.response,
  });
export const hideReview = (id: string, body: HideReviewBody): Promise<ModerationRow> =>
  http(pathOf(E.admin_review_hide, { id }), { method: 'POST', body, schema: E.admin_review_hide.response });
export const restoreReview = (id: string): Promise<ModerationRow> =>
  http(pathOf(E.admin_review_restore, { id }), { method: 'POST', schema: E.admin_review_restore.response });
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): admin api calls and query keys (M13-T21)"`

### T22 — Admin query hooks
- [ ] done
**Files:** `src/features/admin/hooks.ts`, `src/features/admin/hooks.test.tsx`
**Context:** SPEC §6.11 (S31 + badge 60 s / focus); D-17.
**Do:** create `hooks.ts` (T23 appends mutations):
```ts
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
  AdminUserListQuery, HideReviewBody, ModerationQuery, ReactivateBody, RejectBody, SuspendBody, VerificationQueueQuery,
} from '@fixit/contracts';
import { qk } from '@/lib/query-keys';
import {
  approveVerification, fetchDocumentBlob, fetchModeration, fetchOverview, fetchQueue, fetchUser, fetchUsers,
  fetchVerification, hideReview, reactivateUser, rejectVerification, restoreReview, suspendUser,
} from './api';

/** SPEC §6.11: the admin queue and the nav badge refetch on focus and every 60 s. */
const LIVE = { refetchInterval: 60_000, refetchOnWindowFocus: true } as const;

export const useAdminOverview = () => useQuery({ queryKey: qk.admin.overview, queryFn: fetchOverview, ...LIVE });
export const useVerificationQueue = (q: VerificationQueueQuery) =>
  useQuery({ queryKey: qk.admin.queue(q), queryFn: () => fetchQueue(q), placeholderData: keepPreviousData, ...LIVE });
export const useVerification = (id: string) =>
  useQuery({ queryKey: qk.admin.verification(id), queryFn: () => fetchVerification(id), retry: false });
export const useDocumentBlob = (id: string | null) =>
  useQuery({
    queryKey: qk.admin.document(id ?? ''),
    queryFn: ({ signal }) => fetchDocumentBlob(id ?? '', signal),
    enabled: id !== null,
    staleTime: Infinity,
  });
export const useAdminUsers = (q: AdminUserListQuery) =>
  useQuery({ queryKey: qk.admin.users(q), queryFn: () => fetchUsers(q), placeholderData: keepPreviousData });
export const useAdminUser = (id: string) =>
  useQuery({ queryKey: qk.admin.user(id), queryFn: () => fetchUser(id), retry: false });
export const useModeration = (q: ModerationQuery) =>
  useQuery({ queryKey: qk.admin.reviews(q), queryFn: () => fetchModeration(q), placeholderData: keepPreviousData });
```
(the mutation imports are used in T23; if lint fails on unused imports, add them in T23 instead.)
**Test:** `hooks.test.tsx` — render hooks with the existing test wrapper (see `features/provider-dashboard/hooks.test.tsx` for `renderHook` + QueryClient wrapper), `signInAs('admin')`:
- `useAdminOverview` resolves `attention.pendingVerifications === 1`.
- `useVerificationQueue({status:'pending_review', page:1})` → first item id `s-p02-1`.
- `useAdminUsers({q:'marcus', role:'all', status:'all', page:1})` contains `Marcus Bell`.
- `useAdminUser('u-admin')` ends in error with `ApiError` status 404.
**Verify:** `pnpm --filter @fixit/web test -- features/admin/hooks` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): admin query hooks (M13-T22)"`

### T23 — Admin mutation hooks
- [ ] done
**Files:** `src/features/admin/hooks.ts`, `src/features/admin/hooks.test.tsx`
**Context:** SPEC §6.5 (not optimistic); D-10 of M12 pattern (`['catalog']` holds S1/S2/S3); D-17.
**Do:** append to `hooks.ts`:
```ts
/** Every admin write: the admin domain (lists, badge) and the public catalog (badge, rating, listing) refetch. */
function afterAdminChange(qc: QueryClient, extra: readonly (readonly unknown[])[] = []): void {
  void qc.invalidateQueries({ queryKey: qk.admin.all });
  void qc.invalidateQueries({ queryKey: ['catalog'] });
  for (const key of extra) void qc.invalidateQueries({ queryKey: key });
}

/** A29. */
export function useApproveVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveVerification(id),
    onSuccess: (res) => {
      qc.setQueryData(qk.admin.verification(res.detail.id), res.detail);
      afterAdminChange(qc);
    },
  });
}
/** A30. */
export function useRejectVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RejectBody }) => rejectVerification(id, body),
    onSuccess: (res) => {
      qc.setQueryData(qk.admin.verification(res.detail.id), res.detail);
      afterAdminChange(qc);
    },
  });
}
/** A31 — the cascade changes requests too. */
export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SuspendBody }) => suspendUser(id, body),
    onSuccess: (v) => {
      qc.setQueryData(qk.admin.user(v.id), v);
      afterAdminChange(qc, [['requests']]);
    },
  });
}
/** A32. */
export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReactivateBody }) => reactivateUser(id, body),
    onSuccess: (v) => {
      qc.setQueryData(qk.admin.user(v.id), v);
      afterAdminChange(qc);
    },
  });
}
/** A33 hide. */
export function useHideReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: HideReviewBody }) => hideReview(id, body),
    onSuccess: () => { afterAdminChange(qc); },
  });
}
/** A33 restore. */
export function useRestoreReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreReview(id),
    onSuccess: () => { afterAdminChange(qc); },
  });
}
```
**Test:** append to `hooks.test.tsx`:
- `useApproveVerification().mutateAsync('s-p02-1')` resolves `{ nextId: null }`; afterwards the QueryClient's `qk.admin.verification('s-p02-1')` data has `status: 'approved'`.
- `useSuspendUser().mutateAsync({ id: 'u-hank', body: { reason: 'Repeated complaints from customers.' } })` → returned `status: 'suspended'`; a second call rejects with `ApiError` status 409.
- `useHideReview` on the first visible row from `fetchModeration({q:'', visibility:'visible', page:1})` resolves `visibility: 'hidden'`.
**Verify:** `pnpm --filter @fixit/web test -- features/admin/hooks` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): admin mutation hooks (M13-T23)"`

### T24 — Admin URL state
- [ ] done
**Files:** `src/features/admin/url-state.ts`, `src/features/admin/url-state.test.ts`
**Context:** SPEC S31 (tabs), S33 URL `?q=&role=&status=&page=`, S37 tabs; D-2, D-7.
**Do:** create:
```ts
import {
  AdminUserListQuery, ModerationQuery, VerificationQueueQuery,
  type AdminUserRoleFilter, type AdminUserStatusFilter, type ModerationVisibilityFilter, type SubmissionStatus,
} from '@fixit/contracts';

const href = (base: string, sp: URLSearchParams) => (sp.size > 0 ? `${base}?${sp.toString()}` : base);
const fromSp = (sp: URLSearchParams) => Object.fromEntries(sp);

export const parseQueueSearch = (sp: URLSearchParams) => VerificationQueueQuery.parse(fromSp(sp));
export function queueHref({ status = 'pending_review', page = 1 }: { status?: SubmissionStatus; page?: number }): string {
  const sp = new URLSearchParams();
  if (status !== 'pending_review') sp.set('status', status);
  if (page > 1) sp.set('page', String(page));
  return href('/admin/verifications', sp);
}

export const parseUsersSearch = (sp: URLSearchParams) => AdminUserListQuery.parse(fromSp(sp));
export function usersHref({
  q = '', role = 'all', status = 'all', page = 1,
}: { q?: string; role?: AdminUserRoleFilter; status?: AdminUserStatusFilter; page?: number }): string {
  const sp = new URLSearchParams();
  if (q.trim() !== '') sp.set('q', q.trim());
  if (role !== 'all') sp.set('role', role);
  if (status !== 'all') sp.set('status', status);
  if (page > 1) sp.set('page', String(page));
  return href('/admin/users', sp);
}

export type UsersTab = 'all' | 'customers' | 'providers' | 'suspended';
export const USERS_TABS: readonly { tab: UsersTab; label: string }[] = [
  { tab: 'all', label: 'All' },
  { tab: 'customers', label: 'Customers' },
  { tab: 'providers', label: 'Providers' },
  { tab: 'suspended', label: 'Suspended' },
];
export function usersTabOf(q: AdminUserListQuery): UsersTab {
  if (q.status === 'suspended') return 'suspended';
  if (q.role === 'customer') return 'customers';
  if (q.role === 'provider') return 'providers';
  return 'all';
}
/** Switching tab keeps the search and resets the page. */
export function usersTabHref(tab: UsersTab, q: string): string {
  if (tab === 'customers') return usersHref({ q, role: 'customer' });
  if (tab === 'providers') return usersHref({ q, role: 'provider' });
  if (tab === 'suspended') return usersHref({ q, status: 'suspended' });
  return usersHref({ q });
}

export const parseReviewsSearch = (sp: URLSearchParams) => ModerationQuery.parse(fromSp(sp));
export function reviewsHref({
  q = '', visibility = 'all', page = 1,
}: { q?: string; visibility?: ModerationVisibilityFilter; page?: number }): string {
  const sp = new URLSearchParams();
  if (q.trim() !== '') sp.set('q', q.trim());
  if (visibility !== 'all') sp.set('visibility', visibility);
  if (page > 1) sp.set('page', String(page));
  return href('/admin/reviews', sp);
}
```
If `URLSearchParams.size` is not available in the test environment's TS lib, use `sp.toString() !== ''`.
**Test:** `url-state.test.ts`:
```ts
describe('admin url state', () => {
  it('queue defaults are left out', () => {
    expect(queueHref({})).toBe('/admin/verifications');
    expect(queueHref({ status: 'approved', page: 2 })).toBe('/admin/verifications?status=approved&page=2');
  });
  it('users round-trip survives reload', () => {
    const url = usersHref({ q: ' marcus ', role: 'provider', page: 2 });
    expect(url).toBe('/admin/users?q=marcus&role=provider&page=2');
    expect(parseUsersSearch(new URLSearchParams(url.split('?')[1]))).toEqual({ q: 'marcus', role: 'provider', status: 'all', page: 2 });
  });
  it('tab mapping', () => {
    expect(usersTabHref('suspended', 'x')).toBe('/admin/users?q=x&status=suspended');
    expect(usersTabOf(parseUsersSearch(new URLSearchParams('role=customer')))).toBe('customers');
  });
  it('reviews', () => {
    expect(reviewsHref({ visibility: 'hidden' })).toBe('/admin/reviews?visibility=hidden');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- url-state` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): admin URL state helpers (M13-T24)"`

### T25 — Admin copy helpers
- [ ] done
**Files:** `src/features/admin/copy.ts`, `src/features/admin/copy.test.ts`
**Context:** SPEC S30.E1, S31, S34.E1; D-3, D-4, D-10.
**Do:** create:
```ts
import { colomboDaysSince, type SubmissionTrigger, type SuspendImpact } from '@fixit/contracts';

/** D-3 */
export const attemptLabel = (attempt: number): string => (attempt <= 1 ? 'First' : `Resubmission ${String(attempt - 1)}`);
export const triggerNote = (t: SubmissionTrigger): string | null =>
  t === 'business_name' ? 'Business name changed' : t === 'category' ? 'Category changed' : null;

/** S30.E1 sub (D-4). */
export function oldestSub(oldestPendingAt: string | null, now: Date): string {
  if (oldestPendingAt === null) return 'all caught up';
  const n = colomboDaysSince(new Date(oldestPendingAt), now);
  if (n === 0) return 'oldest today';
  if (n === 1) return 'oldest 1 day';
  return `oldest ${String(n)} days`;
}

/** S34.E1 effects list (D-10). */
export function suspendEffects(impact: SuspendImpact, isProvider: boolean): string[] {
  const lines = ["They won't be able to sign in."];
  if (isProvider) {
    lines.push('Their listing will be hidden from search and their profile link will stop working.');
    lines.push(
      `${String(impact.providerPending)} pending requests will be declined and ${String(impact.providerAccepted)} accepted requests cancelled. Customers are emailed.`,
    );
  }
  if (!isProvider || impact.customerOpen > 0)
    lines.push(`${String(impact.customerOpen)} of their open requests will be cancelled. Providers are emailed.`);
  lines.push('Their reviews stay visible unless you hide them.');
  return lines;
}

/** D-6 conflict copy. */
export const CONFLICT = {
  submission: { title: 'This submission has changed', body: 'Another admin has already decided it. The page now shows the latest status.' },
  account: { title: 'This account has changed', body: 'Its status changed while you were looking at it. The page now shows the latest status.' },
  review: { title: 'This review has changed', body: 'Its visibility changed while you were looking at it. The list now shows the latest status.' },
} as const;
```
**Test:** `copy.test.ts`: `attemptLabel(1)==='First'`, `attemptLabel(3)==='Resubmission 2'`; `oldestSub(null, now)==='all caught up'`, 3 days back → `'oldest 3 days'`; `suspendEffects({providerPending:1,providerAccepted:1,customerOpen:0}, true)` equals the 4-line array (sign in, listing, `1 pending requests will be declined and 1 accepted requests cancelled. Customers are emailed.`, reviews); `suspendEffects({0,0,2}, false)` has 3 lines incl. `2 of their open requests will be cancelled. Providers are emailed.`.
**Verify:** `pnpm --filter @fixit/web test -- features/admin/copy` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): admin copy helpers (M13-T25)"`

### T26 — L4 Verification badge
- [ ] done
**Files:** `src/app/layouts/nav-config.ts`, `src/app/layouts/nav-config.test.ts`, `src/app/layouts/admin-layout.tsx`
**Context:** SPEC L4 (badge = pending review count; phone top bar Verification icon with count); D-17.
**Do:**
1. `adminSidebarItems(f: Flags = defaultFeatures, pending = 0)`: the Verification item becomes
```ts
    {
      to: '/admin/verifications',
      label: 'Verification',
      icon: ShieldCheck,
      ...(pending > 0 ? { count: pending, countLabel: `${String(pending)} waiting for verification` } : {}),
    },
```
(remove the `// count wired in M13 (D-d)` comment).
2. `admin-layout.tsx`: call `const overview = useAdminOverview();` (from `@/features/admin/hooks`) **before** `if (!me) return null`; `const pending = overview.data?.attention.pendingVerifications ?? 0;`; `items={adminSidebarItems(features, pending)}` (import `features` from `@/lib/features`); `topBarAction={{ to: '/admin/verifications', label: 'Verification', icon: ShieldCheck, count: pending }}`.
**Test:** `nav-config.test.ts`: `adminSidebarItems(flagsAllOff, 3)` → Verification item `count: 3`, `countLabel: '3 waiting for verification'`; with `0` it has no `count` key. Keep existing tests passing (they call it with one or zero arguments).
**Verify:** `pnpm --filter @fixit/web test -- layouts` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): L4 verification badge from overview (M13-T26)"`

### T27 — Admin reason dialog
- [ ] done
**Files:** `src/features/admin/components/reason-dialog.tsx`
**Context:** SPEC §6.10, §6.7; S32/S34/S37 field tables; pattern `features/provider-dashboard/components/decline-dialog.tsx` (copy its structure).
**Do:** one reusable dialog for reject, suspend, reactivate and hide:
```tsx
interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;      // text or the S34 effects list
  schema: z.ZodType<{ reason: string }, { reason: string }>; // RejectBody | HideReviewBody | makeAccountReasonBody(name)
  label: string;                // 'Reason for rejection' | 'Reason'
  help?: string;                // S32: 'The provider sees this in the email and on their Verification page.'; S37: 'Only admins see this.'
  submitLabel: string;
  pendingLabel: string;
  tone: 'danger' | 'primary';   // SubmitButton variant
  pending: boolean;             // mutation.isPending
  /** Called with the parsed reason. `onApiError` maps a 400 to the field (mapApiErrorToForm) and returns true if it did. */
  onSubmit: (reason: string, onApiError: (e: unknown) => boolean) => void;
  failed: boolean;              // show FormErrorBanner FORM_COPY.saveFailed
  formId: string;
  lead?: ReactNode;             // rendered above the field (S34 effects list, see T35)
}
```
`onApiError` is `(e) => mapApiErrorToForm(e, form.setError) === null` (true = a field error was set, so the caller must not show the banner). Callers do: `onError: (e) => { if (is409(e)) { …conflict… } else if (!onApiError(e)) setFailed(true); }`.
Body: `react-hook-form` with `zodResolver(schema)`, `defaultValues: { reason: '' }`; `FormField` with `label`, `required`, `help`, `error`; `Textarea rows={4} className="text-body" maxLength={600}`; counter under the field `<p className="text-meta text-text-subtle text-right">{n} / 500</p>` where `n = watch('reason').length` (`aria-live="polite"`). Footer: `Button variant="secondary" className="w-full sm:w-auto"` `Cancel` (disabled while pending) then `SubmitButton form={formId} variant={tone} className="w-full sm:w-auto" pending pendingLabel`. `dismissible={!pending}`. Closing resets the form. Focus: the textarea gets focus on open (Radix default focuses the first focusable; pass `autoFocus` on the Textarea). Phone: `ResponsiveDialog` already renders a bottom sheet with stacked full-width buttons.
States: default · field error (SPEC message from the schema) · submitting (label `…ing`, Esc/overlay disabled) · server/network error banner (`failed`).
**Verify:** `pnpm verify` green (covered by page tests T31/T34/T37).
**Commit:** `git commit -m "feat(web): admin reason dialog (M13-T27)"`

### T28 — S30 Admin overview page
- [ ] done
**Files:** `src/features/admin/pages/overview-page.tsx`, `src/features/admin/pages/overview-page.test.tsx`
**Context:** SPEC S30 (E1–E2 only; F-36 off), S20.E1 date line, §6.1 stat-tile skeleton, §6.3 section error; AC1, AC8.
**Do:** `export function AdminOverviewPage()`:
- `const now = new Date(); const q = useAdminOverview();`
- Header: `<header className="flex flex-col gap-1.5"><p className="text-label text-text-subtle font-semibold">{formatDateLong(now)}</p><h1 className="text-title-xl text-text">Overview</h1></header>`.
- Section `<section aria-labelledby="attention" className="flex flex-col gap-3">` with `<h2 id="attention" className="text-title-md text-text">Needs attention</h2>`.
- Grid `grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4`. Each tile is a `Link` with classes `border-border bg-surface hover:shadow-hover focus-visible:ring-2 flex h-full flex-col gap-3.5 rounded-xl border p-4 sm:p-5` (same box as S20's `stat-tiles.tsx`): row 1 label `text-label text-text-muted font-semibold` + icon tile `grid size-9 place-items-center rounded-sm sm:size-10 sm:rounded-md` (tint classes); value `text-stat text-text font-extrabold`; sub `text-meta text-text-subtle`.
  - E1: label `Waiting for verification`, value `String(pendingVerifications)`, sub `oldestSub(oldestPendingAt, now)` (`all caught up` when 0), icon `ShieldCheck`, tint `bg-warning-soft text-warning-text`, `to="/admin/verifications"`.
  - E2: label `Suspended accounts`, value `String(suspendedUsers)`, sub `in total`, icon `Ban`, tint `bg-danger-soft text-danger-text`, `to="/admin/users?status=suspended"`.
- Loading: `LoadingRegion loading={q.isPending} skeleton={<>2× <SkeletonStatTile /></>}` inside the same grid.
- Error: replace the grid with `<SectionError onRetry={() => void q.refetch()} />`.
- No metrics section (`features.metrics` is false; do not render anything for it).
**Test:** `overview-page.test.tsx` (render with `renderRoute('/admin')` from `@/test/render` after `signInAs('admin')`, or the helper the other page tests use):
- shows `Overview` H1, `Waiting for verification` with `1`, link to `/admin/verifications`; `Suspended accounts` with `1` linking to `/admin/users?status=suspended`; no text `This month`.
- After approving `s-p02-1` through `fetch` (or `db()` mutation via `approveSubmission`), re-render → `0` and `all caught up`.
- With `armForcedError('admin_overview', '500')` (from `@/mocks/lib/controls`) → `We couldn't load this.` and `Try again`.
**Verify:** `pnpm --filter @fixit/web test -- overview-page` green (both admin and provider overview tests); `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S30 admin overview needs-attention tiles (M13-T28)"`

### T29 — S31 Verification queue page
- [ ] done
**Files:** `src/features/admin/pages/verification-queue-page.tsx`, `src/features/admin/pages/verification-queue-page.test.tsx`
**Context:** SPEC S31, §6.2 (S31 empty), §6.9; pattern `provider-dashboard/pages/requests-page.tsx`; D-2, D-3, D-4; AC2.
**Do:** `export function VerificationQueuePage()`:
- `const [sp] = useSearchParams(); const q = parseQueueSearch(sp); const list = useVerificationQueue(q); const now = new Date();`
- Header: H1 `Verification` (`text-title-xl text-text`), sub `Check providers' documents and approve or reject them.` (`text-body text-text-muted`).
- Card `section aria-label="Verification queue" className="border-border bg-surface overflow-hidden rounded-2xl border"`; top bar `border-border flex flex-col gap-3 border-b p-4 sm:px-6 sm:py-5` with `SegmentedTabLinks label="Filter by status"` items `Pending review` (`pending_review`) · `Approved` · `Rejected`, `to: queueHref({status})`, `active`. Track: `-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0`.
- Body `div className="p-4 sm:p-0"` → `DataList` with `caption="Verification queue"`, `rowHref={(r) => \`/admin/verifications/${r.id}\`}`, `rowLabel={(r) => r.provider.businessName}`, `loading={list.isPending}` and columns:
  1. `provider` header `Provider`, card `title`: `flex items-center gap-3` → photo `img size-9 rounded-full object-cover` when `photoUrl`, else `span className="bg-primary-soft text-primary grid size-9 place-items-center rounded-full"` with `<CategoryIcon icon={…} className="size-5" />`; then `div.min-w-0` → `p.text-body-sm font-bold text-text truncate` business, `p.text-meta text-text-subtle truncate` owner.
  2. `category` `Category` meta: `row.provider.category.name`.
  3. `submitted` `Submitted` meta: `<span>{formatDayMonth(r.submittedAt)}</span> <span className="text-meta text-text-subtle block">{formatDaysAgo(r.submittedAt, now)}</span>`.
  4. `attempt` `Attempt` meta: `attemptLabel(r.attempt)` + optional `triggerNote(r.trigger)` as `block text-meta text-text-subtle`.
  5. `action` `Action` actions: `<Button asChild variant="outline" size="sm"><Link to={…}>Review</Link></Button>`.
- Empty: Pending tab → `<EmptyState icon={CircleCheck} title="Nothing to review" body="New submissions show up here." />` (inside `p-4 sm:p-6`); other tabs → `<p className="text-body-sm text-text-subtle px-4 py-10 text-center">No submissions with this status.</p>`.
- Error: replace the card with `SectionError`.
- `Pagination page totalPages hrefFor={(p) => queueHref({ status: q.status, page: p })} className="p-4 sm:px-6"`.
- 390px: DataList renders cards (title row = provider; meta lines; full-width `Review` button 44 high). Page wrapper relies on the shell gutters; no fixed widths.
**Test:** `verification-queue-page.test.tsx`:
- Pending tab: a row with p02's business name (read it from `db().providers.p02.businessName`), `First`, a `Review` link to `/admin/verifications/s-p02-1`, and the submitted day text `formatDayMonth(…)` of the seeded submission.
- `?status=approved` lists p01's business; `?status=rejected` lists p10's.
- After approving s-p02-1 in the db, Pending shows `Nothing to review`.
- forced 500 on `admin_verifications_list` → `We couldn't load this.`.
**Verify:** `pnpm --filter @fixit/web test -- verification-queue-page` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S31 verification queue (M13-T29)"`

### T30 — Document tiles and full-screen viewer
- [ ] done
**Files:** `src/features/admin/components/document-tiles.tsx`, `src/features/admin/components/document-viewer.tsx`, `src/features/admin/components/document-viewer.test.tsx`
**Context:** SPEC S32.E1; D-15, D-19; `useDocumentBlob` (T22); `components/ui/dialog.tsx` primitives.
**Do:**
1. `DocumentTiles({ documents, onOpen }: { documents: DocumentMeta[]; onOpen: (d: DocumentMeta) => void })`: `section aria-labelledby="docs" className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6"`, H2 `Documents` (`text-title-sm`), grid `grid grid-cols-1 gap-3 sm:grid-cols-2`. For each `DOCUMENT_ORDER` type: if a document exists → `button type="button"` `border-border hover:border-primary focus-visible:ring-2 flex min-h-11 items-center gap-3 rounded-xl border p-4 text-left` with icon (`FileText` for `application/pdf`, else `FileImage`, `size-6 text-text-muted`), `SLOT_TITLE[type]` (`text-body-sm font-semibold text-text`), `fileName · formatFileSize(sizeBytes)` (`text-meta text-text-muted truncate`); `aria-label={\`Open ${SLOT_TITLE[type]}\`}`; `onClick={() => onOpen(doc)}`. Missing → `div` `border-border-strong flex min-h-11 items-center gap-3 rounded-xl border border-dashed p-4` with title + `Not provided` (`text-meta text-text-subtle`).
2. `DocumentViewer({ doc, onClose }: { doc: DocumentMeta | null; onClose: () => void })`:
   - `const blob = useDocumentBlob(doc?.id ?? null);` `const [url, setUrl] = useState<string|null>(null)`; `useEffect` creates `URL.createObjectURL(blob.data)` when data changes and revokes it in cleanup.
   - `const [zoom, setZoom] = useState<'fit' | 'actual'>('fit')`, reset to `fit` when `doc` changes.
   - `<Dialog open={doc !== null} onOpenChange={(o) => { if (!o) onClose(); }}>` + `<DialogContent showCloseButton={false} className="bg-surface left-0 top-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0">` (Esc closes — Radix default).
   - Toolbar `border-border flex items-center gap-2 border-b px-2 py-2 sm:px-4`: `DialogTitle className="text-title-sm text-text min-w-0 flex-1 truncate"` = `SLOT_TITLE[doc.type]`; for images a two-button group `Fit` / `100%` (`Button variant="secondary" size="sm"`, `aria-pressed`); `Button asChild variant="outline" size="sm"` → `<a href={url} target="_blank" rel="noopener noreferrer">Open in new tab</a>` (disabled look until `url`); close `Button variant="ghost" size="icon" aria-label="Close"` with `X`.
   - Body `div className="bg-page min-h-0 flex-1 overflow-auto touch-pinch-zoom"`:
     - loading → `LoadingRegion loading skeleton={<div className="bg-placeholder-a m-auto size-64 rounded-lg" />}`;
     - error → `<SectionError onRetry={() => void blob.refetch()} className="m-4" />`;
     - PDF → `<iframe src={url} title={SLOT_TITLE[doc.type]} className="size-full border-0" />`;
     - image fit → `div.flex.size-full.items-center.justify-center.p-4` + `<img src={url} alt={SLOT_TITLE[doc.type]} className="max-h-full max-w-full object-contain" />`; actual → `<img … className="max-w-none" />` (natural size, scroll both ways). Pinch zoom is the browser's native zoom (`touch-pinch-zoom`).
   - `DialogDescription className="sr-only"` = `fileName`.
**Test:** `document-viewer.test.tsx` (signed in as admin; stub `URL.createObjectURL = vi.fn(() => 'blob:x')`, `URL.revokeObjectURL = vi.fn()`): render with p02's `nic_front` DocumentMeta → dialog titled `NIC — front`, an `img` with alt `NIC — front` and `src="blob:x"`; `Open in new tab` link has `href="blob:x"`; pressing Escape calls `onClose`. Tiles: rendering `DocumentTiles` with only NIC front/back shows two `Not provided`.
**Verify:** `pnpm --filter @fixit/web test -- document-viewer` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S32 document tiles and full-screen viewer (M13-T30)"`

### T31 — S32 provider card, checklist and previous decisions
- [ ] done
**Files:** `src/features/admin/components/verification-aside.tsx`, `src/features/admin/components/previous-decisions.tsx`
**Context:** SPEC S32.E2–E4, BR-19.
**Do:**
1. `ProviderCard({ v }: { v: VerificationDetail })`: card `border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5`; H2 `Provider` (`text-title-sm`); `dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2"` rows (dt `text-meta text-text-subtle`, dd `text-body-sm text-text break-words`): `Account name` · `Owner on listing` · `Email` · `Mobile` (`formatPhone` or `—`) · `Category` · `Base town` · `Joined` (`formatReviewDate(joinedAt)`). Links row `flex flex-wrap gap-2`: `Button asChild variant="secondary" size="sm"` → `<Link to={\`/admin/users/${v.provider.userId}\`}>View user</Link>`; `<a href={\`/providers/${v.provider.id}\`} target="_blank" rel="noopener noreferrer">View listing</a>`.
2. `ApprovalChecklist({ accountName, ownerName })`: card; H3 `Before you approve` (`text-title-sm`); three `Checkbox` rows (shadcn `components/ui/checkbox`, local `useState`, not saved) with labels `Name on the NIC matches {accountName} or {ownerName}`, `Documents are clear and readable`, `Documents look unaltered`; each row `flex min-h-11 items-center gap-3`.
3. `PreviousDecisions({ items }: { items: PreviousDecision[] })`: returns `null` when empty (first submission). Card with H2 `Previous decisions`; `ul.divide-y.divide-border`; each `li.flex.flex-col.gap-1.py-3`: line 1 `formatReviewDate(decidedAt ?? submittedAt)` + `StatusPill kind="verification"` mapped from submission status (`approved`→`verified`, `rejected`→`rejected`, `pending_review`→`pending_review`, `compact`); line 2 `Reason: {rejectionReason}` when present (`text-body-sm text-text-muted`); line 3 `by {decidedByName}` when present (`text-meta text-text-subtle`).
**Verify:** `pnpm verify` green (rendered in T33's tests).
**Commit:** `git commit -m "feat(web): S32 provider card, checklist, previous decisions (M13-T31)"`

### T32 — S32 approve and reject dialogs
- [ ] done
**Files:** `src/features/admin/components/approve-dialog.tsx`, `src/features/admin/components/reject-dialog.tsx`
**Context:** SPEC S32.E5–E6, §8.5; D-6, D-16; `ReasonDialog` (T27); `useApproveVerification`, `useRejectVerification`.
**Do:**
1. `ApproveDialog({ v, open, onOpenChange, onDone, onConflict })` where `onDone(nextId: string | null)` and `onConflict()`:
   - `ResponsiveDialog align="center" title={\`Approve ${v.provider.businessName}?\`} description="They'll get the Verified badge and an email." icon={<span className="bg-success-soft text-success grid size-14 place-items-center rounded-xl"><BadgeCheck className="size-7" /></span>}` `dismissible={!approve.isPending}`.
   - Footer: `Cancel` (secondary) · `SubmitButton variant="primary" pending pendingLabel="Approving…"` `Approve`, onClick → `approve.mutate(v.id, { onSuccess: (res) => { onOpenChange(false); notify(\`${v.provider.businessName} is verified.\`); onDone(res.nextId); }, onError: (e) => { if (e instanceof ApiError && e.status === 409) { onOpenChange(false); onConflict(); return; } setFailed(true); } })`.
   - `failed` → `FormErrorBanner` `FORM_COPY.saveFailed` above the footer.
2. `RejectDialog({ v, open, onOpenChange, onDone, onConflict })`: `ReasonDialog` with `title={\`Reject ${v.provider.businessName}'s documents?\`}`, `schema={RejectBody}`, `label="Reason for rejection"`, `help="The provider sees this in the email and on their Verification page."`, `submitLabel="Reject"`, `pendingLabel="Rejecting…"`, `tone="danger"`, `formId={\`reject-${v.id}\`}`; submit → `reject.mutate({ id: v.id, body: { reason } }, …)` with the same success (toast `Rejected. ${business} has been emailed.`) and 409 handling; any other error goes through `onApiError(e)` and, when it returns false, `setFailed(true)` (T27 contract; T35 and T38 do the same).
**Verify:** `pnpm verify` green (tested in T33).
**Commit:** `git commit -m "feat(web): S32 approve and reject dialogs (M13-T32)"`

### T33 — S32 Verification review page
- [ ] done
**Files:** `src/features/admin/pages/verification-review-page.tsx`, `src/features/admin/pages/verification-review-page.test.tsx`
**Context:** SPEC S32 layout (desktop grid, phone sticky bar), §6.1 section skeleton, §6.4; AC3, AC7, AC8.
**Do:** `export function VerificationReviewPage()`:
- `const { id = '' } = useParams(); const q = useVerification(id); const navigate = useNavigate(); const qc = useQueryClient();` state: `viewing: DocumentMeta | null`, `dialog: 'approve' | 'reject' | null`, `conflict: boolean`.
- 404 → `<NotFoundPage area="admin" />` (pattern `provider-dashboard/pages/request-page.tsx` lines 43–44). Other error → `SectionError`.
- Loading → `BackLink` + `SkeletonSectionCard lines={3}` ×2 in the same grid.
- Layout:
  1. `<BackLink to="/admin/verifications">Back to queue</BackLink>`.
  2. Header `flex flex-col gap-2`: H1 `text-title-xl text-text break-words` = business name; row `flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-text-muted`: status pill (`StatusPill kind="verification"` mapped as in T31), `Submitted {formatDateLong(submittedAt)}`, and `attemptLabel(attempt)` when `attempt > 1` (plus `triggerNote`).
  3. Grid `grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6`. Main `flex min-w-0 flex-col gap-5`: `DocumentTiles` + `PreviousDecisions`. Aside `flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start`: `ProviderCard`, `ApprovalChecklist`, and (only `status === 'pending_review'`) an actions card visible from `sm` up: `div className="border-border bg-surface hidden flex-col gap-3 rounded-2xl border p-5 sm:flex"` with `Button variant="primary" size="lg" className="w-full"` `[BadgeCheck] Approve` and `Button variant="danger-outline" size="lg" className="w-full"` `Reject`.
  4. Phone sticky bar (only pending): `div className="border-border bg-surface fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden"` with `Reject` (danger-outline, `flex-1 h-12`) then `Approve` (primary, `flex-1 h-12`); add `pb-24 sm:pb-0` to the page wrapper so content isn't hidden behind it.
- `DocumentViewer doc={viewing} onClose={() => setViewing(null)}`.
- `onDone(nextId)`: `void navigate(nextId ? \`/admin/verifications/${nextId}\` : '/admin/verifications')`.
- `onConflict()`: `setConflict(true); void qc.invalidateQueries({ queryKey: qk.admin.verification(id) });` → `<ConflictDialog open={conflict} onOpenChange={setConflict} title={CONFLICT.submission.title} body={CONFLICT.submission.body} />`. After refetch the status pill shows the new status and the actions disappear.
**Test:** `verification-review-page.test.tsx` (`signInAs('admin')`, route `/admin/verifications/s-p02-1`, toast mocked):
- shows H1 with p02's business, 2 document tiles (`Open NIC — front`, `Open NIC — back`), 2 × `Not provided`, provider card email, checklist text `Before you approve`, no `Previous decisions`.
- Approve → dialog `Approve {business}?` → click `Approve` → `notify` called with `{business} is verified.` → location is `/admin/verifications` (no next) and `Nothing to review` is shown.
- Reject with `blurr` → `Give a reason so the provider knows what to fix.`; with `The NIC photo is cut off on the left.` → `notify('Rejected. {business} has been emailed.')`.
- Forced `409` on `admin_verification_approve` (`armForcedError`) → after clicking Approve, `This submission has changed` dialog.
- `/admin/verifications/s-nope` → S39 text (whatever `NotFoundPage area="admin"` renders, e.g. its H1).
**Verify:** `pnpm --filter @fixit/web test -- verification-review-page` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S32 verification review page (M13-T33)"`

### T34 — S33 Users page
- [ ] done
**Files:** `src/features/admin/components/role-pills.tsx`, `src/features/admin/pages/users-page.tsx`, `src/features/admin/pages/users-page.test.tsx`
**Context:** SPEC S33, §6.2 search-no-match, §6.9, §2.2 (role pill styles); D-7; AC4.
**Do:**
1. `RolePills({ roles, compact })`: `Customer` pill `bg-surface-muted text-text-muted` and, if `roles.includes('provider')`, `Provider` pill `bg-primary-soft text-primary`; pill classes as `StatusPill` (`inline-flex h-7 items-center rounded-full px-3 text-meta font-bold`, compact `h-6 px-2.5 text-caption`).
2. `UsersPage()`: `const [sp] = useSearchParams(); const q = parseUsersSearch(sp); const list = useAdminUsers(q);` local `text` state synced from `q.q` (copy S21's `useEffect`).
   - H1 `Users` (`text-title-xl`).
   - Card `section aria-label="Users"` as S31. Top bar `flex flex-col gap-3 border-b p-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between`: `SegmentedTabLinks` from `USERS_TABS` (`to: usersTabHref(tab, q.q)`, `active: usersTabOf(q) === tab`); search `form role="search" className="relative w-full lg:w-[320px]"` with `Search` icon and `Input type="search" aria-label="Search users" placeholder="Search name, email, mobile or business" className="text-body h-11 pl-10 sm:h-10"`; submit navigates to `usersHref({ q: text, role: q.role, status: q.status })`.
   - `DataList` `caption="Users"`, `rowHref={(u) => \`/admin/users/${u.id}\`}`, `rowLabel={(u) => u.fullName}`, columns: `name` (title: initials avatar `bg-primary-soft text-primary grid size-9 place-items-center rounded-full font-extrabold text-meta` + name `font-bold` + email `text-meta text-text-subtle truncate`), `roles` `Roles` meta (`RolePills compact`), `verification` `Verification` meta (`StatusPill kind="verification" compact` or `—`), `joined` `Joined` meta (`<span className="sm:hidden">Joined </span>{formatReviewDate(joinedAt)}`), `status` `Status` status (`StatusPill kind="account" compact`), `action` actions (`Button asChild variant="outline" size="sm"` → `View`).
   - Empty with `q.q !== ''`: `EmptyState icon={SearchX} title={\`No users match "${q.q}"\`} body="Check the spelling or try an email address." action={{ label: 'Clear search', to: usersHref({ role: q.role, status: q.status }) }}`. Empty without q: `No users with this status.` line.
   - Error → `SectionError`. Pagination `hrefFor={(p) => usersHref({ ...q, page: p })}`.
**Test:** `users-page.test.tsx`:
- `/admin/users?q=marcus` → row link `Marcus Bell`; input value `marcus` (survives reload = URL parse).
- `/admin/users?q=zzzz` → `No users match "zzzz"`; `Clear search` link href `/admin/users`.
- `/admin/users?status=suspended` → `Ruwan Jayasekara` with `Suspended`; the `Suspended` tab has `aria-current` (or the active marker `SegmentedTabLinks` uses).
- Typing `dana` + Enter → URL `?q=dana`.
**Verify:** `pnpm --filter @fixit/web test -- users-page` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S33 users list (M13-T34)"`

### T35 — S34 suspend and reactivate dialogs
- [ ] done
**Files:** `src/features/admin/components/suspend-dialog.tsx`, `src/features/admin/components/reactivate-dialog.tsx`
**Context:** SPEC S34.E1–E2; D-10, D-11, D-16; `ReasonDialog`.
**Do:**
1. `SuspendDialog({ user, open, onOpenChange, onConflict })`: `ReasonDialog` with `title={\`Suspend ${user.fullName}?\`}`, `description` = `<ul className="flex flex-col gap-2">` of `suspendEffects(user.impact, user.provider !== null)` lines, each `li.flex.items-start.gap-2.text-body-sm.text-text` with `<CircleAlert aria-hidden className="text-warning-text mt-0.5 size-4 shrink-0" />`; `schema={makeAccountReasonBody(user.fullName)}`, `label="Reason"`, `submitLabel="Suspend account"`, `pendingLabel="Suspending…"`, `tone="danger"`. Success → toast `${user.fullName} is suspended.`; 409 → close + `onConflict()`; 422 `cannot_suspend_admin` can't happen from the UI (admins 404) — treat as failure banner.
   Note: `ResponsiveDialog` wraps `description` in `DialogDescription` (a `<p>`), and a `<ul>` inside a `<p>` is invalid HTML. So pass the list through `ReasonDialog`'s `lead` prop (T27) and leave `description` undefined.
2. `ReactivateDialog({ user, … })`: `title={\`Reactivate ${user.fullName}?\`}`, `description="They can sign in again and their listing comes back. Cancelled or declined requests stay closed, and verification doesn't change."`, same schema/label, `submitLabel="Reactivate"`, `pendingLabel="Reactivating…"`, `tone="primary"`, toast `${user.fullName} is active again.`.
**Verify:** `pnpm verify` green (tested in T37).
**Commit:** `git commit -m "feat(web): S34 suspend and reactivate dialogs (M13-T35)"`

### T36 — S34 header and section cards
- [ ] done
**Files:** `src/features/admin/components/user-header-card.tsx`, `src/features/admin/components/user-sections.tsx`
**Context:** SPEC S34 layout; §6.9; D-8, D-16.
**Do:**
1. `UserHeaderCard({ user, onSuspend, onReactivate })`: card `border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6`. Left `flex min-w-0 gap-4`: avatar `bg-primary-soft text-primary grid size-14 shrink-0 place-items-center rounded-full text-title-sm font-extrabold` (`initialsOf`), then `div.min-w-0.flex.flex-col.gap-1`: name `h1.text-title-lg.text-text.break-words`, email `text-body-sm text-text-muted break-all`, mobile `formatPhone` (omit when null), `Joined {formatReviewDate(joinedAt)}` (`text-meta text-text-subtle`), pills row `flex flex-wrap gap-2` (`RolePills` + `StatusPill kind="account"`). Right: active → `Button variant="danger-outline" size="md" className="w-full sm:w-auto"` `[Ban] Suspend account`; suspended → `Button variant="primary" size="md" className="w-full sm:w-auto"` `[RotateCcw] Reactivate account`. On phone the card is `flex-col`, so the button sits full width under the header (AC7).
2. `ProviderListingCard({ p })` (render only when `user.provider`): H2 `Provider listing`; rows: business (`text-body-sm font-bold`), category, verification pill + (when `latestSubmissionId`) `Link to={\`/admin/verifications/${id}\`}` `View submission`, rating `formatRating(rating, reviewCount)` with `Stars` (or `New`), `StatusPill kind="availability"`-style `Paused` pill **only if** `p.paused` (label `Paused`: use `muted` pill classes `bg-warning-soft text-warning-text` inline span), `View listing` external link `/providers/{id}` (`target="_blank"`).
3. `RequestsCard({ title, summary })`: H2 = `Requests as customer` / `Requests as provider`; sub `{open} open · {total} total` (`text-meta text-text-subtle`); `ul.divide-y.divide-border` rows `li.flex.flex-col.gap-1.py-3.sm:flex-row.sm:items-center.sm:gap-4`: `span.text-mono.text-text-muted` ref · `span.text-body-sm.text-text.min-w-0.flex-1.truncate` `{customerName} · {businessName} · {serviceName}` · `span.text-meta.text-text-muted` `{formatDateShort(preferredDate)} · {SLOT_LABEL[slot]} · {townName}` · `StatusPill kind="request" compact`. Empty → `No requests yet.` (`text-body-sm text-text-subtle py-6 text-center`).
4. `AccountHistoryCard({ items })`: H2 `Account history`; rows: label `Suspended` (action `user_suspend`) / `Reactivated` (`user_reactivate`) `font-semibold`, `formatDateTime(at)`, `Reason: {reason}`, `by {adminName}`; empty → `No account changes yet.`.
All cards: `border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 sm:p-6`.
**Verify:** `pnpm verify` green (tested in T37).
**Commit:** `git commit -m "feat(web): S34 header and section cards (M13-T36)"`

### T37 — S34 User detail page
- [ ] done
**Files:** `src/features/admin/pages/user-detail-page.tsx`, `src/features/admin/pages/user-detail-page.test.tsx`
**Context:** SPEC S34; AC5, AC7, AC8.
**Do:** `export function UserDetailPage()`: `const { id = '' } = useParams(); const q = useAdminUser(id);` state `dialog: 'suspend' | 'reactivate' | null`, `conflict`.
- 404 → `<NotFoundPage area="admin" />`; other error → `SectionError`; loading → `BackLink` + `SkeletonSectionCard` ×3.
- Layout `flex flex-col gap-5 max-w-[960px]`: `<BackLink to="/admin/users">Back to users</BackLink>`, `UserHeaderCard`, `ProviderListingCard` (if provider), `RequestsCard` customer, `RequestsCard` provider (if `asProvider`), `AccountHistoryCard`.
- Dialogs `SuspendDialog` / `ReactivateDialog`; `onConflict` → invalidate `qk.admin.user(id)` + `ConflictDialog` with `CONFLICT.account`.
**Test:** `user-detail-page.test.tsx` (`signInAs('admin')`, toast mocked):
- `/admin/users/u-hank`: name `Hank Morales`, `Provider listing`, `Suspend account`. Click → dialog lists `1 pending requests will be declined and 1 accepted requests cancelled. Customers are emailed.`; submit empty → `Give a reason. It's included in the email to Hank Morales.`; type `Repeated complaints from customers.` → `notify('Hank Morales is suspended.')`; header shows `Suspended` and `Reactivate account`; history shows `Suspended` and `Reason: Repeated complaints from customers.`.
- Then the mock db: FX-2042 `declined` with reason `Provider unavailable` (assert via `db()`).
- Reactivate with a reason → `notify('Hank Morales is active again.')`, status `Active`.
- `/admin/users/u-admin` → S39.
**Verify:** `pnpm --filter @fixit/web test -- user-detail-page` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S34 user detail with suspend/reactivate (M13-T37)"`

### T38 — S37 moderation row and dialogs
- [ ] done
**Files:** `src/features/admin/components/moderation-row.tsx`, `src/features/admin/components/hide-review-dialog.tsx`, `src/features/admin/components/restore-review-dialog.tsx`
**Context:** SPEC S37.E1–E3, S3.E11 review body, S3.E12 reply block; D-6, D-16.
**Do:**
1. `ModerationRowItem({ row, onHide, onRestore })`: `li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-6"`.
   - Left `flex min-w-0 flex-1 flex-col gap-2`: header line `flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-text-muted` → `<Link to={\`/providers/${row.provider.id}\`} className="text-primary font-semibold">{businessName}</Link>` · `<span className="text-mono">{requestRef}</span>` · `formatReviewDate(createdAt)`; body: author `text-body-sm font-bold text-text`, `<Stars rating={row.rating} showValue={false} />`, text `text-body-sm text-text whitespace-pre-line break-words`; reply (if any): `div className="border-primary-soft bg-page rounded-lg border-l-[3px] px-3.5 py-3"` → `p.text-meta.font-bold.text-text` `Response from {businessName}` + `p.text-body-sm.text-text-muted`; hidden meta (if `row.hidden`): `p.text-meta.text-text-subtle` `Hidden {formatReviewDate(at)} by {by} · Reason: {reason}`.
   - Right `flex flex-col gap-2 sm:items-end`: `StatusPill kind="review" visibility={row.visibility}`; visible → `Button variant="danger-outline" size="sm" className="w-full sm:w-auto"` `[EyeOff] Hide`; hidden → `Button variant="outline" size="sm" className="w-full sm:w-auto"` `[RotateCcw] Restore`. On phone this block follows the body (flex-col), full width (AC7).
2. `HideReviewDialog({ row, open, onOpenChange, onConflict })`: `ReasonDialog` `title="Hide this review?"`, `description={\`It disappears from ${business}'s profile and stops counting toward their rating. Its reply is hidden too.\`}`, `schema={HideReviewBody}`, `label="Reason"`, `help="Only admins see this."`, `submitLabel="Hide review"`, `pendingLabel="Hiding…"`, `tone="danger"`; success toast `Review hidden. ${business}'s rating is updated.`.
3. `RestoreReviewDialog({ row, … })`: `ResponsiveDialog align="center" title="Restore this review?" description={\`It shows on ${business}'s profile and counts toward their rating again.\`}`; footer `Cancel` · `SubmitButton variant="primary" pendingLabel="Restoring…"` `Restore`; success toast `Review restored.`; 409 → `onConflict()`; other failure → `FormErrorBanner`.
**Verify:** `pnpm verify` green (tested in T39).
**Commit:** `git commit -m "feat(web): S37 moderation row, hide and restore dialogs (M13-T38)"`

### T39 — S37 Reviews moderation page
- [ ] done
**Files:** `src/features/admin/pages/reviews-moderation-page.tsx`, `src/features/admin/pages/reviews-moderation-page.test.tsx`
**Context:** SPEC S37, §6.1 review-row skeleton, §6.2; AC6, AC8.
**Do:** `ReviewsModerationPage()`: `const q = parseReviewsSearch(sp); const list = useModeration(q);` state `hiding: ModerationRow | null`, `restoring: ModerationRow | null`, `conflict`.
- H1 `Reviews`. Card `section aria-label="Reviews"`: top bar like S33 with tabs `All` · `Visible` · `Hidden` (`reviewsHref({ q: q.q, visibility })`) and search (`aria-label="Search reviews"`, placeholder `Search provider, author or text`, `lg:w-[320px]`).
- List `ul className="divide-border divide-y"` of `ModerationRowItem`.
- Loading → `LoadingRegion` with 3 × `SkeletonReviewRow` (`p-4 sm:p-6`). Error → `SectionError`.
- Empty with q → `EmptyState icon={SearchX} title={\`No reviews match "${q.q}"\`} body="Check the spelling or try something else." action={{ label: 'Clear search', to: reviewsHref({ visibility: q.visibility }) }}`; without q → `No reviews with this status.`.
- Pagination `hrefFor={(p) => reviewsHref({ ...q, page: p })}`.
- Conflict → `ConflictDialog` with `CONFLICT.review`, invalidate `qk.admin.all`.
**Test:** `reviews-moderation-page.test.tsx`:
- `/admin/reviews?visibility=hidden` → row for `FX-2028` with `Hidden … by Fixit Admin · Reason: Personal remarks about the provider that break the review rules.` and a `Restore` button.
- `/admin/reviews?q=` + p01 business word → `Hide` → reason `Contains a phone number.` → `notify` with `Review hidden. {p01 business}'s rating is updated.`; `db().providers.p01.reviewCount` decreased by 1.
- Restore FX-2028 → `notify('Review restored.')`.
- `?q=zzzz` → `No reviews match "zzzz"`.
**Verify:** `pnpm --filter @fixit/web test -- reviews-moderation-page` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S37 reviews moderation page (M13-T39)"`

### T40 — Wire admin pages and access tests
- [ ] done
**Files:** `src/app/chunks/admin.tsx`, `src/app/routes.test.tsx`
**Context:** ARCH §5.1; SPEC L4 access, §6.4; AC9.
**Do:**
1. `chunks/admin.tsx`: replace the placeholders for `AdminOverviewPage`, `VerificationQueuePage`, `VerificationReviewPage`, `UsersPage`, `UserDetailPage`, `ReviewsModerationPage` with re-exports from `@/features/admin/pages/*` (e.g. `export { AdminOverviewPage } from '@/features/admin/pages/overview-page';`). Keep the placeholder `AdminRequestsPage`, `AdminRequestPage`, `CatalogPage` (flags off).
2. `routes.test.tsx`: add cases — Marcus (`provider`) on `/admin/users` → S40 (same assertion as the existing Olivia case); guest on `/admin/verifications/s-p02-1` → redirected to `/admin/login?next=%2Fadmin%2Fverifications%2Fs-p02-1`; admin on `/admin/reviews` → H1 `Reviews`.
**Verify:** `pnpm --filter @fixit/web test -- routes` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): wire admin console pages (M13-T40)"`

### T41 — M13 acceptance checks
- [ ] done
**Files:** this plan (ticks), `docs/milestones/M00-index.md` (only if the index tracks milestone status — follow the M12 acceptance commit)
**Context:** milestone acceptance criteria 1–10; frontend-complete gate note.
**Do:** run `pnpm verify`, then `pnpm dev:mock` and walk each criterion. Record pass/fail per item in the commit body. Any failure: fix only if it is a defect in this milestone's tasks (new commit `fix(web): … (M13-T41)` with a failing test first); otherwise write a Blocker.
1. **AC1** 1440, Admin → `/admin`: date line, `Overview`, two tiles with `1` / `oldest {n} day(s)` and `1` / `in total`; clicks go to `/admin/verifications` and `/admin/users?status=suspended`; no metrics. Test: `overview-page.test.tsx`.
2. **AC2** `/admin/verifications`: p02 row (`First`, `{d MMM}` + days-ago, `Review`); Approved and Rejected tabs list p01 / p10; after approving, `Nothing to review`. Test: `verification-queue-page.test.tsx`.
3. **AC3** `/admin/verifications/s-p02-1`: 4 tiles (2 `Not provided`); click NIC front → full-screen viewer, `Fit`/`100%`, `Open in new tab`, Esc closes; provider card; checklist ticks local (reload clears them). Approve → `Approve {Business}?` → toast → queue empty state; open `/providers/p02` → Verified badge. DevPanel **Reset demo data**, then Reject with `blurr` → error copy; valid reason → toast; sign in as the p02 owner → `/dashboard/verification` shows the reason. Tests: `verification-review-page.test.tsx`, `admin-verification.test.ts`.
4. **AC4** `/admin/users`: search `marcus`; tabs; `No users match "zzzz"` + `Clear search`; reload keeps `?q=&role=&status=&page=`. Test: `users-page.test.tsx`, `url-state.test.ts`.
5. **AC5** `/admin/users/u-hank`: suspend dialog effects (`1 pending … 1 accepted …`), reason 10–500, toast, pill `Suspended`, history entry; `/discover` has no HandyHank; `/providers/p08` shows the not-found page; sign in as `james.carter@fixit.test` / `demo1234` → `/requests/FX-2042` shows `Reason: Provider unavailable`; DevPanel "Provider, not submitted (Hank Morales)" → suspended banner (T18). Reactivate → toast, listing back, FX-2042 still Declined, verification `Not submitted`. `/admin/users/u-admin` → 404 page. Tests: `user-detail-page.test.tsx`, `admin-suspension.test.ts`, `handlers/admin.test.ts`.
6. **AC6** `/admin/reviews`: search, tabs; Hide with reason → toast, `/providers/{id}` review count −1; hidden row metadata; Restore → toast, count back. Tests: `reviews-moderation-page.test.tsx`, `admin-reviews.test.ts`.
7. **AC7** 390px: S31/S33 cards; S32 sticky `Reject` / `Approve` bar; S34 full-width action under the header; S37 actions under the body; every dialog a bottom sheet; top bar Verification icon with count `1`; DevTools `document.documentElement.scrollWidth <= innerWidth` on each page. 800px: sidebar is a drawer. Manual.
8. **AC8** DevPanel latency `slow` → skeletons on every admin page; forced `500` per list endpoint → section error + `Try again`; forced `409` on `admin_verification_approve` → `This submission has changed`, item refreshes. Tests: page tests with `armForcedError`.
9. **AC9** Olivia and Marcus on `/admin*` → S40; guest → `/admin/login?next=…`. Test: `routes.test.tsx`.
10. **AC10** `pnpm --filter @fixit/web test -- admin-suspension admin-reviews` and `pnpm --filter @fixit/contracts test -- suspension` green.
11. **Frontend-complete gate** (milestone note): with `pnpm dev:mock`, open every Must screen (S1–S16, S18–S26, S29–S34, S37, S39–S41) at 390 and 1440 and confirm it renders without horizontal scroll. List any screen that fails in the commit body and in the Ideas inbox / Blockers as appropriate.
**Verify:** `pnpm verify` green; every checkbox in this plan ticked.
**Commit:** `git commit -m "chore: M13 acceptance checks (M13-T41)"`

## Checkpoints
- After T17: "Human: `pnpm dev:mock`, sign in as Admin in the DevPanel, open `/api/admin/overview` via the app's network tab (or run the handler tests) — no UI yet; check the DevPanel still works."
- After T29: "Human: `pnpm dev:mock`, Admin → `/admin` and `/admin/verifications` at 1440 and 390; badge shows 1 in the sidebar and phone top bar."
- After T33: "Human: open `/admin/verifications/s-p02-1` at 1440 and 390: viewer full screen, sticky bar on phone, approve → back to the empty queue; Reset demo data afterwards."
- After T37: "Human: suspend Hank at 390 (bottom sheet with effects), then check `/discover` and James Carter's `/requests/FX-2042`."
- After T39: "Human: hide a Bell & Sons review and compare the rating on `/providers/p01` before/after."

## Blockers
(executor writes here; leave empty)

## Nice-to-haves (not tasks)
- Thumbnails on S32 document tiles (needs one blob fetch per tile).
- Singular/plural forms in the S34 effects copy (`1 pending request`) — needs a SPEC copy change.
- Keyboard shortcuts on S32 (A = approve, R = reject) for working the queue.
- Persisting S32 checklist ticks per submission for the session.
