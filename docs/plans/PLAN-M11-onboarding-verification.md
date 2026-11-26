# PLAN-M11 — Onboarding & verification
Milestone: `docs/milestones/M11-onboarding-verification.md` · Start tag: `m11-start` · Verify-all: `pnpm verify`
Mock domains at start → end: all → all (`providers` gains 11 endpoints). **No backend in this milestone** (`apps/api` does not exist yet), so there are no Nest tasks and no authorization-matrix rows. The mocks apply roles through `mockEndpoint` (`access`), ownership through "my draft/listing" lookups (miss → 404), and the onboarding/verification rules through pure contracts functions, as the API will in M17.

Conventions for the executor (same as M10):
- T1 creates tag `m11-start` and branch `m11-onboarding-verification` from the current HEAD. One commit per task, using the message given, ending with the attribution lines from your session instructions.
- Run `pnpm format` before `pnpm verify` in every task. Code below may not be Prettier-exact.
- Code blocks are complete files unless the step says "add", "replace" or "edit". Tests import `describe/expect/it/vi` from `vitest` explicitly.
- Paths are under `apps/web/` unless they start with `packages/`, `docs/` or `/`. `@/` = `apps/web/src/`.
- Tailwind: only `sm` (≥641) and `lg` (≥1024) prefixes. Arbitrary **size/grid** values are allowed (`max-w-[720px]`, `size-[160px]`). Arbitrary colour values and lint-banned prefixes (`text-[`, `bg-[`, `border-[`, `shadow-[`, `ring-[`, `outline-[`) are not. Token classes used in this plan: `bg-surface bg-page bg-primary bg-primary-soft bg-danger-soft bg-surface-muted bg-placeholder-a text-text text-text-muted text-text-subtle text-primary text-danger-text text-success-text border-border border-border-strong border-border-control border-danger border-primary`, type scale `text-title-lg text-title-md text-title-sm text-body text-body-sm text-label text-meta text-caption`, radii `rounded-sm rounded-md rounded-lg rounded-xl rounded-2xl rounded-full` (r10/12/14/16/20), `shadow-xs`.
- Copy in backticks is SPEC copy, character for character.
- Time in tests: fixtures are seeded at `FIXED_NOW` (`@/test/fixed-now`). Every new test that calls handlers or renders a page uses `vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] })` in `beforeEach` and `vi.useRealTimers()` in `afterEach`.
- `exactOptionalPropertyTypes` is on: build optional keys with `...(x === undefined ? {} : { key: x })`.
- Toasts in page tests: `renderRoute` doesn't mount the Toaster. Mock `@/lib/toast` (`vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }))`) and assert `notify` was called with the exact message (M10 lesson).
- Use `qc.query(...)` not the deprecated `qc.fetchQuery`; use `SyntheticEvent`, not the deprecated `FormEvent` (M10 lessons).
- File inputs in tests: `userEvent.setup({ applyAccept: false, advanceTimers: vi.advanceTimersByTime })` so a `.docx` reaches our own validation instead of being filtered by user-event.
- If a library API differs from what the code assumes (React Router 7, TanStack Query 5, zod 4, react-hook-form 7, MSW 2, lucide-react names), **STOP** and write a blocker.

Planner's decisions the executor must follow:
- **D-1 Onboarding step number.** `OwnProvider.onboarding.step` (= `Me.provider.onboarding.step`) is the step the user should see next (1–5). Saving step *n* sets it to `max(step, n + 1)`, capped at 5. Saving step *n* > current step is refused `422 onboarding_incomplete` (no skipping). A published provider's step is 5.
- **D-2 Resume rule.** Entering `/become-a-provider/:step` from outside the wizard always redirects to the saved step (AC3: opening `/1` after step 3 shows step 4). In-wizard navigation (Back, Continue, the redirect itself) carries `location.state = { wizard: true }`; then any step ≤ the saved step is allowed and a higher one redirects to the saved step. A non-numeric or out-of-range `:step` redirects to the saved step. Pure function `resolveStep` (T19).
- **D-3 One endpoint, four bodies.** `PUT /me/provider/onboarding/:step` has no `body` in the registry because the body depends on `:step`. Handlers (and M17's controller) parse with `parseOnboardingBody(step, json)` from contracts. `:step` outside 1–4 → 404. Step 1 creates the draft when none exists. Writes after publish → `409 CONFLICT` with `details.rule = 'already_in_state'`. Unconfirmed email → `422 RULE_VIOLATION email_unconfirmed`.
- **D-4 Mobile on step 1.** When `me.mobile` is null, step 1 shows the S12 mobile field (required). On Continue the web first calls the existing `PATCH /me` (`useUpdateMe` api `updateMe({ mobile })`), then the step PUT, inside one mutation (one `Saving…`). Publish refuses `422 mobile_missing` if the mobile is still null.
- **D-5 Publish → done.** `POST /me/provider/publish` validates the stored draft with the step schemas and sets `onboardingComplete`, `publishedAt`, `startingPrice`. The web then navigates to `/become-a-provider/done` **without** touching the auth store; the done page calls `refreshMe(qc)` on mount. This avoids `RedirectPublishedProvider` bouncing step 5 to `/dashboard` before the done screen shows. `/become-a-provider/done` moves out of `RedirectPublishedProvider` (T31).
- **D-6 `Skip for now`.** A text button next to `Publish listing`, shown only while no photo is uploaded. It runs the same publish (photo is optional). SPEC gives no other behaviour.
- **D-7 Upload transport.** Uploads are `multipart/form-data` through the existing `http({ form, signal })`. Progress is an **indeterminate** bar (fetch has no upload progress); `Cancel` aborts the request with an `AbortController`. Real byte progress is a nice-to-have for M17.
- **D-8 Mock multipart.** jsdom's `FormData` is serialised as `[object FormData]` by Node's fetch, and undici's `request.formData()` rejects Node `File` parts under jsdom (verified while planning). So (a) `src/test/setup.ts` stubs `FormData`, `File` and `Blob` with Node's own classes and stubs `URL.createObjectURL/revokeObjectURL`, and (b) mock handlers read uploads with our small parser `readMultipart(request)` (T9), which works in the browser and in Node alike. Uploaded bytes live only in an in-memory `Map` (`mocks/lib/files.ts`); after a reload `GET /files/…` serves a 1×1 placeholder PNG (ARCH §4.3).
- **D-9 Thumbnails.** `<img>` can't send the bearer token, so S26 never points an `<img>` at `/api/files/documents/:id`. A just-picked image shows its local object URL; after a reload an image document shows a `FileImage` placeholder tile, a PDF shows `FileText`. The profile photo is public (`/api/files/photos/:key`) and uses a plain `<img>`.
- **D-10 Document staging.** Documents uploaded on S26 are *staged* (`submissionId = null`). `VerificationState.documents` = staged documents while editable (`not_submitted`, `rejected`), else the latest submission's documents. Uploading a type that already has a staged document replaces it. Submit attaches the staged documents to a new submission (attempt n+1). Per ARCH §8.1 "resubmission after rejection pre-stages copies of the previous files": the rejected fixture already has staged copies; **M13/M20's reject action must create them** (listed under nice-to-haves for the M13 planner; do not edit other milestone files).
- **D-11 Rejected fixture.** No rejected provider exists. T8 turns p10 (Grace Kim, Sparkle & Shine Cleaners, currently `not_submitted`, listed as "Not yet verified") into `rejected` with attempt 1 rejected + staged copies, and adds persona `providerRejected`. It stays listed and unverified, so Discover counts don't change. `MOCK_DB_VERSION` 5 → 6.
- **D-12 Client image checks.** Photo type and size are checked with `checkUpload` (contracts); dimensions with `readImageSize(file)` (`lib/image-size.ts`, `createImageBitmap`). If the image can't be decoded the type message is shown. The mock server checks type and size only (dimensions/magic bytes are M17).
- **D-13 Shared editors.** `ServicesRepeater` + `ServiceRowFields` (`components/services-editor.tsx`), `AreasPicker` (`components/areas-picker.tsx`) and `PhotoUploader` (`components/photo-uploader.tsx`) live in `src/components/` because M12's `provider-business` feature reuses them and S19 lives in the `onboarding` feature (CLAUDE.md: shared by 2+ features). `AgreedPriceInput` moves to `components/lkr-input.tsx` as `LkrInput` (T20) because the services editor needs the same prefixed input.
- **D-14 Service rows in the wizard.** Step 3 starts with one empty row when no services are saved; every row (also the last) has `Remove`, so `Add at least one service.` is reachable (AC2). The S23 "≥ 1 left" rule belongs to M12's page. New rows default to unit `per_hour`.
- **D-15 Copy not in SPEC.** S19 email gate body: `We sent a link to {email}. Confirm it, then come back to set up your listing.` (S12's card with the last clause adapted). Upload success of the photo shows no toast (SPEC gives none). Removing a staged document shows no toast and no confirm (SPEC gives none).
- **D-16 S26 dirty.** S26's discard guard is on while any slot is uploading or a file was uploaded during this visit and not yet submitted.
- **D-17 Banners.** `useAccountBanners(area)` gains the L3 provider rows #1 (rejected), #3 (badge removed, dismissible), #4 (not submitted), #5 (pending review, dismissible for the session) in SPEC §6.8 order before #6. `area = 'dashboard'` only (they're "Provider, L3"). Row #2 (pause) waits for F-22; row #7 (customer draft) is not in this milestone's scope (nice-to-have).

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `packages/contracts/src/providers/onboarding.ts` (+ test) | Create | step 1 fields/messages, `Step1Body`, `makeStep1Form`, `Step2Body`, `AreasBody`/`Step4Body`, `OnboardingStepParam`, `parseOnboardingBody`, `nextOnboardingStep` |
| `packages/contracts/src/providers/services.ts` (+ test) | Create | `ServiceBody`, `ServiceForm`, `ServicePriceText`, `Step3Body`, `Step3Form`, unique-name rule |
| `packages/contracts/src/providers/uploads.ts` (+ test) | Create | `UPLOAD_LIMITS`, `UPLOAD_COPY`, `checkUpload`, `DOCUMENT_MISSING`, `missingRequiredDocuments` |
| `packages/contracts/src/providers/own.ts` (+ test) | Create | `OwnProvider`, `PhotoResult`, `DocumentMeta`, `VerificationState`, `DocumentUploadFields`, `isVerificationEditable` |
| `packages/contracts/src/endpoints.ts` (+ test), `index.ts` | Modify | 11 registry entries, exports |
| `packages/fixtures/src/providers.ts`, `users.ts`, `build.test.ts` | Modify | p10 rejected, persona |
| `src/mocks/db/schema.ts`, `src/mocks/db/store.test.ts` | Modify | `MOCK_DB_VERSION = 6` |
| `src/test/setup.ts` | Modify | Node FormData/File/Blob + object URL stubs |
| `src/mocks/lib/multipart.ts` (+ test), `src/mocks/lib/files.ts` | Create | multipart parser, in-memory files |
| `src/mocks/lib/endpoint.ts` (+ test) | Modify | `mockFileEndpoint` |
| `src/mocks/lib/own-provider.ts` (+ test) | Create | draft lookup, `toOwnProvider`, `applyOnboardingStep`, `publishDraft` |
| `src/mocks/lib/verification.ts` (+ test) | Create | `verificationStateOf`, `stageDocument`, `submitVerification` |
| `src/mocks/handlers/providers.ts` (+ `providers-onboarding.test.ts`, `providers-verification.test.ts`) | Modify/Create | 11 handlers |
| `src/lib/query-keys.ts`, `src/lib/format.ts` (+ test) | Modify | `ownProvider`, `verification`; `formatFileSize` |
| `src/lib/image-size.ts`, `src/lib/use-upload.ts` (+ test), `src/lib/upload-errors.ts` (+ test) | Create | image dimensions, upload state hook, error copy |
| `src/features/provider-business/api.ts`, `hooks.ts` (+ `hooks.test.tsx`) | Create | own provider, photo, verification hooks |
| `src/features/onboarding/api.ts`, `hooks.ts` (+ `hooks.test.tsx`), `step-route.ts` (+ test), `steps.ts` | Create | step save, publish, resume rule, step titles |
| `src/components/lkr-input.tsx` | Move | from `provider-dashboard/components/agreed-price-input.tsx` |
| `src/components/services-editor.tsx` (+ test), `areas-picker.tsx` (+ test), `photo-uploader.tsx` (+ test) | Create | shared editors |
| `src/features/onboarding/components/*.tsx` | Create | wizard frame, steps 1–5, email gate |
| `src/features/onboarding/pages/become-provider-page.tsx` (+ test), `done-page.tsx` (+ test) | Create | S19 |
| `src/features/provider-business/components/{document-slot,verification-status-card,submitted-documents}.tsx` | Create | S26 parts |
| `src/features/provider-business/pages/verification-page.tsx` (+ test) | Create | S26 |
| `src/app/chunks/onboarding.tsx`, `chunks/provider.tsx`, `routes.tsx`, `routes.test.tsx` | Modify | wiring |
| `src/app/layouts/parts/use-account-banners.tsx` (+ test), `dashboard-shell.tsx`, `public-layout.tsx` | Modify | §6.8 provider banners |

## Tasks

### T1 — Step 1, 2 and 4 schemas
- [x] done
**Files:** `packages/contracts/src/providers/onboarding.ts`, `packages/contracts/src/providers/onboarding.test.ts`, `packages/contracts/src/index.ts`
**Context:** SPEC S19 field table; S25 (areas rules); BR-13, BR-14, BR-23; D-1, D-3, D-4. `MobileInput`, `MOBILE_MESSAGE`, `Id` in `common/primitives.ts`.
**Do:**
1. `git tag m11-start && git checkout -b m11-onboarding-verification`.
2. Create `packages/contracts/src/providers/onboarding.ts`:
```ts
import { z } from 'zod';
import { Id, MobileInput } from '../common/primitives';

/* ---------- SPEC S19 copy (written once) ---------- */
export const BUSINESS_NAME_EMPTY = 'Enter your business name.';
export const BUSINESS_NAME_LENGTH = 'Business name must be 2 to 60 characters.';
export const BIO_SHORT = 'Tell customers about your business in at least 30 characters.';
export const BIO_LONG = 'Keep your bio under 600 characters.';
export const YEARS_MESSAGE = 'Enter a number from 0 to 60.';
export const CATEGORY_MESSAGE = 'Choose a category.';
export const BASE_TOWN_MESSAGE = 'Choose your base town.';
export const OTHER_TOWNS_MAX = 9;
export const OTHER_TOWNS_MAX_MESSAGE = 'You can add up to 9 other towns.';
export const BIO_MAX = 600;
export const ONBOARDING_STEPS = 5;

export const BusinessName = z
  .string()
  .trim()
  .min(1, BUSINESS_NAME_EMPTY)
  .min(2, BUSINESS_NAME_LENGTH)
  .max(60, BUSINESS_NAME_LENGTH);
export const Bio = z.string().trim().min(30, BIO_SHORT).max(BIO_MAX, BIO_LONG);
export const YearsExperience = z
  .number({ error: YEARS_MESSAGE })
  .int(YEARS_MESSAGE)
  .min(0, YEARS_MESSAGE)
  .max(60, YEARS_MESSAGE);
/** Form text → integer 0–60. '', '3.5', '-1', 'abc' fail with the SPEC message. */
export const YearsText = z.string().transform((raw, ctx): number => {
  const s = raw.trim();
  const parsed = YearsExperience.safeParse(/^\d+$/.test(s) ? Number(s) : Number.NaN);
  if (!parsed.success) {
    ctx.addIssue({ code: 'custom', message: YEARS_MESSAGE });
    return z.NEVER;
  }
  return parsed.data;
});

/** PUT /me/provider/onboarding/1 (A21). The mobile goes through PATCH /me (D-4). */
export const OnboardingStep1Body = z.object({
  businessName: BusinessName,
  bio: Bio,
  yearsExperience: YearsExperience,
});
export type OnboardingStep1Body = z.infer<typeof OnboardingStep1Body>;

/** S19 step 1 form. `mobile` is validated only when the account has none (BR-23). */
export function makeStep1Form(needsMobile: boolean) {
  const mobile: z.ZodType<string | undefined, string> = needsMobile
    ? MobileInput
    : z.string().transform((): string | undefined => undefined);
  return z.object({ businessName: BusinessName, bio: Bio, yearsExperience: YearsText, mobile });
}
export type Step1FormInput = z.input<ReturnType<typeof makeStep1Form>>;
export type Step1FormOutput = z.output<ReturnType<typeof makeStep1Form>>;

/** PUT /me/provider/onboarding/2 (BR-13). The server also checks the category is active. */
export const OnboardingStep2Body = z.object({
  categoryId: z.string({ error: CATEGORY_MESSAGE }).min(1, CATEGORY_MESSAGE).pipe(Id),
});
export type OnboardingStep2Body = z.infer<typeof OnboardingStep2Body>;

/** S19 step 4 and S25 (BR-14). Duplicates and the base town are removed from `otherTownIds`. */
export const AreasBody = z
  .object({
    baseTownId: z.string({ error: BASE_TOWN_MESSAGE }).min(1, BASE_TOWN_MESSAGE).pipe(Id),
    otherTownIds: z.array(Id).max(OTHER_TOWNS_MAX, OTHER_TOWNS_MAX_MESSAGE),
  })
  .transform((v) => ({
    baseTownId: v.baseTownId,
    otherTownIds: [...new Set(v.otherTownIds)].filter((id) => id !== v.baseTownId),
  }));
export type AreasBody = z.output<typeof AreasBody>;
export type AreasFormInput = z.input<typeof AreasBody>;
export const OnboardingStep4Body = AreasBody;
export type OnboardingStep4Body = AreasBody;

/** `:step` of PUT /me/provider/onboarding/:step. Anything else → 404 (D-3). */
export const OnboardingStepParam = z.coerce.number().int().min(1).max(4);
export type OnboardingStepParam = 1 | 2 | 3 | 4;

/** D-1: the step to show after saving `saved`, capped at 5. */
export const nextOnboardingStep = (current: number, saved: number): number =>
  Math.min(ONBOARDING_STEPS, Math.max(current, saved + 1));
```
3. Append to `packages/contracts/src/index.ts`: `export * from './providers/onboarding';`
**Test:** `packages/contracts/src/providers/onboarding.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import {
  AreasBody,
  makeStep1Form,
  nextOnboardingStep,
  OnboardingStep2Body,
  OnboardingStepParam,
} from './onboarding';

const messages = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path.join('.'), i.message]));

describe('step 1 form', () => {
  const valid = { businessName: 'Martinez Home Fix', bio: 'x'.repeat(30), yearsExperience: '4', mobile: '' };
  it('parses valid input; years become a number; mobile ignored when not needed', () => {
    expect(makeStep1Form(false).parse(valid)).toEqual({ ...valid, yearsExperience: 4, mobile: undefined });
  });
  it('SPEC messages', () => {
    const r = makeStep1Form(false).safeParse({ businessName: ' ', bio: 'short', yearsExperience: '', mobile: '' });
    expect(messages(r)).toEqual({
      businessName: 'Enter your business name.',
      bio: 'Tell customers about your business in at least 30 characters.',
      yearsExperience: 'Enter a number from 0 to 60.',
    });
    expect(messages(makeStep1Form(false).safeParse({ ...valid, businessName: 'A' }))).toEqual({
      businessName: 'Business name must be 2 to 60 characters.',
    });
    expect(messages(makeStep1Form(false).safeParse({ ...valid, bio: 'x'.repeat(601) }))).toEqual({
      bio: 'Keep your bio under 600 characters.',
    });
    for (const y of ['61', '-1', '2.5', 'abc'])
      expect(messages(makeStep1Form(false).safeParse({ ...valid, yearsExperience: y }))).toEqual({
        yearsExperience: 'Enter a number from 0 to 60.',
      });
  });
  it('mobile required and normalised when needed', () => {
    expect(messages(makeStep1Form(true).safeParse(valid))).toEqual({
      mobile: 'Enter a Sri Lankan mobile number, like 077 123 4567.',
    });
    expect(makeStep1Form(true).parse({ ...valid, mobile: '077 123 4567' }).mobile).toBe('+94771234567');
  });
});

describe('step 2 and areas', () => {
  it('category required', () => {
    expect(messages(OnboardingStep2Body.safeParse({ categoryId: '' }))).toEqual({ categoryId: 'Choose a category.' });
    expect(messages(OnboardingStep2Body.safeParse({}))).toEqual({ categoryId: 'Choose a category.' });
  });
  it('base town required; others ≤ 9; base and duplicates removed', () => {
    expect(messages(AreasBody.safeParse({ baseTownId: '', otherTownIds: [] }))).toEqual({
      baseTownId: 'Choose your base town.',
    });
    expect(
      messages(AreasBody.safeParse({ baseTownId: 'a', otherTownIds: Array.from({ length: 10 }, (_, i) => `t${String(i)}`) })),
    ).toEqual({ otherTownIds: 'You can add up to 9 other towns.' });
    expect(AreasBody.parse({ baseTownId: 'a', otherTownIds: ['b', 'a', 'b'] })).toEqual({
      baseTownId: 'a',
      otherTownIds: ['b'],
    });
  });
});

describe('step param and next step', () => {
  it('1–4 only', () => {
    expect(OnboardingStepParam.parse('3')).toBe(3);
    for (const bad of ['0', '5', 'x', '1.5']) expect(OnboardingStepParam.safeParse(bad).success).toBe(false);
  });
  it('advances, never goes back, caps at 5', () => {
    expect(nextOnboardingStep(1, 1)).toBe(2);
    expect(nextOnboardingStep(4, 2)).toBe(4);
    expect(nextOnboardingStep(5, 4)).toBe(5);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test -- onboarding` → all pass; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): onboarding step 1/2/4 schemas (M11-T1)"`

### T2 — Service schemas (step 3, shared with S23)
- [x] done
**Files:** `packages/contracts/src/providers/services.ts`, `packages/contracts/src/providers/services.test.ts`, `packages/contracts/src/index.ts`
**Context:** SPEC S23 field table, S19 step 3; BR-14; ARCH §2.5 `ServiceBody` excerpt (this task creates it); D-14. `PriceUnit` in `common/enums.ts`. The text-to-number pattern copies `AgreedPriceText` (`requests/provider-bodies.ts`).
**Do:**
1. Create `packages/contracts/src/providers/services.ts`:
```ts
import { z } from 'zod';
import { PriceUnit } from '../common/enums';

export const SERVICE_NAME_EMPTY = 'Enter a service name.';
export const SERVICE_NAME_LENGTH = 'Service name must be 2 to 60 characters.';
export const SERVICE_NAME_TAKEN = 'You already have a service with this name.';
export const SERVICE_PRICE_MESSAGE = 'Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.';
export const SERVICE_UNIT_MESSAGE = 'Choose how this price is charged.';
export const SERVICES_MIN_MESSAGE = 'Add at least one service.';
export const SERVICES_MAX = 20;
export const SERVICES_MAX_MESSAGE = 'You can list up to 20 services.';

export const ServiceName = z
  .string()
  .trim()
  .min(1, SERVICE_NAME_EMPTY)
  .min(2, SERVICE_NAME_LENGTH)
  .max(60, SERVICE_NAME_LENGTH);
export const ServicePrice = z
  .number({ error: SERVICE_PRICE_MESSAGE })
  .int(SERVICE_PRICE_MESSAGE)
  .min(100, SERVICE_PRICE_MESSAGE)
  .max(1_000_000, SERVICE_PRICE_MESSAGE);
/** Form text → whole LKR. Spaces and thousands commas are ignored ('2,500' → 2500). */
export const ServicePriceText = z.string().transform((raw, ctx): number => {
  const s = raw.replace(/[\s,]/g, '');
  const parsed = ServicePrice.safeParse(/^\d+$/.test(s) ? Number(s) : Number.NaN);
  if (!parsed.success) {
    ctx.addIssue({ code: 'custom', message: SERVICE_PRICE_MESSAGE });
    return z.NEVER;
  }
  return parsed.data;
});
export const ServiceUnit = z.enum(PriceUnit.options, { error: SERVICE_UNIT_MESSAGE });

/** POST/PATCH /me/provider/services (M12) and each row of step 3. */
export const ServiceBody = z.object({ name: ServiceName, price: ServicePrice, unit: ServiceUnit });
export type ServiceBody = z.infer<typeof ServiceBody>;
/** One editor row (S19 step 3, S23 dialog). */
export const ServiceForm = z.object({ name: ServiceName, price: ServicePriceText, unit: ServiceUnit });
export type ServiceFormInput = z.input<typeof ServiceForm>;

/** Case-insensitive duplicate names → issue on every later duplicate's `name`. */
export function addDuplicateNameIssues(rows: readonly { name: string }[], ctx: z.RefinementCtx): void {
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const key = row.name.trim().toLowerCase();
    if (seen.has(key)) ctx.addIssue({ code: 'custom', path: [i, 'name'], message: SERVICE_NAME_TAKEN });
    seen.add(key);
  });
}

const servicesArray = <T extends z.ZodType<{ name: string }>>(row: T) =>
  z.array(row).min(1, SERVICES_MIN_MESSAGE).max(SERVICES_MAX, SERVICES_MAX_MESSAGE).superRefine(addDuplicateNameIssues);

/** PUT /me/provider/onboarding/3: replaces the draft's services. */
export const OnboardingStep3Body = z.object({ services: servicesArray(ServiceBody) });
export type OnboardingStep3Body = z.infer<typeof OnboardingStep3Body>;
export const Step3Form = z.object({ services: servicesArray(ServiceForm) });
export type Step3FormInput = z.input<typeof Step3Form>;
/** Shape every form that hosts `ServicesRepeater` / `ServiceRowFields` uses (D-13). */
export type ServicesFormValues = Step3FormInput;
```
   If TypeScript rejects the generic `servicesArray` (zod 4 `ZodType` input/output variance), replace it with two explicit `z.array(...)…superRefine(addDuplicateNameIssues)` chains; behaviour must be identical.
2. Append to `index.ts`: `export * from './providers/services';`
**Test:** `packages/contracts/src/providers/services.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { OnboardingStep3Body, ServiceForm, Step3Form } from './services';

const paths = (r: { error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  (r.error?.issues ?? []).map((i) => `${i.path.join('.')}: ${i.message}`);

describe('service schemas', () => {
  it('row: text price parsed, SPEC messages', () => {
    expect(ServiceForm.parse({ name: ' Leak repair ', price: '2,500', unit: 'per_hour' })).toEqual({
      name: 'Leak repair',
      price: 2500,
      unit: 'per_hour',
    });
    expect(paths(ServiceForm.safeParse({ name: '', price: '99', unit: 'weekly' }))).toEqual([
      'name: Enter a service name.',
      'price: Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.',
      'unit: Choose how this price is charged.',
    ]);
    expect(paths(ServiceForm.safeParse({ name: 'A', price: '1000001', unit: 'fixed' }))).toEqual([
      'name: Service name must be 2 to 60 characters.',
      'price: Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.',
    ]);
    expect(ServiceForm.safeParse({ name: 'Ok name', price: '2.5', unit: 'fixed' }).success).toBe(false);
  });
  it('list: 1–20, unique names (case-insensitive)', () => {
    expect(paths(Step3Form.safeParse({ services: [] }))).toEqual(['services: Add at least one service.']);
    const row = (name: string) => ({ name, price: 500, unit: 'per_visit' as const });
    expect(paths(OnboardingStep3Body.safeParse({ services: Array.from({ length: 21 }, (_, i) => row(`S${String(i)}x`)) }))).toEqual([
      'services: You can list up to 20 services.',
    ]);
    expect(paths(OnboardingStep3Body.safeParse({ services: [row('Leak repair'), row('leak REPAIR ')] }))).toEqual([
      'services.1.name: You already have a service with this name.',
    ]);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test -- services` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): service body and step 3 schemas (M11-T2)"`

