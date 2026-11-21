# PLAN-M02 — Data layer & mock backend
Milestone: `docs/milestones/M02-data-layer-mocks.md` · Start tag: `m02-start` · Verify-all: `pnpm verify`
Mock domains at start → end: none (no data layer) → **all** (`pnpm dev:mock`); only `auth` has handlers yet.

Conventions for the executor:
- Work on branch `m02-data-layer-mocks` (created in T1). One commit per task, message as given, ending with the attribution lines from your session instructions.
- After writing files in any task run `pnpm format` **before** `pnpm verify` (code below is not guaranteed Prettier-exact).
- `pnpm verify` in this milestone = `format:check && lint && typecheck && test && build` (no DB until M14).
- Code blocks are complete files unless the step says "add" / "replace". Import style: tests import `describe/expect/it` from `vitest` explicitly (as in `packages/contracts/src/common/dates.test.ts`).
- If a library API differs from what the code assumes (e.g. MSW or shadcn output), **STOP** and write a blocker; do not switch majors or redesign.

Planner's decisions the executor must follow (they resolve gaps between milestone and ARCHITECTURE; see "Notes for review" at the end):
- **D-a** `http()` retries after refresh only when the call carried an access token and the path is not `/auth/login`, `/auth/admin/login`, `/auth/refresh`, `/auth/logout` (the §4.1 snippet's `!path.startsWith('/auth/')` would make acceptance criterion 3 — a 401 on `/auth/me` — impossible).
- **D-b** The DevPanel "Admin" persona uses `POST /auth/login` (ARCH §6.1 allows admins there); `/auth/admin/login` arrives in M04.
- **D-c** Fixture request FX-2046 (Completed, in review window, no review) belongs to **Olivia Martinez** (prototype: Daniel Kim) so the M21 customer journey, which logs in as Olivia, can review it. Daniel Kim stays as a named customer with no requests.
- **D-d** Status events are embedded in `RequestRecord.events` (no separate `events` table in the mock db); the mock refresh "cookie" is the localStorage key `fixit.mock.refresh`, not a db table.
- **D-e** Filler request refs are `FX-0001`…`FX-1248` (below the prototype range FX-2037…FX-2061 and the sequence start 2062).
- **D-f** `http()` builds absolute URLs from `window.location.origin` (needed by Node `fetch` in Vitest; identical behaviour in the browser).

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `packages/contracts/src/auth/schemas.ts` (+ `.test.ts`) | Create | `LoginBody`, `Me`, `AuthSession`, `AccessTokenClaims` |
| `packages/contracts/src/auth/roles.ts` (+ `.test.ts`) | Create | `deriveRoles()` |
| `packages/contracts/src/auth/names.ts` (+ `.test.ts`) | Create | `displayNameOf()` ("Olivia M.") |
| `packages/contracts/src/reviews/rules.ts` (+ `.test.ts`) | Create | `ratingFrom()` (BR-27) |
| `packages/contracts/src/providers/pricing.ts` (+ `.test.ts`) | Create | `computeStartingPrice()` (BR-10) |
| `packages/contracts/src/requests/schemas.ts` | Create | `ServiceSnapshot` |
| `packages/contracts/src/requests/record.ts` (+ `.test.ts`) | Create | `RequestRecord`, `StatusEventRecord`, `toMachineRequest()` |
| `packages/contracts/src/endpoints.ts` (+ `.test.ts`) | Modify | 4 auth entries |
| `packages/contracts/src/index.ts` | Modify | exports |
| `packages/fixtures/*` (package.json, tsconfig.json, tsup.config.ts) | Create | `@fixit/fixtures` package |
| `packages/fixtures/src/types.ts` | Create | plain fixture entity types + `World` |
| `packages/fixtures/src/prng.ts` | Create | `mulberry32`, `shuffle` |
| `packages/fixtures/src/catalog.ts` | Create | 8 categories, 3 districts, 18 towns, location map |
| `packages/fixtures/src/prototype-reviews.ts` | Create | prototype ratings + 30 written reviews (copied) |
| `packages/fixtures/src/users.ts` | Create | users, personas, `DEMO_PASSWORD` |
| `packages/fixtures/src/providers.ts` | Create | p01–p10, Kasun draft p11, services (LKR), areas, p02 submission |
| `packages/fixtures/src/requests.ts` | Create | `makeRequest()`, the 8 prototype requests |
| `packages/fixtures/src/reviews.ts` | Create | written + filler reviews with their completed requests |
| `packages/fixtures/src/build.ts`, `index.ts` | Create | `buildWorld(now)` with computed aggregates |
| `packages/fixtures/src/build.test.ts` | Create | invariants (AC6) |
| `apps/web/package.json`, `vite.config.ts`, `vitest.config.ts`, `public/mockServiceWorker.js`, `.env.mock`, `src/vite-env.d.ts` | Modify/Create | deps, MSW worker, proxy, fail-fast, worker stripped from build |
| `package.json` (root) | Modify | `dev:mock` → `VITE_MOCK_DOMAINS=all` |
| `apps/web/src/mocks/domains.ts` (+ `.test.ts`) | Create | `MOCK_DOMAINS`, `parseMockDomains()` |
| `apps/web/src/mocks/db/schema.ts`, `seed.ts`, `store.ts` (+ `store.test.ts`) | Create | `MockDb`, seed from fixtures, persistence |
| `apps/web/src/mocks/db/expire.ts` (+ `.test.ts`) | Create | `expireDue(db, now)` |
| `apps/web/src/mocks/lib/errors.ts` | Create | `MockHttpError`, `mockError`, `errorResponse`, `toErrorResponse` |
| `apps/web/src/mocks/lib/controls.ts` (+ `.test.ts`) | Create | latency + forced errors |
| `apps/web/src/mocks/lib/tokens.ts`, `identity.ts` | Create | mock JWTs, refresh "cookie", `resolveActor` |
| `apps/web/src/mocks/lib/endpoint.ts` (+ `.test.ts`) | Create | `mockEndpoint`, `assertAccess` |
| `apps/web/src/mocks/lib/me.ts` | Create | `buildMe()` |
| `apps/web/src/mocks/handlers/auth.ts` (+ `.test.ts`), `index.ts` | Create | auth handlers, `handlersByDomain` |
| `apps/web/src/mocks/node.ts`, `enable.ts` | Create | MSW node server, `enableMocks()` |
| `apps/web/src/test/setup.ts`, `fixed-now.ts`, `render.tsx`, `sign-in.ts` | Create | web test harness (§9.4) |
| `apps/web/src/lib/auth-store.ts` (+ `.test.ts`) | Create | auth store |
| `apps/web/src/lib/http.ts` (+ `.test.ts`) | Create | `http()`, `ApiError`, `refreshOnce`, `pathOf` |
| `apps/web/src/lib/query-keys.ts` | Create | `qk.me` |
| `apps/web/src/app/query-client.ts` (+ `.test.ts`), `providers.tsx` | Create | QueryClient defaults, provider |
| `apps/web/src/lib/bootstrap-auth.ts` (+ `.test.ts`) | Create | boot refresh |
| `apps/web/src/features/auth/api.ts` (+ `.test.ts`), `hooks.ts` (+ `.test.tsx`) | Create | login/logout/me calls, `useMe` |
| `apps/web/src/components/ui/sheet.tsx`, `button.tsx` | Create (shadcn) | primitives |
| `apps/web/src/mocks/dev/DevPanel.tsx` | Create | dev panel |
| `apps/web/src/main.tsx`, `src/app/placeholder-page.tsx` | Modify | boot order, session line |

## Tasks

### T1 — Auth contract schemas
- [x] done
**Files:** `packages/contracts/src/auth/schemas.ts`, `packages/contracts/src/auth/schemas.test.ts`, `packages/contracts/src/index.ts`
**Context:** ARCH §2.5 auth excerpt; SPEC S5 field table (`Enter your email address.`, `Enter your password.`); existing `Email`, `Id`, `Mobile` in `common/primitives.ts`, enums in `common/enums.ts`.
**Do:**
1. `git switch -c m02-data-layer-mocks && git tag m02-start`.
2. `packages/contracts/src/auth/schemas.ts`:
```ts
import { z } from 'zod';
import { AuthMethod, ReverificationReason, Role, VerificationStatus } from '../common/enums';
import { Email, Id, Mobile } from '../common/primitives';

export const LoginBody = z.object({
  email: Email,
  password: z.string().min(1, 'Enter your password.'),
});
export type LoginBody = z.infer<typeof LoginBody>;

export const Me = z.object({
  id: Id,
  fullName: z.string(),
  displayName: z.string(),
  email: z.string(),
  emailConfirmed: z.boolean(),
  mobile: Mobile.nullable(),
  authMethods: z.array(AuthMethod),
  roles: z.array(Role), // ['admin'] | ['customer'] | ['customer','provider']
  openRequestCount: z.number().int(), // BR-33 UX hint
  provider: z
    .object({
      id: Id,
      businessName: z.string().nullable(), // null while draft step 1 incomplete
      onboarding: z.object({ complete: z.boolean(), step: z.number().int().min(1).max(5) }),
      verificationStatus: VerificationStatus,
      reverificationReason: ReverificationReason.nullable(),
      rejectionReason: z.string().nullable(),
      paused: z.boolean(),
      pendingRequestCount: z.number().int(),
    })
    .nullable(), // null = never started onboarding
});
export type Me = z.infer<typeof Me>;

export const AuthSession = z.object({ accessToken: z.string(), expiresIn: z.number().int(), user: Me });
export type AuthSession = z.infer<typeof AuthSession>;

export const AccessTokenClaims = z.object({ sub: Id, roles: z.array(Role), iat: z.number(), exp: z.number() });
export type AccessTokenClaims = z.infer<typeof AccessTokenClaims>;
```
3. Add to `packages/contracts/src/index.ts`: `export * from './auth/schemas';`
**Test:** `packages/contracts/src/auth/schemas.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { LoginBody } from './schemas';

const messages = (input: unknown) => {
  const r = LoginBody.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('LoginBody', () => {
  it('trims and lowercases the email', () => {
    expect(LoginBody.parse({ email: '  Olivia@Fixit.TEST ', password: 'x' }).email).toBe('olivia@fixit.test');
  });
  it('uses the SPEC S5 messages for empty fields', () => {
    expect(messages({ email: '', password: '' })).toEqual([
      'email: Enter your email address.',
      'password: Enter your password.',
    ]);
  });
  it('rejects a malformed email with the SPEC message', () => {
    expect(messages({ email: 'olivia', password: 'x' })).toEqual([
      'email: Enter a valid email address, like name@example.com.',
    ]);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` → all pass; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): auth schemas LoginBody, Me, AuthSession, AccessTokenClaims (M02-T1)"`

### T2 — `deriveRoles()`
- [x] done
**Files:** `packages/contracts/src/auth/roles.ts`, `roles.test.ts`, `index.ts`
**Context:** ARCH §2.9, §6.2 "Roles", D11; PRODUCT BR-35.
**Do:**
```ts
// packages/contracts/src/auth/roles.ts
import type { Role } from '../common/enums';

/** D11: roles are derived, never stored. Admin is exclusive; every other account is a customer, plus provider once published. */
export function deriveRoles(input: { isAdmin: boolean; providerPublished: boolean }): Role[] {
  if (input.isAdmin) return ['admin'];
  return input.providerPublished ? ['customer', 'provider'] : ['customer'];
}
```
Add `export * from './auth/roles';` to `index.ts`.
**Test:** `roles.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { deriveRoles } from './roles';

describe('deriveRoles', () => {
  it.each([
    [{ isAdmin: true, providerPublished: false }, ['admin']],
    [{ isAdmin: true, providerPublished: true }, ['admin']],
    [{ isAdmin: false, providerPublished: false }, ['customer']],
    [{ isAdmin: false, providerPublished: true }, ['customer', 'provider']],
  ])('%j → %j', (input, roles) => {
    expect(deriveRoles(input)).toEqual(roles);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test`; `pnpm verify`.
**Commit:** `git commit -m "feat(contracts): deriveRoles (M02-T2)"`

### T3 — `displayNameOf()`
- [x] done
**Files:** `packages/contracts/src/auth/names.ts`, `names.test.ts`, `index.ts`
**Context:** SPEC data model "User … displayName (derived: first name + last initial)"; PublicReview `authorDisplayName: "Sarah K."`.
**Do:**
```ts
// packages/contracts/src/auth/names.ts
/** "Olivia Martinez" → "Olivia M."; a single name stays as is. */
export function displayNameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}
```
Add `export * from './auth/names';`.
**Test:**
```ts
import { describe, expect, it } from 'vitest';
import { displayNameOf } from './names';

describe('displayNameOf', () => {
  it.each([
    ['Olivia Martinez', 'Olivia M.'],
    ['  Kasun  ', 'Kasun'],
    ['Dana de Silva', 'Dana S.'],
    ['Sarah Karunaratne', 'Sarah K.'],
  ])('%s → %s', (input, out) => {
    expect(displayNameOf(input)).toBe(out);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test`; `pnpm verify`.
**Commit:** `git commit -m "feat(contracts): displayNameOf (M02-T3)"`

### T4 — `ratingFrom()`
- [x] done
**Files:** `packages/contracts/src/reviews/rules.ts`, `rules.test.ts`, `index.ts`
**Context:** PRODUCT BR-27; ARCH §2.9, §7.7 (1 dp).
**Do:**
```ts
// packages/contracts/src/reviews/rules.ts
/** BR-27: average of visible ratings rounded to 1 dp; no ratings → null ("New"). */
export function ratingFrom(visibleRatings: readonly number[]): { rating: number | null; count: number } {
  const count = visibleRatings.length;
  if (count === 0) return { rating: null, count: 0 };
  const sum = visibleRatings.reduce((a, b) => a + b, 0);
  return { rating: Math.round((sum / count) * 10) / 10, count };
}
```
Add `export * from './reviews/rules';`.
**Test:**
```ts
import { describe, expect, it } from 'vitest';
import { ratingFrom } from './rules';

describe('ratingFrom', () => {
  it('no ratings → New', () => {
    expect(ratingFrom([])).toEqual({ rating: null, count: 0 });
  });
  it.each([
    [[5, 4, 4], 4.3],
    [[5, 5, 4], 4.7],
    [[5, 4, 4, 4], 4.3], // 4.25 rounds up
    [[3], 3],
  ])('%j → %d', (ratings, rating) => {
    expect(ratingFrom(ratings)).toEqual({ rating, count: ratings.length });
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test`; `pnpm verify`.
**Commit:** `git commit -m "feat(contracts): ratingFrom (M02-T4)"`

### T5 — `computeStartingPrice()`
- [x] done
**Files:** `packages/contracts/src/providers/pricing.ts`, `pricing.test.ts`, `index.ts`
**Context:** PRODUCT BR-10; ARCH §2.9 (ties → per_hour < per_visit < fixed). `priceLabel()` is **not** in this milestone.
**Do:**
```ts
// packages/contracts/src/providers/pricing.ts
import type { PriceUnit } from '../common/enums';

const UNIT_ORDER: Record<PriceUnit, number> = { per_hour: 0, per_visit: 1, fixed: 2 };

/** BR-10: lowest service price with that service's unit; ties → per_hour < per_visit < fixed. No services → null. */
export function computeStartingPrice(
  services: readonly { price: number; unit: PriceUnit }[],
): { amount: number; unit: PriceUnit } | null {
  let best: { amount: number; unit: PriceUnit } | null = null;
  for (const s of services) {
    if (
      best === null ||
      s.price < best.amount ||
      (s.price === best.amount && UNIT_ORDER[s.unit] < UNIT_ORDER[best.unit])
    ) {
      best = { amount: s.price, unit: s.unit };
    }
  }
  return best;
}
```
Add `export * from './providers/pricing';`.
**Test:**
```ts
import { describe, expect, it } from 'vitest';
import { computeStartingPrice } from './pricing';

describe('computeStartingPrice', () => {
  it('no services → null', () => {
    expect(computeStartingPrice([])).toBeNull();
  });
  it('picks the lowest price with its unit', () => {
    expect(
      computeStartingPrice([
        { price: 13500, unit: 'fixed' },
        { price: 2500, unit: 'per_hour' },
        { price: 4500, unit: 'per_visit' },
      ]),
    ).toEqual({ amount: 2500, unit: 'per_hour' });
  });
  it('breaks ties per_hour < per_visit < fixed', () => {
    expect(
      computeStartingPrice([
        { price: 1500, unit: 'fixed' },
        { price: 1500, unit: 'per_visit' },
      ]),
    ).toEqual({ amount: 1500, unit: 'per_visit' });
    expect(
      computeStartingPrice([
        { price: 1500, unit: 'per_visit' },
        { price: 1500, unit: 'per_hour' },
      ]),
    ).toEqual({ amount: 1500, unit: 'per_hour' });
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test`; `pnpm verify`.
**Commit:** `git commit -m "feat(contracts): computeStartingPrice (M02-T5)"`

### T6 — `RequestRecord` shape
- [x] done
**Files:** `packages/contracts/src/requests/schemas.ts`, `packages/contracts/src/requests/record.ts`, `record.test.ts`, `index.ts`
**Context:** ARCH §2.5 `ServiceSnapshot`, §2.9 (projections take a plain `RequestRecord`), §8.1 `ServiceRequest` + `RequestStatusEvent`; D-d (events embedded). Existing `MachineRequest` in `requests/state-machine.ts`.
**Do:**
1. `packages/contracts/src/requests/schemas.ts` (the rest of this file arrives in M08):
```ts
import { z } from 'zod';
import { PriceUnit } from '../common/enums';
import { Lkr } from '../common/primitives';

export const ServiceSnapshot = z.object({ name: z.string(), price: Lkr, unit: PriceUnit });
export type ServiceSnapshot = z.infer<typeof ServiceSnapshot>;
```
2. `packages/contracts/src/requests/record.ts`:
```ts
import { z } from 'zod';
import { RequestActor, RequestStatus, TimeSlot } from '../common/enums';
import { Id, IsoDate, IsoDateTime, Lkr, Mobile, RequestRef } from '../common/primitives';
import { ServiceSnapshot } from './schemas';
import type { MachineRequest } from './state-machine';

export const StatusEventRecord = z.object({
  status: RequestStatus,
  at: IsoDateTime,
  actor: RequestActor,
  actorUserId: Id.nullable(),
  reason: z.string().nullable(),
});
export type StatusEventRecord = z.infer<typeof StatusEventRecord>;

/** Storage-neutral request row: what the mock db stores and what API mappers build from Prisma rows. Projections (M08) take this. */
export const RequestRecord = z.object({
  id: Id,
  ref: RequestRef,
  customerId: Id,
  providerId: Id,
  providerUserId: Id,
  serviceId: Id.nullable(),
  service: ServiceSnapshot,
  preferredDate: IsoDate,
  slot: TimeSlot,
  townId: Id,
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  description: z.string(),
  customerMobile: Mobile,
  agreedPrice: Lkr.nullable(),
  status: RequestStatus,
  reason: z.string().nullable(),
  closedBy: RequestActor.nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
  expiresAt: IsoDateTime,
  completedAt: IsoDateTime.nullable(),
  events: z.array(StatusEventRecord), // oldest first
});
export type RequestRecord = z.infer<typeof RequestRecord>;

export function toMachineRequest(r: RequestRecord): MachineRequest {
  return {
    status: r.status,
    customerId: r.customerId,
    providerUserId: r.providerUserId,
    preferredDate: r.preferredDate,
    expiresAt: new Date(r.expiresAt),
  };
}
```
3. `index.ts`: add `export * from './requests/schemas';` and `export * from './requests/record';`.
**Test:** `record.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { RequestRecord, toMachineRequest } from './record';

const sample = {
  id: 'r-FX-2061', ref: 'FX-2061', customerId: 'u-olivia', providerId: 'p01', providerUserId: 'u-marcus',
  serviceId: 'p01-s1', service: { name: 'Leak repair', price: 2500, unit: 'per_hour' },
  preferredDate: '2026-11-25', slot: 'morning', townId: 'colombo', addressLine1: '24 Galle Road', addressLine2: null,
  description: 'Water dripping under the kitchen sink cabinet.', customerMobile: '+94770001001', agreedPrice: null,
  status: 'pending', reason: null, closedBy: null,
  createdAt: '2026-11-22T02:30:00.000Z', updatedAt: '2026-11-22T02:30:00.000Z', expiresAt: '2026-11-24T18:30:00.000Z',
  completedAt: null,
  events: [{ status: 'pending', at: '2026-11-22T02:30:00.000Z', actor: 'customer', actorUserId: 'u-olivia', reason: null }],
};

describe('RequestRecord', () => {
  it('parses a pending record', () => {
    expect(RequestRecord.parse(sample).ref).toBe('FX-2061');
  });
  it('toMachineRequest turns expiresAt into a Date', () => {
    const m = toMachineRequest(RequestRecord.parse(sample));
    expect(m).toEqual({
      status: 'pending', customerId: 'u-olivia', providerUserId: 'u-marcus', preferredDate: '2026-11-25',
      expiresAt: new Date('2026-11-24T18:30:00.000Z'),
    });
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test`; `pnpm verify`.
**Commit:** `git commit -m "feat(contracts): RequestRecord and toMachineRequest (M02-T6)"`

