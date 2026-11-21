# PLAN-M01 — Foundation
Milestone: `docs/milestones/M01-foundation.md` · Start tag: `m01-start` · Verify-all: `pnpm verify`
Mock domains at start → end: n/a → n/a (no data layer yet)

Conventions for the executor:
- Work on branch `m01-foundation` (created in T1). One commit per task.
- After writing files in any task, run `pnpm format` **before** `pnpm verify` (the code below is not guaranteed to be Prettier-exact).
- Version ranges below are the majors this plan was written against. If `pnpm add` cannot resolve one, **STOP** and write a blocker; do not switch majors.
- `pnpm verify` in this milestone = `format:check && lint && typecheck && test && build` (no `db:test:up` until M14, ARCHITECTURE §9.6).

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `package.json` | Create | root scripts (§10.1 subset), dev tooling |
| `pnpm-workspace.yaml` | Create | `apps/*`, `packages/*` |
| `tsconfig.base.json` | Create | strict TS flags shared by all packages |
| `.gitignore`, `.nvmrc`, `.prettierrc`, `.prettierignore` | Create | repo hygiene, formatting |
| `eslint.config.js` | Create | flat config, typescript-eslint strict-type-checked + CLAUDE.md rules (§9.6) |
| `tools/eslint/fixit-plugin.js` | Create | local rules `no-raw-colors`, `no-reference-import` |
| `packages/contracts/package.json`, `tsconfig.json`, `tsup.config.ts` | Create | `@fixit/contracts` package, ESM+CJS+d.ts, `source` condition (D19) |
| `packages/contracts/src/index.ts` | Create | barrel |
| `packages/contracts/src/common/enums.ts` | Create | §2.2 enums |
| `packages/contracts/src/common/primitives.ts` (+ `.test.ts`) | Create | §2.3 primitives, `MobileInput` |
| `packages/contracts/src/common/pagination.ts` | Create | `PageQuery`, `paginated`, `PAGE_SIZE` |
| `packages/contracts/src/common/errors.ts` | Create | `ErrorCode`, `RuleCode`, `ErrorEnvelope` |
| `packages/contracts/src/common/dates.ts` (+ `.test.ts`) | Create | Colombo date helpers (§2.9) |
| `packages/contracts/src/requests/rules.ts` (+ `.test.ts`) | Create | `expiresAt`, `cancelDeadline`, `canComplete`, `bookingWindow`, limits |
| `packages/contracts/src/requests/state-machine.ts` (+ `.test.ts`) | Create | `canTransition`, `assertTransition`, `TransitionError` (§2.8) |
| `packages/contracts/src/endpoints.ts` | Create | `EndpointDef` type + empty `ENDPOINTS` |
| `apps/web/package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html` | Create | Vite + React + TS strict, Tailwind v4, Vitest |
| `apps/web/src/main.tsx` | Create | render placeholder |
| `apps/web/src/vite-env.d.ts` | Create | Vite client types |
| `apps/web/src/styles/globals.css` | Create | SPEC §2 tokens as `@theme` + shadcn vars (§5.3) |
| `apps/web/components.json`, `apps/web/src/components/ui/.gitkeep` | Create | shadcn init (no primitives yet) |
| `apps/web/src/lib/utils.ts` (+ `.test.ts`) | Create | `cn()` with tailwind-merge aware of our token names |
| `apps/web/src/lib/features.ts` (+ `.test.ts`) | Create | Should/Could flags, all `false` |
| `apps/web/src/app/placeholder-page.tsx` | Create | M01 placeholder (replaced in M03) |

## Tasks

### T1 — Root workspace and formatting
- [x] done
**Files:** `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.nvmrc`, `.prettierrc`, `.prettierignore`
**Context:** ARCHITECTURE §1 (root files), §9.6, §10.1; milestone notes (tsconfig flags, verify without API).
**Do:**
1. `git switch -c m01-foundation` then `git tag m01-start`.
2. `package.json`:
```json
{
  "name": "fixit",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@<output of `pnpm -v`>",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "pnpm --parallel --filter @fixit/contracts --filter @fixit/web dev",
    "dev:mock": "pnpm --filter @fixit/web dev",
    "test": "pnpm -r --if-present test",
    "typecheck": "pnpm -r --if-present typecheck",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "build": "pnpm -r --if-present build",
    "verify": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build"
  }
}
```
   (`dev:mock` gains `VITE_MOCK_DOMAINS=all` in M02 when MSW exists; `db:*`, `e2e` arrive in M14/M21.)
3. `pnpm-workspace.yaml`:
```yaml
packages:
  - apps/*
  - packages/*
```
4. `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```
5. `.gitignore`: `node_modules/`, `dist/`, `coverage/`, `*.tsbuildinfo`, `.env`, `.env.local`, `.env.*.local`, `.DS_Store`.
6. `.nvmrc`: `22`.
7. `.prettierrc`:
```json
{ "singleQuote": true, "trailingComma": "all", "printWidth": 110, "plugins": ["prettier-plugin-tailwindcss"] }
```
8. `.prettierignore`: `pnpm-lock.yaml`, `**/dist`, `coverage`, `reference`, `docs`, `*.md`, `apps/web/public/mockServiceWorker.js`.
9. `pnpm add -Dw typescript@~5.9 prettier@^3 prettier-plugin-tailwindcss@^0.6`.
10. If `pnpm install` reports ignored build scripts (esbuild, @tailwindcss/oxide later), run `pnpm approve-builds` and allow `esbuild` and `@tailwindcss/oxide` only; commit the resulting config change.
**Verify:** `pnpm format && pnpm format:check` exits 0. (`pnpm verify` will fail at `lint` until T2 — T1 and T2 are committed together if `eslint` is missing; see T2.)
**Commit:** none yet — commit together with T2.