### T3 — Upload limits and document rules
- [x] done
**Files:** `packages/contracts/src/providers/uploads.ts`, `packages/contracts/src/providers/uploads.test.ts`, `packages/contracts/src/index.ts`
**Context:** BR-17; SPEC S24.E1/E2, S26 field table, §6.3 "Upload failed", §8.7; ARCH §3.3 photo/doc rows.
**Do:**
1. Create `uploads.ts`:
```ts
import type { DocumentType } from '../common/enums';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOAD_LIMITS = {
  maxBytes: MAX_UPLOAD_BYTES,
  photo: { mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], minPx: 400 },
  document: { mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
} as const;
export type UploadKind = 'photo' | 'document';

export const UPLOAD_COPY = {
  photo: {
    type: 'Use a JPG, PNG or WebP image.',
    size: 'Image must be 5 MB or smaller.',
    dimensions: 'Image must be at least 400 × 400 pixels.',
    help: 'JPG, PNG or WebP, at least 400 × 400 px, up to 5 MB. We crop it to a square.',
  },
  document: {
    type: 'Use a JPG, PNG or PDF file.',
    size: 'File must be 5 MB or smaller.',
    help: 'JPG, PNG or PDF, up to 5 MB',
  },
  failed: 'Upload failed. Check your connection and try again.',
} as const;

export type UploadProblem = 'type' | 'size';
/** Type first, then size. Shared by the web pickers and the upload handlers. */
export function checkUpload(kind: UploadKind, file: { mimeType: string; sizeBytes: number }): UploadProblem | null {
  const types: readonly string[] = UPLOAD_LIMITS[kind].mimeTypes;
  if (!types.includes(file.mimeType)) return 'type';
  if (file.sizeBytes > MAX_UPLOAD_BYTES) return 'size';
  return null;
}

export const REQUIRED_DOCUMENTS = ['nic_front', 'nic_back'] as const satisfies readonly DocumentType[];
export const DOCUMENT_MISSING: Record<(typeof REQUIRED_DOCUMENTS)[number], string> = {
  nic_front: 'Upload the front of your NIC.',
  nic_back: 'Upload the back of your NIC.',
};
/** BR-17: required types that have no document, in slot order. */
export function missingRequiredDocuments(types: readonly DocumentType[]): (typeof REQUIRED_DOCUMENTS)[number][] {
  return REQUIRED_DOCUMENTS.filter((t) => !types.includes(t));
}
```
2. Append `export * from './providers/uploads';` to `index.ts`.
**Test:** `uploads.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { checkUpload, missingRequiredDocuments, MAX_UPLOAD_BYTES } from './uploads';

describe('uploads', () => {
  it('documents: JPG/PNG/PDF ≤ 5 MB', () => {
    expect(checkUpload('document', { mimeType: 'application/pdf', sizeBytes: MAX_UPLOAD_BYTES })).toBeNull();
    expect(checkUpload('document', { mimeType: 'image/webp', sizeBytes: 10 })).toBe('type');
    expect(
      checkUpload('document', {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 10,
      }),
    ).toBe('type');
    expect(checkUpload('document', { mimeType: 'image/png', sizeBytes: 6 * 1024 * 1024 })).toBe('size');
  });
  it('photos: JPG/PNG/WebP, type before size', () => {
    expect(checkUpload('photo', { mimeType: 'image/webp', sizeBytes: 1 })).toBeNull();
    expect(checkUpload('photo', { mimeType: 'application/pdf', sizeBytes: 9e9 })).toBe('type');
    expect(checkUpload('photo', { mimeType: '', sizeBytes: 1 })).toBe('type');
  });
  it('missing NIC sides', () => {
    expect(missingRequiredDocuments([])).toEqual(['nic_front', 'nic_back']);
    expect(missingRequiredDocuments(['nic_front', 'trade_certificate'])).toEqual(['nic_back']);
    expect(missingRequiredDocuments(['nic_back', 'nic_front'])).toEqual([]);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test -- uploads`; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): upload limits and document rules (M11-T3)"`

### T4 — OwnProvider, VerificationState and onboarding body parser
- [x] done
**Files:** `packages/contracts/src/providers/own.ts`, `packages/contracts/src/providers/own.test.ts`, `packages/contracts/src/index.ts`
**Context:** ARCH §3.3 `GET /me/provider`, `PUT /me/provider/photo` → `{photoUrl}`, verification rows; `Me.provider` (auth/schemas.ts) — the same onboarding/verification fields; D-3, D-10. `catalog/schemas.ts` imports `providers/schemas.ts`, so these live in a new file that imports catalog (no cycle).
**Do:**
1. Create `own.ts`:
```ts
import { z } from 'zod';
import { Category, StartingPrice, TownRef } from '../catalog/schemas';
import { DocumentType, ReverificationReason, VerificationStatus } from '../common/enums';
import { Id, IsoDateTime } from '../common/primitives';
import { OnboardingStep1Body, OnboardingStep2Body, OnboardingStep4Body, type OnboardingStepParam } from './onboarding';
import { Service } from './schemas';
import { OnboardingStep3Body } from './services';

/** GET /me/provider: the caller's draft or listing (S19, S23–S26). Draft fields are null until their step is saved. */
export const OwnProvider = z.object({
  id: Id,
  ownerName: z.string(),
  businessName: z.string().nullable(),
  bio: z.string().nullable(),
  yearsExperience: z.number().int().nullable(),
  category: Category.pick({ id: true, name: true, icon: true }).nullable(),
  services: z.array(Service),
  baseTown: TownRef.nullable(),
  otherTowns: z.array(TownRef), // alphabetical
  photoUrl: z.string().nullable(),
  onboarding: z.object({ complete: z.boolean(), step: z.number().int().min(1).max(5) }),
  publishedAt: IsoDateTime.nullable(),
  verificationStatus: VerificationStatus,
  verifiedAt: IsoDateTime.nullable(),
  reverificationReason: ReverificationReason.nullable(),
  rejectionReason: z.string().nullable(),
  paused: z.boolean(),
  startingPrice: StartingPrice.nullable(),
});
export type OwnProvider = z.infer<typeof OwnProvider>;

export const PhotoResult = z.object({ photoUrl: z.string() });
export type PhotoResult = z.infer<typeof PhotoResult>;

export const DocumentMeta = z.object({
  id: Id,
  type: DocumentType,
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  url: z.string(), // /api/files/documents/:id (owner or admin only)
  createdAt: IsoDateTime,
});
export type DocumentMeta = z.infer<typeof DocumentMeta>;

/** GET /me/provider/verification (S26). `documents`: staged while editable, else the latest submission's (D-10). */
export const VerificationState = z.object({
  status: VerificationStatus,
  editable: z.boolean(),
  verifiedAt: IsoDateTime.nullable(),
  rejectionReason: z.string().nullable(),
  documents: z.array(DocumentMeta),
});
export type VerificationState = z.infer<typeof VerificationState>;

/** Text fields of the multipart POST …/verification/documents (the `file` part is checked with `checkUpload`). */
export const DocumentUploadFields = z.object({ type: DocumentType });

export const isVerificationEditable = (s: VerificationStatus): boolean => s === 'not_submitted' || s === 'rejected';

export type OnboardingBody =
  | { step: 1; body: OnboardingStep1Body }
  | { step: 2; body: OnboardingStep2Body }
  | { step: 3; body: OnboardingStep3Body }
  | { step: 4; body: OnboardingStep4Body };
/** D-3: the body schema depends on `:step`. Throws ZodError (→ 400 VALIDATION_FAILED) on a bad body. */
export function parseOnboardingBody(step: OnboardingStepParam, raw: unknown): OnboardingBody {
  switch (step) {
    case 1:
      return { step, body: OnboardingStep1Body.parse(raw) };
    case 2:
      return { step, body: OnboardingStep2Body.parse(raw) };
    case 3:
      return { step, body: OnboardingStep3Body.parse(raw) };
    case 4:
      return { step, body: OnboardingStep4Body.parse(raw) };
  }
}
```
   `OnboardingStepParam` parses to `number`; callers narrow with `as OnboardingStepParam` after a successful `OnboardingStepParam.safeParse` (safe: the schema allows only 1–4). Add that comment where you cast.
2. Append `export * from './providers/own';` to `index.ts`.
**Test:** `own.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { isVerificationEditable, parseOnboardingBody, VerificationState } from './own';

describe('own provider contracts', () => {
  it('parseOnboardingBody picks the step schema', () => {
    expect(parseOnboardingBody(2, { categoryId: 'plumbing' })).toEqual({ step: 2, body: { categoryId: 'plumbing' } });
    expect(() => parseOnboardingBody(3, { services: [] })).toThrow(ZodError);
    expect(() => parseOnboardingBody(1, { categoryId: 'plumbing' })).toThrow(ZodError);
  });
  it('editable states', () => {
    expect(isVerificationEditable('not_submitted')).toBe(true);
    expect(isVerificationEditable('rejected')).toBe(true);
    expect(isVerificationEditable('pending_review')).toBe(false);
    expect(isVerificationEditable('verified')).toBe(false);
  });
  it('VerificationState shape', () => {
    expect(
      VerificationState.safeParse({ status: 'not_submitted', editable: true, verifiedAt: null, rejectionReason: null, documents: [] })
        .success,
    ).toBe(true);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test -- own`; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): OwnProvider and VerificationState (M11-T4)"`

