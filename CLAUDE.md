# Fixit — rules for every agent

Fixit is a responsive web marketplace where Sri Lankan households find, compare and request local home-service providers (customer → request → provider accepts → completes → review), with a super admin who verifies providers and moderates.

Read before working:
- `docs/PRODUCT.md`: roles, features (F-xx), booking lifecycle, business rules (BR-xx)
- `docs/SPEC.md`: screens (S1–S41), tokens, copy, states, interactions (A1–A35)
- `docs/ARCHITECTURE.md`: repo layout, contracts, endpoint table (§3), mock switch, auth, DB, testing
- The current plan in `docs/plans/PLAN-Mxx-*.md`: your task list

## Commands
| Root | Does |
|---|---|
| `pnpm install` | install |
| `pnpm dev` | Docker (Postgres + Mailpit) + contracts watch + API :3000 + web :5173 (mocks per `apps/web/.env.local`) |
| `pnpm dev:mock` | web only, every domain mocked (`VITE_MOCK_DOMAINS=all`) |
| `pnpm db:up` / `pnpm db:down` | start / stop Docker services |
| `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:reset` | Prisma migrate dev / seed / drop+migrate+seed |
| `pnpm test` | all Vitest (contracts, fixtures, web, API unit + integration) |
| `pnpm typecheck` · `pnpm lint` · `pnpm format` · `pnpm build` | as named |
| `pnpm e2e` | Playwright golden journeys against real API + seeded e2e DB |
| `pnpm verify` | format:check + lint + typecheck + test DB up + test + build. **Must be green after every task** |

Per package: `pnpm --filter @fixit/web|@fixit/api|@fixit/contracts|@fixit/fixtures <script>`.
- web: `dev build preview test test:watch typecheck lint e2e`
- api: `dev build start test test:unit test:int typecheck lint prisma:generate admin:create`
- contracts, fixtures: `build dev test typecheck lint`

Mailpit UI: http://localhost:8025. Demo logins (dev seed and mocks): `olivia@`, `marcus@`, `admin@fixit.test`, password `demo1234`. The dev panel (bottom-left, dev only) switches roles in one click.

## Where code goes
| Kind | Location |
|---|---|
| Schema, enum, validation message (SPEC copy) | `packages/contracts/src/<domain>/schemas.ts` |
| Rule shared by mocks and API (state machine, limits, privacy projection, pricing, ranking) | `packages/contracts/src/<domain>/*.ts`, pure, with a test |
| Endpoint registry (= authorization matrix) | `packages/contracts/src/endpoints.ts` |
| Demo/seed data | `packages/fixtures` |
| Screen / feature component / HTTP call / hook | `apps/web/src/features/<feature>/{pages,components}/`, `api.ts`, `hooks.ts` |
| Component shared by 2+ features | `apps/web/src/components/` |
| shadcn primitive | `apps/web/src/components/ui/` only (via `pnpm dlx shadcn add`) |
| Router, layouts, guards, error pages | `apps/web/src/app/` |
| http client, auth store, query keys, formatters, feature flags | `apps/web/src/lib/` |
| Mock handler for an endpoint | `apps/web/src/mocks/handlers/<domain>.ts` (wrapped in `mockEndpoint`) |
| API endpoint | `apps/api/src/modules/<domain>/` (controller → service → mapper) |
| Guards, pipes, filters, decorators | `apps/api/src/common/` |
| Prisma, mail, storage, clock, audit adapters | `apps/api/src/infra/` |
| Schema change | `apps/api/prisma/schema.prisma` + a migration (`pnpm db:migrate --name <x>`) |

Mock/API domains: `auth`, `catalog`, `providers`, `requests`, `reviews`, `admin` (mapping in ARCHITECTURE §3).