### T7 — Auth `ENDPOINTS` entries
- [x] done
**Files:** `packages/contracts/src/endpoints.ts`, `packages/contracts/src/endpoints.test.ts`
**Context:** ARCH §3.1 rows login/refresh/logout/me; §2.7. Ids follow the `<domain>_<action>` pattern of §2.7 (`requests_accept`).
**Do:** in `endpoints.ts` add `import { AuthSession, LoginBody, Me } from './auth/schemas';` at the top and replace the `ENDPOINTS` line with:
```ts
/** One entry per row of ARCHITECTURE §3. Entries are added by the milestone that first needs them. */
export const ENDPOINTS = {
  auth_login: {
    id: 'auth_login', domain: 'auth', method: 'POST', path: '/auth/login', access: ['public'], owner: 'none',
    body: LoginBody, response: AuthSession, rateLimited: true, refs: ['F-01', 'S5', 'A3'],
  },
  auth_refresh: {
    id: 'auth_refresh', domain: 'auth', method: 'POST', path: '/auth/refresh', access: ['public'], owner: 'none',
    response: AuthSession, rateLimited: true, refs: ['§6.6'],
  },
  auth_logout: {
    id: 'auth_logout', domain: 'auth', method: 'POST', path: '/auth/logout', access: ['public'], owner: 'none',
    refs: ['A4'],
  },
  auth_me: {
    id: 'auth_me', domain: 'auth', method: 'GET', path: '/auth/me', access: ['user', 'admin'], owner: 'self',
    response: Me, refs: ['nav', '§6.8'],
  },
} as const satisfies Record<string, EndpointDef>;
```
**Test:** `endpoints.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { ENDPOINTS } from './endpoints';

describe('ENDPOINTS', () => {
  const defs = Object.entries(ENDPOINTS);
  it('every key equals its id', () => {
    for (const [key, def] of defs) expect(def.id).toBe(key);
  });
  it('method + path pairs are unique', () => {
    const pairs = defs.map(([, d]) => `${d.method} ${d.path}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });
  it('auth rows match ARCHITECTURE §3.1', () => {
    expect(ENDPOINTS.auth_login.access).toEqual(['public']);
    expect(ENDPOINTS.auth_refresh.access).toEqual(['public']);
    expect(ENDPOINTS.auth_logout.access).toEqual(['public']);
    expect(ENDPOINTS.auth_me.access).toEqual(['user', 'admin']);
    expect('response' in ENDPOINTS.auth_logout).toBe(false); // 204
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test`; `pnpm verify`.
**Commit:** `git commit -m "feat(contracts): auth endpoint registry entries (M02-T7)"`

### T8 — `@fixit/fixtures` package skeleton and types
- [x] done
**Files:** `packages/fixtures/package.json`, `tsconfig.json`, `tsup.config.ts`, `src/types.ts`, `src/prng.ts`, `src/index.ts`
**Context:** ARCH §1 (`fixtures/src/ catalog.ts users.ts providers.ts requests.ts reviews.ts build.ts index.ts`), §8.1 field names, D1, D19. Copy the contracts package layout.
**Do:**
1. `packages/fixtures/package.json`:
```json
{
  "name": "@fixit/fixtures",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run --passWithNoTests",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "dependencies": { "@fixit/contracts": "workspace:*" },
  "devDependencies": { "tsup": "^8.5.1", "typescript": "~5.9.3", "vitest": "^3.2.7" }
}
```
2. `tsconfig.json`: `{ "extends": "../../tsconfig.base.json", "compilerOptions": { "customConditions": ["source"] }, "include": ["src", "tsup.config.ts"] }`
3. `tsup.config.ts`: identical to `packages/contracts/tsup.config.ts`.
4. `src/types.ts`:
```ts
import type {
  AccountStatus, AuthMethod, CategoryIcon, DocumentType, PriceUnit, RequestRecord, ReverificationReason,
  ReviewVisibility, SubmissionStatus, SubmissionTrigger, VerificationStatus,
} from '@fixit/contracts';

// Plain, JSON-safe rows (dates are ISO strings). Field names follow ARCHITECTURE §8.1.
export interface FxCategory { id: string; name: string; blurb: string; icon: CategoryIcon; order: number; active: boolean }
export interface FxDistrict { id: string; name: string; order: number }
export interface FxTown { id: string; name: string; districtId: string; order: number; active: boolean }
export interface FxUser {
  id: string; email: string; fullName: string; isAdmin: boolean; status: AccountStatus;
  emailConfirmedAt: string | null; mobile: string | null; authMethods: AuthMethod[]; createdAt: string;
}
export interface FxProvider {
  id: string; userId: string; businessName: string | null; bio: string | null; yearsExperience: number | null;
  categoryId: string | null; baseTownId: string | null; photoKey: string | null;
  onboardingStep: number; onboardingComplete: boolean; publishedAt: string | null;
  verificationStatus: VerificationStatus; verifiedAt: string | null; reverificationReason: ReverificationReason | null;
  paused: boolean; ratingAvg: number | null; reviewCount: number; startingPrice: number | null;
  startingUnit: PriceUnit | null; createdAt: string;
}
export interface FxService { id: string; providerId: string; name: string; price: number; unit: PriceUnit }
export interface FxArea { providerId: string; townId: string; isBase: boolean }
export interface FxReview {
  id: string; requestId: string; providerId: string; authorId: string; rating: number; text: string;
  visibility: ReviewVisibility; createdAt: string;
  replyText: string | null; replyCreatedAt: string | null; replyUpdatedAt: string | null;
}
export interface FxSubmission {
  id: string; providerId: string; attempt: number; trigger: SubmissionTrigger; status: SubmissionStatus;
  submittedAt: string; decidedAt: string | null; rejectionReason: string | null;
}
export interface FxDocument {
  id: string; providerId: string; submissionId: string | null; type: DocumentType;
  fileName: string; mimeType: string; sizeBytes: number; createdAt: string;
}
export interface World {
  categories: FxCategory[]; districts: FxDistrict[]; towns: FxTown[]; users: FxUser[];
  providers: FxProvider[]; services: FxService[]; areas: FxArea[]; requests: RequestRecord[];
  reviews: FxReview[]; submissions: FxSubmission[]; documents: FxDocument[];
}
```
5. `src/prng.ts`:
```ts
/** Deterministic PRNG so fixtures are identical on every run. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}
```
6. `src/index.ts`: `export * from './types';` (more exports in T14).
7. `pnpm install` (links the workspace package).
**Verify:** `pnpm --filter @fixit/fixtures typecheck && pnpm --filter @fixit/fixtures build` succeed; `pnpm verify` green.
**Commit:** `git commit -m "chore(fixtures): @fixit/fixtures package and entity types (M02-T8)"`

### T9 — Fixture catalog
- [x] done
**Files:** `packages/fixtures/src/catalog.ts`
**Context:** PRODUCT §2 (categories, 3 districts, 18 towns); ARCH §8.3 (ids kept, kebab town ids, location map); SPEC §2.10 / `CategoryIcon` enum order; prototype `data.json` blurbs (copied — never import `reference/`).
**Do:**
```ts
import type { FxCategory, FxDistrict, FxTown } from './types';

export const CATEGORIES: readonly FxCategory[] = [
  { id: 'plumbing', name: 'Plumbing', blurb: 'Leaks, drains, water heaters', icon: 'wrench', order: 1, active: true },
  { id: 'electrical', name: 'Electrical', blurb: 'Wiring, lighting, panels', icon: 'zap', order: 2, active: true },
  { id: 'cleaning', name: 'Cleaning', blurb: 'Regular, deep & move-out cleans', icon: 'spray-can', order: 3, active: true },
  { id: 'gardening', name: 'Gardening', blurb: 'Lawns, hedges, planting', icon: 'sprout', order: 4, active: true },
  { id: 'painting', name: 'Painting & Decorating', blurb: 'Interior, exterior, wallpaper', icon: 'paint-roller', order: 5, active: true },
  { id: 'carpentry', name: 'Carpentry', blurb: 'Custom builds, doors, decks', icon: 'hammer', order: 6, active: true },
  { id: 'handyman', name: 'Handyman', blurb: 'Small jobs, mounting, repairs', icon: 'drill', order: 7, active: true },
  { id: 'appliance', name: 'Appliance Repair', blurb: 'Washers, fridges, ovens', icon: 'washing-machine', order: 8, active: true },
];

export const DISTRICTS: readonly FxDistrict[] = [
  { id: 'colombo', name: 'Colombo', order: 1 },
  { id: 'gampaha', name: 'Gampaha', order: 2 },
  { id: 'kalutara', name: 'Kalutara', order: 3 },
];

const TOWN_NAMES: Record<string, readonly string[]> = {
  colombo: ['Colombo', 'Dehiwala-Mount Lavinia', 'Sri Jayawardenepura Kotte', 'Moratuwa', 'Maharagama', 'Kaduwela', 'Homagama', 'Kesbewa'],
  gampaha: ['Negombo', 'Gampaha', 'Ja-Ela', 'Wattala', 'Kelaniya', 'Kadawatha'],
  kalutara: ['Panadura', 'Kalutara', 'Horana', 'Beruwala'],
};

/** "Sri Jayawardenepura Kotte" → "sri-jayawardenepura-kotte" */
export const toTownId = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const TOWNS: readonly FxTown[] = DISTRICTS.flatMap((d) =>
  (TOWN_NAMES[d.id] ?? []).map((name, i) => ({ id: toTownId(name), name, districtId: d.id, order: i + 1, active: true })),
);

/** ARCH §8.3 localisation table: prototype location → base town id. */
export const PROTOTYPE_LOCATION_TO_TOWN = {
  austin: 'colombo',
  'round-rock': 'dehiwala-mount-lavinia',
  'cedar-park': 'sri-jayawardenepura-kotte',
  pflugerville: 'maharagama',
} as const;
```
Add `export * from './catalog';` to `src/index.ts`.
**Verify:** `pnpm --filter @fixit/fixtures typecheck`; `pnpm verify`.
**Commit:** `git commit -m "feat(fixtures): catalog categories, districts, towns (M02-T9)"`

### T10 — Prototype reviews data and users
- [x] done
**Files:** `packages/fixtures/src/prototype-reviews.ts`, `packages/fixtures/src/users.ts`, `src/index.ts`
**Context:** ARCH §8.3 Users table, §4.5 persona labels; prototype `data.json` ratings / review counts / written reviews (copied below). Written-review authors become users whose `displayNameOf(fullName)` equals the prototype author (e.g. "Sarah K." → "Sarah Karunaratne").
**Do:**
1. `src/prototype-reviews.ts`:
```ts
/** Copied from the prototype (data.json). Newest first. */
export const PROTOTYPE_RATINGS = {
  p01: { rating: 4.9, reviewCount: 212 },
  p02: { rating: 4.3, reviewCount: 64 },
  p03: { rating: 4.8, reviewCount: 138 },
  p04: { rating: 4.7, reviewCount: 301 },
  p05: { rating: 4.5, reviewCount: 89 },
  p06: { rating: 4.6, reviewCount: 117 },
  p07: { rating: 4.9, reviewCount: 76 },
  p08: { rating: 3.8, reviewCount: 41 },
  p09: { rating: 4.4, reviewCount: 158 },
  p10: { rating: 4.1, reviewCount: 52 },
} as const;
export type PrototypeProviderId = keyof typeof PROTOTYPE_RATINGS;
export const PROTOTYPE_PROVIDER_IDS = Object.keys(PROTOTYPE_RATINGS) as PrototypeProviderId[];

export interface WrittenReview { author: string; rating: number; text: string }
export const WRITTEN_REVIEWS: Record<PrototypeProviderId, readonly WrittenReview[]> = {
  p01: [
    { author: 'Sarah K.', rating: 5, text: 'Arrived within two hours and fixed our burst pipe. Super professional.' },
    { author: 'David L.', rating: 5, text: 'Clear quote before starting, no surprises on the bill.' },
    { author: 'Monica R.', rating: 4, text: 'Great work on the water heater. Slightly late but called ahead.' },
  ],
  p02: [
    { author: 'Chris P.', rating: 5, text: 'Fixed a running toilet in 20 minutes. Fair price.' },
    { author: 'Hannah W.', rating: 4, text: 'Good job on our new faucet, would book again.' },
    { author: 'Leo M.', rating: 4, text: 'Had to come back for a second visit but sorted it.' },
  ],
  p03: [
    { author: 'Jason T.', rating: 5, text: 'Installed our EV charger quickly and explained everything.' },
    { author: 'Amy G.', rating: 5, text: 'Very knowledgeable, spotted an issue the last guy missed.' },
    { author: 'Robert F.', rating: 4, text: 'Pricey but worth it for peace of mind.' },
  ],
  p04: [
    { author: 'Emily S.', rating: 5, text: 'House has never looked better. Lovely team.' },
    { author: 'Marco D.', rating: 5, text: 'Reliable every two weeks for six months now.' },
    { author: 'Tina B.', rating: 4, text: 'Thorough clean, missed one window but fixed it next visit.' },
  ],
  p05: [
    { author: 'Nina J.', rating: 5, text: 'Transformed our backyard with native plants.' },
    { author: 'Paul H.', rating: 4, text: 'Dependable weekly mowing, good communication.' },
    { author: 'Grace O.', rating: 4, text: 'Nice work, booking took a few days.' },
  ],
  p06: [
    { author: 'Laura V.', rating: 5, text: 'Crisp edges and they cleaned up perfectly.' },
    { author: 'Sam E.', rating: 4, text: 'Kitchen cabinets look brand new.' },
    { author: 'Ivy C.', rating: 5, text: 'Finished a day early. Highly recommend.' },
  ],
  p07: [
    { author: 'Owen R.', rating: 5, text: 'Built-in bookshelves are stunning. True craftsmanship.' },
    { author: 'Rachel N.', rating: 5, text: 'Fixed three sticking doors in one visit.' },
    { author: 'Ben A.', rating: 5, text: 'Our new deck is solid and beautiful.' },
  ],
  p08: [
    { author: 'Kate Y.', rating: 4, text: 'Mounted our TV neatly, good value.' },
    { author: 'Mike Z.', rating: 3, text: 'Job done but arrived an hour late.' },
    { author: 'Sofia L.', rating: 4, text: 'Assembled a whole bedroom set quickly.' },
  ],
  p09: [
    { author: 'Alan W.', rating: 5, text: 'Fridge fixed on the first visit, part was in the van.' },
    { author: 'Joy P.', rating: 4, text: 'Honest diagnosis, saved us buying a new washer.' },
    { author: 'Dev S.', rating: 4, text: 'Good service, call-out fee a little high.' },
  ],
  p10: [
    { author: 'Tyler B.', rating: 4, text: 'Flexible weekend booking was a lifesaver.' },
    { author: 'Megan F.', rating: 5, text: 'Friendly and detailed, apartment sparkled.' },
    { author: 'Luis G.', rating: 3, text: 'Decent clean, a few spots missed.' },
  ],
};
```
2. `src/users.ts`:
```ts
import { PROTOTYPE_PROVIDER_IDS, WRITTEN_REVIEWS } from './prototype-reviews';
import type { FxUser } from './types';

/** Dev/test seeds only (ARCH §8.3). */
export const DEMO_PASSWORD = 'demo1234';
export const FILLER_CUSTOMER_COUNT = 40;
const DAY = 86_400_000;

export const mobileNo = (n: number): string => `+9477${String(n).padStart(7, '0')}`;
export const fillerCustomerId = (i: number): string => `u-c${String(i + 1).padStart(2, '0')}`;
export const writtenAuthorId = (providerId: string, index: number): string => `u-w-${providerId}-${String(index + 1)}`;

const SURNAME_BY_INITIAL: Record<string, string> = {
  A: 'Amarasinghe', B: 'Bandara', C: 'Cooray', D: 'Dissanayake', E: 'Ekanayake', F: 'Fonseka', G: 'Gunawardena',
  H: 'Herath', J: 'Jayasuriya', K: 'Karunaratne', L: 'Liyanage', M: 'Mendis', N: 'Nanayakkara', O: 'Obeyesekere',
  P: 'Peiris', R: 'Ratnayake', S: 'Senanayake', T: 'Tennakoon', V: 'Vithana', W: 'Wickramasinghe', Y: 'Yapa', Z: 'Zoysa',
};
const FILLER_FIRST = ['Amal', 'Chamari', 'Dilshan', 'Fathima', 'Gayan', 'Harini', 'Isuru', 'Janani', 'Kavindu', 'Lakmini'];
const FILLER_LAST = ['Perera', 'Fernando', 'Silva', 'Jayasinghe'];

interface UserSeed { id: string; email: string; fullName: string; mobile: string | null; isAdmin?: boolean; confirmed?: boolean }

const CORE_USERS: readonly UserSeed[] = [
  { id: 'u-admin', email: 'admin@fixit.test', fullName: 'Fixit Admin', mobile: null, isAdmin: true },
  { id: 'u-olivia', email: 'olivia@fixit.test', fullName: 'Olivia Martinez', mobile: mobileNo(1001) },
  { id: 'u-nimal', email: 'nimal@fixit.test', fullName: 'Nimal Perera', mobile: null, confirmed: false },
  { id: 'u-kasun', email: 'kasun@fixit.test', fullName: 'Kasun Silva', mobile: mobileNo(1002) },
  // provider owners (p01–p10)
  { id: 'u-marcus', email: 'marcus@fixit.test', fullName: 'Marcus Bell', mobile: mobileNo(1101) },
  { id: 'u-dana', email: 'dana@fixit.test', fullName: 'Dana Ortiz', mobile: mobileNo(1102) },
  { id: 'u-priya', email: 'priya@fixit.test', fullName: 'Priya Nair', mobile: mobileNo(1103) },
  { id: 'u-alicia', email: 'alicia@fixit.test', fullName: 'Alicia Gomez', mobile: mobileNo(1104) },
  { id: 'u-tom', email: 'tom@fixit.test', fullName: 'Tom Whitaker', mobile: mobileNo(1105) },
  { id: 'u-jamal', email: 'jamal@fixit.test', fullName: 'Jamal Carter', mobile: mobileNo(1106) },
  { id: 'u-lena', email: 'lena@fixit.test', fullName: 'Lena Fischer', mobile: mobileNo(1107) },
  { id: 'u-hank', email: 'hank@fixit.test', fullName: 'Hank Morales', mobile: mobileNo(1108) },
  { id: 'u-kevin', email: 'kevin@fixit.test', fullName: 'Kevin Tran', mobile: mobileNo(1109) },
  { id: 'u-grace', email: 'grace@fixit.test', fullName: 'Grace Kim', mobile: mobileNo(1110) },
  // named customers from the prototype sample requests
  { id: 'u-james-carter', email: 'james.carter@fixit.test', fullName: 'James Carter', mobile: mobileNo(1201) },
  { id: 'u-aisha-rahman', email: 'aisha.rahman@fixit.test', fullName: 'Aisha Rahman', mobile: mobileNo(1202) },
  { id: 'u-ethan-brooks', email: 'ethan.brooks@fixit.test', fullName: 'Ethan Brooks', mobile: mobileNo(1203) },
  { id: 'u-sophia-nguyen', email: 'sophia.nguyen@fixit.test', fullName: 'Sophia Nguyen', mobile: mobileNo(1204) },
  { id: 'u-daniel-kim', email: 'daniel.kim@fixit.test', fullName: 'Daniel Kim', mobile: mobileNo(1205) },
  { id: 'u-rachel-owens', email: 'rachel.owens@fixit.test', fullName: 'Rachel Owens', mobile: mobileNo(1206) },
  { id: 'u-marcus-lee', email: 'marcus.lee@fixit.test', fullName: 'Marcus Lee', mobile: mobileNo(1207) },
];

function writtenAuthorSeeds(): UserSeed[] {
  let n = 0;
  return PROTOTYPE_PROVIDER_IDS.flatMap((pid) =>
    WRITTEN_REVIEWS[pid].map((w, i) => {
      n += 1;
      const [first = '', initial = ''] = w.author.split(' ');
      const letter = initial.charAt(0);
      return {
        id: writtenAuthorId(pid, i),
        email: `reviewer.${pid}.${String(i + 1)}@fixit.test`,
        fullName: `${first} ${SURNAME_BY_INITIAL[letter] ?? letter}`,
        mobile: mobileNo(4000 + n),
      };
    }),
  );
}

function fillerSeeds(): UserSeed[] {
  return Array.from({ length: FILLER_CUSTOMER_COUNT }, (_, i) => ({
    id: fillerCustomerId(i),
    email: `customer${String(i + 1).padStart(2, '0')}@fixit.test`,
    fullName: `${FILLER_FIRST[i % FILLER_FIRST.length] ?? 'Amal'} ${FILLER_LAST[Math.floor(i / FILLER_FIRST.length)] ?? 'Perera'}`,
    mobile: mobileNo(3000 + i),
  }));
}

export function buildUsers(now: Date): FxUser[] {
  const createdAt = new Date(now.getTime() - 400 * DAY).toISOString();
  return [...CORE_USERS, ...writtenAuthorSeeds(), ...fillerSeeds()].map((s) => ({
    id: s.id,
    email: s.email,
    fullName: s.fullName,
    isAdmin: s.isAdmin ?? false,
    status: 'active',
    emailConfirmedAt: s.confirmed === false ? null : createdAt,
    mobile: s.mobile,
    authMethods: ['password'],
    createdAt,
  }));
}

/** DevPanel "Sign in as" (ARCH §4.5), test `signInAs`, and e2e logins. */
export const DEMO_PERSONAS = [
  { key: 'customer', label: 'Customer (Olivia Martinez)', email: 'olivia@fixit.test', userId: 'u-olivia' },
  { key: 'customerUnconfirmed', label: 'Customer, unconfirmed (Nimal Perera)', email: 'nimal@fixit.test', userId: 'u-nimal' },
  { key: 'provider', label: 'Provider, verified (Marcus Bell / Bell & Sons)', email: 'marcus@fixit.test', userId: 'u-marcus' },
  { key: 'providerNotSubmitted', label: 'Provider, not submitted (Hank Morales)', email: 'hank@fixit.test', userId: 'u-hank' },
  { key: 'providerDraft', label: 'Provider draft (Kasun Silva, onboarding step 3)', email: 'kasun@fixit.test', userId: 'u-kasun' },
  { key: 'admin', label: 'Admin', email: 'admin@fixit.test', userId: 'u-admin' },
] as const;
export type PersonaKey = (typeof DEMO_PERSONAS)[number]['key'];
```
3. `src/index.ts`: add `export * from './prototype-reviews';` and `export * from './users';`.
**Verify:** `pnpm --filter @fixit/fixtures typecheck`; `pnpm verify`.
**Commit:** `git commit -m "feat(fixtures): demo users, personas and prototype review data (M02-T10)"`

### T11 — Fixture providers, services, areas, submission
- [x] done
**Files:** `packages/fixtures/src/providers.ts`, `src/index.ts`
**Context:** ARCH §8.3 Providers/Services (USD × 30, rounded to 500; `hr` → per_hour, `visit` → per_visit; "call-out" → per_visit; items ≥ USD 300 → fixed), location table; PRODUCT F-15 step order (1 business details, 2 category, 3 services, 4 towns, 5 photo); ARCH §8.3 "p02 has a pending_review submission". Bios kept, "Austin"/"Texas" localised. Aggregates are filled in T14 (left `null`/`0` here).
**Do:**
```ts
import type { PriceUnit, VerificationStatus } from '@fixit/contracts';
import type { FxArea, FxDocument, FxProvider, FxService, FxSubmission } from './types';

const DAY = 86_400_000;

interface ProviderSeed {
  id: string; ownerId: string; businessName: string; categoryId: string; baseTownId: string; years: number;
  verification: VerificationStatus; bio: string;
  services: readonly (readonly [name: string, price: number, unit: PriceUnit])[];
  otherTowns: readonly string[];
}

export const PROVIDER_SEEDS: readonly ProviderSeed[] = [
  { id: 'p01', ownerId: 'u-marcus', businessName: 'Bell & Sons Plumbing', categoryId: 'plumbing', baseTownId: 'colombo', years: 14, verification: 'verified',
    bio: 'Family-run plumbing business serving Colombo for over a decade. Upfront pricing, same-day call-outs and tidy work.',
    services: [['Leak repair', 2500, 'per_hour'], ['Drain unclogging', 3000, 'per_hour'], ['Water heater install', 13500, 'fixed'], ['Fixture replacement', 3500, 'per_hour'], ['Emergency call-outs', 4500, 'per_visit']],
    otherTowns: ['maharagama', 'dehiwala-mount-lavinia', 'moratuwa', 'kesbewa'] },
  { id: 'p02', ownerId: 'u-dana', businessName: 'FlowRight Plumbing', categoryId: 'plumbing', baseTownId: 'dehiwala-mount-lavinia', years: 6, verification: 'pending_review',
    bio: 'Independent plumber focused on residential repairs and bathroom refits. Friendly, careful and affordable.',
    services: [['Toilet repair', 2000, 'per_hour'], ['Faucet install', 3500, 'per_hour'], ['Garbage disposal', 5000, 'per_hour'], ['Bathroom refits', 54000, 'fixed']],
    otherTowns: ['maharagama', 'sri-jayawardenepura-kotte', 'moratuwa'] },
  { id: 'p03', ownerId: 'u-priya', businessName: 'BrightSpark Electric', categoryId: 'electrical', baseTownId: 'sri-jayawardenepura-kotte', years: 11, verification: 'verified',
    bio: 'Licensed master electrician. From a single outlet to full panel upgrades, done safely and to code.',
    services: [['Outlet & switch install', 3000, 'per_hour'], ['Lighting fixtures', 3500, 'per_hour'], ['Panel upgrades', 42000, 'fixed'], ['EV charger install', 19500, 'fixed'], ['Safety inspections', 4000, 'per_hour']],
    otherTowns: ['dehiwala-mount-lavinia', 'colombo', 'kaduwela', 'kelaniya'] },
  { id: 'p04', ownerId: 'u-alicia', businessName: 'Fresh Nest Cleaning', categoryId: 'cleaning', baseTownId: 'colombo', years: 8, verification: 'verified',
    bio: 'A small, trusted team offering eco-friendly home cleaning. Weekly, bi-weekly or one-off deep cleans.',
    services: [['Regular cleaning', 2000, 'per_visit'], ['Deep cleaning', 4000, 'per_visit'], ['Move-in / move-out', 6500, 'per_visit'], ['Oven & fridge cleaning', 1500, 'per_visit']],
    otherTowns: ['maharagama', 'wattala', 'kelaniya'] },
  { id: 'p05', ownerId: 'u-tom', businessName: 'GreenLeaf Gardens', categoryId: 'gardening', baseTownId: 'maharagama', years: 9, verification: 'verified',
    bio: 'Garden care and landscaping for the Western Province climate. Drought-friendly planting is our specialty.',
    services: [['Lawn mowing', 1500, 'per_hour'], ['Hedge trimming', 2000, 'per_hour'], ['Planting & mulching', 2500, 'per_hour'], ['Seasonal clean-ups', 4500, 'per_hour'], ['Irrigation checks', 1500, 'per_hour']],
    otherTowns: ['dehiwala-mount-lavinia', 'colombo', 'homagama'] },
  { id: 'p06', ownerId: 'u-jamal', businessName: 'True Coat Painting', categoryId: 'painting', baseTownId: 'dehiwala-mount-lavinia', years: 12, verification: 'verified',
    bio: 'Interior and exterior painting with clean lines and careful prep. Furniture covered, floors protected.',
    services: [['Interior painting', 1500, 'per_hour'], ['Exterior painting', 2000, 'per_hour'], ['Cabinet refinishing', 27000, 'fixed'], ['Wallpaper removal', 1500, 'per_hour']],
    otherTowns: ['sri-jayawardenepura-kotte', 'maharagama', 'colombo', 'moratuwa'] },
  { id: 'p07', ownerId: 'u-lena', businessName: 'Oak & Iron Carpentry', categoryId: 'carpentry', baseTownId: 'sri-jayawardenepura-kotte', years: 17, verification: 'verified',
    bio: 'Custom woodwork and repairs by a craftsperson with 17 years at the bench. Built to last.',
    services: [['Custom shelving', 2500, 'per_hour'], ['Door hanging & repair', 2500, 'per_hour'], ['Deck building', 75000, 'fixed'], ['Trim & molding', 2500, 'per_hour'], ['Furniture repair', 2500, 'per_hour']],
    otherTowns: ['colombo', 'kaduwela', 'gampaha'] },
  { id: 'p08', ownerId: 'u-hank', businessName: 'HandyHank Home Repairs', categoryId: 'handyman', baseTownId: 'colombo', years: 4, verification: 'not_submitted',
    bio: 'No job too small. TV mounting, flat-pack assembly, minor repairs and odd jobs around the house.',
    services: [['TV mounting', 1500, 'per_hour'], ['Furniture assembly', 1500, 'per_hour'], ['Drywall patching', 2000, 'per_hour'], ['Picture hanging', 1500, 'per_hour'], ['Minor repairs', 1500, 'per_hour']],
    otherTowns: ['wattala', 'ja-ela'] },
  { id: 'p09', ownerId: 'u-kevin', businessName: 'ApplianceDoc', categoryId: 'appliance', baseTownId: 'maharagama', years: 10, verification: 'verified',
    bio: 'Factory-trained technician repairing all major brands. Most parts carried in the van for first-visit fixes.',
    services: [['Washer & dryer repair', 2500, 'per_visit'], ['Refrigerator repair', 3000, 'per_visit'], ['Oven & stove repair', 3000, 'per_visit'], ['Dishwasher repair', 2500, 'per_visit']],
    otherTowns: ['dehiwala-mount-lavinia', 'colombo', 'sri-jayawardenepura-kotte', 'homagama', 'kadawatha'] },
  { id: 'p10', ownerId: 'u-grace', businessName: 'Sparkle & Shine Cleaners', categoryId: 'cleaning', baseTownId: 'sri-jayawardenepura-kotte', years: 3, verification: 'not_submitted',
    bio: 'New, energetic cleaning service with flexible evening and weekend slots.',
    services: [['Regular cleaning', 1500, 'per_visit'], ['Apartment cleaning', 1500, 'per_visit'], ['Post-party clean-up', 2500, 'per_visit'], ['Laundry & ironing', 1000, 'per_visit']],
    otherTowns: ['dehiwala-mount-lavinia', 'negombo', 'ja-ela'] },
];

export const serviceId = (providerId: string, index: number): string => `${providerId}-s${String(index + 1)}`;

export function buildProviders(now: Date): {
  providers: FxProvider[]; services: FxService[]; areas: FxArea[]; submissions: FxSubmission[]; documents: FxDocument[];
} {
  const ago = (days: number) => new Date(now.getTime() - days * DAY).toISOString();
  const providers: FxProvider[] = PROVIDER_SEEDS.map((s) => ({
    id: s.id, userId: s.ownerId, businessName: s.businessName, bio: s.bio, yearsExperience: s.years,
    categoryId: s.categoryId, baseTownId: s.baseTownId, photoKey: null,
    onboardingStep: 5, onboardingComplete: true, publishedAt: ago(380),
    verificationStatus: s.verification, verifiedAt: s.verification === 'verified' ? ago(370) : null,
    reverificationReason: null, paused: false,
    ratingAvg: null, reviewCount: 0, startingPrice: null, startingUnit: null, // computed in buildWorld
    createdAt: ago(390),
  }));
  // Kasun Silva: draft, steps 1–2 done, on step 3 (services). Not published → roles stay ['customer'].
  providers.push({
    id: 'p11', userId: 'u-kasun', businessName: 'Silva Electricals',
    bio: 'Electrician in Kaduwela for small home jobs: rewiring, ceiling fans and switch boards.', yearsExperience: 5,
    categoryId: 'electrical', baseTownId: null, photoKey: null, onboardingStep: 3, onboardingComplete: false,
    publishedAt: null, verificationStatus: 'not_submitted', verifiedAt: null, reverificationReason: null, paused: false,
    ratingAvg: null, reviewCount: 0, startingPrice: null, startingUnit: null, createdAt: ago(3),
  });
  const services: FxService[] = PROVIDER_SEEDS.flatMap((s) =>
    s.services.map(([name, price, unit], i) => ({ id: serviceId(s.id, i), providerId: s.id, name, price, unit })),
  );
  const areas: FxArea[] = PROVIDER_SEEDS.flatMap((s) => [
    { providerId: s.id, townId: s.baseTownId, isBase: true },
    ...[...s.otherTowns].sort().map((townId) => ({ providerId: s.id, townId, isBase: false })),
  ]);
  const submissions: FxSubmission[] = [
    { id: 's-p02-1', providerId: 'p02', attempt: 1, trigger: 'provider', status: 'pending_review',
      submittedAt: ago(1), decidedAt: null, rejectionReason: null },
  ];
  const documents: FxDocument[] = [
    { id: 'd-p02-nic-front', providerId: 'p02', submissionId: 's-p02-1', type: 'nic_front', fileName: 'nic-front.jpg', mimeType: 'image/jpeg', sizeBytes: 482_113, createdAt: ago(1) },
    { id: 'd-p02-nic-back', providerId: 'p02', submissionId: 's-p02-1', type: 'nic_back', fileName: 'nic-back.jpg', mimeType: 'image/jpeg', sizeBytes: 455_902, createdAt: ago(1) },
  ];
  return { providers, services, areas, submissions, documents };
}
```
Add `export * from './providers';` to `index.ts`.
**Verify:** `pnpm --filter @fixit/fixtures typecheck`; `pnpm verify`.
**Commit:** `git commit -m "feat(fixtures): localised providers, LKR services, areas, p02 submission (M02-T11)"`

### T12 — Fixture request builder and the 8 prototype requests
- [x] done
**Files:** `packages/fixtures/src/requests.ts`, `src/index.ts`
**Context:** ARCH §8.3 Requests (pending now + 3–6 days; accepted one today, one +2; completed one inside the 30-day window, no review); `expiresAt()` from contracts; D-c (FX-2046 → Olivia). Request ids `r-<ref>`. Prototype notes copied ("40-gal tank" localised).
**Do:**
```ts
import { addDays, colomboToday, expiresAt, type RequestRecord, type RequestStatus, type TimeSlot } from '@fixit/contracts';
import { serviceId } from './providers';
import type { FxProvider, FxService, FxUser } from './types';

const HOUR = 3_600_000;

export interface RequestSeed {
  ref: string;
  customer: Pick<FxUser, 'id' | 'mobile'>;
  provider: Pick<FxProvider, 'id' | 'userId'>;
  service: FxService;
  townId: string;
  preferredDate: string;
  slot: TimeSlot;
  addressLine1: string;
  description: string;
  createdAt: Date;
  /** Provider-made transitions after creation, oldest first. */
  steps: readonly { status: Exclude<RequestStatus, 'pending'>; at: Date; reason?: string }[];
}

export function makeRequest(s: RequestSeed): RequestRecord {
  if (!s.customer.mobile) throw new Error(`makeRequest ${s.ref}: customer ${s.customer.id} has no mobile`);
  const last = s.steps.at(-1);
  const status: RequestStatus = last?.status ?? 'pending';
  const accepted = s.steps.some((st) => st.status === 'accepted');
  return {
    id: `r-${s.ref}`,
    ref: s.ref,
    customerId: s.customer.id,
    providerId: s.provider.id,
    providerUserId: s.provider.userId,
    serviceId: s.service.id,
    service: { name: s.service.name, price: s.service.price, unit: s.service.unit },
    preferredDate: s.preferredDate,
    slot: s.slot,
    townId: s.townId,
    addressLine1: s.addressLine1,
    addressLine2: null,
    description: s.description,
    customerMobile: s.customer.mobile,
    agreedPrice: accepted ? s.service.price : null,
    status,
    reason: last?.reason ?? null,
    closedBy: status === 'declined' || status === 'completed' ? 'provider' : null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: (last?.at ?? s.createdAt).toISOString(),
    expiresAt: expiresAt(s.createdAt, s.preferredDate).toISOString(),
    completedAt: status === 'completed' && last ? last.at.toISOString() : null,
    events: [
      { status: 'pending', at: s.createdAt.toISOString(), actor: 'customer', actorUserId: s.customer.id, reason: null },
      ...s.steps.map((st) => ({
        status: st.status, at: st.at.toISOString(), actor: 'provider' as const, actorUserId: s.provider.userId,
        reason: st.reason ?? null,
      })),
    ],
  };
}

interface ProtoRow {
  ref: string; customerId: string; service: number; townId: string; slot: TimeSlot; address: string; note: string;
  prefDays: number; createdHoursAgo: number;
  steps: readonly { status: Exclude<RequestStatus, 'pending'>; hoursAgo: number; reason?: string }[];
}

/** The prototype's 8 sample requests (provider p01), shifted relative to `now`. `service` = index in p01's services. */
const PROTOTYPE_REQUESTS: readonly ProtoRow[] = [
  { ref: 'FX-2061', customerId: 'u-olivia', service: 0, townId: 'colombo', slot: 'morning', address: '24 Galle Road',
    note: 'Water dripping under the kitchen sink cabinet.', prefDays: 3, createdHoursAgo: 2, steps: [] },
  { ref: 'FX-2059', customerId: 'u-james-carter', service: 2, townId: 'maharagama', slot: 'afternoon', address: '8 High Level Road',
    note: 'Old 150-litre geyser failed, need a replacement quote.', prefDays: 6, createdHoursAgo: 20, steps: [] },
  { ref: 'FX-2058', customerId: 'u-aisha-rahman', service: 1, townId: 'dehiwala-mount-lavinia', slot: 'evening', address: '15 Hill Street',
    note: 'Shower drains very slowly.', prefDays: 4, createdHoursAgo: 30, steps: [] },
  { ref: 'FX-2054', customerId: 'u-ethan-brooks', service: 3, townId: 'colombo', slot: 'morning', address: '41 Duplication Road',
    note: 'Swap two bathroom faucets.', prefDays: 0, createdHoursAgo: 96, steps: [{ status: 'accepted', hoursAgo: 72 }] },
  { ref: 'FX-2050', customerId: 'u-sophia-nguyen', service: 4, townId: 'colombo', slot: 'evening', address: '3 Flower Road',
    note: 'Burst pipe in the garage.', prefDays: 2, createdHoursAgo: 48, steps: [{ status: 'accepted', hoursAgo: 24 }] },
  { ref: 'FX-2046', customerId: 'u-olivia', service: 0, townId: 'dehiwala-mount-lavinia', slot: 'afternoon', address: '27 Station Road',
    note: 'Toilet base leaking.', prefDays: -3, createdHoursAgo: 144,
    steps: [{ status: 'accepted', hoursAgo: 120 }, { status: 'completed', hoursAgo: 48 }] },
  { ref: 'FX-2041', customerId: 'u-rachel-owens', service: 1, townId: 'maharagama', slot: 'morning', address: '102 Old Kesbewa Road',
    note: 'Kitchen sink fully blocked.', prefDays: -40, createdHoursAgo: 1080,
    steps: [{ status: 'accepted', hoursAgo: 1056 }, { status: 'completed', hoursAgo: 936 }] },
  { ref: 'FX-2037', customerId: 'u-marcus-lee', service: 2, townId: 'sri-jayawardenepura-kotte', slot: 'morning', address: '6 Parliament Road',
    note: 'Outside service area.', prefDays: -50, createdHoursAgo: 1296,
    steps: [{ status: 'declined', hoursAgo: 1272, reason: 'Outside my service area.' }] },
];

export function buildPrototypeRequests(
  now: Date,
  ctx: { users: readonly FxUser[]; providers: readonly FxProvider[]; services: readonly FxService[] },
): RequestRecord[] {
  const today = colomboToday(now);
  const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * HOUR);
  const p01 = ctx.providers.find((p) => p.id === 'p01');
  if (!p01) throw new Error('fixtures: p01 missing');
  return PROTOTYPE_REQUESTS.map((row) => {
    const customer = ctx.users.find((u) => u.id === row.customerId);
    const service = ctx.services.find((s) => s.id === serviceId('p01', row.service));
    if (!customer || !service) throw new Error(`fixtures: bad prototype request ${row.ref}`);
    return makeRequest({
      ref: row.ref, customer, provider: p01, service, townId: row.townId, preferredDate: addDays(today, row.prefDays),
      slot: row.slot, addressLine1: row.address, description: row.note, createdAt: at(row.createdHoursAgo),
      steps: row.steps.map((st) => ({ status: st.status, at: at(st.hoursAgo), ...(st.reason ? { reason: st.reason } : {}) })),
    });
  });
}
```
Add `export * from './requests';` to `index.ts`.
**Verify:** `pnpm --filter @fixit/fixtures typecheck`; `pnpm verify`.
**Commit:** `git commit -m "feat(fixtures): request builder and the 8 prototype requests (M02-T12)"`

### T13 — Fixture reviews with their completed requests
- [x] done
**Files:** `packages/fixtures/src/reviews.ts`, `src/index.ts`
**Context:** ARCH §8.3 Reviews (prototype 3 written newest + deterministic filler so count = prototype and average ±0.05; every review has its own completed request by its author); D-e (refs FX-0001…). Uses `makeRequest` (T12), `mulberry32`/`shuffle` (T8), author ids (T10).
**Do:**
```ts
import { colomboToday, type RequestRecord, type TimeSlot } from '@fixit/contracts';
import { mulberry32, shuffle } from './prng';
import { PROTOTYPE_PROVIDER_IDS, PROTOTYPE_RATINGS, WRITTEN_REVIEWS } from './prototype-reviews';
import { makeRequest } from './requests';
import type { FxProvider, FxReview, FxService, FxUser } from './types';
import { FILLER_CUSTOMER_COUNT, fillerCustomerId, writtenAuthorId } from './users';

const DAY = 86_400_000;
const SLOTS: readonly TimeSlot[] = ['morning', 'afternoon', 'evening'];
const FILLER_TEXTS = [
  'On time, tidy and fairly priced.',
  'Did a good job and explained the work.',
  'Friendly and professional, would book again.',
  'Solid work, a little slow to reply.',
  'Fixed the problem on the first visit.',
  'Good value for the price.',
  'Arrived late but the work was fine.',
  'Careful work, cleaned up afterwards.',
  'Not perfect, but they came back to sort it.',
  'Very happy with the result.',
] as const;

/** Integer ratings for the filler so that sum(all) = round(target × total). Throws if impossible. */
export function fillerRatings(target: number, total: number, written: readonly number[]): number[] {
  const n = total - written.length;
  const remaining = Math.round(target * total) - written.reduce((a, b) => a + b, 0);
  const base = Math.floor(remaining / n);
  const extra = remaining - base * n;
  if (n <= 0 || base < 1 || base > 5 || (base === 5 && extra > 0)) {
    throw new Error(`fillerRatings: cannot reach ${String(target)} over ${String(total)} reviews`);
  }
  return Array.from({ length: n }, (_, i) => (i < extra ? base + 1 : base));
}

export function buildReviews(
  now: Date,
  ctx: { users: readonly FxUser[]; providers: readonly FxProvider[]; services: readonly FxService[] },
): { reviews: FxReview[]; requests: RequestRecord[] } {
  const userById = new Map(ctx.users.map((u) => [u.id, u]));
  const reviews: FxReview[] = [];
  const requests: RequestRecord[] = [];
  let seq = 0;

  PROTOTYPE_PROVIDER_IDS.forEach((providerId, pIndex) => {
    const provider = ctx.providers.find((p) => p.id === providerId);
    const services = ctx.services.filter((s) => s.providerId === providerId);
    if (!provider?.baseTownId || services.length === 0) throw new Error(`fixtures: provider ${providerId} incomplete`);
    const proto = PROTOTYPE_RATINGS[providerId];
    const written = WRITTEN_REVIEWS[providerId];
    const rand = mulberry32(pIndex + 1);
    const filler = shuffle(fillerRatings(proto.rating, proto.reviewCount, written.map((w) => w.rating)), rand);
    const entries = [
      ...written.map((w, i) => ({ authorId: writtenAuthorId(providerId, i), rating: w.rating, text: w.text, daysAgo: 8 + 20 * i })),
      ...filler.map((rating, k) => ({
        authorId: fillerCustomerId((k + pIndex * 7) % FILLER_CUSTOMER_COUNT),
        rating,
        text: FILLER_TEXTS[Math.floor(rand() * FILLER_TEXTS.length)] ?? FILLER_TEXTS[0],
        daysAgo: 70 + 2 * k,
      })),
    ];
    for (const e of entries) {
      seq += 1;
      const ref = `FX-${String(seq).padStart(4, '0')}`;
      const author = userById.get(e.authorId);
      const service = services[seq % services.length];
      if (!author || !service) throw new Error(`fixtures: bad review entry ${ref}`);
      const reviewedAt = new Date(now.getTime() - e.daysAgo * DAY);
      const completedAt = new Date(reviewedAt.getTime() - DAY);
      const createdAt = new Date(completedAt.getTime() - 5 * DAY);
      const request = makeRequest({
        ref, customer: author, provider, service, townId: provider.baseTownId,
        preferredDate: colomboToday(completedAt), slot: SLOTS[seq % SLOTS.length] ?? 'morning',
        addressLine1: `No. ${String(seq)}, Temple Road`,
        description: `Booked ${service.name.toLowerCase()} through Fixit.`,
        createdAt,
        steps: [
          { status: 'accepted', at: new Date(createdAt.getTime() + 4 * 3_600_000) },
          { status: 'completed', at: completedAt },
        ],
      });
      requests.push(request);
      reviews.push({
        id: `v-${ref}`, requestId: request.id, providerId, authorId: author.id, rating: e.rating, text: e.text,
        visibility: 'visible', createdAt: reviewedAt.toISOString(), replyText: null, replyCreatedAt: null, replyUpdatedAt: null,
      });
    }
  });
  return { reviews, requests };
}
```
Add `export * from './reviews';` to `index.ts`.
**Verify:** `pnpm --filter @fixit/fixtures typecheck`; `pnpm verify`.
**Commit:** `git commit -m "feat(fixtures): written and filler reviews with completed requests (M02-T13)"`

### T14 — `buildWorld(now)` with computed aggregates
- [x] done
**Files:** `packages/fixtures/src/build.ts`, `src/index.ts`
**Context:** ARCH §8.3 ("Aggregates are computed with `ratingFrom()`, never copied"), §7.7; `computeStartingPrice` (T5).
**Do:**
```ts
// packages/fixtures/src/build.ts
import { computeStartingPrice, ratingFrom } from '@fixit/contracts';
import { CATEGORIES, DISTRICTS, TOWNS } from './catalog';
import { buildProviders } from './providers';
import { buildPrototypeRequests } from './requests';
import { buildReviews } from './reviews';
import type { World } from './types';
import { buildUsers } from './users';

/** Fresh, deterministic demo world; every date is relative to `now` (D1). */
export function buildWorld(now: Date): World {
  const users = buildUsers(now);
  const { providers, services, areas, submissions, documents } = buildProviders(now);
  const prototypeRequests = buildPrototypeRequests(now, { users, providers, services });
  const { reviews, requests: reviewedRequests } = buildReviews(now, { users, providers, services });

  for (const p of providers) {
    const agg = ratingFrom(reviews.filter((r) => r.providerId === p.id && r.visibility === 'visible').map((r) => r.rating));
    p.ratingAvg = agg.rating;
    p.reviewCount = agg.count;
    const start = computeStartingPrice(services.filter((s) => s.providerId === p.id));
    p.startingPrice = start?.amount ?? null;
    p.startingUnit = start?.unit ?? null;
  }

  return {
    categories: CATEGORIES.map((c) => ({ ...c })),
    districts: DISTRICTS.map((d) => ({ ...d })),
    towns: TOWNS.map((t) => ({ ...t })),
    users, providers, services, areas,
    requests: [...prototypeRequests, ...reviewedRequests],
    reviews, submissions, documents,
  };
}
```
`src/index.ts` final content:
```ts
export * from './types';
export * from './catalog';
export * from './prototype-reviews';
export * from './users';
export * from './providers';
export * from './requests';
export * from './reviews';
export * from './build';
```
**Verify:** `pnpm --filter @fixit/fixtures build` succeeds; `pnpm verify`.
**Commit:** `git commit -m "feat(fixtures): buildWorld with computed rating and starting price (M02-T14)"`

### T15 — Fixture invariants test (AC6)
- [x] done
**Files:** `packages/fixtures/src/build.test.ts`
**Context:** Milestone AC6; ARCH §9.1 fixtures row; BR-24 (30-day window).
**Do / Test:**
```ts
import { describe, expect, it } from 'vitest';
import { addDays, colomboToday, computeStartingPrice, ratingFrom, RequestRecord, RequestRef } from '@fixit/contracts';
import { buildWorld } from './build';
import { PROTOTYPE_RATINGS } from './prototype-reviews';
import { DEMO_PERSONAS } from './users';

const NOW = new Date('2026-11-22T04:30:00.000Z'); // 10:00 Colombo
const world = buildWorld(NOW);
const today = colomboToday(NOW);
const byRef = (ref: string) => world.requests.find((r) => r.ref === ref);

describe('provider aggregates', () => {
  it.each(Object.entries(PROTOTYPE_RATINGS))('%s = ratingFrom(visible reviews) ≈ prototype', (id, proto) => {
    const p = world.providers.find((x) => x.id === id);
    const agg = ratingFrom(world.reviews.filter((r) => r.providerId === id && r.visibility === 'visible').map((r) => r.rating));
    expect(p?.ratingAvg).toBe(agg.rating);
    expect(p?.reviewCount).toBe(agg.count);
    expect(agg.count).toBe(proto.reviewCount);
    expect(Math.abs((agg.rating ?? 0) - proto.rating)).toBeLessThanOrEqual(0.05);
  });
  it('starting price = computeStartingPrice(services); p01 starts at LKR 2,500 / hour', () => {
    for (const p of world.providers) {
      const start = computeStartingPrice(world.services.filter((s) => s.providerId === p.id));
      expect(p.startingPrice).toBe(start?.amount ?? null);
      expect(p.startingUnit).toBe(start?.unit ?? null);
    }
    const p01 = world.providers.find((p) => p.id === 'p01');
    expect([p01?.startingPrice, p01?.startingUnit]).toEqual([2500, 'per_hour']);
  });
});

describe('reviews and requests', () => {
  it('every review has its own completed request by its author with the same provider', () => {
    const requestIds = world.reviews.map((r) => r.requestId);
    expect(new Set(requestIds).size).toBe(requestIds.length);
    for (const review of world.reviews) {
      const req = world.requests.find((r) => r.id === review.requestId);
      expect(req?.status).toBe('completed');
      expect(req?.customerId).toBe(review.authorId);
      expect(req?.providerId).toBe(review.providerId);
    }
  });
  it('refs and ids are unique and valid; every record matches the contract', () => {
    const refs = world.requests.map((r) => r.ref);
    expect(new Set(refs).size).toBe(refs.length);
    expect(new Set(world.requests.map((r) => r.id)).size).toBe(refs.length);
    for (const r of world.requests) {
      expect(RequestRef.safeParse(r.ref).success).toBe(true);
      expect(() => RequestRecord.parse(r)).not.toThrow();
    }
  });
});

describe('prototype requests', () => {
  it('has the 8 prototype refs', () => {
    for (const ref of ['FX-2061', 'FX-2059', 'FX-2058', 'FX-2054', 'FX-2050', 'FX-2046', 'FX-2041', 'FX-2037']) {
      expect(byRef(ref)?.providerId).toBe('p01');
    }
  });
  it('has an Accepted request with preferredDate = today', () => {
    expect(world.requests.some((r) => r.status === 'accepted' && r.preferredDate === today)).toBe(true);
  });
  it('has a Completed request of Olivia inside the 30-day window with no review', () => {
    const r = byRef('FX-2046');
    expect(r?.status).toBe('completed');
    expect(r?.customerId).toBe('u-olivia');
    expect(new Date(r?.completedAt ?? 0).getTime()).toBeGreaterThan(NOW.getTime() - 30 * 86_400_000);
    expect(world.reviews.some((v) => v.requestId === r?.id)).toBe(false);
  });
  it('pending requests are 3–6 days out and not expired', () => {
    const pending = world.requests.filter((r) => r.status === 'pending');
    expect(pending).toHaveLength(3);
    for (const r of pending) {
      expect(r.preferredDate >= addDays(today, 3) && r.preferredDate <= addDays(today, 6)).toBe(true);
      expect(new Date(r.expiresAt).getTime()).toBeGreaterThan(NOW.getTime());
    }
  });
  it('dates move with now', () => {
    const later = buildWorld(new Date(NOW.getTime() + 10 * 86_400_000));
    expect(later.requests.find((r) => r.ref === 'FX-2061')?.preferredDate).toBe(addDays(today, 13));
  });
});

describe('users and providers', () => {
  it('personas exist with the expected state', () => {
    const user = (id: string) => world.users.find((u) => u.id === id);
    for (const p of DEMO_PERSONAS) expect(user(p.userId)?.email).toBe(p.email);
    expect(user('u-olivia')?.emailConfirmedAt).not.toBeNull();
    expect(user('u-nimal')?.emailConfirmedAt).toBeNull();
    expect(user('u-admin')?.isAdmin).toBe(true);
    const emails = world.users.map((u) => u.email);
    expect(new Set(emails).size).toBe(emails.length);
  });
  it('Kasun is a draft on step 3; p02 is pending review with a pending submission; Hank not submitted', () => {
    const kasun = world.providers.find((p) => p.userId === 'u-kasun');
    expect([kasun?.onboardingStep, kasun?.onboardingComplete]).toEqual([3, false]);
    expect(world.providers.find((p) => p.id === 'p02')?.verificationStatus).toBe('pending_review');
    expect(world.submissions.find((s) => s.providerId === 'p02')?.status).toBe('pending_review');
    expect(world.providers.find((p) => p.id === 'p08')?.verificationStatus).toBe('not_submitted');
  });
  it('each published provider has a base town plus 2–5 other towns', () => {
    for (const p of world.providers.filter((x) => x.onboardingComplete)) {
      const areas = world.areas.filter((a) => a.providerId === p.id);
      expect(areas.filter((a) => a.isBase).map((a) => a.townId)).toEqual([p.baseTownId]);
      const others = areas.filter((a) => !a.isBase).length;
      expect(others >= 2 && others <= 5).toBe(true);
    }
  });
});
```
**Verify:** `pnpm --filter @fixit/fixtures test` → all pass (AC6); `pnpm verify`.
**Commit:** `git commit -m "test(fixtures): buildWorld invariants (M02-T15)"`

### T16 — Web dependencies, MSW worker, Vite proxy, worker stripped from build
- [x] done
**Files:** `apps/web/package.json`, `apps/web/public/mockServiceWorker.js`, `apps/web/vite.config.ts`, `apps/web/vitest.config.ts`, `.gitignore`, `.prettierignore`
**Context:** ARCH §4.3, §4.4 (proxy excerpt), D23, AC5. `.prettierignore` already lists `apps/web/public/mockServiceWorker.js`.
**Do:**
1. `pnpm --filter @fixit/web add @fixit/fixtures@workspace:* @tanstack/react-query@^5`
2. `pnpm --filter @fixit/web add -D msw@^2 @testing-library/react@^16 @testing-library/dom@^10`
3. `pnpm --filter @fixit/web exec msw init public --save` (creates `public/mockServiceWorker.js`, adds `"msw": { "workerDirectory": ["public"] }` to `apps/web/package.json`).
4. Replace `apps/web/vite.config.ts`:
```ts
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defaultClientConditions, defineConfig, type Plugin } from 'vite';
import { parseMockDomains } from './src/mocks/domains';