### T5 — Endpoint registry entries
- [x] done
**Files:** `packages/contracts/src/endpoints.ts`, `packages/contracts/src/endpoints.test.ts`
**Context:** ARCH §3.3 rows `GET /me/provider` … `GET /files/photos/:key`; existing `provider_dashboard` entry style; `OwnerRule` already has `provider_or_admin`.
**Do:**
1. Import `OwnProvider, PhotoResult, DocumentMeta, VerificationState` from `./providers/own`.
2. Add these entries after `provider_dashboard` (keys = ids):
```ts
  provider_me: {
    id: 'provider_me', domain: 'providers', method: 'GET', path: '/me/provider',
    access: ['user'], owner: 'self', response: OwnProvider, refs: ['S19', 'S23', 'S24', 'S25', 'S26', 'S28'],
  },
  provider_onboarding_save: {
    // no `body`: it depends on :step — handlers parse with parseOnboardingBody (D-3)
    id: 'provider_onboarding_save', domain: 'providers', method: 'PUT', path: '/me/provider/onboarding/:step',
    access: ['user'], owner: 'self', response: OwnProvider, refs: ['F-15', 'S19', 'A21'],
  },
  provider_publish: {
    id: 'provider_publish', domain: 'providers', method: 'POST', path: '/me/provider/publish',
    access: ['user'], owner: 'self', response: OwnProvider, refs: ['F-15', 'S19', 'A22', 'BR-01', 'BR-23'],
  },
  provider_photo_put: {
    id: 'provider_photo_put', domain: 'providers', method: 'PUT', path: '/me/provider/photo',
    access: ['user'], owner: 'self', response: PhotoResult, multipart: true, refs: ['S19', 'S24', 'A26'],
  },
  provider_photo_delete: {
    id: 'provider_photo_delete', domain: 'providers', method: 'DELETE', path: '/me/provider/photo',
    access: ['user'], owner: 'self', refs: ['S24', 'A26'],
  },
  verification_get: {
    id: 'verification_get', domain: 'providers', method: 'GET', path: '/me/provider/verification',
    access: ['provider'], owner: 'self', response: VerificationState, refs: ['F-16', 'S26'],
  },
  verification_document_upload: {
    id: 'verification_document_upload', domain: 'providers', method: 'POST', path: '/me/provider/verification/documents',
    access: ['provider'], owner: 'self', response: DocumentMeta, multipart: true, refs: ['S26.E1', 'BR-17'],
  },
  verification_document_delete: {
    id: 'verification_document_delete', domain: 'providers', method: 'DELETE', path: '/me/provider/verification/documents/:id',
    access: ['provider'], owner: 'self', refs: ['S26.E1'],
  },
  verification_submit: {
    id: 'verification_submit', domain: 'providers', method: 'POST', path: '/me/provider/verification/submit',
    access: ['provider'], owner: 'self', response: VerificationState, refs: ['F-16', 'S26', 'A27', 'BR-17', 'BR-18'],
  },
  files_document: {
    // response is a file stream, not JSON (Cache-Control: no-store)
    id: 'files_document', domain: 'providers', method: 'GET', path: '/files/documents/:id',
    access: ['provider', 'admin'], owner: 'provider_or_admin', refs: ['BR-17', 'S26', 'S32', '§6.3'],
  },
  files_photo: {
    id: 'files_photo', domain: 'providers', method: 'GET', path: '/files/photos/:key',
    access: ['public'], owner: 'none', refs: ['S1', 'S2', 'S3'],
  },
```
3. Add a test case to `endpoints.test.ts`:
```ts
  it('M11 provider rows match ARCHITECTURE §3.3', () => {
    const rows = Object.fromEntries(Object.values(ENDPOINTS).map((d) => [`${d.method} ${d.path}`, d.access]));
    expect(rows).toMatchObject({
      'GET /me/provider': ['user'],
      'PUT /me/provider/onboarding/:step': ['user'],
      'POST /me/provider/publish': ['user'],
      'PUT /me/provider/photo': ['user'],
      'DELETE /me/provider/photo': ['user'],
      'GET /me/provider/verification': ['provider'],
      'POST /me/provider/verification/documents': ['provider'],
      'DELETE /me/provider/verification/documents/:id': ['provider'],
      'POST /me/provider/verification/submit': ['provider'],
      'GET /files/documents/:id': ['provider', 'admin'],
      'GET /files/photos/:key': ['public'],
    });
    expect(ENDPOINTS.provider_photo_put.multipart).toBe(true);
    expect(ENDPOINTS.verification_document_upload.multipart).toBe(true);
    for (const id of ['provider_photo_delete', 'verification_document_delete', 'files_document', 'files_photo'] as const)
      expect('response' in ENDPOINTS[id]).toBe(false);
  });
```
**Verify:** `pnpm --filter @fixit/contracts test -- endpoints`; `pnpm verify` green. (No test requires a handler per entry yet; the DevPanel's forced-error list picks the new ids up automatically.)
**Commit:** `git commit -m "feat(contracts): M11 provider endpoint registry (M11-T5)"`

### T6 — Rejected provider fixture
- [x] done
**Files:** `packages/fixtures/src/providers.ts`, `packages/fixtures/src/users.ts`, `packages/fixtures/src/build.test.ts`, `src/mocks/db/schema.ts`, `src/mocks/db/store.test.ts`
**Context:** D-11. p10 seed (`ownerId: 'u-grace'`, `verification: 'not_submitted'`); `buildProviders` submissions/documents arrays; `DEMO_PERSONAS`.
**Do:**
1. In `PROVIDER_SEEDS`, p10: `verification: 'rejected'`.
2. In `buildProviders`, append to `submissions`:
```ts
    {
      id: 's-p10-1',
      providerId: 'p10',
      attempt: 1,
      trigger: 'provider',
      status: 'rejected',
      submittedAt: ago(4),
      decidedAt: ago(2),
      rejectionReason: 'The photo of the back of your NIC is blurry. Upload a clearer photo.',
    },
```
   and to `documents` (the rejected attempt's files, then the staged copies of ARCH §8.1):
```ts
    ...(['nic_front', 'nic_back'] as const).flatMap((type) => {
      const base = { providerId: 'p10', type, mimeType: 'image/jpeg', createdAt: ago(4) };
      const fileName = type === 'nic_front' ? 'nic-front.jpg' : 'nic-back.jpg';
      const sizeBytes = type === 'nic_front' ? 512_004 : 398_771;
      return [
        { ...base, id: `d-p10-${type}`, submissionId: 's-p10-1', fileName, sizeBytes },
        { ...base, id: `d-p10-${type}-r`, submissionId: null, fileName, sizeBytes, createdAt: ago(2) },
      ];
    }),
```
3. In `DEMO_PERSONAS`, after `providerNoRequests`:
```ts
  {
    key: 'providerRejected',
    label: 'Provider, rejected (Grace Kim / Sparkle & Shine)',
    email: 'grace@fixit.test',
    userId: 'u-grace',
  },
```
4. `src/mocks/db/schema.ts`: `MOCK_DB_VERSION = 6`. In `src/mocks/db/store.test.ts` replace `fixit.mockdb.v5` with `fixit.mockdb.v6`.
5. Add to `build.test.ts`:
```ts
  it('M11: p10 is rejected with a reason and staged copies', () => {
    const world = buildWorld(new Date('2026-11-22T04:30:00Z'));
    expect(world.providers.find((p) => p.id === 'p10')?.verificationStatus).toBe('rejected');
    const sub = world.submissions.find((s) => s.providerId === 'p10');
    expect(sub).toMatchObject({ status: 'rejected', attempt: 1 });
    expect(sub?.rejectionReason?.length).toBeGreaterThanOrEqual(10);
    const docs = world.documents.filter((d) => d.providerId === 'p10');
    expect(docs.filter((d) => d.submissionId === null).map((d) => d.type).sort()).toEqual(['nic_back', 'nic_front']);
  });
```
   (Use the same `buildWorld` import/`now` pattern the file already uses.)
**Verify:** `pnpm --filter @fixit/fixtures test`; `pnpm verify` green (Discover tests unchanged: p10 is still listed and unverified).
**Commit:** `git commit -m "feat(fixtures): rejected provider p10 and persona (M11-T6)"`

### T7 — Test environment for uploads
- [x] done
**Files:** `src/test/setup.ts`
**Context:** D-8 (verified during planning: jsdom `FormData` → body `[object FormData]`).
**Do:**
1. At the top of `setup.ts` add:
```ts
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';

/** D-8: Node's fetch only serialises its own FormData/File. jsdom's are replaced for every test. */
const NodeFormData = (
  await new Response('a=1', { headers: { 'content-type': 'application/x-www-form-urlencoded' } }).formData()
).constructor as typeof FormData;
let objectUrlSeq = 0;
```
2. Inside the existing `beforeEach`, add:
```ts
  vi.stubGlobal('FormData', NodeFormData);
  vi.stubGlobal('File', NodeFile);
  vi.stubGlobal('Blob', NodeBlob);
  Object.assign(URL, {
    createObjectURL: () => `blob:test-${String(++objectUrlSeq)}`,
    revokeObjectURL: () => undefined,
  });
```
   (`afterEach` already calls `vi.unstubAllGlobals()`; the next `beforeEach` stubs again.)
**Verify:** `pnpm --filter @fixit/web test` — the whole web suite still passes. If any existing test breaks because of the `Blob`/`File` stubs, STOP and write a blocker with the failing test names.
**Commit:** `git commit -m "test(web): Node FormData/File in the test environment (M11-T7)"`

### T8 — Mock multipart reader and in-memory files
- [x] done
**Files:** `src/mocks/lib/multipart.ts`, `src/mocks/lib/multipart.test.ts`, `src/mocks/lib/files.ts`
**Context:** D-8; ARCH §4.3 "Files: uploads are kept as in-memory object URLs; only metadata is persisted".
**Do:**
1. `multipart.ts`:
```ts
export interface MultipartPart {
  name: string;
  fileName: string | null;
  mimeType: string | null;
  bytes: Uint8Array;
  text: string;
}

/** D-8: small multipart/form-data reader (undici's formData() is unreliable under jsdom). Empty map if not multipart. */
export async function readMultipart(request: Request): Promise<Map<string, MultipartPart>> {
  const out = new Map<string, MultipartPart>();
  const contentType = request.headers.get('content-type') ?? '';
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundary = match?.[1] ?? match?.[2];
  if (!contentType.toLowerCase().startsWith('multipart/form-data') || !boundary) return out;
  const raw = new TextDecoder('latin1').decode(new Uint8Array(await request.arrayBuffer()));
  for (const chunk of raw.split(`--${boundary}`)) {
    const sep = chunk.indexOf('\r\n\r\n');
    if (sep < 0) continue;
    const head = chunk.slice(0, sep);
    const body = chunk.slice(sep + 4).replace(/\r\n$/, '');
    const name = /name="([^"]*)"/i.exec(head)?.[1];
    if (!name) continue;
    out.set(name, {
      name,
      fileName: /filename="([^"]*)"/i.exec(head)?.[1] ?? null,
      mimeType: /content-type:\s*([^\r\n]+)/i.exec(head)?.[1]?.trim() ?? null,
      bytes: Uint8Array.from(body, (c) => c.charCodeAt(0)),
      text: body,
    });
  }
  return out;
}
```
2. `files.ts`:
```ts
/** ARCH §4.3: uploaded bytes live only for this page session. Keys: `photo:{key}`, `doc:{id}`. */
const mem = new Map<string, Blob>();
const PLACEHOLDER_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const putFile = (key: string, blob: Blob): void => {
  mem.set(key, blob);
};
export const getFile = (key: string): Blob | undefined => mem.get(key);
export const deleteFile = (key: string): void => {
  mem.delete(key);
};
/** 1×1 transparent PNG served after a reload (metadata survived, bytes didn't). */
export const placeholderFile = (): Blob =>
  new Blob([Uint8Array.from(atob(PLACEHOLDER_PNG), (c) => c.charCodeAt(0))], { type: 'image/png' });
```
**Test:** `multipart.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { readMultipart } from './multipart';

describe('readMultipart', () => {
  it('reads text and file parts byte-exact', async () => {
    const data = Uint8Array.from({ length: 3000 }, (_, i) => i % 256);
    const form = new FormData();
    form.append('type', 'nic_front');
    form.append('file', new File([data], 'a.png', { type: 'image/png' }));
    const parts = await readMultipart(new Request('http://x/upload', { method: 'POST', body: form }));
    expect(parts.get('type')?.text).toBe('nic_front');
    const file = parts.get('file');
    expect(file).toMatchObject({ fileName: 'a.png', mimeType: 'image/png' });
    expect(file?.bytes).toEqual(data);
  });
  it('not multipart → empty', async () => {
    expect((await readMultipart(new Request('http://x', { method: 'POST', body: '{}' }))).size).toBe(0);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- multipart`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock multipart reader and file store (M11-T8)"`

### T9 — `mockFileEndpoint` for file responses
- [x] done
**Files:** `src/mocks/lib/endpoint.ts`, `src/mocks/lib/endpoint.test.ts`
**Context:** `mockEndpoint` (same file) always answers JSON or 204; `GET /files/*` answer bytes. Reuse `simulateLatency`, `takeForcedError`, `forcedResponse`, `resolveActor`, `tryResolveActor`, `assertAccess`, `toErrorResponse`.
**Do:** Add below `mockEndpoint`:
```ts
/** Like mockEndpoint, but the impl returns the file to stream (GET /files/…). */
export function mockFileEndpoint<E extends EndpointDef>(
  def: E,
  impl: (ctx: MockCtx<E>) => Blob,
  cacheControl: string,
) {
  const route = http[def.method.toLowerCase() as Lowercase<EndpointDef['method']>];
  return route(`/api${def.path}`, async ({ request, params }) => {
    await simulateLatency();
    const forced = takeForcedError(def.id);
    if (forced) return forcedResponse(forced);
    try {
      const actor = def.access.includes('public') ? tryResolveActor(request) : resolveActor(request);
      assertAccess(def, actor);
      const blob = impl({
        actor,
        params: toStringParams(params),
        body: undefined as BodyOf<E>,
        query: undefined as QueryOf<E>,
        db: db(),
        now: new Date(),
        request,
      });
      return new HttpResponse(blob, {
        status: 200,
        headers: { 'Content-Type': blob.type || 'application/octet-stream', 'Cache-Control': cacheControl },
      });
    } catch (e) {
      return toErrorResponse(e);
    }
  });
}
```
**Test:** add to `endpoint.test.ts` (follow how the file already registers ad-hoc handlers with `server.use`):
```ts
describe('mockFileEndpoint', () => {
  const def = { id: 'probe_file', domain: 'providers', method: 'GET', path: '/probe-file/:id', access: ['provider', 'admin'], owner: 'provider_or_admin', refs: [] } as const;
  it('streams the blob with headers; 401 anonymous; 403 customer', async () => {
    server.use(mockFileEndpoint(def, () => new Blob(['hi'], { type: 'text/plain' }), 'no-store'));
    const url = new URL('/api/probe-file/x', window.location.origin);
    const ok = await fetch(url, { headers: { Authorization: `Bearer ${signInAs('provider').accessToken}` } });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('cache-control')).toBe('no-store');
    expect(await ok.text()).toBe('hi');
    expect((await fetch(url)).status).toBe(401);
    expect((await fetch(url, { headers: { Authorization: `Bearer ${signInAs('customer').accessToken}` } })).status).toBe(403);
  });
});
```
   Import `server` from `@/mocks/node` and `signInAs` from `@/test/sign-in` if not already imported.
**Verify:** `pnpm --filter @fixit/web test -- endpoint`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mockFileEndpoint for file responses (M11-T9)"`

### T10 — Mock own-provider logic
- [x] done
**Files:** `src/mocks/lib/own-provider.ts`, `src/mocks/lib/own-provider.test.ts`
**Context:** D-1, D-3, D-4, D-5; `buildMe` (`mocks/lib/me.ts`) for the `rejectionReason` rule; `computeStartingPrice` (contracts); `isListed` (`mocks/lib/cards.ts`); FxProvider fields (`packages/fixtures/src/types.ts`).
**Do:** Create `own-provider.ts`:
```ts
import {
  computeStartingPrice,
  nextOnboardingStep,
  OnboardingStep1Body,
  type OnboardingBody,
  type OwnProvider,
  type RuleCode,
} from '@fixit/contracts';
import type { FxProvider } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';

export const draftOf = (d: MockDb, userId: string): FxProvider | undefined =>
  Object.values(d.providers).find((p) => p.userId === userId);

/** "Has draft or listing" (ARCH §3.3). None → 404. */
export function requireDraft(d: MockDb, userId: string): FxProvider {
  const p = draftOf(d, userId);
  if (!p) throw mockError(404, 'NOT_FOUND', 'No provider profile');
  return p;
}

export const ruleError = (rule: RuleCode) =>
  mockError(422, 'RULE_VIOLATION', `Rule ${String(rule)}`, { details: { rule } });
export const alreadyPublished = () =>
  mockError(409, 'CONFLICT', 'Listing already published', { details: { rule: 'already_in_state' } });

export function toOwnProvider(d: MockDb, p: FxProvider): OwnProvider {
  const user = d.users[p.userId];
  if (!user) throw mockError(500, 'INTERNAL', 'Owner missing');
  const category = d.categories.find((c) => c.id === p.categoryId);
  const townRef = (id: string) => {
    const t = d.towns.find((x) => x.id === id);
    return t ? { id: t.id, name: t.name } : null;
  };
  const areas = d.areas.filter((a) => a.providerId === p.id);
  const base = areas.find((a) => a.isBase);
  const lastRejection = Object.values(d.submissions)
    .filter((s) => s.providerId === p.id && s.status === 'rejected')
    .sort((a, b) => b.attempt - a.attempt)[0];
  const services = Object.values(d.services)
    .filter((s) => s.providerId === p.id)
    .map((s) => ({ id: s.id, name: s.name, price: s.price, unit: s.unit }));
  return {
    id: p.id,
    ownerName: user.fullName,
    businessName: p.businessName,
    bio: p.bio,
    yearsExperience: p.yearsExperience,
    category: category ? { id: category.id, name: category.name, icon: category.icon } : null,
    services,
    baseTown: base ? townRef(base.townId) : null,
    otherTowns: areas
      .filter((a) => !a.isBase)
      .map((a) => townRef(a.townId))
      .filter((t): t is { id: string; name: string } => t !== null)
      .sort((a, b) => a.name.localeCompare(b.name)),
    photoUrl: p.photoKey ? `/api/files/photos/${p.photoKey}` : null,
    onboarding: { complete: p.onboardingComplete, step: p.onboardingStep },
    publishedAt: p.publishedAt,
    verificationStatus: p.verificationStatus,
    verifiedAt: p.verifiedAt,
    reverificationReason: p.reverificationReason,
    rejectionReason: p.verificationStatus === 'rejected' ? (lastRejection?.rejectionReason ?? null) : null,
    paused: p.paused,
    startingPrice:
      p.startingPrice !== null && p.startingUnit !== null ? { amount: p.startingPrice, unit: p.startingUnit } : null,
  };
}

function newDraft(userId: string, now: Date): FxProvider {
  return {
    id: `p-${crypto.randomUUID().slice(0, 8)}`,
    userId,
    businessName: null,
    bio: null,
    yearsExperience: null,
    categoryId: null,
    baseTownId: null,
    photoKey: null,
    onboardingStep: 1,
    onboardingComplete: false,
    publishedAt: null,
    verificationStatus: 'not_submitted',
    verifiedAt: null,
    reverificationReason: null,
    paused: false,
    ratingAvg: null,
    reviewCount: 0,
    startingPrice: null,
    startingUnit: null,
    createdAt: now.toISOString(),
  };
}

const fieldError = (field: string, message: string) =>
  mockError(400, 'VALIDATION_FAILED', 'Validation failed', { fieldErrors: { [field]: [message] } });

/** A21. Mutates the db; the handler commits. */
export function applyOnboardingStep(d: MockDb, userId: string, input: OnboardingBody, now: Date): FxProvider {
  const user = d.users[userId];
  if (!user) throw mockError(404, 'NOT_FOUND', 'User not found');
  if (user.emailConfirmedAt === null) throw ruleError('email_unconfirmed');
  let p = draftOf(d, userId);
  if (p?.onboardingComplete) throw alreadyPublished();
  if (!p) {
    if (input.step !== 1) throw ruleError('onboarding_incomplete');
    p = newDraft(userId, now);
    d.providers[p.id] = p;
  }
  if (input.step > p.onboardingStep) throw ruleError('onboarding_incomplete');
  const id = p.id;
  switch (input.step) {
    case 1:
      Object.assign(p, input.body);
      break;
    case 2: {
      const category = d.categories.find((c) => c.id === input.body.categoryId && c.active);
      if (!category) throw fieldError('categoryId', 'Choose a category.');
      p.categoryId = category.id;
      break;
    }
    case 3:
      for (const s of Object.values(d.services)) if (s.providerId === id) delete d.services[s.id];
      for (const s of input.body.services) {
        const sid = crypto.randomUUID();
        d.services[sid] = { id: sid, providerId: id, ...s };
      }
      break;
    case 4: {
      const active = (tid: string) => d.towns.some((t) => t.id === tid && t.active);
      if (!active(input.body.baseTownId)) throw fieldError('baseTownId', 'Choose your base town.');
      if (!input.body.otherTownIds.every(active)) throw fieldError('otherTownIds', 'Choose your base town.');
      d.areas = d.areas.filter((a) => a.providerId !== id);
      d.areas.push({ providerId: id, townId: input.body.baseTownId, isBase: true });
      for (const townId of input.body.otherTownIds) d.areas.push({ providerId: id, townId, isBase: false });
      p.baseTownId = input.body.baseTownId;
      break;
    }
  }
  p.onboardingStep = nextOnboardingStep(p.onboardingStep, input.step);
  return p;
}

/** A22 (BR-01, BR-23). */
export function publishDraft(d: MockDb, userId: string, now: Date): FxProvider {
  const user = d.users[userId];
  const p = requireDraft(d, userId);
  if (p.onboardingComplete) throw alreadyPublished();
  if (!user || user.emailConfirmedAt === null) throw ruleError('email_unconfirmed');
  const services = Object.values(d.services).filter((s) => s.providerId === p.id);
  const starting = computeStartingPrice(services);
  const step1Ok = OnboardingStep1Body.safeParse({
    businessName: p.businessName,
    bio: p.bio,
    yearsExperience: p.yearsExperience,
  }).success;
  const hasBase = d.areas.some((a) => a.providerId === p.id && a.isBase);
  if (p.onboardingStep < 5 || !step1Ok || p.categoryId === null || starting === null || !hasBase)
    throw ruleError('onboarding_incomplete');
  if (user.mobile === null) throw ruleError('mobile_missing');
  p.onboardingComplete = true;
  p.onboardingStep = 5;
  p.publishedAt = now.toISOString();
  p.startingPrice = starting.amount;
  p.startingUnit = starting.unit;
  return p;
}
```
**Test:** `own-provider.test.ts` (fake timers as in the conventions):
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { applyOnboardingStep, publishDraft, toOwnProvider } from './own-provider';
import { isListed } from './cards';

const step1 = { businessName: 'Martinez Home Fix', bio: 'Small repairs and odd jobs around the house, done well.', yearsExperience: 4 };

describe('own provider (mock)', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('Olivia: step 1 creates the draft, steps advance to 5, publish lists her unverified', () => {
    const d = db();
    const p = applyOnboardingStep(d, 'u-olivia', { step: 1, body: step1 }, FIXED_NOW);
    expect(p.onboardingStep).toBe(2);
    applyOnboardingStep(d, 'u-olivia', { step: 2, body: { categoryId: 'handyman' } }, FIXED_NOW);
    applyOnboardingStep(d, 'u-olivia', { step: 3, body: { services: [{ name: 'Shelf fitting', price: 1800, unit: 'per_hour' }] } }, FIXED_NOW);
    applyOnboardingStep(d, 'u-olivia', { step: 4, body: { baseTownId: 'colombo', otherTownIds: ['moratuwa'] } }, FIXED_NOW);
    expect(p.onboardingStep).toBe(5);
    publishDraft(d, 'u-olivia', FIXED_NOW);
    expect(isListed(d, p)).toBe(true);
    expect(toOwnProvider(d, p)).toMatchObject({
      ownerName: 'Olivia Martinez',
      onboarding: { complete: true, step: 5 },
      verificationStatus: 'not_submitted',
      startingPrice: { amount: 1800, unit: 'per_hour' },
      baseTown: { id: 'colombo' },
      otherTowns: [{ id: 'moratuwa' }],
    });
  });
  it('no skipping, published → 409, unconfirmed → 422', () => {
    const d = db();
    expect(() => applyOnboardingStep(d, 'u-olivia', { step: 2, body: { categoryId: 'plumbing' } }, FIXED_NOW)).toThrow(
      expect.objectContaining({ status: 422, extra: { details: { rule: 'onboarding_incomplete' } } }),
    );
    expect(() => applyOnboardingStep(d, 'u-kasun', { step: 4, body: { baseTownId: 'kaduwela', otherTownIds: [] } }, FIXED_NOW)).toThrow(
      expect.objectContaining({ status: 422 }),
    );
    expect(() => applyOnboardingStep(d, 'u-marcus', { step: 1, body: step1 }, FIXED_NOW)).toThrow(
      expect.objectContaining({ status: 409, extra: { details: { rule: 'already_in_state' } } }),
    );
    expect(() => applyOnboardingStep(d, 'u-nimal', { step: 1, body: step1 }, FIXED_NOW)).toThrow(
      expect.objectContaining({ status: 422, extra: { details: { rule: 'email_unconfirmed' } } }),
    );
  });
  it('Kasun: draft resumes at step 3 with saved step 1–2 values', () => {
    const d = db();
    const kasun = Object.values(d.providers).find((p) => p.userId === 'u-kasun');
    if (!kasun) throw new Error('kasun');
    expect(toOwnProvider(d, kasun)).toMatchObject({
      businessName: 'Silva Electricals',
      category: { id: 'electrical' },
      services: [],
      baseTown: null,
      onboarding: { complete: false, step: 3 },
    });
  });
  it('publish refuses an incomplete draft', () => {
    expect(() => publishDraft(db(), 'u-kasun', FIXED_NOW)).toThrow(
      expect.objectContaining({ status: 422, extra: { details: { rule: 'onboarding_incomplete' } } }),
    );
  });
});
```
   If the category id `handyman` doesn't exist in `packages/fixtures/src/catalog.ts`, use any active category id from that file.
**Verify:** `pnpm --filter @fixit/web test -- own-provider`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock onboarding and publish rules (M11-T10)"`

### T11 — Handlers: `GET /me/provider` and `PUT /me/provider/onboarding/:step`
- [x] done
**Files:** `src/mocks/handlers/providers.ts`, `src/mocks/handlers/providers-onboarding.test.ts`
**Context:** D-3; T10 helpers; `mockEndpoint` gives `request` in ctx (body is not pre-read because the def has no `body`).
**Do:** Add to `providersHandlers`:
```ts
  mockEndpoint(E.provider_me, ({ db: d, actor }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    return toOwnProvider(d, requireDraft(d, actor.userId));
  }),
  mockEndpoint(E.provider_onboarding_save, async ({ db: d, actor, params, request, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const step = OnboardingStepParam.safeParse(params.step);
    if (!step.success) throw mockError(404, 'NOT_FOUND', 'Unknown step');
    const raw: unknown = await request.json().catch(() => undefined);
    // safe: OnboardingStepParam only accepts 1–4
    const input = parseOnboardingBody(step.data as OnboardingStepParam, raw);
    return toOwnProvider(d, applyOnboardingStep(d, actor.userId, input, now));
  }),
```
   Imports: `OnboardingStepParam, parseOnboardingBody` from contracts; `applyOnboardingStep, requireDraft, toOwnProvider` from `../lib/own-provider`.
**Test:** `providers-onboarding.test.ts`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OwnProvider } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
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
const step1 = { businessName: 'Martinez Home Fix', bio: 'Small repairs and odd jobs around the house, done well.', yearsExperience: 4 };