### T2 — ESLint flat config with CLAUDE.md rules
- [x] done
**Files:** `eslint.config.js`, `tools/eslint/fixit-plugin.js`
**Context:** ARCHITECTURE §9.6 lint list; CLAUDE.md coding rules; milestone AC5 and "no `new Date()` in contracts" note.
**Do:**
1. `pnpm add -Dw eslint@^9 @eslint/js@^9 typescript-eslint@^8 eslint-plugin-react-hooks@^5.2 globals@^16`.
2. `tools/eslint/fixit-plugin.js`:
```js
// Local rules enforcing CLAUDE.md. Plain RegExp (not esquery selectors) so the patterns are exact.
const COLOR_PATTERNS = [
  /#[0-9a-fA-F]{3,8}\b/,
  /rgba?\(/,
  /\b(bg|text|border|ring|fill|stroke|from|to|via|shadow|outline|decoration)-\[/,
];
const REFERENCE = /(^|\/)reference(\/|$)/;

const noRawColors = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      raw: 'Use design tokens from globals.css @theme (e.g. bg-primary, bg-cta). No raw hex/rgb or arbitrary colour/size classes.',
    },
  },
  create(context) {
    const check = (node, text) => {
      if (COLOR_PATTERNS.some((p) => p.test(text))) context.report({ node, messageId: 'raw' });
    };
    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
    };
  },
};

const noReferenceImport = {
  meta: {
    type: 'problem',
    schema: [],
    messages: { ref: 'Never import from reference/ at runtime. Copy what you need into fixtures or code.' },
  },
  create(context) {
    const check = (node) => {
      const src = node.source;
      if (src && src.type === 'Literal' && typeof src.value === 'string' && REFERENCE.test(src.value)) {
        context.report({ node: src, messageId: 'ref' });
      }
    };
    return {
      ImportDeclaration: check,
      ImportExpression: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  },
};

export default {
  meta: { name: 'fixit' },
  rules: { 'no-raw-colors': noRawColors, 'no-reference-import': noReferenceImport },
};
```
3. `eslint.config.js`:
```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import fixit from './tools/eslint/fixit-plugin.js';

const prismaPattern = {
  group: ['@prisma/client', '@prisma/client/*'],
  message: 'Prisma types stay in apps/api infra/, module mappers and *.repo.ts.',
};
const mswPattern = { group: ['msw', 'msw/*'], message: 'MSW is only imported in src/mocks and tests.' };
const uiDeepPattern = {
  group: ['@/components/ui/*/*'],
  message: 'Import shadcn primitives from @/components/ui/<name> only.',
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'reference/**',
      'docs/**',
      'apps/web/public/mockServiceWorker.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.node },
    },
    plugins: { fixit },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' }],
      'fixit/no-reference-import': 'error',
      'no-restricted-imports': ['error', { patterns: [prismaPattern] }],
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  // Web app
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    ...reactHooks.configs['recommended-latest'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    ignores: ['apps/web/src/mocks/**', 'apps/web/src/test/**', '**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [prismaPattern, mswPattern, uiDeepPattern] }] },
  },
  {
    // Colour rule: app, features and shared components. shadcn primitives (components/ui) are generated code.
    files: ['apps/web/src/{app,features,components}/**/*.{ts,tsx}'],
    ignores: ['apps/web/src/components/ui/**'],
    rules: { 'fixit/no-raw-colors': 'error' },
  },
  // Contracts: pure, time injected
  {
    files: ['packages/contracts/src/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Contracts take `now: Date` as a parameter. No `new Date()` here.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Contracts take `now: Date` as a parameter. No `Date.now()` here.',
        },
      ],
    },
  },
  // API (from M14): Prisma allowed in infra/mappers/repos
  {
    files: ['apps/api/src/infra/**/*.ts', 'apps/api/src/modules/**/mappers*.ts', 'apps/api/src/**/*.repo.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
```
**Verify:** `pnpm lint` exits 0 (lints only `eslint.config.js` and the plugin so far). `pnpm verify` exits 0 (no packages yet → test/typecheck/build are no-ops).
**Commit:** `git add -A && git commit -m "chore: root workspace, prettier and eslint rules (M01-T1, M01-T2)"`

### T3 — `@fixit/contracts` package scaffold
- [x] done
**Files:** `packages/contracts/package.json`, `packages/contracts/tsconfig.json`, `packages/contracts/tsup.config.ts`, `packages/contracts/src/index.ts`
**Context:** ARCHITECTURE §2 rules (zod v4, deps), D19 (tsup + `source`).
**Do:**
1. `packages/contracts/package.json`:
```json
{
  "name": "@fixit/contracts",
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
  }
}
```
2. `cd packages/contracts && pnpm add zod@^4 date-fns@^4 @date-fns/tz@^1 && pnpm add -D tsup@^8 vitest@^3.2 typescript@~5.9`.
3. `tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "include": ["src", "tsup.config.ts"] }
```
4. `tsup.config.ts`:
```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
});
```
5. `src/index.ts`: `export {};` (barrel filled by later tasks; replace this line with the first real export).
**Verify:** `pnpm --filter @fixit/contracts build` creates `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, `dist/index.d.cts`. `pnpm verify` green.
**Commit:** `git commit -m "chore(contracts): scaffold @fixit/contracts with tsup and source condition (M01-T3)"`

### T4 — Shared enums
- [x] done
**Files:** `packages/contracts/src/common/enums.ts`, `packages/contracts/src/index.ts`
**Context:** ARCHITECTURE §2.2.
**Do:**
1. Copy the §2.2 code block **verbatim** into `common/enums.ts` (Role … ReverificationReason, `OPEN_STATUSES`, `FINAL_STATUSES`).
2. `index.ts`: replace `export {};` with `export * from './common/enums';`.
**Verify:** `pnpm --filter @fixit/contracts typecheck` exits 0; `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): shared enums (M01-T4)"`

### T5 — Primitives incl. `MobileInput`
- [x] done
**Files:** `packages/contracts/src/common/primitives.ts`, `packages/contracts/src/common/primitives.test.ts`, `index.ts`
**Context:** ARCHITECTURE §2.3; milestone AC3; SPEC copy is in the schema messages.
**Do:**
1. Copy the §2.3 code block **verbatim** into `common/primitives.ts` (`Id`, `RequestRef`, `Lkr`, `IsoDate`, `IsoDateTime`, `Email`, `Password`, `FullName`, `MobileInput`, `Mobile`, `OptionalReason`, `adminReason`).
2. Add below each schema the matching type: `export type Id = z.infer<typeof Id>;` for `Id`, `RequestRef`, `Lkr`, `IsoDate`, `IsoDateTime`, `Email`, `Password`, `FullName`, `Mobile` (and `export type MobileInput = z.output<typeof MobileInput>;`).
3. `index.ts`: add `export * from './common/primitives';`.
**Test:** `common/primitives.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { MobileInput, RequestRef } from './primitives';

describe('MobileInput', () => {
  it.each(['077 123 4567', '0771234567', '+94 77 123 4567', '077-123-4567'])('%s → +94771234567', (input) => {
    expect(MobileInput.parse(input)).toBe('+94771234567');
  });

  it('rejects a landline with the SPEC message', () => {
    const result = MobileInput.safeParse('0112345678');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Enter a Sri Lankan mobile number, like 077 123 4567.');
  });
});

describe('RequestRef', () => {
  it('accepts FX-2061 and rejects FX-12', () => {
    expect(RequestRef.safeParse('FX-2061').success).toBe(true);
    expect(RequestRef.safeParse('FX-12').success).toBe(false);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` → 6 tests pass. `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): primitives and MobileInput normalisation (M01-T5)"`

### T6 — Pagination and error envelope
- [x] done
**Files:** `packages/contracts/src/common/pagination.ts`, `packages/contracts/src/common/errors.ts`, `index.ts`
**Context:** ARCHITECTURE §2.4.
**Do:**
1. `pagination.ts`: `import { z } from 'zod';` then the §2.4 pagination block verbatim; add `export type PageQuery = z.infer<typeof PageQuery>;`.
2. `errors.ts`: `import { z } from 'zod';` then the §2.4 errors block verbatim (it already exports types).
3. `index.ts`: add `export * from './common/pagination';` and `export * from './common/errors';`.
**Verify:** `pnpm --filter @fixit/contracts typecheck` exits 0; `pnpm verify` green. (No test: these are plain schemas.)
**Commit:** `git commit -m "feat(contracts): pagination and error envelope (M01-T6)"`