/** Fail fast on a bad VITE_MOCK_DOMAINS (dev, build and tests). */
function checkMockDomains(): Plugin {
  return {
    name: 'fixit:check-mock-domains',
    configResolved(config) {
      const raw: unknown = config.env.VITE_MOCK_DOMAINS;
      parseMockDomains(typeof raw === 'string' ? raw : undefined);
    },
  };
}

/** D23: no MSW in a production build — the worker file copied from public/ is removed. */
function stripMswWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'fixit:strip-msw-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      rmSync(resolve(outDir, 'mockServiceWorker.js'), { force: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), checkMockDomains(), stripMswWorker()],
  resolve: {
    // D19: consume @fixit/contracts and @fixit/fixtures TypeScript sources directly, no build step
    conditions: ['source', ...defaultClientConditions],
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: false } },
  },
});
```
4b. The config imports `./src/mocks/domains`, so create `apps/web/src/mocks/domains.ts` now with the exact code shown in T17 (T17 then only adds its test).
5. `apps/web/vitest.config.ts`: in `test` add `setupFiles: ['src/test/setup.ts']` **only in T20** (not now).
6. If `apps/web/.vite/` exists, add `.vite/` to `.gitignore` and `**/.vite` to `.prettierignore` (Vitest cache; keeps `format:check` clean).
**Verify:** `pnpm verify` green; `ls apps/web/dist/mockServiceWorker.js` → "No such file"; `grep -rl "setupWorker\|mockServiceWorker" apps/web/dist` → no output.
**Commit:** `git commit -m "chore(web): msw, tanstack query, testing-library; api proxy; strip msw worker from build (M02-T16)"`

### T17 — `parseMockDomains()`
- [x] done
**Files:** `apps/web/src/mocks/domains.ts`, `apps/web/src/mocks/domains.test.ts`
**Context:** ARCH §4.4 exact code; AC5, AC8.
**Do:** `apps/web/src/mocks/domains.ts` was created in T16 with this exact content (check it matches):
```ts
export const MOCK_DOMAINS = ['auth', 'catalog', 'providers', 'requests', 'reviews', 'admin'] as const;
export type MockDomain = (typeof MOCK_DOMAINS)[number];

