# Fixit — Build Workflow

A document-driven workflow for building **Fixit**, a home-service booking marketplace,
with Claude Code. One developer, about **4–6 weeks**, **frontend first**, built
**feature by feature**. It has the same shape as the Eduscope guide (`../guide/`),
adapted to a multi-role web app:

| Eduscope guide assumed | Fixit reality | So we… |
|---|---|---|
| The prototype screens covered almost the whole UI | **The prototype covers ~30% of the product.** It has Home, Discover, Provider profile and the Provider dashboard, but no auth, booking form, customer area or admin | Add a **Product Brief** brainstorm (01) before the spec. The spec extracts the 4 real screens and *designs* the missing ones in the same visual language |
| One trusted room, PIN access | **Three roles** (customer, provider, super admin) on the public internet | Real accounts, server-enforced authorization, and a **role × endpoint test matrix** |
| Hardware code arrives later as messy drops | **New feature ideas arrive later** ("we missed X") | Swap Hardware Intake for **New Feature (08)**: brainstorm → feature brief → new milestone |
| Backend switched on in one day | Backend built **gradually, feature by feature** | Use **MSW mocks per domain**. Each backend milestone turns one domain's mocks off and the real API takes over |
| Landscape kiosk + phones | **Desktop 1440 + phone 390**. The prototype is desktop-only and breaks at phone width | Every screen gets a designed phone layout in the spec |
| One week | **~5–6 weeks solo** | ~16 milestones of ½–1½ days each, with buffer |

> **Mental model:** Opus = architect, Sonnet = builder, you = the gate.
> Opus writes plans that are specific enough for Sonnet to follow without guessing.
> You review each plan before Sonnet starts on it.

---

## 1. The pipeline

```
 SETUP (once, Week 1)                       BUILD LOOP (per milestone)
 ────────────────────                       ──────────────────────────
 01 Product brief (brainstorm) [Opus]       05 Plan milestone   [Opus]   → docs/plans/PLAN-Mxx.md
 02 Prototype → SPEC           [Opus]       06 Execute plan     [Sonnet] → code + commits
 03 Architecture + CLAUDE.md   [Opus]       07 Review & verify  [Opus]   → fix tasks → back to 06
 04 Milestones index           [Opus]                 ▲
                                                      │
 FEATURE LOOP (whenever "we missed something")        │
 ─────────────────────────────────────────            │
 08 New feature (brainstorm)   [Opus]  → FEAT doc + new Fxx milestone ──┘

 ANY TIME: 09 Change record    [Opus]  → when reality changes a decision
```

| # | Prompt | Model | Output |
|---|---|---|---|
| 01 | [Product brief](prompts/01-product-brief.md) | Opus | `docs/PRODUCT.md` |
| 02 | [Prototype → Spec](prompts/02-prototype-to-spec.md) | Opus | `docs/SPEC.md` |
| 03 | [Architecture](prompts/03-architecture.md) | Opus | `docs/ARCHITECTURE.md`, `CLAUDE.md` |
| 04 | [Milestones](prompts/04-milestones.md) | Opus | `docs/milestones/M00-index.md` + `Mxx-*.md` |
| 05 | [Plan a milestone](prompts/05-plan-milestone.md) | Opus | `docs/plans/PLAN-Mxx-*.md` |
| 06 | [Execute a plan](prompts/06-execute-plan.md) | **Sonnet** | Code, ticked tasks, commits |
| 07 | [Review & verify](prompts/07-review-milestone.md) | Opus | `docs/reviews/REVIEW-Mxx.md` + fix tasks |
| 08 | [New feature](prompts/08-new-feature.md) | Opus | `docs/features/FEAT-NN-*.md` + `Fxx` milestone(s) |
| 09 | [Change record](prompts/09-change-record.md) | Opus | `docs/decisions/NNN-*.md` |

**Brainstorming prompts** (01, 02, 08) are run as conversations. Claude asks you
questions in rounds and stops at a gate. Answer them, or say "your call" and it records
its choice as an `[ASSUMED]` default you can revisit later.

---

## 2. Model routing

