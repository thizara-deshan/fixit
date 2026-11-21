# Prompt 04 — Milestones

> **Setup** · run once (08 adds `Fxx`, 09 adds `Cxx` later) · **Model:** Opus 5.5 · new session
> **Inputs:** `docs/PRODUCT.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`
> **Output:** `docs/milestones/M00-index.md` + one `Mxx-<slug>.md` per milestone

## When to use
After architecture is approved. Each milestone is one **feature-sized slice** of
½ to 1½ days that ends with something you can click through. Frontend milestones run
on mocks. Each backend milestone ends by switching its domain from mock to real.

## The prompt
````text
You are a technical lead splitting a ~5–6 week solo build into milestones.

### Inputs
Read `docs/PRODUCT.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `CLAUDE.md`.

### Starting proposal (adjust it if PRODUCT/SPEC/ARCHITECTURE warrant)
Phase A — Foundation
- M01 Foundation: pnpm workspace, apps/web (Vite, TS strict, Tailwind v4,
  shadcn init, tokens from SPEC, fonts), packages/contracts (enums, core
  schemas, state machine + tests), lint/format, Vitest, `pnpm verify`
- M02 Shell & data layer: router + all layouts (public, customer, provider,
  admin) at desktop + phone, guards, http client, query setup, MSW with
  seeded in-memory db + VITE_MOCK_DOMAINS switch, mock auth + dev role
  switcher, toast/undo, dialogs, skeleton/empty/error/403/404 components
Phase B — Frontend features (all on MSW)
- M03 Auth screens: login, sign-up (customer / provider), forgot & reset
  password, logout, role-based redirect, session-expired handling
- M04 Home & Discover: hero search, categories, featured, how it works,
  provider CTA; Discover search + filters + sort + URL state + empty state
  + phone filter sheet
- M05 Provider public profile & saved providers
- M06 Booking (customer): request form, confirmation, My requests list +
  detail, cancel, leave review
- M07 Provider requests: overview (stats as prototype), requests inbox with
  tabs, accept/decline/complete + undo, request detail
- M08 Provider business: onboarding, business profile, services & prices
  editor ("specify what services he offers"), service areas, photo,
  verification submission, profile completeness, reviews (+ reply if v1)
- M09 Admin console: overview metrics, verification queue + decision,
  providers & customers (suspend/reactivate), all requests, categories &
  locations CRUD, review moderation
  ── FRONTEND COMPLETE GATE ──
Phase C — Backend, one domain at a time (each ends with its mock domain OFF)
- M10 API foundation: NestJS app, config, Prisma + docker compose Postgres,
  schema + migrations + seed (prototype data), zod pipe, error filter, test
  DB harness, authorization-matrix test scaffold, Vite proxy
- M11 Auth API → domain `auth` real
- M12 Catalog & search API (categories, locations, provider search,
  public profile, saved providers) → `catalog` real
- M13 Provider management API (profile, services, areas, uploads,
  verification submit) → `providers` real
- M14 Booking & reviews API (request lifecycle, notifications/email,
  reviews + rating aggregates) → `requests`, `reviews` real
- M15 Admin API (verification decisions, suspension, catalog CRUD,
  metrics, audit log) → `admin` real; VITE_MOCK_DOMAINS=none works
Phase D — Ship
- M16 Hardening & deploy: Playwright golden journeys for 3 roles, rate
  limits, security headers, error pages, performance pass, production
  build, deploy, demo seed, README
- Fxx / Cxx: reserved for prompts 08 / 09

### For each milestone file `docs/milestones/Mxx-<slug>.md`
```
# Mxx — Title
Phase: A|B|C|D   Depends on: …   Est: ½ | 1 | 1½ day
Mock domains after this milestone: e.g. "all except auth"
## Goal (2–3 sentences)
## Scope — PRODUCT refs (F-xx, BR-xx), SPEC refs (S4, S4.E2…), ARCHITECTURE sections, endpoints (backend)
## Out of scope
## Acceptance criteria — numbered, each demonstrable (what I see/click/run)
## Notes for the planner — gotchas, reuse, decisions already made
```
Acceptance criteria rules:
- UI milestones: criteria at 1440px AND 390px, plus loading/empty/error states.
- Role-gated screens: a criterion that the wrong role is redirected/blocked.
- Backend milestones: "the authorization matrix rows for these endpoints pass",
  "the feature works with VITE_MOCK_DOMAINS excluding <domain>", and the same
  user-visible criteria as the matching frontend milestone, now on real data.

### `docs/milestones/M00-index.md`
- Table: | ID | Title | Phase | Depends on | Est | Status |
- Coverage check: every v1 feature F-xx → milestone(s); every SPEC screen →
  frontend milestone + backend milestone; every endpoint → backend
  milestone. Nothing unassigned.
- Empty sections: `## Ideas inbox` (one-liners captured during builds)
  and `## Backlog` (LATER items from reviews).

### Rules
- No forward dependencies.
- Each milestone is demoable on its own.
- Acceptance criteria must be observable. "Code is clean" is not a criterion.
- Total estimate must fit ~5 weeks of build days, leaving ~1 week of buffer;
  if not, propose what moves to "Should/Later" instead of squeezing.

### Gate
Present the index table, total estimate, and coverage gaps. STOP for approval.
Then write the files.
````

## Gate checklist
- [ ] Phase B (M03–M09) fits in ~2 weeks
- [ ] Every backend milestone names the mock domain it switches off
- [ ] UI milestones list criteria at both 1440 and 390
- [ ] Every v1 feature and SPEC screen is covered
- [ ] Commit: `git add docs/milestones && git commit -m "docs: milestones"`