export function parseMockDomains(raw: string | undefined): MockDomain[] {
  const value = (raw ?? 'none').trim().toLowerCase();
  if (value === 'all') return [...MOCK_DOMAINS];
  if (value === '' || value === 'none') return [];
  const list = value.split(',').map((s) => s.trim()).filter(Boolean);
  const unknown = list.filter((d) => !(MOCK_DOMAINS as readonly string[]).includes(d));
  if (unknown.length > 0) throw new Error(`VITE_MOCK_DOMAINS: unknown domain(s): ${unknown.join(', ')}`);
  return [...new Set(list)] as MockDomain[];
}
```
**Test:** `domains.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { MOCK_DOMAINS, parseMockDomains } from './domains';

describe('parseMockDomains', () => {
  it('all → every domain', () => {
    expect(parseMockDomains('all')).toEqual([...MOCK_DOMAINS]);
    expect(parseMockDomains(' ALL ')).toEqual([...MOCK_DOMAINS]);
  });
  it.each([['none'], [''], ['  '], [undefined]])('%j → []', (raw) => {
    expect(parseMockDomains(raw)).toEqual([]);
  });
  it('a list keeps order', () => {
    expect(parseMockDomains('auth,catalog')).toEqual(['auth', 'catalog']);
    expect(parseMockDomains(' requests , reviews ')).toEqual(['requests', 'reviews']);
  });
  it('drops duplicates', () => {
    expect(parseMockDomains('auth,auth,catalog')).toEqual(['auth', 'catalog']);
  });
  it('unknown → throws with the names', () => {
    expect(() => parseMockDomains('bogus')).toThrow('VITE_MOCK_DOMAINS: unknown domain(s): bogus');
    expect(() => parseMockDomains('auth,foo,bar')).toThrow('unknown domain(s): foo, bar');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test` passes; `VITE_MOCK_DOMAINS=bogus pnpm --filter @fixit/web build` exits non-zero printing `VITE_MOCK_DOMAINS: unknown domain(s): bogus`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): parseMockDomains (M02-T17)"`

### T18 — Mock db schema and seed
- [x] done
**Files:** `apps/web/src/mocks/db/schema.ts`, `apps/web/src/mocks/db/seed.ts`
**Context:** ARCH §4.3 `db/` (MockDb tables), D-d; CLAUDE.md "mock db is seeded only from `@fixit/fixtures`", version key starts at `v1`.
**Do:**
1. `schema.ts`:
```ts
import type { RequestRecord } from '@fixit/contracts';
import type {
  FxArea, FxCategory, FxDistrict, FxDocument, FxProvider, FxReview, FxService, FxSubmission, FxTown, FxUser,
} from '@fixit/fixtures';

/** Bump when the MockDb shape changes (CLAUDE.md mock rules). */
export const MOCK_DB_VERSION = 1;
export const MOCK_DB_KEY = `fixit.mockdb.v${String(MOCK_DB_VERSION)}`;

export interface MockUser extends FxUser {
  password: string | null; // plain text: mock only
}
export interface MockAuthToken {
  id: string; userId: string; type: 'confirm_email' | 'reset_password'; token: string; expiresAt: string; usedAt: string | null;
}
export interface MockSaved { userId: string; providerId: string; createdAt: string }
export interface MockAudit {
  id: string; adminId: string; action: string; targetType: string; targetId: string; reason: string | null; at: string;
}

export interface MockDb {
  version: typeof MOCK_DB_VERSION;
  seededAt: string;
  categories: FxCategory[];
  districts: FxDistrict[];
  towns: FxTown[];
  users: Record<string, MockUser>;
  providers: Record<string, FxProvider>;
  services: Record<string, FxService>;
  areas: FxArea[];
  requests: Record<string, RequestRecord>; // keyed by id; status events embedded (D-d)
  reviews: Record<string, FxReview>;
  submissions: Record<string, FxSubmission>;
  documents: Record<string, FxDocument>;
  saved: MockSaved[];
  audit: MockAudit[];
  refSeq: number; // next FX number
  authTokens: MockAuthToken[]; // filled from M04
  lastEmailLink: string | null; // DevPanel "Last email link" (M04)
}
```
2. `seed.ts`:
```ts
import { buildWorld, DEMO_PASSWORD } from '@fixit/fixtures';
import { MOCK_DB_VERSION, type MockDb } from './schema';

const byId = <T extends { id: string }>(rows: readonly T[]): Record<string, T> =>
  Object.fromEntries(rows.map((r) => [r.id, r]));

/** ARCH §8.3: the mock seeds from the shared fixtures with dates relative to `now`. */
export function seedDb(now: Date): MockDb {
  const w = buildWorld(now);
  return {
    version: MOCK_DB_VERSION,
    seededAt: now.toISOString(),
    categories: w.categories,
    districts: w.districts,
    towns: w.towns,
    users: byId(w.users.map((u) => ({ ...u, password: DEMO_PASSWORD }))),
    providers: byId(w.providers),
    services: byId(w.services),
    areas: w.areas,
    requests: byId(w.requests),
    reviews: byId(w.reviews),
    submissions: byId(w.submissions),
    documents: byId(w.documents),
    saved: [],
    audit: [],
    refSeq: 2062, // ARCH §8.1 request_ref_seq START 2062
    authTokens: [],
    lastEmailLink: null,
  };
}
```
**Verify:** `pnpm --filter @fixit/web typecheck`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): mock db schema and seed from fixtures (M02-T18)"`

### T19 — Mock db store (`db`, `commit`, `resetDemoData`)
- [x] done
**Files:** `apps/web/src/mocks/db/store.ts`, `apps/web/src/mocks/db/store.test.ts`
**Context:** ARCH §4.3 `store.ts`; localStorage key `fixit.mockdb.v1`. The store survives quota errors (≈2 MB of JSON) by staying in memory.
**Do:**
```ts
// apps/web/src/mocks/db/store.ts
import { MOCK_DB_KEY, MOCK_DB_VERSION, type MockDb } from './schema';
import { seedDb } from './seed';

let cache: MockDb | null = null;

function read(): MockDb | null {
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockDb; // written only by persist() below
    return parsed.version === MOCK_DB_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function persist(d: MockDb): MockDb {
  try {
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(d));
  } catch (e) {
    console.warn('[mocks] could not persist the mock db; keeping it in memory', e);
  }
  return d;
}

/** The mock database: loaded from localStorage, or seeded from fixtures with `new Date()`. */
export function db(): MockDb {
  cache ??= read() ?? persist(seedDb(new Date()));
  return cache;
}

/** Persist after a successful handler (mockEndpoint calls this). */
export function commit(): void {
  if (cache) persist(cache);
}

/** DevPanel "Reset demo data" and the test harness (fixed `now`). */
export function resetDemoData(now: Date = new Date()): MockDb {
  cache = persist(seedDb(now));
  return cache;
}

/** Tests only: drop the in-memory copy so the next db() reads localStorage. */
export function forgetDbCache(): void {
  cache = null;
}
```
**Test:** `store.test.ts` (runs under the harness from T20 once it exists; until then it resets itself):
```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_DB_KEY } from './schema';
import { commit, db, forgetDbCache, resetDemoData } from './store';

const NOW = new Date('2026-11-22T04:30:00.000Z');

describe('mock db store', () => {
  beforeEach(() => {
    localStorage.clear();
    forgetDbCache();
  });
  it('seeds when storage is empty and persists under fixit.mockdb.v1', () => {
    expect(db().users['u-olivia']?.email).toBe('olivia@fixit.test');
    expect(localStorage.getItem(MOCK_DB_KEY)).not.toBeNull();
    expect(MOCK_DB_KEY).toBe('fixit.mockdb.v1');
  });
  it('commit() persists changes that survive a reload', () => {
    resetDemoData(NOW);
    const olivia = db().users['u-olivia'];
    if (olivia) olivia.fullName = 'Changed Name';
    commit();
    forgetDbCache();
    expect(db().users['u-olivia']?.fullName).toBe('Changed Name');
  });
  it('resetDemoData restores the seed', () => {
    resetDemoData(NOW);
    const olivia = db().users['u-olivia'];
    if (olivia) olivia.fullName = 'Changed Name';
    commit();
    resetDemoData(NOW);
    expect(db().users['u-olivia']?.fullName).toBe('Olivia Martinez');
    expect(db().seededAt).toBe(NOW.toISOString());
  });
  it('reseeds when the stored version differs', () => {
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify({ version: 0 }));
    expect(db().version).toBe(1);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test` passes; `pnpm verify`.
**Commit:** `git commit -m "feat(web): mock db store with persistence and reset (M02-T19)"`

### T20 — Mock errors, empty handler index, node server, test harness setup
- [x] done
**Files:** `apps/web/src/mocks/lib/errors.ts`, `apps/web/src/mocks/handlers/index.ts`, `apps/web/src/mocks/node.ts`, `apps/web/src/test/fixed-now.ts`, `apps/web/src/test/setup.ts`, `apps/web/vitest.config.ts`
**Context:** ARCH §4.3 `errors.ts`, `handlers/index.ts`, `node.ts`; §9.4 harness; contracts `ErrorEnvelope`, `TransitionError`. `setLatency` arrives in T21 — this task's setup does not call it yet.
**Do:**
1. `mocks/lib/errors.ts`:
```ts
import { HttpResponse } from 'msw';
import { ZodError } from 'zod';
import { ErrorEnvelope, TransitionError, type ErrorCode } from '@fixit/contracts';

type Extra = Pick<ErrorEnvelope['error'], 'fieldErrors' | 'details'>;

export class MockHttpError extends Error {
  override readonly name = 'MockHttpError';
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly extra: Extra = {},
  ) {
    super(message);
  }
}

export const mockError = (status: number, code: ErrorCode, message: string = code, extra: Extra = {}): MockHttpError =>
  new MockHttpError(status, code, message, extra);

export function errorResponse(status: number, code: ErrorCode, message: string, extra: Extra = {}): Response {
  const body = ErrorEnvelope.parse({ error: { code, message, requestId: `mock-${crypto.randomUUID()}`, ...extra } });
  return HttpResponse.json(body, { status });
}

export function toFieldErrors(e: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of e.issues) {
    const key = issue.path.map(String).join('.') || '_form';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** MockHttpError | ZodError (request parsing) | TransitionError → ErrorEnvelope, like the API filter (ARCH §7.3). */
export function toErrorResponse(e: unknown): Response {
  if (e instanceof MockHttpError) return errorResponse(e.status, e.code, e.message, e.extra);
  if (e instanceof ZodError) return errorResponse(400, 'VALIDATION_FAILED', 'Validation failed', { fieldErrors: toFieldErrors(e) });
  if (e instanceof TransitionError) return errorResponse(409, 'INVALID_TRANSITION', e.message, { details: { reason: e.reason } });
  console.error('[mocks] unhandled error', e);
  return errorResponse(500, 'INTERNAL', 'Mock handler crashed');
}
```
2. `mocks/handlers/index.ts` (auth handlers added in T26):
```ts
import type { RequestHandler } from 'msw';
import { MOCK_DOMAINS, type MockDomain } from '../domains';

export const handlersByDomain: Record<MockDomain, RequestHandler[]> = {
  auth: [],
  catalog: [],
  providers: [],
  requests: [],
  reviews: [],
  admin: [],
};
export const allHandlers: RequestHandler[] = MOCK_DOMAINS.flatMap((d) => handlersByDomain[d]);
```
3. `mocks/node.ts`:
```ts
import { setupServer } from 'msw/node';
import { allHandlers } from './handlers';

/** Vitest: every domain mocked (ARCH §9.4). */
export const server = setupServer(...allHandlers);
```
4. `test/fixed-now.ts`: `export const FIXED_NOW = new Date('2026-11-22T04:30:00.000Z'); // Sun 22 Nov 2026, 10:00 Colombo`
5. `test/setup.ts`:
```ts
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { resetDemoData } from '@/mocks/db/store';
import { server } from '@/mocks/node';
import { FIXED_NOW } from './fixed-now';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => {
  localStorage.clear();
  resetDemoData(FIXED_NOW);
});
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
});
afterAll(() => {
  server.close();
});
```
6. `vitest.config.ts` `test` block becomes:
```ts
test: {
  environment: 'jsdom',
  environmentOptions: { jsdom: { url: 'http://localhost:5173' } },
  include: ['src/**/*.test.{ts,tsx}'],
  setupFiles: ['src/test/setup.ts'],
},
```
**Verify:** `pnpm --filter @fixit/web test` — all existing tests still pass; `pnpm verify`.
**Commit:** `git commit -m "feat(web): mock error envelope, handler index, MSW node server and test setup (M02-T20)"`

### T21 — Mock controls (latency, forced errors)
- [x] done
**Files:** `apps/web/src/mocks/lib/controls.ts`, `apps/web/src/mocks/lib/controls.test.ts`, `apps/web/src/test/setup.ts`
**Context:** ARCH §4.3 `controls.ts` (localStorage `fixit.mock.controls`, default 300–800 ms, 0 in tests), §4.5 Latency / Force next error (500 / 409 INVALID_TRANSITION / 401 / network). Forced errors are keyed by endpoint id or `*` (any request) and are consumed once.
**Do:**
1. `controls.ts`:
```ts
import { HttpResponse } from 'msw';
import { z } from 'zod';
import { errorResponse } from './errors';

export const LATENCIES = ['zero', 'normal', 'slow'] as const;
export type Latency = (typeof LATENCIES)[number];
export const FORCED_KINDS = ['500', '409', '401', 'network'] as const;
export type ForcedKind = (typeof FORCED_KINDS)[number];
export const ANY_ENDPOINT = '*';

const KEY = 'fixit.mock.controls';
const Controls = z.object({
  latency: z.enum(LATENCIES).catch('normal'),
  forced: z.record(z.string(), z.enum(FORCED_KINDS)).catch({}),
});
export type MockControls = z.infer<typeof Controls>;

export function getControls(): MockControls {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = Controls.safeParse(raw ? JSON.parse(raw) : {});
    return parsed.success ? parsed.data : { latency: 'normal', forced: {} };
  } catch {
    return { latency: 'normal', forced: {} };
  }
}

function save(c: MockControls): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    // storage unavailable: controls fall back to defaults
  }
}

export function setLatency(latency: Latency): void {
  save({ ...getControls(), latency });
}

export function armForcedError(target: string, kind: ForcedKind): void {
  const c = getControls();
  save({ ...c, forced: { ...c.forced, [target]: kind } });
}

export function clearForcedErrors(): void {
  save({ ...getControls(), forced: {} });
}

/** Consumes the forced error for this endpoint id, else the "any request" one. */
export function takeForcedError(endpointId: string): ForcedKind | null {
  const c = getControls();
  const key = endpointId in c.forced ? endpointId : ANY_ENDPOINT in c.forced ? ANY_ENDPOINT : null;
  if (key === null) return null;
  const kind = c.forced[key] ?? null;
  const forced = { ...c.forced };
  delete forced[key];
  save({ ...c, forced });
  return kind;
}

export async function simulateLatency(): Promise<void> {
  const { latency } = getControls();
  const ms = latency === 'zero' ? 0 : latency === 'slow' ? 2000 : 300 + Math.round(Math.random() * 500);
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
}

export function forcedResponse(kind: ForcedKind): Response {
  switch (kind) {
    case 'network':
      return HttpResponse.error();
    case '401':
      return errorResponse(401, 'UNAUTHENTICATED', 'Forced 401 (DevPanel)');
    case '409':
      return errorResponse(409, 'INVALID_TRANSITION', 'Forced 409 (DevPanel)', { details: { reason: 'invalid_transition' } });
    case '500':
      return errorResponse(500, 'INTERNAL', 'Forced 500 (DevPanel)');
  }
}
```
2. `test/setup.ts`: import `setLatency` from `@/mocks/lib/controls` and add `setLatency('zero');` as the last line of `beforeEach`.
**Test:** `controls.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { ANY_ENDPOINT, armForcedError, clearForcedErrors, getControls, setLatency, takeForcedError } from './controls';

describe('mock controls', () => {
  it('latency persists', () => {
    setLatency('slow');
    expect(getControls().latency).toBe('slow');
  });
  it('a forced error is consumed once', () => {
    armForcedError('auth_me', '500');
    expect(takeForcedError('auth_me')).toBe('500');
    expect(takeForcedError('auth_me')).toBeNull();
  });
  it('the endpoint-specific error wins over "any request"', () => {
    armForcedError(ANY_ENDPOINT, 'network');
    armForcedError('auth_me', '401');
    expect(takeForcedError('auth_me')).toBe('401');
    expect(takeForcedError('auth_login')).toBe('network');
    expect(takeForcedError('auth_login')).toBeNull();
  });
  it('clearForcedErrors empties the list; garbage in storage falls back to defaults', () => {
    armForcedError('auth_me', '409');
    clearForcedErrors();
    expect(getControls().forced).toEqual({});
    localStorage.setItem('fixit.mock.controls', '{not json');
    expect(getControls()).toEqual({ latency: 'normal', forced: {} });
  });
});
```
**Verify:** `pnpm --filter @fixit/web test`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): mock latency and forced-error controls (M02-T21)"`

### T22 — Mock tokens and refresh "cookie"
- [x] done
**Files:** `apps/web/src/mocks/lib/tokens.ts`, `apps/web/src/mocks/lib/tokens.test.ts`
**Context:** ARCH §4.3 (unsigned JWT-shaped `…mock`, 15-minute `exp`, refresh key `fixit.mock.refresh`), §6.2 (TTL 900). A random `jti` makes two tokens issued in the same second differ.
**Do:**
```ts
// apps/web/src/mocks/lib/tokens.ts
import { z } from 'zod';
import { Id, type AccessTokenClaims, type Role } from '@fixit/contracts';

export const ACCESS_TOKEN_TTL_SEC = 900;
export const REFRESH_KEY = 'fixit.mock.refresh';

const b64urlEncode = (s: string): string => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlDecode = (s: string): string => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
};

/** `base64url(header).base64url(claims).mock` — unsigned, mock only. */
export function issueAccessToken(userId: string, roles: Role[], now: Date = new Date()): string {
  const iat = Math.floor(now.getTime() / 1000);
  const claims: AccessTokenClaims = { sub: userId, roles, iat, exp: iat + ACCESS_TOKEN_TTL_SEC };
  const header = b64urlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = b64urlEncode(JSON.stringify({ ...claims, jti: crypto.randomUUID() }));
  return `${header}.${payload}.mock`;
}

/** Reads the payload of a mock or real JWT without verifying it (D2). */
export function decodeJwtPayload(token: string): unknown {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(b64urlDecode(part)) as unknown;
  } catch {
    return null;
  }
}

const RefreshEntry = z.object({ userId: Id });

export function setMockRefresh(userId: string): void {
  localStorage.setItem(REFRESH_KEY, JSON.stringify({ userId }));
}
export function readMockRefresh(): string | null {
  try {
    const raw = localStorage.getItem(REFRESH_KEY);
    if (!raw) return null;
    const parsed = RefreshEntry.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.userId : null;
  } catch {
    return null;
  }
}
export function clearMockRefresh(): void {
  try {
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // storage unavailable
  }
}
```
**Test:** `tokens.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { AccessTokenClaims } from '@fixit/contracts';
import { clearMockRefresh, decodeJwtPayload, issueAccessToken, readMockRefresh, setMockRefresh } from './tokens';

describe('mock tokens', () => {
  it('round-trips claims with a 15-minute exp and the .mock suffix', () => {
    const now = new Date('2026-11-22T04:30:00.000Z');
    const token = issueAccessToken('u-olivia', ['customer'], now);
    expect(token.endsWith('.mock')).toBe(true);
    const claims = AccessTokenClaims.parse(decodeJwtPayload(token));
    expect(claims).toEqual({ sub: 'u-olivia', roles: ['customer'], iat: 1795321800, exp: 1795322700 });
  });
  it('two tokens in the same second differ', () => {
    const now = new Date();
    expect(issueAccessToken('u-olivia', ['customer'], now)).not.toBe(issueAccessToken('u-olivia', ['customer'], now));
  });
  it('garbage → null payload', () => {
    expect(decodeJwtPayload('nope')).toBeNull();
    expect(decodeJwtPayload('a.%%%.b')).toBeNull();
  });
  it('refresh entry set / read / clear', () => {
    expect(readMockRefresh()).toBeNull();
    setMockRefresh('u-marcus');
    expect(readMockRefresh()).toBe('u-marcus');
    clearMockRefresh();
    expect(readMockRefresh()).toBeNull();
  });
});
```
(`1795321800` = `Date.parse('2026-11-22T04:30:00Z') / 1000`; if the assertion fails, recompute with `node -e "console.log(Date.parse('2026-11-22T04:30:00Z')/1000)"` and use that value — do not change the code.)
**Verify:** `pnpm --filter @fixit/web test`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): mock JWT-shaped tokens and refresh entry (M02-T22)"`

### T23 — `resolveActor` (identity)
- [x] done
**Files:** `apps/web/src/mocks/lib/identity.ts`
**Context:** ARCH §4.3 `identity.ts`, D2 (works with real JWT payloads; unknown user → shadow actor from claims), D5 (roles derived fresh), suspension → 401 `ACCOUNT_SUSPENDED`. Tested through the handlers in T26.
**Do:**
```ts
import { AccessTokenClaims, deriveRoles, type Role } from '@fixit/contracts';
import { db } from '../db/store';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';
import { decodeJwtPayload } from './tokens';

export interface MockActor {
  userId: string;
  roles: Role[];
}

export function isPublished(d: MockDb, userId: string): boolean {
  return Object.values(d.providers).some((p) => p.userId === userId && p.onboardingComplete);
}

export function rolesOf(d: MockDb, userId: string): Role[] {
  return deriveRoles({ isAdmin: d.users[userId]?.isAdmin ?? false, providerPublished: isPublished(d, userId) });
}

/** Bearer → actor. Mock tokens AND real JWTs (payload read, not verified — D2). No header → null. */
export function resolveActor(request: Request, now: Date = new Date()): MockActor | null {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const claims = AccessTokenClaims.safeParse(decodeJwtPayload(header.slice(7)));
  if (!claims.success || claims.data.exp * 1000 <= now.getTime()) {
    throw mockError(401, 'UNAUTHENTICATED', 'Access token missing, invalid or expired');
  }
  const d = db();
  const user = d.users[claims.data.sub];
  if (!user) return { userId: claims.data.sub, roles: claims.data.roles }; // shadow user registered against the real API
  if (user.status === 'suspended') throw mockError(401, 'ACCOUNT_SUSPENDED', 'Account suspended');
  return { userId: user.id, roles: rolesOf(d, user.id) };
}

/** Public endpoints ignore a bad or expired token instead of failing (e.g. logging in again after expiry). */
export function tryResolveActor(request: Request): MockActor | null {
  try {
    return resolveActor(request);
  } catch {
    return null;
  }
}
```
**Verify:** `pnpm --filter @fixit/web typecheck`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): mock identity resolveActor (M02-T23)"`

