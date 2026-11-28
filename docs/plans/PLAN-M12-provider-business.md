# PLAN-M12 — Provider business: services, profile, areas
Milestone: `docs/milestones/M12-provider-business.md` · Start tag: `m12-start` · Verify-all: `pnpm verify`
Mock domains at start → end: all → all (`providers` gains 5 endpoints). **No backend in this milestone** (`apps/api` does not exist yet), so there are no Nest tasks and no authorization-matrix rows. The mocks apply roles through `mockEndpoint` (`access: ['provider']`), ownership through "my listing / my service" lookups (miss → 404), BR-21 through the pure contracts function `reverificationFor`, and BR-10 through `computeStartingPrice`, as the API will in M17.

Conventions for the executor (same as M11):
- T1 creates tag `m12-start` and branch `m12-provider-business` from the current HEAD. One commit per task, using the message given, ending with the attribution lines from your session instructions.
- Run `pnpm format` before `pnpm verify` in every task. Code below may not be Prettier-exact.
- Code blocks are complete files unless the step says "add", "replace" or "edit". Tests import `describe/expect/it/vi` from `vitest` explicitly.
- Paths are under `apps/web/` unless they start with `packages/`, `docs/` or `/`. `@/` = `apps/web/src/`.
- Tailwind: only `sm` (≥641) and `lg` (≥1024) prefixes (no `max-sm:`). Arbitrary **size/grid** values are allowed (`max-w-[720px]`). Arbitrary colour values and lint-banned prefixes (`text-[`, `bg-[`, `border-[`, `shadow-[`, `ring-[`, `outline-[`) are not. Token classes used in this plan: `bg-surface bg-page bg-primary-soft text-text text-text-muted text-text-subtle text-primary text-danger-text border-border`, type scale `text-title-lg text-title-md text-body text-body-sm text-label text-meta`, radii `rounded-lg rounded-xl rounded-2xl`.
- Copy in backticks is SPEC copy, character for character.
- Time in tests: every new test that calls handlers or renders a page uses `vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] })` in `beforeEach` and `vi.useRealTimers()` in `afterEach`. `src/test/setup.ts` already resets the mock db to the fixtures before each test.
- `exactOptionalPropertyTypes` is on: build optional keys with `...(x === undefined ? {} : { key: x })`.
- Toasts in page tests: mock `@/lib/toast` (`vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }))`) and assert `notify` was called with the exact message.
- Page tests that open dialogs set `Element.prototype.scrollIntoView = vi.fn()` in `beforeEach` (Radix + FormErrorBanner).
- Use `qc.query(...)` not `qc.fetchQuery`; `SyntheticEvent`, not `FormEvent`.
- If a library API differs from what the code assumes (React Router 7, TanStack Query 5, zod 4, react-hook-form 7, MSW 2, Radix Popover, lucide-react names), **STOP** and write a blocker.