### T7 — Colombo date helpers
- [x] done
**Files:** `packages/contracts/src/common/dates.ts`, `packages/contracts/src/common/dates.test.ts`, `index.ts`
**Context:** ARCHITECTURE §2.9 (`colomboToday`, `colomboStartOfDay`, `addDays`, wrappers on `@date-fns/tz`); CLAUDE.md "never `new Date()` in contracts". Asia/Colombo is UTC+05:30 with no DST: 00:00 Colombo = 18:30 UTC the previous day.
**Do:**
1. `common/dates.ts`:
```ts
import { TZDate } from '@date-fns/tz';

export const COLOMBO_TZ = 'Asia/Colombo';

const pad = (n: number): string => String(n).padStart(2, '0');

function parseIsoDate(iso: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Not an ISO date (YYYY-MM-DD): ${iso}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** The Colombo calendar day containing `now`, as 'YYYY-MM-DD'. */
export function colomboToday(now: Date): string {
  const z = new TZDate(now.getTime(), COLOMBO_TZ);
  return `${String(z.getFullYear())}-${pad(z.getMonth() + 1)}-${pad(z.getDate())}`;
}

/** The instant of 00:00 Asia/Colombo on `isoDate`. */
export function colomboStartOfDay(isoDate: string): Date {
  const [y, m, d] = parseIsoDate(isoDate);
  return new Date(new TZDate(y, m - 1, d, COLOMBO_TZ).getTime());
}

/** Calendar arithmetic on a 'YYYY-MM-DD' day (time-zone free). */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = parseIsoDate(isoDate);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
```
2. `index.ts`: add `export * from './common/dates';`.
**Test:** `common/dates.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { addDays, colomboStartOfDay, colomboToday } from './dates';

describe('colomboToday', () => {
  it('is still the 10th at 23:59:59 Colombo (18:29:59 UTC)', () => {
    expect(colomboToday(new Date('2026-03-10T18:29:59.000Z'))).toBe('2026-03-10');
  });
  it('is the 11th at 00:00 Colombo (18:30 UTC the day before)', () => {
    expect(colomboToday(new Date('2026-03-10T18:30:00.000Z'))).toBe('2026-03-11');
  });
});

describe('colomboStartOfDay', () => {
  it('is 18:30 UTC on the previous day', () => {
    expect(colomboStartOfDay('2026-03-11').toISOString()).toBe('2026-03-10T18:30:00.000Z');
  });
  it('rejects a non-ISO date', () => {
    expect(() => colomboStartOfDay('11/03/2026')).toThrow();
  });
});

describe('addDays', () => {
  it('crosses month, year and adds 60', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-10', 60)).toBe('2026-05-09');
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` → dates tests pass; `pnpm lint` has no `no-restricted-syntax` errors. `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): Asia/Colombo date helpers (M01-T7)"`

### T8 — Request date rules (BR-30, BR-31, BR-32, BR-34)
- [x] done
**Files:** `packages/contracts/src/requests/rules.ts`, `packages/contracts/src/requests/rules.test.ts`, `index.ts`
**Context:** PRODUCT BR-30/31/32/34, BR-33 (constants only); ARCHITECTURE §2.8 `rules.ts` signatures. `checkCreateRequest` is **out of scope** (M08).
**Do:**
1. `requests/rules.ts`:
```ts
import { addDays, colomboStartOfDay, colomboToday } from '../common/dates';

export const EXPIRY_HOURS = 72;
export const BOOKING_WINDOW_DAYS = 60;
export const OPEN_LIMIT_TOTAL = 5;
export const OPEN_LIMIT_PER_PROVIDER = 1;

const HOUR_MS = 3_600_000;

/** BR-31: min(createdAt + 72 h, 00:00 Colombo on preferredDate). */
export function expiresAt(createdAt: Date, preferredDate: string): Date {
  const byHours = createdAt.getTime() + EXPIRY_HOURS * HOUR_MS;
  const byDay = colomboStartOfDay(preferredDate).getTime();
  return new Date(Math.min(byHours, byDay));
}

/** BR-30: customer may cancel an Accepted request while now < this instant (00:00 Colombo on preferredDate). */
export function cancelDeadline(preferredDate: string): Date {
  return colomboStartOfDay(preferredDate);
}

/** BR-32: completion allowed on or after the preferred Colombo day. */
export function canComplete(preferredDate: string, now: Date): boolean {
  return colomboToday(now) >= preferredDate;
}

/** BR-34: tomorrow … today + 60 (Colombo days, inclusive). */
export function bookingWindow(now: Date): { min: string; max: string } {
  const today = colomboToday(now);
  return { min: addDays(today, 1), max: addDays(today, BOOKING_WINDOW_DAYS) };
}
```
2. `index.ts`: add `export * from './requests/rules';`.
**Test:** `requests/rules.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { bookingWindow, canComplete, cancelDeadline, expiresAt } from './rules';

const at = (iso: string) => new Date(iso);

describe('expiresAt (BR-31)', () => {
  it('uses the 72 h bound when it comes first', () => {
    expect(expiresAt(at('2026-03-09T04:30:00.000Z'), '2026-03-15').toISOString()).toBe('2026-03-12T04:30:00.000Z');
  });
  it('uses 00:00 Colombo on the preferred date when it comes first', () => {
    expect(expiresAt(at('2026-03-09T04:30:00.000Z'), '2026-03-11').toISOString()).toBe('2026-03-10T18:30:00.000Z');
  });
  it('uses Colombo midnight, not UTC midnight, when the UTC day differs', () => {
    // created 01:30 Colombo on 10 Mar (still 9 Mar in UTC); 72 h → 2026-03-12T20:00Z; midnight 12 Mar Colombo → 2026-03-11T18:30Z
    expect(expiresAt(at('2026-03-09T20:00:00.000Z'), '2026-03-12').toISOString()).toBe('2026-03-11T18:30:00.000Z');
  });
  it('both bounds equal → that instant', () => {
    expect(expiresAt(at('2026-03-09T18:30:00.000Z'), '2026-03-13').toISOString()).toBe('2026-03-12T18:30:00.000Z');
  });
});

describe('bookingWindow (BR-34)', () => {
  it('at 23:59 Colombo on 10 Mar → 11 Mar … 9 May', () => {
    expect(bookingWindow(at('2026-03-10T18:29:00.000Z'))).toEqual({ min: '2026-03-11', max: '2026-05-09' });
  });
  it('at 00:00 Colombo on 11 Mar → 12 Mar … 10 May', () => {
    expect(bookingWindow(at('2026-03-10T18:30:00.000Z'))).toEqual({ min: '2026-03-12', max: '2026-05-10' });
  });
});

describe('cancelDeadline (BR-30)', () => {
  it('is 00:00 Colombo on the preferred date across a month boundary', () => {
    expect(cancelDeadline('2026-04-01').toISOString()).toBe('2026-03-31T18:30:00.000Z');
  });
});

describe('canComplete (BR-32)', () => {
  it('false at 23:59 Colombo the day before, true at 00:00 on the day and later', () => {
    expect(canComplete('2026-03-15', at('2026-03-14T18:29:00.000Z'))).toBe(false);
    expect(canComplete('2026-03-15', at('2026-03-14T18:30:00.000Z'))).toBe(true);
    expect(canComplete('2026-03-15', at('2026-04-14T06:00:00.000Z'))).toBe(true);
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` → all rules tests pass. `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): request date rules for expiry, cancel, complete, booking window (M01-T8)"`

