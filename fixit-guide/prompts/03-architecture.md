# Prompt 03 — Architecture + CLAUDE.md

> **Setup** · run once · **Model:** Opus 5.5 · new session
> **Inputs:** `docs/PRODUCT.md`, `docs/SPEC.md`, `fixit-guide/README.md` (section 7)
> **Output:** `docs/ARCHITECTURE.md`, `CLAUDE.md`

## When to use
Right after SPEC is approved. This prompt fixes the structure every plan builds on:
repo layout, contracts, the mock → real switch, the auth model, and the module
pattern. It also writes `CLAUDE.md`, which every Claude Code session loads automatically.
That file is what keeps Sonnet consistent.

## The prompt
````text
You are a senior full-stack architect designing a web marketplace that one
developer will build in ~5–6 weeks using AI agents, frontend first, then the
backend feature by feature.

### Inputs
- `docs/PRODUCT.md` (roles, lifecycle, business rules)
- `docs/SPEC.md` (screens, domain model, interactions)
- `fixit-guide/README.md` section 7 (stack decisions)

Fixed stack (don't change it; you may add small libraries with justification):
- monorepo: pnpm workspaces, TypeScript strict everywhere
- web: React, Vite, React Router, Tailwind CSS v4, shadcn/ui, lucide-react,
  TanStack Query, react-hook-form + zod, MSW, Vitest + Testing Library,
  Playwright
- contracts: zod (shared by web, mocks, api)
- api: NestJS, Prisma, PostgreSQL, argon2, JWT, Vitest (+SWC) + Supertest
- local infra: docker compose (Postgres, Mailpit)

### Design these, in order
1. **Repo layout.** apps/web, apps/api, packages/contracts, tools, docs.
   Folder tree down to the level a planner needs. Web: `src/app` (router,
   providers, layouts), `src/features/<feature>/` (pages, components, hooks,
   api.ts), `src/components/` (shared), `src/components/ui/` (shadcn only),
   `src/lib/` (http client, auth, query keys), `src/mocks/` (MSW).
   API: `src/modules/<domain>/` (module, controller, service, policies),
   `src/common/` (guards, pipes, filters, decorators), `prisma/`.
2. **Contracts package.** Folder layout (by domain: auth, catalog,
   providers, requests, reviews, admin, common). Show real zod code for:
   shared enums (Role, RequestStatus, TimeSlot, PriceUnit…), the core
   entities as returned by the API, pagination + error envelope, and the
   Discover search query schema. Show the **booking state machine** as a
   pure function `canTransition(request, toStatus, actor) → ok | reason`
   driven by PRODUCT's table, with its test cases listed.
   Rule for API types: response DTOs are inferred from zod; Prisma types
   never leak to the web.
3. **API surface.** A table of every endpoint: | Method | Path | Roles |
   Ownership rule | Request schema | Response schema | Feature/Screen refs |.
   Group by domain. This table becomes the **authorization test matrix**.
4. **Frontend data layer & the mock → real switch.**
   - One `http` client (fetch wrapper): base `/api`, attaches access token,
     on 401 tries one refresh then logs out, parses every response with
     the contract schema.
   - Query-key factory, one `api.ts` + hooks file per feature.
   - MSW: handlers grouped by domain (`auth`, `catalog`, `providers`,
     `requests`, `reviews`, `admin`), an in-memory db seeded from
     `reference/prototype/unpacked/data.json` (copied into the mocks, never
     imported from reference/) + extra seed for admin and customers,
     persisted to localStorage with a "reset demo data" action, simulated
     latency, and a way to force errors. Mocks enforce the SAME rules: they
     call the contracts state machine and check roles/ownership.
   - `VITE_MOCK_DOMAINS` = `all` | `none` | comma list. Unlisted domains are
     not registered → requests bypass MSW → Vite proxy `/api` → NestJS.
     Document the exact code for this switch.
   - Dev-only "role switcher" for mock mode (log in as seeded customer /
     provider / admin in one click).
5. **Frontend structure.** Route map (from SPEC) with layout per route and
   the guard used (`RequireAuth`, `RequireRole`), lazy-loaded route chunks per
   area, responsive strategy (Tailwind breakpoints, one component per
   screen, sheets for phone filters/sidebars), how SPEC tokens become
   Tailwind v4 `@theme` variables + shadcn CSS variables, URL-state helper
   for Discover, optimistic mutation + Undo toast pattern, error boundary
   + 403/404 pages.
6. **Auth design.** Register (customer | provider), login, refresh,
   logout, me, forgot/reset password. Access token (short TTL, in memory),
   refresh token (httpOnly, Secure, SameSite=Lax cookie, rotated, stored
   hashed in DB, revocable), argon2id. NestJS: global `JwtAuthGuard` with
   `@Public()` opt-out, `RolesGuard` + `@Roles()`, ownership checks inside
   services (never trust ids from the client for "my" resources). Super
   admin created by seed/CLI, never by sign-up. Suspended users are
   rejected at login and on refresh. Rate-limit auth endpoints. CORS not
   needed (same origin via proxy in dev and reverse proxy in prod).
7. **API architecture.** Module per domain; ZodValidationPipe using
   @fixit/contracts; global exception filter → the contract error
   envelope; Prisma service; transactions for status changes; how the
   state machine is called; request reference generation (FX-####);
   search implementation for Discover (filters, sort, pagination; full-text
   = simple ILIKE/trigram in v1); rating aggregates (denormalized on
   provider, updated in the review transaction); StorageService and
   MailService interfaces with dev implementations; audit log for admin
   actions; config via env validated with zod at boot.
8. **Database.** Prisma schema sketch for every entity in SPEC's domain
   model + RefreshToken + AuditLog; indexes for Discover filters; seed that
   reproduces the prototype data + one admin + a few customers.
9. **Testing policy.** What is tested where: contracts + state machine
   (Vitest), web hooks/filters/forms (Vitest + Testing Library + MSW),
   API services (unit), API endpoints (Supertest against a real Postgres
   test DB, reset per file), the **authorization matrix** test generated
   from section 3's table, Playwright e2e for the 3 golden journeys. What
   is NOT tested: plain markup, snapshots. The single `pnpm verify`
   command that must be green after every task.
10. **Environments & deploy.** dev (Vite + Nest + docker compose), test,
    prod. Env vars list. Prod proposal marked `[ASSUMED]` (static web +
    API container + managed Postgres + object storage + email provider),
    finalized in the deploy milestone.
11. **Decisions log.** Key decisions + alternatives rejected.

### Then write `CLAUDE.md` (max ~150 lines), the rules every agent follows
- Project one-liner + pointers to PRODUCT / SPEC / ARCHITECTURE
- Commands (install, dev, dev:mock, db up/migrate/seed/reset, test,
  typecheck, lint, build, e2e, verify) per package and root
- Repo layout summary and where new code of each kind goes
- Coding rules: TS strict, no `any`, zod from @fixit/contracts at every
  boundary, tokens only (no raw hex or arbitrary colors in components),
  shadcn primitives only in components/ui, every screen works at 390px and
  1440px, no hover-only affordances, client-side role checks are UX only
- Backend rules: every endpoint declares roles; ownership checked in the
  service; status changes only via the state machine; no Prisma types in
  responses; every new endpoint added to the authorization matrix test;
  secrets only from env
- Mock rules: every endpoint the web calls has an MSW handler until its
  backend milestone is done; handlers use contracts schemas + state machine
- Never import from `reference/` at runtime
- Workflow rules: execute plans exactly; tick task checkboxes; one commit
  per task with a conventional commit message; if the plan is ambiguous or
  wrong, STOP and write under "## Blockers" in the plan. Never improvise or
  add scope.
- Definition of done for a task: task verify passes + `pnpm verify` green

### Rules
- Prefer the simplest thing that works for one developer. No microservices,
  message queues, Redis, GraphQL, or Kubernetes in v1.
- Every SPEC screen, PRODUCT feature and business rule must have a home.
- Treat the internet as hostile: nothing mutates without auth, nothing
  returns another user's private data.

### Gate
First present: repo tree, a request-flow diagram (ASCII) for both mock mode
and real mode, the contracts domain list, the endpoint table, the auth
summary, the Prisma entity list, and the decisions table. STOP for approval.
Then write both files.
````

## Gate checklist
- [ ] Every SPEC interaction maps to an endpoint + contract + MSW handler
- [ ] `VITE_MOCK_DOMAINS` switch is concrete (you could implement it from the doc)
- [ ] The endpoint table has roles + ownership for every row (this is your security model)
- [ ] The state machine lives in contracts and both mocks and API use it
- [ ] `CLAUDE.md` commands are concrete (they become every plan's verify step)
- [ ] Commit: `git add -A && git commit -m "docs: ARCHITECTURE + CLAUDE.md"`