describe('GET /me/provider · PUT onboarding/:step', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('roles: anon 401, admin 403, never started 404, Kasun draft 200', async () => {
    expect((await call('GET', '/me/provider')).status).toBe(401);
    expect((await call('GET', '/me/provider', 'admin')).status).toBe(403);
    expect((await call('GET', '/me/provider', 'customer')).status).toBe(404);
    const kasun = OwnProvider.parse(await (await call('GET', '/me/provider', 'providerDraft')).json());
    expect(kasun.onboarding.step).toBe(3);
  });
  it('step 1 creates, returns step 2; bad body 400 with SPEC message; bad step 404', async () => {
    const ok = await call('PUT', '/me/provider/onboarding/1', 'customer', step1);
    expect(OwnProvider.parse(await ok.json()).onboarding.step).toBe(2);
    const bad = await call('PUT', '/me/provider/onboarding/1', 'customer', { ...step1, bio: 'short' });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.fieldErrors.bio).toEqual(['Tell customers about your business in at least 30 characters.']);
    expect((await call('PUT', '/me/provider/onboarding/7', 'customer', step1)).status).toBe(404);
  });
  it('published → 409 already_in_state; unconfirmed → 422; admin 403', async () => {
    const pub = await call('PUT', '/me/provider/onboarding/1', 'provider', step1);
    expect(pub.status).toBe(409);
    expect((await pub.json()).error.details.rule).toBe('already_in_state');
    const unconf = await call('PUT', '/me/provider/onboarding/1', 'customerUnconfirmed', step1);
    expect(unconf.status).toBe(422);
    expect((await call('PUT', '/me/provider/onboarding/1', 'admin', step1)).status).toBe(403);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- providers-onboarding`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock own provider and onboarding step handlers (M11-T11)"`

### T12 — Handler: `POST /me/provider/publish`
- [x] done
**Files:** `src/mocks/handlers/providers.ts`, `src/mocks/handlers/providers-onboarding.test.ts`
**Context:** D-5; AC4 (Discover shows `Not yet verified`); `buildMe` roles via `rolesOf`.
**Do:** Add:
```ts
  mockEndpoint(E.provider_publish, ({ db: d, actor, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    return toOwnProvider(d, publishDraft(d, actor.userId, now));
  }),
```
**Test:** add to `providers-onboarding.test.ts`:
```ts
  it('publish: Olivia after 4 steps → listed, roles gain provider, Discover shows her unverified', async () => {
    await call('PUT', '/me/provider/onboarding/1', 'customer', step1);
    await call('PUT', '/me/provider/onboarding/2', 'customer', { categoryId: 'electrical' });
    await call('PUT', '/me/provider/onboarding/3', 'customer', { services: [{ name: 'Fan fitting', price: 1800, unit: 'per_visit' }] });
    await call('PUT', '/me/provider/onboarding/4', 'customer', { baseTownId: 'colombo', otherTownIds: [] });
    const res = await call('POST', '/me/provider/publish', 'customer');
    expect(OwnProvider.parse(await res.json()).onboarding.complete).toBe(true);
    expect(signInAs('customer').user.roles).toEqual(['customer', 'provider']);
    const found = await (await call('GET', `/providers?q=${encodeURIComponent('Martinez Home Fix')}`)).json();
    expect(found.items[0]).toMatchObject({ businessName: 'Martinez Home Fix', verified: false });
    expect((await call('POST', '/me/provider/publish', 'customer')).status).toBe(409);
  });
  it('publish: Kasun incomplete → 422 onboarding_incomplete', async () => {
    const res = await call('POST', '/me/provider/publish', 'providerDraft');
    expect(res.status).toBe(422);
    expect((await res.json()).error.details.rule).toBe('onboarding_incomplete');
  });
```
   If the Discover response's `items` key differs (check `DiscoverResult` in `catalog/schemas.ts`), use the real key.
**Verify:** `pnpm --filter @fixit/web test -- providers-onboarding`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock publish listing handler (M11-T12)"`

### T13 — Handlers: photo upload/remove and `GET /files/photos/:key`
- [x] done
**Files:** `src/mocks/handlers/providers.ts`, `src/mocks/handlers/providers-onboarding.test.ts`
**Context:** ARCH §3.3 photo rows (`U (has draft or listing)`); S24.E2; D-8, D-12; T8 `readMultipart`, files store; T9 `mockFileEndpoint`.
**Do:** Add:
```ts
  mockEndpoint(E.provider_photo_put, async ({ db: d, actor, request }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = requireDraft(d, actor.userId);
    const file = (await readMultipart(request)).get('file');
    if (!file?.fileName) throw mockError(400, 'VALIDATION_FAILED', 'Validation failed', { fieldErrors: { file: ['Choose a file.'] } });
    const problem = checkUpload('photo', { mimeType: file.mimeType ?? '', sizeBytes: file.bytes.length });
    if (problem === 'type') throw mockError(415, 'UNSUPPORTED_MEDIA', UPLOAD_COPY.photo.type);
    if (problem === 'size') throw mockError(413, 'PAYLOAD_TOO_LARGE', UPLOAD_COPY.photo.size);
    if (p.photoKey) deleteFile(`photo:${p.photoKey}`);
    const key = `${p.id}-${crypto.randomUUID().slice(0, 8)}`;
    putFile(`photo:${key}`, new Blob([file.bytes], { type: file.mimeType ?? 'application/octet-stream' }));
    p.photoKey = key;
    return { photoUrl: `/api/files/photos/${key}` };
  }),
  mockEndpoint(E.provider_photo_delete, ({ db: d, actor }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = requireDraft(d, actor.userId);
    if (p.photoKey) deleteFile(`photo:${p.photoKey}`);
    p.photoKey = null;
  }),
  mockFileEndpoint(
    E.files_photo,
    ({ db: d, params }) => {
      const key = params.key ?? '';
      if (!Object.values(d.providers).some((p) => p.photoKey === key)) throw mockError(404, 'NOT_FOUND', 'No such photo');
      return getFile(`photo:${key}`) ?? placeholderFile();
    },
    'public, max-age=31536000, immutable',
  ),
```
**Test:** add to `providers-onboarding.test.ts`:
```ts
  const upload = (persona: PersonaKey, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(new URL('/api/me/provider/photo', window.location.origin), {
      method: 'PUT',
      headers: { Authorization: `Bearer ${signInAs(persona).accessToken}` },
      body: form,
    });
  };
  it('photo: Kasun uploads (200 + public GET), wrong type 415, too big 413, no draft 404, delete 204', async () => {
    const ok = await upload('providerDraft', new File([new Uint8Array(2000)], 'me.png', { type: 'image/png' }));
    const { photoUrl } = (await ok.json()) as { photoUrl: string };
    expect(photoUrl).toMatch(/^\/api\/files\/photos\//);
    const img = await fetch(new URL(photoUrl, window.location.origin));
    expect(img.status).toBe(200);
    expect(img.headers.get('content-type')).toBe('image/png');
    expect((await upload('providerDraft', new File(['x'], 'a.gif', { type: 'image/gif' }))).status).toBe(415);
    expect((await upload('providerDraft', new File([new Uint8Array(6 * 1024 * 1024)], 'b.jpg', { type: 'image/jpeg' }))).status).toBe(413);
    expect((await upload('customer', new File(['x'], 'c.png', { type: 'image/png' }))).status).toBe(404);
    expect((await call('DELETE', '/me/provider/photo', 'providerDraft')).status).toBe(204);
    expect((await fetch(new URL(photoUrl, window.location.origin))).status).toBe(404);
  });
```
**Verify:** `pnpm --filter @fixit/web test -- providers-onboarding`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock profile photo handlers (M11-T13)"`

### T14 — Mock verification logic
- [x] done
**Files:** `src/mocks/lib/verification.ts`, `src/mocks/lib/verification.test.ts`
**Context:** D-10; BR-17, BR-18; SPEC §8.5; `isVerificationEditable`, `missingRequiredDocuments` (contracts); `ownProvider` (`mocks/lib/requests.ts`).
**Do:** Create `verification.ts`:
```ts
import {
  isVerificationEditable,
  missingRequiredDocuments,
  type DocumentMeta,
  type DocumentType,
  type VerificationState,
} from '@fixit/contracts';
import type { FxDocument, FxProvider } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';
import { deleteFile, putFile } from './files';

const notEditable = () =>
  mockError(422, 'RULE_VIOLATION', 'Verification not editable', { details: { rule: 'verification_not_editable' } });

export const toDocumentMeta = (doc: FxDocument): DocumentMeta => ({
  id: doc.id,
  type: doc.type,
  fileName: doc.fileName,
  mimeType: doc.mimeType,
  sizeBytes: doc.sizeBytes,
  url: `/api/files/documents/${doc.id}`,
  createdAt: doc.createdAt,
});

const ORDER: Record<DocumentType, number> = { nic_front: 0, nic_back: 1, trade_certificate: 2, business_registration: 3 };
const byOrder = (a: FxDocument, b: FxDocument) => ORDER[a.type] - ORDER[b.type];

export const stagedDocs = (d: MockDb, providerId: string): FxDocument[] =>
  Object.values(d.documents).filter((x) => x.providerId === providerId && x.submissionId === null).sort(byOrder);

export function verificationStateOf(d: MockDb, p: FxProvider): VerificationState {
  const editable = isVerificationEditable(p.verificationStatus);
  const subs = Object.values(d.submissions).filter((s) => s.providerId === p.id).sort((a, b) => b.attempt - a.attempt);
  const latest = subs[0];
  const lastRejected = subs.find((s) => s.status === 'rejected');
  const docs = editable
    ? stagedDocs(d, p.id)
    : Object.values(d.documents).filter((x) => latest && x.submissionId === latest.id).sort(byOrder);
  return {
    status: p.verificationStatus,
    editable,
    verifiedAt: p.verifiedAt,
    rejectionReason: p.verificationStatus === 'rejected' ? (lastRejected?.rejectionReason ?? null) : null,
    documents: docs.map(toDocumentMeta),
  };
}

/** S26.E1 upload: replaces a staged document of the same type. */
export function stageDocument(
  d: MockDb,
  p: FxProvider,
  file: { type: DocumentType; fileName: string; mimeType: string; bytes: Uint8Array },
  now: Date,
): FxDocument {
  if (!isVerificationEditable(p.verificationStatus)) throw notEditable();
  for (const old of stagedDocs(d, p.id).filter((x) => x.type === file.type)) {
    delete d.documents[old.id];
    deleteFile(`doc:${old.id}`);
  }
  const doc: FxDocument = {
    id: `d-${crypto.randomUUID().slice(0, 8)}`,
    providerId: p.id,
    submissionId: null,
    type: file.type,
    fileName: file.fileName,
    mimeType: file.mimeType,
    sizeBytes: file.bytes.length,
    createdAt: now.toISOString(),
  };
  d.documents[doc.id] = doc;
  putFile(`doc:${doc.id}`, new Blob([file.bytes], { type: file.mimeType }));
  return doc;
}

export function unstageDocument(d: MockDb, p: FxProvider, id: string): void {
  const doc = d.documents[id];
  if (!doc || doc.providerId !== p.id || doc.submissionId !== null) throw mockError(404, 'NOT_FOUND', 'No such document');
  if (!isVerificationEditable(p.verificationStatus)) throw notEditable();
  delete d.documents[id];
  deleteFile(`doc:${id}`);
}

/** A27: new attempt, staged → submitted, status pending_review. */
export function submitVerification(d: MockDb, p: FxProvider, now: Date): void {
  if (!isVerificationEditable(p.verificationStatus)) throw notEditable();
  const staged = stagedDocs(d, p.id);
  if (missingRequiredDocuments(staged.map((x) => x.type)).length > 0)
    throw mockError(422, 'RULE_VIOLATION', 'NIC front and back required', { details: { rule: 'documents_missing' } });
  const attempt = Math.max(0, ...Object.values(d.submissions).filter((s) => s.providerId === p.id).map((s) => s.attempt)) + 1;
  const id = `s-${p.id}-${String(attempt)}`;
  d.submissions[id] = {
    id,
    providerId: p.id,
    attempt,
    trigger: 'provider',
    status: 'pending_review',
    submittedAt: now.toISOString(),
    decidedAt: null,
    rejectionReason: null,
  };
  for (const doc of staged) doc.submissionId = id;
  p.verificationStatus = 'pending_review';
  p.reverificationReason = null;
}
```
**Test:** `verification.test.ts` (fake timers):
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { stageDocument, submitVerification, unstageDocument, verificationStateOf } from './verification';

const prov = (id: string) => {
  const p = db().providers[id];
  if (!p) throw new Error(id);
  return p;
};
const file = (type: 'nic_front' | 'nic_back') => ({ type, fileName: `${type}.png`, mimeType: 'image/png', bytes: new Uint8Array(10) });

describe('verification (mock)', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('Hank (not submitted): stage, replace, unstage, submit needs both NIC sides', () => {
    const d = db();
    const hank = prov('p08');
    expect(verificationStateOf(d, hank)).toMatchObject({ status: 'not_submitted', editable: true, documents: [] });
    stageDocument(d, hank, file('nic_front'), FIXED_NOW);
    const second = stageDocument(d, hank, file('nic_front'), FIXED_NOW);
    expect(verificationStateOf(d, hank).documents.map((x) => x.id)).toEqual([second.id]);
    expect(() => submitVerification(d, hank, FIXED_NOW)).toThrow(expect.objectContaining({ status: 422 }));
    stageDocument(d, hank, file('nic_back'), FIXED_NOW);
    submitVerification(d, hank, FIXED_NOW);
    const after = verificationStateOf(d, hank);
    expect(after).toMatchObject({ status: 'pending_review', editable: false });
    expect(after.documents.map((x) => x.type)).toEqual(['nic_front', 'nic_back']);
    expect(() => unstageDocument(d, hank, second.id)).toThrow(expect.objectContaining({ status: 404 }));
  });
  it('Grace (rejected): reason, prefilled staged copies, resubmit → attempt 2', () => {
    const d = db();
    const grace = prov('p10');
    const s = verificationStateOf(d, grace);
    expect(s).toMatchObject({ status: 'rejected', editable: true, rejectionReason: expect.stringContaining('blurry') });
    expect(s.documents.map((x) => x.id)).toEqual(['d-p10-nic_front-r', 'd-p10-nic_back-r']);
    submitVerification(d, grace, FIXED_NOW);
    expect(d.submissions['s-p10-2']).toMatchObject({ attempt: 2, status: 'pending_review' });
  });
  it('Marcus (verified) and Dana (pending) are read-only', () => {
    const d = db();
    expect(() => stageDocument(d, prov('p01'), file('nic_front'), FIXED_NOW)).toThrow(expect.objectContaining({ status: 422 }));
    expect(verificationStateOf(d, prov('p02')).documents).toHaveLength(2);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- lib/verification`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock verification rules (M11-T14)"`

### T15 — Handlers: verification get / upload / delete
- [x] done
**Files:** `src/mocks/handlers/providers.ts`, `src/mocks/handlers/providers-verification.test.ts`
**Context:** ARCH §3.3; T14; `ownProvider(d, userId)` from `../lib/requests` (published listing, else 403 — unreachable after `access: ['provider']`).
**Do:** Add:
```ts
  mockEndpoint(E.verification_get, ({ db: d, actor }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    return verificationStateOf(d, ownProvider(d, actor.userId));
  }),
  mockEndpoint(E.verification_document_upload, async ({ db: d, actor, request, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    const parts = await readMultipart(request);
    const { type } = DocumentUploadFields.parse({ type: parts.get('type')?.text });
    const file = parts.get('file');
    if (!file?.fileName) throw mockError(400, 'VALIDATION_FAILED', 'Validation failed', { fieldErrors: { file: ['Choose a file.'] } });
    const mimeType = file.mimeType ?? '';
    const problem = checkUpload('document', { mimeType, sizeBytes: file.bytes.length });
    if (problem === 'type') throw mockError(415, 'UNSUPPORTED_MEDIA', UPLOAD_COPY.document.type);
    if (problem === 'size') throw mockError(413, 'PAYLOAD_TOO_LARGE', UPLOAD_COPY.document.size);
    return toDocumentMeta(stageDocument(d, p, { type, fileName: file.fileName, mimeType, bytes: file.bytes }, now));
  }),
  mockEndpoint(E.verification_document_delete, ({ db: d, actor, params }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    unstageDocument(d, ownProvider(d, actor.userId), params.id ?? '');
  }),
```
   Note `fileName` from the multipart header may be Latin-1 decoded; acceptable for the mock.
**Test:** `providers-verification.test.ts`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentMeta, VerificationState } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const auth = (p?: PersonaKey): Record<string, string> => (p ? { Authorization: `Bearer ${signInAs(p).accessToken}` } : {});
const url = (path: string) => new URL(`/api${path}`, window.location.origin);
export const uploadDoc = (persona: PersonaKey, type: string, file: File) => {
  const form = new FormData();
  form.append('type', type);
  form.append('file', file);
  return fetch(url('/me/provider/verification/documents'), { method: 'POST', headers: auth(persona), body: form });
};
const png = (name = 'nic.png', size = 1000) => new File([new Uint8Array(size)], name, { type: 'image/png' });

describe('verification handlers', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('GET: roles and states', async () => {
    expect((await fetch(url('/me/provider/verification'))).status).toBe(401);
    expect((await fetch(url('/me/provider/verification'), { headers: auth('customer') })).status).toBe(403);
    expect((await fetch(url('/me/provider/verification'), { headers: auth('admin') })).status).toBe(403);
    const hank = VerificationState.parse(await (await fetch(url('/me/provider/verification'), { headers: auth('providerNotSubmitted') })).json());
    expect(hank).toMatchObject({ status: 'not_submitted', editable: true });
    const marcus = VerificationState.parse(await (await fetch(url('/me/provider/verification'), { headers: auth('provider') })).json());
    expect(marcus).toMatchObject({ status: 'verified', editable: false });
  });
  it('upload: 200 meta, bad type 415, 6 MB 413, bad type field 400, verified 422', async () => {
    const meta = DocumentMeta.parse(await (await uploadDoc('providerNotSubmitted', 'nic_front', png())).json());
    expect(meta).toMatchObject({ type: 'nic_front', fileName: 'nic.png', sizeBytes: 1000 });
    const docx = new File(['x'], 'id.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    expect((await uploadDoc('providerNotSubmitted', 'nic_back', docx)).status).toBe(415);
    expect((await uploadDoc('providerNotSubmitted', 'nic_back', png('big.png', 6 * 1024 * 1024))).status).toBe(413);
    expect((await uploadDoc('providerNotSubmitted', 'passport', png())).status).toBe(400);
    expect((await uploadDoc('provider', 'nic_front', png())).status).toBe(422);
  });
  it("delete: own staged 204; another provider's document 404", async () => {
    const meta = DocumentMeta.parse(await (await uploadDoc('providerNotSubmitted', 'nic_front', png())).json());
    expect((await fetch(url(`/me/provider/verification/documents/d-p10-nic_front-r`), { method: 'DELETE', headers: auth('providerNotSubmitted') })).status).toBe(404);
    expect((await fetch(url(`/me/provider/verification/documents/${meta.id}`), { method: 'DELETE', headers: auth('providerNotSubmitted') })).status).toBe(204);
  });
});
```
   (Drop the `export` on `uploadDoc` if lint forbids exports from test files.)
**Verify:** `pnpm --filter @fixit/web test -- providers-verification`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock verification document handlers (M11-T15)"`

### T16 — Handlers: submit and `GET /files/documents/:id`
- [x] done
**Files:** `src/mocks/handlers/providers.ts`, `src/mocks/handlers/providers-verification.test.ts`
**Context:** A27; BR-17; PRODUCT §6.3 (documents visible only to owner + admins); AC9 (another provider's document → 404).
**Do:** Add:
```ts
  mockEndpoint(E.verification_submit, ({ db: d, actor, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    submitVerification(d, p, now);
    return verificationStateOf(d, p);
  }),
  mockFileEndpoint(
    E.files_document,
    ({ db: d, actor, params }) => {
      const doc = d.documents[params.id ?? ''];
      const isAdmin = actor?.roles.includes('admin') ?? false;
      const mine = !isAdmin && actor ? Object.values(d.providers).find((p) => p.userId === actor.userId)?.id : undefined;
      if (!doc || (!isAdmin && doc.providerId !== mine)) throw mockError(404, 'NOT_FOUND', 'No such document');
      return getFile(`doc:${doc.id}`) ?? placeholderFile();
    },
    'no-store',
  ),
```
**Test:** add to `providers-verification.test.ts`:
```ts
  it('submit: missing back → 422 documents_missing; both → pending_review', async () => {
    await uploadDoc('providerNotSubmitted', 'nic_front', png());
    const missing = await fetch(url('/me/provider/verification/submit'), { method: 'POST', headers: auth('providerNotSubmitted') });
    expect(missing.status).toBe(422);
    expect((await missing.json()).error.details.rule).toBe('documents_missing');
    await uploadDoc('providerNotSubmitted', 'nic_back', png());
    const ok = VerificationState.parse(await (await fetch(url('/me/provider/verification/submit'), { method: 'POST', headers: auth('providerNotSubmitted') })).json());
    expect(ok).toMatchObject({ status: 'pending_review', editable: false });
    expect(signInAs('providerNotSubmitted').user.provider?.verificationStatus).toBe('pending_review');
  });
  it('files: owner 200 no-store, other provider 404, admin 200, customer 403, anon 401', async () => {
    const other = await fetch(url('/files/documents/d-p02-nic-front'), { headers: auth('provider') });
    expect(other.status).toBe(404); // Marcus asking for Dana's document
    const grace = await fetch(url('/files/documents/d-p10-nic_front-r'), { headers: auth('providerRejected') });
    expect(grace.status).toBe(200);
    expect(grace.headers.get('cache-control')).toBe('no-store');
    expect((await fetch(url('/files/documents/d-p02-nic-front'), { headers: auth('admin') })).status).toBe(200);
    expect((await fetch(url('/files/documents/d-p02-nic-front'), { headers: auth('customer') })).status).toBe(403);
    expect((await fetch(url('/files/documents/d-p02-nic-front'))).status).toBe(401);
  });
```
**Verify:** `pnpm --filter @fixit/web test -- providers-verification`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock verification submit and document files (M11-T16)"`

### T17 — Query keys, file size format, upload error copy
- [x] done
**Files:** `src/lib/query-keys.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`, `src/lib/upload-errors.ts`, `src/lib/upload-errors.test.ts`
**Context:** S26.E1 "filename (ellipsis), size"; S24.E2; §6.3 upload failed; `ApiError` (`lib/http.ts`).
**Do:**
1. `query-keys.ts`, add inside `qk`:
```ts
  ownProvider: ['providers', 'own'] as const,
  verification: ['providers', 'verification'] as const,
```
2. `format.ts`, add:
```ts
/** S26 slot size: `482 KB`, `1.2 MB` (1 KB = 1024 B). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${String(Math.max(1, Math.round(bytes / 1024)))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```
   Test cases in `format.test.ts`: `formatFileSize(482_113)` → `'471 KB'`, `formatFileSize(10)` → `'1 KB'`, `formatFileSize(5 * 1024 * 1024)` → `'5.0 MB'`.
3. `upload-errors.ts`:
```ts
import { UPLOAD_COPY, type UploadKind } from '@fixit/contracts';
import { ApiError } from './http';

/** Server/network failure of an upload → slot copy. null = the user cancelled (no message). */
export function uploadErrorCopy(err: unknown, kind: UploadKind): string | null {
  if (err instanceof DOMException && err.name === 'AbortError') return null;
  if (err instanceof ApiError && err.status === 413) return UPLOAD_COPY[kind].size;
  if (err instanceof ApiError && err.status === 415) return UPLOAD_COPY[kind].type;
  return UPLOAD_COPY.failed;
}
```
**Test:** `upload-errors.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { ApiError } from './http';
import { uploadErrorCopy } from './upload-errors';

describe('uploadErrorCopy', () => {
  it('maps statuses', () => {
    expect(uploadErrorCopy(new DOMException('x', 'AbortError'), 'document')).toBeNull();
    expect(uploadErrorCopy(new ApiError(413, 'PAYLOAD_TOO_LARGE', 'x'), 'document')).toBe('File must be 5 MB or smaller.');
    expect(uploadErrorCopy(new ApiError(415, 'UNSUPPORTED_MEDIA', 'x'), 'photo')).toBe('Use a JPG, PNG or WebP image.');
    expect(uploadErrorCopy(new ApiError(500, 'INTERNAL', 'x'), 'photo')).toBe('Upload failed. Check your connection and try again.');
    expect(uploadErrorCopy(new ApiError(0, 'NETWORK', 'x'), 'document')).toBe('Upload failed. Check your connection and try again.');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- format upload-errors`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): upload copy, file size format, provider query keys (M11-T17)"`

### T18 — `useUpload` hook and image size reader
- [x] done
**Files:** `src/lib/use-upload.ts`, `src/lib/use-upload.test.tsx`, `src/lib/image-size.ts`
**Context:** D-7, D-12; S26.E1 states (uploading + Cancel, error); S24.E1.
**Do:**
1. `image-size.ts`:
```ts
/** D-12: natural size of an image file, or null if the browser can't decode it. Tests vi.mock this module. */
export async function readImageSize(file: Blob): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}
```
2. `use-upload.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UploadKind } from '@fixit/contracts';
import { uploadErrorCopy } from './upload-errors';

export type UploadState = { status: 'idle' } | { status: 'uploading'; fileName: string } | { status: 'error'; message: string };

/** One file at a time. `start` resolves with the result, or null when cancelled/failed (state says which). */
export function useUpload<T>(kind: UploadKind, send: (file: File, signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const start = useCallback(
    async (file: File): Promise<T | null> => {
      controller.current?.abort();
      const c = new AbortController();
      controller.current = c;
      setState({ status: 'uploading', fileName: file.name });
      try {
        const result = await send(file, c.signal);
        if (controller.current === c) setState({ status: 'idle' });
        return result;
      } catch (e) {
        const message = uploadErrorCopy(e, kind);
        if (controller.current === c) setState(message === null ? { status: 'idle' } : { status: 'error', message });
        return null;
      }
    },
    [kind, send],
  );
  const cancel = useCallback(() => {
    controller.current?.abort();
  }, []);
  const fail = useCallback((message: string) => {
    setState({ status: 'error', message });
  }, []);
  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);
  return { state, start, cancel, fail, reset };
}
```
**Test:** `use-upload.test.tsx`
```ts
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ApiError } from './http';
import { useUpload } from './use-upload';

const file = new File(['x'], 'a.png', { type: 'image/png' });

describe('useUpload', () => {
  it('uploading → idle with the result', async () => {
    const { result } = renderHook(() => useUpload('document', () => Promise.resolve(42)));
    let out: number | null = null;
    await act(async () => {
      out = await result.current.start(file);
    });
    expect(out).toBe(42);
    expect(result.current.state).toEqual({ status: 'idle' });
  });
  it('failure → error copy; cancel → idle without message', async () => {
    const failing = renderHook(() => useUpload('document', () => Promise.reject(new ApiError(500, 'INTERNAL', 'x'))));
    await act(async () => {
      await failing.result.current.start(file);
    });
    expect(failing.result.current.state).toEqual({ status: 'error', message: 'Upload failed. Check your connection and try again.' });
    const hanging = renderHook(() =>
      useUpload('document', (_f, signal) => new Promise<never>((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('a', 'AbortError'))))),
    );
    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = hanging.result.current.start(file);
    });
    expect(hanging.result.current.state).toEqual({ status: 'uploading', fileName: 'a.png' });
    await act(async () => {
      hanging.result.current.cancel();
      await pending;
    });
    expect(hanging.result.current.state).toEqual({ status: 'idle' });
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- use-upload`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): useUpload hook and image size reader (M11-T18)"`

### T19 — Own-provider and verification API + hooks
- [x] done
**Files:** `src/features/provider-business/api.ts`, `src/features/provider-business/hooks.ts`, `src/features/provider-business/hooks.test.tsx`
**Context:** ARCH §4.2 hooks pattern (`features/provider-dashboard/hooks.ts`); `refreshMe` (`features/auth/hooks.ts`); D-10. `http({ form, signal })` already supports multipart.
**Do:**
1. `api.ts`:
```ts
import {
  ENDPOINTS as E,
  type DocumentMeta,
  type DocumentType,
  type OwnProvider,
  type PhotoResult,
  type VerificationState,
} from '@fixit/contracts';
import { ApiError, http, pathOf } from '@/lib/http';

/** null = never started onboarding (404). */
export async function fetchOwnProvider(): Promise<OwnProvider | null> {
  try {
    return await http(pathOf(E.provider_me), { schema: E.provider_me.response });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export function uploadPhoto(file: File, signal: AbortSignal): Promise<PhotoResult> {
  const form = new FormData();
  form.append('file', file);
  return http(pathOf(E.provider_photo_put), { method: 'PUT', form, signal, schema: E.provider_photo_put.response });
}
export const removePhoto = (): Promise<void> =>
  http(pathOf(E.provider_photo_delete), { method: 'DELETE', schema: undefined });

export const fetchVerification = (): Promise<VerificationState> =>
  http(pathOf(E.verification_get), { schema: E.verification_get.response });

export function uploadDocument(type: DocumentType, file: File, signal: AbortSignal): Promise<DocumentMeta> {
  const form = new FormData();
  form.append('type', type);
  form.append('file', file);
  return http(pathOf(E.verification_document_upload), {
    method: 'POST',
    form,
    signal,
    schema: E.verification_document_upload.response,
  });
}
export const deleteDocument = (id: string): Promise<void> =>
  http(pathOf(E.verification_document_delete, { id }), { method: 'DELETE', schema: undefined });

export const submitVerification = (): Promise<VerificationState> =>
  http(pathOf(E.verification_submit), { method: 'POST', schema: E.verification_submit.response });
```
2. `hooks.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DocumentMeta, OwnProvider, VerificationState } from '@fixit/contracts';
import { refreshMe } from '@/features/auth/hooks';
import { qk } from '@/lib/query-keys';
import { deleteDocument, fetchOwnProvider, fetchVerification, removePhoto, submitVerification, uploadPhoto } from './api';

export const useOwnProvider = (enabled = true) =>
  useQuery({ queryKey: qk.ownProvider, queryFn: fetchOwnProvider, enabled });

/** Upload result → patch the cached OwnProvider (no refetch). */
export function usePhotoCache() {
  const qc = useQueryClient();
  return (photoUrl: string | null) => {
    qc.setQueryData<OwnProvider | null>(qk.ownProvider, (old) => (old ? { ...old, photoUrl } : old));
  };
}
export { uploadPhoto };

export function useRemovePhoto() {
  const setPhoto = usePhotoCache();
  return useMutation({ mutationFn: removePhoto, onSuccess: () => setPhoto(null) });
}

export const useVerification = () => useQuery({ queryKey: qk.verification, queryFn: fetchVerification });

/** After a slot upload: replace the cached document of that type. */
export function useDocumentCache() {
  const qc = useQueryClient();
  return {
    put: (doc: DocumentMeta) =>
      qc.setQueryData<VerificationState>(qk.verification, (old) =>
        old ? { ...old, documents: [...old.documents.filter((d) => d.type !== doc.type), doc] } : old,
      ),
    drop: (id: string) =>
      qc.setQueryData<VerificationState>(qk.verification, (old) =>
        old ? { ...old, documents: old.documents.filter((d) => d.id !== id) } : old,
      ),
  };
}

export function useDeleteDocument() {
  const cache = useDocumentCache();
  return useMutation({ mutationFn: (id: string) => deleteDocument(id), onSuccess: (_v, id) => cache.drop(id) });
}

/** A27: status card updates; Me refresh moves the nav dot and the L3 banner. */
export function useSubmitVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitVerification,
    onSuccess: (state) => {
      qc.setQueryData(qk.verification, state);
      void qc.invalidateQueries({ queryKey: qk.ownProvider });
      refreshMe(qc);
    },
  });
}
```
**Test:** `hooks.test.tsx` (fake timers; `createWrapper` from `@/test/render`):
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { FIXED_NOW } from '@/test/fixed-now';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { uploadDocument } from './api';
import { useOwnProvider, useSubmitVerification, useVerification } from './hooks';

describe('provider-business hooks', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('useOwnProvider: null when never started, draft for Kasun', async () => {
    signInAs('customer');
    const a = renderHook(() => useOwnProvider(), { wrapper: createWrapper() });
    await waitFor(() => expect(a.result.current.isSuccess).toBe(true));
    expect(a.result.current.data).toBeNull();
    signInAs('providerDraft');
    const b = renderHook(() => useOwnProvider(), { wrapper: createWrapper() });
    await waitFor(() => expect(b.result.current.data?.onboarding.step).toBe(3));
  });
  it('upload both NIC sides then submit → pending, Me refreshed', async () => {
    signInAs('providerNotSubmitted');
    const signal = new AbortController().signal;
    await uploadDocument('nic_front', new File(['x'], 'f.png', { type: 'image/png' }), signal);
    await uploadDocument('nic_back', new File(['x'], 'b.pdf', { type: 'application/pdf' }), signal);
    const wrapper = createWrapper();
    const v = renderHook(() => ({ state: useVerification(), submit: useSubmitVerification() }), { wrapper });
    await waitFor(() => expect(v.result.current.state.data?.documents).toHaveLength(2));
    await act(async () => {
      await v.result.current.submit.mutateAsync();
    });
    expect(v.result.current.state.data?.status).toBe('pending_review');
    await waitFor(() => expect(authStore.getState().me?.provider?.verificationStatus).toBe('pending_review'));
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- provider-business/hooks`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): own provider and verification hooks (M11-T19)"`

### T20 — Onboarding API, hooks and resume rule
- [x] done
**Files:** `src/features/onboarding/api.ts`, `src/features/onboarding/hooks.ts`, `src/features/onboarding/hooks.test.tsx`, `src/features/onboarding/step-route.ts`, `src/features/onboarding/step-route.test.ts`, `src/features/onboarding/steps.ts`
**Context:** D-1, D-2, D-4, D-5; `updateMe` (`features/account/api.ts`); `refreshMe`.
**Do:**
1. `steps.ts`:
```ts
/** SPEC S19 step table. Index = step − 1. */
export const STEPS = [
  { title: 'Business details', sub: 'This is what customers see first.' },
  { title: 'Category', sub: 'Choose the one category that fits your work best.' },
  { title: 'Services & prices', sub: 'Add the services you offer. Your lowest price shows as "Starting at".' },
  { title: 'Service areas', sub: 'Where do you work? Customers in these towns can find you.' },
  { title: 'Profile photo', sub: 'A clear photo of you or your logo builds trust.' },
] as const;
export type WizardStep = 1 | 2 | 3 | 4 | 5;
```
2. `step-route.ts`:
```ts
import type { WizardStep } from './steps';

/** D-2. Returns the step to render; if it differs from the URL, the page redirects there. */
export function resolveStep(raw: string | undefined, saved: number, fromWizard: boolean): WizardStep {
  const savedStep = Math.min(5, Math.max(1, Math.trunc(saved))) as WizardStep;
  const n = raw !== undefined && /^[1-5]$/.test(raw) ? (Number(raw) as WizardStep) : null;
  if (n === null || !fromWizard) return savedStep;
  return n <= savedStep ? n : savedStep;
}
```
   Test `step-route.test.ts`: `resolveStep('1', 4, false)` → 4; `resolveStep('3', 4, true)` → 3; `resolveStep('5', 4, true)` → 4; `resolveStep('x', 2, true)` → 2; `resolveStep('9', 1, false)` → 1; `resolveStep('1', 1, false)` → 1.
3. `api.ts`:
```ts
import { ENDPOINTS as E, type OwnProvider } from '@fixit/contracts';
import type { OnboardingStep1Body, OnboardingStep2Body, OnboardingStep3Body, OnboardingStep4Body } from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export type StepBody =
  | { step: 1; body: OnboardingStep1Body }
  | { step: 2; body: OnboardingStep2Body }
  | { step: 3; body: OnboardingStep3Body }
  | { step: 4; body: OnboardingStep4Body };

export const saveStep = ({ step, body }: StepBody): Promise<OwnProvider> =>
  http(pathOf(E.provider_onboarding_save, { step: String(step) }), {
    method: 'PUT',
    body,
    schema: E.provider_onboarding_save.response,
  });

export const publishListing = (): Promise<OwnProvider> =>
  http(pathOf(E.provider_publish), { method: 'POST', schema: E.provider_publish.response });
```
4. `hooks.ts`:
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMe } from '@/features/account/api';
import { refreshMe } from '@/features/auth/hooks';
import { authStore } from '@/lib/auth-store';
import { qk } from '@/lib/query-keys';
import { publishListing, saveStep, type StepBody } from './api';

/** A21. D-4: a missing mobile is saved through PATCH /me first, in the same mutation. */
export function useSaveStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StepBody & { mobile?: string | undefined }) => {
      if (input.mobile !== undefined) {
        const me = await updateMe({ mobile: input.mobile });
        authStore.setMe(me);
        qc.setQueryData(qk.me, me);
      }
      return saveStep(input);
    },
    onSuccess: (own) => {
      qc.setQueryData(qk.ownProvider, own);
      refreshMe(qc); // Me.provider (draft step, business name)
    },
  });
}

/** A22. D-5: does not touch the auth store; the done page refreshes Me. */
export function usePublishListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: publishListing,
    onSuccess: (own) => {
      qc.setQueryData(qk.ownProvider, own);
      void qc.invalidateQueries({ queryKey: ['catalog'] }); // Discover / profile now include the listing
    },
  });
}
```
   `StepBody & { mobile?: … }` over a union: if TS complains, type the parameter as `{ step: StepBody; mobile?: string | undefined }` and call `saveStep(input.step)`; update T25's call accordingly.
**Test:** `hooks.test.tsx`
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useSaveStep } from './hooks';

describe('onboarding hooks', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());
  it('step 1 with a mobile: PATCH /me then PUT; draft at step 2', async () => {
    const olivia = db().users['u-olivia'];
    if (!olivia) throw new Error('olivia');
    olivia.mobile = null;
    signInAs('customer');
    const { result } = renderHook(() => useSaveStep(), { wrapper: createWrapper() });
    let step = 0;
    await act(async () => {
      const own = await result.current.mutateAsync({
        step: 1,
        body: { businessName: 'Martinez Home Fix', bio: 'Small repairs and odd jobs around the house.', yearsExperience: 4 },
        mobile: '+94771234567',
      });
      step = own.onboarding.step;
    });
    expect(step).toBe(2);
    expect(authStore.getState().me?.mobile).toBe('+94771234567');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- features/onboarding`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): onboarding api, hooks and resume rule (M11-T20)"`