| Work | Model | Why |
|---|---|---|
| Brief, spec, architecture, milestones, plans, reviews, new features, decisions | **Opus 5.5** | Needs judgment and cross-file reasoning. Mistakes here multiply downstream |
| Executing a written plan task by task, applying review fix-lists | **Sonnet 5.5** | The thinking is already in the plan, so this is fast and cheap |
| A bug Sonnet fails to fix in 2 attempts | **Opus 5.5** | Escalate instead of letting it loop |
| Optional: renames, copy tweaks, small doc edits | Haiku 5.5 | Only if you want to save quota |

```bash
claude --model opus      # planning session
claude --model sonnet    # execution session
# or inside a session:  /model opus   |   /model sonnet
```

**Optional (faster): Opus drives Sonnet subagents.** In an Opus session, after the plan
is approved, say *"Execute PLAN-M06 using a sonnet subagent per task; review each
result against the plan before moving on."* This costs more Opus quota but needs less
babysitting. It works well for big UI milestones (M07–M09).

---

## 3. Artifact map

```
fixit/
├── CLAUDE.md                      ← 03: rules auto-loaded by every Claude Code session
├── reference/                     ← read-only inputs, never imported by app code
│   ├── prototype/
│   │   ├── Fixit - Prototype (offline).html   ← the Claude Design export (as-is)
│   │   └── unpacked/              ← tools/unpack-prototype.py output: markup, logic, data.json, colors
│   └── screens/                   ← tools/screenshot-prototype.sh output (desktop + phone per route)
├── docs/
│   ├── PRODUCT.md                 ← 01  roles, features, booking lifecycle, rules
│   ├── SPEC.md                    ← 02  screens, tokens, domain model, states
│   ├── ARCHITECTURE.md            ← 03
│   ├── milestones/                ← 04 (+ 08 adds Fxx, 09 adds Cxx)
│   ├── plans/                     ← 05 (+ fix tasks from 07)
│   ├── reviews/                   ← 07
│   ├── features/                  ← 08  feature briefs
│   └── decisions/                 ← 09
├── apps/
│   ├── web/                       ← React + Vite + TS + Tailwind + shadcn + TanStack Query + MSW
│   └── api/                       ← NestJS + Prisma
├── packages/
│   └── contracts/                 ← zod schemas, shared enums, booking state machine (used by web, mocks, api)
├── tools/                         ← unpack/screenshot scripts (copied from this guide)
└── docker-compose.yml             ← Postgres (+ Mailpit) for local dev
```

---

## 4. Phases and schedule (~5–6 weeks)

```
 Phase A  Foundation        M01–M02     the app runs on mocks with all three role layouts
 Phase B  Frontend features M03–M09     every screen works against MSW mocks   ── FRONTEND COMPLETE GATE
 Phase C  Backend features  M10–M15     one domain at a time: build API → turn that domain's mocks off
 Phase D  Ship              M16         e2e, hardening, deploy
          Fxx / Cxx                     new features (08) and change follow-ups (09), slotted in as needed
```

| Week | Work | Gate at end of week |
|---|---|---|
| **1** | 01 → 02 → 03 → 04 (setup docs, ~2 days), then **M01 Foundation**, **M02 Shell & data layer** | `pnpm dev` shows the public layout and the provider + admin layouts. You can switch roles with the mock login, and tokens match the prototype |
| **2** | **M03 Auth screens**, **M04 Home & Discover**, **M05 Provider profile**, **M06 Booking request (customer)** | A customer can search, open a profile, send a request, and see it in "My requests" (all on mocks, at 1440 and 390) |
| **3** | **M07 Provider requests**, **M08 Provider business (services, areas, profile, verification)**, **M09 Admin console** | ✅ **Frontend complete.** Click through all 3 roles end to end on mocks, on your phone and on desktop |
| **4** | **M10 API foundation**, **M11 Auth API**, **M12 Catalog & search API** | Real sign-up/login. Home/Discover/Profile read from Postgres. Booking still on mocks |
| **5** | **M13 Provider management API**, **M14 Booking & reviews API**, **M15 Admin API** | `VITE_MOCK_DOMAINS=none`, so the whole app runs on the real backend |
| **6** | **M16 Hardening & deploy**, plus buffer for Fxx features found along the way | Public URL. The e2e suite is green for all 3 roles |