### T24 — `mockEndpoint` wrapper and `assertAccess`
- [x] done
**Files:** `apps/web/src/mocks/lib/endpoint.ts`, `apps/web/src/mocks/lib/endpoint.test.ts`
**Context:** ARCH §4.3 `endpoint.ts` + mock rules; §3 header (anon on non-Pub → 401; wrong role → 403; admin on U/P → 403; U on A → 403). Ownership (404) stays in each `impl`. A response that breaks its contract is a handler bug → 500 (logged), not 400.
**Do:**
```ts
// apps/web/src/mocks/lib/endpoint.ts
import { http, HttpResponse, type JsonBodyType } from 'msw';
import type { z } from 'zod';
import type { EndpointDef } from '@fixit/contracts';
import type { MockDb } from '../db/schema';
import { commit, db } from '../db/store';
import { forcedResponse, simulateLatency, takeForcedError } from './controls';
import { errorResponse, mockError, toErrorResponse } from './errors';
import { resolveActor, tryResolveActor, type MockActor } from './identity';

type SchemaOut<S> = S extends z.ZodType ? z.output<S> : undefined;
type BodyOf<E> = E extends { body: infer S } ? SchemaOut<S> : undefined;
type QueryOf<E> = E extends { query: infer S } ? SchemaOut<S> : undefined;
type ResultOf<E> = E extends { response: infer S extends z.ZodType } ? z.input<S> : void;

export interface MockCtx<E extends EndpointDef> {
  actor: MockActor | null;
  params: Record<string, string>;
  body: BodyOf<E>;
  query: QueryOf<E>;
  db: MockDb;
  now: Date;
  request: Request;
}

/** Same role semantics as the API (ARCH §3): 401 for anonymous, 403 for the wrong role. */
export function assertAccess(def: Pick<EndpointDef, 'access'>, actor: MockActor | null): void {
  if (def.access.includes('public')) return;
  if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
  const isAdmin = actor.roles.includes('admin');
  const ok =
    (def.access.includes('admin') && isAdmin) ||
    (def.access.includes('user') && !isAdmin) ||
    (def.access.includes('provider') && actor.roles.includes('provider'));
  if (!ok) throw mockError(403, 'FORBIDDEN', 'Role not allowed');
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text === '') return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw mockError(400, 'VALIDATION_FAILED', 'Body is not valid JSON');
  }
}

const toStringParams = (params: Record<string, string | readonly string[] | undefined>): Record<string, string> =>
  Object.fromEntries(Object.entries(params).flatMap(([k, v]) => (typeof v === 'string' ? [[k, v]] : [])));

export function mockEndpoint<E extends EndpointDef>(
  def: E,
  impl: (ctx: MockCtx<E>) => ResultOf<E> | Promise<ResultOf<E>>,
) {
  const route = http[def.method.toLowerCase() as Lowercase<EndpointDef['method']>] as typeof http.get;
  return route(`/api${def.path}`, async ({ request, params }) => {
    await simulateLatency();
    const forced = takeForcedError(def.id);
    if (forced) return forcedResponse(forced);
    let out: ResultOf<E>;
    try {
      const actor = def.access.includes('public') ? tryResolveActor(request) : resolveActor(request);
      assertAccess(def, actor);
      const body = (def.body ? def.body.parse(await readJson(request)) : undefined) as BodyOf<E>;
      const query = (
        def.query ? def.query.parse(Object.fromEntries(new URL(request.url).searchParams)) : undefined
      ) as QueryOf<E>;
      out = await impl({ actor, params: toStringParams(params), body, query, db: db(), now: new Date(), request });
    } catch (e) {
      return toErrorResponse(e);
    }
    commit(); // persist after every successful handler
    if (!def.response) return new HttpResponse(null, { status: 204 });
    const parsed = def.response.safeParse(out);
    if (!parsed.success) {
      console.error(`[mocks] ${def.id} response breaks its contract`, parsed.error);
      return errorResponse(500, 'INTERNAL', 'Mock response does not match the contract');
    }
    return HttpResponse.json(parsed.data as JsonBodyType);
  });
}
```
**Test:** `endpoint.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import type { Access } from '@fixit/contracts';
import { MockHttpError } from './errors';
import type { MockActor } from './identity';
import { assertAccess } from './endpoint';

const customer: MockActor = { userId: 'u-olivia', roles: ['customer'] };
const provider: MockActor = { userId: 'u-marcus', roles: ['customer', 'provider'] };
const admin: MockActor = { userId: 'u-admin', roles: ['admin'] };

const outcome = (access: readonly Access[], actor: MockActor | null): number | 'ok' => {
  try {
    assertAccess({ access }, actor);
    return 'ok';
  } catch (e) {
    if (e instanceof MockHttpError) return e.status;
    throw e;
  }
};

describe('assertAccess', () => {
  it.each([
    [['public'], null, 'ok'],
    [['public'], admin, 'ok'],
    [['user', 'admin'], null, 401],
    [['user', 'admin'], customer, 'ok'],
    [['user', 'admin'], admin, 'ok'],
    [['user'], admin, 403],
    [['user'], provider, 'ok'],
    [['provider'], customer, 403],
    [['provider'], provider, 'ok'],
    [['provider'], admin, 403],
    [['admin'], customer, 403],
    [['admin'], admin, 'ok'],
  ] as const)('%j with %j → %s', (access, actor, expected) => {
    expect(outcome(access, actor)).toBe(expected);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test`; `pnpm verify`. If `typeof http.get` cast or `JsonBodyType` import fails typecheck, STOP with a blocker.
