# PLAN-M04 — Auth & account screens
Milestone: `docs/milestones/M04-auth-account-screens.md` · Start tag: `m04-start` · Verify-all: `pnpm verify`
Mock domains at start → end: all (`pnpm dev:mock`; `auth` handlers: login, refresh, logout, me) → all (unchanged; `auth` gains register, admin login, confirm, resend, forgot, reset, `PATCH /me`, `POST /me/password` and the MSW-only Google route). **No backend in this milestone** (`apps/api` does not exist yet), so there are no Nest tasks and no authorization-matrix rows. The mock handlers apply the same role and ownership rules the API will.

Conventions for the executor:
- Work on branch `m04-auth-account` (created in T1). One commit per task, using the message given, ending with the attribution lines from your session instructions.
- Run `pnpm format` before `pnpm verify` in every task. The code below may not be Prettier-exact.
- Code blocks are complete files unless the step says "add", "replace" or "edit". Tests import `describe/expect/it/vi` from `vitest` explicitly.
- Paths are under `apps/web/` unless they start with `packages/`, `docs/` or `/`. `@/` = `apps/web/src/`.
- Tailwind: only `sm` (≥641) and `lg` (≥1024) prefixes. Arbitrary **size** values are allowed. Arbitrary colour values and the lint-banned prefixes `text-[`, `bg-[`, `border-[`, `shadow-[`, `ring-[`, `outline-[` are not. Token text sizes: `text-meta` 13, `text-label` 14, `text-body-sm` 15, `text-body` 16, `text-lead` 18, `text-title-md` 20.
- If a library API differs from what the code assumes (react-hook-form 7, `@hookform/resolvers` 5 with zod 4, React Router 7 `useBlocker`), **STOP** and write a blocker. Don't switch majors.
- Copy in quotes is SPEC copy. Use it character for character, including the typographic apostrophes and dashes shown.

Planner's decisions the executor must follow (they fill gaps between the milestone, SPEC and ARCHITECTURE; see "Notes for review" at the end):
- **D-1 Sign-up signs the user in.** `POST /auth/register` returns 204 (ARCH §3.1), but `POST /auth/resend-confirmation` is signed-in only, and S7's `Resend email` must work right after sign-up (AC2). So S6 calls `register`, then `login` with the same credentials (unconfirmed users may log in, SPEC S5), then goes to S7. No contract change.
- **D-2 `RequireGuest` owns the post-login redirect.** After a successful login the page only calls `authStore.setSession()`. The guard that wraps `/login` (and `/admin/login`) then redirects to `postLoginTarget()`: a same-site `next`, else providers → `/dashboard`, others → `/` (admin area: admins → a safe `/admin…` `next`, else `/admin`). This is the single rule for "signed-in user opens `/login`" and "just logged in". S6 is different: it navigates to S7 **before** setting the session, because S7 is not guest-guarded.
- **D-3 `intent` and `next` survive confirmation in sessionStorage** under `fixit.signup.after` (ARCH §6.1 "kept client-side"). S8's `Continue` reads it: `/become-a-provider/1` for provider intent, else the stored `next`, else `/`.
- **D-4 Field-level server rules.** `email_taken`, `current_password_wrong`, `password_reused` and `mobile_missing` (provider clearing the mobile, S18) land on their fields through `mapApiErrorToForm(err, setError, { rule: 'field' })`. The provider-mobile rule is a 422 `RULE_VIOLATION` + `mobile_missing` (BR-23), not a 400.
- **D-5 The mock Google user is a new fixture, Sanduni Wijesinghe** (`sanduni@fixit.test`, `authMethods: ['google']`, no password). `POST /api/auth/google/mock` always signs her in. She is also the "Google-only fixture user" of AC6. A second new fixture, **Ruwan Jayasekara** (`ruwan@fixit.test`, `status: 'suspended'`, password `demo1234`), covers AC4. The mock db version goes to 2.
- **D-6 S5.E2 (context banner with the provider name) is not rendered in M04.** No provider query exists until M07, and the milestone forbids a new endpoint. M07 adds it.
- **D-7 The Google "G" mark is monochrome (`currentColor`).** The four-colour brand mark would need raw hex, which components may not use.
- **D-8 One discard-changes blocker per page.** React Router allows a single active `useBlocker`, so S18 has one `DiscardChangesGuard` driven by "details dirty OR password dirty". It never blocks once the user is signed out (session expiry or logout redirects must pass).
- **D-9 Resend failure copy.** SPEC has no copy for a failed resend. The banner/S7/S8 use `notifyError("Couldn't send the email. Try again.")`, following the §6.3 `Couldn't {…}. Try again.` pattern. A 429 uses the S5 rate-limit copy.
- **D-10 `VITE_GOOGLE_ENABLED=true` goes in `apps/web/.env.mock`.** The repo has no `.env.development`; `pnpm dev:mock` runs Vite in `mock` mode, which reads `.env.mock`.

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `apps/web/package.json` | Modify | `react-hook-form`, `@hookform/resolvers` |
| `/.env.example`, `.env.mock`, `src/vite-env.d.ts`, `src/lib/env.ts` | Modify | `VITE_GOOGLE_ENABLED` → `GOOGLE_ENABLED` |
| `packages/contracts/src/common/primitives.ts` (+ test) | Modify | `MOBILE_MESSAGE`, `MobileOrEmpty` |
| `packages/contracts/src/auth/schemas.ts` (+ test) | Modify | M04 bodies, results, form schemas, SPEC copy constants |
| `packages/contracts/src/endpoints.ts` (+ test) | Modify | 10 new §3.1 rows |
| `packages/fixtures/src/users.ts` (+ `build.test.ts`) | Modify | Sanduni (Google-only), Ruwan (suspended) |
| `src/mocks/db/schema.ts`, `src/mocks/db/seed.ts` | Modify | token `createdAt`, v2, no password for Google-only |
| `src/mocks/lib/email-tokens.ts` | Create | issue / find confirm and reset tokens, last email link |
| `src/mocks/handlers/auth.ts` (+ `auth.test.ts`) | Modify | 9 new handlers + Google mock |
| `src/mocks/dev/DevPanel.tsx` | Modify | clickable "Last email link" |
| `src/lib/next.ts` (+ test) | Create | `safeNext`, `roleHome`, `postLoginTarget` |
| `src/app/guards/guards.tsx` | Modify | `RequireGuest` uses `postLoginTarget` |
| `src/lib/error-copy.ts` | Create | form banner + rule field copy |
| `src/lib/form-errors.ts` (+ test) | Create | `mapApiErrorToForm` |
| `src/lib/use-form-draft.ts` (+ test) | Create | §6.6 draft keep/restore |
| `src/lib/use-cooldown.ts` (+ test) | Create | S7 60 s countdown |
| `src/lib/query-keys.ts` | Modify | `confirmEmail` key |
| `src/features/auth/api.ts`, `hooks.ts` (+ tests) | Modify | auth calls and mutations |
| `src/features/account/api.ts`, `hooks.ts` (+ test) | Create | `PATCH /me`, `POST /me/password` |
| `src/components/form-field.tsx` | Modify | `labelAside` slot |
| `src/components/password-input.tsx` | Create | show/hide password |
| `src/components/submit-button.tsx` | Create | §6.1 submitting button |
| `src/components/form-error-banner.tsx` | Create | §6.3 form banner |
| `src/components/discard-changes-guard.tsx` | Create | §6.7 confirm |
| `src/components/status-pill.tsx` | Modify | `kind: 'email'` |
| `src/features/auth/components/*.tsx` | Create | card header, divider, Google button, unconfirmed banner |
| `src/features/auth/pages/*.tsx` (+ tests) | Create | S5–S10, S29, Google done |
| `src/features/account/components/*.tsx`, `pages/account-page.tsx` (+ test) | Create | S18 |
| `src/app/layouts/parts/use-account-banners.tsx` | Create | §6.8 #6 |
| `src/app/layouts/public-layout.tsx`, `parts/dashboard-shell.tsx` | Modify | pass banners |
| `src/app/chunks/auth.tsx`, `chunks/customer.tsx` | Modify | re-export real pages |

## Tasks

### T1 — Branch, start tag, form dependencies, Google env flag
- [x] done

**Files:** `apps/web/package.json`, `/.env.example`, `apps/web/.env.mock`, `src/vite-env.d.ts`, `src/lib/env.ts`
**Context:** ARCH §10.3 (`VITE_GOOGLE_ENABLED`, default `false`), milestone note "Google button only when `VITE_GOOGLE_ENABLED=true`", D-10.
**Do:**
1. `git checkout -b m04-auth-account && git tag m04-start`
2. `pnpm --filter @fixit/web add react-hook-form @hookform/resolvers`
3. `apps/web/.env.mock` becomes:
   ```
   VITE_MOCK_DOMAINS=all
   VITE_GOOGLE_ENABLED=true
   ```
4. `/.env.example`: add the line `VITE_GOOGLE_ENABLED=false` under `VITE_CONTACT_EMAIL`.
5. `src/vite-env.d.ts`: add `readonly VITE_GOOGLE_ENABLED?: string;` to `ImportMetaEnv`.
6. `src/lib/env.ts`: append
   ```ts
   /** ARCH §10.3: show "Continue with Google" (S5, S6). */
   export const GOOGLE_ENABLED: boolean = import.meta.env.VITE_GOOGLE_ENABLED === 'true';
   ```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "chore(web): form deps and VITE_GOOGLE_ENABLED (M04-T1)"`

### T2 — Contracts: `MobileOrEmpty` primitive
- [x] done

**Files:** `packages/contracts/src/common/primitives.ts`, `primitives.test.ts`
**Context:** SPEC S18 Mobile row (customers may clear it), S12 mobile message.
**Do:**
1. In `primitives.ts`, add above `MobileInput`:
   ```ts
   export const MOBILE_MESSAGE = 'Enter a Sri Lankan mobile number, like 077 123 4567.';
   ```
   and replace the literal message inside `MobileInput`'s `.regex(…)` with `MOBILE_MESSAGE`.
2. Add after `Mobile`:
   ```ts
   /** S18: an empty field clears the number (→ null); anything else must be a valid Sri Lankan mobile. */
   export const MobileOrEmpty = z.string().transform((s, ctx) => {
     if (s.trim() === '') return null;
     const parsed = MobileInput.safeParse(s);
     if (!parsed.success) {
       ctx.addIssue({ code: 'custom', message: MOBILE_MESSAGE });
       return z.NEVER;
     }
     return parsed.data;
   });
   ```
3. Export `MOBILE_MESSAGE` and `MobileOrEmpty` from `packages/contracts/src/index.ts` if it lists exports explicitly (if it uses `export *` from primitives, nothing to do).
**Test:** add to `primitives.test.ts`:
```ts
describe('MobileOrEmpty', () => {
  it.each([
    ['', null],
    ['   ', null],
    ['077 123 4567', '+94771234567'],
    ['+94 77 123 4567', '+94771234567'],
  ])('%j → %j', (input, out) => {
    expect(MobileOrEmpty.parse(input)).toBe(out);
  });
  it('rejects a bad number with the S12 message', () => {
    const r = MobileOrEmpty.safeParse('12345');
    expect(r.success ? [] : r.error.issues.map((i) => i.message)).toEqual([MOBILE_MESSAGE]);
  });
});
```
(add `MobileOrEmpty, MOBILE_MESSAGE` to the file's import from `./primitives`.)
**Verify:** `pnpm --filter @fixit/contracts test` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): MobileOrEmpty primitive (M04-T2)"`

### T3 — Contracts: auth bodies, results and form schemas
- [x] done

**Files:** `packages/contracts/src/auth/schemas.ts`, `schemas.test.ts`
**Context:** ARCH §2.1 auth exports, §3.1; SPEC S6, S10, S18 field tables.
**Do:** in `schemas.ts`, extend the primitives import to `Email, FullName, Id, Mobile, MobileOrEmpty, Password` and add after `LoginBody`:
```ts
/* ---------- SPEC copy used by forms and the server (written once) ---------- */
export const EMAIL_TAKEN = 'This email already has an account.';
export const PASSWORDS_DONT_MATCH = "Passwords don't match.";
export const PASSWORD_REUSED = "Choose a password you haven't just used.";
export const CURRENT_PASSWORD_WRONG = 'Current password is incorrect.';
export const PROVIDER_MOBILE_REQUIRED = 'Providers need a mobile number — customers use it after you accept.';

export const SignupIntent = z.enum(['provider']);
export type SignupIntent = z.infer<typeof SignupIntent>;

/** S6 / A1. `intent` is informational for the server; the client keeps it for S8 (D-3). */
export const RegisterBody = z.object({
  fullName: FullName,
  email: Email,
  password: Password,
  intent: SignupIntent.optional(),
});
export type RegisterBody = z.infer<typeof RegisterBody>;
export const SignupForm = RegisterBody.omit({ intent: true });
export type SignupForm = z.infer<typeof SignupForm>;

const Token = z.string().min(1).max(200);

export const ConfirmEmailBody = z.object({ token: Token });
export type ConfirmEmailBody = z.infer<typeof ConfirmEmailBody>;
export const ConfirmEmailResult = z.object({ status: z.enum(['confirmed', 'already_confirmed']) });
export type ConfirmEmailResult = z.infer<typeof ConfirmEmailResult>;

export const ForgotPasswordBody = z.object({ email: Email });
export type ForgotPasswordBody = z.infer<typeof ForgotPasswordBody>;

export const ResetPasswordBody = z.object({ token: Token, password: Password });
export type ResetPasswordBody = z.infer<typeof ResetPasswordBody>;
/** S10 form: the token comes from the URL, not a field. */
export const ResetPasswordForm = z
  .object({ password: Password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { message: PASSWORDS_DONT_MATCH, path: ['confirmPassword'] });
export type ResetPasswordForm = z.infer<typeof ResetPasswordForm>;

/** S18 / S12 / S19 (A9). `mobile: ''` or `null` clears it (customers only, BR-23). */
export const UpdateMeBody = z.object({
  fullName: FullName.optional(),
  mobile: MobileOrEmpty.nullable().optional(),
});
export type UpdateMeBody = z.infer<typeof UpdateMeBody>;
export const AccountDetailsForm = z.object({ fullName: FullName, mobile: MobileOrEmpty });
export type AccountDetailsForm = z.infer<typeof AccountDetailsForm>;

export const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1, 'Enter your password.'),
  newPassword: Password,
});
export type ChangePasswordBody = z.infer<typeof ChangePasswordBody>;
export const ChangePasswordForm = ChangePasswordBody.extend({ confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, { message: PASSWORDS_DONT_MATCH, path: ['confirmPassword'] })
  .refine((v) => v.newPassword !== v.currentPassword, { message: PASSWORD_REUSED, path: ['newPassword'] });
export type ChangePasswordForm = z.infer<typeof ChangePasswordForm>;
```
Make sure `packages/contracts/src/index.ts` exports these (same check as T2).
**Test:** append to `schemas.test.ts`:
```ts
import { ChangePasswordForm, RegisterBody, ResetPasswordForm, SignupForm, UpdateMeBody } from './schemas';

const firstByPath = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) => {
  const out: Record<string, string> = {};
  for (const i of r.error?.issues ?? []) out[i.path.join('.')] ??= i.message;
  return out;
};

describe('SignupForm (S6)', () => {
  it('empty submit shows the SPEC messages', () => {
    expect(firstByPath(SignupForm.safeParse({ fullName: '', email: '', password: '' }))).toEqual({
      fullName: 'Enter your full name.',
      email: 'Enter your email address.',
      password: 'Use at least 8 characters with a letter and a number.',
    });
  });
  it.each(['abcdefgh', '12345678', 'ab1'])('rejects weak password %s', (password) => {
    expect(firstByPath(SignupForm.safeParse({ fullName: 'Ann Lee', email: 'a@b.co', password })).password).toBe(
      'Use at least 8 characters with a letter and a number.',
    );
  });
  it('one-letter name → length message', () => {
    expect(firstByPath(SignupForm.safeParse({ fullName: 'A', email: 'a@b.co', password: 'abc12345' })).fullName).toBe(
      'Name must be 2 to 80 characters.',
    );
  });
  it('RegisterBody accepts intent=provider only', () => {
    expect(RegisterBody.safeParse({ fullName: 'Ann Lee', email: 'a@b.co', password: 'abc12345', intent: 'provider' }).success).toBe(true);
    expect(RegisterBody.safeParse({ fullName: 'Ann Lee', email: 'a@b.co', password: 'abc12345', intent: 'admin' }).success).toBe(false);
  });
});

describe('ResetPasswordForm (S10)', () => {
  it('mismatch → Passwords don’t match.', () => {
    expect(firstByPath(ResetPasswordForm.safeParse({ password: 'abc12345', confirmPassword: 'abc12346' }))).toEqual({
      confirmPassword: "Passwords don't match.",
    });
  });
});

describe('ChangePasswordForm (S18)', () => {
  it('same as current → reuse message', () => {
    expect(
      firstByPath(ChangePasswordForm.safeParse({ currentPassword: 'abc12345', newPassword: 'abc12345', confirmPassword: 'abc12345' })),
    ).toEqual({ newPassword: "Choose a password you haven't just used." });
  });
});

describe('UpdateMeBody', () => {
  it('normalises the mobile and clears on empty', () => {
    expect(UpdateMeBody.parse({ mobile: '077 123 4567' }).mobile).toBe('+94771234567');
    expect(UpdateMeBody.parse({ mobile: '' }).mobile).toBeNull();
    expect(UpdateMeBody.parse({}).mobile).toBeUndefined();
  });
});
```
(Merge the import into the file's existing `import { LoginBody } from './schemas'`.)
**Verify:** `pnpm --filter @fixit/contracts test` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): M04 auth and account schemas (M04-T3)"`