The setup docs take longer here than in Eduscope because the product is only partly
designed. **Don't rush 01 and 02.** Every later prompt depends on them.

---

## 5. The daily loop (per milestone)

```bash
git tag m06-start                       # 1. mark the starting point (07 diffs against it)
claude --model opus     → prompt 05     # 2. plan            🛑 read the plan
claude --model sonnet   → prompt 06     # 3. execute         (repeat until all tasks ticked)
claude --model opus     → prompt 07     # 4. review          🛑 read the review
claude --model sonnet   → prompt 06     # 5. apply fix tasks (if any)
git tag m06-done
```

Start a new session (`/clear`) for each step. Agents work from the files on disk,
not from chat history.

When you notice a missing feature mid-milestone, **don't add it to the running
plan.** Write a one-line note in `docs/milestones/M00-index.md` → "Ideas inbox", finish the
milestone, then run 08.

---

## 6. Golden rules (short version)

1. **The prototype is the UI source of truth** for the screens it shows (desktop, 1440).
   New screens and all phone layouts (390) follow the SPEC, which extends the
   prototype's visual language. If code and the prototype disagree, the prototype wins,
   unless a decision record says otherwise.
2. **Contracts first.** Every request/response body and enum lives as a zod schema in
   `packages/contracts`. The web app, the MSW mocks, and the NestJS API all import it.
3. **Business rules live in one place.** The booking state machine (who may move a
   request from which status to which) is a pure function in `packages/contracts`. Mocks
   and API both call it, so mock behavior can't drift from the real behavior.
4. **The server is the only authority.** Frontend route guards are only UX. Every API
   endpoint is in the **role × endpoint authorization test matrix** (anon, customer,
   provider, *other* provider, admin), and ownership is checked, not just the role.
5. **Never skip a gate.** Read every plan before Sonnet runs it, and read every review
   before you call a milestone done.
6. **Sonnet doesn't improvise.** If a plan is ambiguous, Sonnet stops and writes a
   blocker. Opus fixes the plan.
7. **Test where logic lives.** Use Vitest for contracts, the state machine, query/filter logic,
   hooks, and API services. Use API integration tests against a real Postgres. Use Playwright
   for the core journeys. Skip snapshot tests and tests of plain markup.
8. **Scope enters through 08 only.** New ideas never go into a running plan.
9. **Commit after every task.** Tag the start and end of each milestone.
10. **Changing a decision means writing a record (09).** Don't silently edit the docs.

---

## 7. Stack decisions (your plan + my additions)

| Area | Choice | Why |
|---|---|---|
| Repo | **pnpm workspaces monorepo**: `apps/web`, `apps/api`, `packages/contracts` | Web, mocks and API share one set of zod contracts with no publishing step |
| Frontend | **React + TypeScript + Vite** (SPA), **Tailwind CSS v4**, **shadcn/ui** | Your choice. Vite over Next.js because the API is a separate NestJS app and SEO isn't a v1 goal. Revisit with 09 if public SEO matters later |
| Routing | **React Router** (data-router mode) | Standard. Nested layouts map to public / customer / provider / admin areas |
| Server state | **TanStack Query** | Caching, invalidation and optimistic updates (accept/decline with Undo, as in the prototype) |
| Forms | **react-hook-form + zod resolver** using the contract schemas | The same validation rules run in the browser and on the server |
| Mocks (frontend-first) | **MSW** (Mock Service Worker) with an in-memory store seeded from the prototype's `data.json`, persisted to `localStorage` | The app uses the **real HTTP client from day one**. Mocks intercept at the network layer, so turning on the backend only means turning mocks off |
| Gradual backend switch | `VITE_MOCK_DOMAINS=all \| none \| auth,catalog,…`. Handlers are grouped by domain, and unmocked domains pass through to `/api` (Vite proxy → NestJS) | Lets you move **one feature at a time** from mock to real |
| Backend | **NestJS** (modules per domain), **zod validation pipe** from `@fixit/contracts` | Your choice. One validation library across the stack, with no duplicate class-validator DTOs |
| Database | **PostgreSQL** + **Prisma** (migrations + typed client) | Your choice + the most mature NestJS/TS ORM experience |
| Auth | **Own auth in NestJS**: email + password (argon2), short-lived JWT access token in memory, **httpOnly refresh cookie** with rotation, `@Roles()` guard + ownership checks in services | No vendor dependency. The roles are `CUSTOMER`, `PROVIDER` and `ADMIN`. The super admin is seeded, never self-registered |
| Files (photos, verification docs) | Storage behind a `StorageService` interface: local disk in dev, S3-compatible (e.g. Cloudflare R2) in prod | Verification documents are private, so they're served via the API only, never public URLs |
| Email | Behind a `MailService` interface. **Mailpit** in Docker for dev; a transactional provider in prod (decided in M16) | Password reset and booking notifications without coupling to a vendor early |
| Icons | **lucide-react** (shadcn default), with a mapping table from the prototype's Material Symbols in SPEC | Consistent with shadcn. Exact icons matter less than exact layout |
| Fonts | **Plus Jakarta Sans** (UI) + **JetBrains Mono** (IDs like `FX-2061`), self-hosted via `@fontsource` | Taken from the prototype source |
| Testing | **Vitest** (web, contracts, API with SWC), **Testing Library**, **Supertest** + a real Postgres via Docker for API integration tests, **Playwright** for e2e | One runner everywhere. Authorization bugs only show up against a real DB |
| Local infra | `docker compose up` → Postgres + Mailpit | Nothing else runs locally |
| Deploy (decided in M16) | Default proposal: web as static files on a CDN host, API as a Docker container, managed Postgres | Cheap and simple. Prompt 03 records it as `[ASSUMED]` |