### T21 — Move `AgreedPriceInput` to `components/lkr-input.tsx`
- [x] done
**Files:** `src/features/provider-dashboard/components/agreed-price-input.tsx` (delete), `src/components/lkr-input.tsx` (create), every importer of `AgreedPriceInput`
**Context:** D-13; CLAUDE.md "Component shared by 2+ features".
**Do:**
1. `git mv src/features/provider-dashboard/components/agreed-price-input.tsx src/components/lkr-input.tsx`; rename the export `AgreedPriceInput` → `LkrInput` and its doc comment to "Text input with a fixed `LKR` prefix (agreed price, service price)."
2. `grep -rn "agreed-price-input\|AgreedPriceInput" src` and update each import to `import { LkrInput } from '@/components/lkr-input';` and each usage.
**Verify:** `pnpm --filter @fixit/web typecheck` clean; `pnpm verify` green (no behaviour change).
**Commit:** `git commit -m "refactor(web): share LKR input between features (M11-T21)"`

### T22 — Services editor (`ServiceRowFields` + `ServicesRepeater`)
- [x] done
**Files:** `src/components/services-editor.tsx`, `src/components/services-editor.test.tsx`
**Context:** SPEC S23 field table + live preview `Shows as: from LKR 2,500 / hour`; S19 step 3 (inline rows); D-13, D-14; `formatServicePrice` (`lib/format.ts`); `ServicePriceText`, `ServicesFormValues`, `SERVICES_MAX`, `SERVICES_MAX_MESSAGE` (T2); `FormField`, `LkrInput`, `Input`; radio styling copied from `features/requests/components/slot-control.tsx`.
**Do:** Create `services-editor.tsx`:
```tsx
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { PriceUnit, SERVICES_MAX, SERVICES_MAX_MESSAGE, ServicePriceText, type ServicesFormValues } from '@fixit/contracts';
import { FormField } from '@/components/form-field';
import { LkrInput } from '@/components/lkr-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatServicePrice } from '@/lib/format';

export const UNIT_LABEL: Record<PriceUnit, string> = { per_hour: 'per hour', per_visit: 'per visit', fixed: 'fixed' };
export const EMPTY_SERVICE = { name: '', price: '', unit: 'per_hour' } as const;

/** One service's fields (name, price, unit, Shows as). Hosted by any form whose values are `{ services: [...] }` (S19 step 3, M12 S23 dialog with one row). */
export function ServiceRowFields({ index, onRemove }: { index: number; onRemove?: (() => void) | undefined }) {
  const { register, control, formState } = useFormContext<ServicesFormValues>();
  const row = useWatch({ control, name: `services.${index}` });
  const err = formState.errors.services?.[index];
  const price = ServicePriceText.safeParse(row?.price ?? '');
  const preview = price.success && row ? formatServicePrice(price.data, row.unit) : '—';
  return (
    <fieldset className="border-border flex flex-col gap-4 border-b pb-5 last:border-b-0 last:pb-0">
      <legend className="sr-only">Service {index + 1}</legend>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
        <FormField label="Service name" required error={err?.name?.message}>
          {(p) => <Input {...p} autoComplete="off" {...register(`services.${index}.name`)} />}
        </FormField>
        <FormField label="Price" required error={err?.price?.message}>
          {(p) => <LkrInput {...p} {...register(`services.${index}.price`)} />}
        </FormField>
      </div>
      <fieldset aria-invalid={err?.unit ? true : undefined}>
        <legend className="text-label text-text mb-1.5 font-semibold">Unit</legend>
        <div className="bg-page grid grid-cols-3 gap-1 rounded-lg p-1">
          {PriceUnit.options.map((unit) => (
            <label
              key={unit}
              className="text-body-sm text-text-muted has-checked:bg-surface has-checked:text-text has-checked:shadow-xs has-focus-visible:ring-ring has-focus-visible:ring-2 relative flex h-11 cursor-pointer items-center justify-center rounded-md font-semibold"
            >
              <input type="radio" value={unit} className="sr-only" {...register(`services.${index}.unit`)} />
              {UNIT_LABEL[unit]}
            </label>
          ))}
        </div>
        {err?.unit?.message && <p className="text-meta text-danger-text mt-1.5">{err.unit.message}</p>}
      </fieldset>
      <div className="flex items-center justify-between gap-3">
        <p className="text-meta text-text-muted">
          Shows as: <span className="text-text font-semibold">{preview}</span>
        </p>
        {onRemove && (
          <Button type="button" variant="secondary" size="sm" onClick={onRemove} className="min-h-11 sm:min-h-0">
            <Trash2 aria-hidden="true" />
            Remove<span className="sr-only"> service {index + 1}</span>
          </Button>
        )}
      </div>
    </fieldset>
  );
}

/** S19 step 3: inline rows, 0–20 while editing (the schema requires ≥ 1 on submit). */
export function ServicesRepeater() {
  const { control, formState } = useFormContext<ServicesFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'services' });
  const listError = formState.errors.services?.message ?? formState.errors.services?.root?.message;
  const full = fields.length >= SERVICES_MAX;
  return (
    <div className="flex flex-col gap-5">
      {fields.map((f, i) => (
        <ServiceRowFields key={f.id} index={i} onRemove={() => remove(i)} />
      ))}
      {listError && (
        <p role="alert" className="text-meta text-danger-text">
          {listError}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="outline"
          disabled={full}
          onClick={() => append({ ...EMPTY_SERVICE })}
          className="w-full sm:w-auto sm:self-start"
        >
          <Plus aria-hidden="true" />
          Add service
        </Button>
        {full && <p className="text-meta text-text-muted">{SERVICES_MAX_MESSAGE}</p>}
      </div>
    </div>
  );
}
```
   Use the `Button` variant/size names that exist in `components/ui/button.tsx` (check: `secondary`, `outline`, `sm`); if a name differs, use the closest existing one.
**Test:** `services-editor.test.tsx` — host it in a tiny form:
```tsx
import { describe, expect, it } from 'vitest';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step3Form, type ServicesFormValues } from '@fixit/contracts';
import { EMPTY_SERVICE, ServicesRepeater } from './services-editor';

function Host({ initial }: { initial: ServicesFormValues['services'] }) {
  const form = useForm<ServicesFormValues>({ resolver: zodResolver(Step3Form), defaultValues: { services: initial } });
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <ServicesRepeater />
        <button type="submit">Continue</button>
      </form>
    </FormProvider>
  );
}

describe('ServicesRepeater', () => {
  it('live Shows as preview', async () => {
    render(<Host initial={[{ ...EMPTY_SERVICE }]} />);
    await userEvent.type(screen.getByLabelText(/^Price/), '2500');
    expect(screen.getByText('from LKR 2,500 / hour')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'fixed' }));
    expect(screen.getByText('LKR 2,500 fixed')).toBeInTheDocument();
  });
  it('empty list → Add at least one service.; row errors', async () => {
    render(<Host initial={[{ ...EMPTY_SERVICE }]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Enter a service name.')).toBeInTheDocument();
    expect(screen.getByText('Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Remove/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Add at least one service.')).toBeInTheDocument();
  });
  it('Add disabled at 20 with help', () => {
    render(<Host initial={Array.from({ length: 20 }, (_, i) => ({ name: `S${String(i)}xx`, price: '500', unit: 'per_visit' as const }))} />);
    expect(screen.getByRole('button', { name: 'Add service' })).toBeDisabled();
    expect(screen.getByText('You can list up to 20 services.')).toBeInTheDocument();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- services-editor`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): shared services editor (M11-T22)"`