### T4 — Contracts: endpoint registry rows
- [x] done

**Files:** `packages/contracts/src/endpoints.ts`, `endpoints.test.ts`
**Context:** ARCH §3.1 (every remaining row), §2.7.
**Do:**
1. Extend the import: `import { AuthSession, ChangePasswordBody, ConfirmEmailBody, ConfirmEmailResult, ForgotPasswordBody, LoginBody, Me, RegisterBody, ResetPasswordBody, UpdateMeBody } from './auth/schemas';` and `import { z } from 'zod';` (value import; keep `import type { z }` removed if it clashes — use one `import { z } from 'zod'`).
2. Add these entries to `ENDPOINTS` (after `auth_me`):
   ```ts
   auth_register: { id: 'auth_register', domain: 'auth', method: 'POST', path: '/auth/register', access: ['public'], owner: 'none', body: RegisterBody, rateLimited: true, refs: ['F-01', 'S6', 'A1'] },
   auth_admin_login: { id: 'auth_admin_login', domain: 'auth', method: 'POST', path: '/auth/admin/login', access: ['public'], owner: 'none', body: LoginBody, response: AuthSession, rateLimited: true, refs: ['F-30', 'S29'] },
   auth_google: { id: 'auth_google', domain: 'auth', method: 'GET', path: '/auth/google', access: ['public'], owner: 'none', query: z.object({ next: z.string().optional(), intent: z.enum(['provider']).optional() }), refs: ['F-02', 'S5', 'S6', 'A2'] }, // 302, browser navigation
   auth_google_callback: { id: 'auth_google_callback', domain: 'auth', method: 'GET', path: '/auth/google/callback', access: ['public'], owner: 'none', refs: ['F-02'] }, // 302
   auth_confirm_email: { id: 'auth_confirm_email', domain: 'auth', method: 'POST', path: '/auth/confirm-email', access: ['public'], owner: 'none', body: ConfirmEmailBody, response: ConfirmEmailResult, refs: ['S8', 'A6'] },
   auth_resend_confirmation: { id: 'auth_resend_confirmation', domain: 'auth', method: 'POST', path: '/auth/resend-confirmation', access: ['user'], owner: 'self', rateLimited: true, refs: ['S7', 'S8', 'S12', 'A5'] },
   auth_forgot_password: { id: 'auth_forgot_password', domain: 'auth', method: 'POST', path: '/auth/forgot-password', access: ['public'], owner: 'none', body: ForgotPasswordBody, rateLimited: true, refs: ['S9', 'A7'] },
   auth_reset_password: { id: 'auth_reset_password', domain: 'auth', method: 'POST', path: '/auth/reset-password', access: ['public'], owner: 'none', body: ResetPasswordBody, rateLimited: true, refs: ['S10', 'A8'] },
   me_update: { id: 'me_update', domain: 'auth', method: 'PATCH', path: '/me', access: ['user'], owner: 'self', body: UpdateMeBody, response: Me, refs: ['S18', 'S12', 'S19', 'A9'] },
   me_password: { id: 'me_password', domain: 'auth', method: 'POST', path: '/me/password', access: ['user'], owner: 'self', body: ChangePasswordBody, refs: ['S18', 'A9'] },
   ```
**Test:** add to `endpoints.test.ts` inside the describe:
```ts
it('M04 auth rows match ARCHITECTURE §3.1', () => {
  const rows = Object.fromEntries(Object.values(ENDPOINTS).map((d) => [`${d.method} ${d.path}`, d.access]));
  expect(rows).toMatchObject({
    'POST /auth/register': ['public'],
    'POST /auth/admin/login': ['public'],
    'GET /auth/google': ['public'],
    'GET /auth/google/callback': ['public'],
    'POST /auth/confirm-email': ['public'],
    'POST /auth/resend-confirmation': ['user'],
    'POST /auth/forgot-password': ['public'],
    'POST /auth/reset-password': ['public'],
    'PATCH /me': ['user'],
    'POST /me/password': ['user'],
  });
  for (const id of ['auth_register', 'auth_resend_confirmation', 'auth_forgot_password', 'auth_reset_password', 'me_password'] as const)
    expect('response' in ENDPOINTS[id]).toBe(false); // 204
});
```
**Verify:** `pnpm --filter @fixit/contracts test` passes; `pnpm verify` green (the DevPanel "Force next error" list now shows the new ids).
**Commit:** `git commit -m "feat(contracts): M04 auth endpoint rows (M04-T4)"`

### T5 — Fixtures: Google-only and suspended users
- [x] done

**Files:** `packages/fixtures/src/users.ts`, `packages/fixtures/src/build.test.ts`
**Context:** AC4, AC6, D-5. `FxUser` already has `status` and `authMethods`.
**Do:**
1. In `UserSeed`, add `status?: AccountStatus; authMethods?: AuthMethod[];` (import the types from `@fixit/contracts` the same way `types.ts` does).
2. In `CORE_USERS`, after the `u-kasun` row, add:
   ```ts
   // M04: Google-only account (mock "Continue with Google" signs in here) and a suspended account
   { id: 'u-sanduni', email: 'sanduni@fixit.test', fullName: 'Sanduni Wijesinghe', mobile: mobileNo(1003), authMethods: ['google'] },
   { id: 'u-ruwan', email: 'ruwan@fixit.test', fullName: 'Ruwan Jayasekara', mobile: mobileNo(1004), status: 'suspended' },
   ```
3. In `buildUsers`, replace `status: 'active',` with `status: s.status ?? 'active',` and `authMethods: ['password'],` with `authMethods: s.authMethods ?? ['password'],`.
4. Add `export const GOOGLE_MOCK_USER_ID = 'u-sanduni';` next to `DEMO_PASSWORD` and export it from `src/index.ts` if exports are explicit.
5. Run `pnpm --filter @fixit/fixtures test`. If a test asserts a user count or "every user is active / has password", update only that number/assertion to include the two new users.
**Test:** add to `build.test.ts`:
```ts
it('has a Google-only user and a suspended user (M04)', () => {
  const w = buildWorld(new Date('2026-11-25T00:00:00Z'));
  const byId = (id: string) => w.users.find((u) => u.id === id);
  expect(byId('u-sanduni')?.authMethods).toEqual(['google']);
  expect(byId('u-ruwan')?.status).toBe('suspended');
});
```
(use the file's existing world-builder import/name; if it is not `buildWorld`, use the one the file already calls.)
**Verify:** `pnpm --filter @fixit/fixtures test`; `pnpm verify` green.
**Commit:** `git commit -m "feat(fixtures): Google-only and suspended users (M04-T5)"`

### T6 — Mock db: token `createdAt`, v2, Google-only users have no password
- [x] done

**Files:** `src/mocks/db/schema.ts`, `src/mocks/db/seed.ts`, `src/mocks/lib/email-tokens.ts` (create)
**Context:** CLAUDE.md mock rules (bump the version key), ARCH §4.3 (tokens + DevPanel link), SPEC S7 (60 s), S8 (24 h), S9/S10 (1 h).
**Do:**
1. `schema.ts`: `MOCK_DB_VERSION = 2`; add `createdAt: string;` to `MockAuthToken` after `token`; change the `lastEmailLink` comment to `// DevPanel "Last email link": a same-site path like /auth/confirm?token=…`.
2. `seed.ts` line that builds users: `password: u.authMethods.includes('password') ? DEMO_PASSWORD : null`.
3. Create `src/mocks/lib/email-tokens.ts`:
   ```ts
   import type { MockAuthToken, MockDb } from '../db/schema';

   export const CONFIRM_TTL_MS = 24 * 3_600_000; // SPEC S7/S8
   export const RESET_TTL_MS = 3_600_000; // SPEC S9/S10
   export const RESEND_COOLDOWN_MS = 60_000; // SPEC S7 / ARCH §3.1 RL 1/60 s

   type TokenType = MockAuthToken['type'];
   const PATH: Record<TokenType, string> = { confirm_email: '/auth/confirm', reset_password: '/reset-password' };

   const randomToken = (): string =>
     Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('');

   /** Stands in for the email: stores the token and exposes the link in the DevPanel (ARCH §4.3). */
   export function issueEmailToken(d: MockDb, userId: string, type: TokenType, now: Date): MockAuthToken {
     const token = randomToken();
     const ttl = type === 'confirm_email' ? CONFIRM_TTL_MS : RESET_TTL_MS;
     const record: MockAuthToken = {
       id: `t-${token.slice(0, 12)}`,
       userId,
       type,
       token,
       createdAt: now.toISOString(),
       expiresAt: new Date(now.getTime() + ttl).toISOString(),
       usedAt: null,
     };
     d.authTokens.push(record);
     d.lastEmailLink = `${PATH[type]}?token=${token}`;
     return record;
   }

   export const findEmailToken = (d: MockDb, token: string, type: TokenType): MockAuthToken | undefined =>
     d.authTokens.find((t) => t.token === token && t.type === type);

   export const isTokenExpired = (t: MockAuthToken, now: Date): boolean => new Date(t.expiresAt).getTime() <= now.getTime();

   /** Latest confirmation email for this user, for the resend cooldown. */
   export function lastConfirmSentAt(d: MockDb, userId: string): number | null {
     const times = d.authTokens.filter((t) => t.userId === userId && t.type === 'confirm_email').map((t) => new Date(t.createdAt).getTime());
     return times.length > 0 ? Math.max(...times) : null;
   }
   ```
**Verify:** `pnpm --filter @fixit/web test` (store/seed tests still pass); `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock db v2 with email tokens (M04-T6)"`

### T7 — Mock handlers: register, confirm email, resend confirmation
- [x] done

**Files:** `src/mocks/handlers/auth.ts`, `src/mocks/handlers/auth.test.ts`
**Context:** ARCH §3.1 rows, §6.1 Register/Confirm; SPEC A1, A5, A6; D-1.
**Do:** in `auth.ts`, add imports `import type { MockUser } from '../db/schema';` and `import { findEmailToken, isTokenExpired, issueEmailToken, lastConfirmSentAt, RESEND_COOLDOWN_MS } from '../lib/email-tokens';`, then append to `authHandlers`:
```ts
  mockEndpoint(E.auth_register, ({ body, db: d, now }) => {
    if (Object.values(d.users).some((u) => u.email === body.email))
      throw mockError(409, 'CONFLICT', 'Email taken', { details: { rule: 'email_taken' } });
    const id = `u-${crypto.randomUUID().slice(0, 8)}`;
    const user: MockUser = {
      id,
      email: body.email,
      fullName: body.fullName,
      isAdmin: false, // BR-35: every account starts as a customer
      status: 'active',
      emailConfirmedAt: null,
      mobile: null,
      authMethods: ['password'],
      createdAt: now.toISOString(),
      password: body.password,
    };
    d.users[id] = user;
    issueEmailToken(d, id, 'confirm_email', now);
  }),
  mockEndpoint(E.auth_confirm_email, ({ body, db: d, now }) => {
    const t = findEmailToken(d, body.token, 'confirm_email');
    const user = t ? d.users[t.userId] : undefined;
    if (!t || !user) throw mockError(422, 'RULE_VIOLATION', 'Token invalid', { details: { rule: 'token_invalid' } });
    if (user.emailConfirmedAt !== null) return { status: 'already_confirmed' as const }; // reopening the link (AC2)
    if (t.usedAt !== null || isTokenExpired(t, now))
      throw mockError(422, 'RULE_VIOLATION', 'Token expired', { details: { rule: 'token_invalid' } });
    user.emailConfirmedAt = now.toISOString();
    t.usedAt = now.toISOString();
    return { status: 'confirmed' as const };
  }),
  mockEndpoint(E.auth_resend_confirmation, ({ actor, db: d, now }) => {
    const user = actor ? d.users[actor.userId] : undefined;
    if (!user) throw mockError(404, 'NOT_FOUND', 'User not found');
    if (user.emailConfirmedAt !== null) return; // ARCH §3.1: already confirmed → 204
    const last = lastConfirmSentAt(d, user.id);
    if (last !== null && now.getTime() - last < RESEND_COOLDOWN_MS) throw mockError(429, 'RATE_LIMITED', 'Wait 60 s');
    issueEmailToken(d, user.id, 'confirm_email', now);
  }),
```
**Test:** add to `auth.test.ts` (reuse its `call`, `post`, `bearer`, `login`, `envelope` helpers; add `import { DEMO_PASSWORD } …` already present; `db` is imported):
```ts
const tokenFrom = (link: string | null) => new URL(link ?? '', 'http://x').searchParams.get('token') ?? '';
const register = (email: string) =>
  call('/auth/register', post({ fullName: 'Ann Lee', email, password: 'abc12345' }));
const withBearer = (token: string, init: RequestInit = {}): RequestInit => ({
  ...init,
  headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` },
});

describe('POST /auth/register', () => {
  it('creates an unconfirmed customer and a confirmation link', async () => {
    const res = await register('ann@fixit.test');
    expect(res.status).toBe(204);
    const user = Object.values(db().users).find((u) => u.email === 'ann@fixit.test');
    expect([user?.emailConfirmedAt, user?.isAdmin]).toEqual([null, false]);
    expect(db().lastEmailLink).toMatch(/^\/auth\/confirm\?token=[0-9a-f]{48}$/);
  });
  it('taken email → 409 email_taken', async () => {
    const e = await envelope(await register('olivia@fixit.test'));
    expect([e.code, e.details?.rule]).toEqual(['CONFLICT', 'email_taken']);
  });
  it('empty body → 400 with SPEC field messages', async () => {
    const res = await call('/auth/register', post({ fullName: '', email: '', password: '' }));
    const e = await envelope(res);
    expect(res.status).toBe(400);
    expect(e.fieldErrors?.fullName?.[0]).toBe('Enter your full name.');
  });
});

describe('POST /auth/confirm-email', () => {
  it('confirms, then reports already_confirmed; tampered → 422 token_invalid', async () => {
    await register('ann@fixit.test');
    const token = tokenFrom(db().lastEmailLink);
    const first = await call('/auth/confirm-email', post({ token }));
    expect(await first.json()).toEqual({ status: 'confirmed' });
    const again = await call('/auth/confirm-email', post({ token }));
    expect(await again.json()).toEqual({ status: 'already_confirmed' });
    const bad = await call('/auth/confirm-email', post({ token: `${token}x` }));
    expect([bad.status, (await envelope(bad)).details?.rule]).toEqual([422, 'token_invalid']);
  });
});

