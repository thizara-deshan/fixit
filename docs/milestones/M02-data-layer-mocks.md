# M02 — Data layer & mock backend
Phase: A   Depends on: M01   Est: 1½ days
Mock domains after this milestone: all

## Goal
Give the web app its data layer — the `http()` client with 401 → refresh → retry, the auth store, TanStack Query setup and query keys — and an MSW mock backend seeded from a new `@fixit/fixtures` package. A developer can sign in as any demo persona from the dev panel and the session survives a reload.

## Scope
- ARCHITECTURE §4.1 (`http.ts`, `ApiError`, `refreshOnce` single-flight, `auth-store.ts`), §4.2 (`query-keys.ts`, QueryClient defaults), §4.3 (MSW layout, `mockEndpoint`, `identity.ts`, `controls.ts`, `errors.ts`, mock tokens), §4.4 (`VITE_MOCK_DOMAINS`, `parseMockDomains`, `enableMocks`, `handlersByDomain`), §4.5 (DevPanel), §8.3 (fixtures + `buildWorld(now)`), §9.4 (web test harness: `test/setup.ts`, `render.tsx`, `signInAs`), D1, D2, D23.
- `packages/fixtures`: catalog (8 categories, 3 districts, 18 towns), providers p01–p10 localised, services in LKR, reviews with deterministic filler so aggregates match, the 8 prototype requests with dates relative to `now`, users incl. olivia/nimal/marcus/hank/kasun/admin, p02 pending_review submission.
- Contracts needed now: `auth` schemas (`LoginBody`, `AuthSession`, `AccessTokenClaims`, `Me`, `deriveRoles()`), `ratingFrom()`, `computeStartingPrice()` (used by fixtures invariants), the mock-db `RequestRecord` shape.
- `ENDPOINTS` entries + mock handlers: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
- Mock db store (`fixit.mockdb.v1`), `resetDemoData()`, `expireDue(db, now)` helper (called by requests handlers from M08 on).
- `main.tsx` boot order: `enableMocks()` → `bootstrapAuth()` → render. Scripts `dev:mock` (`VITE_MOCK_DOMAINS=all`).

## Out of scope
- Router, layouts, guards, error pages, toasts (M03). DevPanel may render on the M01 placeholder page.
- Auth screens and the other auth endpoints (M04).
- Any non-auth handler (added by the feature milestone that needs it).

## Acceptance criteria
1. `pnpm dev:mock`, open the DevPanel (44×44 button bottom-left) → "Sign in as Customer (Olivia Martinez)" → the placeholder page shows "Signed in as olivia@fixit.test, roles: customer". Repeat for Provider verified (Marcus → roles customer, provider), Provider draft (Kasun), Admin. Works at 390px and 1440px.
2. Reload the page while signed in → still signed in (boot refresh via `fixit.mock.refresh`). Log out from the DevPanel → guest.
3. DevPanel "Force next error → 401" then a `/auth/me` call → the client refreshes once and retries; forcing refresh to fail as well → auth store signs out with reason `expired` (proven by a Vitest test against MSW node).
4. DevPanel latency "slow (2 s)" makes the sign-in visibly slower; "0" makes it instant. "Reset demo data" restores the seed.
5. `pnpm build` output contains no MSW code (`grep -r "mockServiceWorker\|setupWorker" apps/web/dist` finds nothing outside the worker file being excluded); `VITE_MOCK_DOMAINS=bogus` fails fast with `unknown domain(s): bogus`.
6. `pnpm --filter @fixit/fixtures test`: every provider's stored rating/count equals `ratingFrom()` of its visible reviews and matches the prototype figure ±0.05; every review has its own completed request; refs unique; there is an Accepted request with preferredDate = today and a Completed one inside the 30-day review window.
7. Vitest: `http()` parses the response with the endpoint schema (a contract mismatch throws `ZodError`); a non-2xx `ErrorEnvelope` becomes `ApiError` with `code`, `rule`, `fieldErrors`; network failure → `ApiError(0,'NETWORK')`; concurrent 401s share one refresh.
8. `parseMockDomains` unit tests: `all`, `none`, `''`, `auth,catalog`, duplicates, unknown.

## Notes for the planner
- `mockEndpoint` enforces registry `access` (401/403) exactly like the API; ownership checks live in each `impl` and return 404 (CLAUDE.md mock rules).
- Mock tokens are unsigned JWT-shaped (`…mock`) with 15-minute `exp`; `resolveActor` must also accept real JWT payloads (D2) so mixed mode works in Phase C.
- Fixtures dates must be relative to the `now` passed in; the mock seeds with `new Date()` at seed time, tests with a fixed `now`.
- Bump the db version key whenever its shape changes (CLAUDE.md); start at `v1`.
- DevPanel "Last email link" slot is created here but only filled in M04.
- Fixture localisation table (prototype location → town) is in ARCHITECTURE §8.3; never import `reference/` at runtime — copy values into fixtures.