### T23 — Areas picker
- [x] done
**Files:** `src/components/areas-picker.tsx`, `src/components/areas-picker.test.tsx`
**Context:** SPEC S25 (3 columns desktop, 1 phone, district heading 14/700, rows 44 high on phone, base unticked automatically), S19 step 4 field table; BR-14; `CatalogResponse` (`districts`, `towns` with `districtId`, `order` on district — towns sorted by name within a district); `AreasFormInput`, `OTHER_TOWNS_MAX`, `OTHER_TOWNS_MAX_MESSAGE` (T1). Native `<select>`/`<input type=checkbox>` (same select class as `features/requests/components/request-form.tsx` `selectClass`).
**Do:** Create `areas-picker.tsx` — a controlled component (the step form passes `value` and `onChange`):
```tsx
import { useId } from 'react';
import type { CatalogResponse } from '@fixit/contracts';
import { OTHER_TOWNS_MAX, OTHER_TOWNS_MAX_MESSAGE, type AreasFormInput } from '@fixit/contracts';
import { FormField } from '@/components/form-field';
import { cn } from '@/lib/utils';

const selectClass =
  'border-border-control bg-surface text-body text-text focus-visible:ring-ring h-12 w-full rounded-md border px-3 focus-visible:ring-2 focus-visible:outline-none aria-invalid:border-danger';

export interface AreasPickerProps {
  catalog: Pick<CatalogResponse, 'districts' | 'towns'>;
  value: AreasFormInput;
  onChange: (next: AreasFormInput) => void;
  errors?: { baseTownId?: string | undefined; otherTownIds?: string | undefined };
}

export function AreasPicker({ catalog, value, onChange, errors = {} }: AreasPickerProps) {
  const id = useId();
  const districts = [...catalog.districts].sort((a, b) => a.order - b.order);
  const townsOf = (districtId: string) =>
    catalog.towns.filter((t) => t.districtId === districtId).sort((a, b) => a.name.localeCompare(b.name));
  const count = value.otherTownIds.length;
  const full = count >= OTHER_TOWNS_MAX;
  const setBase = (baseTownId: string) =>
    onChange({ baseTownId, otherTownIds: value.otherTownIds.filter((t) => t !== baseTownId) });
  const toggle = (townId: string, on: boolean) =>
    onChange({
      ...value,
      otherTownIds: on ? [...value.otherTownIds, townId] : value.otherTownIds.filter((t) => t !== townId),
    });
  return (
    <div className="flex flex-col gap-6">
      <FormField label="Base town" required error={errors.baseTownId}>
        {(p) => (
          <select {...p} className={selectClass} value={value.baseTownId} onChange={(e) => setBase(e.target.value)}>
            <option value="">Choose a town</option>
            {districts.map((d) => (
              <optgroup key={d.id} label={d.name}>
                {townsOf(d.id).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </FormField>
      <fieldset aria-describedby={`${id}-count`} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <legend className="text-label text-text font-semibold">Other towns <span className="text-text-subtle ml-1.5 font-medium">Optional</span></legend>
          <p id={`${id}-count`} aria-live="polite" className="text-meta text-text-muted">{count} of {OTHER_TOWNS_MAX} selected</p>
        </div>
        {full && <p className="text-meta text-text-muted">{OTHER_TOWNS_MAX_MESSAGE}</p>}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {districts.map((d) => {
            const towns = townsOf(d.id).filter((t) => t.id !== value.baseTownId);
            if (towns.length === 0) return null;
            return (
              <div key={d.id} className="flex flex-col gap-1">
                <h3 className="text-label text-text font-bold">{d.name}</h3>
                {towns.map((t) => {
                  const checked = value.otherTownIds.includes(t.id);
                  return (
                    <label key={t.id} className={cn('text-body-sm text-text flex min-h-11 items-center gap-3 sm:min-h-9', !checked && full && 'text-text-subtle')}>
                      <input
                        type="checkbox"
                        className="accent-primary size-5"
                        checked={checked}
                        disabled={!checked && full}
                        onChange={(e) => toggle(t.id, e.target.checked)}
                      />
                      {t.name}
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
        {errors.otherTownIds && <p className="text-meta text-danger-text">{errors.otherTownIds}</p>}
      </fieldset>
    </div>
  );
}
```
   `accent-primary` is a token utility (`accent-color: var(--color-primary)`); if lint or Tailwind rejects it, use the shadcn `Checkbox` from `components/ui/checkbox.tsx` with `checked`/`onCheckedChange` instead.
**Test:** `areas-picker.test.tsx` — render with the fixture catalog (`buildWorld(FIXED_NOW)` from `@fixit/fixtures` → `districts`, `towns`) in a stateful host (`useState<AreasFormInput>`):
- choosing base `Colombo` removes `Colombo` from the checkbox list and unticks it if it was ticked;
- ticking 9 towns shows `9 of 9 selected` and `You can add up to 9 other towns.`, and every unchecked checkbox is disabled; unticking one re-enables them;
- `errors.baseTownId = 'Choose your base town.'` renders that text.
**Verify:** `pnpm --filter @fixit/web test -- areas-picker`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): shared service areas picker (M11-T23)"`

### T24 — Photo uploader
- [x] done
**Files:** `src/components/photo-uploader.tsx`, `src/components/photo-uploader.test.tsx`
**Context:** SPEC S24.E1/E2 (none: 160 `primary-soft` tile with category icon; uploading: progress bar under the preview; `Upload photo` / `Replace`; `Remove` → confirm `Remove your photo?` → toast `Photo removed.`); A26; D-7, D-12, D-15; `useUpload` (T18), `readImageSize` (T18), `checkUpload`, `UPLOAD_COPY`, `UPLOAD_LIMITS` (T3); `CategoryIcon` component; `ResponsiveDialog`; `notify` (`lib/toast.ts`).
**Do:** Create `photo-uploader.tsx`:
```tsx
import { useId, useRef, useState } from 'react';
import { checkUpload, UPLOAD_COPY, UPLOAD_LIMITS, type CategoryIcon as CategoryIconName } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';
import { readImageSize } from '@/lib/image-size';
import { notify } from '@/lib/toast';
import { useUpload } from '@/lib/use-upload';

export interface PhotoUploaderProps {
  photoUrl: string | null;
  categoryIcon: CategoryIconName | null;
  upload: (file: File, signal: AbortSignal) => Promise<{ photoUrl: string }>;
  onUploaded: (photoUrl: string) => void;
  remove: () => Promise<void>;
}

export function PhotoUploader({ photoUrl, categoryIcon, upload, onUploaded, remove }: PhotoUploaderProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const { state, start, fail, reset } = useUpload('photo', upload);
  const [confirm, setConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function pick(file: File) {
    reset();
    const problem = checkUpload('photo', { mimeType: file.type, sizeBytes: file.size });
    if (problem) return fail(UPLOAD_COPY.photo[problem]);
    const size = await readImageSize(file);
    if (!size) return fail(UPLOAD_COPY.photo.type);
    if (size.width < UPLOAD_LIMITS.photo.minPx || size.height < UPLOAD_LIMITS.photo.minPx)
      return fail(UPLOAD_COPY.photo.dimensions);
    const result = await start(file);
    if (result) onUploaded(result.photoUrl);
  }
  // …render (below)
}
```
   Render (complete the component with exactly these parts):
   - Wrapper `div.flex.flex-col.gap-4.sm:flex-row.sm:items-start.sm:gap-6`.
   - Preview `size-[160px] shrink-0 overflow-hidden rounded-2xl`: with `photoUrl` → `<img src={photoUrl} alt="Your profile photo" className="size-full object-cover" />`; else `bg-primary-soft text-primary grid place-items-center` with `<CategoryIcon icon={categoryIcon} className="size-14" aria-hidden="true" />` (if `categoryIcon` is null use lucide `ImageIcon`).
   - While `state.status === 'uploading'`: under the preview an indeterminate bar `<div role="progressbar" aria-label={`Uploading ${state.fileName}`} className="bg-primary-soft h-2.5 w-[160px] overflow-hidden rounded-full"><div className="bg-primary h-full w-1/3 animate-pulse rounded-full motion-reduce:animate-none" /></div>`.
   - Right column `flex flex-col gap-2`: H2 is the caller's (not here); help `<p id={`${id}-help`} className="text-meta text-text-muted">{UPLOAD_COPY.photo.help}</p>`; error `<p role="alert" className="text-meta text-danger-text">{state.message}</p>` when `state.status === 'error'`.
   - Hidden input `<input ref={input} type="file" accept={UPLOAD_LIMITS.photo.mimeTypes.join(',')} aria-describedby={`${id}-help`} className="sr-only" aria-label={photoUrl ? 'Replace photo' : 'Upload photo'} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void pick(f); }} />`.
   - Buttons row `flex flex-col gap-2 sm:flex-row`: `Button variant="secondary"` → `input.current?.click()`, label `Upload photo` (no photo) or `Replace`, disabled while uploading, `w-full sm:w-auto`; when `photoUrl` also `Button variant="secondary"` `Remove` → `setConfirm(true)`.
   - `ResponsiveDialog open={confirm} title="Remove your photo?" dismissible={!removing}` footer: `Cancel` (secondary) and `SubmitButton`-like danger `Button variant="danger"` `Remove` (disabled + `aria-busy` while removing). On Remove: `setRemoving(true); try { await remove(); setConfirm(false); notify('Photo removed.'); } catch { notifyError("Couldn't remove. Try again."); } finally { setRemoving(false); }` (§6.3 action-failed copy; import `notifyError`).
**Test:** `photo-uploader.test.tsx` — `vi.mock('@/lib/image-size', () => ({ readImageSize: vi.fn() }))` and `vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }))`; `userEvent.setup({ applyAccept: false })`; render `PhotoUploader` with `upload = vi.fn().mockResolvedValue({ photoUrl: '/api/files/photos/k1' })`, `onUploaded = vi.fn()`, `remove = vi.fn().mockResolvedValue(undefined)`:
- `.gif` → `Use a JPG, PNG or WebP image.`; `upload` not called.
- 6 MB PNG → `Image must be 5 MB or smaller.`
- `readImageSize` resolves `{ width: 300, height: 500 }` → `Image must be at least 400 × 400 pixels.`
- `{ width: 800, height: 800 }` → `upload` called with the file; `onUploaded('/api/files/photos/k1')`.
- `upload` rejects `new ApiError(500, 'INTERNAL', 'x')` → `Upload failed. Check your connection and try again.`
- With `photoUrl` set: `Remove` → dialog `Remove your photo?` → `Remove` → `remove` called, `notify('Photo removed.')`.
**Verify:** `pnpm --filter @fixit/web test -- photo-uploader`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): shared profile photo uploader (M11-T24)"`

### T25 — Wizard frame
- [x] done
**Files:** `src/features/onboarding/components/wizard-frame.tsx`
**Context:** SPEC S19 desktop/phone layout; AC1, AC7; `STEPS` (T20).
**Do:** Create the presentational frame used by every step:
```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { STEPS, type WizardStep } from '../steps';

/** S19 column, stepper and step card. The step renders its own <form>, fields and <WizardFooter>. */
export function WizardFrame({ step, children }: { step: WizardStep; children: ReactNode }) {
  const s = STEPS[step - 1];
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5 px-4 pt-5 pb-6 sm:gap-6 sm:px-8 sm:pt-10 sm:pb-[88px]">
      <div className="flex flex-col gap-2">
        <p className="text-label text-text-muted font-semibold">
          Step {step} of 5 · {s.title}
        </p>
        <div aria-hidden="true" className="flex gap-1">
          {STEPS.map((_, i) => (
            <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-primary-soft')} />
          ))}
        </div>
      </div>
      <section className="sm:border-border sm:bg-surface flex flex-col gap-6 sm:rounded-2xl sm:border sm:p-7">
        <header className="flex flex-col gap-1">
          <h1 className="text-title-lg text-text">{s.title}</h1>
          <p className="text-body-sm text-text-muted">{s.sub}</p>
        </header>
        {children}
      </section>
    </div>
  );
}

/** Desktop: Back left, primary right. Phone (< 641): sticky bottom bar, Back 1/3 · primary 2/3. */
export function WizardFooter({ back, primary, extra }: { back: ReactNode; primary: ReactNode; extra?: ReactNode }) {
  return (
    <div className="bg-surface border-border sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
      {extra && <div className="flex justify-end">{extra}</div>}
      <div className="flex gap-3 sm:justify-between">
        <div className="basis-1/3 sm:basis-auto [&>*]:w-full sm:[&>*]:w-auto">{back}</div>
        <div className="basis-2/3 sm:basis-auto [&>*]:w-full sm:[&>*]:w-auto">{primary}</div>
      </div>
    </div>
  );
}
```
   No test (markup only).
**Verify:** `pnpm --filter @fixit/web typecheck`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): onboarding wizard frame (M11-T25)"`

### T26 — Step 1: Business details
- [x] done
**Files:** `src/features/onboarding/components/step-business.tsx`
**Context:** SPEC S19 step 1 (fields, read-only `Owner: {account name}` + 13 subtle `Change your name in Account settings.`, bio counter `{n} / 600`); BR-23; D-4; `makeStep1Form` (T1); `useSaveStep` (T20); `mapApiErrorToForm`, `FormErrorBanner`, `SubmitButton`, `FormField`, `PhoneInput`, `Input`, `Textarea`; `MobileField` pattern from `features/requests/components/mobile-field.tsx` (here always the input, since it shows only when missing).
**Do:** Shared step contract (used by T26–T30), put at the top of `src/features/onboarding/components/step-props.ts`:
```ts
import type { CatalogResponse, Me, OwnProvider } from '@fixit/contracts';
export interface StepProps {
  me: Me;
  own: OwnProvider | null;
  catalog: CatalogResponse;
  onBack: () => void;
  onSaved: () => void; // page navigates to the next step (D-2)
  onDirtyChange: (dirty: boolean) => void;
}
```
   `step-business.tsx`:
```tsx
export function StepBusiness({ me, own, onBack, onSaved, onDirtyChange }: StepProps) {
  const needsMobile = me.mobile === null;
  const schema = useMemo(() => makeStep1Form(needsMobile), [needsMobile]);
  const form = useForm<Step1FormInput, unknown, Step1FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: own?.businessName ?? '',
      bio: own?.bio ?? '',
      yearsExperience: own?.yearsExperience === null || own === null ? '' : String(own.yearsExperience),
      mobile: '',
    },
  });
  const save = useSaveStep();
  const [banner, setBanner] = useState<string | null>(null);
  const { errors, isDirty } = form.formState;
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);
  const bio = useWatch({ control: form.control, name: 'bio' });
  const submit = form.handleSubmit(async (v) => {
    setBanner(null);
    try {
      await save.mutateAsync({
        step: 1,
        body: { businessName: v.businessName, bio: v.bio, yearsExperience: v.yearsExperience },
        ...(v.mobile === undefined ? {} : { mobile: v.mobile }),
      });
      onSaved();
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError, { mobile_missing: 'mobile' }));
    }
  });
  // render
}
```
   Render inside `<form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">`:
   1. `{banner && <FormErrorBanner>{banner}</FormErrorBanner>}`
   2. `FormField label="Business name" required error={errors.businessName?.message}` → `<Input autoComplete="organization" {...register('businessName')} />`
   3. `FormField label="Short bio" required error={errors.bio?.message} labelAside={<span className="text-meta text-text-subtle">{bio.length} / 600</span>}` → `<Textarea rows={5} {...register('bio')} />`
   4. `FormField label="Years of experience" required error={errors.yearsExperience?.message}` → `<Input type="number" min={0} max={60} step={1} inputMode="numeric" className="sm:w-40" {...register('yearsExperience')} />`
   5. If `needsMobile`: `FormField label="Mobile number" required error={errors.mobile?.message}` → `<PhoneInput {...register('mobile')} />`
   6. Owner block: `<div className="flex flex-col gap-0.5"><p className="text-body-sm text-text">Owner: {me.fullName}</p><p className="text-meta text-text-subtle">Change your name in <Link to="/account" className="text-primary font-semibold">Account settings</Link>.</p></div>` — the visible text must read `Change your name in Account settings.`
   7. `<WizardFooter back={<Button type="button" variant="secondary" onClick={onBack}>Back</Button>} primary={<SubmitButton pending={save.isPending} pendingLabel="Saving…">Continue</SubmitButton>} />`
   States: default (prefilled from the draft), validation errors (SPEC copy from the schema; RHF focuses the first), submitting (`Saving…`, fields stay editable), server/network failure (§6.3 banner `We couldn't save your changes. Check your connection and try again.`, values kept).
**Verify:** `pnpm --filter @fixit/web typecheck`; behaviour is tested by the page test (T31). `pnpm verify` green.
**Commit:** `git commit -m "feat(web): onboarding step 1 business details (M11-T26)"`

### T27 — Step 2: Category
- [x] done
**Files:** `src/features/onboarding/components/step-category.tsx`
**Context:** SPEC S19 step 2 (radio cards: icon tile, name, blurb; 2 columns desktop, 1 phone; note 13 muted `You can only choose one category. Changing it later means we check your documents again.`); §2.9 Option row (selected `primary` border + `primary-soft` bg); `OnboardingStep2Body` (T1); `CategoryIcon`.
**Do:** Same skeleton as T26 (`useForm<OnboardingStep2Body>({ resolver: zodResolver(OnboardingStep2Body), defaultValues: { categoryId: own?.category?.id ?? '' } })`, banner, dirty, `useSaveStep` with `{ step: 2, body: v }`, `WizardFooter` with `Continue`/`Saving…`). Fields:
```tsx
<fieldset aria-describedby={noteId} className="flex flex-col gap-3">
  <legend className="sr-only">Category</legend>
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {[...catalog.categories].sort((a, b) => a.order - b.order).map((c) => (
      <label key={c.id} className="border-border bg-surface has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:ring-ring has-focus-visible:ring-2 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border-2 p-4">
        <input type="radio" value={c.id} className="sr-only" {...form.register('categoryId')} />
        <span className="bg-primary-soft text-primary grid size-11 shrink-0 place-items-center rounded-lg">
          <CategoryIcon icon={c.icon} className="size-6" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-body text-text font-bold">{c.name}</span>
          <span className="text-meta text-text-muted">{c.blurb}</span>
        </span>
      </label>
    ))}
  </div>
  {errors.categoryId?.message && <p role="alert" className="text-meta text-danger-text">{errors.categoryId.message}</p>}
  <p id={noteId} className="text-meta text-text-muted">You can only choose one category. Changing it later means we check your documents again.</p>
</fieldset>
```
   Back → `onBack`. States as T26 (error message `Choose a category.`).
**Verify:** typecheck; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): onboarding step 2 category (M11-T27)"`

### T28 — Step 3: Services & prices
- [ ] done
**Files:** `src/features/onboarding/components/step-services.tsx`
**Context:** S19 step 3; D-14; `Step3Form`, `ServicesFormValues` (T2); `ServicesRepeater`, `EMPTY_SERVICE` (T22).
**Do:** `useForm<ServicesFormValues, unknown, z.output<typeof Step3Form>>({ resolver: zodResolver(Step3Form), defaultValues: { services: own && own.services.length > 0 ? own.services.map((s) => ({ name: s.name, price: String(s.price), unit: s.unit })) : [{ ...EMPTY_SERVICE }] } })`. Wrap the form in `<FormProvider {...form}>`, render `<ServicesRepeater />`, banner, `WizardFooter` (`Continue`/`Saving…`). Submit: `save.mutateAsync({ step: 3, body: { services: v.services } })`, then `onSaved()`. Server field errors (e.g. `services.1.name`) land on the row through `mapApiErrorToForm` (field paths equal the form's).
**Verify:** typecheck; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): onboarding step 3 services (M11-T28)"`

### T29 — Step 4: Service areas
- [ ] done
**Files:** `src/features/onboarding/components/step-areas.tsx`
**Context:** S19 step 4; `AreasBody`, `AreasFormInput` (T1); `AreasPicker` (T23).
**Do:** Same skeleton as T26 (banner, dirty reporting, `useSaveStep`, `WizardFooter` with `Continue`/`Saving…`).
```tsx
const form = useForm<AreasFormInput, unknown, AreasBody>({
  resolver: zodResolver(AreasBody),
  defaultValues: { baseTownId: own?.baseTown?.id ?? '', otherTownIds: own?.otherTowns.map((t) => t.id) ?? [] },
});
const baseTownId = useWatch({ control: form.control, name: 'baseTownId' });
const otherTownIds = useWatch({ control: form.control, name: 'otherTownIds' });
const { errors, isDirty, isSubmitted } = form.formState;
// …
<AreasPicker
  catalog={catalog}
  value={{ baseTownId, otherTownIds }}
  onChange={(v) => {
    form.setValue('baseTownId', v.baseTownId, { shouldDirty: true, shouldValidate: isSubmitted });
    form.setValue('otherTownIds', v.otherTownIds, { shouldDirty: true, shouldValidate: isSubmitted });
  }}
  errors={{ baseTownId: errors.baseTownId?.message, otherTownIds: errors.otherTownIds?.message }}
/>
```
   Submit: `save.mutateAsync({ step: 4, body: v })`, then `onSaved()`. States: default (prefilled), `Choose your base town.`, submitting, banner on failure.
**Verify:** typecheck; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): onboarding step 4 service areas (M11-T29)"`