describe('POST /auth/resend-confirmation', () => {
  it('anonymous → 401', async () => {
    expect((await call('/auth/resend-confirmation', post(undefined))).status).toBe(401);
  });
  it('unconfirmed user: 204, then 429 inside 60 s', async () => {
    const s = AuthSession.parse(await (await login('nimal@fixit.test')).json());
    const first = await call('/auth/resend-confirmation', withBearer(s.accessToken, { method: 'POST' }));
    expect(first.status).toBe(204);
    expect(db().lastEmailLink).toMatch(/^\/auth\/confirm\?token=/);
    const second = await call('/auth/resend-confirmation', withBearer(s.accessToken, { method: 'POST' }));
    expect([second.status, (await envelope(second)).code]).toEqual([429, 'RATE_LIMITED']);
  });
  it('admin → 403', async () => {
    const s = AuthSession.parse(await (await login('admin@fixit.test')).json());
    expect((await call('/auth/resend-confirmation', withBearer(s.accessToken, { method: 'POST' }))).status).toBe(403);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- auth.test` passes; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock register, confirm and resend handlers (M04-T7)"`

### T8 — Mock handlers: forgot and reset password
- [x] done

**Files:** `src/mocks/handlers/auth.ts`, `auth.test.ts`
**Context:** ARCH §3.1, §6.1 Forgot/reset (no enumeration; Google-only gets a link too; reset revokes sessions); SPEC A7, A8.
**Do:** add `clearMockRefresh, readMockRefresh` are already imported. Append:
```ts
  mockEndpoint(E.auth_forgot_password, ({ body, db: d, now }) => {
    const user = Object.values(d.users).find((u) => u.email === body.email);
    if (user) issueEmailToken(d, user.id, 'reset_password', now); // always 204: no account enumeration
  }),
  mockEndpoint(E.auth_reset_password, ({ body, db: d, now }) => {
    const t = findEmailToken(d, body.token, 'reset_password');
    const user = t ? d.users[t.userId] : undefined;
    if (!t || !user || t.usedAt !== null || isTokenExpired(t, now))
      throw mockError(422, 'RULE_VIOLATION', 'Token invalid', { details: { rule: 'token_invalid' } });
    user.password = body.password;
    if (!user.authMethods.includes('password')) user.authMethods = [...user.authMethods, 'password'];
    t.usedAt = now.toISOString();
    if (readMockRefresh() === user.id) clearMockRefresh(); // A8: other sessions end
  }),
```
**Test:**
```ts
describe('forgot + reset password', () => {
  it('unknown email → 204 and no link', async () => {
    const res = await call('/auth/forgot-password', post({ email: 'nobody@fixit.test' }));
    expect([res.status, db().lastEmailLink]).toEqual([204, null]);
  });
  it('reset changes the password once; old password stops working', async () => {
    await call('/auth/forgot-password', post({ email: 'olivia@fixit.test' }));
    const token = tokenFrom(db().lastEmailLink);
    expect(db().lastEmailLink).toMatch(/^\/reset-password\?token=/);
    expect((await call('/auth/reset-password', post({ token, password: 'newpass99' }))).status).toBe(204);
    expect((await login('olivia@fixit.test')).status).toBe(401);
    expect((await login('olivia@fixit.test', 'newpass99')).status).toBe(200);
    const reuse = await call('/auth/reset-password', post({ token, password: 'other123' }));
    expect((await envelope(reuse)).details?.rule).toBe('token_invalid');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- auth.test`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock forgot and reset password handlers (M04-T8)"`

### T9 — Mock handlers: admin login and simulated Google
- [x] done

**Files:** `src/mocks/handlers/auth.ts`, `auth.test.ts`
**Context:** ARCH §3.1 admin login (non-admin → same 401), §6.1 Google mock route; S29.E4; D-5.
**Do:**
1. Imports: `import { GOOGLE_MOCK_USER_ID } from '@fixit/fixtures';` and add `type EndpointDef` to the `@fixit/contracts` import.
2. Above `authHandlers` add:
   ```ts
   /** MSW-only (ARCH §6.1): stands in for GET /auth/google → callback. Sets the mock refresh "cookie"; the SPA then runs /auth/google/done. Not in ENDPOINTS. */
   export const GOOGLE_MOCK = {
     id: 'auth_google_mock',
     domain: 'auth',
     method: 'POST',
     path: '/auth/google/mock',
     access: ['public'],
     owner: 'none',
     refs: ['F-02'],
   } as const satisfies EndpointDef;
   ```
3. Append handlers:
   ```ts
   mockEndpoint(E.auth_admin_login, ({ body, db: d, now }) => {
     const user = Object.values(d.users).find((u) => u.email === body.email);
     // S29.E4: any failure (incl. a non-admin or suspended account) is the same 401 — no role disclosure.
     if (!user || !user.isAdmin || user.password !== body.password || user.status === 'suspended') throw invalidCredentials();
     setMockRefresh(user.id);
     return session(d, user.id, now);
   }),
   mockEndpoint(GOOGLE_MOCK, ({ db: d }) => {
     const user = d.users[GOOGLE_MOCK_USER_ID];
     if (!user) throw mockError(404, 'NOT_FOUND', 'Google fixture user missing');
     if (user.status === 'suspended') throw suspended();
     setMockRefresh(user.id);
   }),
   ```
**Test:**
```ts
describe('POST /auth/admin/login', () => {
  it.each([
    ['olivia@fixit.test', DEMO_PASSWORD],
    ['admin@fixit.test', 'wrong'],
  ])('%s → 401 invalid_credentials', async (email, password) => {
    const res = await call('/auth/admin/login', post({ email, password }));
    expect([res.status, (await envelope(res)).details?.rule]).toEqual([401, 'invalid_credentials']);
  });
  it('admin → session', async () => {
    const res = await call('/auth/admin/login', post({ email: 'admin@fixit.test', password: DEMO_PASSWORD }));
    expect(AuthSession.parse(await res.json()).user.roles).toEqual(['admin']);
  });
});

describe('POST /auth/google/mock', () => {
  it('signs in the Google fixture user via refresh', async () => {
    expect((await call('/auth/google/mock', { method: 'POST' })).status).toBe(204);
    const s = AuthSession.parse(await (await call('/auth/refresh', { method: 'POST' })).json());
    expect([s.user.email, s.user.authMethods]).toEqual(['sanduni@fixit.test', ['google']]);
  });
});

describe('POST /auth/login (M04 fixtures)', () => {
  it('suspended account → 401 ACCOUNT_SUSPENDED', async () => {
    expect((await envelope(await login('ruwan@fixit.test'))).code).toBe('ACCOUNT_SUSPENDED');
  });
  it('Google-only account has no password → invalid_credentials', async () => {
    expect((await envelope(await login('sanduni@fixit.test'))).details?.rule).toBe('invalid_credentials');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- auth.test`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock admin login and Google handlers (M04-T9)"`

### T10 — Mock handlers: `PATCH /me` and `POST /me/password`
- [x] done

**Files:** `src/mocks/handlers/auth.ts`, `auth.test.ts`
**Context:** ARCH §3.1 (self only), §6.1 Change password; SPEC S18 field table; BR-23; D-4.
**Do:** append:
```ts
  mockEndpoint(E.me_update, ({ actor, body, db: d }) => {
    const user = actor ? d.users[actor.userId] : undefined; // self: the id comes from the token only
    if (!actor || !user) throw mockError(404, 'NOT_FOUND', 'User not found');
    if (body.mobile === null && actor.roles.includes('provider'))
      throw mockError(422, 'RULE_VIOLATION', 'Providers need a mobile', { details: { rule: 'mobile_missing' } }); // BR-23
    if (body.fullName !== undefined) user.fullName = body.fullName;
    if (body.mobile !== undefined) user.mobile = body.mobile;
    return buildMe(d, user.id);
  }),
  mockEndpoint(E.me_password, ({ actor, body, db: d }) => {
    const user = actor ? d.users[actor.userId] : undefined;
    if (!user) throw mockError(404, 'NOT_FOUND', 'User not found');
    if (user.password === null || user.password !== body.currentPassword)
      throw mockError(422, 'RULE_VIOLATION', 'Current password wrong', { details: { rule: 'current_password_wrong' } });
    if (body.newPassword === body.currentPassword)
      throw mockError(422, 'RULE_VIOLATION', 'Password reused', { details: { rule: 'password_reused' } });
    user.password = body.newPassword;
  }),
```
**Test:**
```ts
const sessionFor = async (email: string) => AuthSession.parse(await (await login(email)).json()).accessToken;
const patchMe = (token: string, body: unknown) =>
  call('/me', withBearer(token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
const changePw = (token: string, body: unknown) =>
  call('/me/password', withBearer(token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));

describe('PATCH /me', () => {
  it('updates name and normalises the mobile', async () => {
    const me = Me.parse(await (await patchMe(await sessionFor('olivia@fixit.test'), { fullName: 'Olivia Perera', mobile: '077 123 4567' })).json());
    expect([me.fullName, me.mobile, me.displayName]).toEqual(['Olivia Perera', '+94771234567', 'Olivia P.']);
  });
  it('customer may clear the mobile', async () => {
    expect(Me.parse(await (await patchMe(await sessionFor('olivia@fixit.test'), { mobile: '' })).json()).mobile).toBeNull();
  });
  it('provider clearing the mobile → 422 mobile_missing', async () => {
    const e = await envelope(await patchMe(await sessionFor('marcus@fixit.test'), { mobile: '' }));
    expect([e.code, e.details?.rule]).toEqual(['RULE_VIOLATION', 'mobile_missing']);
  });
  it('bad mobile → 400 with the S12 message', async () => {
    const e = await envelope(await patchMe(await sessionFor('olivia@fixit.test'), { mobile: '123' }));
    expect(e.fieldErrors?.mobile).toEqual(['Enter a Sri Lankan mobile number, like 077 123 4567.']);
  });
  it('anonymous → 401; admin → 403', async () => {
    expect((await call('/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status).toBe(401);
    expect((await patchMe(await sessionFor('admin@fixit.test'), {})).status).toBe(403);
  });
});

describe('POST /me/password', () => {
  it.each([
    [{ currentPassword: 'nope', newPassword: 'abc12345' }, 'current_password_wrong'],
    [{ currentPassword: DEMO_PASSWORD, newPassword: DEMO_PASSWORD }, 'password_reused'],
  ])('%j → %s', async (body, rule) => {
    expect((await envelope(await changePw(await sessionFor('olivia@fixit.test'), body))).details?.rule).toBe(rule);
  });
  it('changes the password', async () => {
    expect((await changePw(await sessionFor('olivia@fixit.test'), { currentPassword: DEMO_PASSWORD, newPassword: 'newpass99' })).status).toBe(204);
    expect((await login('olivia@fixit.test', 'newpass99')).status).toBe(200);
  });
});
```
(Note: `DEMO_PASSWORD` is `demo1234`, which itself satisfies `Password`.)
**Verify:** `pnpm --filter @fixit/web test -- auth.test`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): mock PATCH /me and change-password handlers (M04-T10)"`

### T11 — DevPanel: clickable "Last email link"
- [x] done

**Files:** `src/mocks/dev/DevPanel.tsx`
**Context:** ARCH §4.5, milestone "DevPanel Last email link shows the confirmation/reset link"; T6 stores a same-site path.
**Do:** replace the body of the `Last email link` `DevSection` with:
```tsx
{!isMocked('auth') ? (
  <p className="text-body-sm text-text-muted">Only available when auth is mocked</p>
) : db().lastEmailLink ? (
  <a
    href={db().lastEmailLink ?? '/'}
    className="text-body-sm text-primary hover:text-primary-hover inline-flex min-h-11 items-center break-all font-semibold underline underline-offset-2"
  >
    {`${window.location.origin}${db().lastEmailLink ?? ''}`}
  </a>
) : (
  <p className="text-body-sm text-text-muted">None yet</p>
)}
```
(A plain `<a>` does a full load; the mock db is persisted, so S8/S10 see the token.)
**Verify:** `pnpm verify` green. Manual: `pnpm dev:mock`, DevPanel → Force/Session untouched → sign up later (T21) shows the link.
**Commit:** `git commit -m "feat(web): clickable DevPanel email link (M04-T11)"`

### T12 — `lib/next.ts`: same-site `next` and role home
- [x] done

**Files:** `src/lib/next.ts`, `src/lib/next.test.ts`
**Context:** SPEC §8.4 (`next` validation, signed-in redirects), S5 success redirect; AC10; D-2.
**Do:** create `src/lib/next.ts`:
```ts
import type { Me } from '@fixit/contracts';

/** SPEC §8.4: same-site relative paths only; anything else is ignored. */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw?.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** S5 without `next`: providers → /dashboard, everyone else → / . */
export const roleHome = (me: Me | null): string => (me?.roles.includes('provider') ? '/dashboard' : '/');

/** D-2: where a signed-in user on /login, /signup, /forgot-password (or /admin/login) goes. */
export function postLoginTarget(me: Me | null, search: string, area: 'public' | 'admin' = 'public'): string {
  const next = safeNext(new URLSearchParams(search).get('next'));
  if (area === 'admin' && me?.roles.includes('admin')) return next?.startsWith('/admin') ? next : '/admin';
  if (area === 'admin') return roleHome(me);
  return next ?? roleHome(me);
}
```
**Test:** `src/lib/next.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Me } from '@fixit/contracts';
import { postLoginTarget, safeNext } from './next';

const me = (roles: Me['roles']) => ({ roles }) as Me;

describe('safeNext', () => {
  it.each([
    ['/requests', '/requests'],
    ['/providers/p01/request?x=1#a', '/providers/p01/request?x=1#a'],
    ['https://evil.test', null],
    ['//evil.test/x', null],
    ['/\\evil.test', null],
    ['requests', null],
    ['', null],
    [null, null],
  ])('%j → %j', (raw, out) => {
    expect(safeNext(raw)).toBe(out);
  });
});

describe('postLoginTarget', () => {
  it('uses a safe next', () => {
    expect(postLoginTarget(me(['customer']), '?next=%2Frequests')).toBe('/requests');
  });
  it('ignores an absolute next (AC10)', () => {
    expect(postLoginTarget(me(['customer']), '?next=https%3A%2F%2Fevil.test')).toBe('/');
  });
  it('role home without next', () => {
    expect(postLoginTarget(me(['customer', 'provider']), '')).toBe('/dashboard');
    expect(postLoginTarget(me(['customer']), '')).toBe('/');
  });
  it('admin area', () => {
    expect(postLoginTarget(me(['admin']), '?next=%2Fadmin%2Fusers', 'admin')).toBe('/admin/users');
    expect(postLoginTarget(me(['admin']), '?next=%2Frequests', 'admin')).toBe('/admin');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- next.test`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): same-site next and post-login target (M04-T12)"`

### T13 — `RequireGuest` redirects to `postLoginTarget`
- [x] done

**Files:** `src/app/guards/guards.tsx`
**Context:** D-2, SPEC §8.4 row "Signed-in user opens /login or /signup".
**Do:** in `RequireGuest`, add `const { search } = useLocation();` and replace the `to` computation with `const to = postLoginTarget(me, search, area);` (import from `@/lib/next`). Remove the now-unused `isAdmin`/`isProvider` usages only if lint flags them as unused (they are used by other guards — keep them).
**Test:** add to `src/app/routes.test.tsx` (uses the existing `renderRoute` and `signInAs` helpers):
```ts
it('signed-in customer on /login?next=/requests goes to /requests', async () => {
  signInAs('customer');
  const r = renderRoute('/login?next=%2Frequests');
  await waitFor(() => expect(r.location()).toBe('/requests'));
});
it('signed-in customer on /login?next=https://evil.test goes to /', async () => {
  signInAs('customer');
  const r = renderRoute('/login?next=https%3A%2F%2Fevil.test');
  await waitFor(() => expect(r.location()).toBe('/'));
});
```
(import `waitFor` from `@testing-library/react` and `signInAs` from `@/test/sign-in` if not already imported.)
**Verify:** `pnpm --filter @fixit/web test -- routes.test`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): RequireGuest honours next (M04-T13)"`

### T14 — `lib/error-copy.ts` and `mapApiErrorToForm`
- [x] done

**Files:** `src/lib/error-copy.ts`, `src/lib/form-errors.ts`, `src/lib/form-errors.test.ts`
**Context:** ARCH §4.1, SPEC S5.E8, §6.3, §6.6, S29.E4; D-4; AC10 "server fieldErrors map onto fields".
**Do:**
1. `src/lib/error-copy.ts`:
   ```ts
   import {
     CURRENT_PASSWORD_WRONG,
     EMAIL_TAKEN,
     PASSWORD_REUSED,
     PROVIDER_MOBILE_REQUIRED,
     type RuleCode,
   } from '@fixit/contracts';
   import { CONTACT_EMAIL } from './env';

   /** Form-level banner copy (SPEC S5.E8, S29.E4, §6.3, §6.6). Written once. */
   export const FORM_COPY = {
     saveFailed: "We couldn't save your changes. Check your connection and try again.",
     invalidCredentials: "That email and password don't match. Try again or reset your password.",
     adminInvalidCredentials: "That email and password don't match.",
     suspended: `Your account is suspended. If you think this is a mistake, email us at ${CONTACT_EMAIL}.`,
     rateLimited: 'Too many attempts. Wait a few minutes and try again.',
     googleCancelled: 'Google sign-in was cancelled. Try again or use your email.',
     sessionExpired: 'Your session expired. Log in again to continue.',
     resendFailed: "Couldn't send the email. Try again.", // D-9
   } as const;

   /** Rules that belong to one field (D-4). */
   export const RULE_FIELD_COPY: Partial<Record<RuleCode, string>> = {
     email_taken: EMAIL_TAKEN,
     current_password_wrong: CURRENT_PASSWORD_WRONG,
     password_reused: PASSWORD_REUSED,
     mobile_missing: PROVIDER_MOBILE_REQUIRED,
   };

   /** Rules shown as the form banner. Later milestones add theirs here. */
   export const RULE_BANNER_COPY: Partial<Record<RuleCode, string>> = {
     invalid_credentials: FORM_COPY.invalidCredentials,
   };
   ```
2. `src/lib/form-errors.ts`:
   ```ts
   import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
   import type { RuleCode } from '@fixit/contracts';
   import { FORM_COPY, RULE_BANNER_COPY, RULE_FIELD_COPY } from './error-copy';
   import { ApiError } from './http';

   export type RuleFields<T extends FieldValues> = Partial<Record<RuleCode, Path<T>>>;

   /**
    * ARCH §4.1. Puts server errors on fields (focus on the first) and returns the banner copy,
    * or null when every error landed on a field. Server field paths equal the form field names (shared contracts).
    */
   export function mapApiErrorToForm<T extends FieldValues>(
     err: unknown,
     setError: UseFormSetError<T>,
     ruleFields: RuleFields<T> = {},
   ): string | null {
     if (!(err instanceof ApiError)) return FORM_COPY.saveFailed;
     if (err.code === 'VALIDATION_FAILED' && err.fieldErrors) {
       const entries = Object.entries(err.fieldErrors).filter(([field]) => field !== '_form');
       entries.forEach(([field, messages], i) => {
         const message = messages[0];
         if (message) setError(field as Path<T>, { type: 'server', message }, { shouldFocus: i === 0 });
       });
       if (entries.length > 0) return null;
     }
     if (err.code === 'ACCOUNT_SUSPENDED') return FORM_COPY.suspended;
     if (err.code === 'RATE_LIMITED') return FORM_COPY.rateLimited;
     const rule = err.rule;
     if (rule) {
       const field = ruleFields[rule];
       const fieldCopy = RULE_FIELD_COPY[rule];
       if (field && fieldCopy) {
         setError(field, { type: 'server', message: fieldCopy }, { shouldFocus: true });
         return null;
       }
       const banner = RULE_BANNER_COPY[rule];
       if (banner) return banner;
     }
     return FORM_COPY.saveFailed;
   }
   ```
**Test:** `src/lib/form-errors.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './http';
import { FORM_COPY } from './error-copy';
import { mapApiErrorToForm } from './form-errors';

const err = (status: number, code: ConstructorParameters<typeof ApiError>[1], extra: object = {}) =>
  new ApiError(status, code, code, { code: code === 'NETWORK' ? 'INTERNAL' : code, message: code, requestId: 'r', ...extra });

describe('mapApiErrorToForm', () => {
  it('maps fieldErrors onto fields, focusing the first', () => {
    const setError = vi.fn();
    const out = mapApiErrorToForm(err(400, 'VALIDATION_FAILED', { fieldErrors: { mobile: ['Bad'], fullName: ['Short'] } }), setError);
    expect(out).toBeNull();
    expect(setError.mock.calls).toEqual([
      ['mobile', { type: 'server', message: 'Bad' }, { shouldFocus: true }],
      ['fullName', { type: 'server', message: 'Short' }, { shouldFocus: false }],
    ]);
  });
  it('puts a field rule on its field', () => {
    const setError = vi.fn();
    expect(mapApiErrorToForm(err(409, 'CONFLICT', { details: { rule: 'email_taken' } }), setError, { email_taken: 'email' })).toBeNull();
    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'This email already has an account.' }, { shouldFocus: true });
  });
  it('banner rules and codes', () => {
    const setError = vi.fn();
    expect(mapApiErrorToForm(err(401, 'UNAUTHENTICATED', { details: { rule: 'invalid_credentials' } }), setError)).toBe(FORM_COPY.invalidCredentials);
    expect(mapApiErrorToForm(err(401, 'ACCOUNT_SUSPENDED'), setError)).toBe(
      'Your account is suspended. If you think this is a mistake, email us at hello@fixit.test.',
    );
    expect(mapApiErrorToForm(err(429, 'RATE_LIMITED'), setError)).toBe(FORM_COPY.rateLimited);
    expect(mapApiErrorToForm(err(500, 'INTERNAL'), setError)).toBe(FORM_COPY.saveFailed);
    expect(mapApiErrorToForm(new ApiError(0, 'NETWORK', 'x'), setError)).toBe(FORM_COPY.saveFailed);
    expect(setError).not.toHaveBeenCalled();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- form-errors`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): error copy and mapApiErrorToForm (M04-T14)"`