### T9 — Booking state machine
- [x] done
**Files:** `packages/contracts/src/requests/state-machine.ts`, `packages/contracts/src/requests/state-machine.test.ts`, `index.ts`
**Context:** PRODUCT §6.1, BR-30/31/32; ARCHITECTURE §2.8 code + test table (cases 1–33, 26b, table-driven 31).
**Do:**
1. `requests/state-machine.ts`:
```ts
import { z } from 'zod';
import { FINAL_STATUSES, type RequestStatus } from '../common/enums';
import { canComplete, cancelDeadline } from './rules';

export type MachineActor =
  | { kind: 'customer'; userId: string }
  | { kind: 'provider'; userId: string }
  | { kind: 'admin'; userId: string }
  | { kind: 'system' };

export interface MachineRequest {
  status: RequestStatus;
  customerId: string;
  providerUserId: string;
  preferredDate: string; // IsoDate (Colombo day)
  expiresAt: Date; // rules.expiresAt(createdAt, preferredDate)
}
export interface TransitionInput {
  reason?: string | undefined;
}

export const TransitionReason = z.enum([
  'final_status',
  'invalid_transition',
  'not_allowed_for_actor',
  'not_owner',
  'expired',
  'not_yet_expired',
  'past_cancel_deadline',
  'before_preferred_date',
  'reason_required',
]);
export type TransitionReason = z.infer<typeof TransitionReason>;
export type TransitionResult = { ok: true } | { ok: false; reason: TransitionReason };

type Target = Exclude<RequestStatus, 'pending'>;
type ActorKind = MachineActor['kind'];

const EDGES: Record<'pending' | 'accepted', Partial<Record<Target, readonly ActorKind[]>>> = {
  pending: {
    accepted: ['provider'],
    declined: ['provider', 'system'],
    cancelled: ['customer', 'admin', 'system'],
    expired: ['system'],
  },
  accepted: { cancelled: ['customer', 'admin', 'system'], completed: ['provider'] },
};

const yes: TransitionResult = { ok: true };
const no = (reason: TransitionReason): TransitionResult => ({ ok: false, reason });

export function canTransition(
  req: MachineRequest,
  to: RequestStatus,
  actor: MachineActor,
  now: Date,
  input: TransitionInput = {},
): TransitionResult {
  if ((FINAL_STATUSES as readonly RequestStatus[]).includes(req.status)) return no('final_status');
  const from = req.status as 'pending' | 'accepted';
  const allowed = to === 'pending' ? undefined : EDGES[from][to];
  if (!allowed) return no('invalid_transition');
  if (!allowed.includes(actor.kind)) return no('not_allowed_for_actor');
  if (actor.kind === 'customer' && actor.userId !== req.customerId) return no('not_owner');
  if (actor.kind === 'provider' && actor.userId !== req.providerUserId) return no('not_owner');

  const expired = now.getTime() >= req.expiresAt.getTime();
  if (from === 'pending') {
    if (to === 'expired') return expired ? yes : no('not_yet_expired');
    if (expired && actor.kind !== 'system') return no('expired');
  }
  if (
    from === 'accepted' &&
    to === 'cancelled' &&
    actor.kind === 'customer' &&
    now.getTime() >= cancelDeadline(req.preferredDate).getTime()
  ) {
    return no('past_cancel_deadline');
  }
  if (to === 'completed' && !canComplete(req.preferredDate, now)) return no('before_preferred_date');
  if (actor.kind === 'admin' && to === 'cancelled') {
    const len = input.reason?.trim().length ?? 0;
    if (len < 10 || len > 500) return no('reason_required');
  }
  return yes;
}

/** Thrown by assertTransition. The API filter and the mocks map it to 409 INVALID_TRANSITION (or 403/404, ARCHITECTURE §7.4). */
export class TransitionError extends Error {
  override readonly name = 'TransitionError';
  constructor(readonly reason: TransitionReason) {
    super(`Transition refused: ${reason}`);
  }
}

export function assertTransition(...args: Parameters<typeof canTransition>): void {
  const result = canTransition(...args);
  if (!result.ok) throw new TransitionError(result.reason);
}
```
2. `index.ts`: add `export * from './requests/state-machine';`.
**Test:** `requests/state-machine.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { FINAL_STATUSES, RequestStatus } from '../common/enums';
import { expiresAt } from './rules';
import {
  assertTransition,
  canTransition,
  TransitionError,
  type MachineActor,
  type MachineRequest,
  type TransitionReason,
} from './state-machine';

const CREATED = new Date('2026-03-09T04:30:00.000Z'); // 10:00 Colombo, 9 Mar
const NOW = new Date('2026-03-10T04:30:00.000Z'); // 10:00 Colombo, 10 Mar
const PREFERRED = '2026-03-15'; // cancelDeadline = 2026-03-14T18:30Z
const EXPIRES = expiresAt(CREATED, PREFERRED); // 2026-03-12T04:30Z (72 h bound)
const at = (iso: string) => new Date(iso);
const shift = (d: Date, ms: number) => new Date(d.getTime() + ms);

const P: MachineActor = { kind: 'provider', userId: 'p1' };
const OTHER_P: MachineActor = { kind: 'provider', userId: 'p2' };
const C: MachineActor = { kind: 'customer', userId: 'c1' };
const OTHER_C: MachineActor = { kind: 'customer', userId: 'c2' };
const A: MachineActor = { kind: 'admin', userId: 'a1' };
const S: MachineActor = { kind: 'system' };
const EVERY_ACTOR = [C, P, A, S];

const req = (status: RequestStatus): MachineRequest => ({
  status,
  customerId: 'c1',
  providerUserId: 'p1',
  preferredDate: PREFERRED,
  expiresAt: EXPIRES,
});
const OK = { ok: true };
const NO = (reason: TransitionReason) => ({ ok: false, reason });
const REASON_10 = 'a'.repeat(10);

it('fixture: request expires on the 72 h bound', () => {
  expect(EXPIRES.toISOString()).toBe('2026-03-12T04:30:00.000Z');
});

describe('from pending', () => {
  it('1 accepted by P before expiry → ok', () => {
    expect(canTransition(req('pending'), 'accepted', P, NOW)).toEqual(OK);
  });
  it('2 accepted by other provider → not_owner', () => {
    expect(canTransition(req('pending'), 'accepted', OTHER_P, NOW)).toEqual(NO('not_owner'));
  });
  it('3 accepted by C → not_allowed_for_actor', () => {
    expect(canTransition(req('pending'), 'accepted', C, NOW)).toEqual(NO('not_allowed_for_actor'));
  });
  it('4 accepted by admin → not_allowed_for_actor', () => {
    expect(canTransition(req('pending'), 'accepted', A, NOW)).toEqual(NO('not_allowed_for_actor'));
  });
  it('5 accepted by P at expiresAt → expired', () => {
    expect(canTransition(req('pending'), 'accepted', P, EXPIRES)).toEqual(NO('expired'));
  });
  it('6 declined by P → ok', () => {
    expect(canTransition(req('pending'), 'declined', P, NOW)).toEqual(OK);
  });
  it('7 declined by system (provider suspended) → ok', () => {
    expect(canTransition(req('pending'), 'declined', S, NOW)).toEqual(OK);
  });
  it('8 declined by C → not_allowed_for_actor', () => {
    expect(canTransition(req('pending'), 'declined', C, NOW)).toEqual(NO('not_allowed_for_actor'));
  });
  it('9 cancelled by C before expiry → ok', () => {
    expect(canTransition(req('pending'), 'cancelled', C, NOW)).toEqual(OK);
  });
  it('10 cancelled by other customer → not_owner', () => {
    expect(canTransition(req('pending'), 'cancelled', OTHER_C, NOW)).toEqual(NO('not_owner'));
  });
  it('11 cancelled by C after expiresAt → expired', () => {
    expect(canTransition(req('pending'), 'cancelled', C, shift(EXPIRES, 1))).toEqual(NO('expired'));
  });
  it('12 cancelled by admin with a 10-char reason → ok', () => {
    expect(canTransition(req('pending'), 'cancelled', A, NOW, { reason: REASON_10 })).toEqual(OK);
  });
  it.each([
    ['no reason', undefined],
    ['9 chars', 'a'.repeat(9)],
    ['501 chars', 'a'.repeat(501)],
    ['10 spaces', ' '.repeat(10)],
  ])('13 cancelled by admin with %s → reason_required', (_label, reason) => {
    expect(canTransition(req('pending'), 'cancelled', A, NOW, { reason })).toEqual(NO('reason_required'));
  });
  it('14 cancelled by system (customer suspended) → ok', () => {
    expect(canTransition(req('pending'), 'cancelled', S, NOW)).toEqual(OK);
  });
  it('15 cancelled by P → not_allowed_for_actor (providers never cancel)', () => {
    expect(canTransition(req('pending'), 'cancelled', P, NOW)).toEqual(NO('not_allowed_for_actor'));
  });
  it('16 expired by system at expiresAt → ok', () => {
    expect(canTransition(req('pending'), 'expired', S, EXPIRES)).toEqual(OK);
  });
  it('17 expired by system 1 ms before expiresAt → not_yet_expired', () => {
    expect(canTransition(req('pending'), 'expired', S, shift(EXPIRES, -1))).toEqual(NO('not_yet_expired'));
  });
  it.each([C, P, A])('18 expired by $kind → not_allowed_for_actor', (actor) => {
    expect(canTransition(req('pending'), 'expired', actor, EXPIRES)).toEqual(NO('not_allowed_for_actor'));
  });
  it('19 completed by P → invalid_transition', () => {
    expect(canTransition(req('pending'), 'completed', P, NOW)).toEqual(NO('invalid_transition'));
  });
  it.each(EVERY_ACTOR)('32 pending → pending by $kind → invalid_transition', (actor) => {
    expect(canTransition(req('pending'), 'pending', actor, NOW)).toEqual(NO('invalid_transition'));
  });
});

describe('from accepted', () => {
  it('20 cancelled by C at 23:59 Colombo the day before → ok', () => {
    expect(canTransition(req('accepted'), 'cancelled', C, at('2026-03-14T18:29:00.000Z'))).toEqual(OK);
  });
  it('21 cancelled by C at 00:00 on preferredDate → past_cancel_deadline', () => {
    expect(canTransition(req('accepted'), 'cancelled', C, at('2026-03-14T18:30:00.000Z'))).toEqual(
      NO('past_cancel_deadline'),
    );
  });
  it('22 cancelled by admin with reason after the cut-off → ok', () => {
    expect(
      canTransition(req('accepted'), 'cancelled', A, at('2026-03-14T20:00:00.000Z'), { reason: REASON_10 }),
    ).toEqual(OK);
  });
  it('23 cancelled by system (suspension) after the cut-off → ok', () => {
    expect(canTransition(req('accepted'), 'cancelled', S, at('2026-03-14T20:00:00.000Z'))).toEqual(OK);
  });
  it('24 cancelled by P → not_allowed_for_actor', () => {
    expect(canTransition(req('accepted'), 'cancelled', P, NOW)).toEqual(NO('not_allowed_for_actor'));
  });
  it('25 completed by P on preferredDate → ok', () => {
    expect(canTransition(req('accepted'), 'completed', P, at('2026-03-15T06:00:00.000Z'))).toEqual(OK);
  });
  it.each([
    ['a day earlier', '2026-03-13T06:00:00.000Z'],
    ['23:59 Colombo the day before (18:29 UTC)', '2026-03-14T18:29:00.000Z'],
  ])('26 completed by P %s → before_preferred_date', (_label, iso) => {
    expect(canTransition(req('accepted'), 'completed', P, at(iso))).toEqual(NO('before_preferred_date'));
  });
  it('26b completed by P at 00:00 Colombo on preferredDate (18:30 UTC day before) → ok', () => {
    expect(canTransition(req('accepted'), 'completed', P, at('2026-03-14T18:30:00.000Z'))).toEqual(OK);
  });
  it('27 completed by P 30 days after preferredDate → ok', () => {
    expect(canTransition(req('accepted'), 'completed', P, at('2026-04-14T06:00:00.000Z'))).toEqual(OK);
  });
  it.each([C, A])('28 completed by $kind → not_allowed_for_actor', (actor) => {
    expect(canTransition(req('accepted'), 'completed', actor, at('2026-03-15T06:00:00.000Z'))).toEqual(
      NO('not_allowed_for_actor'),
    );
  });
  const case29 = (['declined', 'expired', 'pending'] as const).flatMap((to) =>
    EVERY_ACTOR.map((actor) => ({ to, actor })),
  );
  it.each(case29)('29 accepted → $to by $actor.kind → invalid_transition', ({ to, actor }) => {
    expect(canTransition(req('accepted'), to, actor, NOW)).toEqual(NO('invalid_transition'));
  });
  it('30 completed by other provider → not_owner', () => {
    expect(canTransition(req('accepted'), 'completed', OTHER_P, at('2026-03-15T06:00:00.000Z'))).toEqual(
      NO('not_owner'),
    );
  });
  it('33 accepted → accepted by P → invalid_transition', () => {
    expect(canTransition(req('accepted'), 'accepted', P, NOW)).toEqual(NO('invalid_transition'));
  });
});

describe('31 final statuses', () => {
  const cases = FINAL_STATUSES.flatMap((from) =>
    RequestStatus.options.flatMap((to) => EVERY_ACTOR.map((actor) => ({ from, to, actor }))),
  );
  it('covers 4 × 6 × 4 combinations', () => {
    expect(cases).toHaveLength(96);
  });
  it.each(cases)('$from → $to by $actor.kind → final_status', ({ from, to, actor }) => {
    expect(canTransition(req(from), to, actor, NOW, { reason: REASON_10 })).toEqual(NO('final_status'));
  });
});

describe('assertTransition', () => {
  it('returns on an allowed transition', () => {
    expect(() => {
      assertTransition(req('pending'), 'accepted', P, NOW);
    }).not.toThrow();
  });
  it('throws TransitionError carrying the reason', () => {
    try {
      assertTransition(req('completed'), 'cancelled', C, NOW);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(TransitionError);
      expect((e as TransitionError).reason).toBe('final_status');
    }
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` → every state-machine test passes (≈150 incl. the 96 table rows). `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): booking state machine with full transition table (M01-T9)"`