Planner's decisions the executor must follow:
- **D-1 Business body.** `PATCH /me/provider/business` takes the whole S24 details card: `UpdateBusinessBody {businessName, bio, yearsExperience, categoryId}`, all required (the form always sends all four). Response `UpdateBusinessResult {provider: OwnProvider, reverification: ReverificationReason | null}`; `reverification` is the reason that was applied by this save, else null.
- **D-2 BR-21 rule.** `reverificationFor({status, before, after})` (contracts, pure): null unless `status = verified` (decision 006); else `'business_name'` if the trimmed name differs (case-sensitive), else `'category'` if the category id differs, else null. When both change, `business_name` wins (banner #3 names one field).
- **D-3 Re-queue (mock).** When the rule applies: from `verified` the mock creates submission attempt n+1 with `trigger = reason`, status `pending_review`, and copies of the documents of the latest **approved** submission (new ids, same file bytes; ARCH §8.1, SPEC §10.2 #16). No approved submission → the new attempt has no documents. It sets `verificationStatus = 'pending_review'`, `verifiedAt = null`, `reverificationReason = reason`. From `pending_review`, `not_submitted` or `rejected` nothing changes beyond the saved fields (AC8, decision 006).
- **D-4 Marcus fixture.** Marcus (p01) is verified but has no submission, so D-3 would re-queue nothing. T3 adds approved attempt `s-p01-1` with NIC front/back documents. `MOCK_DB_VERSION` 6 → 7.
- **D-5 Service errors (mock = future API).** Duplicate name (case-insensitive, trimmed, excluding the edited service) → `409 CONFLICT details.rule = 'service_name_taken'` (same shape as `email_taken`). 21st service → `422 RULE_VIOLATION services_max`. Deleting the last one → `422 RULE_VIOLATION services_min`. A service id that isn't mine → `404`. Every create/update/delete recomputes `startingPrice/startingUnit` with `computeStartingPrice` in the same handler (ARCH §7.7).
- **D-6 New service has no unit.** The S23 add dialog starts with name `''`, price `''` and **no unit selected**, so `Choose how this price is charged.` is reachable (AC2). `ServiceRowFields`' `Shows as` preview shows `—` until both price and unit are valid (T13 edits the shared component; S19's rows still default to `per_hour`).
- **D-7 Last-service tip.** With one service left the delete icon button is `aria-disabled="true"` (not `disabled`, so it still receives taps and keyboard) and opens a Radix `Popover` with `You need at least one service.` It never opens the delete confirm.
- **D-8 Dialog lifecycle.** `ServiceDialog` is mounted only while open (fresh form per open). Closing it (Cancel, Esc, overlay) while dirty asks `Discard changes?` inside the dialog. The page's one `DiscardChangesGuard` is on while the dialog is open and dirty (route changes).
- **D-9 Copy not in SPEC.** Delete confirm submitting label `Deleting…`; delete failure banner (non-rule) `Couldn't remove. Try again.` (§6.3 action pattern); S24 save button `Save changes` (S25's label); S24 re-verify confirm submitting `Saving…`; S23 table header for the icon column `Actions` (visible); preview tile icon `Tag`.
- **D-10 Cache updates.** Every listing write invalidates the `['catalog']` domain (S1/S2/S3 caches) and `qk.dashboard` (S20 "My Services"). Service writes also invalidate `qk.ownProvider` and await it (the preview tile must show the new price when the toast fires). Business/areas writes put the returned `OwnProvider` in `qk.ownProvider`. A business save with `reverification !== null` also invalidates `qk.verification` and calls `refreshMe(qc)` (L3 banner #3, nav, S26).
- **D-11 Forced rule.** The DevPanel gains forced kind `rule_services_min` (AC6). It is consumed by whichever endpoint id is armed.
- **D-12 Access.** Olivia → `/become-a-provider/1` and Admin → S40 are already enforced by `RequireProvider` / `RequireRole` on `/dashboard` (M10/M11). M12 only tests them (T21).

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `packages/contracts/src/providers/business.ts` (+ test) | Create | `UpdateBusinessBody`, `UpdateBusinessForm`, `UpdateBusinessResult`, `reverificationApplies`, `reverificationFor`, `reverifyWarning` |
| `packages/contracts/src/providers/services.ts` | Modify | `SERVICES_LAST_MESSAGE` |
| `packages/contracts/src/endpoints.ts` (+ test), `index.ts` | Modify | 5 registry entries, export |
| `packages/fixtures/src/providers.ts`, `build.test.ts` | Modify | p01 approved submission + documents |
| `src/mocks/db/schema.ts`, `src/mocks/db/store.test.ts` | Modify | `MOCK_DB_VERSION = 7` |
| `src/mocks/lib/controls.ts` (+ test), `src/mocks/dev/DevPanel.tsx` | Modify | forced `rule_services_min` |
| `src/mocks/lib/services.ts` (+ test) | Create | create/update/delete service, starting price |
| `src/mocks/lib/own-provider.ts` (+ test) | Modify | `replaceAreas`, export `fieldError` |
| `src/mocks/lib/verification.ts`, `src/mocks/lib/business.ts` (+ `business.test.ts`) | Modify/Create | `requeueForReverification`, `updateBusiness` |
| `src/mocks/handlers/providers.ts` (+ `providers-business.test.ts`) | Modify/Create | 5 handlers |
| `src/lib/error-copy.ts` | Modify | rule copy for services/towns |
| `src/features/provider-business/api.ts`, `hooks.ts`, `hooks.test.tsx` | Modify | 5 calls + mutations |
| `src/components/services-editor.tsx`, `areas-picker.tsx` | Modify | unit-less preview; export `selectClass` |
| `src/features/provider-business/components/{starting-price-tile,services-list,service-dialog,delete-service-dialog,reverify-dialog,business-details-form,areas-form}.tsx` | Create | S23–S25 parts |
| `src/features/provider-business/pages/{services-page,business-profile-page,service-areas-page}.tsx` (+ tests) | Create | S23, S24, S25 |
| `src/app/chunks/provider.tsx`, `src/app/routes.test.tsx` | Modify | wiring, access tests |

## Tasks

### T1 — Business schemas and the BR-21 rule
- [x] done
**Files:** `packages/contracts/src/providers/business.ts`, `packages/contracts/src/providers/business.test.ts`, `packages/contracts/src/index.ts`
**Context:** SPEC S24.E3/E4, §8.1 A23, §8.5 step 4; PRODUCT BR-13, BR-21; ARCH §3.3 row `PATCH /me/provider/business`; D-1, D-2. Reuses `BusinessName`, `Bio`, `YearsExperience`, `YearsText`, `OnboardingStep2Body` (onboarding.ts) and `OwnProvider` (own.ts).
**Do:**
1. `git tag m12-start && git checkout -b m12-provider-business`.
2. Create `packages/contracts/src/providers/business.ts`:
```ts
import { z } from 'zod';
import { ReverificationReason, type VerificationStatus } from '../common/enums';
import { Bio, BusinessName, OnboardingStep2Body, YearsExperience, YearsText } from './onboarding';
import { OwnProvider } from './own';

const CategoryId = OnboardingStep2Body.shape.categoryId; // 'Choose a category.'

/** PATCH /me/provider/business (A23): the whole S24 details card (D-1). The server also checks the category is active. */
export const UpdateBusinessBody = z.object({
  businessName: BusinessName,
  bio: Bio,
  yearsExperience: YearsExperience,
  categoryId: CategoryId,
});
export type UpdateBusinessBody = z.infer<typeof UpdateBusinessBody>;

/** S24 details form: years is text in the input. */
export const UpdateBusinessForm = z.object({
  businessName: BusinessName,
  bio: Bio,
  yearsExperience: YearsText,
  categoryId: CategoryId,
});
export type UpdateBusinessFormInput = z.input<typeof UpdateBusinessForm>;

export const UpdateBusinessResult = z.object({
  provider: OwnProvider,
  reverification: ReverificationReason.nullable(), // applied by this save (D-1)
});
export type UpdateBusinessResult = z.infer<typeof UpdateBusinessResult>;

/** BR-21 applies only to a Verified listing (decision 006). */
export const reverificationApplies = (s: VerificationStatus): boolean => s === 'verified';

/** D-2: which edit triggers re-verification (name wins over category), or null. */
export function reverificationFor(input: {
  status: VerificationStatus;
  before: { businessName: string | null; categoryId: string | null };
  after: { businessName: string; categoryId: string };
}): ReverificationReason | null {
  if (!reverificationApplies(input.status)) return null;
  if ((input.before.businessName ?? '').trim() !== input.after.businessName.trim()) return 'business_name';
  if (input.before.categoryId !== input.after.categoryId) return 'category';
  return null;
}

const FIELD: Record<ReverificationReason, string> = { business_name: 'business name', category: 'category' };
/** S24.E3 inline warning. */
export const reverifyWarning = (r: ReverificationReason): string =>
  `Changing your ${FIELD[r]} removes your Verified badge until Fixit checks your documents again.`;
```
3. In `packages/contracts/src/index.ts` add after `export * from './providers/own';`: `export * from './providers/business';`.
**Test:** `packages/contracts/src/providers/business.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { reverificationFor, reverifyWarning, UpdateBusinessBody, UpdateBusinessForm } from './business';

const before = { businessName: 'Bell & Sons Plumbing', categoryId: 'plumbing' };
const bio = 'Family-run plumbing business serving Colombo for over a decade.';

describe('reverificationFor (BR-21)', () => {
  it('verified: name change → business_name, category change → category', () => {
    const status = 'verified' as const;
    expect(reverificationFor({ status, before, after: { ...before, businessName: 'Bell Plumbing' } })).toBe(
      'business_name',
    );
    expect(reverificationFor({ status, before, after: { ...before, categoryId: 'handyman' } })).toBe('category');
  });
  it('both changed → business_name; whitespace-only change → null', () => {
    expect(
      reverificationFor({ status: 'verified', before, after: { businessName: 'X Y', categoryId: 'handyman' } }),
    ).toBe('business_name');
    expect(
      reverificationFor({ status: 'verified', before, after: { ...before, businessName: ' Bell & Sons Plumbing ' } }),
    ).toBeNull();
  });
  it('pending_review / not_submitted / rejected → null (decision 006)', () => {
    for (const status of ['pending_review', 'not_submitted', 'rejected'] as const)
      expect(reverificationFor({ status, before, after: { businessName: 'New', categoryId: 'handyman' } })).toBeNull();
  });
  it('warning copy', () => {
    expect(reverifyWarning('category')).toBe(
      'Changing your category removes your Verified badge until Fixit checks your documents again.',
    );
  });
});

describe('UpdateBusinessBody / Form', () => {
  it('SPEC messages', () => {
    const r = UpdateBusinessBody.safeParse({ businessName: '', bio: 'short', yearsExperience: 61, categoryId: '' });
    expect(r.success).toBe(false);
    const msgs = r.error?.issues.map((i) => i.message) ?? [];
    expect(msgs).toEqual(
      expect.arrayContaining([
        'Enter your business name.',
        'Tell customers about your business in at least 30 characters.',
        'Enter a number from 0 to 60.',
        'Choose a category.',
      ]),
    );
  });
  it('form turns years text into a number', () => {
    expect(
      UpdateBusinessForm.parse({ businessName: 'Bell', bio, yearsExperience: '14', categoryId: 'plumbing' })
        .yearsExperience,
    ).toBe(14);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): business update schemas and BR-21 rule (M12-T1)"`

### T2 — Endpoint registry entries
- [x] done
**Files:** `packages/contracts/src/endpoints.ts`, `packages/contracts/src/endpoints.test.ts`, `packages/contracts/src/providers/services.ts`
**Context:** ARCH §3.3 rows `PATCH /me/provider/business`, `POST/PATCH/DELETE /me/provider/services…`, `PUT /me/provider/areas` (all **P**).
**Do:**
1. In `packages/contracts/src/providers/services.ts` add after `SERVICES_MAX_MESSAGE`:
```ts
export const SERVICES_LAST_MESSAGE = 'You need at least one service.'; // S23.E2
```
2. In `endpoints.ts` add imports: `import { UpdateBusinessBody, UpdateBusinessResult } from './providers/business';`, `import { AreasBody } from './providers/onboarding';`, `import { ServiceBody } from './providers/services';`, and add `Service` to the existing `./providers/schemas` import.
3. Add these entries directly after `provider_photo_delete`:
```ts
  provider_business_update: {
    id: 'provider_business_update',
    domain: 'providers',
    method: 'PATCH',
    path: '/me/provider/business',
    access: ['provider'],
    owner: 'self',
    body: UpdateBusinessBody,
    response: UpdateBusinessResult,
    refs: ['F-20', 'S24', 'A23', 'BR-21'],
  },
  provider_service_create: {
    id: 'provider_service_create',
    domain: 'providers',
    method: 'POST',
    path: '/me/provider/services',
    access: ['provider'],
    owner: 'self',
    body: ServiceBody,
    response: Service,
    refs: ['F-20', 'S23', 'A24', 'BR-09', 'BR-10', 'BR-14'],
  },
  provider_service_update: {
    id: 'provider_service_update',
    domain: 'providers',
    method: 'PATCH',
    path: '/me/provider/services/:id',
    access: ['provider'],
    owner: 'resource_provider',
    body: ServiceBody,
    response: Service,
    refs: ['S23', 'A24', 'BR-10'],
  },
  provider_service_delete: {
    id: 'provider_service_delete',
    domain: 'providers',
    method: 'DELETE',
    path: '/me/provider/services/:id',
    access: ['provider'],
    owner: 'resource_provider',
    refs: ['S23', 'A24', 'BR-10', 'BR-14'],
  },
  provider_areas_put: {
    id: 'provider_areas_put',
    domain: 'providers',
    method: 'PUT',
    path: '/me/provider/areas',
    access: ['provider'],
    owner: 'self',
    body: AreasBody,
    response: OwnProvider,
    refs: ['F-20', 'S25', 'A25', 'BR-04', 'BR-14'],
  },
```
**Test:** add to `endpoints.test.ts` inside the `describe`:
```ts
  it('M12 own-listing rows match ARCHITECTURE §3.3', () => {
    const rows = Object.fromEntries(Object.values(ENDPOINTS).map((d) => [`${d.method} ${d.path}`, d.access]));
    expect(rows).toMatchObject({
      'PATCH /me/provider/business': ['provider'],
      'POST /me/provider/services': ['provider'],
      'PATCH /me/provider/services/:id': ['provider'],
      'DELETE /me/provider/services/:id': ['provider'],
      'PUT /me/provider/areas': ['provider'],
    });
    expect('response' in ENDPOINTS.provider_service_delete).toBe(false); // 204
    expect(ENDPOINTS.provider_service_update.owner).toBe('resource_provider');
    expect(ENDPOINTS.provider_service_delete.owner).toBe('resource_provider');
  });
```
**Verify:** `pnpm --filter @fixit/contracts test` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): M12 provider endpoints in the registry (M12-T2)"`

### T3 — Marcus approved submission fixture
- [x] done
**Files:** `packages/fixtures/src/providers.ts`, `packages/fixtures/src/build.test.ts`, `apps/web/src/mocks/db/schema.ts`, `apps/web/src/mocks/db/store.test.ts`
**Context:** D-3, D-4; ARCH §8.1 (re-verification copies the last approved submission's documents).
**Do:**
1. In `providers.ts`, in the `submissions` array add as the **first** element:
```ts
    {
      id: 's-p01-1',
      providerId: 'p01',
      attempt: 1,
      trigger: 'provider',
      status: 'approved',
      submittedAt: ago(372),
      decidedAt: ago(370),
      rejectionReason: null,
    },
```
2. In the `documents` array add as the first elements:
```ts
    ...(['nic_front', 'nic_back'] as const).map((type) => ({
      id: `d-p01-${type}`,
      providerId: 'p01',
      submissionId: 's-p01-1',
      type,
      fileName: type === 'nic_front' ? 'nic-front.jpg' : 'nic-back.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: type === 'nic_front' ? 501_220 : 476_310,
      createdAt: ago(372),
    })),
```
3. `apps/web/src/mocks/db/schema.ts`: `export const MOCK_DB_VERSION = 7;`. In `store.test.ts` replace both `fixit.mockdb.v6` with `fixit.mockdb.v7`.
**Test:** add to `build.test.ts` inside the top `describe`:
```ts
  it('M12: Marcus (p01) has an approved attempt with NIC front and back', () => {
    expect(world.submissions.find((s) => s.providerId === 'p01')).toMatchObject({ status: 'approved', attempt: 1 });
    expect(
      world.documents
        .filter((d) => d.submissionId === 's-p01-1')
        .map((d) => d.type)
        .sort(),
    ).toEqual(['nic_back', 'nic_front']);
  });
```
**Verify:** `pnpm --filter @fixit/fixtures test` and `pnpm --filter @fixit/web test` green (S26 "Marcus verified" test still passes; it now lists 2 documents). `pnpm verify` green. If an existing test counts submissions or documents and fails, STOP and write a blocker.
**Commit:** `git commit -m "feat(fixtures): approved verification for Marcus (M12-T3)"`

### T4 — Forced `rule_services_min`
- [ ] done
**Files:** `src/mocks/lib/controls.ts`, `src/mocks/lib/controls.test.ts`, `src/mocks/dev/DevPanel.tsx`
**Context:** AC6; D-11.
**Do:**
1. `controls.ts`: `export const FORCED_KINDS = ['500', '409', '401', 'network', 'rule_provider_paused', 'rule_services_min'] as const;` and add to the `forcedResponse` switch:
```ts
    case 'rule_services_min':
      return errorResponse(422, 'RULE_VIOLATION', 'Forced services_min (DevPanel)', {
        details: { rule: 'services_min' },
      });
```
2. `DevPanel.tsx`: in the label map next to `rule_provider_paused: '422 RULE_VIOLATION provider_paused',` add `rule_services_min: '422 RULE_VIOLATION services_min',`.
**Test:** add to `controls.test.ts` next to the `rule_provider_paused` case:
```ts
  it('rule_services_min → 422 with details.rule', async () => {
    const res = forcedResponse('rule_services_min');
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ error: { code: 'RULE_VIOLATION', details: { rule: 'services_min' } } });
  });
```
**Verify:** `pnpm --filter @fixit/web test -- controls` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): forced services_min rule in the mock controls (M12-T4)"`

### T5 — Mock service logic
- [ ] done
**Files:** `src/mocks/lib/services.ts`, `src/mocks/lib/services.test.ts`
**Context:** BR-09, BR-10, BR-14, A24; D-5. `ruleError` from `own-provider.ts`; `computeStartingPrice` from contracts.
**Do:** create `src/mocks/lib/services.ts`:
```ts
import { computeStartingPrice, SERVICES_MAX, type Service, type ServiceBody } from '@fixit/contracts';
import type { FxProvider, FxService } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';
import { ruleError } from './own-provider';

export const servicesOf = (d: MockDb, providerId: string): FxService[] =>
  Object.values(d.services).filter((s) => s.providerId === providerId);

export const toService = ({ id, name, price, unit }: FxService): Service => ({ id, name, price, unit });

/** BR-10, recomputed in the same write as the service change (ARCH §7.7). */
export function recomputeStartingPrice(d: MockDb, p: FxProvider): void {
  const s = computeStartingPrice(servicesOf(d, p.id));
  p.startingPrice = s?.amount ?? null;
  p.startingUnit = s?.unit ?? null;
}

function assertUniqueName(d: MockDb, p: FxProvider, name: string, exceptId?: string): void {
  const key = name.trim().toLowerCase();
  if (servicesOf(d, p.id).some((s) => s.id !== exceptId && s.name.trim().toLowerCase() === key))
    throw mockError(409, 'CONFLICT', 'Service name taken', { details: { rule: 'service_name_taken' } });
}

/** Another provider's or unknown id → 404 (ARCH §3). */
export function ownService(d: MockDb, p: FxProvider, id: string): FxService {
  const s = d.services[id];
  if (!s || s.providerId !== p.id) throw mockError(404, 'NOT_FOUND', 'Service not found');
  return s;
}

export function createService(d: MockDb, p: FxProvider, body: ServiceBody): FxService {
  if (servicesOf(d, p.id).length >= SERVICES_MAX) throw ruleError('services_max');
  assertUniqueName(d, p, body.name);
  const s: FxService = { id: crypto.randomUUID(), providerId: p.id, ...body };
  d.services[s.id] = s;
  recomputeStartingPrice(d, p);
  return s;
}

export function updateService(d: MockDb, p: FxProvider, id: string, body: ServiceBody): FxService {
  const s = ownService(d, p, id);
  assertUniqueName(d, p, body.name, id);
  Object.assign(s, body);
  recomputeStartingPrice(d, p);
  return s;
}

export function deleteService(d: MockDb, p: FxProvider, id: string): void {
  ownService(d, p, id);
  if (servicesOf(d, p.id).length <= 1) throw ruleError('services_min');
  Reflect.deleteProperty(d.services, id);
  recomputeStartingPrice(d, p);
}
```
**Test:** `src/mocks/lib/services.test.ts`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FxProvider } from '@fixit/fixtures';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { MockHttpError } from './errors';
import { createService, deleteService, servicesOf, updateService } from './services';

const thrown = (fn: () => unknown): MockHttpError => {
  try {
    fn();
  } catch (e) {
    if (e instanceof MockHttpError) return e;
    throw e;
  }
  throw new Error('did not throw');
};
const marcus = (): FxProvider => {
  const p = db().providers.p01;
  if (!p) throw new Error('fixture p01 missing');
  return p;
};

describe('mock services', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('add a cheaper service → starting price follows (BR-10)', () => {
    const d = db();
    const p = marcus();
    expect([p.startingPrice, p.startingUnit]).toEqual([2500, 'per_hour']);
    createService(d, p, { name: 'Gutter cleaning', price: 1500, unit: 'per_visit' });
    expect([p.startingPrice, p.startingUnit]).toEqual([1500, 'per_visit']);
  });
  it('duplicate name (case-insensitive) → 409 service_name_taken; editing itself is fine', () => {
    const d = db();
    const p = marcus();
    const e = thrown(() => createService(d, p, { name: 'leak REPAIR', price: 900, unit: 'fixed' }));
    expect([e.status, e.extra.details?.rule]).toEqual([409, 'service_name_taken']);
    const leak = servicesOf(d, p.id).find((s) => s.name === 'Leak repair');
    if (!leak) throw new Error('fixture service missing');
    expect(updateService(d, p, leak.id, { name: 'Leak repair', price: 2000, unit: 'per_hour' }).price).toBe(2000);
    expect(p.startingPrice).toBe(2000);
  });
  it('another provider’s service → 404', () => {
    const d = db();
    const other = Object.values(d.services).find((s) => s.providerId === 'p02');
    if (!other) throw new Error('fixture service missing');
    expect(thrown(() => updateService(d, marcus(), other.id, { name: 'X1', price: 100, unit: 'fixed' })).status).toBe(
      404,
    );
    expect(thrown(() => deleteService(d, marcus(), other.id)).status).toBe(404);
  });
  it('limits: 20 max (services_max), 1 min (services_min)', () => {
    const d = db();
    const p = marcus();
    for (let i = servicesOf(d, p.id).length; i < 20; i++)
      createService(d, p, { name: `Extra ${String(i)}`, price: 5000, unit: 'fixed' });
    expect(thrown(() => createService(d, p, { name: 'One more', price: 5000, unit: 'fixed' })).extra.details?.rule).toBe(
      'services_max',
    );
    const ids = servicesOf(d, p.id).map((s) => s.id);
    for (const id of ids.slice(1)) deleteService(d, p, id);
    const last = ids[0] ?? '';
    expect(thrown(() => deleteService(d, p, last)).extra.details?.rule).toBe('services_min');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- mocks/lib/services` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock service create/update/delete with starting price (M12-T5)"`

### T6 — Mock `replaceAreas`
- [ ] done
**Files:** `src/mocks/lib/own-provider.ts`, `src/mocks/lib/own-provider.test.ts`
**Context:** BR-04, BR-14, A25; S19 step 4 shares the rule. Pure refactor of `applyOnboardingStep` case 4 plus an export.
**Do:**
1. In `own-provider.ts` change `const fieldError = …` to `export const fieldError = …` (same body).
2. Add `type AreasBody` to the `@fixit/contracts` import and add below `fieldError`:
```ts
/** S19 step 4 and S25 (A25): replaces the provider's towns; validates before writing. */
export function replaceAreas(d: MockDb, p: FxProvider, body: AreasBody): void {
  const active = (tid: string) => d.towns.some((t) => t.id === tid && t.active);
  if (!active(body.baseTownId)) throw fieldError('baseTownId', 'Choose your base town.');
  if (!body.otherTownIds.every(active)) throw fieldError('otherTownIds', 'Choose your base town.');
  d.areas = d.areas.filter((a) => a.providerId !== p.id);
  d.areas.push({ providerId: p.id, townId: body.baseTownId, isBase: true });
  for (const townId of body.otherTownIds) d.areas.push({ providerId: p.id, townId, isBase: false });
  p.baseTownId = body.baseTownId;
}
```
3. Replace the whole `case 4: { … }` block of `applyOnboardingStep` with:
```ts
    case 4:
      replaceAreas(d, p, input.body);
      break;
```
**Test:** add to `own-provider.test.ts` inside the `describe` (add `replaceAreas` to the import):
```ts
  it('replaceAreas: new base, others kept without the base; unknown town → 400', () => {
    const d = db();
    const p = d.providers.p01;
    if (!p) throw new Error('fixture p01 missing');
    replaceAreas(d, p, { baseTownId: 'negombo', otherTownIds: ['colombo', 'moratuwa'] });
    const mine = d.areas.filter((a) => a.providerId === 'p01');
    expect(mine.find((a) => a.isBase)?.townId).toBe('negombo');
    expect(mine.filter((a) => !a.isBase).map((a) => a.townId).sort()).toEqual(['colombo', 'moratuwa']);
    expect(p.baseTownId).toBe('negombo');
    expect(thrown(() => { replaceAreas(d, p, { baseTownId: 'atlantis', otherTownIds: [] }); })).toMatchObject({ status: 400 });
  });
```
**Verify:** `pnpm --filter @fixit/web test -- own-provider providers-onboarding` green (step 4 unchanged); `pnpm verify` green.
**Commit:** `git commit -m "refactor(web): share replaceAreas between onboarding and S25 mocks (M12-T6)"`

### T7 — Mock business update and re-verification
- [ ] done
**Files:** `src/mocks/lib/verification.ts`, `src/mocks/lib/business.ts`, `src/mocks/lib/business.test.ts`
**Context:** A23, BR-21, SPEC §8.5 step 4, §10.2 #16; D-2, D-3. AC8.
**Do:**
1. In `verification.ts` change the files import to `import { deleteFile, getFile, putFile } from './files';`, add `type ReverificationReason` to the contracts import, and append:
```ts
/** BR-21 (D-3). Only called for a verified provider: attempt n+1 with copies of the latest approved documents. */
export function requeueForReverification(
  d: MockDb,
  p: FxProvider,
  reason: ReverificationReason,
  now: Date,
): void {
  const subs = Object.values(d.submissions).filter((s) => s.providerId === p.id);
  const attempt = Math.max(0, ...subs.map((s) => s.attempt)) + 1;
  const approved = subs.filter((s) => s.status === 'approved').sort((a, b) => b.attempt - a.attempt)[0];
  const id = `s-${p.id}-${String(attempt)}`;
  d.submissions[id] = {
    id,
    providerId: p.id,
    attempt,
    trigger: reason,
    status: 'pending_review',
    submittedAt: now.toISOString(),
    decidedAt: null,
    rejectionReason: null,
  };
  const originals = approved ? Object.values(d.documents).filter((x) => x.submissionId === approved.id) : [];
  for (const doc of originals) {
    const copyId = `d-${crypto.randomUUID().slice(0, 8)}`;
    d.documents[copyId] = { ...doc, id: copyId, submissionId: id, createdAt: now.toISOString() };
    const blob = getFile(`doc:${doc.id}`);
    if (blob) putFile(`doc:${copyId}`, blob);
  }
  p.verificationStatus = 'pending_review';
  p.verifiedAt = null;
  p.reverificationReason = reason;
}
```
2. Create `src/mocks/lib/business.ts`:
```ts
import {
  CATEGORY_MESSAGE,
  reverificationFor,
  type ReverificationReason,
  type UpdateBusinessBody,
} from '@fixit/contracts';
import type { FxProvider } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { fieldError } from './own-provider';
import { requeueForReverification } from './verification';

/** A23. Validates, writes the card, applies BR-21. Returns the applied reason or null. */
export function updateBusiness(
  d: MockDb,
  p: FxProvider,
  body: UpdateBusinessBody,
  now: Date,
): ReverificationReason | null {
  if (!d.categories.some((c) => c.id === body.categoryId && c.active))
    throw fieldError('categoryId', CATEGORY_MESSAGE);
  const reason = reverificationFor({
    status: p.verificationStatus,
    before: { businessName: p.businessName, categoryId: p.categoryId },
    after: body,
  });
  p.businessName = body.businessName;
  p.bio = body.bio;
  p.yearsExperience = body.yearsExperience;
  p.categoryId = body.categoryId;
  if (reason) requeueForReverification(d, p, reason, now);
  return reason;
}
```
**Test:** `src/mocks/lib/business.test.ts`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FxProvider } from '@fixit/fixtures';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { updateBusiness } from './business';

const bio = 'Family-run plumbing business serving Colombo for over a decade. Upfront pricing.';
const prov = (id: string): FxProvider => {
  const p = db().providers[id];
  if (!p) throw new Error(`fixture ${id} missing`);
  return p;
};
const card = (p: FxProvider) => ({
  businessName: p.businessName ?? '',
  bio,
  yearsExperience: 10,
  categoryId: p.categoryId ?? '',
});

describe('updateBusiness (BR-21, AC8)', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('bio only on verified Marcus → no reverification, still verified', () => {
    const p = prov('p01');
    expect(updateBusiness(db(), p, card(p), FIXED_NOW)).toBeNull();
    expect(p.verificationStatus).toBe('verified');
    expect(p.bio).toBe(bio);
  });
  it('name change on verified → pending_review, attempt 2 re-queues the approved documents', () => {
    const d = db();
    const p = prov('p01');
    expect(updateBusiness(d, p, { ...card(p), businessName: 'Bell Plumbing Co' }, FIXED_NOW)).toBe('business_name');
    expect(p).toMatchObject({ verificationStatus: 'pending_review', reverificationReason: 'business_name', verifiedAt: null });
    expect(d.submissions['s-p01-2']).toMatchObject({ attempt: 2, trigger: 'business_name', status: 'pending_review' });
    expect(
      Object.values(d.documents)
        .filter((x) => x.submissionId === 's-p01-2')
        .map((x) => x.type)
        .sort(),
    ).toEqual(['nic_back', 'nic_front']);
  });
  it('category change on pending_review (Dana) → saved, no reason, no new attempt (decision 006)', () => {
    const d = db();
    const p = prov('p02');
    expect(updateBusiness(d, p, { ...card(p), categoryId: 'handyman' }, FIXED_NOW)).toBeNull();
    expect(p).toMatchObject({ verificationStatus: 'pending_review', reverificationReason: null, categoryId: 'handyman' });
    expect(Object.values(d.submissions).filter((s) => s.providerId === 'p02')).toHaveLength(1);
  });
  it('not_submitted (Hank) and rejected (Grace) → no change', () => {
    const d = db();
    const grace = prov('p10');
    expect(updateBusiness(d, grace, { ...card(grace), businessName: 'Renamed Ltd' }, FIXED_NOW)).toBeNull();
    expect(grace.verificationStatus).toBe('rejected');
    const hank = Object.values(d.providers).find((x) => x.userId === 'u-hank');
    if (!hank) throw new Error('fixture hank missing');
    expect(updateBusiness(d, hank, { ...card(hank), categoryId: 'handyman' }, FIXED_NOW)).toBeNull();
    expect(hank).toMatchObject({ verificationStatus: 'not_submitted', reverificationReason: null });
  });
  it('inactive or unknown category → 400 Choose a category.', () => {
    const p = prov('p01');
    expect(() => updateBusiness(db(), p, { ...card(p), categoryId: 'nope' }, FIXED_NOW)).toThrow();
    expect(p.categoryId).toBe('plumbing');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- mocks/lib/business` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock business update with BR-21 re-verification (M12-T7)"`

### T8 — Handlers: services
- [ ] done
**Files:** `src/mocks/handlers/providers.ts`, `src/mocks/handlers/providers-business.test.ts`
**Context:** ARCH §3.3; D-5; AC1, AC2, AC7.
**Do:** in `providers.ts` add `import { createService, deleteService, toService, updateService } from '../lib/services';` and append to `providersHandlers` (after `provider_photo_delete`):
```ts
  mockEndpoint(E.provider_service_create, ({ db: d, actor, body }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    return toService(createService(d, ownProvider(d, actor.userId), body));
  }),
  mockEndpoint(E.provider_service_update, ({ db: d, actor, params, body }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    return toService(updateService(d, ownProvider(d, actor.userId), params.id ?? '', body));
  }),
  mockEndpoint(E.provider_service_delete, ({ db: d, actor, params }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    deleteService(d, ownProvider(d, actor.userId), params.id ?? '');
  }),
```
**Test:** create `src/mocks/handlers/providers-business.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscoverResult, ErrorEnvelope, OwnProvider, ProviderPublicProfile, Service } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const call = (method: string, path: string, persona?: PersonaKey, body?: unknown) =>
  fetch(new URL(`/api${path}`, window.location.origin), {
    method,
    headers: {
      ...(persona ? { Authorization: `Bearer ${signInAs(persona).accessToken}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const errorOf = async (res: Response) => ErrorEnvelope.parse(await res.json()).error;
const gutter = { name: 'Gutter cleaning', price: 1500, unit: 'per_visit' };
const serviceOf = (providerId: string) => {
  const s = Object.values(db().services).find((x) => x.providerId === providerId);
  if (!s) throw new Error('fixture service missing');
  return s;
};

describe('services handlers', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('roles: anon 401, Olivia 403, admin 403', async () => {
    expect((await call('POST', '/me/provider/services', undefined, gutter)).status).toBe(401);
    expect((await call('POST', '/me/provider/services', 'customer', gutter)).status).toBe(403);
    expect((await call('POST', '/me/provider/services', 'admin', gutter)).status).toBe(403);
  });
  it('AC1: add → own, S3 profile and Discover show LKR 1,500 / visit', async () => {
    const res = await call('POST', '/me/provider/services', 'provider', gutter);
    expect(Service.parse(await res.json())).toMatchObject(gutter);
    const own = OwnProvider.parse(await (await call('GET', '/me/provider', 'provider')).json());
    expect(own.startingPrice).toEqual({ amount: 1500, unit: 'per_visit' });
    const profile = ProviderPublicProfile.parse(await (await call('GET', '/providers/p01')).json());
    expect(profile.startingPrice).toEqual({ amount: 1500, unit: 'per_visit' });
    const found = DiscoverResult.parse(await (await call('GET', '/providers?cat=plumbing&loc=colombo')).json());
    expect(found.items.find((c) => c.id === 'p01')?.startingPrice).toEqual({ amount: 1500, unit: 'per_visit' });
  });
  it('AC2: bad bodies → 400 with SPEC copy; duplicate → 409 service_name_taken', async () => {
    const low = await call('POST', '/me/provider/services', 'provider', { ...gutter, price: 50 });
    expect((await errorOf(low)).fieldErrors?.price).toEqual([
      'Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.',
    ]);
    const noUnit = await call('POST', '/me/provider/services', 'provider', { name: 'Gutters', price: 1500 });
    expect((await errorOf(noUnit)).fieldErrors?.unit).toEqual(['Choose how this price is charged.']);
    const dup = await call('POST', '/me/provider/services', 'provider', { ...gutter, name: 'LEAK repair' });
    expect(dup.status).toBe(409);
    expect((await errorOf(dup)).details?.rule).toBe('service_name_taken');
  });
  it('AC7: PATCH / DELETE another provider’s service → 404; own edit 200; delete 204', async () => {
    const other = serviceOf('p02');
    expect((await call('PATCH', `/me/provider/services/${other.id}`, 'provider', gutter)).status).toBe(404);
    expect((await call('DELETE', `/me/provider/services/${other.id}`, 'provider')).status).toBe(404);
    const mine = serviceOf('p01');
    expect((await call('PATCH', `/me/provider/services/${mine.id}`, 'provider', gutter)).status).toBe(200);
    expect((await call('DELETE', `/me/provider/services/${mine.id}`, 'provider')).status).toBe(204);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- providers-business` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock handlers for provider services (M12-T8)"`

### T9 — Handlers: business and areas
- [ ] done
**Files:** `src/mocks/handlers/providers.ts`, `src/mocks/handlers/providers-business.test.ts`
**Context:** A23, A25; D-1–D-3; AC3, AC4, AC8.
**Do:** in `providers.ts` add `import { updateBusiness } from '../lib/business';`, add `replaceAreas` to the `../lib/own-provider` import, and append:
```ts
  mockEndpoint(E.provider_business_update, ({ db: d, actor, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    const reverification = updateBusiness(d, p, body, now);
    return { provider: toOwnProvider(d, p), reverification };
  }),
  mockEndpoint(E.provider_areas_put, ({ db: d, actor, body }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    replaceAreas(d, p, body);
    return toOwnProvider(d, p);
  }),
```
**Test:** add to `providers-business.test.ts` (add `UpdateBusinessResult` and `Me` to the contracts import):
```ts
const card = {
  businessName: 'Bell & Sons Plumbing',
  bio: 'Family-run plumbing business serving Colombo for over a decade. Upfront pricing.',
  yearsExperience: 14,
  categoryId: 'plumbing',
};

describe('business and areas handlers', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('roles: anon 401, Olivia 403, admin 403', async () => {
    for (const [persona, status] of [[undefined, 401], ['customer', 403], ['admin', 403]] as const) {
      expect((await call('PATCH', '/me/provider/business', persona, card)).status).toBe(status);
      expect(
        (await call('PUT', '/me/provider/areas', persona, { baseTownId: 'colombo', otherTownIds: [] })).status,
      ).toBe(status);
    }
  });
  it('AC3: bio only → reverification null; rename → pending, badge gone on S3, Me updated', async () => {
    const bioOnly = UpdateBusinessResult.parse(
      await (await call('PATCH', '/me/provider/business', 'provider', card)).json(),
    );
    expect(bioOnly.reverification).toBeNull();
    expect(bioOnly.provider.verificationStatus).toBe('verified');
    const renamed = UpdateBusinessResult.parse(
      await (await call('PATCH', '/me/provider/business', 'provider', { ...card, businessName: 'Bell Plumbing' })).json(),
    );
    expect(renamed.reverification).toBe('business_name');
    expect(renamed.provider).toMatchObject({ verificationStatus: 'pending_review', reverificationReason: 'business_name' });
    const profile = ProviderPublicProfile.parse(await (await call('GET', '/providers/p01')).json());
    expect(profile.verified).toBe(false);
    const me = Me.parse(await (await call('GET', '/auth/me', 'provider')).json());
    expect(me.provider?.verificationStatus).toBe('pending_review');
  });
  it('AC4: new base town Negombo, Kesbewa dropped → Discover loc matches', async () => {
    const res = await call('PUT', '/me/provider/areas', 'provider', {
      baseTownId: 'negombo',
      otherTownIds: ['negombo', 'colombo', 'maharagama'],
    });
    const own = OwnProvider.parse(await res.json());
    expect(own.baseTown?.id).toBe('negombo');
    expect(own.otherTowns.map((t) => t.id)).toEqual(['colombo', 'maharagama']);
    const ids = async (loc: string) =>
      DiscoverResult.parse(await (await call('GET', `/providers?cat=plumbing&loc=${loc}`)).json()).items.map((c) => c.id);
    expect(await ids('negombo')).toContain('p01');
    expect(await ids('kesbewa')).not.toContain('p01');
  });
  it('areas: 10 other towns → 400 You can add up to 9 other towns.', async () => {
    const ten = ['colombo', 'maharagama', 'moratuwa', 'kesbewa', 'kaduwela', 'homagama', 'wattala', 'ja-ela', 'kelaniya', 'panadura'];
    const res = await call('PUT', '/me/provider/areas', 'provider', { baseTownId: 'negombo', otherTownIds: ten });
    expect((await errorOf(res)).fieldErrors?.otherTownIds).toEqual(['You can add up to 9 other towns.']);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- providers-business` green; `pnpm verify` green. If `/auth/me` is not the path of `ENDPOINTS.auth_me`, use that entry's path.
**Commit:** `git commit -m "feat(web): mock handlers for business details and service areas (M12-T9)"`

### T10 — Error copy and API calls
- [ ] done
**Files:** `src/lib/error-copy.ts`, `src/features/provider-business/api.ts`
**Context:** S23 field table, §6.3; D-5.
**Do:**
1. `error-copy.ts`: import `OTHER_TOWNS_MAX_MESSAGE, SERVICE_NAME_TAKEN, SERVICES_LAST_MESSAGE, SERVICES_MAX_MESSAGE` from `@fixit/contracts`. Add `service_name_taken: SERVICE_NAME_TAKEN,` to `RULE_FIELD_COPY` and to `RULE_BANNER_COPY` add:
```ts
  services_min: SERVICES_LAST_MESSAGE,
  services_max: SERVICES_MAX_MESSAGE,
  towns_max: OTHER_TOWNS_MAX_MESSAGE,
```
2. `api.ts`: add to the contracts import `type AreasBody, type Service, type ServiceBody, type UpdateBusinessBody, type UpdateBusinessResult` and append:
```ts
export const updateBusiness = (body: UpdateBusinessBody): Promise<UpdateBusinessResult> =>
  http(pathOf(E.provider_business_update), {
    method: 'PATCH',
    body,
    schema: E.provider_business_update.response,
  });

export const createService = (body: ServiceBody): Promise<Service> =>
  http(pathOf(E.provider_service_create), { method: 'POST', body, schema: E.provider_service_create.response });

export const updateService = (id: string, body: ServiceBody): Promise<Service> =>
  http(pathOf(E.provider_service_update, { id }), {
    method: 'PATCH',
    body,
    schema: E.provider_service_update.response,
  });

export const deleteService = (id: string): Promise<void> =>
  http(pathOf(E.provider_service_delete, { id }), { method: 'DELETE', schema: undefined });

export const saveAreas = (body: AreasBody): Promise<OwnProvider> =>
  http(pathOf(E.provider_areas_put), { method: 'PUT', body, schema: E.provider_areas_put.response });
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): provider business API calls and rule copy (M12-T10)"`

### T11 — Mutation hooks
- [ ] done
**Files:** `src/features/provider-business/hooks.ts`, `src/features/provider-business/hooks.test.tsx`
**Context:** D-10; ARCH §4.2.
**Do:** in `hooks.ts` add `import type { QueryClient } from '@tanstack/react-query';`, add `type AreasBody, type ServiceBody, type UpdateBusinessBody` to the contracts import, add `createService, deleteService, saveAreas, updateBusiness, updateService` to the `./api` import, and append:
```ts
/** D-10: public views (S1–S3, Discover) and S20 read the listing. */
function invalidateListing(qc: QueryClient): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['catalog'] }),
    qc.invalidateQueries({ queryKey: qk.dashboard }),
  ]);
}

/** Service writes change startingPrice: wait for the fresh OwnProvider before the caller toasts. */
function useServiceMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      Promise.all([qc.invalidateQueries({ queryKey: qk.ownProvider }), invalidateListing(qc)]),
  });
}
export const useCreateService = () => useServiceMutation((body: ServiceBody) => createService(body));
export const useUpdateService = () =>
  useServiceMutation(({ id, body }: { id: string; body: ServiceBody }) => updateService(id, body));
export const useDeleteService = () => useServiceMutation((id: string) => deleteService(id));

/** A23. A re-verification moves S26, the L3 banner and the nav (Me). */
export function useUpdateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateBusinessBody) => updateBusiness(body),
    onSuccess: (result) => {
      qc.setQueryData(qk.ownProvider, result.provider);
      void invalidateListing(qc);
      if (result.reverification !== null) {
        void qc.invalidateQueries({ queryKey: qk.verification });
        refreshMe(qc);
      }
    },
  });
}

export function useSaveAreas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AreasBody) => saveAreas(body),
    onSuccess: (own) => {
      qc.setQueryData(qk.ownProvider, own);
      void invalidateListing(qc);
    },
  });
}
```
**Test:** add to `hooks.test.tsx` (extend the `./hooks` import with `useCreateService, useUpdateBusiness`):
```ts
  it('useCreateService: own provider refetched with the new starting price before resolve', async () => {
    signInAs('provider');
    const wrapper = createWrapper();
    const h = renderHook(() => ({ own: useOwnProvider(), add: useCreateService() }), { wrapper });
    await waitFor(() => {
      expect(h.result.current.own.data?.startingPrice).toEqual({ amount: 2500, unit: 'per_hour' });
    });
    await act(async () => {
      await h.result.current.add.mutateAsync({ name: 'Gutter cleaning', price: 1500, unit: 'per_visit' });
    });
    expect(h.result.current.own.data?.startingPrice).toEqual({ amount: 1500, unit: 'per_visit' });
  });
  it('useUpdateBusiness: rename → reverification, Me pending_review with reason', async () => {
    signInAs('provider');
    const h = renderHook(() => useUpdateBusiness(), { wrapper: createWrapper() });
    let reason: string | null = null;
    await act(async () => {
      reason = (
        await h.result.current.mutateAsync({
          businessName: 'Bell Plumbing',
          bio: 'Family-run plumbing business serving Colombo for over a decade.',
          yearsExperience: 14,
          categoryId: 'plumbing',
        })
      ).reverification;
    });
    expect(reason).toBe('business_name');
    await waitFor(() => {
      expect(authStore.getState().me?.provider).toMatchObject({
        verificationStatus: 'pending_review',
        reverificationReason: 'business_name',
      });
    });
  });
```
**Verify:** `pnpm --filter @fixit/web test -- provider-business/hooks` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): hooks for services, business details and areas (M12-T11)"`

### T12 — Starting-at preview tile
- [ ] done
**Files:** `src/features/provider-business/components/starting-price-tile.tsx`
**Context:** S23 layout #2 (S20 stat-tile style, one tile); BR-10. Copy `Starting at` / `LKR 2,500 / hour` (no `from`).
**Do:** create:
```tsx
import { Tag } from 'lucide-react';
import { PRICE_UNIT_SUFFIX, type OwnProvider } from '@fixit/contracts';
import { formatLkr } from '@/lib/format';

/** S23 preview: the S20 stat-tile box, one tile. */
export function StartingPriceTile({ price }: { price: OwnProvider['startingPrice'] }) {
  return (
    <section
      aria-labelledby="starting-at"
      className="border-border bg-surface flex flex-col gap-3.5 rounded-xl border p-4 sm:max-w-[320px] sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="starting-at" className="text-label text-text-muted font-semibold">
          Starting at
        </h2>
        <span className="bg-primary-soft text-primary grid size-10 place-items-center rounded-lg">
          <Tag aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="text-title-lg text-text font-extrabold">
        {price ? `${formatLkr(price.amount)}${PRICE_UNIT_SUFFIX[price.unit]}` : '—'}
      </p>
    </section>
  );
}
```
States: value (always for a published provider); `—` when `price` is null. Phone: full width (no `max-w` below `sm`).
**Verify:** `pnpm verify` green (covered by the T16 page test).
**Commit:** `git commit -m "feat(web): S23 starting-at preview tile (M12-T12)"`

### T13 — Services list (table / phone cards) with last-service tip
- [ ] done
**Files:** `src/features/provider-business/components/services-list.tsx`, `src/components/services-editor.tsx`
**Context:** S23 layout #3, S23.E2, §6.9; D-6, D-7. Reuse `DataList` (`components/data-list.tsx`): table at ≥641, cards below. Actions go in a `card: 'status'` column so phone cards show them on the right of row 1.
**Do:**
1. `services-editor.tsx` (D-6): replace the two preview lines in `ServiceRowFields`
```ts
  const price = ServicePriceText.safeParse(row.price);
  const preview = price.success ? formatServicePrice(price.data, row.unit) : '—';
```
with
```ts
  const price = ServicePriceText.safeParse(row.price);
  const unit = PriceUnit.safeParse(row.unit); // the S23 add dialog starts without a unit (M12 D-6)
  const preview = price.success && unit.success ? formatServicePrice(price.data, unit.data) : '—';
```
2. Create `services-list.tsx`:
```tsx
import { Pencil, Trash2 } from 'lucide-react';
import { SERVICES_LAST_MESSAGE, type Service } from '@fixit/contracts';
import { DataList, type DataListColumn } from '@/components/data-list';
import { UNIT_LABEL } from '@/components/services-editor';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatLkr, formatServicePrice } from '@/lib/format';

const ICON = 'size-11 sm:size-10'; // 44 on phone, 40 on desktop (S23)

function DeleteButton({ service, last, onDelete }: { service: Service; last: boolean; onDelete: () => void }) {
  const label = `Delete ${service.name}`;
  if (!last)
    return (
      <Button variant="ghost" size="icon" className={ICON} aria-label={label} onClick={onDelete}>
        <Trash2 aria-hidden="true" />
      </Button>
    );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`${ICON} text-text-subtle`} aria-label={label} aria-disabled="true">
          <Trash2 aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="text-meta w-auto max-w-[240px] px-3 py-2">
        {SERVICES_LAST_MESSAGE}
      </PopoverContent>
    </Popover>
  );
}

export function ServicesList({
  services,
  onEdit,
  onDelete,
}: {
  services: readonly Service[];
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
}) {
  const last = services.length <= 1;
  const columns: DataListColumn<Service>[] = [
    { id: 'name', header: 'Service', card: 'title', cell: (s) => <span className="text-body text-text font-bold">{s.name}</span> },
    { id: 'price', header: 'Price', card: 'hidden', cell: (s) => formatLkr(s.price) },
    { id: 'unit', header: 'Unit', card: 'hidden', cell: (s) => UNIT_LABEL[s.unit] },
    {
      id: 'shows',
      header: 'Shows as',
      card: 'meta',
      cell: (s) => (
        <span className="text-meta text-text-muted sm:text-body-sm sm:text-text">
          <span className="sm:sr-only">Shows as </span>
          {formatServicePrice(s.price, s.unit)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      card: 'status',
      className: 'w-[112px]',
      cell: (s) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className={ICON} aria-label={`Edit ${s.name}`} onClick={() => { onEdit(s); }}>
            <Pencil aria-hidden="true" />
          </Button>
          <DeleteButton service={s} last={last} onDelete={() => { onDelete(s); }} />
        </div>
      ),
    },
  ];
  return <DataList rows={services} columns={columns} getRowKey={(s) => s.id} caption="Your services" />;
}
```
If `DataList` renders `card: 'hidden'` columns on phone, or puts `status` cells anywhere other than row 1 right, STOP and write a blocker (do not edit `DataList`).
States: rows 1–20; last-row tip (D-7). Loading/empty are handled by the page (T16).
**Verify:** `pnpm verify` green (S19 services-editor tests still pass).
**Commit:** `git commit -m "feat(web): S23 services table and phone cards (M12-T13)"`

### T14 — Service dialog
- [ ] done
**Files:** `src/features/provider-business/components/service-dialog.tsx`
**Context:** S23.E3, S23 field table, §6.7, §6.10; D-6, D-8, D-9. Reuse `ServiceRowFields` (one row, no `onRemove`), `Step3Form` (contracts: `{services: [row]}`), `ResponsiveDialog`, `FormErrorBanner`, `SubmitButton`, `mapApiErrorToForm`.
**Do:** create:
```tsx
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Step3Form, type Service, type ServicesFormValues } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { ServiceRowFields } from '@/components/services-editor';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { notify } from '@/lib/toast';
import { useCreateService, useUpdateService } from '../hooks';

/** S23.E3. Mounted only while open (D-8). `service` null = add. */
export function ServiceDialog({
  service,
  onClose,
  onDirtyChange,
}: {
  service: Service | null;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const create = useCreateService();
  const update = useUpdateService();
  const pending = create.isPending || update.isPending;
  const [banner, setBanner] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const form = useForm<ServicesFormValues, unknown, z.output<typeof Step3Form>>({
    resolver: zodResolver(Step3Form),
    defaultValues: service
      ? { services: [{ name: service.name, price: String(service.price), unit: service.unit }] }
      : { services: [{ name: '', price: '' }] }, // no unit (D-6)
  });
  const { isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const requestClose = () => {
    if (pending) return;
    if (isDirty) setConfirmDiscard(true);
    else onClose();
  };

  const submit = form.handleSubmit(async (v) => {
    const body = v.services[0];
    if (!body) return; // the schema requires the one row this form renders
    setBanner(null);
    try {
      if (service) {
        await update.mutateAsync({ id: service.id, body });
        notify('Service saved.');
      } else {
        await create.mutateAsync(body);
        notify('Service added.');
      }
      onClose();
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError, { service_name_taken: 'services.0.name' }));
    }
  });

  return (
    <>
      <ResponsiveDialog
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        title={service ? 'Edit service' : 'Add service'}
        dismissible={!pending}
        footer={
          <>
            <Button variant="secondary" className="w-full sm:w-auto" disabled={pending} onClick={requestClose}>
              Cancel
            </Button>
            <SubmitButton form="service-form" className="w-full sm:w-auto" pending={pending} pendingLabel="Saving…">
              Save
            </SubmitButton>
          </>
        }
      >
        <FormProvider {...form}>
          <form id="service-form" noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
            {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
            <ServiceRowFields index={0} />
          </form>
        </FormProvider>
      </ResponsiveDialog>
      <ResponsiveDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard changes?"
        description="What you've entered won't be saved."
        footer={
          <>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => { setConfirmDiscard(false); }}>
              Keep editing
            </Button>
            <Button variant="danger" className="w-full sm:w-auto" onClick={onClose}>
              Discard
            </Button>
          </>
        }
      />
    </>
  );
}
```
States: default (add: empty, no unit; edit: prefilled), field errors (`Enter a service name.` · `Service name must be 2 to 60 characters.` · `You already have a service with this name.` from 409 · `Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.` · `Choose how this price is charged.`), submitting (`Saving…`, not dismissible), server/network error (banner `We couldn't save your changes. Check your connection and try again.`, values kept, dialog open), `services_max` (banner `You can list up to 20 services.`), dirty close (`Discard changes?`). Phone: bottom sheet (ResponsiveDialog), buttons full width.
If `mapApiErrorToForm`'s `RuleFields` type rejects `'services.0.name'`, STOP and write a blocker.
**Verify:** `pnpm verify` green (behaviour tested in T16).
**Commit:** `git commit -m "feat(web): S23 add/edit service dialog (M12-T14)"`

### T15 — Delete service confirm
- [ ] done
**Files:** `src/features/provider-business/components/delete-service-dialog.tsx`
**Context:** S23.E4; AC2, AC6; D-9.
**Do:** create:
```tsx
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { SERVICES_LAST_MESSAGE, type Service } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { useDeleteService } from '../hooks';

export function DeleteServiceDialog({ service, onClose }: { service: Service; onClose: () => void }) {
  const del = useDeleteService();
  const [banner, setBanner] = useState<string | null>(null);
  const run = async () => {
    setBanner(null);
    try {
      await del.mutateAsync(service.id);
      notify('Service deleted.');
      onClose();
    } catch (e) {
      setBanner(e instanceof ApiError && e.rule === 'services_min' ? SERVICES_LAST_MESSAGE : "Couldn't remove. Try again.");
    }
  };
  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Delete ${service.name}?`}
      description="Customers won't see it any more. Requests already sent aren't affected."
      dismissible={!del.isPending}
      footer={
        <>
          <Button variant="secondary" className="w-full sm:w-auto" disabled={del.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="w-full sm:w-auto"
            disabled={del.isPending}
            aria-busy={del.isPending || undefined}
            onClick={() => void run()}
          >
            {del.isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />}
            {del.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
    </ResponsiveDialog>
  );
}
```
States: default, submitting (`Deleting…`), rule error (`You need at least one service.`), other error (`Couldn't remove. Try again.`), dialog stays open on error.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S23 delete service confirm (M12-T15)"`

### T16 — S23 My Services page
- [ ] done
**Files:** `src/features/provider-business/pages/services-page.tsx`, `src/features/provider-business/pages/services-page.test.tsx`, `src/app/chunks/provider.tsx`
**Context:** S23 layout, S23.E1; §6.1 (Stat tile + Table row skeletons), §6.3, §6.7; AC1, AC2, AC5, AC6.
**Do:**
1. Create `services-page.tsx`:
```tsx
import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { SERVICES_MAX, SERVICES_MAX_MESSAGE, type Service } from '@fixit/contracts';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard, SkeletonStatTile } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { DeleteServiceDialog } from '../components/delete-service-dialog';
import { ServiceDialog } from '../components/service-dialog';
import { ServicesList } from '../components/services-list';
import { StartingPriceTile } from '../components/starting-price-tile';
import { useOwnProvider } from '../hooks';

type Editing = { service: Service | null } | null;

export function ServicesPage() {
  const own = useOwnProvider();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [dirty, setDirty] = useState(false);
  const onDirtyChange = useCallback((d: boolean) => { setDirty(d); }, []);
  const p = own.data ?? null;
  const full = (p?.services.length ?? 0) >= SERVICES_MAX;
  const closeDialog = () => { setEditing(null); setDirty(false); };
  return (
    <div className="flex max-w-[1040px] flex-col gap-5 sm:gap-7">
      <DiscardChangesGuard when={editing !== null && dirty} />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-title-lg text-text">My Services</h1>
          <p className="text-body-sm text-text-muted">
            {'What you offer and what it costs. Your lowest price shows as "Starting at".'}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 sm:items-end">
          <Button size="lg" className="w-full sm:w-auto" disabled={!p || full} onClick={() => { setEditing({ service: null }); }}>
            <Plus aria-hidden="true" />
            Add service
          </Button>
          {full && <p className="text-meta text-text-muted">{SERVICES_MAX_MESSAGE}</p>}
        </div>
      </header>
      {own.isPending && (
        <LoadingRegion loading skeleton={<><SkeletonStatTile /><SkeletonSectionCard lines={5} /></>} />
      )}
      {(own.isError || own.data === null) && <SectionError onRetry={() => { void own.refetch(); }} />}
      {p && (
        <>
          <StartingPriceTile price={p.startingPrice} />
          <section className="sm:border-border sm:bg-surface sm:overflow-hidden sm:rounded-2xl sm:border">
            <ServicesList services={p.services} onEdit={(s) => { setEditing({ service: s }); }} onDelete={setDeleting} />
          </section>
        </>
      )}
      {editing && <ServiceDialog service={editing.service} onClose={closeDialog} onDirtyChange={onDirtyChange} />}
      {deleting && <DeleteServiceDialog service={deleting} onClose={() => { setDeleting(null); }} />}
    </div>
  );
}
```
2. `src/app/chunks/provider.tsx`: replace the `ServicesPage` placeholder function with `export { ServicesPage } from '@/features/provider-business/pages/services-page';`.
States: loading (stat tile + section skeleton, after 150 ms, `aria-busy`), load error (SectionError + `Try again`), data, Add disabled at 20 with help, dialogs. Phone (390): header stacks (`flex-col`), `Add service` full width under the header, list as cards with 44×44 icon buttons, no table border box.
**Test:** `services-page.test.tsx`
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { notify } from '@/lib/toast';
import { FIXED_NOW } from '@/test/fixed-now';
import { setViewportWidth } from '@/test/media';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));
const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe('S23 My Services', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    Element.prototype.scrollIntoView = vi.fn();
    setViewportWidth(1440);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC1: header, preview tile, table; add Gutter cleaning → toast and LKR 1,500 / visit', async () => {
    signInAs('provider');
    renderRoute('/dashboard/services');
    expect(await screen.findByText('LKR 2,500 / hour')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'My Services' })).toBeInTheDocument();
    const table = screen.getByRole('table');
    for (const h of ['Service', 'Price', 'Unit', 'Shows as']) expect(within(table).getByRole('columnheader', { name: h })).toBeInTheDocument();
    expect(within(table).getByText('from LKR 2,500 / hour')).toBeInTheDocument();
    const u = user();
    await u.click(screen.getByRole('button', { name: 'Add service' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add service' });
    await u.type(within(dialog).getByLabelText(/Service name/), 'Gutter cleaning');
    await u.type(within(dialog).getByLabelText(/Price/), '1500');
    await u.click(within(dialog).getByLabelText('per visit'));
    expect(within(dialog).getByText('from LKR 1,500 / visit')).toBeInTheDocument();
    await u.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('LKR 1,500 / visit')).toBeInTheDocument();
    expect(notify).toHaveBeenCalledWith('Service added.');
  });
  it('AC2: dialog errors — price 50, no unit, duplicate name', async () => {
    signInAs('provider');
    renderRoute('/dashboard/services');
    const u = user();
    await u.click(await screen.findByRole('button', { name: 'Add service' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add service' });
    await u.type(within(dialog).getByLabelText(/Service name/), 'Leak repair');
    await u.type(within(dialog).getByLabelText(/Price/), '50');
    await u.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.')).toBeInTheDocument();
    expect(within(dialog).getByText('Choose how this price is charged.')).toBeInTheDocument();
    await u.clear(within(dialog).getByLabelText(/Price/));
    await u.type(within(dialog).getByLabelText(/Price/), '900');
    await u.click(within(dialog).getByLabelText('fixed'));
    await u.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('You already have a service with this name.')).toBeInTheDocument();
  });
  it('AC2: edit → Service saved.; delete → Delete {name}? → Service deleted.', async () => {
    signInAs('provider');
    renderRoute('/dashboard/services');
    const u = user();
    await u.click(await screen.findByRole('button', { name: 'Edit Leak repair' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit service' });
    await u.clear(within(dialog).getByLabelText(/Price/));
    await u.type(within(dialog).getByLabelText(/Price/), '2600');
    await u.click(within(dialog).getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => { expect(notify).toHaveBeenCalledWith('Service saved.'); });
    await u.click(screen.getByRole('button', { name: 'Delete Drain unclogging' }));
    const confirm = await screen.findByRole('dialog', { name: 'Delete Drain unclogging?' });
    await u.click(within(confirm).getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => { expect(notify).toHaveBeenCalledWith('Service deleted.'); });
  });
  it('AC2: one service left → tap shows the tip; 20 services → Add disabled with help', async () => {
    signInAs('provider');
    const d = db();
    const mine = Object.values(d.services).filter((s) => s.providerId === 'p01');
    for (const s of mine.slice(1)) Reflect.deleteProperty(d.services, s.id);
    const view = renderRoute('/dashboard/services');
    const u = user();
    const only = mine[0]?.name ?? '';
    await u.click(await screen.findByRole('button', { name: `Delete ${only}` }));
    expect(await screen.findByText('You need at least one service.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: `Delete ${only}?` })).not.toBeInTheDocument();
    view.unmount();
    for (let i = 1; i < 20; i++) d.services[`x${String(i)}`] = { id: `x${String(i)}`, providerId: 'p01', name: `Extra ${String(i)}`, price: 5000, unit: 'fixed' };
    renderRoute('/dashboard/services');
    expect(await screen.findByRole('button', { name: 'Add service' })).toBeDisabled();
    expect(screen.getByText('You can list up to 20 services.')).toBeInTheDocument();
  });
  it('AC6: forced 500 keeps the dialog and values; forced services_min shows its copy', async () => {
    signInAs('provider');
    renderRoute('/dashboard/services');
    const u = user();
    await u.click(await screen.findByRole('button', { name: 'Edit Leak repair' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit service' });
    armForcedError('provider_service_update', '500');
    await u.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText("We couldn't save your changes. Check your connection and try again.")).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Service name/)).toHaveValue('Leak repair');
    await u.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await u.click(screen.getByRole('button', { name: 'Delete Leak repair' }));
    armForcedError('provider_service_delete', 'rule_services_min');
    const confirm = await screen.findByRole('dialog', { name: 'Delete Leak repair?' });
    await u.click(within(confirm).getByRole('button', { name: 'Delete' }));
    expect(await within(confirm).findByText('You need at least one service.')).toBeInTheDocument();
  });
  it('§6.7: closing a dirty dialog asks Discard changes?', async () => {
    signInAs('provider');
    renderRoute('/dashboard/services');
    const u = user();
    await u.click(await screen.findByRole('button', { name: 'Add service' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add service' });
    await u.type(within(dialog).getByLabelText(/Service name/), 'Gu');
    await u.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('dialog', { name: 'Discard changes?' })).toBeInTheDocument();
  });
  it('AC5: 390px → phone cards, no table', async () => {
    setViewportWidth(390);
    signInAs('provider');
    renderRoute('/dashboard/services');
    expect(await screen.findByRole('list', { name: 'Your services' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('from LKR 2,500 / hour')).toBeInTheDocument();
  });
});
```
If the `Price` label regex also matches another label in the dialog, use the exact label from `ServiceRowFields` (`Price`) with `{ selector: 'input' }`. If `setViewportWidth` must be called after `installMatchMedia`, check `src/test/setup.ts` (it installs it globally) and follow it.
**Verify:** `pnpm --filter @fixit/web test -- services-page` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S23 My Services page (M12-T16)"`

### T17 — Re-verify dialog
- [ ] done
**Files:** `src/features/provider-business/components/reverify-dialog.tsx`, `src/components/areas-picker.tsx`
**Context:** S24.E4; D-9.
**Do:**
1. `areas-picker.tsx`: change `const selectClass =` to `export const selectClass =` (T18 reuses it for the category select).
2. Create `reverify-dialog.tsx`:
```tsx
import { LoaderCircle } from 'lucide-react';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';

export function ReverifyDialog({
  open,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title="Save and re-verify?"
      description="Your Verified badge will be removed and your listing goes back to review. We'll email you when it's checked."
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" className="w-full sm:w-auto" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" disabled={pending} aria-busy={pending || undefined} onClick={onConfirm}>
            {pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />}
            {pending ? 'Saving…' : 'Save and re-verify'}
          </Button>
        </>
      }
    />
  );
}
```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S24 re-verify dialog (M12-T17)"`

### T18 — Business details form
- [ ] done
**Files:** `src/features/provider-business/components/business-details-form.tsx`
**Context:** S24.E3, S24 fields (= S19 step 1 + Category select); BR-21; D-1, D-2. Copy the field markup of `features/onboarding/components/step-business.tsx` (business name, bio with `{n} / 600`, years) — do not import from the onboarding feature.
**Do:** create:
```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  reverificationApplies,
  reverificationFor,
  reverifyWarning,
  UpdateBusinessForm,
  type CatalogResponse,
  type OwnProvider,
  type UpdateBusinessBody,
  type UpdateBusinessFormInput,
} from '@fixit/contracts';
import { selectClass } from '@/components/areas-picker';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { NoticeBanner } from '@/components/notice-banner';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { notify } from '@/lib/toast';
import { useUpdateBusiness } from '../hooks';
import { ReverifyDialog } from './reverify-dialog';

const valuesOf = (p: OwnProvider): UpdateBusinessFormInput => ({
  businessName: p.businessName ?? '',
  bio: p.bio ?? '',
  yearsExperience: p.yearsExperience === null ? '' : String(p.yearsExperience),
  categoryId: p.category?.id ?? '',
});

export function BusinessDetailsForm({
  own,
  catalog,
  onDirtyChange,
}: {
  own: OwnProvider;
  catalog: Pick<CatalogResponse, 'categories'>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const form = useForm<UpdateBusinessFormInput, unknown, UpdateBusinessBody>({
    resolver: zodResolver(UpdateBusinessForm),
    defaultValues: valuesOf(own),
  });
  const save = useUpdateBusiness();
  const [banner, setBanner] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<UpdateBusinessBody | null>(null);
  const { errors, isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const [businessName, categoryId, bio] = useWatch({ control: form.control, name: ['businessName', 'categoryId', 'bio'] });
  const applies = reverificationApplies(own.verificationStatus);
  const nameChanged = applies && businessName.trim() !== (own.businessName ?? '');
  const categoryChanged = applies && categoryId !== (own.category?.id ?? '');
  const before = { businessName: own.businessName, categoryId: own.category?.id ?? null };

  const run = async (body: UpdateBusinessBody) => {
    setBanner(null);
    try {
      const result = await save.mutateAsync(body);
      setConfirm(null);
      form.reset(valuesOf(result.provider));
      notify(result.reverification ? 'Saved. Your listing is back in review.' : 'Changes saved.');
    } catch (e) {
      setConfirm(null);
      setBanner(mapApiErrorToForm(e, form.setError));
    }
  };
  const submit = form.handleSubmit((body) => {
    if (reverificationFor({ status: own.verificationStatus, before, after: body }) !== null) setConfirm(body);
    else void run(body);
  });

  return (
    <section aria-labelledby="business-details" className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-5 sm:p-6">
      <h2 id="business-details" className="text-title-md text-text">Business details</h2>
      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
        {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
        <div className="flex flex-col gap-2">
          <FormField label="Business name" required error={errors.businessName?.message}>
            {(p) => <Input {...p} autoComplete="organization" {...form.register('businessName')} />}
          </FormField>
          {nameChanged && <NoticeBanner variant="warning">{reverifyWarning('business_name')}</NoticeBanner>}
        </div>
        <div className="flex flex-col gap-2">
          <FormField label="Category" required error={errors.categoryId?.message}>
            {(p) => (
              <select {...p} className={selectClass} {...form.register('categoryId')}>
                <option value="">Choose a category</option>
                {[...catalog.categories].sort((a, b) => a.order - b.order).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </FormField>
          {categoryChanged && <NoticeBanner variant="warning">{reverifyWarning('category')}</NoticeBanner>}
        </div>
        <FormField
          label="Short bio"
          required
          error={errors.bio?.message}
          labelAside={<span className="text-meta text-text-subtle">{bio.length} / 600</span>}
        >
          {(p) => <Textarea {...p} rows={5} {...form.register('bio')} />}
        </FormField>
        <FormField label="Years of experience" required error={errors.yearsExperience?.message}>
          {(p) => (
            <Input {...p} type="number" min={0} max={60} step={1} inputMode="numeric" className="sm:w-40" {...form.register('yearsExperience')} />
          )}
        </FormField>
        <div className="flex flex-col gap-0.5">
          <p className="text-label text-text font-semibold">Owner</p>
          <p className="text-body-sm text-text">{own.ownerName}</p>
          <Link to="/account" className="text-meta text-primary inline-flex min-h-11 items-center font-semibold sm:min-h-0">
            Change in Account settings
          </Link>
        </div>
        <SubmitButton pending={save.isPending && confirm === null} pendingLabel="Saving…" className="w-full sm:w-auto sm:self-start">
          Save changes
        </SubmitButton>
      </form>
      <ReverifyDialog
        open={confirm !== null}
        pending={save.isPending}
        onCancel={() => { setConfirm(null); }}
        onConfirm={() => { if (confirm) void run(confirm); }}
      />
    </section>
  );
}
```
States: default (prefilled), field errors (S19 copy + `Choose a category.`), inline warning under the changed field while Verified (decision 006), submitting (`Saving…`), re-verify confirm, server error (banner `We couldn't save your changes. Check your connection and try again.`, values kept, confirm closed). If `useWatch` with a `name` array doesn't return a tuple, use three separate `useWatch` calls.
**Verify:** `pnpm verify` green (behaviour tested in T19).
**Commit:** `git commit -m "feat(web): S24 business details form with BR-21 warning (M12-T18)"`

### T19 — S24 Business profile page
- [ ] done
**Files:** `src/features/provider-business/pages/business-profile-page.tsx`, `src/features/provider-business/pages/business-profile-page.test.tsx`, `src/app/chunks/provider.tsx`
**Context:** S24 layout, S24.E1; reuse `PhotoUploader` (it already has `Upload photo`/`Replace`/`Remove`, the `Remove your photo?` confirm and the `Photo removed.` toast) wired exactly like `step-photo.tsx` (`uploadPhoto`, `usePhotoCache`, `useRemovePhoto`); `useCatalog` from `@/features/site/hooks`. AC3, AC5, AC6.
**Do:**
1. Create `business-profile-page.tsx`:
```tsx
import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { Eye } from 'lucide-react';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { LoadingRegion } from '@/components/loading-region';
import { PhotoUploader } from '@/components/photo-uploader';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/features/site/hooks';
import { BusinessDetailsForm } from '../components/business-details-form';
import { uploadPhoto, useOwnProvider, usePhotoCache, useRemovePhoto } from '../hooks';

export function BusinessProfilePage() {
  const own = useOwnProvider();
  const catalog = useCatalog();
  const setPhoto = usePhotoCache();
  const removePhoto = useRemovePhoto();
  const [dirty, setDirty] = useState(false);
  const onDirtyChange = useCallback((d: boolean) => { setDirty(d); }, []);
  const p = own.data ?? null;
  return (
    <div className="flex max-w-[720px] flex-col gap-5 sm:gap-7">
      <DiscardChangesGuard when={dirty} />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-title-lg text-text">Profile</h1>
          <p className="text-body-sm text-text-muted">How your business appears to customers.</p>
        </div>
        {p && (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to={`/providers/${p.id}`}>
              <Eye aria-hidden="true" />
              View public profile
            </Link>
          </Button>
        )}
      </header>
      {(own.isPending || catalog.isPending) && (
        <LoadingRegion loading skeleton={<><SkeletonSectionCard lines={3} /><SkeletonSectionCard lines={6} /></>} />
      )}
      {(own.isError || catalog.isError || own.data === null) && (
        <SectionError onRetry={() => { void own.refetch(); void catalog.refetch(); }} />
      )}
      {p && catalog.data && (
        <>
          <section id="photo" aria-labelledby="photo-title" className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
            <h2 id="photo-title" className="text-title-md text-text">Profile photo</h2>
            <PhotoUploader
              photoUrl={p.photoUrl}
              categoryIcon={p.category?.icon ?? null}
              upload={uploadPhoto}
              onUploaded={setPhoto}
              remove={() => removePhoto.mutateAsync()}
            />
          </section>
          <BusinessDetailsForm own={p} catalog={catalog.data} onDirtyChange={onDirtyChange} />
        </>
      )}
    </div>
  );
}
```
2. `chunks/provider.tsx`: replace the `BusinessProfilePage` placeholder with `export { BusinessProfilePage } from '@/features/provider-business/pages/business-profile-page';`.
States: loading (2 section skeletons), load error, data; photo none/uploading/uploaded/errors (from `PhotoUploader`); form states (T18). Phone (390): cards full width, header stacks, `View public profile` and `Save changes` full width.
**Test:** `business-profile-page.test.tsx`
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { authStore } from '@/lib/auth-store';
import { notify } from '@/lib/toast';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));
const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe('S24 Business profile', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC3: bio only → Changes saved. and no dialog', async () => {
    signInAs('provider');
    renderRoute('/dashboard/profile');
    const u = user();
    const bio = await screen.findByLabelText(/Short bio/);
    await u.type(bio, ' Weekend call-outs too.');
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    await vi.waitFor(() => { expect(notify).toHaveBeenCalledWith('Changes saved.'); });
    expect(screen.queryByRole('dialog', { name: 'Save and re-verify?' })).not.toBeInTheDocument();
  });
  it('AC3: rename while Verified → warning, confirm, back in review', async () => {
    signInAs('provider');
    renderRoute('/dashboard/profile');
    const u = user();
    const name = await screen.findByLabelText(/Business name/);
    await u.clear(name);
    await u.type(name, 'Bell Plumbing');
    expect(screen.getByText('Changing your business name removes your Verified badge until Fixit checks your documents again.')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    const dialog = await screen.findByRole('dialog', { name: 'Save and re-verify?' });
    await u.click(within(dialog).getByRole('button', { name: 'Save and re-verify' }));
    await vi.waitFor(() => { expect(notify).toHaveBeenCalledWith('Saved. Your listing is back in review.'); });
    await vi.waitFor(() => { expect(authStore.getState().me?.provider?.verificationStatus).toBe('pending_review'); });
  });
  it('AC3: category change → category warning and confirm', async () => {
    signInAs('provider');
    renderRoute('/dashboard/profile');
    const u = user();
    await u.selectOptions(await screen.findByLabelText(/Category/), 'handyman');
    expect(screen.getByText('Changing your category removes your Verified badge until Fixit checks your documents again.')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('dialog', { name: 'Save and re-verify?' })).toBeInTheDocument();
  });
  it('Hank (not submitted): rename saves without warning or dialog', async () => {
    signInAs('providerNotSubmitted');
    renderRoute('/dashboard/profile');
    const u = user();
    const name = await screen.findByLabelText(/Business name/);
    await u.type(name, ' Co');
    expect(screen.queryByText(/removes your Verified badge/)).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    await vi.waitFor(() => { expect(notify).toHaveBeenCalledWith('Changes saved.'); });
  });
  it('AC3: remove photo → Remove your photo? → Photo removed.', async () => {
    const p = db().providers.p01;
    if (p) p.photoKey = 'p01-test';
    signInAs('provider');
    renderRoute('/dashboard/profile');
    const u = user();
    await u.click(await screen.findByRole('button', { name: 'Remove' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove your photo?' });
    await u.click(within(dialog).getByRole('button', { name: 'Remove' }));
    await vi.waitFor(() => { expect(notify).toHaveBeenCalledWith('Photo removed.'); });
    expect(await screen.findByRole('button', { name: 'Upload photo' })).toBeInTheDocument();
  });
  it('AC6: forced 500 keeps values and shows the banner', async () => {
    signInAs('provider');
    renderRoute('/dashboard/profile');
    const u = user();
    const bio = await screen.findByLabelText(/Short bio/);
    await u.type(bio, ' More.');
    armForcedError('provider_business_update', '500');
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText("We couldn't save your changes. Check your connection and try again.")).toBeInTheDocument();
    expect((bio as HTMLTextAreaElement).value.endsWith(' More.')).toBe(true);
  });
  it('§6.7: leaving a dirty form asks Discard changes?', async () => {
    signInAs('provider');
    const view = renderRoute('/dashboard/profile');
    await user().type(await screen.findByLabelText(/Short bio/), ' x');
    void view.router.navigate('/dashboard');
    expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
  });
});
```
If the photo `Remove` button and the confirm's `Remove` button clash in `getByRole`, scope the first lookup with `within(screen.getByRole('region', { name: 'Profile photo' }))`.
**Verify:** `pnpm --filter @fixit/web test -- business-profile-page` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S24 business profile page (M12-T19)"`

### T20 — S25 Service areas page
- [ ] done
**Files:** `src/features/provider-business/components/areas-form.tsx`, `src/features/provider-business/pages/service-areas-page.tsx`, `src/features/provider-business/pages/service-areas-page.test.tsx`, `src/app/chunks/provider.tsx`
**Context:** S25; A25; reuse `AreasPicker` (it already unticks the new base town and shows `{n} of 9 selected` and the 9-town limit) wired like `features/onboarding/components/step-areas.tsx`. AC4, AC5, AC6.
**Do:**
1. Create `areas-form.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AreasBody, type AreasFormInput, type CatalogResponse, type OwnProvider } from '@fixit/contracts';
import { AreasPicker } from '@/components/areas-picker';
import { FormErrorBanner } from '@/components/form-error-banner';
import { SubmitButton } from '@/components/submit-button';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { notify } from '@/lib/toast';
import { useSaveAreas } from '../hooks';

const valuesOf = (p: OwnProvider): AreasFormInput => ({
  baseTownId: p.baseTown?.id ?? '',
  otherTownIds: p.otherTowns.map((t) => t.id),
});

export function AreasForm({
  own,
  catalog,
  onDirtyChange,
}: {
  own: OwnProvider;
  catalog: Pick<CatalogResponse, 'districts' | 'towns'>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const form = useForm<AreasFormInput, unknown, AreasBody>({ resolver: zodResolver(AreasBody), defaultValues: valuesOf(own) });
  const save = useSaveAreas();
  const [banner, setBanner] = useState<string | null>(null);
  const baseTownId = useWatch({ control: form.control, name: 'baseTownId' });
  const otherTownIds = useWatch({ control: form.control, name: 'otherTownIds' });
  const { errors, isDirty, isSubmitted } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const submit = form.handleSubmit(async (v) => {
    setBanner(null);
    try {
      const saved = await save.mutateAsync(v);
      form.reset(valuesOf(saved));
      notify('Service areas saved.');
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError));
    }
  });
  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="border-border bg-surface flex flex-col gap-6 rounded-2xl border p-5 sm:p-6">
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <AreasPicker
        catalog={catalog}
        value={{ baseTownId, otherTownIds }}
        onChange={(v) => {
          form.setValue('baseTownId', v.baseTownId, { shouldDirty: true, shouldValidate: isSubmitted });
          form.setValue('otherTownIds', v.otherTownIds, { shouldDirty: true, shouldValidate: isSubmitted });
        }}
        errors={{ baseTownId: errors.baseTownId?.message, otherTownIds: errors.otherTownIds?.message }}
      />
      <SubmitButton pending={save.isPending} pendingLabel="Saving…" className="w-full sm:w-auto sm:self-start">
        Save changes
      </SubmitButton>
    </form>
  );
}
```
2. Create `service-areas-page.tsx`:
```tsx
import { useCallback, useState } from 'react';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { useCatalog } from '@/features/site/hooks';
import { AreasForm } from '../components/areas-form';
import { useOwnProvider } from '../hooks';

export function ServiceAreasPage() {
  const own = useOwnProvider();
  const catalog = useCatalog();
  const [dirty, setDirty] = useState(false);
  const onDirtyChange = useCallback((d: boolean) => { setDirty(d); }, []);
  return (
    <div className="flex max-w-[720px] flex-col gap-5 sm:gap-7">
      <DiscardChangesGuard when={dirty} />
      <header className="flex flex-col gap-1">
        <h1 className="text-title-lg text-text">Service areas</h1>
        <p className="text-body-sm text-text-muted">Customers in these towns can find and request you.</p>
      </header>
      {(own.isPending || catalog.isPending) && <LoadingRegion loading skeleton={<SkeletonSectionCard lines={8} />} />}
      {(own.isError || catalog.isError || own.data === null) && (
        <SectionError onRetry={() => { void own.refetch(); void catalog.refetch(); }} />
      )}
      {own.data && catalog.data && <AreasForm own={own.data} catalog={catalog.data} onDirtyChange={onDirtyChange} />}
      <p className="text-meta text-text-muted">{"Removing a town doesn't affect requests you've already received."}</p>
    </div>
  );
}
```
3. `chunks/provider.tsx`: replace the `ServiceAreasPage` placeholder with `export { ServiceAreasPage } from '@/features/provider-business/pages/service-areas-page';` and delete the now-unused placeholder functions (keep `ProviderReviewsPage` and `ProviderSettingsPage` and the `PlaceholderScreen` import).
States: loading, load error, default, base-town untick, 9-town limit, submitting (`Saving…`), server error banner, dirty discard. Phone (390): checkboxes 1 column with `min-h-11` rows (from `AreasPicker`), Save full width.
**Test:** `service-areas-page.test.tsx`
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { notify } from '@/lib/toast';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));
const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe('S25 Service areas', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC4: new base town is unticked from others; save → toast and db updated', async () => {
    signInAs('provider');
    renderRoute('/dashboard/areas');
    const u = user();
    expect(await screen.findByText('4 of 9 selected')).toBeInTheDocument();
    await u.selectOptions(screen.getByLabelText(/Base town/), 'moratuwa');
    expect(screen.getByText('3 of 9 selected')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Moratuwa' })).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    await vi.waitFor(() => { expect(notify).toHaveBeenCalledWith('Service areas saved.'); });
    expect(db().areas.find((a) => a.providerId === 'p01' && a.isBase)?.townId).toBe('moratuwa');
  });
  it('AC6: forced 500 keeps the selection and shows the banner', async () => {
    signInAs('provider');
    renderRoute('/dashboard/areas');
    const u = user();
    await u.click(await screen.findByRole('checkbox', { name: 'Negombo' }));
    armForcedError('provider_areas_put', '500');
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText("We couldn't save your changes. Check your connection and try again.")).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Negombo' })).toBeChecked();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- service-areas-page` green; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S25 service areas page (M12-T20)"`

### T21 — Access tests for the M12 routes
- [ ] done
**Files:** `src/app/routes.test.tsx`
**Context:** AC7; D-12; SPEC §6.4.
**Do:** add to `routes.test.tsx` (reuse its existing imports/helpers; add any missing ones: `screen`, `renderRoute`, `signInAs`, `FIXED_NOW`):
```tsx
describe('M12 dashboard business routes', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it.each(['/dashboard/services', '/dashboard/profile', '/dashboard/areas'])(
    'Olivia on %s → /become-a-provider/1',
    async (path) => {
      signInAs('customer');
      const view = renderRoute(path);
      await vi.waitFor(() => { expect(view.router.state.location.pathname).toBe('/become-a-provider/1'); });
    },
  );
  it.each(['/dashboard/services', '/dashboard/profile', '/dashboard/areas'])('Admin on %s → S40', async (path) => {
    signInAs('admin');
    renderRoute(path);
    expect(await screen.findByRole('heading', { level: 1, name: /You don.t have access/ })).toBeInTheDocument();
  });
});
```
Use the S40 heading text exactly as the existing S40 test in this file asserts it; if no such assertion exists, open `ForbiddenPage` and use its H1.
**Verify:** `pnpm --filter @fixit/web test -- routes` green; `pnpm verify` green.
**Commit:** `git commit -m "test(web): access to M12 dashboard routes (M12-T21)"`

### T22 — M12 acceptance checks
- [ ] done
**Files:** this plan (tick boxes), `docs/milestones/M00-index.md` (only if a new idea came up: Ideas inbox)
**Do:** walk every acceptance criterion; record pass/fail next to each in the commit body. Any failure → STOP, write a blocker.
| AC | Check |
|---|---|
| 1 | `pnpm --filter @fixit/web test -- services-page providers-business` (AC1 cases). Manual: `pnpm dev:mock`, Marcus via dev panel, `/dashboard/services` at 1440: header + `Add service`, tile `Starting at` / `LKR 2,500 / hour`, table Service · Price · Unit · Shows as · edit/delete. Add `Gutter cleaning` 1500 per visit → toast `Service added.`, tile `LKR 1,500 / visit`; open `/providers/p01` and `/discover?cat=plumbing&loc=colombo` → `LKR 1,500` `/ visit` on the profile and the card. |
| 2 | `services-page` AC2 cases. Manual: duplicate, price 50, no unit messages; edit → `Service saved.`; delete → `Delete {name}?` → `Service deleted.`; delete down to 1 → tap the bin → `You need at least one service.`; DevPanel can't add 20 quickly → rely on the test. |
| 3 | `business-profile-page` cases + `providers-business` AC3. Manual: photo upload/replace/remove (`Remove your photo?` → `Photo removed.`); bio only → `Changes saved.`; rename → inline warning → `Save and re-verify?` → `Saved. Your listing is back in review.`; `/providers/p01` has no Verified badge; `/dashboard/verification` shows `We're checking your documents`; L3 banner #3 shows. DevPanel "Reset demo data", repeat with a category change. |
| 4 | `service-areas-page` + `providers-business` AC4. Manual: choose Negombo as base → it leaves the checkbox list; `{n} of 9 selected`; Save → `Service areas saved.`; `/discover?loc=negombo` lists Bell & Sons; untick Kesbewa, save, `/discover?loc=kesbewa` doesn't. |
| 5 | `services-page` AC5 case. Manual at 390 (DevTools): services as cards with 44×44 icon buttons; `Add service` full width under the header; dialogs as bottom sheets; Save buttons full width on S24/S25; area checkboxes 1 column, 44-high rows; `document.documentElement.scrollWidth === 390` on all three pages. Also check 800px (641–1023). |
| 6 | DevPanel latency `slow` → skeletons on each page. Tests: forced 500 in `services-page`, `business-profile-page`, `service-areas-page`; forced `rule_services_min` on delete in `services-page`. |
| 7 | `routes` M12 cases (Olivia → `/become-a-provider/1`, Admin → S40); `providers-business` AC7 (other provider's service PATCH → 404). |
| 8 | `pnpm --filter @fixit/contracts test -- pricing business` (lowest, tie order, BR-21 rule); `pnpm --filter @fixit/web test -- mocks/lib/business` (verified → pending_review with reason; pending_review/not_submitted/rejected → no change). |
Then run `pnpm verify` (green), tick T22, and commit.
**Verify:** all rows pass; `pnpm verify` green.
**Commit:** `git commit -m "chore: M12 acceptance checks (M12-T22)"`

## Checkpoints
- After T16: "Human: run `pnpm dev:mock`, sign in as Marcus, open `/dashboard/services` at 1440 and 390. Check the tile, the table/cards, add/edit/delete, the last-service tip and the bottom-sheet dialog."
- After T19: "Human: open `/dashboard/profile` at 1440 and 390; rename the business, confirm, then check `/providers/p01` (no badge), `/dashboard/verification` (Pending review) and the L3 banner. Reset demo data afterwards."
- After T20: "Human: open `/dashboard/areas` at 1440 and 390; change the base town, save, check `/discover?loc=<town>`."

## Blockers
(executor writes here; leave empty)

## Nice-to-haves (not tasks)
- Client-side duplicate-name check in the S23 dialog (today the 409 round-trip shows the message).
- Re-verification email `We're checking your documents again` (M17, out of scope here).
- M13 planner: the S31/S32 queue must show `Resubmission {n}` with `Business name changed` / `Category changed` from `trigger`; submissions created by D-3 already carry it.
- M17 planner: the API's `PATCH /me/provider/business` must lock the provider row and apply D-3 (status change, new submission, document copies) in one transaction; service writes recompute `startingPrice` in the same transaction (ARCH §7.7).
- Make `DataList` support a visually hidden header for non-`actions` columns so S23's `Actions` header can be sr-only.