### T15 — `useFormDraft` (§6.6 session-expiry draft)
- [x] done

**Files:** `src/lib/use-form-draft.ts`, `src/lib/use-form-draft.test.tsx`
**Context:** SPEC §6.6 (values minus passwords/files kept for the tab, restored after login via `next`), ARCH §4.1; AC8.
**Do:** create `src/lib/use-form-draft.ts`:
```ts
import { useEffect } from 'react';
import type { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form';
import { authStore } from './auth-store';

const PREFIX = 'fixit.draft.';

/**
 * SPEC §6.6: when the session expires (signOut('expired')), keep this form's values (minus `exclude`) in
 * sessionStorage; on the next mount, restore them once (marked dirty) and forget the draft.
 */
export function useFormDraft<T extends FieldValues>(key: string, form: UseFormReturn<T>, exclude: readonly Path<T>[] = []): void {
  const excludeKey = exclude.join(',');
  useEffect(() => {
    const storageKey = PREFIX + key;
    const raw = sessionStorage.getItem(storageKey);
    if (raw) {
      sessionStorage.removeItem(storageKey);
      try {
        const draft = JSON.parse(raw) as Record<string, unknown>;
        for (const [name, value] of Object.entries(draft))
          form.setValue(name as Path<T>, value as PathValue<T, Path<T>>, { shouldDirty: true });
      } catch {
        // a corrupt draft is dropped
      }
    }
    const skip = new Set(excludeKey.split(',').filter(Boolean));
    return authStore.subscribe(() => {
      const s = authStore.getState();
      if (s.status !== 'guest' || s.signOutReason !== 'expired') return;
      const values = Object.fromEntries(Object.entries(form.getValues()).filter(([name]) => !skip.has(name)));
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    });
  }, [key, form, excludeKey]);
}
```
**Test:** `src/lib/use-form-draft.test.tsx`:
```tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { authStore } from './auth-store';
import { useFormDraft } from './use-form-draft';
import { signInAs } from '@/test/sign-in';

function Draft() {
  const form = useForm({ defaultValues: { fullName: 'Olivia Martinez', password: '' } });
  useFormDraft('test', form, ['password']);
  return (
    <>
      <input aria-label="Name" {...form.register('fullName')} />
      <input aria-label="Password" {...form.register('password')} />
    </>
  );
}

describe('useFormDraft', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  it('keeps values minus passwords on expiry and restores them once', async () => {
    signInAs('customer');
    const first = render(<Draft />);
    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.type(screen.getByLabelText('Name'), 'Olivia P');
    await userEvent.type(screen.getByLabelText('Password'), 'secret12');
    act(() => {
      authStore.signOut('expired');
    });
    expect(JSON.parse(sessionStorage.getItem('fixit.draft.test') ?? '{}')).toEqual({ fullName: 'Olivia P' });
    first.unmount();
    render(<Draft />);
    expect(screen.getByLabelText<HTMLInputElement>('Name').value).toBe('Olivia P');
    expect(screen.getByLabelText<HTMLInputElement>('Password').value).toBe('');
    expect(sessionStorage.getItem('fixit.draft.test')).toBeNull();
  });
  it('does nothing on a normal logout', () => {
    signInAs('customer');
    render(<Draft />);
    act(() => {
      authStore.signOut('logout');
    });
    expect(sessionStorage.getItem('fixit.draft.test')).toBeNull();
  });
});
```
(If `@testing-library/user-event` is not installed, add it with `pnpm --filter @fixit/web add -D @testing-library/user-event` in this task.)
**Verify:** `pnpm --filter @fixit/web test -- use-form-draft`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): useFormDraft for session expiry (M04-T15)"`

### T16 — `useCooldown` (S7 resend countdown)
- [x] done

**Files:** `src/lib/use-cooldown.ts`, `src/lib/use-cooldown.test.ts`
**Context:** SPEC S7.E2 (`Resend in 0:45`), AC2 (`Resend in 0:59` right after a resend).
**Do:**
```ts
import { useCallback, useEffect, useState } from 'react';

/** Counts down whole seconds after start(). `label` is "m:ss" (0:59). */
export function useCooldown(seconds: number): { remaining: number; label: string; start: () => void } {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endsAt === null) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => {
      window.clearInterval(id);
    };
  }, [endsAt]);
  // endsAt is 1 ms short of the full window, so floor() reads (seconds − 1) right after start: "0:59".
  const remaining = endsAt === null ? 0 : Math.max(0, Math.floor((endsAt - now) / 1000));
  const start = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setEndsAt(t + seconds * 1000 - 1);
  }, [seconds]);
  const label = `${String(Math.floor(remaining / 60))}:${String(remaining % 60).padStart(2, '0')}`;
  return { remaining, label, start };
}
```
**Test:**
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCooldown } from './use-cooldown';

describe('useCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('reads 0:59 after start, then counts down to 0', () => {
    const { result } = renderHook(() => useCooldown(60));
    expect(result.current.remaining).toBe(0);
    act(() => {
      result.current.start();
    });
    expect(result.current.label).toBe('0:59');
    act(() => {
      vi.advanceTimersByTime(14_000);
    });
    expect(result.current.label).toBe('0:45');
    act(() => {
      vi.advanceTimersByTime(46_000);
    });
    expect(result.current.remaining).toBe(0);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- use-cooldown`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): useCooldown for resend (M04-T16)"`

### T17 — Auth feature: API calls
- [x] done

**Files:** `src/features/auth/api.ts`, `src/features/auth/api.test.ts`, `src/lib/query-keys.ts`
**Context:** ARCH §4.2 api.ts pattern; T4 rows; T9 `GOOGLE_MOCK`.
**Do:**
1. `query-keys.ts`: add `confirmEmail: (token: string) => ['auth', 'confirm', token] as const,` to `qk`.
2. Append to `features/auth/api.ts` (extend the contracts import with the new types):
   ```ts
   export const register = (body: RegisterBody): Promise<void> =>
     http(pathOf(E.auth_register), { method: E.auth_register.method, body, schema: undefined });

   export const adminLogin = (body: LoginBody): Promise<AuthSession> =>
     http(pathOf(E.auth_admin_login), { method: E.auth_admin_login.method, body, schema: E.auth_admin_login.response });

   export const confirmEmail = (body: ConfirmEmailBody): Promise<ConfirmEmailResult> =>
     http(pathOf(E.auth_confirm_email), { method: E.auth_confirm_email.method, body, schema: E.auth_confirm_email.response });

   export const resendConfirmation = (): Promise<void> =>
     http(pathOf(E.auth_resend_confirmation), { method: E.auth_resend_confirmation.method, schema: undefined });

   export const forgotPassword = (body: ForgotPasswordBody): Promise<void> =>
     http(pathOf(E.auth_forgot_password), { method: E.auth_forgot_password.method, body, schema: undefined });

   export const resetPassword = (body: ResetPasswordBody): Promise<void> =>
     http(pathOf(E.auth_reset_password), { method: E.auth_reset_password.method, body, schema: undefined });

   /** MSW-only route (ARCH §6.1); only called when isMocked('auth'). */
   export const googleMockSignIn = (): Promise<void> =>
     http('/auth/google/mock', { method: 'POST', schema: undefined });

   /** Real Google start: a full-page navigation to the API (ARCH §3.1 GET /auth/google). */
   export const googleStartUrl = (query: { next?: string | undefined; intent?: 'provider' | undefined }): string =>
     apiUrl(pathOf(E.auth_google), query);
   ```
   Import `apiUrl` from `@/lib/http`.
3. In `src/lib/http.ts`, add `'/auth/admin/login'` is already in `NO_REFRESH_PATHS`; also add `'/auth/register'`, `'/auth/google/mock'` (a 401 there is an answer, not an expired token).
**Test:** add to `features/auth/api.test.ts`:
```ts
it('register → 204, then login works (unconfirmed)', async () => {
  await register({ fullName: 'Ann Lee', email: 'ann@fixit.test', password: 'abc12345' });
  const s = await login({ email: 'ann@fixit.test', password: 'abc12345' });
  expect(s.user.emailConfirmed).toBe(false);
});
it('googleStartUrl keeps next and intent', () => {
  expect(googleStartUrl({ next: '/requests', intent: 'provider' })).toBe(
    `${window.location.origin}/api/auth/google?next=%2Frequests&intent=provider`,
  );
});
```
(extend the file's imports accordingly.)
**Verify:** `pnpm --filter @fixit/web test -- features/auth`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): auth API calls (M04-T17)"`

### T18 — Auth feature: hooks
- [x] done

**Files:** `src/features/auth/hooks.ts`, `src/features/auth/hooks.test.tsx`
**Context:** ARCH §4.2 hooks; SPEC A1–A8; D-1, D-3, D-9.
**Do:** append to `hooks.ts` (add imports: `useMutation` from react-query; `notify, notifyError` from `@/lib/toast`; `FORM_COPY` from `@/lib/error-copy`; `ApiError` from `@/lib/http`; the API functions; `type LoginBody, type SignupForm, type SignupIntent` from contracts):
```ts
const AFTER_KEY = 'fixit.signup.after';
interface AfterSignup { next: string | null; intent: SignupIntent | null }

/** D-3: remembered at sign-up, used by S8 Continue. */
export function rememberAfterSignup(v: AfterSignup): void {
  sessionStorage.setItem(AFTER_KEY, JSON.stringify(v));
}
/** S8 Continue: provider intent → onboarding; else stored next; else home. Clears the entry. */
export function takeAfterSignupTarget(): string {
  const raw = sessionStorage.getItem(AFTER_KEY);
  sessionStorage.removeItem(AFTER_KEY);
  try {
    const v = raw ? (JSON.parse(raw) as Partial<AfterSignup>) : {};
    if (v.intent === 'provider') return '/become-a-provider/1';
    return safeNext(v.next ?? null) ?? '/';
  } catch {
    return '/';
  }
}

/** S5: login and store the session; RequireGuest then redirects (D-2). */
export function useLogin() {
  return useMutation({ mutationFn: (body: LoginBody) => signIn(body) });
}

/** S29: admin login; RequireGuest area="admin" then redirects to /admin. */
export function useAdminLogin() {
  return useMutation({
    mutationFn: async (body: LoginBody) => {
      const s = await adminLogin(body);
      authStore.setSession(s);
      return s;
    },
  });
}

/** S6 (D-1): register, then log in with the same credentials. The caller navigates to S7 before setSession. */
export function useSignup() {
  return useMutation({
    mutationFn: async (v: { form: SignupForm; intent: SignupIntent | null }) => {
      await register({ ...v.form, ...(v.intent ? { intent: v.intent } : {}) });
      return login({ email: v.form.email, password: v.form.password });
    },
  });
}

/** A5: toast on success; 429 → rate-limit copy; else D-9. */
export function useResendConfirmation() {
  return useMutation({
    mutationFn: resendConfirmation,
    onSuccess: () => {
      notify('Email sent again.');
    },
    onError: (e) => {
      notifyError(e instanceof ApiError && e.code === 'RATE_LIMITED' ? FORM_COPY.rateLimited : FORM_COPY.resendFailed);
    },
  });
}

/** S8: confirm once per token (a query, so StrictMode's double effect doesn't confirm twice), then refresh `me` if signed in. */
export function useConfirmEmail(token: string | null) {
  return useQuery({
    queryKey: qk.confirmEmail(token ?? ''),
    enabled: token !== null && token !== '',
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async () => {
      const result = await confirmEmail({ token: token ?? '' });
      if (authStore.getState().status === 'signed-in') authStore.setMe(await fetchMe());
      return result;
    },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword });
}
```
Import `safeNext` from `@/lib/next`.
**Test:** add to `hooks.test.tsx`:
```tsx
describe('takeAfterSignupTarget', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  it.each([
    [{ next: '/requests', intent: 'provider' }, '/become-a-provider/1'],
    [{ next: '/requests', intent: null }, '/requests'],
    [{ next: 'https://evil.test', intent: null }, '/'],
  ] as const)('%j → %s', (v, out) => {
    rememberAfterSignup(v);
    expect(takeAfterSignupTarget()).toBe(out);
    expect(takeAfterSignupTarget()).toBe('/'); // cleared
  });
});

describe('useSignup', () => {
  it('registers and returns a session for the new unconfirmed user', async () => {
    const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });
    const s = await result.current.mutateAsync({ form: { fullName: 'Ann Lee', email: 'ann@fixit.test', password: 'abc12345' }, intent: null });
    expect([s.user.email, s.user.emailConfirmed]).toEqual(['ann@fixit.test', false]);
  });
});
```
(import `beforeEach`, `renderHook`, `createWrapper` from `@/test/render`, and the new hooks.)
**Verify:** `pnpm --filter @fixit/web test -- features/auth`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): auth mutation hooks (M04-T18)"`