### T30 — Step 5: Photo and publish
- [ ] done
**Files:** `src/features/onboarding/components/step-photo.tsx`
**Context:** S19 step 5 (`Skip for now` link next to the publish button; `Publish listing` → `Publishing…`); A22; D-5, D-6; `PhotoUploader` (T24); `uploadPhoto`, `usePhotoCache`, `useRemovePhoto` (T19); `usePublishListing` (T20).
**Do:**
```tsx
export function StepPhoto({ own, onBack, onSaved }: StepProps) {
  const publish = usePublishListing();
  const setPhoto = usePhotoCache();
  const removeMutation = useRemovePhoto();
  const [banner, setBanner] = useState<string | null>(null);
  const run = async () => {
    setBanner(null);
    try {
      await publish.mutateAsync();
      onSaved(); // page → /become-a-provider/done
    } catch (e) {
      setBanner(mapApiErrorToForm(e, () => undefined)); // no fields on this step → banner
    }
  };
  // render
}
```
   Render (no `<form>`; buttons are `type="button"`):
   1. `{banner && <FormErrorBanner>{banner}</FormErrorBanner>}`
   2. `<PhotoUploader photoUrl={own?.photoUrl ?? null} categoryIcon={own?.category?.icon ?? null} upload={uploadPhoto} onUploaded={setPhoto} remove={() => removeMutation.mutateAsync()} />`
   3. `<WizardFooter back={<Button variant="secondary" onClick={onBack}>Back</Button>} primary={<Button onClick={() => void run()} disabled={publish.isPending} aria-busy={publish.isPending || undefined}>{publish.isPending && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}{publish.isPending ? 'Publishing…' : 'Publish listing'}</Button>} extra={own?.photoUrl ? undefined : <button type="button" onClick={() => void run()} disabled={publish.isPending} className="text-label text-primary inline-flex min-h-11 items-center font-semibold sm:min-h-0">Skip for now</button>} />`
   `mapApiErrorToForm`'s second arg must be a `UseFormSetError`; if the typing rejects `() => undefined`, use `useForm()` with no fields and pass its `setError`.
**Verify:** typecheck; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): onboarding step 5 photo and publish (M11-T30)"`

### T31 — S19 page: gate, loading, resume, discard
- [ ] done
**Files:** `src/features/onboarding/pages/become-provider-page.tsx`, `src/features/onboarding/components/email-gate.tsx`, `src/features/onboarding/pages/become-provider-page.test.tsx`, `src/app/chunks/onboarding.tsx`
**Context:** S19 Gate; AC1, AC3, AC7 (discard), AC8, AC9; D-2, D-15; `resolveStep` (T20); `useOwnProvider` (T19); `useCatalog` (`features/site/hooks.ts`); `LoadingRegion`, `SkeletonSectionCard`, `SectionError`, `DiscardChangesGuard`; `BlockedCard` (`features/requests/components/blocked-card.tsx`) for the S12 card; request-form-page's "set state, then navigate in an effect" pattern so the discard guard is already off when navigating.
**Do:**
1. `email-gate.tsx`:
```tsx
import { BlockedCard } from '@/features/requests/components/blocked-card';
export function EmailGate({ email }: { email: string }) {
  return (
    <BlockedCard
      block={{
        kind: 'card',
        icon: 'mail',
        title: 'Confirm your email first',
        body: `We sent a link to ${email}. Confirm it, then come back to set up your listing.`,
        action: { label: 'Resend email', resend: true },
      }}
    />
  );
}
```
2. `become-provider-page.tsx`:
```tsx
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { useOwnProvider } from '@/features/provider-business/hooks';
import { useCatalog } from '@/features/site/hooks';
import { useAuth } from '@/lib/auth-store';
import { EmailGate } from '../components/email-gate';
import { StepAreas } from '../components/step-areas';
import { StepBusiness } from '../components/step-business';
import { StepCategory } from '../components/step-category';
import { StepPhoto } from '../components/step-photo';
import { StepServices } from '../components/step-services';
import { WizardFrame } from '../components/wizard-frame';
import { resolveStep } from '../step-route';
import type { WizardStep } from '../steps';

const STEP_COMPONENT = { 1: StepBusiness, 2: StepCategory, 3: StepServices, 4: StepAreas, 5: StepPhoto } as const;

export function BecomeProviderPage() {
  const { me } = useAuth();
  const { step: raw } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromWizard = (location.state as { wizard?: boolean } | null)?.wizard === true;
  const confirmed = me?.emailConfirmed ?? false;
  const own = useOwnProvider(confirmed);
  const catalog = useCatalog();
  const [dirty, setDirty] = useState(false);
  const [next, setNext] = useState<WizardStep | 'done' | null>(null);
  useEffect(() => {
    if (next === null) return;
    setNext(null);
    void navigate(next === 'done' ? '/become-a-provider/done' : `/become-a-provider/${String(next)}`, {
      state: { wizard: true },
    });
  }, [next, navigate]);
  useEffect(() => setDirty(false), [raw]);
  const onDirtyChange = useCallback((d: boolean) => setDirty(d), []);

  if (!me) return null; // RequireAuth renders us only when signed in
  if (!confirmed)
    return (
      <div className="mx-auto w-full max-w-[720px] px-4 pt-5 pb-14 sm:px-8 sm:pt-10">
        <EmailGate email={me.email} />
      </div>
    );
  const loading = own.isPending || catalog.isPending;
  if (own.isError || catalog.isError)
    return (
      <div className="mx-auto w-full max-w-[720px] px-4 pt-5 pb-14 sm:px-8 sm:pt-10">
        <SectionError onRetry={() => { void own.refetch(); void catalog.refetch(); }} />
      </div>
    );
  if (loading || !catalog.data)
    return (
      <LoadingRegion loading className="mx-auto w-full max-w-[720px] px-4 pt-5 sm:px-8 sm:pt-10" skeleton={<SkeletonSectionCard lines={5} />} />
    );
  const saved = own.data?.onboarding.step ?? 1;
  const step = resolveStep(raw, saved, fromWizard);
  if (String(step) !== raw) return <Navigate to={`/become-a-provider/${String(step)}`} replace state={{ wizard: true }} />;
  const Step = STEP_COMPONENT[step];
  return (
    <>
      <DiscardChangesGuard when={dirty && next === null} />
      <WizardFrame step={step}>
        <Step
          key={step}
          me={me}
          own={own.data ?? null}
          catalog={catalog.data}
          onDirtyChange={onDirtyChange}
          onBack={() => {
            if (step === 1) void navigate(-1);
            else void navigate(`/become-a-provider/${String(step - 1)}`, { state: { wizard: true } });
          }}
          onSaved={() => {
            setDirty(false);
            setNext(step === 5 ? 'done' : ((step + 1) as WizardStep));
          }}
        />
      </WizardFrame>
    </>
  );
}
```
   If React Router's `navigate` returns `void` (not a Promise) in the installed version, drop the `void` operators only where lint complains.
3. `chunks/onboarding.tsx`: replace the placeholder `BecomeProviderPage` with `export { BecomeProviderPage } from '@/features/onboarding/pages/become-provider-page';` (leave `OnboardingDonePage` for T32).
**Test:** `become-provider-page.test.tsx` (fake timers, `vi.mock('@/lib/toast', …)`, `Element.prototype.scrollIntoView = vi.fn()` in `beforeEach`, `user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`):
```tsx
  it('AC1: step 1 stepper, errors, owner line, Continue → step 2', async () => {
    signInAs('customer');
    const view = renderRoute('/become-a-provider/1');
    expect(await screen.findByText('Step 1 of 5 · Business details')).toBeInTheDocument();
    expect(screen.getByText('Owner: Olivia Martinez')).toBeInTheDocument();
    const u = user();
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    for (const m of ['Enter your business name.', 'Tell customers about your business in at least 30 characters.', 'Enter a number from 0 to 60.'])
      expect(await screen.findByText(m)).toBeInTheDocument();
    await u.type(screen.getByLabelText(/^Business name/), 'Martinez Home Fix');
    await u.type(screen.getByLabelText(/^Short bio/), 'Small repairs and odd jobs around the house, done well.');
    await u.type(screen.getByLabelText(/^Years of experience/), '4');
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Step 2 of 5 · Category')).toBeInTheDocument();
    expect(view.location()).toBe('/become-a-provider/2');
  });
  it('AC2: step 2 has 8 category radios and the note', async () => { /* seed Olivia's draft at step 2 via applyOnboardingStep(db(), 'u-olivia', …) + commit(), open /become-a-provider/2, expect 8 radios and the note text; Continue without choosing → `Choose a category.` */ });
  it('AC3: resume — Kasun opens /1 → /3 with Silva Electricals saved; Back → step 2 keeps its value', async () => {
    signInAs('providerDraft');
    const view = renderRoute('/become-a-provider/1');
    expect(await screen.findByText('Step 3 of 5 · Services & prices')).toBeInTheDocument();
    expect(view.location()).toBe('/become-a-provider/3');
    await user().click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByText('Step 2 of 5 · Category')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Electrical/ })).toBeChecked();
  });
  it('AC3: Nimal sees the email gate; Marcus → /dashboard', async () => {
    signInAs('customerUnconfirmed');
    const a = renderRoute('/become-a-provider/1');
    expect(await screen.findByText('Confirm your email first')).toBeInTheDocument();
    a.unmount();
    signInAs('provider');
    const b = renderRoute('/become-a-provider/2');
    await waitFor(() => expect(b.location()).toBe('/dashboard'));
  });
  it('AC7: leaving a dirty step asks Discard changes?', async () => {
    signInAs('customer');
    const view = renderRoute('/become-a-provider/1');
    await user().type(await screen.findByLabelText(/^Business name/), 'Martinez');
    void view.router.navigate('/discover');
    expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
    await user().click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(view.location()).toBe('/become-a-provider/1');
  });
  it('AC8: forced 500 on Continue keeps values and shows the banner', async () => {
    signInAs('providerDraft');
    renderRoute('/become-a-provider/3');
    const u = user();
    await u.type(await screen.findByLabelText(/^Service name/), 'Fan fitting');
    await u.type(screen.getByLabelText(/^Price/), '1800');
    armForcedError('provider_onboarding_save', '500');
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText("We couldn't save your changes. Check your connection and try again.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Service name/)).toHaveValue('Fan fitting');
  });
  it('AC9: guest → login with next; admin → S40', async () => {
    const a = renderRoute('/become-a-provider/1');
    await waitFor(() => expect(a.location()).toBe('/login?next=%2Fbecome-a-provider%2F1'));
    a.unmount();
    signInAs('admin');
    renderRoute('/become-a-provider/1');
    expect(await screen.findByRole('heading', { level: 1, name: "You don't have access to this page" })).toBeInTheDocument();
  });
```
   Fill in the AC2 case as described in its comment.
**Verify:** `pnpm --filter @fixit/web test -- become-provider-page`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S19 become-a-provider page (M11-T31)"`

### T32 — Done screen and route move
- [ ] done
**Files:** `src/features/onboarding/pages/done-page.tsx`, `src/features/onboarding/pages/done-page.test.tsx`, `src/app/chunks/onboarding.tsx`, `src/app/routes.tsx`, `src/app/routes.test.tsx`
**Context:** S19 Done row (`CircleCheck` tile; `Your listing is live` / `Customers can now find {Business}. It shows as "Not yet verified" until you upload your ID.`; `Get verified` primary → `/dashboard/verification` · `Go to dashboard` secondary); D-5; AC2 (publish → done), AC4 (nav `Dashboard`, Discover, L3 dot).
**Do:**
1. `routes.tsx`: inside the `RequireAuth`/`RequireRole` children, **before** the `become-a-provider` block, add `{ path: 'become-a-provider/done', lazy: page(onboarding, 'OnboardingDonePage') }` and remove `{ path: 'done', … }` from the `RedirectPublishedProvider` children.
2. `done-page.tsx`:
```tsx
export function OnboardingDonePage() {
  const qc = useQueryClient();
  const own = useOwnProvider();
  useEffect(() => refreshMe(qc), [qc]); // D-5: Me becomes provider now
  if (own.isPending) return <LoadingRegion loading className="mx-auto w-full max-w-[720px] px-4 pt-5 sm:px-8 sm:pt-10" skeleton={<SkeletonSectionCard lines={3} />} />;
  if (own.isError) return <div className="mx-auto w-full max-w-[720px] px-4 pt-5 sm:px-8 sm:pt-10"><SectionError onRetry={() => void own.refetch()} /></div>;
  if (!own.data?.onboarding.complete) return <Navigate to={`/become-a-provider/${String(own.data?.onboarding.step ?? 1)}`} replace />;
  const business = own.data.businessName ?? 'your business';
  // render
}
```
   Render: column `mx-auto w-full max-w-[720px] px-4 pt-5 pb-14 sm:px-8 sm:pt-10 sm:pb-[88px]`; card `border-border bg-surface flex flex-col items-center gap-4 rounded-2xl border p-7 text-center sm:p-10`; tile `bg-success-soft text-success-text grid size-14 place-items-center rounded-xl` with `<CircleCheck className="size-7" aria-hidden="true" />`; `<h1 className="text-title-lg text-text">Your listing is live</h1>`; `<p className="text-body text-text-muted max-w-[480px]">Customers can now find {business}. It shows as "Not yet verified" until you upload your ID.</p>`; buttons `flex w-full flex-col gap-3 sm:w-auto sm:flex-row`: `<Button asChild><Link to="/dashboard/verification">Get verified</Link></Button>` and `<Button asChild variant="secondary"><Link to="/dashboard">Go to dashboard</Link></Button>` (if `Button` has no `asChild`, style the `Link` with the button classes the codebase already uses for link-buttons — grep `buttonVariants`).
3. `chunks/onboarding.tsx`: `export { OnboardingDonePage } from '@/features/onboarding/pages/done-page';` (remove the placeholder and the now-unused `PlaceholderScreen` import).
**Test:** `done-page.test.tsx` — the full AC2/AC4 journey with the UI for step 5 only (seed steps 1–4 through the mock lib):
```tsx
  it('AC2/AC4: publish → done → Dashboard nav, verification dot, listed unverified', async () => {
    const d = db();
    applyOnboardingStep(d, 'u-olivia', { step: 1, body: { businessName: 'Martinez Home Fix', bio: 'Small repairs and odd jobs around the house, done well.', yearsExperience: 4 } }, FIXED_NOW);
    applyOnboardingStep(d, 'u-olivia', { step: 2, body: { categoryId: 'handyman' } }, FIXED_NOW);
    applyOnboardingStep(d, 'u-olivia', { step: 3, body: { services: [{ name: 'Shelf fitting', price: 1800, unit: 'per_hour' }] } }, FIXED_NOW);
    applyOnboardingStep(d, 'u-olivia', { step: 4, body: { baseTownId: 'colombo', otherTownIds: [] } }, FIXED_NOW);
    commit();
    signInAs('customer');
    const view = renderRoute('/become-a-provider/5');
    await user().click(await screen.findByRole('button', { name: 'Publish listing' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Your listing is live' })).toBeInTheDocument();
    expect(screen.getByText('Customers can now find Martinez Home Fix. It shows as "Not yet verified" until you upload your ID.')).toBeInTheDocument();
    expect(view.location()).toBe('/become-a-provider/done');
    await waitFor(() => expect(authStore.getState().me?.roles).toContain('provider'));
    expect(await screen.findByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    await user().click(screen.getByRole('link', { name: 'Get verified' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Verification' })).toBeInTheDocument();
  });
  it('done for a draft → back to its step', async () => {
    signInAs('providerDraft');
    const view = renderRoute('/become-a-provider/done');
    await waitFor(() => expect(view.location()).toBe('/become-a-provider/3'));
  });
```
   The Verification heading assertion needs T35; until then, assert `view.location()` becomes `/dashboard/verification` instead and add the heading assertion in T35. Also add to `routes.test.tsx` (follow its style): Marcus on `/become-a-provider/done` stays on the done page (no redirect to `/dashboard`).
   The L3 warning dot for a `not_submitted` provider already exists (`nav-config.ts` `dot`, rendered by `sidebar-nav.tsx` with sr-only text `Needs attention`). After reaching `/dashboard/verification`, assert `within(screen.getAllByRole('link', { name: /Verification/ })[0]).getByText('Needs attention')` is present.
**Verify:** `pnpm --filter @fixit/web test -- done-page routes`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): onboarding done screen and route (M11-T32)"`