### T10 — Endpoint registry type
- [x] done
**Files:** `packages/contracts/src/endpoints.ts`, `index.ts`
**Context:** ARCHITECTURE §2.7; milestone scope (empty registry; entries come with the milestone that needs them).
**Do:**
1. `endpoints.ts`:
```ts
import type { z } from 'zod';

export type Access = 'public' | 'user' | 'provider' | 'admin';
// user = signed-in non-admin (every user is a customer); provider = user with a published listing
export type OwnerRule =
  | 'none'
  | 'self'
  | 'request_customer'
  | 'request_provider'
  | 'resource_provider'
  | 'provider_or_admin';
export type Domain = 'auth' | 'catalog' | 'providers' | 'requests' | 'reviews' | 'admin';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface EndpointDef {
  id: string;
  domain: Domain;
  method: HttpMethod;
  path: `/${string}`; // relative to /api, Express-style params (/me/requests/:ref)
  access: readonly Access[]; // who passes the role check
  owner: OwnerRule; // other owner → 404
  body?: z.ZodType;
  query?: z.ZodType;
  response?: z.ZodType; // undefined = 204
  multipart?: true;
  rateLimited?: true;
  refs: readonly string[];
}

/** One entry per row of ARCHITECTURE §3. Entries are added by the milestone that first needs them. */
export const ENDPOINTS = {} as const satisfies Record<string, EndpointDef>;
export type EndpointId = keyof typeof ENDPOINTS;
```
2. `index.ts`: add `export * from './endpoints';`.
**Verify:** `pnpm --filter @fixit/contracts build` emits ESM, CJS and d.ts (`ls packages/contracts/dist` shows `index.js index.cjs index.d.ts index.d.cts`). `pnpm verify` green.
**Commit:** `git commit -m "feat(contracts): endpoint registry type and empty ENDPOINTS (M01-T10)"`