### T19 — Account feature: API calls and hooks
- [x] done

**Files:** `src/features/account/api.ts`, `src/features/account/hooks.ts`, `src/features/account/hooks.test.tsx`
**Context:** ARCH §3.1 `PATCH /me`, `POST /me/password`; AC6 (avatar initials update).
**Do:**
1. `api.ts`:
   ```ts
   import { ENDPOINTS as E, type ChangePasswordBody, type Me, type UpdateMeBody } from '@fixit/contracts';
   import { http, pathOf } from '@/lib/http';

   export const updateMe = (body: UpdateMeBody): Promise<Me> =>
     http(pathOf(E.me_update), { method: E.me_update.method, body, schema: E.me_update.response });

   export const changePassword = (body: ChangePasswordBody): Promise<void> =>
     http(pathOf(E.me_password), { method: E.me_password.method, body, schema: undefined });
   ```
2. `hooks.ts`:
   ```ts
   import { useMutation, useQueryClient } from '@tanstack/react-query';
   import type { ChangePasswordBody, UpdateMeBody } from '@fixit/contracts';
   import { authStore } from '@/lib/auth-store';
   import { qk } from '@/lib/query-keys';
   import { changePassword, updateMe } from './api';

   /** A9: the returned Me replaces the store's, so the nav avatar updates at once. */
   export function useUpdateMe() {
     const qc = useQueryClient();
     return useMutation({
       mutationFn: (body: UpdateMeBody) => updateMe(body),
       onSuccess: (me) => {
         authStore.setMe(me);
         qc.setQueryData(qk.me, me);
       },
     });
   }

   export function useChangePassword() {
     return useMutation({ mutationFn: (body: ChangePasswordBody) => changePassword(body) });
   }
   ```
**Test:** `hooks.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useUpdateMe } from './hooks';

describe('useUpdateMe', () => {
  it('updates authStore.me', async () => {
    signInAs('customer');
    const { result } = renderHook(() => useUpdateMe(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ fullName: 'Olivia Perera', mobile: '+94771234567' });
    expect(authStore.getState().me?.fullName).toBe('Olivia Perera');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- features/account`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): account API and hooks (M04-T19)"`

### T20 — Shared form pieces: `labelAside`, `PasswordInput`
- [x] done

**Files:** `src/components/form-field.tsx`, `src/components/password-input.tsx`
**Context:** SPEC S5 Password field (show/hide `Eye`/`EyeOff`, 44 target, label `Show password`), S5.E6 (Forgot link on the Password label row).
**Do:**
1. `FormField`: add prop `labelAside?: ReactNode;`. Replace `<Label …>…</Label>` with:
   ```tsx
   <div className="flex items-center justify-between gap-3">
     <Label htmlFor={id}>…unchanged children…</Label>
     {labelAside}
   </div>
   ```
2. `password-input.tsx`:
   ```tsx
   import { useState, type ComponentProps } from 'react';
   import { Eye, EyeOff } from 'lucide-react';
   import { Input } from '@/components/ui/input';
   import { cn } from '@/lib/utils';

   /** SPEC S5: password with a show/hide toggle (44 target). */
   export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
     const [shown, setShown] = useState(false);
     const Icon = shown ? EyeOff : Eye;
     return (
       <div className="relative">
         <Input type={shown ? 'text' : 'password'} className={cn('pr-12', className)} {...props} />
         <button
           type="button"
           onClick={() => {
             setShown((s) => !s);
           }}
           aria-label={shown ? 'Hide password' : 'Show password'}
           aria-pressed={shown}
           className="text-text-muted hover:text-text focus-visible:ring-ring absolute inset-y-0 right-0 grid w-11 place-items-center rounded-md focus-visible:outline-none focus-visible:ring-2"
         >
           <Icon aria-hidden="true" className="size-5" />
         </button>
       </div>
     );
   }
   ```
   `Input` must forward `ref` (react-hook-form `register` passes one). If `components/ui/input.tsx` is a plain function component on React 19, `ref` arrives as a prop and is spread — fine.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): PasswordInput and label aside slot (M04-T20)"`

### T21 — Shared: `SubmitButton` and `FormErrorBanner`
- [x] done

**Files:** `src/components/submit-button.tsx`, `src/components/form-error-banner.tsx`
**Context:** SPEC §6.1 submitting buttons (label → `…ing` form, 16 px spinner, fixed width, disabled, `aria-busy`), §6.3 form banner (danger, top of form, scrolled into view).
**Do:**
1. `submit-button.tsx`:
   ```tsx
   import type { ComponentProps, ReactNode } from 'react';
   import { LoaderCircle } from 'lucide-react';
   import { Button } from '@/components/ui/button';

   type Props = Omit<ComponentProps<typeof Button>, 'type' | 'children'> & {
     pending: boolean;
     pendingLabel: string;
     children: ReactNode;
   };

   /** SPEC §6.1: while pending the label changes, a spinner shows, and the button is disabled + aria-busy. */
   export function SubmitButton({ pending, pendingLabel, children, disabled, ...props }: Props) {
     return (
       <Button type="submit" disabled={pending || disabled} aria-busy={pending || undefined} {...props}>
         {pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />}
         {pending ? pendingLabel : children}
       </Button>
     );
   }
   ```
2. `form-error-banner.tsx`:
   ```tsx
   import { useEffect, useRef, type ReactNode } from 'react';
   import { NoticeBanner } from './notice-banner';

   /** SPEC §6.3 / S5.E8: danger banner at the top of a form, announced and scrolled into view when it appears. */
   export function FormErrorBanner({ children, variant = 'danger' }: { children: ReactNode; variant?: 'danger' | 'info' }) {
     const ref = useRef<HTMLDivElement>(null);
     useEffect(() => {
       ref.current?.scrollIntoView?.({ block: 'nearest' });
     }, [children]);
     return (
       <div ref={ref} role={variant === 'danger' ? 'alert' : 'status'}>
         <NoticeBanner variant={variant}>{children}</NoticeBanner>
       </div>
     );
   }
   ```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): SubmitButton and FormErrorBanner (M04-T21)"`

### T22 — Auth components: card header, divider, Google button
- [x] done

**Files:** `src/features/auth/components/auth-card-header.tsx`, `or-divider.tsx`, `google-button.tsx`
**Context:** SPEC L1-auth card header (56×56 icon tile r16, title `text-title-md`, subtitle 15/22 muted), S5.E3/E4, S6.E2; ARCH §6.1 Google; D-7.
**Do:**
1. `auth-card-header.tsx`:
   ```tsx
   import type { LucideIcon } from 'lucide-react';
   import { cn } from '@/lib/utils';

   const TONE = {
     primary: 'bg-primary-soft text-primary',
     success: 'bg-success-soft text-success',
     warning: 'bg-warning-soft text-warning-text',
   } as const;

   export function AuthCardHeader({ icon: Icon, tone = 'primary', title, subtitle }: {
     icon?: LucideIcon; tone?: keyof typeof TONE; title: string; subtitle?: string | undefined;
   }) {
     return (
       <div className="flex flex-col gap-3">
         {Icon && (
           <span aria-hidden="true" className={cn('grid size-14 place-items-center rounded-xl', TONE[tone])}>
             <Icon className="size-7" />
           </span>
         )}
         <h1 className="text-title-md text-text">{title}</h1>
         {subtitle && <p className="text-body-sm text-text-muted">{subtitle}</p>}
       </div>
     );
   }
   ```
2. `or-divider.tsx`:
   ```tsx
   export function OrDivider() {
     return (
       <div className="text-meta text-text-subtle flex items-center gap-3" role="separator" aria-label="or">
         <span className="bg-border h-px flex-1" aria-hidden="true" />
         <span aria-hidden="true">or</span>
         <span className="bg-border h-px flex-1" aria-hidden="true" />
       </div>
     );
   }
   ```
3. `google-button.tsx`:
   ```tsx
   import { useState } from 'react';
   import { LoaderCircle } from 'lucide-react';
   import { useNavigate } from 'react-router';
   import { Button } from '@/components/ui/button';
   import { GOOGLE_ENABLED } from '@/lib/env';
   import { isMocked } from '@/mocks/enable';
   import { googleMockSignIn, googleStartUrl } from '../api';

   function GoogleMark() {
     // D-7: monochrome so no raw brand colours are needed.
     return (
       <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
         <path d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.7 14.54 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.04 0-.6-.07-1.06-.15-1.51z" />
       </svg>
     );
   }

   /** S5.E3 / S6.E2. Hidden unless VITE_GOOGLE_ENABLED. Mock: MSW route then /auth/google/done; real: full-page API redirect. */
   export function GoogleButton({ next, intent }: { next: string | null; intent: 'provider' | null }) {
     const navigate = useNavigate();
     const [pending, setPending] = useState(false);
     if (!GOOGLE_ENABLED) return null;
     const query = { next: next ?? undefined, intent: intent ?? undefined };
     async function start() {
       setPending(true);
       if (!isMocked('auth')) {
         window.location.assign(googleStartUrl(query));
         return;
       }
       try {
         await googleMockSignIn();
         const qs = new URLSearchParams(Object.entries(query).filter((e): e is [string, string] => e[1] !== undefined));
         await navigate(`/auth/google/done${qs.size > 0 ? `?${qs.toString()}` : ''}`);
       } catch {
         setPending(false);
         await navigate('/login?error=google_cancelled');
       }
     }
     return (
       <Button type="button" variant="secondary" size="lg" className="w-full" disabled={pending} aria-busy={pending || undefined} onClick={() => void start()}>
         {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : <GoogleMark />}
         Continue with Google
       </Button>
     );
   }
   ```
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): auth card header, divider and Google button (M04-T22)"`

### T23 — S5 Log in
- [x] done

**Files:** `src/features/auth/pages/login-page.tsx`, `login-page.test.tsx`, `src/app/chunks/auth.tsx`
**Context:** SPEC S5 (all elements, field table), §6.6 banner, §8.4 (suspended at login / while signed in), ARCH §6.1 (`/login?error=suspended`); AC3, AC4, AC8, AC9; D-2, D-6.
**Do:** create `login-page.tsx`:
```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useSearchParams } from 'react-router';
import { LoginBody } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { PasswordInput } from '@/components/password-input';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-store';
import { FORM_COPY } from '@/lib/error-copy';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { AuthCardHeader } from '../components/auth-card-header';
import { GoogleButton } from '../components/google-button';
import { OrDivider } from '../components/or-divider';
import { useLogin } from '../hooks';

const linkClass = 'text-label text-primary hover:text-primary-hover font-semibold underline-offset-2 hover:underline';

export function LoginPage() {
  const [params] = useSearchParams();
  const { signOutReason } = useAuth();
  const location = useLocation();
  const next = params.get('next');
  const error = params.get('error');
  const login = useLogin();
  const [banner, setBanner] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(LoginBody), defaultValues: { email: '', password: '' } });
  const { errors } = form.formState;

  const info = signOutReason === 'expired' ? FORM_COPY.sessionExpired : null;
  const initialError =
    signOutReason === 'suspended' || error === 'suspended' ? FORM_COPY.suspended
      : error === 'google_cancelled' ? FORM_COPY.googleCancelled
      : null;
  const shown = banner ?? initialError;
  const keepNext = next ? `?${new URLSearchParams({ next }).toString()}` : '';

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);
    try {
      await login.mutateAsync(values); // RequireGuest redirects (D-2)
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError));
    }
  });

  return (
    <>
      <AuthCardHeader title="Log in to Fixit" subtitle="Welcome back." />
      {info && !shown && <FormErrorBanner variant="info">{info}</FormErrorBanner>}
      {shown && <FormErrorBanner>{shown}</FormErrorBanner>}
      <GoogleButton next={next} intent={null} />
      <OrDivider />
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <FormField label="Email" required error={errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...form.register('email')} />}
        </FormField>
        <FormField
          label="Password"
          required
          error={errors.password?.message}
          labelAside={
            <Link to="/forgot-password" state={{ email: form.getValues('email') }} className={linkClass}>
              Forgot password?
            </Link>
          }
        >
          {(p) => <PasswordInput {...p} autoComplete="current-password" {...form.register('password')} />}
        </FormField>
        <SubmitButton size="lg" className="w-full" pending={login.isPending} pendingLabel="Logging in…">
          Log in
        </SubmitButton>
      </form>
      <p className="text-label text-text-muted text-center">
        New to Fixit?{' '}
        <Link to={`/signup${keepNext}`} state={location.state} className={linkClass}>
          Sign up
        </Link>
      </p>
    </>
  );
}
```
States: default; submitting (`Logging in…`, disabled); field errors (S5 copy from `LoginBody`, focus on first — RHF `shouldFocusError` default true); banner: wrong credentials / suspended / rate limited / Google cancelled / §6.3 generic (500 or network); info banner for session expiry. Layout is the L1-auth card at every width (buttons already full width, 48 high).
In `src/app/chunks/auth.tsx` replace the `LoginPage` placeholder with `export { LoginPage } from '@/features/auth/pages/login-page';`.
**Test:** `login-page.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { armForcedError } from '@/mocks/lib/controls';
import { renderRoute } from '@/test/render';

async function logIn(email: string, password = 'demo1234') {
  await userEvent.type(await screen.findByLabelText(/^Email/), email);
  await userEvent.type(screen.getByLabelText(/^Password/), password);
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('S5 Log in', () => {
  it('empty submit shows SPEC messages', async () => {
    authStore.setGuest();
    renderRoute('/login');
    await userEvent.click(await screen.findByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
  });
  it('wrong password → banner', async () => {
    authStore.setGuest();
    renderRoute('/login');
    await logIn('olivia@fixit.test', 'wrong-pass');
    expect(await screen.findByText("That email and password don't match. Try again or reset your password.")).toBeInTheDocument();
  });
  it.each([
    ['olivia@fixit.test', '/login', '/'],
    ['marcus@fixit.test', '/login', '/dashboard'],
    ['olivia@fixit.test', '/login?next=%2Frequests', '/requests'],
  ])('%s from %s → %s', async (email, from, to) => {
    authStore.setGuest();
    const r = renderRoute(from);
    await logIn(email);
    await waitFor(() => expect(r.location()).toBe(to));
  });
  it('suspended account → suspended banner', async () => {
    authStore.setGuest();
    renderRoute('/login');
    await logIn('ruwan@fixit.test');
    expect(await screen.findByText(/Your account is suspended\./)).toBeInTheDocument();
  });
  it('forced 500 → §6.3 banner', async () => {
    authStore.setGuest();
    armForcedError('auth_login', '500');
    renderRoute('/login');
    await logIn('olivia@fixit.test');
    expect(await screen.findByText("We couldn't save your changes. Check your connection and try again.")).toBeInTheDocument();
  });
  it('session expired → info banner', async () => {
    authStore.signOut('expired');
    renderRoute('/login?next=%2Faccount');
    expect(await screen.findByText('Your session expired. Log in again to continue.')).toBeInTheDocument();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- login-page`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S5 log in screen (M04-T23)"`

