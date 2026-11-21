# M14 — API foundation
Phase: C   Depends on: M13   Est: 1½ days
Mock domains after this milestone: all (only `/api/health` is real)

## Goal
Stand up the NestJS API with validated config, Docker Postgres + Mailpit, the full Prisma schema with migrations and a seed built from `@fixit/fixtures`, and the cross-cutting plumbing every domain uses: zod pipes, `respond()`, the error envelope, guards that refuse to boot without `@Public`/`@Roles`, the injected clock, mail and storage adapters, and the integration-test + authorization-matrix harness. `pnpm dev` runs web + API together through the Vite proxy.

## Scope
- ARCHITECTURE §1 (`apps/api` layout, `docker-compose.yml`, `docker/postgres-init.sql` with the 3 databases + pg_trgm, `.env.example`), §6.3 guard order (Throttler → JwtAuth → Roles) scaffolded, `@Public`/`@Roles`/`@CurrentUser`/`@ZBody/@ZQuery/@ZParams`, §7.1 boot-time route check (every route `@Public` or `@Roles` **and** matches exactly one `ENDPOINTS` entry), §7.2, §7.3 (`AppError`, `AllExceptionsFilter`, `x-request-id`), §7.5 `request_ref_seq` (raw SQL migration), §7.8 `StorageService` (local) + `MailService` (SMTP→Mailpit, Memory), §7.9 `AuditService` scaffold, §7.10 env schema, §8.1 Prisma schema (whole model), §8.2 indexes, §8.3 `prisma/seed.ts` (refuses in production), §9.2 integration harness, §9.3 matrix test scaffold + `test/matrix-fixtures.ts` guard, §9.6 `db:test:up` in `pnpm verify`, §10.1 scripts (`dev`, `db:*`), §10.3 env vars, `GET /health`, Clock (System/Fake).
- A unit test that each Prisma enum's values equal the contracts enum's `.options` (ARCHITECTURE §2.2).

## Out of scope
- Any domain endpoint (M15–M20). `admin:create` script (M22). Production Dockerfile/Caddy (M22).

## Acceptance criteria
1. `pnpm db:up` starts Postgres 16 (databases `fixit`, `fixit_test`, `fixit_e2e`, pg_trgm enabled) and Mailpit (UI at http://localhost:8025). `pnpm db:reset` migrates and seeds; `psql` shows 10 providers, 8 categories, 18 towns, the 8 prototype requests (FX-2037…FX-2061) and `SELECT nextval('request_ref_seq')` ≥ 2062.
2. `pnpm dev` starts Docker, contracts watch, API on :3000 and web on :5173; `curl http://localhost:5173/api/health` returns `{"ok":true,"db":true}` through the Vite proxy with an `x-request-id` header.
3. Removing `DATABASE_URL` or setting `JWT_ACCESS_SECRET=short` makes the API exit at boot with a readable message naming the variable.
4. A route without `@Public()`/`@Roles()`, or one with no matching `ENDPOINTS` entry, makes the app refuse to boot and fails `pnpm test` (shown with a throwaway test route in a unit test).
5. Integration harness: `pnpm --filter @fixit/api test:int` resets `fixit_test` once per run, truncates per file, boots the app with FakeClock + MemoryMail + temp storage + `ENABLE_JOBS=false`; the matrix test iterates `ENDPOINTS` and fails if an id has no entry in `matrix-fixtures.ts` (entries exist for `/health` now; domain rows come with each milestone).
6. Error envelope: an unknown route returns 404 `NOT_FOUND` envelope with `requestId`; a forced `ZodError` from `respond()` returns 500 `INTERNAL` and logs loudly.
7. `pnpm verify` includes `db:test:up` and is green; the web with `VITE_MOCK_DOMAINS=all` still behaves exactly as at the frontend gate.
8. Seeding `NODE_ENV=production` refuses to run.

## Notes for the planner
- The Prisma schema is written in full now (ARCHITECTURE §8.1) so later milestones only add behaviour; migrations after this one need a decision record only if they change an approved shape.
- Prisma types never leave `infra/` or module mappers (lint rule from ARCHITECTURE §9.6).
- Contracts are consumed from `dist/` by Nest; `pnpm dev` runs `tsup --watch` (D19).
- `searchText`, `ratingAvg`, `reviewCount`, `startingPrice` are computed by the seed with the contracts functions — never copied from fixtures.
- Nest builder: SWC; Vitest projects `unit` and `int`; integration `fileParallelism: false`.