### T11 — Web app scaffold (Vite + React + TS strict + Vitest)
- [x] done
**Files:** `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/vitest.config.ts`, `apps/web/index.html`, `apps/web/src/main.tsx`, `apps/web/src/vite-env.d.ts`, `apps/web/src/styles/globals.css` (stub), `apps/web/src/app/placeholder-page.tsx` (stub)
**Context:** ARCHITECTURE §1 (web tree), D19 (`source` condition), §10.1 web scripts.
**Do:**
1. `apps/web/package.json`:
```json
{
  "name": "@fixit/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```
   (`e2e` is added in M21.)
2. `cd apps/web && pnpm add react@^19 react-dom@^19 @fixit/contracts@workspace:* && pnpm add -D vite@^7 @vitejs/plugin-react@^5 @types/react@^19 @types/react-dom@^19 typescript@~5.9 vitest@^3.2 jsdom@^26 tailwindcss@^4 @tailwindcss/vite@^4`.
3. `tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "customConditions": ["source"],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src", "vite.config.ts", "vitest.config.ts"]
}
```
4. `vite.config.ts`:
```ts
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // D19: consume @fixit/contracts TypeScript sources directly, no build step
    conditions: ['source', ...defaultClientConditions],
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, strictPort: true },
});
```
5. `vitest.config.ts`:
```ts
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
  }),
);
```
6. `index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Fixit</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
7. `src/vite-env.d.ts`: `/// <reference types="vite/client" />`
8. `src/styles/globals.css` (stub, replaced in T12): `@import 'tailwindcss';`
9. `src/app/placeholder-page.tsx` (stub, completed in T15):
```tsx
export function PlaceholderPage() {
  return <h1>Fixit</h1>;
}
```
10. `src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';
import { PlaceholderPage } from '@/app/placeholder-page';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root is missing from index.html');

createRoot(rootEl).render(
  <StrictMode>
    <PlaceholderPage />
  </StrictMode>,
);
```
**Verify:** `pnpm --filter @fixit/web build` succeeds; `pnpm --filter @fixit/web dev` serves "Fixit" at http://localhost:5173 (stop it after). `pnpm verify` green.
**Commit:** `git commit -m "chore(web): scaffold Vite React app with strict TS and Vitest (M01-T11)"`