**Commit:** `git commit -m "feat(web): mockEndpoint wrapper with registry access checks (M02-T24)"`

### T25 — `buildMe()`
- [x] done
**Files:** `apps/web/src/mocks/lib/me.ts`
**Context:** ARCH §2.5 `Me`; §6.1 "Me … roles derived fresh"; `displayNameOf` (T3), `rolesOf` (T23). Counts: `openRequestCount` = customer's pending+accepted; `pendingRequestCount` = provider's pending. `rejectionReason` only when status is `rejected` (latest rejected submission). Tested in T26.
**Do:**
```ts
import { displayNameOf, OPEN_STATUSES, type Me, type RequestStatus } from '@fixit/contracts';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';
import { rolesOf } from './identity';

const isOpen = (s: RequestStatus): boolean => (OPEN_STATUSES as readonly RequestStatus[]).includes(s);

export function buildMe(d: MockDb, userId: string): Me {
  const user = d.users[userId];
  if (!user) throw mockError(404, 'NOT_FOUND', 'User not found');
  const requests = Object.values(d.requests);
  const provider = Object.values(d.providers).find((p) => p.userId === userId);
  const lastRejection = provider
    ? Object.values(d.submissions)
        .filter((s) => s.providerId === provider.id && s.status === 'rejected')
        .sort((a, b) => b.attempt - a.attempt)[0]
    : undefined;
  return {
    id: user.id,
    fullName: user.fullName,
    displayName: displayNameOf(user.fullName),
    email: user.email,
    emailConfirmed: user.emailConfirmedAt !== null,
    mobile: user.mobile,
    authMethods: user.authMethods,
    roles: rolesOf(d, userId),
    openRequestCount: requests.filter((r) => r.customerId === userId && isOpen(r.status)).length,
    provider: provider
      ? {
          id: provider.id,
          businessName: provider.businessName,
          onboarding: { complete: provider.onboardingComplete, step: provider.onboardingStep },
          verificationStatus: provider.verificationStatus,
          reverificationReason: provider.reverificationReason,
          rejectionReason: provider.verificationStatus === 'rejected' ? (lastRejection?.rejectionReason ?? null) : null,
          paused: provider.paused,
          pendingRequestCount: requests.filter((r) => r.providerId === provider.id && r.status === 'pending').length,
        }
      : null,
  };
}
```
**Verify:** `pnpm --filter @fixit/web typecheck`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): mock buildMe (M02-T25)"`

### T26 — Auth mock handlers (login, refresh, logout, me)
- [x] done
**Files:** `apps/web/src/mocks/handlers/auth.ts`, `apps/web/src/mocks/handlers/auth.test.ts`, `apps/web/src/mocks/handlers/index.ts`
**Context:** ARCH §3.1 rows, §6.1 Login (missing user / wrong password → 401 `invalid_credentials`; suspended checked after the password → 401 `ACCOUNT_SUSPENDED`), Refresh (user must be active), Logout (204); §4.3 refresh entry. Login sets the refresh entry; logout clears it.
**Do:**
1. `handlers/auth.ts`:
```ts
import { ENDPOINTS as E, type AuthSession } from '@fixit/contracts';
import type { MockDb } from '../db/schema';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
import { rolesOf } from '../lib/identity';
import { buildMe } from '../lib/me';
import { ACCESS_TOKEN_TTL_SEC, clearMockRefresh, issueAccessToken, readMockRefresh, setMockRefresh } from '../lib/tokens';

const invalidCredentials = () =>
  mockError(401, 'UNAUTHENTICATED', 'Invalid credentials', { details: { rule: 'invalid_credentials' } });
const suspended = () => mockError(401, 'ACCOUNT_SUSPENDED', 'Account suspended');

function session(d: MockDb, userId: string, now: Date): AuthSession {
  return {
    accessToken: issueAccessToken(userId, rolesOf(d, userId), now),
    expiresIn: ACCESS_TOKEN_TTL_SEC,
    user: buildMe(d, userId),
  };
}

export const authHandlers = [
  mockEndpoint(E.auth_login, ({ body, db: d, now }) => {
    const user = Object.values(d.users).find((u) => u.email === body.email);
    if (!user || user.password === null || user.password !== body.password) throw invalidCredentials();
    if (user.status === 'suspended') throw suspended(); // after the password check (ARCH §6.1)
    setMockRefresh(user.id);
    return session(d, user.id, now);
  }),
  mockEndpoint(E.auth_refresh, ({ db: d, now }) => {
    const userId = readMockRefresh();
    const user = userId ? d.users[userId] : undefined;
    if (!user) {
      clearMockRefresh();
      throw mockError(401, 'UNAUTHENTICATED', 'No refresh session');
    }
    if (user.status === 'suspended') {
      clearMockRefresh();
      throw suspended();
    }
    return session(d, user.id, now);
  }),
  mockEndpoint(E.auth_logout, () => {
    clearMockRefresh();
  }),
  mockEndpoint(E.auth_me, ({ actor, db: d }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required'); // unreachable: assertAccess ran
    return buildMe(d, actor.userId);
  }),
];
```
2. `handlers/index.ts`: `import { authHandlers } from './auth';` and set `auth: authHandlers`.
**Test:** `handlers/auth.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { AuthSession, ErrorEnvelope, Me } from '@fixit/contracts';
import { DEMO_PASSWORD } from '@fixit/fixtures';
import { db } from '../db/store';
import { issueAccessToken } from '../lib/tokens';

const call = (path: string, init: RequestInit = {}) => fetch(new URL(`/api${path}`, window.location.origin), init);
const post = (body: unknown): RequestInit => ({
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const bearer = (token: string): RequestInit => ({ headers: { Authorization: `Bearer ${token}` } });
const login = async (email: string, password = DEMO_PASSWORD) => call('/auth/login', post({ email, password }));
const envelope = async (res: Response) => ErrorEnvelope.parse(await res.json()).error;

describe('POST /auth/login', () => {
  it.each([
    ['olivia@fixit.test', ['customer']],
    ['nimal@fixit.test', ['customer']],
    ['marcus@fixit.test', ['customer', 'provider']],
    ['hank@fixit.test', ['customer', 'provider']],
    ['kasun@fixit.test', ['customer']],
    ['admin@fixit.test', ['admin']],
  ])('%s → roles %j', async (email, roles) => {
    const res = await login(email);
    expect(res.status).toBe(200);
    const s = AuthSession.parse(await res.json());
    expect([s.user.email, s.user.roles, s.expiresIn]).toEqual([email, roles, 900]);
  });
  it('is case-insensitive on email', async () => {
    expect((await login('  OLIVIA@Fixit.test ')).status).toBe(200);
  });
  it.each([['olivia@fixit.test', 'wrong-pass'], ['nobody@fixit.test', DEMO_PASSWORD]])(
    '%s / %s → 401 invalid_credentials',
    async (email, password) => {
      const res = await login(email, password);
      expect(res.status).toBe(401);
      const e = await envelope(res);
      expect([e.code, e.details?.rule]).toEqual(['UNAUTHENTICATED', 'invalid_credentials']);
    },
  );
  it('empty body → 400 with SPEC field messages', async () => {
    const res = await call('/auth/login', post({ email: '', password: '' }));
    expect(res.status).toBe(400);
    expect((await envelope(res)).fieldErrors).toEqual({
      email: ['Enter your email address.'],
      password: ['Enter your password.'],
    });
  });
  it('suspended → 401 ACCOUNT_SUSPENDED', async () => {
    const olivia = db().users['u-olivia'];
    if (olivia) olivia.status = 'suspended';
    const res = await login('olivia@fixit.test');
    expect(res.status).toBe(401);
    expect((await envelope(res)).code).toBe('ACCOUNT_SUSPENDED');
  });
  it('Me carries counts and provider state', async () => {
    const olivia = AuthSession.parse(await (await login('olivia@fixit.test')).json()).user;
    expect([olivia.displayName, olivia.openRequestCount, olivia.provider]).toEqual(['Olivia M.', 1, null]);
    const marcus = AuthSession.parse(await (await login('marcus@fixit.test')).json()).user;
    expect(marcus.provider).toMatchObject({ id: 'p01', verificationStatus: 'verified', pendingRequestCount: 3 });
    const kasun = AuthSession.parse(await (await login('kasun@fixit.test')).json()).user;
    expect(kasun.provider?.onboarding).toEqual({ complete: false, step: 3 });
  });
});

describe('POST /auth/refresh and /auth/logout', () => {
  it('no refresh session → 401', async () => {
    const res = await call('/auth/refresh', { method: 'POST' });
    expect(res.status).toBe(401);
  });
  it('after login → new session for the same user; after logout → 401', async () => {
    await login('marcus@fixit.test');
    const res = await call('/auth/refresh', { method: 'POST' });
    expect(AuthSession.parse(await res.json()).user.email).toBe('marcus@fixit.test');
    expect((await call('/auth/logout', { method: 'POST' })).status).toBe(204);
    expect((await call('/auth/refresh', { method: 'POST' })).status).toBe(401);
  });
  it('suspended user → 401 ACCOUNT_SUSPENDED', async () => {
    await login('olivia@fixit.test');
    const olivia = db().users['u-olivia'];
    if (olivia) olivia.status = 'suspended';
    const res = await call('/auth/refresh', { method: 'POST' });
    expect((await envelope(res)).code).toBe('ACCOUNT_SUSPENDED');
  });
});

describe('GET /auth/me', () => {
  it('anonymous → 401', async () => {
    expect((await call('/auth/me')).status).toBe(401);
  });
  it('garbage or expired token → 401', async () => {
    expect((await call('/auth/me', bearer('nope'))).status).toBe(401);
    const expired = issueAccessToken('u-olivia', ['customer'], new Date(Date.now() - 20 * 60_000));
    expect((await call('/auth/me', bearer(expired))).status).toBe(401);
  });
  it('valid token → Me', async () => {
    const res = await call('/auth/me', bearer(issueAccessToken('u-olivia', ['customer'])));
    expect(Me.parse(await res.json()).email).toBe('olivia@fixit.test');
  });
  it('admin may call it (access user, admin)', async () => {
    const res = await call('/auth/me', bearer(issueAccessToken('u-admin', ['admin'])));
    expect(Me.parse(await res.json()).roles).toEqual(['admin']);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): auth mock handlers login, refresh, logout, me (M02-T26)"`

### T27 — Auth store
- [x] done
**Files:** `apps/web/src/lib/auth-store.ts`, `apps/web/src/lib/auth-store.test.ts`, `apps/web/src/test/setup.ts`
**Context:** ARCH §4.1 paragraph after the snippet (`{ accessToken, me, status: 'booting'|'guest'|'signed-in', signOutReason }`, `useSyncExternalStore`); §6.2 (access token in memory only). Query-cache clearing is wired in T29 by subscribing to this store (no import cycle). Router redirects are M03.
**Do:**
1. `lib/auth-store.ts`:
```ts
import { useSyncExternalStore } from 'react';
import type { AuthSession, Me } from '@fixit/contracts';

export type AuthStatus = 'booting' | 'guest' | 'signed-in';
export type SignOutReason = 'expired' | 'suspended' | 'logout';
export interface AuthState {
  status: AuthStatus;
  accessToken: string | null; // memory only (ARCH §6.2)
  me: Me | null;
  signOutReason: SignOutReason | null;
}

const INITIAL: AuthState = { status: 'booting', accessToken: null, me: null, signOutReason: null };
let state: AuthState = INITIAL;
const listeners = new Set<() => void>();

function set(next: AuthState): void {
  state = next;
  for (const l of listeners) l();
}

export const authStore = {
  getState: (): AuthState => state,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  accessToken: (): string | null => state.accessToken,
  setSession: (s: AuthSession): void => {
    set({ status: 'signed-in', accessToken: s.accessToken, me: s.user, signOutReason: null });
  },
  setMe: (me: Me): void => {
    if (state.status === 'signed-in') set({ ...state, me });
  },
  setGuest: (): void => {
    set({ status: 'guest', accessToken: null, me: null, signOutReason: null });
  },
  signOut: (reason: SignOutReason): void => {
    set({ status: 'guest', accessToken: null, me: null, signOutReason: reason });
  },
  /** Tests only. */
  reset: (): void => {
    set(INITIAL);
  },
};

export function useAuth(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState);
}
```
2. `test/setup.ts`: import `authStore` from `@/lib/auth-store`; add `authStore.reset();` at the start of `beforeEach`.
**Test:** `auth-store.test.ts`
```ts
import { describe, expect, it, vi } from 'vitest';
import { db } from '@/mocks/db/store';
import { buildMe } from '@/mocks/lib/me';
import { authStore } from './auth-store';

const session = () => ({ accessToken: 't0', expiresIn: 900, user: buildMe(db(), 'u-olivia') });

describe('authStore', () => {
  it('starts booting', () => {
    expect(authStore.getState().status).toBe('booting');
  });
  it('setSession → signed-in with token and me; listeners are notified', () => {
    const listener = vi.fn();
    const off = authStore.subscribe(listener);
    authStore.setSession(session());
    expect(authStore.getState()).toMatchObject({ status: 'signed-in', accessToken: 't0', signOutReason: null });
    expect(authStore.getState().me?.email).toBe('olivia@fixit.test');
    expect(listener).toHaveBeenCalledTimes(1);
    off();
  });
  it('signOut(reason) clears the session and keeps the reason', () => {
    authStore.setSession(session());
    authStore.signOut('expired');
    expect(authStore.getState()).toEqual({ status: 'guest', accessToken: null, me: null, signOutReason: 'expired' });
  });
  it('setMe is ignored for a guest', () => {
    authStore.setGuest();
    authStore.setMe(session().user);
    expect(authStore.getState().me).toBeNull();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): auth store (M02-T27)"`