**Not in v1** (from your answers): online payments, provider availability calendars,
Google sign-in, chat between customer and provider. Each can come back later through 08.

### Known facts from the prototype (so you don't have to re-derive them)
- **Routes:** `#/home`, `#/home/how`, `#/discover?q=&loc=&cat=`, `#/provider/:id`, `#/dashboard`
- **Request statuses:** `Pending → Accepted | Declined`, `Accepted → Completed`. Request refs look like `FX-2061`
- **Sample data:** 8 categories, 4 locations (Austin metro, TX), 10 providers, 8 requests. Prices are `startingPrice` + `priceUnit` (`hr`), and any service price ≥ 300 is shown as a flat price
- **"Verified"** = Fixit checked photo ID, trade licence, insurance, and business address
- **Palette:** primary `#1E4FA3` (hover `#163C7E`, soft `#EAF0FA`), page `#F6F7F9`, border `#E3E6EB`,
  text `#1A1D24` / `#545B68` / `#8A909C`, success `#1F8A4C`, accent/pending `#F2843A`, danger `#D64545`
- **Layout:** content max-width 1240px, 72px sticky top nav, provider dashboard has a fixed left sidebar
- **Not responsive.** At 390px the Discover filters squeeze the results off-screen. Phone layouts must be designed in 02

---

## 8. Before you start (20 min)

```bash
cd ~/fixit
git init
mkdir -p reference/prototype reference/screens tools \
         docs/{milestones,plans,reviews,features,decisions}
mv "Fixit - Prototype (offline).html" reference/prototype/
cp fixit-guide/tools/* tools/

# readable prototype source (markup, logic, sample data, colors), stdlib Python only
python3 -I tools/unpack-prototype.py "reference/prototype/Fixit - Prototype (offline).html" reference/prototype/unpacked

# screenshots of every route at 1440 and 390 (needs chromium; CHROME=… to override)
tools/screenshot-prototype.sh "reference/prototype/Fixit - Prototype (offline).html" reference/screens

git add -A && git commit -m "chore: reference material and build guide"
```

- Install **Node 22 LTS+**, **pnpm**, **Docker** (with compose), and Chromium (for screenshots and Playwright).
- Keep `../guide/` (Eduscope) out of this repo, or at least out of the agents' way. Its
  stack differs, and agents shouldn't mix the two.
- **Have 30–60 minutes free for prompt 01.** It's a real brainstorm, and your answers
  decide most of the product.
- If you later design missing screens in Claude Design (recommended for the admin console
  and booking form, see 08), export them the same way into `reference/prototype/` and re-run the tools.
