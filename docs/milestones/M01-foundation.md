# M01 — Foundation
Phase: A   Depends on: —   Est: 1 day
Mock domains after this milestone: n/a (no data layer yet)

## Goal
Create the pnpm monorepo with a strict-TypeScript web app styled by the SPEC tokens, and the `@fixit/contracts` package holding the shared enums, primitives, error envelope, Colombo date helpers and the booking state machine with its full test table. `pnpm verify` is green and enforces the CLAUDE.md lint rules from day one.

## Scope
- ARCHITECTURE §1 (repo layout: root files, `apps/web`, `packages/contracts`), §2 (contracts rules), §2.2 enums, §2.3 primitives, §2.4 pagination/errors/rule codes, §2.8 state machine + `rules.ts`, §2.9 `common/dates.ts`, §5.2 breakpoints, §5.3 `@theme` tokens, §9.6 `pnpm verify` + lint rules, §10.1 root scripts (only those that exist yet), D17 (`cta`), D19 (tsup + `source` condition).
- SPEC §2.1–§2.8 tokens (colours, type scale incl. phone overrides, radii, shadows, spacing, breakpoints, motion), fonts (Plus Jakarta Sans 400–800, JetBrains Mono).
- PRODUCT §6.1 state machine, BR-30, BR-31, BR-32, BR-34 (encoded as `canTransition`, `expiresAt`, `cancelDeadline`, `canComplete`, `bookingWindow`).
- Web: Vite + React + TS strict, Tailwind v4, `shadcn init` (components.json, `components/ui/` only), `lib/features.ts` with every Should/Could flag `false`, Vitest config.
- `ENDPOINTS` registry file with the `EndpointDef` type and an empty registry (entries are added by the milestone that first needs them).

## Out of scope
- `packages/fixtures`, MSW, http client, router, layouts (M02, M03).
- Domain schemas other than common + requests state machine/rules (added per feature milestone).
- `checkCreateRequest` and projections (M08 / M09) — only the state machine and date rules here.
- `apps/api`, Docker (M14).

## Acceptance criteria
1. `pnpm install && pnpm verify` succeeds on a clean clone (format:check, lint, typecheck, test, build).
2. `pnpm --filter @fixit/contracts test` runs the ARCHITECTURE §2.8 table (cases 1–33 incl. 26b and the table-driven case 31) and the `rules.test.ts` cases (72 h vs 00:00 expiry both orders and the Colombo/UTC boundary, `bookingWindow` at 23:59 and 00:00 Colombo, `cancelDeadline` across a month boundary) — all green.
3. `MobileInput` tests: `077 123 4567`, `0771234567`, `+94 77 123 4567` → `+94771234567`; `0112345678` fails with `Enter a Sri Lankan mobile number, like 077 123 4567.`
4. `pnpm dev:mock` (or `pnpm --filter @fixit/web dev`) serves a placeholder page at http://localhost:5173 rendered in Plus Jakarta Sans, showing a `bg-primary` button, a `bg-cta` button and a `FX-2061` label in JetBrains Mono; at 390px and 1440px there is no horizontal scroll.
5. Adding `className="bg-[#ff0000]"` or a `#1e4fa3` string literal in `apps/web/src/features/**` makes `pnpm lint` fail; adding `any` fails lint; importing from `reference/` fails lint.
6. `apps/web/src/lib/features.ts` exports every flag from ARCHITECTURE §5.1 (`savedProviders`, `checklist`, `pause`, `replies`, `providerReviews`, `adminCatalog`, `adminRequests`, `metrics`), all `false`.
7. `pnpm --filter @fixit/contracts build` emits ESM + CJS + d.ts; the web imports contracts through the `source` condition without building.

## Notes for the planner
- `sm` is redefined to 641px; `md`, `xl`, `2xl` are disabled in `@theme` (ARCHITECTURE §5.3). Only `sm` and `lg` exist.
- Token names = SPEC token minus `color-`; SPEC `color-accent` → `cta` (D17). shadcn's `accent` var maps to `primary-soft`.
- Contracts take `now: Date` as a parameter; no `new Date()`/`Date.now()` inside contracts (CLAUDE.md). Add a lint rule for that in `packages/contracts` if cheap.
- tsconfig.base: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`.
- `pnpm verify` must tolerate the absence of `apps/api` (ARCHITECTURE §9.6): `db:test:up` is added in M14.
- Fonts via `@fontsource/*` (no Google Fonts CDN).