### T28 — `http()` client with refresh single-flight (AC3, AC7)
- [x] done
**Files:** `apps/web/src/lib/http.ts`, `apps/web/src/test/sign-in.ts`, `apps/web/src/lib/http.test.ts`
**Context:** ARCH §4.1 snippet with planner decisions **D-a** (which 401s refresh) and **D-f** (absolute URL). Sign-out reason `suspended` when the refresh failed with `ACCOUNT_SUSPENDED`, else `expired`. `signInAs(persona)` from ARCH §9.4.
**Do:**
1. `lib/http.ts`:
```ts
import type { z } from 'zod';
import { AuthSession, ErrorEnvelope, type EndpointDef, type ErrorCode } from '@fixit/contracts';
import { authStore } from './auth-store';

export class ApiError extends Error {
  override readonly name = 'ApiError';
  constructor(
    readonly status: number,
    readonly code: ErrorCode | 'NETWORK',
    message: string,
    readonly envelope: ErrorEnvelope['error'] | undefined = undefined,
  ) {
    super(message);
  }
  get rule() {
    return this.envelope?.details?.rule;
  }
  get fieldErrors() {
    return this.envelope?.fieldErrors;
  }
}

type QueryValue = string | number | boolean | readonly string[] | undefined;
export type Query = Record<string, QueryValue>;
export interface HttpOpts<S extends z.ZodType | undefined> {
  method?: EndpointDef['method'];
  query?: Query;
  body?: unknown;
  form?: FormData;
  schema: S;
  signal?: AbortSignal;
}
type Out<S> = S extends z.ZodType ? z.output<S> : undefined;

/** D-a: a 401 from these is an answer (bad credentials, no session), not an expired access token. */
const NO_REFRESH_PATHS = new Set(['/auth/login', '/auth/admin/login', '/auth/refresh', '/auth/logout']);

/** D-f: absolute URL so Node fetch (Vitest) and the browser behave the same. */
export function apiUrl(path: string, query: Query = {}): string {
  const url = new URL(`/api${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    if (typeof value === 'object') for (const v of value) url.searchParams.append(key, v);
    else url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** '/me/requests/:ref' + { ref } → '/me/requests/FX-2061' */
export function pathOf(def: Pick<EndpointDef, 'path'>, params: Record<string, string> = {}): string {
  return def.path.replace(/:([A-Za-z]+)/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`pathOf: missing :${name} for ${def.path}`);
    return encodeURIComponent(value);
  });
}

export async function http<S extends z.ZodType | undefined>(path: string, opts: HttpOpts<S>): Promise<Out<S>> {
  const hadToken = authStore.accessToken() !== null;
  let res = await send(path, opts);
  if (res.status === 401 && hadToken && !NO_REFRESH_PATHS.has(path)) {
    if (await refreshOnce()) res = await send(path, opts); // exactly one retry
    else authStore.signOut(lastRefreshFailure === 'ACCOUNT_SUSPENDED' ? 'suspended' : 'expired');
  }
  if (!res.ok) throw await toApiError(res);
  if (opts.schema === undefined || res.status === 204) return undefined as Out<S>;
  return opts.schema.parse(await res.json()) as Out<S>; // contract mismatch → ZodError → S41 (M03)
}

async function send(path: string, o: HttpOpts<z.ZodType | undefined>): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json' });
  const token = authStore.accessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let body: BodyInit | null = null;
  if (o.form) body = o.form;
  else if (o.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(o.body);
  }
  try {
    return await fetch(apiUrl(path, o.query), {
      method: o.method ?? 'GET',
      headers,
      body,
      signal: o.signal ?? null,
      credentials: 'same-origin',
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'NETWORK', 'Network error');
  }
}