### T24 — S6 Sign up
- [x] done

**Files:** `src/features/auth/pages/signup-page.tsx`, `signup-page.test.tsx`, `src/app/chunks/auth.tsx`
**Context:** SPEC S6 (title variants, fields, help line, consent, footer), A1, BR-35; AC1; D-1, D-3.
**Do:** create `signup-page.tsx` following `LoginPage`'s structure, with:
- `const intent = params.get('intent') === 'provider' ? 'provider' : null;`
- Header: intent `provider` → `AuthCardHeader title="Join Fixit as a provider" subtitle="Create an account first — next you'll set up your listing."`; else `title="Create your Fixit account" subtitle="Book trusted local pros in minutes."`.
- `useForm({ resolver: zodResolver(SignupForm), defaultValues: { fullName: '', email: '', password: '' } })`.
- `<GoogleButton next={next} intent={intent} />`, `<OrDivider />`.
- Fields in order:
  - `Full name` → `<Input {...p} autoComplete="name" {...form.register('fullName')} />`
  - `Email` → `<Input {...p} type="email" autoComplete="email" {...form.register('email')} />`. When `errors.email?.message === EMAIL_TAKEN` (from contracts), render right after the field: `<Link to={`/login${keepNext}`} className={linkClass}>Log in instead</Link>`.
  - `Password` → `PasswordInput autoComplete="new-password"`; `help` = `errors.password ? undefined : 'At least 8 characters, with a letter and a number.'` (the help is replaced by the error).
- Consent line under the fields: `<p className="text-meta text-text-muted">By signing up you agree to our <Link to="/privacy" target="_blank" rel="noopener" className="text-primary font-semibold underline">Privacy policy</Link>.</p>`
- Submit: `<SubmitButton size="lg" className="w-full" pending={signup.isPending} pendingLabel="Creating account…">Create account</SubmitButton>`
- Footer: `Already have an account?` + `Link` `Log in` → `/login${keepNext}`.
- Submit handler:
  ```ts
  const navigate = useNavigate();
  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);
    try {
      const session = await signup.mutateAsync({ form: values, intent });
      rememberAfterSignup({ next: safeNext(next), intent });
      await navigate('/signup/check-email', { state: { email: session.user.email } }); // leave the guest-only route first (D-2)
      authStore.setSession(session);
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError, { email_taken: 'email' }));
    }
  });
  ```
States: default, provider-intent variant, submitting (`Creating account…`), field errors (focus first), email taken (field message + `Log in instead`), §6.3 banner.
Replace the `SignupPage` placeholder in `chunks/auth.tsx` with a re-export.
**Test:** `signup-page.test.tsx`:
```tsx
it('empty submit shows the three SPEC messages', async () => {
  authStore.setGuest();
  renderRoute('/signup');
  await userEvent.click(await screen.findByRole('button', { name: 'Create account' }));
  expect(await screen.findByText('Enter your full name.')).toBeInTheDocument();
  expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
  expect(screen.getByText('Use at least 8 characters with a letter and a number.')).toBeInTheDocument();
  expect(screen.getByLabelText(/^Full name/)).toHaveFocus();
});
it('taken email → field message + Log in instead', async () => {
  authStore.setGuest();
  renderRoute('/signup');
  await userEvent.type(await screen.findByLabelText(/^Full name/), 'Olivia M');
  await userEvent.type(screen.getByLabelText(/^Email/), 'olivia@fixit.test');
  await userEvent.type(screen.getByLabelText(/^Password/), 'abc12345');
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
  expect(await screen.findByText('This email already has an account.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Log in instead' })).toHaveAttribute('href', '/login');
});
it('success → S7 with the email, signed in', async () => {
  authStore.setGuest();
  const r = renderRoute('/signup?intent=provider');
  expect(await screen.findByRole('heading', { name: 'Join Fixit as a provider' })).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText(/^Full name/), 'Ann Lee');
  await userEvent.type(screen.getByLabelText(/^Email/), 'ann@fixit.test');
  await userEvent.type(screen.getByLabelText(/^Password/), 'abc12345');
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
  await waitFor(() => expect(r.location()).toBe('/signup/check-email'));
  expect(authStore.getState().me?.email).toBe('ann@fixit.test');
});
```
(imports as in T23.) The `/signup/check-email` assertion only needs the route; S7 content is tested in T25.
**Verify:** `pnpm --filter @fixit/web test -- signup-page`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S6 sign up screen (M04-T24)"`

### T25 — S7 Check your email
- [x] done

**Files:** `src/features/auth/pages/check-email-page.tsx`, `check-email-page.test.tsx`, `src/app/chunks/auth.tsx`
**Context:** SPEC S7 (all elements); AC2; D-9.
**Do:**
```tsx
import { Mail } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-store';
import { useCooldown } from '@/lib/use-cooldown';
import { AuthCardHeader } from '../components/auth-card-header';
import { useResendConfirmation } from '../hooks';

const linkClass = 'text-label text-primary hover:text-primary-hover font-semibold underline-offset-2 hover:underline';

export function CheckEmailPage() {
  const { me, status } = useAuth();
  const state = useLocation().state as { email?: string } | null;
  const email = me?.email ?? state?.email;
  const resend = useResendConfirmation();
  const cooldown = useCooldown(60);
  if (status === 'booting') return null;
  if (!email) return <Navigate to="/signup" replace />;
  const coolingDown = cooldown.remaining > 0;
  return (
    <>
      <AuthCardHeader icon={Mail} title="Check your email" />
      <p className="text-body-sm text-text-muted">
        We sent a confirmation link to <span className="text-text font-semibold">{email}</span>. Open it to confirm your account — the link works for 24 hours.
      </p>
      {status === 'signed-in' && (
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={coolingDown || resend.isPending}
          aria-busy={resend.isPending || undefined}
          onClick={() => {
            resend.mutate(undefined, { onSuccess: cooldown.start });
          }}
        >
          {coolingDown ? `Resend in ${cooldown.label}` : 'Resend email'}
        </Button>
      )}
      <Link to="/signup" className={`${linkClass} self-center`}>Use a different email</Link>
      <p className="text-meta text-text-muted">
        You can browse Fixit while you wait, but you'll need to confirm your email before sending a request or setting up a listing.{' '}
        <Link to="/discover" className={linkClass}>Browse providers</Link>
      </p>
    </>
  );
}
```
States: default (button enabled), cooling down (`Resend in 0:59` … disabled), sending (disabled, `aria-busy`), success toast `Email sent again.`, error toast (D-9 / rate limit). Guest without state → redirect to `/signup`.
Re-export from `chunks/auth.tsx`.
**Test:**
```tsx
it('resend → toast and countdown label', async () => {
  signInAs('customerUnconfirmed');
  renderRoute('/signup/check-email');
  expect(await screen.findByText('nimal@fixit.test')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Resend email' }));
  expect(await screen.findByRole('button', { name: /^Resend in 0:5\d$/ })).toBeDisabled();
  expect(await screen.findByText('Email sent again.')).toBeInTheDocument();
});
```
(The `Toaster` must be in the tree for the toast text; if `renderRoute` doesn't render it, assert on the button only and drop the toast line.)
**Verify:** `pnpm --filter @fixit/web test -- check-email-page`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S7 check your email screen (M04-T25)"`

### T26 — S8 Confirm email result
- [x] done

**Files:** `src/features/auth/pages/confirm-email-page.tsx`, `confirm-email-page.test.tsx`, `src/app/chunks/auth.tsx`
**Context:** SPEC S8 (four states), A6; AC2, AC9; D-3.
**Do:**
```tsx
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-store';
import { useDelayedFlag } from '@/lib/use-delayed-flag';
import { AuthCardHeader } from '../components/auth-card-header';
import { takeAfterSignupTarget, useConfirmEmail, useResendConfirmation } from '../hooks';

export function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const confirm = useConfirmEmail(token);
  const { status } = useAuth();
  const resend = useResendConfirmation();
  const navigate = useNavigate();
  const loading = token !== null && token !== '' && confirm.isPending;
  const showSkeleton = useDelayedFlag(loading);

  if (loading)
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <span className="sr-only">Loading…</span>
        {showSkeleton && (
          <>
            <Skeleton className="size-14 rounded-xl" />
            <Skeleton className="h-7 w-3/5" />
            <Skeleton className="h-5 w-4/5" />
          </>
        )}
      </div>
    );

  if (confirm.data) {
    const already = confirm.data.status === 'already_confirmed';
    return (
      <>
        <AuthCardHeader
          icon={CircleCheck}
          tone="success"
          title={already ? 'Your email is already confirmed' : 'Email confirmed'}
          subtitle={already ? 'You can carry on where you left off.' : "You're all set."}
        />
        <Button size="lg" className="w-full" onClick={() => void navigate(takeAfterSignupTarget(), { replace: true })}>
          Continue
        </Button>
      </>
    );
  }

  // missing token, token_invalid, or any other failure → expired state
  return (
    <>
      <AuthCardHeader
        icon={TriangleAlert}
        tone="warning"
        title="This link has expired"
        subtitle="Confirmation links work for 24 hours. We can send you a new one."
      />
      {status === 'signed-in' ? (
        <Button size="lg" className="w-full" disabled={resend.isPending} aria-busy={resend.isPending || undefined} onClick={() => { resend.mutate(); }}>
          Send a new link
        </Button>
      ) : (
        <Button size="lg" className="w-full" onClick={() => void navigate('/login')}>
          Log in to resend
        </Button>
      )}
    </>
  );
}
```
States: loading skeleton (after 150 ms, `aria-busy`), success, already confirmed, expired (signed in / signed out variants).
Re-export from `chunks/auth.tsx`.
**Test:**
```tsx
const linkToken = () => new URL(db().lastEmailLink ?? '', 'http://x').searchParams.get('token') ?? '';

it('success → Continue goes to stored provider intent; reopening → already confirmed; tampered → expired', async () => {
  authStore.setGuest();
  await register({ fullName: 'Ann Lee', email: 'ann@fixit.test', password: 'abc12345' });
  rememberAfterSignup({ next: null, intent: 'provider' });
  const token = linkToken();
  const r = renderRoute(`/auth/confirm?token=${token}`);
  expect(await screen.findByRole('heading', { name: 'Email confirmed' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await waitFor(() => expect(r.location()).toMatch(/^\/(login|become-a-provider\/1)/)); // guest → RequireAuth sends to /login?next=…
  r.unmount();
  renderRoute(`/auth/confirm?token=${token}`);
  expect(await screen.findByRole('heading', { name: 'Your email is already confirmed' })).toBeInTheDocument();
});
it('tampered token → This link has expired + Log in to resend', async () => {
  authStore.setGuest();
  renderRoute('/auth/confirm?token=nope');
  expect(await screen.findByRole('heading', { name: 'This link has expired' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Log in to resend' })).toBeInTheDocument();
});
```
(imports: `register` from `../api`, `rememberAfterSignup` from `../hooks`, `db` from `@/mocks/db/store`.)
**Verify:** `pnpm --filter @fixit/web test -- confirm-email-page`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S8 confirm email screen (M04-T26)"`

### T27 — S9 Forgot password
- [x] done

**Files:** `src/features/auth/pages/forgot-password-page.tsx`, `forgot-password-page.test.tsx`, `src/app/chunks/auth.tsx`
**Context:** SPEC S9, A7; AC5.
**Do:** component:
- `useForm({ resolver: zodResolver(ForgotPasswordBody), defaultValues: { email: (useLocation().state as { email?: string } | null)?.email ?? '' } })`.
- `const forgot = useForgotPassword(); const [sentTo, setSentTo] = useState<string | null>(null); const [banner, setBanner] = useState<string | null>(null);`
- Submit: `try { await forgot.mutateAsync(values); setSentTo(values.email); } catch (e) { setBanner(mapApiErrorToForm(e, form.setError)); }`
- Form state: `AuthCardHeader title="Reset your password" subtitle="Enter your account email and we'll send you a reset link."`, banner, `Email` field (as S5), `<SubmitButton size="lg" className="w-full" pending={forgot.isPending} pendingLabel="Sending…">Send reset link</SubmitButton>`.
- Sent state (replaces the form): `AuthCardHeader icon={Mail} title="Check your email"`, `<p className="text-body-sm text-text-muted">If an account exists for <span className="text-text font-semibold">{sentTo}</span>, you'll get a reset link in a few minutes. It works for 1 hour.</p>`, `<Button asChild variant="secondary" size="lg" className="w-full"><Link to="/login">Back to log in</Link></Button>`.
Re-export from `chunks/auth.tsx`.
**Test:**
```tsx
it.each(['olivia@fixit.test', 'nobody@fixit.test'])('%s → same sent state', async (email) => {
  authStore.setGuest();
  renderRoute('/forgot-password');
  await userEvent.type(await screen.findByLabelText(/^Email/), email);
  await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
  expect(await screen.findByText(new RegExp(`If an account exists for ${email}`))).toBeInTheDocument();
});
```
**Verify:** `pnpm --filter @fixit/web test -- forgot-password-page`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S9 forgot password screen (M04-T27)"`

### T28 — S10 Reset password
- [x] done

**Files:** `src/features/auth/pages/reset-password-page.tsx`, `reset-password-page.test.tsx`, `src/app/chunks/auth.tsx`
**Context:** SPEC S10, A8; AC5.
**Do:** component:
- `const token = useSearchParams()[0].get('token'); const reset = useResetPassword(); const [expired, setExpired] = useState(!token);`
- `useForm({ resolver: zodResolver(ResetPasswordForm), defaultValues: { password: '', confirmPassword: '' } })`.
- Submit:
  ```ts
  try {
    await reset.mutateAsync({ token: token ?? '', password: values.password });
    notify('Password updated. Log in with your new password.');
    await navigate('/login', { replace: true });
  } catch (e) {
    if (e instanceof ApiError && e.rule === 'token_invalid') setExpired(true);
    else setBanner(mapApiErrorToForm(e, form.setError));
  }
  ```
- Form state: `AuthCardHeader title="Choose a new password"`; banner; `New password` (`PasswordInput autoComplete="new-password"`, help `At least 8 characters, with a letter and a number.` when no error); `Confirm new password` (`PasswordInput autoComplete="new-password"`); `<SubmitButton size="lg" className="w-full" pending={reset.isPending} pendingLabel="Saving…">Save new password</SubmitButton>`.
- Expired state (replaces the form; also when the token param is missing): `AuthCardHeader icon={TriangleAlert} tone="warning" title="This reset link has expired" subtitle="Reset links work for 1 hour. Request a new one."` + `<Button asChild size="lg" className="w-full"><Link to="/forgot-password">Request a new link</Link></Button>`.
Re-export from `chunks/auth.tsx`.
**Test:**
```tsx
it('mismatch → Passwords don’t match.; success → /login; old password fails', async () => {
  authStore.setGuest();
  await forgotPassword({ email: 'olivia@fixit.test' });
  const token = new URL(db().lastEmailLink ?? '', 'http://x').searchParams.get('token') ?? '';
  const r = renderRoute(`/reset-password?token=${token}`);
  await userEvent.type(await screen.findByLabelText(/^New password/), 'newpass99');
  await userEvent.type(screen.getByLabelText(/^Confirm new password/), 'newpass98');
  await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
  expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
  await userEvent.clear(screen.getByLabelText(/^Confirm new password/));
  await userEvent.type(screen.getByLabelText(/^Confirm new password/), 'newpass99');
  await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
  await waitFor(() => expect(r.location()).toBe('/login'));
  await expect(login({ email: 'olivia@fixit.test', password: 'demo1234' })).rejects.toMatchObject({ status: 401 });
});
it('bad token → expired state', async () => {
  authStore.setGuest();
  renderRoute('/reset-password?token=nope');
  await userEvent.type(await screen.findByLabelText(/^New password/), 'newpass99');
  await userEvent.type(screen.getByLabelText(/^Confirm new password/), 'newpass99');
  await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
  expect(await screen.findByRole('heading', { name: 'This reset link has expired' })).toBeInTheDocument();
});
```
**Verify:** `pnpm --filter @fixit/web test -- reset-password-page`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S10 reset password screen (M04-T28)"`

### T29 — S29 Admin sign-in
- [x] done

**Files:** `src/features/auth/pages/admin-login-page.tsx`, `admin-login-page.test.tsx`, `src/app/chunks/auth.tsx`
**Context:** SPEC S29 (all elements; no Google, no sign-up link), §6.6 admin; AC7; D-2.
**Do:** same structure as `LoginPage` minus Google, divider and footer:
- `AuthCardHeader title="Fixit admin" subtitle="Sign in with your admin account."`
- Info banner when `signOutReason === 'expired'` (`FORM_COPY.sessionExpired`).
- Fields Email, Password (as S5), with `labelAside` `Forgot password?` → `/forgot-password`.
- `<SubmitButton size="lg" className="w-full" pending={adminLogin.isPending} pendingLabel="Signing in…">Sign in</SubmitButton>`
- Error mapping:
  ```ts
  const msg = mapApiErrorToForm(e, form.setError);
  setBanner(msg === FORM_COPY.invalidCredentials || msg === FORM_COPY.suspended ? FORM_COPY.adminInvalidCredentials : msg);
  ```
Re-export from `chunks/auth.tsx`. Confirm (grep) that no file under `src/` links to `/admin/login` except guards, `useLogout` and tests.
**Test:**
```tsx
it('customer credentials → generic error; admin → /admin', async () => {
  authStore.setGuest();
  const r = renderRoute('/admin/login');
  expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument();
  await userEvent.type(await screen.findByLabelText(/^Email/), 'olivia@fixit.test');
  await userEvent.type(screen.getByLabelText(/^Password/), 'demo1234');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText("That email and password don't match.")).toBeInTheDocument();
  await userEvent.clear(screen.getByLabelText(/^Email/));
  await userEvent.type(screen.getByLabelText(/^Email/), 'admin@fixit.test');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(r.location()).toBe('/admin'));
  expect(screen.queryByRole('link', { name: 'Sign up' })).not.toBeInTheDocument();
});
```
**Verify:** `pnpm --filter @fixit/web test -- admin-login-page`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S29 admin sign-in screen (M04-T29)"`

### T30 — `/auth/google/done`
- [x] done

**Files:** `src/features/auth/pages/google-done-page.tsx`, `google-done-page.test.tsx`, `src/app/chunks/auth.tsx`
**Context:** ARCH §6.1 Google, milestone note "refresh → go to `next`"; SPEC S6.E2 (provider intent → `/become-a-provider/1`).
**Do:**
```tsx
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { authStore } from '@/lib/auth-store';
import { refreshOnce } from '@/lib/http';
import { postLoginTarget } from '@/lib/next';

/** Technical route: exchange the refresh cookie for a session, then go to intent / next / role home. */
export function GoogleDonePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; // StrictMode
    started.current = true;
    void (async () => {
      if (!(await refreshOnce())) {
        await navigate('/login?error=google_cancelled', { replace: true });
        return;
      }
      const me = authStore.getState().me;
      const to = params.get('intent') === 'provider' ? '/become-a-provider/1' : postLoginTarget(me, `?${params.toString()}`);
      await navigate(to, { replace: true });
    })();
  }, [navigate, params]);
  return (
    <div aria-busy="true">
      <h1 className="text-title-md text-text">Signing you in…</h1>
    </div>
  );
}
```
(`Signing you in…` is a transient technical label with no SPEC copy; it is only visible for the length of one request.)
Re-export from `chunks/auth.tsx`.
**Test:**
```tsx
it('after the mock Google step, lands on next', async () => {
  authStore.setGuest();
  await googleMockSignIn();
  const r = renderRoute('/auth/google/done?next=%2Frequests');
  await waitFor(() => expect(r.location()).toBe('/requests'));
  expect(authStore.getState().me?.email).toBe('sanduni@fixit.test');
});
it('no session → /login?error=google_cancelled', async () => {
  authStore.setGuest();
  const r = renderRoute('/auth/google/done');
  await waitFor(() => expect(r.location()).toBe('/login?error=google_cancelled'));
});
```
**Verify:** `pnpm --filter @fixit/web test -- google-done-page`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): Google done route (M04-T30)"`