## Coding rules
- TypeScript strict everywhere. No `any`, no `@ts-ignore`, no non-null `!` without a comment saying why it's safe.
- zod schemas from `@fixit/contracts` at every boundary: request bodies, query strings, URL params, responses (the web `http()` parses every response), forms (`zodResolver`), env, mock handlers. Don't redefine a contract shape locally; infer types with `z.infer`.
- Validation and error copy come from SPEC, written once in the contracts schema or `lib/error-copy.ts`.
- Styling uses design tokens only (`globals.css` `@theme`). No raw hex/rgb, no arbitrary colour classes (`bg-[#…]`), no inline colour styles in components. The SPEC accent orange is `cta` (`bg-cta`).
- shadcn primitives only in `components/ui/`. Features compose them; they don't fork them.
- Every screen works at **390px and 1440px** (also 641–1023), with no horizontal page scroll. Use `sm` (≥641) and `lg` (≥1024) breakpoints only. Phone: dialogs → bottom sheets, tables → cards, filters/sidebars → sheets.
- No hover-only affordances. Everything works by tap and keyboard; touch targets ≥ 44px on phone; visible focus ring.
- Client-side role checks and guards are UX only. The server decides.
- Dates: Asia/Colombo via `@fixit/contracts` date helpers. Never call `new Date()` inside contracts or API services (use the injected `now` / `Clock`).
- Money is whole LKR integers; display with `lib/format.ts`. Mobile numbers are stored as E.164.
- Should/Could features (F-10, F-21–F-24, F-34–F-36) stay hidden behind `lib/features.ts` until their milestone.
- Never import from `reference/` at runtime (lint-enforced). Copy what you need into fixtures or code.

## Backend rules
- Every endpoint is `@Public()` or declares `@Roles()`; the app refuses to boot otherwise.
- Every endpoint has an `ENDPOINTS` entry that matches §3 of ARCHITECTURE, and a row in the authorization matrix test (`apps/api/test/matrix-fixtures.ts`). The test fails on missing rows.
- Ownership is checked in the service using `@CurrentUser()` ids, never ids from the client for "my" resources. Include the owner in the `where`; a miss returns **404**, never 403.
- Request status changes happen only through `assertTransition()` from contracts, inside `prisma.$transaction` with the request row locked (`lockRequest`). Write the `RequestStatusEvent` in the same transaction.
- Rating, review count, starting price and `searchText` are recomputed in the same transaction as the write that changes them.
- Responses go through `respond(ContractSchema, mapper(row))`. Prisma types never leave `infra/` or the module mappers and never reach the web.
- Errors are `AppError` → the contract `ErrorEnvelope`. Use `RULE_VIOLATION` + `RuleCode` for business rules.
- Emails are sent after commit via `NotificationsService`; they never fail the request.
- Admin mutations write `AuditLog` in the same transaction.
- Secrets come only from env (validated by `config/env.schema.ts`). Never commit `.env`; add new vars to `.env.example` and ARCHITECTURE §10.3.

## Mock rules
- Until a domain's backend milestone is done, every endpoint the web calls has an MSW handler, built with `mockEndpoint(ENDPOINTS.x, …)`.
- Handlers use contracts schemas, `assertTransition`, `checkCreateRequest`, the projections, and the same role and ownership rules as the API (other owner → 404).
- The mock db is seeded only from `@fixit/fixtures`. Bump the db version key when its shape changes.
- MSW must never load in a production build.

## Testing rules
- Test where logic lives: contracts (Vitest), web hooks/forms/url-state/http (Vitest + Testing Library + MSW), API services (unit), API endpoints (Supertest + real Postgres), the authorization matrix, Playwright golden journeys.
- Don't test plain markup or styling. No snapshot tests.
- A bug fix comes with a test that fails before the fix.

## Workflow rules
- Execute the plan exactly, task by task, in order. Don't add scope, refactor unrelated code, or "improve" beyond the task.
- Tick the task checkbox in the plan when the task is done.
- One commit per task, conventional message (`feat(web): …`, `fix(api): …`, `test(contracts): …`, `chore: …`), referencing the task id.
- If the plan is ambiguous, contradicts PRODUCT/SPEC/ARCHITECTURE, or can't work: **STOP**. Write the problem under `## Blockers` in the plan file (task id, what's wrong, options) and end the session. Never improvise.
- New ideas go to the "Ideas inbox" in `docs/milestones/M00-index.md`, not into the running plan.
- Changing an approved decision needs a record in `docs/decisions/` (prompt 09). Don't silently edit PRODUCT, SPEC or ARCHITECTURE.

## Definition of done (per task)
1. The task's own verify step (as written in the plan) passes.
2. `pnpm verify` is green.
3. The checkbox is ticked and the task is committed.