async function readEnvelope(res: Response): Promise<ErrorEnvelope['error'] | undefined> {
  try {
    const parsed = ErrorEnvelope.safeParse(await res.json());
    return parsed.success ? parsed.data.error : undefined;
  } catch {
    return undefined;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  const env = await readEnvelope(res);
  return env
    ? new ApiError(res.status, env.code, env.message, env)
    : new ApiError(res.status, 'INTERNAL', `HTTP ${String(res.status)}`);
}

let refreshing: Promise<boolean> | null = null;
let lastRefreshFailure: ErrorCode | 'NETWORK' | null = null;

/** Single-flight: concurrent 401s share one refresh. Also used once at boot to restore the session. */
export function refreshOnce(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(apiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) {
        lastRefreshFailure = (await readEnvelope(res))?.code ?? 'INTERNAL';
        return false;
      }
      authStore.setSession(AuthSession.parse(await res.json()));
      lastRefreshFailure = null;
      return true;
    } catch {
      lastRefreshFailure = 'NETWORK';
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}
```
2. `test/sign-in.ts`:
```ts
import type { AuthSession } from '@fixit/contracts';
import { DEMO_PERSONAS, type PersonaKey } from '@fixit/fixtures';
import { authStore } from '@/lib/auth-store';
import { db } from '@/mocks/db/store';
import { rolesOf } from '@/mocks/lib/identity';
import { buildMe } from '@/mocks/lib/me';
import { ACCESS_TOKEN_TTL_SEC, issueAccessToken, setMockRefresh } from '@/mocks/lib/tokens';

/** ARCH §9.4: puts a mock session in authStore (and the mock refresh entry) without an HTTP round-trip. */
export function signInAs(persona: PersonaKey): AuthSession {
  const p = DEMO_PERSONAS.find((x) => x.key === persona);
  if (!p) throw new Error(`unknown persona ${persona}`);
  const d = db();
  const session: AuthSession = {
    accessToken: issueAccessToken(p.userId, rolesOf(d, p.userId)),
    expiresIn: ACCESS_TOKEN_TTL_SEC,
    user: buildMe(d, p.userId),
  };
  setMockRefresh(p.userId);
  authStore.setSession(session);
  return session;
}
```
**Test:** `lib/http.test.ts`
```ts
import { http as mswHttp, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { ENDPOINTS, LoginBody } from '@fixit/contracts';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { server } from '@/mocks/node';
import { signInAs } from '@/test/sign-in';
import { authStore } from './auth-store';
import { ApiError, http, pathOf } from './http';

const getMe = () => http('/auth/me', { schema: ENDPOINTS.auth_me.response });
const envelope = (code: string, extra: object = {}) => ({ error: { code, message: code, requestId: 'test', ...extra } });
const countRefreshes = () => {
  const counter = { n: 0 };
  server.events.on('request:start', ({ request }) => {
    if (new URL(request.url).pathname === '/api/auth/refresh') counter.n += 1;
  });
  return counter;
};
const caught = async (p: Promise<unknown>): Promise<unknown> => p.then(() => null, (e: unknown) => e);

describe('http()', () => {
  it('parses the response with the endpoint schema', async () => {
    signInAs('customer');
    expect((await getMe()).email).toBe('olivia@fixit.test');
  });
  it('a contract mismatch throws ZodError', async () => {
    signInAs('customer');
    server.use(mswHttp.get('/api/auth/me', () => HttpResponse.json({ nope: true })));
    expect(await caught(getMe())).toBeInstanceOf(ZodError);
  });
  it('a non-2xx ErrorEnvelope becomes ApiError with code, rule and fieldErrors', async () => {
    signInAs('customer');
    const fieldErrors = { mobile: ['Enter a Sri Lankan mobile number, like 077 123 4567.'] };
    server.use(
      mswHttp.get('/api/auth/me', () =>
        HttpResponse.json(envelope('RULE_VIOLATION', { details: { rule: 'open_limit_reached' }, fieldErrors }), { status: 422 }),
      ),
    );
    const err = await caught(getMe());
    expect(err).toBeInstanceOf(ApiError);
    if (!(err instanceof ApiError)) return;
    expect([err.status, err.code, err.rule, err.fieldErrors]).toEqual([422, 'RULE_VIOLATION', 'open_limit_reached', fieldErrors]);
  });
  it('network failure → ApiError(0, NETWORK)', async () => {
    signInAs('customer');
    server.use(mswHttp.get('/api/auth/me', () => HttpResponse.error()));
    const err = await caught(getMe());
    expect(err).toBeInstanceOf(ApiError);
    if (err instanceof ApiError) expect([err.status, err.code]).toEqual([0, 'NETWORK']);
  });
  it('401 → refresh once → retry succeeds (AC3)', async () => {
    signInAs('customer');
    const refreshes = countRefreshes();
    armForcedError('auth_me', '401');
    expect((await getMe()).email).toBe('olivia@fixit.test');
    expect(refreshes.n).toBe(1);
    expect(authStore.getState().status).toBe('signed-in');
  });
  it('401 and refresh fails → signed out with reason expired (AC3)', async () => {
    signInAs('customer');
    armForcedError('auth_me', '401');
    armForcedError('auth_refresh', '401');
    const err = await caught(getMe());
    expect(err).toBeInstanceOf(ApiError);
    expect(authStore.getState()).toMatchObject({ status: 'guest', accessToken: null, signOutReason: 'expired' });
  });
  it('suspended during refresh → reason suspended', async () => {
    signInAs('customer');
    const olivia = db().users['u-olivia'];
    if (olivia) olivia.status = 'suspended';
    await caught(getMe());
    expect(authStore.getState().signOutReason).toBe('suspended');
  });
  it('concurrent 401s share one refresh (AC7)', async () => {
    const first = signInAs('customer');
    const refreshes = countRefreshes();
    server.use(
      mswHttp.get('/api/auth/me', ({ request }) =>
        request.headers.get('Authorization') === `Bearer ${first.accessToken}`
          ? HttpResponse.json(envelope('UNAUTHENTICATED'), { status: 401 })
          : undefined, // fall through to the real mock handler
      ),
    );
    const results = await Promise.all([getMe(), getMe(), getMe()]);
    expect(results.map((m) => m.email)).toEqual(Array(3).fill('olivia@fixit.test'));
    expect(refreshes.n).toBe(1);
  });
  it('a 401 from /auth/login never triggers a refresh', async () => {
    signInAs('customer');
    const refreshes = countRefreshes();
    const body: LoginBody = { email: 'olivia@fixit.test', password: 'wrong-pass' };
    const err = await caught(http('/auth/login', { method: 'POST', body, schema: ENDPOINTS.auth_login.response }));
    expect(err).toBeInstanceOf(ApiError);
    if (err instanceof ApiError) expect(err.rule).toBe('invalid_credentials');
    expect(refreshes.n).toBe(0);
    expect(authStore.getState().status).toBe('signed-in');
  });
});

describe('pathOf', () => {
  it('fills and encodes params; throws when one is missing', () => {
    expect(pathOf({ path: '/me/requests/:ref' }, { ref: 'FX-2061' })).toBe('/me/requests/FX-2061');
    expect(pathOf({ path: '/x/:id' }, { id: 'a b' })).toBe('/x/a%20b');
    expect(() => pathOf({ path: '/x/:id' })).toThrow('missing :id');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test` → all pass (AC3 + AC7 proven); `pnpm verify`.
**Commit:** `git commit -m "feat(web): http client with ApiError and single-flight refresh (M02-T28)"`

### T29 — Query keys, QueryClient defaults, AppProviders
- [x] done
**Files:** `apps/web/src/lib/query-keys.ts`, `apps/web/src/app/query-client.ts`, `apps/web/src/app/query-client.test.ts`, `apps/web/src/app/providers.tsx`
**Context:** ARCH §4.2 (`qk`, first segment = domain; defaults `staleTime 30_000`, retry rule, `refetchOnWindowFocus: false`, mutations never retry); §4.1 (`signOut` clears the query cache). Only `qk.me` now — later milestones add their keys. `providers.tsx` gets Toaster/Tooltip in M03.
**Do:**
1. `lib/query-keys.ts`:
```ts
/** First segment = mock/API domain, so invalidation can be domain-wide (ARCH §4.2). Milestones add their keys. */
export const qk = {
  me: ['auth', 'me'] as const,
};
```
2. `app/query-client.ts`:
```ts
import { QueryClient } from '@tanstack/react-query';
import { authStore } from '@/lib/auth-store';
import { ApiError } from '@/lib/http';

export const shouldRetry = (failureCount: number, error: unknown): boolean =>
  failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500);

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

export const queryClient = createQueryClient();

// Cached data belongs to one user: clear it whenever the signed-in user changes (sign-out included).
let lastUserId: string | null = null;
authStore.subscribe(() => {
  const id = authStore.getState().me?.id ?? null;
  if (id !== lastUserId) {
    lastUserId = id;
    queryClient.clear();
  }
});
```
3. `app/providers.tsx`:
```tsx
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```
**Test:** `app/query-client.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/http';
import { authStore } from '@/lib/auth-store';
import { signInAs } from '@/test/sign-in';
import { queryClient, shouldRetry } from './query-client';

describe('query client', () => {
  it('retries a network/5xx error once, never a 4xx', () => {
    expect(shouldRetry(0, new ApiError(0, 'NETWORK', 'x'))).toBe(true);
    expect(shouldRetry(1, new ApiError(500, 'INTERNAL', 'x'))).toBe(false);
    expect(shouldRetry(0, new ApiError(404, 'NOT_FOUND', 'x'))).toBe(false);
  });
  it('sign-out clears cached data', () => {
    signInAs('customer');
    queryClient.setQueryData(['auth', 'me'], { cached: true });
    authStore.signOut('logout');
    expect(queryClient.getQueryData(['auth', 'me'])).toBeUndefined();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): query keys, QueryClient defaults and AppProviders (M02-T29)"`

### T30 — Auth API calls and `bootstrapAuth`
- [x] done
**Files:** `apps/web/src/features/auth/api.ts`, `apps/web/src/features/auth/api.test.ts`, `apps/web/src/lib/bootstrap-auth.ts`, `apps/web/src/lib/bootstrap-auth.test.ts`
**Context:** ARCH §4.2 (api.ts uses `ENDPOINTS` path + schemas), §4.1 ("Logout calls `POST /auth/logout` first"), §4.4 main.tsx (`bootstrapAuth`: refreshOnce → me, or guest). AC2.
**Do:**
1. `features/auth/api.ts`:
```ts
import { ENDPOINTS as E, type AuthSession, type LoginBody, type Me } from '@fixit/contracts';
import { authStore } from '@/lib/auth-store';
import { http, pathOf } from '@/lib/http';

export const login = (body: LoginBody): Promise<AuthSession> =>
  http(pathOf(E.auth_login), { method: E.auth_login.method, body, schema: E.auth_login.response });

export const fetchMe = (): Promise<Me> => http(pathOf(E.auth_me), { schema: E.auth_me.response });

/** Login and store the session (used by the DevPanel now, S5 in M04). */
export async function signIn(body: LoginBody): Promise<AuthSession> {
  const session = await login(body);
  authStore.setSession(session);
  return session;
}

/** A4: revoke the refresh session first, then forget the local one even if the call fails. */
export async function logout(): Promise<void> {
  try {
    await http(pathOf(E.auth_logout), { method: E.auth_logout.method, schema: undefined });
  } finally {
    authStore.signOut('logout');
  }
}
```
2. `lib/bootstrap-auth.ts`:
```ts
import { authStore } from './auth-store';
import { refreshOnce } from './http';

/** Boot: restore the session from the refresh cookie (mock: `fixit.mock.refresh`), else guest. */
export async function bootstrapAuth(): Promise<void> {
  if (!(await refreshOnce())) authStore.setGuest();
}
```
**Test:** `features/auth/api.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD } from '@fixit/fixtures';
import { authStore } from '@/lib/auth-store';
import { ApiError, refreshOnce } from '@/lib/http';
import { logout, signIn } from './api';

describe('auth api', () => {
  it('signIn stores the session', async () => {
    await signIn({ email: 'marcus@fixit.test', password: DEMO_PASSWORD });
    expect(authStore.getState().me?.roles).toEqual(['customer', 'provider']);
  });
  it('signIn with a wrong password → ApiError invalid_credentials, still guest', async () => {
    authStore.setGuest();
    const err = await signIn({ email: 'olivia@fixit.test', password: 'wrong-pass' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    if (err instanceof ApiError) expect(err.rule).toBe('invalid_credentials');
    expect(authStore.getState().status).toBe('guest');
  });
  it('logout signs out and kills the refresh session', async () => {
    await signIn({ email: 'olivia@fixit.test', password: DEMO_PASSWORD });
    await logout();
    expect(authStore.getState()).toMatchObject({ status: 'guest', signOutReason: 'logout' });
    expect(await refreshOnce()).toBe(false);
  });
});
```
`lib/bootstrap-auth.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { setMockRefresh } from '@/mocks/lib/tokens';
import { authStore } from './auth-store';
import { bootstrapAuth } from './bootstrap-auth';

describe('bootstrapAuth', () => {
  it('no refresh session → guest', async () => {
    await bootstrapAuth();
    expect(authStore.getState()).toMatchObject({ status: 'guest', signOutReason: null });
  });
  it('refresh session → signed in as that user (AC2 reload)', async () => {
    setMockRefresh('u-kasun');
    await bootstrapAuth();
    expect(authStore.getState().me?.email).toBe('kasun@fixit.test');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): auth api calls and bootstrapAuth (M02-T30)"`

### T31 — `useMe` hook and test render helpers
- [x] done
**Files:** `apps/web/src/features/auth/hooks.ts`, `apps/web/src/features/auth/hooks.test.tsx`, `apps/web/src/test/render.tsx`
**Context:** ARCH §4.2 hooks pattern; §9.4 `render.tsx` (fresh QueryClient, retry off; the memory router is added in M03).
**Do:**
1. `test/render.tsx`:
```tsx
import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

export function createWrapper(client: QueryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/** Router wrapper arrives in M03. */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  return { queryClient, ...render(ui, { wrapper: createWrapper(queryClient) }) };
}
```
2. `features/auth/hooks.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { authStore, useAuth } from '@/lib/auth-store';
import { qk } from '@/lib/query-keys';
import { fetchMe } from './api';

/** GET /auth/me while signed in; keeps authStore.me fresh. */
export function useMe() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      const me = await fetchMe();
      authStore.setMe(me);
      return me;
    },
    enabled: status === 'signed-in',
  });
}
```
**Test:** `hooks.test.tsx`
```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { authStore } from '@/lib/auth-store';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useMe } from './hooks';

describe('useMe', () => {
  it('fetches Me when signed in', async () => {
    signInAs('provider');
    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.data?.email).toBe('marcus@fixit.test');
    });
  });
  it('stays idle for a guest', () => {
    authStore.setGuest();
    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): useMe hook and test render helpers (M02-T31)"`

### T32 — `expireDue(db, now)`
- [x] done
**Files:** `apps/web/src/mocks/db/expire.ts`, `apps/web/src/mocks/db/expire.test.ts`
**Context:** ARCH §4.3 "Expiry: the `requests` handlers run `expireDue(db, now)`" (called from M08 on); PRODUCT §6.1 (pending → expired by system); `assertTransition`, `toMachineRequest` (T6).
**Do:**
```ts
// apps/web/src/mocks/db/expire.ts
import { assertTransition, toMachineRequest } from '@fixit/contracts';
import type { MockDb } from './schema';

/** Mock stand-in for the expiry cron: pending requests at/after expiresAt → expired (actor system). Returns the count. */
export function expireDue(d: MockDb, now: Date): number {
  let count = 0;
  for (const r of Object.values(d.requests)) {
    if (r.status !== 'pending' || new Date(r.expiresAt).getTime() > now.getTime()) continue;
    assertTransition(toMachineRequest(r), 'expired', { kind: 'system' }, now);
    const at = now.toISOString();
    r.status = 'expired';
    r.closedBy = 'system';
    r.updatedAt = at;
    r.events.push({ status: 'expired', at, actor: 'system', actorUserId: null, reason: null });
    count += 1;
  }
  return count;
}
```
**Test:** `expire.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { FIXED_NOW } from '@/test/fixed-now';
import { db } from './store';
import { expireDue } from './expire';

describe('expireDue', () => {
  it('nothing is due at seed time', () => {
    expect(expireDue(db(), FIXED_NOW)).toBe(0);
  });
  it('expires a lapsed pending request and records a system event; others untouched', () => {
    const d = db();
    const lapsed = d.requests['r-FX-2061'];
    if (!lapsed) throw new Error('fixture missing');
    lapsed.expiresAt = new Date(FIXED_NOW.getTime() - 1000).toISOString();
    expect(expireDue(d, FIXED_NOW)).toBe(1);
    expect(lapsed.status).toBe('expired');
    expect(lapsed.closedBy).toBe('system');
    expect(lapsed.events.at(-1)).toMatchObject({ status: 'expired', actor: 'system' });
    expect(d.requests['r-FX-2059']?.status).toBe('pending');
  });
  it('exactly at expiresAt counts as due', () => {
    const d = db();
    const r = d.requests['r-FX-2058'];
    if (!r) throw new Error('fixture missing');
    r.expiresAt = FIXED_NOW.toISOString();
    expect(expireDue(d, FIXED_NOW)).toBe(1);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test`; `pnpm verify`.
**Commit:** `git commit -m "feat(web): mock expireDue helper (M02-T32)"`

### T33 — `enableMocks()`, `main.tsx` boot order, `dev:mock` script
- [x] done
**Files:** `apps/web/src/mocks/enable.ts`, `apps/web/src/vite-env.d.ts`, `apps/web/src/main.tsx`, `apps/web/.env.mock`, `apps/web/package.json`, `package.json`
**Context:** ARCH §4.4 (`enableMocks`, boot order), D23 (never in production — everything msw-related sits behind `if (import.meta.env.DEV)` so Rollup drops it), milestone "Scripts `dev:mock` (`VITE_MOCK_DOMAINS=all`)". `activeMockDomains` is exposed as a function (a mutable `export let` is avoided).
**Do:**
1. `mocks/enable.ts`:
```ts
import { parseMockDomains, type MockDomain } from './domains';

let active: readonly MockDomain[] = [];
export const activeMockDomains = (): readonly MockDomain[] => active;
export const isMocked = (d: MockDomain): boolean => active.includes(d);

/** Registers only the listed domains' handlers; unlisted → bypass → Vite proxy → API (D23). */
export async function enableMocks(): Promise<void> {
  if (import.meta.env.DEV) {
    const domains = parseMockDomains(import.meta.env.VITE_MOCK_DOMAINS);
    if (domains.length === 0) return;
    const [{ setupWorker }, { handlersByDomain }] = await Promise.all([import('msw/browser'), import('./handlers')]);
    const worker = setupWorker(...domains.flatMap((d) => handlersByDomain[d]));
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
    active = domains;
  }
}
```
2. `src/vite-env.d.ts` append:
```ts
interface ImportMetaEnv {
  readonly VITE_MOCK_DOMAINS?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```
3. `src/main.tsx`:
```tsx
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';
import { PlaceholderPage } from '@/app/placeholder-page';
import { AppProviders } from '@/app/providers';
import { bootstrapAuth } from '@/lib/bootstrap-auth';
import { enableMocks } from '@/mocks/enable';

// Dev only: the branch is removed from production builds, so the DevPanel chunk never ships.
const DevPanel = import.meta.env.DEV
  ? lazy(() => import('@/mocks/dev/DevPanel').then((m) => ({ default: m.DevPanel })))
  : null;

async function boot(rootEl: HTMLElement): Promise<void> {
  await enableMocks();
  await bootstrapAuth();
  createRoot(rootEl).render(
    <StrictMode>
      <AppProviders>
        <PlaceholderPage />
        {DevPanel && (
          <Suspense fallback={null}>
            <DevPanel />
          </Suspense>
        )}
      </AppProviders>
    </StrictMode>,
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root is missing from index.html');
boot(rootEl).catch((e: unknown) => {
  console.error(e);
  rootEl.textContent = e instanceof Error ? e.message : String(e);
});
```
(`@/mocks/dev/DevPanel` is created in T34. To keep this task's `pnpm verify` green, create a temporary `apps/web/src/mocks/dev/DevPanel.tsx` containing `export function DevPanel() { return null; }`; T34 replaces it.)
4. `apps/web/.env.mock`: `VITE_MOCK_DOMAINS=all`
5. `apps/web/package.json` scripts: add `"dev:mock": "vite --mode mock"`.
6. Root `package.json`: `"dev:mock": "pnpm --filter @fixit/web dev:mock"`.
**Verify:** `pnpm verify` green; `pnpm build` then `grep -rl "setupWorker\|mockServiceWorker\|DevPanel" apps/web/dist` → no output; `pnpm dev:mock`, open http://localhost:5173 → page renders, DevTools console shows no errors and Application → Service Workers lists `mockServiceWorker.js`.
**Commit:** `git commit -m "feat(web): enableMocks, boot order and dev:mock script (M02-T33)"`

### T34 — DevPanel: shell, session and "Sign in as"
- [x] done
**Files:** `apps/web/src/components/ui/sheet.tsx`, `apps/web/src/components/ui/button.tsx` (shadcn), `apps/web/src/mocks/dev/DevPanel.tsx`
**Context:** ARCH §4.5 (floating 44×44 button bottom-left, sheet, persona list, works with mocked or real `auth` via `POST /auth/login`); D-b (Admin uses `/auth/login`); AC1. Tokens only; touch targets ≥ 44px; visible focus ring (shadcn button has it). 390px: sheet is full width; 1440px: `sm:max-w-sm`.
**Do:**
1. `cd apps/web && pnpm dlx shadcn@latest add sheet button` (accept defaults; files land in `src/components/ui/`). Do not edit them.
2. Replace `mocks/dev/DevPanel.tsx`:
```tsx
import { useState, type ReactNode } from 'react';
import { Bug } from 'lucide-react';
import { DEMO_PASSWORD, DEMO_PERSONAS, type PersonaKey } from '@fixit/fixtures';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { logout, signIn } from '@/features/auth/api';
import { useAuth } from '@/lib/auth-store';
import { ApiError } from '@/lib/http';

export function DevSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-border flex flex-col gap-2 border-t pt-4">
      <h3 className="text-label text-text font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function SessionSection() {
  const auth = useAuth();
  const [busy, setBusy] = useState<PersonaKey | 'logout' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: PersonaKey | 'logout', action: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? `Failed: ${e.code}${e.rule ? ` (${e.rule})` : ''}` : 'Failed: unexpected error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <DevSection title="Session">
        <p className="text-body-sm text-text-muted break-words">
          {auth.status === 'signed-in' && auth.me
            ? `Signed in as ${auth.me.email}, roles: ${auth.me.roles.join(', ')}`
            : 'Guest'}
        </p>
        <Button
          variant="outline"
          className="h-11"
          disabled={auth.status !== 'signed-in' || busy !== null}
          onClick={() => void run('logout', logout)}
        >
          {busy === 'logout' ? 'Logging out…' : 'Log out'}
        </Button>
      </DevSection>
      <DevSection title="Sign in as">
        {DEMO_PERSONAS.map((p) => (
          <Button
            key={p.key}
            variant="outline"
            className="h-auto min-h-11 justify-start text-left whitespace-normal"
            aria-label={`Sign in as ${p.label}`}
            disabled={busy !== null}
            onClick={() => void run(p.key, () => signIn({ email: p.email, password: DEMO_PASSWORD }))}
          >
            {busy === p.key ? 'Signing in…' : p.label}
          </Button>
        ))}
        {error && (
          <p role="alert" className="text-body-sm text-danger-text">
            {error}
          </p>
        )}
      </DevSection>
    </>
  );
}

/** Dev only (ARCH §4.5). Rendered from main.tsx behind import.meta.env.DEV. */
export function DevPanel() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open dev panel"
          className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-ring shadow-float fixed bottom-4 left-4 z-50 flex size-11 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Bug className="size-5" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Dev panel</SheetTitle>
          <SheetDescription>Development only. Not in production builds.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <SessionSection />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```
States: guest → "Guest", Log out disabled; signing in → that button reads `Signing in…`, all persona buttons disabled; failure → `Failed: UNAUTHENTICATED (invalid_credentials)` in `text-danger-text` with `role="alert"`; signed in → `Signed in as {email}, roles: {roles}`.
**Verify:** `pnpm verify`; `pnpm dev:mock` → bottom-left round button opens a left sheet; each of the 6 buttons signs in (status line updates).
**Commit:** `git commit -m "feat(web): DevPanel with persona sign-in and logout (M02-T34)"`

### T35 — DevPanel: mocked domains, reset, latency, forced errors, last email link
- [ ] done
**Files:** `apps/web/src/mocks/dev/DevPanel.tsx`
**Context:** ARCH §4.5 remaining sections; AC3 (manual part), AC4. "Reset demo data" is disabled when no domain is mocked. "Last email link" is read from the mock db only when `auth` is mocked; it is filled in M04.
**Do:**
1. Add imports to `DevPanel.tsx`:
```tsx
import { ENDPOINTS } from '@fixit/contracts';
import { db, resetDemoData } from '../db/store';
import { activeMockDomains, isMocked } from '../enable';
import {
  ANY_ENDPOINT, armForcedError, clearForcedErrors, FORCED_KINDS, getControls, LATENCIES, setLatency,
  type ForcedKind, type Latency,
} from '../lib/controls';
```
2. Add this component above `DevPanel`:
```tsx
const LATENCY_LABEL: Record<Latency, string> = { zero: '0', normal: 'normal (300–800 ms)', slow: 'slow (2 s)' };
const FORCED_LABEL: Record<ForcedKind, string> = {
  '500': '500 Internal error',
  '409': '409 INVALID_TRANSITION',
  '401': '401 Unauthenticated',
  network: 'Network failure',
};
const selectClass =
  'border-border-control bg-surface text-body text-text focus-visible:ring-ring h-11 w-full rounded-md border px-3 focus-visible:ring-2 focus-visible:outline-none';

function MockControlsSections() {
  const [controls, setControls] = useState(getControls);
  const [target, setTarget] = useState<string>(ANY_ENDPOINT);
  const [kind, setKind] = useState<ForcedKind>('500');
  const refresh = () => {
    setControls(getControls());
  };
  const domains = activeMockDomains();
  const armed = Object.entries(controls.forced);

  return (
    <>
      <DevSection title="Mocked domains">
        <p className="text-body-sm text-text-muted">{domains.length > 0 ? domains.join(', ') : 'none (all real)'}</p>
      </DevSection>
      <DevSection title="Reset demo data">
        <Button
          variant="outline"
          className="h-11"
          disabled={domains.length === 0}
          onClick={() => {
            resetDemoData();
            window.location.reload();
          }}
        >
          Reset demo data
        </Button>
      </DevSection>
      <DevSection title="Latency">
        <div className="grid grid-cols-3 gap-2">
          {LATENCIES.map((l) => (
            <Button
              key={l}
              variant={controls.latency === l ? 'default' : 'outline'}
              className="h-auto min-h-11 whitespace-normal"
              aria-pressed={controls.latency === l}
              onClick={() => {
                setLatency(l);
                refresh();
              }}
            >
              {LATENCY_LABEL[l]}
            </Button>
          ))}
        </div>
      </DevSection>
      <DevSection title="Force next error">
        <label className="text-body-sm text-text-muted flex flex-col gap-1">
          Endpoint
          <select className={selectClass} value={target} onChange={(e) => { setTarget(e.target.value); }}>
            <option value={ANY_ENDPOINT}>Any request</option>
            {Object.keys(ENDPOINTS).map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>
        <label className="text-body-sm text-text-muted flex flex-col gap-1">
          Error
          <select className={selectClass} value={kind} onChange={(e) => { setKind(e.target.value as ForcedKind); }}>
            {FORCED_KINDS.map((k) => (
              <option key={k} value={k}>{FORCED_LABEL[k]}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button className="h-11 flex-1" onClick={() => { armForcedError(target, kind); refresh(); }}>Arm</Button>
          <Button variant="outline" className="h-11 flex-1" disabled={armed.length === 0} onClick={() => { clearForcedErrors(); refresh(); }}>Clear</Button>
        </div>
        <ul className="text-body-sm text-text-muted">
          {armed.length === 0 ? <li>Nothing armed</li> : armed.map(([t, k]) => (
            <li key={t}>{t === ANY_ENDPOINT ? 'Any request' : t} → {FORCED_LABEL[k]}</li>
          ))}
        </ul>
        <p className="text-caption text-text-subtle">Each armed error fires once. Reopen the panel to see what is left.</p>
      </DevSection>
      <DevSection title="Last email link">
        <p className="text-body-sm text-text-muted break-all">
          {isMocked('auth') ? (db().lastEmailLink ?? 'None yet') : 'Only available when auth is mocked'}
        </p>
      </DevSection>
    </>
  );
}
```
3. In `DevPanel`, render `<MockControlsSections />` after `<SessionSection />`.
(`as ForcedKind` on a `<select>` whose options are exactly `FORCED_KINDS` is safe.)
**Verify:** `pnpm verify`; `pnpm dev:mock` → each section renders at 390px (no horizontal scroll) and 1440px.
**Commit:** `git commit -m "feat(web): DevPanel latency, forced errors, reset and mocked domains (M02-T35)"`

### T36 — Placeholder page shows the session
- [ ] done
**Files:** `apps/web/src/app/placeholder-page.tsx`
**Context:** AC1 exact copy `Signed in as olivia@fixit.test, roles: customer`; AC3 manual (`/auth/me` call). Keep the existing M01 content; add one status block under the subtitle.
**Do:** Add imports `import { useAuth } from '@/lib/auth-store'; import { useMe } from '@/features/auth/hooks'; import { ApiError } from '@/lib/http';` and inside `PlaceholderPage` before `return`:
```tsx
const auth = useAuth();
const me = useMe();
```
Insert after the subtitle `<p>`:
```tsx
<div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
  <p className="text-body text-text break-words" aria-live="polite">
    {auth.status === 'signed-in' && auth.me
      ? `Signed in as ${auth.me.email}, roles: ${auth.me.roles.join(', ')}`
      : `Guest${auth.signOutReason ? ` (signed out: ${auth.signOutReason})` : ''}`}
  </p>
  {auth.status === 'signed-in' && (
    <button
      type="button"
      onClick={() => void me.refetch()}
      disabled={me.isFetching}
      className="border-border text-label text-text hover:bg-primary-soft focus-visible:ring-ring h-11 rounded-md border px-4 font-semibold focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
    >
      {me.isFetching ? 'Loading…' : 'Reload profile'}
    </button>
  )}
</div>
{me.error && (
  <p role="alert" className="text-body-sm text-danger-text">
    {`Profile request failed (${me.error instanceof ApiError ? me.error.code : 'error'})`}
  </p>
)}
```
States: guest → `Guest`; after forced sign-out → `Guest (signed out: expired)`; signed in → AC1 line + `Reload profile` (44px high); fetching → `Loading…` disabled; error → danger line.
**Verify:** `pnpm verify`; manual in the checkpoint below.
**Commit:** `git commit -m "feat(web): placeholder shows session and reloads profile (M02-T36)"`

### T37 — Acceptance walk-through
- [ ] done
**Files:** this plan (tick boxes), `docs/milestones/M00-index.md` only if the milestone status is tracked there.
**Do:** check each criterion; any failure → fix in a `fix(web|contracts|fixtures): …` commit with a failing test first, or STOP with a blocker.
1. **AC1** `pnpm dev:mock`, browser at 1440×900 and 390×844 (DevTools device mode): open DevPanel (44×44 bottom-left) → `Customer (Olivia Martinez)` → page shows `Signed in as olivia@fixit.test, roles: customer`. Repeat: `Provider, verified (Marcus Bell / Bell & Sons)` → `roles: customer, provider`; `Provider draft (Kasun Silva, onboarding step 3)` → `roles: customer`; `Admin` → `roles: admin`. No horizontal scroll at 390 (`document.documentElement.scrollWidth <= innerWidth` in console → `true`).
2. **AC2** Signed in → reload → still signed in (Network tab: `POST /api/auth/refresh` 200 at boot). DevPanel `Log out` → `Guest (signed out: logout)`; reload → `Guest`.
3. **AC3** Manual: DevPanel arm `auth_me` → `401 Unauthenticated`, close, `Reload profile` → Network shows `/auth/me` 401, `/auth/refresh` 200, `/auth/me` 200; still signed in. Arm `auth_me` 401 **and** `auth_refresh` 401 → `Reload profile` → `Guest (signed out: expired)`. Automated: `pnpm --filter @fixit/web test -- src/lib/http.test.ts` passes.
4. **AC4** Latency `slow (2 s)` → sign-in takes ≈2 s (button shows `Signing in…`); `0` → instant. There are no write endpoints yet, so check reset by seed time: `Reset demo data` → page reloads, still works; in console `JSON.parse(localStorage['fixit.mockdb.v1']).seededAt` is the reset time.
5. **AC5** `pnpm build && grep -rl "mockServiceWorker\|setupWorker" apps/web/dist` → no output and `ls apps/web/dist/mockServiceWorker.js` fails. `VITE_MOCK_DOMAINS=bogus pnpm --filter @fixit/web build` → fails with `VITE_MOCK_DOMAINS: unknown domain(s): bogus`.
6. **AC6** `pnpm --filter @fixit/fixtures test` → all pass.
7. **AC7** `pnpm --filter @fixit/web test -- src/lib/http.test.ts` → ZodError, ApiError envelope, NETWORK and shared-refresh cases pass.
8. **AC8** `pnpm --filter @fixit/web test -- src/mocks/domains.test.ts` → all pass.
9. `pnpm verify` green; `git tag m02-done`.
**Commit:** `git commit -m "chore: M02 acceptance checks (M02-T37)"`

## Checkpoints
- After T15: "Human: skim `packages/fixtures/src/providers.ts` and `requests.ts` — are the LKR prices, town mapping and FX-2046 → Olivia (D-c) acceptable?"
- After T28: "Human: read `apps/web/src/lib/http.ts` — confirm decision D-a (which 401s trigger a refresh) before the UI is built on it."
- After T36: "Human: run `pnpm dev:mock`, open http://localhost:5173 at 1440 and 390, use the DevPanel to sign in as each persona, reload, force a 401, log out (AC1–AC4)."

## Blockers
- **T34 — `shadcn@latest add sheet button` output differs from the plan's assumption.**
  - What happened: shadcn 4.23.0 generated `src/components/ui/button.tsx` and `sheet.tsx` with `import { cn } from "cn"` (not `@/lib/utils`, which `components.json` configures and where M01-T13's token-aware `cn()` lives), and added two new dependencies to `apps/web/package.json`: `cn@^0.5.2` (an unrelated npm package) and `radix-ui@^1.8.1`. The generated classes (`bg-primary/90`, `ring-ring/50`, `bg-background`, `dark:bg-input/30`, …) are also unchecked against the project's tokens.
  - Why I stopped: the plan says "do not edit" the generated files and to STOP if shadcn output differs. Using them as generated would import the wrong `cn` package.
  - Options: (a) approve rewriting the generated import to `@/lib/utils` (and not adding the `cn` package) — a one-line edit per file; (b) pin an older shadcn version whose output uses `@/lib/utils`; (c) hand-write the DevPanel sheet with Radix Dialog and no shadcn.
  - State: generated files and the dependency changes were reverted; T34 not started. T32 and T33 are done and committed.

## Notes for review (not tasks)
- ARCH §4.1 snippet skips refresh for every `/auth/*` path, which contradicts AC3 (`/auth/me` must refresh). Plan uses D-a; consider recording it in `docs/decisions/` and fixing the snippet.
- ARCH §8.3 says "4 more named customers from the sample requests"; the prototype has 7 other customers. Plan seeds all 7 (Daniel Kim has no request after D-c).
- ARCH §4.5 DevPanel "Admin" uses `/auth/admin/login`, which is out of scope here (M04). D-b uses `/auth/login`; M04 should switch it.
- Nice-to-haves (not in this plan): approved submission rows for verified providers; a test that every MSW handler maps to exactly one `ENDPOINTS` entry (ARCH §2.7); shrinking the ≈2 MB mock db (1,248 filler requests) if localStorage writes feel slow; removing stale `fixit.mockdb.v*` keys after a version bump.