### T31 — Unconfirmed-email banner (§6.8 #6)
- [x] done

**Files:** `src/features/auth/components/unconfirmed-email-banner.tsx`, `src/app/layouts/parts/use-account-banners.tsx`, `src/app/layouts/public-layout.tsx`, `src/app/layouts/parts/dashboard-shell.tsx`, `src/app/layouts/public-layout.test.tsx` (create)
**Context:** SPEC §6.8 row 6 (warning; L1/L2 strip under the nav, L3 main slot; phone: action on its own line, 44 target — already in `NoticeBanner`); AC3.
**Do:**
1. `unconfirmed-email-banner.tsx`:
   ```tsx
   import { NoticeBanner } from '@/components/notice-banner';
   import { useResendConfirmation } from '../hooks';

   export function UnconfirmedEmailBanner({ email }: { email: string }) {
     const resend = useResendConfirmation();
     return (
       <NoticeBanner variant="warning" action={{ label: 'Resend email', onClick: () => { if (!resend.isPending) resend.mutate(); } }}>
         Confirm your email to send requests. We sent a link to {email}.
       </NoticeBanner>
     );
   }
   ```
2. `use-account-banners.tsx`:
   ```tsx
   import type { ReactNode } from 'react';
   import { UnconfirmedEmailBanner } from '@/features/auth/components/unconfirmed-email-banner';
   import { useAuth } from '@/lib/auth-store';

   /** SPEC §6.8 in priority order. M04: #6 only; M11/M12 add the provider and onboarding rows. */
   export function useAccountBanners(): ReactNode[] {
     const { me } = useAuth();
     if (!me || me.roles.includes('admin')) return [];
     const banners: ReactNode[] = [];
     if (!me.emailConfirmed) banners.push(<UnconfirmedEmailBanner key="unconfirmed" email={me.email} />);
     return banners;
   }
   ```
3. `public-layout.tsx`: `const banners = useAccountBanners();` and `<BannerSlot banners={banners} placement="strip" />`.
4. `dashboard-shell.tsx`: same, with `placement="main"`, only in the provider shell (if the shell is shared with admin, `useAccountBanners` already returns `[]` for admins).
**Test:** `public-layout.test.tsx`:
```tsx
it('unconfirmed user sees the banner with Resend email', async () => {
  signInAs('customerUnconfirmed');
  renderRoute('/');
  expect(await screen.findByText('Confirm your email to send requests. We sent a link to nimal@fixit.test.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Resend email' })).toBeInTheDocument();
});
it('confirmed user sees no banner', async () => {
  signInAs('customer');
  renderRoute('/');
  await screen.findByRole('main');
  expect(screen.queryByText(/Confirm your email/)).not.toBeInTheDocument();
});
```
**Verify:** `pnpm --filter @fixit/web test -- public-layout`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): unconfirmed-email account banner (M04-T31)"`

### T32 — `DiscardChangesGuard` (§6.7)
- [x] done

**Files:** `src/components/discard-changes-guard.tsx`
**Context:** SPEC §6.7 copy; §6.10 (dialog → bottom sheet on phone via `ResponsiveDialog`); D-8.
**Do:**
```tsx
import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { Button } from '@/components/ui/button';
import { authStore } from '@/lib/auth-store';
import { ResponsiveDialog } from './responsive-dialog';

/** SPEC §6.7. One per page (D-8). Never blocks once signed out, so expiry/logout redirects pass. */
export function DiscardChangesGuard({ when }: { when: boolean }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && authStore.getState().status === 'signed-in' && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [when]);
  const blocked = blocker.state === 'blocked';
  return (
    <ResponsiveDialog
      open={blocked}
      onOpenChange={(open) => {
        if (!open && blocker.state === 'blocked') blocker.reset();
      }}
      title="Discard changes?"
      description="What you've entered won't be saved."
      footer={
        <>
          <Button variant="secondary" onClick={() => { if (blocker.state === 'blocked') blocker.reset(); }}>
            Keep editing
          </Button>
          <Button variant="danger" onClick={() => { if (blocker.state === 'blocked') blocker.proceed(); }}>
            Discard
          </Button>
        </>
      }
    />
  );
}
```
**Verify:** `pnpm verify` green (behaviour is tested in T36).
**Commit:** `git commit -m "feat(web): discard-changes guard (M04-T32)"`

### T33 — S18 "Your details" card
- [x] done

**Files:** `src/features/account/components/details-card.tsx`, `src/components/status-pill.tsx`
**Context:** SPEC S18.E1 and field table; §6.6 draft; AC6, AC8; D-4.
**Do:**
1. `status-pill.tsx`: add `| { kind: 'email'; confirmed: boolean }` to `StatusPillProps` and resolve it to `{ tone: confirmed ? 'completed' : 'pending', label: confirmed ? 'Confirmed' : 'Not confirmed', dot: true }` in the resolver's switch.
2. `details-card.tsx`:
   ```tsx
   import { useEffect, useState } from 'react';
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import { AccountDetailsForm, type Me } from '@fixit/contracts';
   import { FormErrorBanner } from '@/components/form-error-banner';
   import { FormField } from '@/components/form-field';
   import { PhoneInput } from '@/components/phone-input';
   import { StatusPill } from '@/components/status-pill';
   import { SubmitButton } from '@/components/submit-button';
   import { Input } from '@/components/ui/input';
   import { useResendConfirmation } from '@/features/auth/hooks';
   import { mapApiErrorToForm } from '@/lib/form-errors';
   import { notify } from '@/lib/toast';
   import { useFormDraft } from '@/lib/use-form-draft';
   import { useUpdateMe } from '../hooks';

   /** "+94771234567" → "77 123 4567" (what PhoneInput shows after its fixed +94). */
   const nationalOf = (e164: string | null): string =>
     e164 ? `${e164.slice(3, 5)} ${e164.slice(5, 8)} ${e164.slice(8)}` : '';

   export function DetailsCard({ me, onDirtyChange }: { me: Me; onDirtyChange: (dirty: boolean) => void }) {
     const update = useUpdateMe();
     const resend = useResendConfirmation();
     const [banner, setBanner] = useState<string | null>(null);
     const form = useForm({
       resolver: zodResolver(AccountDetailsForm),
       defaultValues: { fullName: me.fullName, mobile: nationalOf(me.mobile) },
     });
     useFormDraft('account.details', form);
     const { errors, isDirty } = form.formState;
     useEffect(() => { onDirtyChange(isDirty); }, [isDirty, onDirtyChange]);

     const onSubmit = form.handleSubmit(async (values) => {
       setBanner(null);
       try {
         const saved = await update.mutateAsync(values);
         form.reset({ fullName: saved.fullName, mobile: nationalOf(saved.mobile) });
         notify('Changes saved.');
       } catch (e) {
         setBanner(mapApiErrorToForm(e, form.setError, { mobile_missing: 'mobile' }));
       }
     });

     return (
       <section aria-labelledby="details-h" className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-5 sm:p-7">
         <h2 id="details-h" className="text-title-sm text-text">Your details</h2>
         {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
         <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
           <FormField label="Full name" required error={errors.fullName?.message}>
             {(p) => <Input {...p} autoComplete="name" {...form.register('fullName')} />}
           </FormField>
           <FormField label="Mobile number" required={me.roles.includes('provider')} optional={!me.roles.includes('provider')} error={errors.mobile?.message}>
             {(p) => <PhoneInput {...p} {...form.register('mobile')} />}
           </FormField>
           <div className="flex flex-col gap-1.5">
             <span className="text-label text-text font-semibold">Email</span>
             <div className="flex flex-wrap items-center gap-2">
               <span className="text-body text-text break-all">{me.email}</span>
               <StatusPill kind="email" confirmed={me.emailConfirmed} />
               {!me.emailConfirmed && (
                 <button type="button" className="text-label text-primary inline-flex min-h-11 items-center font-semibold underline-offset-2 hover:underline sm:min-h-0" onClick={() => { if (!resend.isPending) resend.mutate(); }}>
                   Resend email
                 </button>
               )}
             </div>
             <p className="text-meta text-text-muted">Your email is never shown to providers.</p>
           </div>
           <SubmitButton className="w-full self-end sm:w-auto" pending={update.isPending} pendingLabel="Saving…">
             Save
           </SubmitButton>
         </form>
       </section>
     );
   }
   ```
   (`rounded-2xl` = r20 in this theme, as used by `AuthLayout`. If `text-title-sm` is not a token in `globals.css`, use `text-title-xs`.)
   The `mobile` value goes through `MobileOrEmpty` (empty → `null`), so `updateMe` receives `{ fullName, mobile: string | null }`.
States: default (pre-filled), field errors (name/mobile, S6/S12 copy), provider clearing mobile (server `mobile_missing` → field message), submitting (`Saving…`), success toast `Changes saved.` + form reset (not dirty), §6.3 banner, unconfirmed email row with `Not confirmed` pill + `Resend email`.
**Verify:** `pnpm verify` green (tested in T36).
**Commit:** `git commit -m "feat(web): S18 details card (M04-T33)"`

### T34 — S18 Password card
- [x] done

**Files:** `src/features/account/components/password-card.tsx`
**Context:** SPEC S18.E2 and field table (Google-only → `You sign in with Google.`); AC6.
**Do:**
- Props `{ me: Me; onDirtyChange: (dirty: boolean) => void }`. Same card wrapper classes and `h2` style as T33, heading `Password`.
- If `!me.authMethods.includes('password')`: render only `<p className="text-body-sm text-text-muted">You sign in with Google.</p>` under the heading and call `onDirtyChange(false)` never (no form).
- Otherwise `useForm({ resolver: zodResolver(ChangePasswordForm), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })` (no `useFormDraft`: passwords are never kept, §6.6). Report `isDirty` via `onDirtyChange` as in T33.
- Fields: `Current password` (`PasswordInput autoComplete="current-password"`), `New password` (`PasswordInput autoComplete="new-password"`, help `At least 8 characters, with a letter and a number.` when no error), `Confirm new password` (`PasswordInput autoComplete="new-password"`).
- Submit:
  ```ts
  try {
    await change.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword });
    form.reset();
    notify('Password updated.');
  } catch (e) {
    setBanner(mapApiErrorToForm(e, form.setError, { current_password_wrong: 'currentPassword', password_reused: 'newPassword' }));
  }
  ```
- Button: `<SubmitButton className="w-full self-end sm:w-auto" pending={change.isPending} pendingLabel="Saving…">Update password</SubmitButton>`.
States: Google-only text; default; field errors; wrong current (`Current password is incorrect.` on the field); reused; submitting; success toast `Password updated.`; §6.3 banner.
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S18 password card (M04-T34)"`

### T35 — S18 "I offer services" card
- [x] done

**Files:** `src/features/account/components/offer-services-card.tsx`
**Context:** SPEC S18.E3 (F-03), BR-35; AC6.
**Do:**
```tsx
import { useId } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Me } from '@fixit/contracts';
import { Switch } from '@/components/ui/switch';

const linkClass = 'text-label text-primary hover:text-primary-hover inline-flex min-h-11 items-center font-semibold underline-offset-2 hover:underline sm:min-h-0';

export function OfferServicesCard({ me }: { me: Me }) {
  const navigate = useNavigate();
  const id = useId();
  const isProvider = me.roles.includes('provider');
  const draftStep = me.provider && !me.provider.onboarding.complete ? me.provider.onboarding.step : null;
  return (
    <section aria-labelledby={`${id}-h`} className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <h2 id={`${id}-h`} className="text-title-sm text-text">I offer services</h2>
        <Switch
          aria-labelledby={`${id}-h`}
          checked={isProvider}
          disabled={isProvider}
          onCheckedChange={(on) => {
            if (on) void navigate(`/become-a-provider/${String(draftStep ?? 1)}`);
          }}
          className="after:absolute after:-inset-2 relative" // 44 px hit area around the 26 px switch
        />
      </div>
      {isProvider ? (
        <>
          <p className="text-body-sm text-text">You're listed as {me.provider?.businessName ?? 'your business'}.</p>
          <Link to="/dashboard" className={linkClass}>Go to your dashboard</Link>
          <p className="text-meta text-text-subtle">To stop new requests for a while, pause them in your dashboard settings.</p>
        </>
      ) : (
        <>
          <p className="text-body-sm text-text-muted">List your business on Fixit and receive job requests.</p>
          {draftStep !== null && (
            <Link to={`/become-a-provider/${String(draftStep)}`} className={linkClass}>Continue setting up your listing</Link>
          )}
        </>
      )}
    </section>
  );
}
```
(Same `text-title-sm`/`text-title-xs` rule as T33.)
States: not a provider (switch off, enabled); draft in progress (off + `Continue setting up your listing`); provider (on, disabled, business name, dashboard link, pause note).
**Verify:** `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S18 offer-services card (M04-T35)"`