### T12 — Design tokens in `globals.css`
- [ ] done
**Files:** `apps/web/src/styles/globals.css`, `.prettierrc`
**Context:** SPEC §2.1–§2.8; ARCHITECTURE §5.3 (full block), D17 (`cta`); milestone notes (`sm` = 641px; `md`/`xl`/`2xl` disabled; fonts via `@fontsource`).
**Do:**
1. `cd apps/web && pnpm add @fontsource/plus-jakarta-sans@^5 @fontsource/jetbrains-mono@^5 tw-animate-css@^1`.
2. Replace `globals.css` with the ARCHITECTURE §5.3 block, completed as follows (this is the full file):
```css
@import '@fontsource/plus-jakarta-sans/400.css';
@import '@fontsource/plus-jakarta-sans/500.css';
@import '@fontsource/plus-jakarta-sans/600.css';
@import '@fontsource/plus-jakarta-sans/700.css';
@import '@fontsource/plus-jakarta-sans/800.css';
@import '@fontsource/jetbrains-mono/400.css';
@import 'tailwindcss';
@import 'tw-animate-css';

@theme {
  --breakpoint-sm: 40.0625rem; /* 641px: tablet+ */
  --breakpoint-md: initial;
  --breakpoint-xl: initial;
  --breakpoint-2xl: initial; /* lg = 1024 kept */

  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* SPEC §2.1 colour roles (names = SPEC token minus "color-"; color-accent → cta, D17) */
  --color-primary: #1e4fa3;
  --color-primary-hover: #163c7e;
  --color-primary-soft: #eaf0fa;
  --color-primary-soft-border: #c9d6ee;
  --color-primary-flash: #f3f7fd;
  --color-page: #f6f7f9;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f2f4;
  --color-placeholder-a: #eef0f3;
  --color-placeholder-b: #e6e9ee;
  --color-divider-subtle: #eef0f3;
  --color-border: #e3e6eb;
  --color-border-strong: #d3d8e0;
  --color-border-control: #c5cbd5;
  --color-text: #1a1d24;
  --color-text-muted: #545b68;
  --color-text-subtle: #6e7482;
  --color-icon-subtle: #8a909c;
  --color-success: #1f8a4c;
  --color-success-soft: #e7f5ec;
  --color-success-text: #17703d;
  --color-warning: #f2843a;
  --color-warning-soft: #fdf0e6;
  --color-warning-text: #a44e12;
  --color-warning-text-strong: #8a4310;
  --color-danger: #d64545;
  --color-danger-soft: #fbecec;
  --color-danger-text: #b23a3a;
  --color-cta: #f2843a;
  --color-cta-hover: #e0722a;
  --color-on-cta: #1a1d24;
  --color-star: #f2843a;
  --color-star-empty: #e3e6eb;
  --color-on-primary-muted: #d6e0f3;
  --color-cta-outline: #6e8fcb;
  --color-footer-bg: #14254a;
  --color-footer-text: #c9d3e6;
  --color-footer-divider: #2a3d66;
  --color-footer-meta: #8fa0c2;
  --color-tooltip-bg: #1a1d24;
  --color-toast-action: #9db8ea;
  --color-overlay: rgb(20 24 36 / 0.5);

  /* SPEC §2.3 type scale */
  --text-display: 3.5rem;
  --text-display--line-height: 4rem;
  --text-display--font-weight: 800;
  --text-display--letter-spacing: -0.03em;
  --text-title-xl: 2.5rem;
  --text-title-xl--line-height: 3rem;
  --text-title-xl--font-weight: 800;
  --text-title-xl--letter-spacing: -0.02em;
  --text-stat: 2.125rem;
  --text-stat--line-height: 2.5rem;
  --text-stat--font-weight: 800;
  --text-stat--letter-spacing: -0.02em;
  --text-price-xl: 1.875rem;
  --text-price-xl--line-height: 2.375rem;
  --text-price-xl--font-weight: 800;
  --text-title-lg: 1.75rem;
  --text-title-lg--line-height: 2.25rem;
  --text-title-lg--font-weight: 700;
  --text-title-lg--letter-spacing: -0.01em;
  --text-price-lg: 1.375rem;
  --text-price-lg--line-height: 1.75rem;
  --text-price-lg--font-weight: 800;
  --text-logo: 1.3125rem;
  --text-logo--line-height: 1.2;
  --text-logo--font-weight: 800;
  --text-logo--letter-spacing: -0.02em;
  --text-title-md: 1.25rem;
  --text-title-md--line-height: 1.75rem;
  --text-title-md--font-weight: 700;
  --text-title-sm: 1.1875rem;
  --text-title-sm--line-height: 1.625rem;
  --text-title-sm--font-weight: 700;
  --text-lead: 1.125rem;
  --text-lead--line-height: 1.75rem;
  --text-title-xs: 1.0625rem;
  --text-title-xs--line-height: 1.375rem;
  --text-title-xs--font-weight: 700;
  --text-body: 1rem;
  --text-body--line-height: 1.5rem;
  --text-body-sm: 0.9375rem;
  --text-body-sm--line-height: 1.4375rem;
  --text-label: 0.875rem;
  --text-label--line-height: 1.25rem;
  --text-meta: 0.8125rem;
  --text-meta--line-height: 1.1875rem;
  --text-caption: 0.75rem;
  --text-caption--line-height: 1rem;
  --text-caption--font-weight: 700;
  --text-mono: 0.6875rem;
  --text-mono--line-height: 1rem;

  /* SPEC §2.4 radii */
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 12px;
  --radius-lg: 14px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-3xl: 24px;
  --radius-4xl: 28px;

  /* SPEC §2.5 shadows */
  --shadow-xs: 0 1px 3px rgb(20 24 36 / 0.1);
  --shadow-knob: 0 1px 3px rgb(0 0 0 / 0.2);
  --shadow-badge: 0 2px 8px rgb(20 24 36 / 0.08);
  --shadow-search-sm: 0 6px 20px rgb(20 24 36 / 0.05);
  --shadow-hover: 0 8px 24px rgb(20 24 36 / 0.08);
  --shadow-search: 0 12px 32px rgb(20 24 36 / 0.08);
  --shadow-tooltip: 0 12px 32px rgb(20 24 36 / 0.2);
  --shadow-float: 0 16px 40px rgb(20 24 36 / 0.14);
  --shadow-toast: 0 16px 40px rgb(20 24 36 / 0.25);
  --shadow-modal: 0 24px 64px rgb(20 24 36 / 0.25);

  /* SPEC §2.6 layout */
  --container-content: 1240px;
  --container-form: 720px;
  --container-auth: 440px;
  --spacing-nav: 72px;
  --spacing-topbar: 56px;
  --spacing-sidebar: 256px;
  --spacing-filters: 280px;
  --spacing-aside: 380px;

  /* SPEC §2.8 motion */
  --default-transition-duration: 150ms;
}

/* Phone overrides (SPEC §2.3, §2.6) */
@media (max-width: 640px) {
  :root {
    --text-display: 2.25rem;
    --text-display--line-height: 2.75rem;
    --text-title-xl: 1.75rem;
    --text-title-xl--line-height: 2.25rem;
    --text-title-lg: 1.375rem;
    --text-title-lg--line-height: 1.875rem;
    --text-stat: 1.75rem;
    --text-stat--line-height: 2.25rem;
    --text-price-xl: 1.5rem;
    --text-price-xl--line-height: 2rem;
    --spacing-nav: 64px;
  }
}

/* shadcn semantic variables → our tokens */
:root {
  --background: var(--color-page);
  --foreground: var(--color-text);
  --card: var(--color-surface);
  --card-foreground: var(--color-text);
  --popover: var(--color-surface);
  --popover-foreground: var(--color-text);
  --primary-foreground: #ffffff;
  --secondary: var(--color-surface);
  --secondary-foreground: var(--color-text);
  --muted: var(--color-page);
  --muted-foreground: var(--color-text-muted);
  --accent: var(--color-primary-soft);
  --accent-foreground: var(--color-primary);
  --destructive: var(--color-danger-text);
  --input: var(--color-border);
  --ring: var(--color-primary);
  --radius: 12px;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

@layer base {
  body {
    @apply bg-page font-sans text-text antialiased;
  }
  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```
3. `.prettierrc`: add `"tailwindStylesheet": "./apps/web/src/styles/globals.css"`.
**Verify:** `pnpm --filter @fixit/web build` succeeds; `grep -c 'color-cta' apps/web/dist/assets/*.css` ≥ 1 only after T15 uses it (skip now). `pnpm verify` green.
**Commit:** `git commit -m "feat(web): SPEC design tokens, fonts and shadcn variables in globals.css (M01-T12)"`

### T13 — shadcn init and `cn()` aware of token names
- [ ] done
**Files:** `apps/web/components.json`, `apps/web/src/components/ui/.gitkeep`, `apps/web/src/lib/utils.ts`, `apps/web/src/lib/utils.test.ts`
**Context:** CLAUDE.md (shadcn primitives only in `components/ui/`); ARCHITECTURE §5.3. Do **not** run `shadcn init` interactively and do **not** add any primitive in M01 (its generated `globals.css` edits would overwrite our tokens). Our `text-<size>` names (`text-label`) collide with `text-<colour>` (`text-text`) in tailwind-merge unless registered — without this, `cn('text-text', 'text-label')` drops one class.
**Do:**
1. `cd apps/web && pnpm add clsx@^2 tailwind-merge@^3 class-variance-authority@^0.7 lucide-react`.
2. `components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/styles/globals.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/lib"
  },
  "iconLibrary": "lucide"
}
```
3. `src/components/ui/.gitkeep` (empty file).
4. `src/lib/utils.ts`:
```ts
import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** Must list every --text-* and --shadow-* name from globals.css @theme. */
const TEXT_SIZES = [
  'display', 'title-xl', 'stat', 'price-xl', 'title-lg', 'price-lg', 'logo', 'title-md',
  'title-sm', 'lead', 'title-xs', 'body', 'body-sm', 'label', 'meta', 'caption', 'mono',
];
const SHADOWS = ['xs', 'knob', 'badge', 'search-sm', 'hover', 'search', 'tooltip', 'float', 'toast', 'modal'];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: TEXT_SIZES }],
      shadow: [{ shadow: SHADOWS }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```