### T33 — Document slot
- [ ] done
**Files:** `src/features/provider-business/components/document-slot.tsx`, `src/features/provider-business/components/document-slot.test.tsx`
**Context:** SPEC S26.E1 (empty: dashed `border-strong` drop zone r14, `Upload` icon, button `Choose file`; uploading: progress bar + `Cancel`; uploaded: thumbnail (image) or `FileText` (PDF), filename (ellipsis), size, `Replace` · `Remove`; error: danger border + message; click/tap or drag-drop; phone picker incl. camera), S26 field table; D-7, D-9, D-15; `useUpload` (T18), `checkUpload`, `UPLOAD_COPY`, `UPLOAD_LIMITS` (T3), `uploadDocument`, `useDocumentCache`, `useDeleteDocument` (T19), `formatFileSize` (T17).
**Do:**
```tsx
import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { FileImage, FileText, LoaderCircle, Upload } from 'lucide-react';
import { checkUpload, UPLOAD_COPY, UPLOAD_LIMITS, type DocumentMeta, type DocumentType } from '@fixit/contracts';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/format';
import { useUpload } from '@/lib/use-upload';
import { cn } from '@/lib/utils';
import { uploadDocument } from '../api';
import { useDeleteDocument, useDocumentCache } from '../hooks';

export const SLOT_TITLE: Record<DocumentType, string> = {
  nic_front: 'NIC — front',
  nic_back: 'NIC — back',
  trade_certificate: 'Trade certificate or NVQ',
  business_registration: 'Business registration',
};
export const SLOT_REQUIRED: Record<DocumentType, boolean> = {
  nic_front: true,
  nic_back: true,
  trade_certificate: false,
  business_registration: false,
};

interface DocumentSlotProps {
  type: DocumentType;
  doc: DocumentMeta | null;
  /** Submit-time message (`Upload the front of your NIC.`); the slot's own upload errors win. */
  missingError?: string | undefined;
  onBusyChange: (type: DocumentType, busy: boolean) => void;
  onUploaded: (type: DocumentType) => void;
}

export function DocumentSlot({ type, doc, missingError, onBusyChange, onUploaded }: DocumentSlotProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const cache = useDocumentCache();
  const del = useDeleteDocument();
  const send = (file: File, signal: AbortSignal) => uploadDocument(type, file, signal);
  const { state, start, cancel, fail, reset } = useUpload('document', send);
  const [preview, setPreview] = useState<string | null>(null);
  const busy = state.status === 'uploading';
  useEffect(() => onBusyChange(type, busy), [busy, type, onBusyChange]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function pick(file: File) {
    reset();
    const problem = checkUpload('document', { mimeType: file.type, sizeBytes: file.size });
    if (problem) return fail(UPLOAD_COPY.document[problem]);
    const meta = await start(file);
    if (!meta) return;
    cache.put(meta);
    setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    onUploaded(type);
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && !busy) void pick(f);
  };
  const error = state.status === 'error' ? state.message : doc ? undefined : missingError;
  // render
}
```
   Render (`<section aria-labelledby={`${id}-t`}>`):
   - Title row: `<h3 id={`${id}-t`} className="text-body text-text font-bold">{SLOT_TITLE[type]}</h3>` + tag `<span className="text-caption text-text-subtle font-semibold">{SLOT_REQUIRED[type] ? 'Required' : 'Optional'}</span>`; help `<p id={`${id}-help`} className="text-meta text-text-muted">{UPLOAD_COPY.document.help}</p>`.
   - Hidden input: `<input ref={input} type="file" className="sr-only" accept={UPLOAD_LIMITS.document.mimeTypes.join(',')} aria-label={`${doc ? 'Replace' : 'Choose file for'} ${SLOT_TITLE[type]}`} aria-describedby={`${id}-help`} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void pick(f); }} />` (no `capture` attribute: phones then offer camera **and** files).
   - Box classes: `rounded-lg p-4 flex flex-col gap-3`, plus `border border-dashed border-border-strong bg-page items-center text-center` when empty/uploading, `border border-border bg-surface` when uploaded, and `border-danger` (solid, replaces the others' colour) when `error`. `onDragOver={(e) => e.preventDefault()}` and `onDrop={onDrop}` on the box.
   - **Uploading** (`busy`): `<div role="progressbar" aria-label={`Uploading ${state.fileName}`} className="bg-primary-soft h-2.5 w-full overflow-hidden rounded-full"><div className="bg-primary h-full w-1/3 animate-pulse rounded-full motion-reduce:animate-none" /></div>` + filename line `text-meta text-text-muted truncate` + `<Button type="button" variant="secondary" size="sm" onClick={cancel}>Cancel</Button>`.
   - **Uploaded** (`doc && !busy`): row `flex items-center gap-3 min-w-0`: thumbnail `size-14 shrink-0 rounded-md overflow-hidden bg-surface-muted grid place-items-center` → `preview` ? `<img src={preview} alt="" className="size-full object-cover" />` : `doc.mimeType === 'application/pdf'` ? `<FileText className="text-text-muted size-7" aria-hidden="true" />` : `<FileImage className="text-text-muted size-7" aria-hidden="true" />`; text column `min-w-0 flex-1`: `<p className="text-body-sm text-text truncate font-semibold">{doc.fileName}</p>` + `<p className="text-meta text-text-muted">{formatFileSize(doc.sizeBytes)}</p>`. Actions `flex gap-2`: `Replace` (secondary, opens the picker) · `Remove` (secondary; `del.mutate(doc.id)`; while `del.isPending` show `LoaderCircle` and disable; on error `fail("Couldn't remove. Try again.")`). Buttons `min-h-11 sm:min-h-0`.
   - **Empty** (`!doc && !busy`): `<Upload className="text-text-muted size-6" aria-hidden="true" />` + `<Button type="button" variant="secondary" onClick={() => input.current?.click()}>Choose file</Button>`.
   - **Error**: `<p role="alert" className="text-meta text-danger-text">{error}</p>` under the box.
**Test:** `document-slot.test.tsx` — render with `createWrapper()`, `signInAs('providerNotSubmitted')`, prime `qc.setQueryData(qk.verification, …)` from `fetchVerification()`; `userEvent.setup({ applyAccept: false })`; upload via `user.upload(screen.getByLabelText(/Choose file for NIC — front/), file)`:
- `.docx` (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`) → `Use a JPG, PNG or PDF file.`
- 6 MB PNG → `File must be 5 MB or smaller.`
- forced failure: `armForcedError('verification_document_upload', '500')` → `Upload failed. Check your connection and try again.` in this slot only (render two slots; the other has no alert).
- in-flight: `server.use(http.post('/api/me/provider/verification/documents', () => new Promise(() => undefined)))` → progressbar `Uploading nic.pdf` and `Cancel`; click `Cancel` → back to `Choose file`, no error.
- success PDF → filename, `1 KB`, `FileText` (no `img`), `Replace` and `Remove` buttons; `Remove` → back to `Choose file`.
**Verify:** `pnpm --filter @fixit/web test -- document-slot`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S26 document slot (M11-T33)"`

### T34 — Verification status card and submitted list
- [ ] done
**Files:** `src/features/provider-business/components/verification-status-card.tsx`, `src/features/provider-business/components/submitted-documents.tsx`
**Context:** S26 status table (pill, title, body per state; Rejected danger banner `Reason: {reason}` + `Fix the issue below and submit again.`; Verified body `Verified on {date}. If you change your business name or category, we'll check your documents again.`); `StatusPill kind="verification"`, `NoticeBanner`, `formatDateLong`; `SLOT_TITLE` (T33); `formatFileSize`.
**Do:**
1. `verification-status-card.tsx`:
```tsx
const COPY: Record<VerificationStatus, { title: string; body?: string }> = {
  not_submitted: {
    title: 'Get the Verified badge',
    body: 'Upload your national ID so Fixit can check who you are. Verified providers get a badge and appear under "Verified only".',
  },
  pending_review: { title: "We're checking your documents", body: "This usually takes 1–2 working days. We'll email you when it's done." },
  verified: { title: "You're verified" },
  rejected: { title: "Your documents weren't approved" },
};

export function VerificationStatusCard({ state }: { state: VerificationState }) {
  const c = COPY[state.status];
  return (
    <section className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 sm:p-6">
      <StatusPill kind="verification" status={state.status} className="self-start" />
      <h2 className="text-title-md text-text">{c.title}</h2>
      {c.body && <p className="text-body-sm text-text-muted">{c.body}</p>}
      {state.status === 'verified' && state.verifiedAt && (
        <p className="text-body-sm text-text-muted">
          Verified on {formatDateLong(state.verifiedAt)}. If you change your business name or category, we'll check your documents again.
        </p>
      )}
      {state.status === 'rejected' && (
        <NoticeBanner variant="danger">
          <span className="block">Reason: {state.rejectionReason ?? '—'}</span>
          <span className="block">Fix the issue below and submit again.</span>
        </NoticeBanner>
      )}
    </section>
  );
}
```
2. `submitted-documents.tsx` (read-only list for Pending/Verified; renders nothing when `documents` is empty):
```tsx
export function SubmittedDocuments({ documents }: { documents: DocumentMeta[] }) {
  if (documents.length === 0) return null;
  return (
    <section aria-labelledby="submitted-docs" className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 sm:p-6">
      <h2 id="submitted-docs" className="text-title-sm text-text">Submitted documents</h2>
      <ul className="flex flex-col gap-2">
        {documents.map((d) => (
          <li key={d.id} className="flex min-w-0 items-center gap-3">
            {d.mimeType === 'application/pdf' ? <FileText aria-hidden="true" className="text-text-muted size-5 shrink-0" /> : <FileImage aria-hidden="true" className="text-text-muted size-5 shrink-0" />}
            <span className="text-body-sm text-text font-semibold">{SLOT_TITLE[d.type]}</span>
            <span className="text-meta text-text-muted min-w-0 truncate">{d.fileName} · {formatFileSize(d.sizeBytes)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```
   `Submitted documents` is a section heading not given by SPEC (D-15 family; accessible label for the "read-only list").
**Verify:** typecheck; covered by T35 tests. `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S26 status card and submitted list (M11-T34)"`

### T35 — S26 Verification page
- [ ] done
**Files:** `src/features/provider-business/pages/verification-page.tsx`, `src/features/provider-business/pages/verification-page.test.tsx`, `src/app/chunks/provider.tsx`
**Context:** S26 layout (H1 `Verification`, status card, 2×2 slots desktop / 1 column phone, privacy note `[Lock] Only you and Fixit admins can see these documents.`, submit `Submit for review` / `Submit again`, `Submitting…`, disabled while uploading, toast `Documents submitted. We'll email you when they're checked.`); §6.7 discard (D-16); AC5, AC6, AC7, AC8; `missingRequiredDocuments`, `DOCUMENT_MISSING` (T3); `DocumentSlot`, `VerificationStatusCard`, `SubmittedDocuments` (T33–T34); `useVerification`, `useSubmitVerification` (T19); `LoadingRegion`, `SkeletonSectionCard`, `SectionError`, `SubmitButton`, `DiscardChangesGuard`, `FormErrorBanner`, `notify`.
**Do:**
```tsx
const SLOTS: DocumentType[] = ['nic_front', 'nic_back', 'trade_certificate', 'business_registration'];

export function VerificationPage() {
  const v = useVerification();
  const submit = useSubmitVerification();
  const [busy, setBusy] = useState<Partial<Record<DocumentType, boolean>>>({});
  const [uploadedThisVisit, setUploadedThisVisit] = useState(false);
  const [missing, setMissing] = useState<Partial<Record<DocumentType, string>>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const onBusyChange = useCallback((t: DocumentType, b: boolean) => setBusy((s) => (s[t] === b ? s : { ...s, [t]: b })), []);
  const onUploaded = useCallback(() => setUploadedThisVisit(true), []);
  const anyBusy = Object.values(busy).some(Boolean);

  async function onSubmit() {
    if (!v.data) return;
    setBanner(null);
    const gaps = missingRequiredDocuments(v.data.documents.map((d) => d.type));
    setMissing(Object.fromEntries(gaps.map((t) => [t, DOCUMENT_MISSING[t]])));
    if (gaps.length > 0) return;
    try {
      await submit.mutateAsync();
      setUploadedThisVisit(false);
      notify("Documents submitted. We'll email you when they're checked.");
    } catch (e) {
      setBanner(e instanceof ApiError && e.rule === 'documents_missing' ? DOCUMENT_MISSING.nic_front : FORM_COPY.saveFailed);
    }
  }
  // render
}
```
   Render: wrapper `flex flex-col gap-5 sm:gap-7 max-w-[880px]`; `<h1 className="text-title-lg text-text">Verification</h1>`; then
   - **Loading**: `<LoadingRegion loading skeleton={<><SkeletonSectionCard lines={3} /><SkeletonSectionCard lines={6} /></>} />`.
   - **Error**: `<SectionError onRetry={() => void v.refetch()} />`.
   - **Data**: `<DiscardChangesGuard when={anyBusy || uploadedThisVisit} />`; `<VerificationStatusCard state={v.data} />`; if `v.data.editable`: banner (`FormErrorBanner`) when set; card `border-border bg-surface flex flex-col gap-5 rounded-2xl border p-5 sm:p-6` containing `<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">` with the 4 `DocumentSlot`s (`doc = v.data.documents.find((d) => d.type === t) ?? null`, `missingError={missing[t]}`), the privacy note `<p className="text-meta text-text-muted flex items-center gap-2"><Lock aria-hidden="true" className="size-4" />Only you and Fixit admins can see these documents.</p>`, and the submit button. The card element is a `<form noValidate onSubmit={(e) => { e.preventDefault(); void onSubmit(); }}>` (because `SubmitButton` is always `type="submit"`), and the button is `<SubmitButton pending={submit.isPending} pendingLabel="Submitting…" disabled={anyBusy} className="w-full sm:w-auto sm:self-start">{v.data.status === 'rejected' ? 'Submit again' : 'Submit for review'}</SubmitButton>`. If not editable: `<SubmittedDocuments documents={v.data.documents} />`.
   Phone (< 641): slots 1 column (`grid-cols-1`), submit full width. Forbidden: handled by the route (customer → onboarding redirect, admin → S40).
2. `chunks/provider.tsx`: replace the `VerificationPage` placeholder with `export { VerificationPage } from '@/features/provider-business/pages/verification-page';`.
**Test:** `verification-page.test.tsx` (fake timers; toast mocked; `userEvent.setup({ applyAccept: false, advanceTimers: vi.advanceTimersByTime })`):
```tsx
  it('AC5: Hank — copy, 4 slots, errors, submit → pending with read-only list', async () => {
    signInAs('providerNotSubmitted');
    renderRoute('/dashboard/verification');
    expect(await screen.findByRole('heading', { level: 2, name: 'Get the Verified badge' })).toBeInTheDocument();
    expect(screen.getAllByText('JPG, PNG or PDF, up to 5 MB')).toHaveLength(4);
    expect(screen.getAllByText('Required')).toHaveLength(2);
    expect(screen.getAllByText('Optional')).toHaveLength(2);
    expect(screen.getByText('Only you and Fixit admins can see these documents.')).toBeInTheDocument();
    const u = user();
    await u.upload(screen.getByLabelText(/Choose file for NIC — front/), new File([new Uint8Array(900)], 'front.png', { type: 'image/png' }));
    expect(await screen.findByText('front.png')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Submit for review' }));
    expect(await screen.findByText('Upload the back of your NIC.')).toBeInTheDocument();
    await u.upload(screen.getByLabelText(/Choose file for NIC — back/), new File([new Uint8Array(900)], 'back.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText('back.pdf')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Submit for review' }));
    expect(await screen.findByRole('heading', { level: 2, name: "We're checking your documents" })).toBeInTheDocument();
    expect(notify).toHaveBeenCalledWith("Documents submitted. We'll email you when they're checked.");
    expect(screen.getByText('Submitted documents')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Submit/ })).not.toBeInTheDocument();
  });
  it('AC6: Grace (rejected) — reason banner, prefilled slots, Submit again', async () => {
    signInAs('providerRejected');
    renderRoute('/dashboard/verification');
    expect(await screen.findByText(/^Reason: The photo of the back of your NIC is blurry/)).toBeInTheDocument();
    expect(screen.getByText('Fix the issue below and submit again.')).toBeInTheDocument();
    expect(screen.getAllByText('nic-front.jpg').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Submit again' })).toBeInTheDocument();
  });
  it("AC6: Marcus (verified) — You're verified + date", async () => {
    signInAs('provider');
    renderRoute('/dashboard/verification');
    expect(await screen.findByRole('heading', { level: 2, name: "You're verified" })).toBeInTheDocument();
    expect(screen.getByText(/^Verified on /)).toBeInTheDocument();
  });
  it('AC7: leaving with an uploaded, unsubmitted file asks Discard changes?', async () => {
    signInAs('providerNotSubmitted');
    const view = renderRoute('/dashboard/verification');
    await user().upload(await screen.findByLabelText(/Choose file for NIC — front/), new File(['x'], 'f.png', { type: 'image/png' }));
    await screen.findByText('f.png');
    void view.router.navigate('/dashboard');
    expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
  });
  it('AC8: load failure shows the section error; retry recovers', async () => {
    signInAs('providerNotSubmitted');
    armForcedError('verification_get', '500');
    renderRoute('/dashboard/verification');
    await user().click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Get the Verified badge' })).toBeInTheDocument();
  });
```
   If the query client retries once before showing the error (ARCH: `retry` < 1 for 5xx), the forced error is consumed by the first try only; the test client has `retry: false`, so the error shows. Also add the deferred T32 heading assertion now.
**Verify:** `pnpm --filter @fixit/web test -- verification-page done-page`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S26 verification page (M11-T35)"`

### T36 — L3 provider banners (§6.8 #1, #3, #4, #5)
- [ ] done
**Files:** `src/app/layouts/parts/use-account-banners.tsx`, `src/app/layouts/parts/use-account-banners.test.tsx`, `src/app/layouts/parts/dashboard-shell.tsx`, `src/app/layouts/public-layout.tsx`
**Context:** SPEC §6.8 rows 1, 3, 4, 5 (copy, variant, action, dismissible); D-17; `NoticeBanner` (supports `action` and `onDismiss`); `Me.provider` (`verificationStatus`, `rejectionReason`, `reverificationReason`).
**Do:**
1. Replace `use-account-banners.tsx`:
```tsx
import { useState, type ReactNode } from 'react';
import { NoticeBanner } from '@/components/notice-banner';
import { UnconfirmedEmailBanner } from '@/features/auth/components/unconfirmed-email-banner';
import { useAuth } from '@/lib/auth-store';

const DISMISS_KEY = (id: string) => `fixit.banner.dismissed.${id}`;
function useSessionDismiss(id: string): [boolean, () => void] {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY(id)) === '1');
  return [
    dismissed,
    () => {
      sessionStorage.setItem(DISMISS_KEY(id), '1');
      setDismissed(true);
    },
  ];
}

const FIELD_LABEL = { business_name: 'business name', category: 'category' } as const;

/** SPEC §6.8 in priority order; BannerSlot shows the first two. Provider rows only in L3 ('dashboard'). */
export function useAccountBanners(area: 'public' | 'dashboard'): ReactNode[] {
  const { me } = useAuth();
  const [badgeDismissed, dismissBadge] = useSessionDismiss('badge-removed');
  const [pendingDismissed, dismissPending] = useSessionDismiss('pending-review');
  if (!me || me.roles.includes('admin')) return [];
  const banners: ReactNode[] = [];
  const p = me.roles.includes('provider') ? me.provider : null;
  if (area === 'dashboard' && p) {
    if (p.verificationStatus === 'rejected')
      banners.push(
        <NoticeBanner key="rejected" variant="danger" action={{ label: 'Fix and resubmit', to: '/dashboard/verification' }}>
          Your verification wasn't approved: {p.rejectionReason ?? ''}
        </NoticeBanner>,
      );
    if (p.verificationStatus === 'pending_review' && p.reverificationReason && !badgeDismissed)
      banners.push(
        <NoticeBanner key="badge-removed" variant="info" onDismiss={dismissBadge}>
          Your Verified badge was removed because you changed your {FIELD_LABEL[p.reverificationReason]}. We're checking your documents again.
        </NoticeBanner>,
      );
    if (p.verificationStatus === 'not_submitted')
      banners.push(
        <NoticeBanner key="not-submitted" variant="warning" action={{ label: 'Get verified', to: '/dashboard/verification' }}>
          Your listing shows as "Not yet verified". Upload your ID to get the Verified badge.
        </NoticeBanner>,
      );
    if (p.verificationStatus === 'pending_review' && !p.reverificationReason && !pendingDismissed)
      banners.push(
        <NoticeBanner key="pending" variant="info" onDismiss={dismissPending}>
          We're checking your documents. We'll email you when it's done.
        </NoticeBanner>,
      );
  }
  if (!me.emailConfirmed) banners.push(<UnconfirmedEmailBanner key="unconfirmed" email={me.email} />);
  return banners;
}
```
2. `dashboard-shell.tsx`: `useAccountBanners('dashboard')`. `public-layout.tsx` (and any other caller found by `grep -rn "useAccountBanners(" src`): `useAccountBanners('public')`.
**Test:** `use-account-banners.test.tsx` — render `/dashboard` with `renderRoute` per persona and assert:
- `providerNotSubmitted` (Hank) → text `Your listing shows as "Not yet verified". Upload your ID to get the Verified badge.` and link `Get verified` → `/dashboard/verification`.
- `providerRejected` (Grace) → `Your verification wasn't approved: The photo of the back of your NIC is blurry. Upload a clearer photo.` and link `Fix and resubmit`.
- Pending review (no persona for Dana): set `const hank = db().providers.p08; if (hank) hank.verificationStatus = 'pending_review'; commit();`, then `signInAs('providerNotSubmitted')` → `We're checking your documents. We'll email you when it's done.`; click `Dismiss` → gone; unmount and render again → still gone (sessionStorage). Set `reverificationReason = 'category'` instead → `Your Verified badge was removed because you changed your category. We're checking your documents again.`
- Marcus (verified) → none of the four texts.
- Customer Olivia on `/` → none of the four texts (public area).
**Verify:** `pnpm --filter @fixit/web test -- use-account-banners public-layout`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): L3 verification banners (M11-T36)"`

### T37 — M11 acceptance checks
- [ ] done
**Files:** `docs/plans/PLAN-M11-onboarding-verification.md` (this file: tick boxes, fill "Acceptance results")
**Context:** milestone acceptance criteria 1–9.
**Do:** Run `pnpm verify`. Then walk each criterion and record ✓/✗ with the evidence under `## Acceptance results`:
1. AC1 — `become-provider-page.test.tsx › AC1`. Manual: `pnpm dev:mock`, Olivia, `/become-a-provider/1` at 1440: stepper text + 5-segment bar, errors, `Owner: Olivia Martinez`, Continue shows `Saving…` (DevPanel latency "slow") → step 2.
2. AC2 — `become-provider-page.test.tsx › AC2`, `services-editor.test.tsx`, `areas-picker.test.tsx`, `photo-uploader.test.tsx`, `done-page.test.tsx › AC2/AC4`. Manual: 8 category cards 2 columns at 1440 / 1 at 390; 20-row cap; 9-town cap; `Publishing…` with slow latency.
3. AC3 — `become-provider-page.test.tsx › AC3 ×2`. Manual: as Olivia save step 3, open `/` then `/become-a-provider/1` → step 4 with values.
4. AC4 — `providers-onboarding.test.ts › publish`, `done-page.test.tsx › AC2/AC4`. Manual: after publishing, `/discover?q=<business>` shows the card with `Not yet verified`.
5. AC5 — `verification-page.test.tsx › AC5`, `document-slot.test.tsx` (docx, 6 MB, progress + Cancel, FileText, Replace · Remove).
6. AC6 — `verification-page.test.tsx › AC6 ×2`.
7. AC7 — `become-provider-page.test.tsx › AC7`, `verification-page.test.tsx › AC7`. Manual at 390: wizard card has no border, sticky `Back` 1/3 / `Continue` 2/3, slots in 1 column, the file picker offers the camera on a real phone or device emulation, `document.documentElement.scrollWidth === 390`.
8. AC8 — `become-provider-page.test.tsx › AC8`, `document-slot.test.tsx` forced failure, `verification-page.test.tsx › AC8`. Manual: DevPanel latency slow → wizard skeleton after 150 ms.
9. AC9 — `become-provider-page.test.tsx › AC9`, `providers-verification.test.ts › files`.
   If any ✗, write it under `## Blockers` and stop.
**Verify:** `pnpm verify` green; every AC has a ✓ line.
**Commit:** `git commit -m "chore: M11 acceptance checks (M11-T37)"`

## Acceptance results
(executor fills in at T37)

## Checkpoints
- After T16: "Human: read `providers-onboarding.test.ts` and `providers-verification.test.ts` and confirm the 401/403/404/409/422 cases match what you expect from the real API in M17."
- After T24: "Human: review the props of `services-editor.tsx`, `areas-picker.tsx` and `photo-uploader.tsx` and confirm M12 (S23 dialog, S25 page, S24 photo card) can reuse them unchanged."
- After T31: "Human: run `pnpm dev:mock`, sign in as Olivia, walk `/become-a-provider/1` → 4 at 1440 and 390 (card without border, sticky bottom bar, no horizontal scroll); leave after step 3 and come back via `/become-a-provider/1`; as Kasun open `/become-a-provider/1`."
- After T32: "Human: publish as Olivia, check the done screen, nav `Dashboard`, the Verification dot, and her card on `/discover`."
- After T35: "Human: open `/dashboard/verification` as Hank, Grace and Marcus at 1440 and 390; upload a real JPG, a real PDF, a >5 MB file and a .docx; drag-drop a file; cancel a slow upload (DevPanel latency slow); submit."

## Blockers
### T7 — Node `FormData` stub breaks existing form-submit tests
- **Problem:** With the T7 stubs in `setup.ts` (`vi.stubGlobal('FormData', NodeFormData)`), `pnpm --filter @fixit/web test` reports all 528 tests passing but **3 unhandled errors**, so vitest exits non-zero. React DOM's form-submit listener calls `new FormData(formElement)`; Node's FormData rejects a jsdom `HTMLFormElement` ("FormData constructor: Argument 1 could not be converted to: undefined"). The plan says to STOP if the stubs break an existing test.
- **Failing test files (they submit a form):** `src/features/site/pages/home-page.test.tsx`, `src/features/discover/pages/discover-page.test.tsx`, `src/features/provider-dashboard/pages/requests-page.test.tsx`.
- **Options:**
  1. Replace the stub with a wrapper class: when the first argument is an `HTMLFormElement`, build the jsdom `FormData` (saved before stubbing), otherwise delegate to Node's `FormData`. Keeps D-8, no test changes.
  2. Keep jsdom's `FormData` globally and stub Node's `FormData` only in the upload tests and the handler tests that need it (changes D-8's "every test").
  3. Drop the FormData stub and serialise upload bodies in `http()` itself in the test env (changes T8/T9 design).
- **Recommendation:** option 1.
- **Resolved (user chose option 1):** `setup.ts` stubs a `TestFormData` wrapper that delegates to jsdom's `FormData` for an `HTMLFormElement` argument.

## Nice-to-haves (not tasks)
- Real byte-level upload progress (XHR `upload.onprogress`) once uploads hit the real API (M17); D-7 uses an indeterminate bar.
- Authenticated document thumbnails/preview (fetch the blob with the bearer token and show an object URL) — needed anyway for admin S32 in M13.
- M13/M20 planners: rejecting a submission must pre-stage copies of its documents (ARCH §8.1, D-10), otherwise S26 "slots prefilled" breaks for real rejections.
- §6.8 banner #7 (`You haven't finished setting up your listing.` + `Continue` for a customer with a draft, L1/L2) — not listed in this milestone's scope.
- §6.6 keep wizard values across a session expiry with `useFormDraft` (the request form does this).
- `Me.provider` and `OwnProvider` overlap; M17 could derive one from the other in the API mapper.
- After publish the real API should rotate the access token so its `roles` claim includes `provider` (the mock derives roles from the db on every request).