### T36 — S18 Account page assembly
- [ ] done

**Files:** `src/features/account/pages/account-page.tsx`, `account-page.test.tsx`, `src/app/chunks/customer.tsx`
**Context:** SPEC S18 layout (one column of cards, max 720, gap 20), S18.E4 (F-40 line); §6.7; AC6, AC8.
**Do:**
```tsx
import { useCallback, useState } from 'react';
import { CustomerPageHeader } from '@/app/layouts/customer-layout';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { useAuth } from '@/lib/auth-store';
import { CONTACT_EMAIL } from '@/lib/env';
import { DetailsCard } from '../components/details-card';
import { OfferServicesCard } from '../components/offer-services-card';
import { PasswordCard } from '../components/password-card';

export function AccountPage() {
  const { me } = useAuth();
  const [detailsDirty, setDetailsDirty] = useState(false);
  const [passwordDirty, setPasswordDirty] = useState(false);
  const onDetailsDirty = useCallback((d: boolean) => { setDetailsDirty(d); }, []);
  const onPasswordDirty = useCallback((d: boolean) => { setPasswordDirty(d); }, []);
  if (!me) return null; // RequireAuth guarantees a user; null only during sign-out
  return (
    <>
      <CustomerPageHeader title="Account settings" tabs />
      <div className="max-w-form flex w-full flex-col gap-5">
        <DetailsCard me={me} onDirtyChange={onDetailsDirty} />
        <PasswordCard me={me} onDirtyChange={onPasswordDirty} />
        <OfferServicesCard me={me} />
        <p className="text-meta text-text-muted">To delete your account, email us at {CONTACT_EMAIL}.</p>
      </div>
      <DiscardChangesGuard when={detailsDirty || passwordDirty} />
    </>
  );
}
```
If importing `CustomerPageHeader` from `app/` into a feature is flagged by lint (import boundaries), move nothing; instead keep `AccountPage` in `chunks/customer.tsx` composing `<CustomerPageHeader/>` + a feature `AccountSettings` component, and write that in the blocker-free way the lint allows.
In `chunks/customer.tsx` replace the `AccountPage` placeholder with `export { AccountPage } from '@/features/account/pages/account-page';`.
Phone (390): cards full width with `p-5`, Save buttons full width (`w-full sm:w-auto`), no horizontal scroll (email uses `break-all`).
**Test:** `account-page.test.tsx`:
```tsx
describe('S18 Account settings', () => {
  beforeEach(() => { sessionStorage.clear(); });
  it('saves name and mobile; nav initials update', async () => {
    signInAs('customer');
    renderRoute('/account');
    const name = await screen.findByLabelText(/^Full name/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Zara Perera');
    const mobile = screen.getByLabelText(/^Mobile number/);
    await userEvent.clear(mobile);
    await userEvent.type(mobile, '077 123 4567');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(authStore.getState().me?.fullName).toBe('Zara Perera'));
    expect(authStore.getState().me?.mobile).toBe('+94771234567');
    expect(await screen.findAllByText('ZP')).not.toHaveLength(0);
  });
  it('invalid mobile → S12 message', async () => {
    signInAs('customer');
    renderRoute('/account');
    const mobile = await screen.findByLabelText(/^Mobile number/);
    await userEvent.clear(mobile);
    await userEvent.type(mobile, '12345');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter a Sri Lankan mobile number, like 077 123 4567.')).toBeInTheDocument();
  });
  it('provider clearing mobile → BR-23 message', async () => {
    signInAs('provider');
    renderRoute('/account');
    await userEvent.clear(await screen.findByLabelText(/^Mobile number/));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Providers need a mobile number — customers use it after you accept.')).toBeInTheDocument();
  });
  it('wrong current password → field message', async () => {
    signInAs('customer');
    renderRoute('/account');
    await userEvent.type(await screen.findByLabelText(/^Current password/), 'nope1234');
    await userEvent.type(screen.getByLabelText(/^New password/), 'abc12345');
    await userEvent.type(screen.getByLabelText(/^Confirm new password/), 'abc12345');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('Current password is incorrect.')).toBeInTheDocument();
  });
  it('offer-services: Olivia off → onboarding; Marcus on and disabled', async () => {
    signInAs('customer');
    const r = renderRoute('/account');
    await userEvent.click(await screen.findByRole('switch', { name: 'I offer services' }));
    await waitFor(() => expect(r.location()).toBe('/become-a-provider/1'));
    r.unmount();
    signInAs('provider');
    renderRoute('/account');
    expect(await screen.findByRole('switch', { name: 'I offer services' })).toBeDisabled();
    expect(screen.getByText("You're listed as Bell & Sons.")).toBeInTheDocument();
  });
  it('dirty form → Discard changes? on leaving', async () => {
    signInAs('customer');
    const r = renderRoute('/account');
    await userEvent.type(await screen.findByLabelText(/^Full name/), 'x');
    await userEvent.click(screen.getByRole('link', { name: 'My requests' }));
    expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(r.location()).toBe('/requests'));
  });
  it('session expiry while editing → /login?next=/account, name restored after login', async () => {
    signInAs('customer');
    armForcedError('me_update', '401');
    armForcedError('auth_refresh', '401');
    const r = renderRoute('/account');
    const name = await screen.findByLabelText(/^Full name/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Draft Name');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(r.location()).toBe('/login?next=%2Faccount'));
    expect(screen.getByText('Your session expired. Log in again to continue.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^Email/), 'olivia@fixit.test');
    await userEvent.type(screen.getByLabelText(/^Password/), 'demo1234');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(r.location()).toBe('/account'));
    expect(await screen.findByDisplayValue('Draft Name')).toBeInTheDocument();
  });
});
```
(If `My requests` matches more than one link (nav + tabs), use `getAllByRole(...)[0]`.) If the session-expiry test shows the redirect target is `/login?next=/account` unencoded, assert that string instead; `loginUrl()` decides.
**Verify:** `pnpm --filter @fixit/web test -- account-page`; `pnpm verify` green.
**Commit:** `git commit -m "feat(web): S18 account settings page (M04-T36)"`

### T37 — Acceptance walk-through
- [ ] done

**Files:** this plan (results), `docs/milestones/M00-index.md` (tick M04 only if every criterion passes)
**Do:** run `pnpm verify` (must be green). Then `pnpm dev:mock`, DevPanel → Reset demo data, Latency normal. For each criterion record PASS/FAIL + note under a `## Acceptance results` heading at the end of this file. Check every UI step at **1440px and 390px** (browser devtools), confirming no horizontal page scroll.
| AC | Check |
|---|---|
| 1 | `/signup` → submit empty: three messages, focus on Full name. Enter `olivia@fixit.test` → `This email already has an account.` + `Log in instead`. Automated: T24 test. |
| 2 | Sign up `new1@fixit.test` → S7 shows the email. `Resend email` → toast `Email sent again.`, button `Resend in 0:59` counting down. DevPanel "Last email link" → `Email confirmed` → `Continue` → `/`. Repeat from `/signup?intent=provider` (new email) → `/become-a-provider/1`. Open the same link again → `Your email is already confirmed`. Edit one character of the token → `This link has expired`. |
| 3 | Wrong password → S5 banner. Olivia → `/`; Marcus → `/dashboard`; `/login?next=/requests` as Olivia → `/requests`. Nimal → `/` with the warning banner under the nav and `Resend email`. Automated: T23, T31. |
| 4 | Log in as `ruwan@fixit.test` / `demo1234` → `Your account is suspended. If you think this is a mistake, email us at hello@fixit.test.` |
| 5 | `/forgot-password` → existing and unknown email both show `If an account exists for {email}…`. DevPanel link → S10: mismatch → `Passwords don't match.`; success → `/login` + toast `Password updated. Log in with your new password.`; old password → S5 banner. Reuse the link → `This reset link has expired`. |
| 6 | `/account` as Olivia: name + `077 123 4567` → `Changes saved.`, nav avatar initials change. `12345` → S12 message. As Marcus clear mobile → BR-23 message. Wrong current password → `Current password is incorrect.`. Continue with Google (from `/login`) → Sanduni → `/account` shows `You sign in with Google.`. Olivia's switch off → `/become-a-provider/1`; Marcus's switch on + disabled with `You're listed as Bell & Sons.` |
| 7 | `grep -rn "admin/login" apps/web/src --include=*.tsx` shows no public link. `/admin/login`: Olivia → `That email and password don't match.`; admin → `/admin`. No Google button, no sign-up link. |
| 8 | As Olivia on `/account`, type a new name. DevPanel → Force next error: `me_update` → 401, Arm; `auth_refresh` → 401, Arm. Save → `/login?next=/account` with the expiry banner. Log in → `/account` with the typed name; password fields empty. Automated: T36. |
| 9 | Latency slow: S8 skeleton shows; S5/S6/S18 buttons show `Logging in…`/`Creating account…`/`Saving…` and are disabled. Force 500 on `auth_login` → §6.3 banner. Signed in, open `/login`, `/signup`, `/forgot-password` → redirected away. |
| 10 | `pnpm test` green; cases in T3 (schema copy), T14 (fieldErrors → fields), T12 (`https://evil.test` ignored). |
If any criterion fails, write it under `## Blockers` (AC number, what happened) and stop. If all pass, tick M04 in `docs/milestones/M00-index.md`.
**Verify:** `pnpm verify` green; results table filled.
**Commit:** `git commit -m "chore: M04 acceptance checks (M04-T37)"`

## Checkpoints
- After T11: "Human: `pnpm dev:mock`, DevPanel → Force next error lists the new endpoint ids; Last email link reads `None yet`."
- After T25: "Human: `pnpm dev:mock` at 1440 and 390: sign up a new account, see S7, press `Resend email`, watch the countdown. Then open the DevPanel email link."
- After T30: "Human: check `/login`, `/signup`, `/signup?intent=provider`, `/forgot-password`, `/reset-password?token=x`, `/admin/login` at 1440 and 390 against SPEC §3 L1-auth (440 card, 48 full-width buttons, logo-only S29)."
- After T36: "Human: `/account` as Olivia, Marcus and Sanduni at 1440 and 390; cards max 720, Save full width on phone."

## Blockers
### T23 (affects T23–T36 tests) — jest-dom matchers are not set up
- **Problem:** the plan's page tests use `toBeInTheDocument`, `toBeDisabled`, `toHaveFocus`, `toHaveAttribute`. `@testing-library/jest-dom` is not installed, `apps/web/src/test/setup.ts` does not register it, and no existing test uses these matchers. Running T23's test fails with `Invalid Chai property: toBeInTheDocument` (5 of 6 tests).
- **Why I stopped:** the plan only authorizes adding `@testing-library/user-event` (T15). Adding a dev dependency and editing `setup.ts` is outside any task, and rewriting the plan's assertions would change its tests.
- **Options:**
  1. Add `@testing-library/jest-dom` as a web devDependency and register it in `src/test/setup.ts` (`import '@testing-library/jest-dom/vitest'`) plus the vitest types, as a new pre-task (e.g. T22b). Plan tests then work as written. (Recommended.)
  2. Rewrite every plan assertion with core vitest/DOM equivalents (`expect(el).toBeTruthy()`, `el.disabled`, `document.activeElement`, `getAttribute`).
- **RESOLVED:** user chose option 1; jest-dom added in the T23 commit.
- T1–T22 are done and committed. The T23 page code was dropped uncommitted; it is exactly the plan's code.

### T24 — S6 sign-up success lands on `/` instead of `/signup/check-email` (D-2 ordering doesn't hold)
- **Problem:** the plan's submit handler does `await navigate('/signup/check-email', …)` then `authStore.setSession(session)`. The router does reach `/signup/check-email` (idle, still guest), but React has not yet swapped out the old tree: the `/signup` page under `RequireGuest` is still mounted when `setSession` fires, so its `<Navigate to="/">` runs and the final location is `/`. The test `success → S7 with the email, signed in` fails (`expected '/' to be '/signup/check-email'`); the other two T24 tests pass.
- **Attempts (2, both failed):** (1) `navigate(…, { flushSync: true })`; (2) an extra `await new Promise(r => setTimeout(r, 0))` before `setSession`. A signed-in user opening `/signup/check-email` directly is fine (checked), so S7 itself is not the cause.
- **Options:**
  1. Carry the session to S7 and let S7 call `authStore.setSession` on mount (session held in router `state`, in memory only). Changes T24/T25 and where D-2 says the session is set.
  2. Make `RequireGuest` ignore signed-in users when a flag is set (e.g. `authStore` "justRegistered" or `location.state`) so `/signup` never redirects during this hand-off. Touches T13's guard.
  3. Poll until the S7 heading is in the DOM before `setSession` (works but is a test-shaped hack in production code).
- **Recommendation:** option 1, as it keeps the guard rule (D-2) unchanged and removes the timing dependence.
- **RESOLVED:** user chose option 1. S6 navigates with `state: { email, session }`; S7 (`CheckEmailPage`) calls `authStore.setSession` on mount, then replaces the history state with `{ email }`. The T24 success test waits for `me` with `waitFor`.
- Work so far: T1–T23 committed. The T24 page and test, as written in the plan, are saved outside the repo and were not committed.

### T27 — the plan's test cannot match the plan's markup (RESOLVED: option 1, matcher changed)
- **Problem:** the plan's sent state renders `<p>If an account exists for <span>{sentTo}</span>, you'll get a reset link…</p>`, and its test does `findByText(/If an account exists for olivia@fixit.test/)`. Testing Library's `getByText` matches only an element's own text nodes, and the email sits in the inner `<span>`, so the `<p>` reads "If an account exists for , you'll get…". Both test cases fail (2 of 2). I checked that the sent state does render (the "Check your email" heading is found). The page code is written per plan and is uncommitted in the working tree.
- **Why I stopped:** fixing it means changing either the plan's markup (drop the `<span>`, losing the semibold email) or the plan's test matcher. Both depart from the plan text, and the rules forbid changing tests.
- **Options:**
  1. Keep the markup; change the test to match on the `<p>`'s full text, e.g. `findByText((_, el) => el?.tagName === 'P' && /If an account exists for olivia@fixit.test/.test(el.textContent ?? ''))`. Same assertion, different matcher. (Recommended.)
  2. Keep the test; remove the `<span>` so the email is plain text in the `<p>`.
  3. Keep the test; wrap the email so the text stays in one node, e.g. `<strong>` can't (still a separate element), so this means option 2.

## Notes for review (planner)
- **Milestone vs ARCHITECTURE (D-1):** `POST /auth/register` returns 204 but `resend-confirmation` needs a session; S7 resend after sign-up needs one. The plan logs the user in after registering. The alternative is to make `register` return an `AuthSession` (an ARCH §3.1 change needing a decision record).
- **AC4 wording:** "DevPanel forced `ACCOUNT_SUSPENDED`" isn't a DevPanel option (only 500/409/401/network). The plan uses a suspended fixture (Ruwan) instead.
- **AC6 Google-only fixture** didn't exist; Sanduni is added and doubles as the mock Google user (D-5).
- **Milestone note `.env.development`:** that file doesn't exist; mock mode reads `.env.mock` (D-10).
- **S5.E2** is deferred to M07 (D-6).

## Nice-to-haves (not tasks)
- A DevPanel "Expire session" button (clear the access token and the refresh entry) instead of arming two forced 401s for AC8.
- A "Suspended (Ruwan)" DevPanel persona.
- Clearing the React Query cache on `signOut('expired')` (ARCH §4.1 mentions it; M03 left it out).