**Test:** `src/lib/utils.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('keeps a token text colour and a token text size together', () => {
    expect(cn('text-text', 'text-label')).toBe('text-text text-label');
  });
  it('later size wins over earlier size', () => {
    expect(cn('text-body', 'text-label')).toBe('text-label');
  });
  it('later colour wins over earlier colour', () => {
    expect(cn('text-text', 'text-text-muted')).toBe('text-text-muted');
  });
  it('token shadows conflict with each other', () => {
    expect(cn('shadow-xs', 'shadow-hover')).toBe('shadow-hover');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test` → 4 tests pass. `pnpm verify` green. If any `cn` case fails, do not change the test or improvise config — write a blocker.
**Commit:** `git commit -m "feat(web): shadcn config and token-aware cn() (M01-T13)"`

### T14 — Feature flags
- [ ] done
**Files:** `apps/web/src/lib/features.ts`, `apps/web/src/lib/features.test.ts`
**Context:** ARCHITECTURE §5.1 (flag names → F-10, F-21, F-22, F-23, F-24, F-34, F-35, F-36); milestone AC6. Typed as `boolean` (not `as const`) so later `if (features.x)` doesn't trip `no-unnecessary-condition`.
**Do:**
```ts
// apps/web/src/lib/features.ts
/** Should/Could features stay hidden until their milestone flips the flag (CLAUDE.md, ARCHITECTURE §5.1). */
export type FeatureFlag =
  | 'savedProviders' // F-10
  | 'checklist' // F-21
  | 'pause' // F-22
  | 'replies' // F-23
  | 'providerReviews' // F-24
  | 'adminCatalog' // F-34
  | 'adminRequests' // F-35
  | 'metrics'; // F-36

export const features: Readonly<Record<FeatureFlag, boolean>> = {
  savedProviders: false,
  checklist: false,
  pause: false,
  replies: false,
  providerReviews: false,
  adminCatalog: false,
  adminRequests: false,
  metrics: false,
};
```
**Test:** `src/lib/features.test.ts`
```ts
import { expect, it } from 'vitest';
import { features } from './features';

it('exports every Should/Could flag, all off', () => {
  expect(Object.keys(features).sort()).toEqual(
    ['adminCatalog', 'adminRequests', 'checklist', 'metrics', 'pause', 'providerReviews', 'replies', 'savedProviders'],
  );
  expect(Object.values(features).every((v) => !v)).toBe(true);
});
```
**Verify:** `pnpm --filter @fixit/web test` passes. `pnpm verify` green.
**Commit:** `git commit -m "feat(web): Should/Could feature flags, all off (M01-T14)"`

### T15 — Placeholder page
- [ ] done
**Files:** `apps/web/src/app/placeholder-page.tsx`
**Context:** milestone AC4 and AC7. Not a SPEC screen; replaced by the router in M03. Imports `RequestRef` from contracts to prove the `source` condition works without building contracts.
**Do:**
```tsx
import { RequestRef } from '@fixit/contracts';

const sampleRef = RequestRef.parse('FX-2061');

export function PlaceholderPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-content flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-title-xl text-text">Fixit</h1>
      <p className="text-body text-text-muted">Foundation placeholder. The app shell replaces this page in M03.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="h-12 rounded-md bg-primary px-5 text-label font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Find a provider
        </button>
        <button
          type="button"
          className="h-12 rounded-md bg-cta px-5 text-label font-semibold text-on-cta transition-colors hover:bg-cta-hover"
        >
          Join as a provider
        </button>
      </div>
      <span className="font-mono text-mono text-text-subtle">{sampleRef}</span>
    </main>
  );
}
```
States: static page only (no data → no loading/empty/error states). Phone (390): buttons stack full-width (`flex-col`), gutter `px-4`; tablet+ `sm:flex-row sm:px-6`; desktop `lg:px-8`, max 1240.
**Verify:** `rm -rf packages/contracts/dist && pnpm --filter @fixit/web build` succeeds (source condition, no contracts build). `pnpm verify` green.
**Commit:** `git commit -m "feat(web): M01 placeholder page using tokens and contracts (M01-T15)"`

### T16 — Acceptance walk-through
- [ ] done
**Files:** none (temporary probe files are deleted before commit); tick the boxes in this plan.
**Do / Verify:** run each check; all must pass. If any fails, fix within the owning task's files only, or write a blocker.
1. **AC1** — `git stash -u` nothing pending; `rm -rf node_modules apps/*/node_modules packages/*/node_modules packages/contracts/dist && pnpm install && pnpm verify` → exit 0.
2. **AC2** — `pnpm --filter @fixit/contracts test` → state-machine (cases 1–33, 26b, 96-row case 31) and rules (72 h vs 00:00 both orders + Colombo/UTC, bookingWindow 23:59/00:00, cancelDeadline month boundary) all green.
3. **AC3** — same run shows the 4 `MobileInput` normalisation cases and the `0112345678` message case green.
4. **AC4** — `pnpm dev:mock`, open http://localhost:5173. In DevTools: computed `font-family` of `h1` starts with `Plus Jakarta Sans` (Network tab shows the woff2 loaded); blue `bg-primary` and orange `bg-cta` buttons visible; `FX-2061` computed font is `JetBrains Mono`. At 390 and 1440 widths run `document.documentElement.scrollWidth <= innerWidth` → `true`.
5. **AC5** — create `apps/web/src/features/probe/probe.tsx`:
   ```tsx
   export const A = () => <div className="bg-[#ff0000]" />;
   export const B = '#1e4fa3';
   export const C: any = 1;
   export { D } from '../../../../../reference/prototype/x';
   ```
   `pnpm lint` must report `fixit/no-raw-colors` (×2), `@typescript-eslint/no-explicit-any`, `fixit/no-reference-import`. Then `rm -rf apps/web/src/features/probe` and confirm `pnpm lint` is clean. Also add `export const n = new Date();` to `packages/contracts/src/index.ts` → `pnpm lint` fails with the contracts message; revert.
6. **AC6** — `pnpm --filter @fixit/web test` → features test green.
7. **AC7** — `pnpm --filter @fixit/contracts build && ls packages/contracts/dist` → `index.js index.cjs index.d.ts index.d.cts`; T15's no-dist web build already proved the `source` condition.
**Commit:** `git commit -m "chore: M01 acceptance checks (M01-T16)"` (plan checkbox ticks only).

## Checkpoints
- After T12: "Human: confirm `globals.css` token names/values against SPEC §2.1–§2.6 (spot-check `cta`, `text-subtle`, phone overrides)."
- After T15: "Human: run `pnpm dev:mock`, open http://localhost:5173 at 1440 and 390; Plus Jakarta Sans headline, blue and orange buttons, `FX-2061` in JetBrains Mono, no horizontal scroll."

## Blockers
(executor writes here; leave empty)

## Nice-to-haves (not tasks)
- `--color-*: initial;` in `@theme` to remove Tailwind's default palette (`bg-red-500`) so only tokens exist.
- RuleTester unit tests for `tools/eslint/fixit-plugin.js` (currently verified manually in T16).
- `.editorconfig`; CI workflow running `pnpm verify`.
