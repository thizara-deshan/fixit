# PLAN-M03 — App shell, layouts & shared states
Milestone: `docs/milestones/M03-app-shell.md` · Start tag: `m03-start` · Verify-all: `pnpm verify`
Mock domains at start → end: all (`pnpm dev:mock`; only `auth` has handlers) → all (unchanged; **no new endpoints, no new handlers**).

Conventions for the executor:
- Work on branch `m03-app-shell` (created in T1). One commit per task, with the message given, ending with the attribution lines from your session instructions.
- After writing files in any task, run `pnpm format` **before** `pnpm verify`. The code below may not be Prettier-exact.
- Code blocks are complete files unless the step says "add", "replace" or "edit". Tests import `describe/expect/it/vi` from `vitest` explicitly.
- File names are kebab-case, like the existing `auth-store.ts` and `placeholder-page.tsx`.
- All paths under `apps/web/` unless they start with `packages/` or `docs/`. `@/` = `apps/web/src/`.
- If a library API differs from what the code assumes (React Router 7, sonner 2, Radix via `radix-ui`, shadcn output), **STOP** and write a blocker. Don't switch majors or redesign.
- Tailwind: only `sm` (≥641) and `lg` (≥1024) prefixes. Arbitrary **size** values (`size-[34px]`, `h-[22px]`, `rounded-[9px]`, `grid-cols-[…]`) are allowed. Arbitrary **colour** values and the lint-banned prefixes `text-[`, `bg-[`, `border-[`, `shadow-[`, `ring-[`, `outline-[` are **not** allowed outside `components/ui/` (`tools/eslint/fixit-plugin.js`). Use the token text sizes (`text-mono` = 11px, `text-caption` = 12px, `text-meta` = 13px, `text-label` = 14px, `text-body-sm` = 15px, `text-body` = 16px, `text-title-xs` = 17px, `text-lead` = 18px).

Planner's decisions the executor must follow (they fill gaps between the milestone, SPEC and ARCHITECTURE; see "Notes for review" at the end):
- **D-a S40 for `/dashboard*` and `/admin*` renders inside L1**, not L3/L4. The L3/L4 chrome needs a provider or admin identity (business card, admin card, counts) that a wrong-role user doesn't have. S39 and S41 do render inside L3/L4 (AC5).
- **D-b The provider sidebar hides `Settings` while the `pause` flag (F-22) is off.** SPEC §4.1 gates S28 on F-22, the same way it gates Reviews on F-23/F-24. With all flags off, L3 shows 6 items: Dashboard · Requests · My Services · Profile · Service areas · Verification. The `/dashboard/settings` route is also registered only when the flag is on.
- **D-c Logout ordering.** `useLogout()` calls `POST /auth/logout`, signs out with reason `logout`, then navigates to `/` (admins: `/admin/login`) and clears the reason. While the reason is `logout`, guards render nothing, so protected pages don't flash a `/login?next=…` redirect. The DevPanel moves inside the router so it can use the same hook.
- **D-d No admin Verification count badge in M03.** `Me` has no admin counts and M03 adds no endpoint. The L4 badge and the top-bar count are wired in M13 from the admin overview query.
- **D-e The L3 business card uses a `BriefcaseBusiness` icon tile.** `Me.provider` has no photo or category. M10/M12 may swap in the photo when a provider query exists.
- **D-f The toast wrapper is hand-written in `components/ui/sonner.tsx`, not `shadcn add sonner`.** shadcn's generated file imports `next-themes`, and v1 has no themes. The file still lives in `components/ui/` as the Sonner primitive.
- **D-g Date formatting goes through a new pure `formatInColombo()` in contracts** (CLAUDE.md: "Dates: Asia/Colombo via `@fixit/contracts` date helpers"). The web doesn't take a direct `date-fns` dependency.
- **D-h Placeholder pages live in `src/app/chunks/<area>.tsx`**, one file per lazy chunk (`public`, `auth`, `customer`, `onboarding`, `provider`, `admin`, `dev`). Feature milestones replace each placeholder export with a re-export from `features/<feature>/pages/`, so the route table doesn't change.
- **D-i The contact email** for S41 comes from `VITE_CONTACT_EMAIL` (ARCH §10.3), defaulting to `hello@fixit.test` (M00 gap #3).

## File map
| File | Create/Modify | Responsibility |
|---|---|---|
| `packages/contracts/src/common/dates.ts` (+ `.test.ts`) | Modify | `formatInColombo(instant, pattern)` |
| `apps/web/package.json` | Modify | `react-router`, `sonner` |
| `src/components/ui/{dialog,dropdown-menu,popover,tooltip,switch,checkbox,radio-group,select,tabs,skeleton,input,textarea,label}.tsx` | Create (shadcn) | primitives, restyled with tokens |
| `src/components/ui/button.tsx`, `sheet.tsx` | Modify | SPEC §2.9 variants and sizes, token overlay |
| `src/components/ui/sonner.tsx` | Create | token-styled `Toaster` (D-f) |
| `src/styles/globals.css` | Modify | skeleton pulse animation token |
| `src/lib/format.ts` (+ test) | Create | LKR, prices, dates, phone, rating, initials |
| `src/lib/use-media-query.ts` (+ test) | Create | `useMediaQuery`, `MQ` |
| `src/test/media.ts` | Create | `matchMedia` stub + `setViewportWidth()` |
| `src/lib/use-delayed-flag.ts` (+ test) | Create | 150 ms skeleton delay |
| `src/lib/toast.ts` (+ test) | Create | `notify`, `notifyError`, durations |
| `src/lib/optimistic.ts` (+ test) | Create | `useOptimisticMutation` (ARCH §5.5) |
| `src/lib/env.ts`, `src/vite-env.d.ts`, `/.env.example` | Create/Modify | `CONTACT_EMAIL` |
| `src/lib/use-online-status.ts` | Create | online/offline store |
| `src/lib/auth-store.ts` (+ test) | Modify | `clearSignOutReason()` |
| `src/features/auth/hooks.ts` | Modify | `useLogout()` |
| `src/components/status-pill.tsx`, `verified-badge.tsx` | Create | SPEC §2.2 pills, Verified badge |
| `src/components/stars.tsx`, `price-label.tsx` | Create | rating display, price display |
| `src/components/empty-state.tsx`, `section-error.tsx` | Create | §6.2, §6.3 |
| `src/components/skeletons.tsx`, `loading-region.tsx` (+ test) | Create | §6.1 |
| `src/components/notice-banner.tsx` | Create | §2.9 notice banner, §6.8 variants |
| `src/components/responsive-dialog.tsx` (+ test) | Create | Dialog ≥641, bottom Sheet below |
| `src/components/data-list.tsx` (+ test) | Create | table ≥641, cards below |
| `src/components/pagination.tsx` (+ `pagination.test.ts`) | Create | S2.E12 pagination + `pageItems()` |
| `src/components/segmented-tabs.tsx` | Create | §2.9 segmented tabs (links / tabs) |
| `src/components/back-link.tsx`, `form-field.tsx`, `phone-input.tsx` | Create | shared form and navigation pieces |
| `src/app/layouts/nav-config.ts` (+ test) | Create | nav links, active rules, menu items, sidebar items, footer columns |
| `src/app/layouts/parts/*.tsx` | Create | Logo, SkipLink, OfflineBanner, BannerSlot, AccountMenu, NavSheet, PublicNav, Footer, SidebarNav, DashboardShell |
| `src/app/layouts/{root,public,auth,customer,provider,admin}-layout.tsx` | Create | L1, L1-auth, L2, L3, L4 + root |
| `src/app/errors/{not-found-page,forbidden-page,error-page,route-error-boundary}.tsx` | Create | S39, S40, S41 |
| `src/app/guards/guards.tsx` | Create | RequireGuest/Auth/Role/Provider/Admin, RedirectPublishedProvider |
| `src/app/placeholder-screen.tsx`, `src/app/chunks/*.tsx` | Create | placeholder pages per lazy chunk (D-h) |
| `src/app/routes.tsx`, `router.tsx` | Create | route table (ARCH §5.1) |
| `src/app/providers.tsx`, `src/main.tsx`, `src/mocks/dev/DevPanel.tsx` | Modify | Toaster + TooltipProvider, RouterProvider, DevPanel logout |
| `src/app/placeholder-page.tsx` | Delete | replaced by the shell |
| `src/test/render.tsx`, `src/test/setup.ts` | Modify | `renderRoute()`, matchMedia stub |
| `src/app/routes.test.tsx` | Create | AC4 redirect matrix, AC5, AC6, A4 |
| `src/app/chunks/dev.tsx` | Create | `/dev/ui` demo and `/dev/throw` (AC6, AC7) |

## Tasks

### T1 — Branch, start tag, router and toast dependencies
- [x] done

**Files:** `apps/web/package.json`, `pnpm-lock.yaml`
**Context:** ARCH §5.1 (React Router route `lazy`), §5.5 (Sonner). Neither package is installed yet.
**Do:**
1. `git switch main && git pull --ff-only` (skip the pull if there is no remote), then `git tag m03-start && git switch -c m03-app-shell`.
2. `pnpm --filter @fixit/web add react-router@^7 sonner@^2`
3. Check that `apps/web/package.json` `dependencies` now lists `react-router` (7.x) and `sonner` (2.x). Nothing else changed.

**Verify:** `pnpm verify` is green.
**Commit:** `git commit -am "chore(web): add react-router and sonner (M03-T1)"` (also `git add pnpm-lock.yaml` first).

---

### T2 — `formatInColombo()` in contracts
- [x] done

**Files:** `packages/contracts/src/common/dates.ts`, `packages/contracts/src/common/dates.test.ts`
**Context:** SPEC §1.3 date formats. D-g. `date-fns` and `@date-fns/tz` are already dependencies of contracts.
**Do:**
1. Add to `dates.ts`. Put the import at the top with the existing `TZDate` import, and the function at the end:
```ts
import { format } from 'date-fns';

/** Formats an instant as seen on a wall clock in Asia/Colombo (date-fns pattern, e.g. 'EEE, d MMM yyyy'). Pure: the instant is passed in. */
export function formatInColombo(instant: Date, pattern: string): string {
  return format(new TZDate(instant.getTime(), COLOMBO_TZ), pattern);
}
```
**Test:** add to `dates.test.ts`. Add `formatInColombo` to the existing import from `./dates`:
```ts
describe('formatInColombo', () => {
  it('uses Colombo wall-clock time (UTC+5:30)', () => {
    expect(formatInColombo(new Date('2026-11-21T10:12:00.000Z'), 'd MMM yyyy, h:mm a')).toBe('21 Nov 2026, 3:42 PM');
  });
  it('rolls over to the next Colombo day', () => {
    expect(formatInColombo(new Date('2026-11-21T20:00:00.000Z'), 'EEE, d MMM yyyy')).toBe('Sun, 22 Nov 2026');
  });
});
```
**Verify:** `pnpm --filter @fixit/contracts test` passes; `pnpm verify` is green.
**Commit:** `git commit -am "feat(contracts): formatInColombo date helper (M03-T2)"`

---

### T3 — Add shadcn primitives
- [x] done

**Files:** `src/components/ui/{dialog,dropdown-menu,popover,tooltip,switch,checkbox,radio-group,select,tabs,skeleton,input,textarea,label}.tsx`
**Context:** Milestone "Notes for the planner" (primitive list). M02 blocker T34: shadcn 4.23.0 writes `import { cn } from "cn"`, and the user approved rewriting it to `@/lib/utils`. Sonner is **not** added here (D-f). `button` and `sheet` already exist and must not be overwritten.
**Do:**
1. `cd apps/web && pnpm dlx shadcn@4.23.0 add dialog dropdown-menu popover tooltip switch checkbox radio-group select tabs skeleton input textarea label`. If it asks to overwrite `button.tsx` or `sheet.tsx`, answer **No**.
2. In every new file, replace `from "cn"` / `from 'cn'` with `from '@/lib/utils'`.
3. If `apps/web/package.json` gained a `cn` dependency, remove it. Keep `radix-ui`. Remove any other new dependency the CLI added **except** what the new files import. Run `pnpm install`.
4. `git diff --stat -- src/styles/globals.css src/components/ui/button.tsx src/components/ui/sheet.tsx` must be empty. If not, `git checkout -- <that file>`.
5. If `pnpm lint` fails inside a generated file, fix it with the smallest type-only edit (e.g. an explicit return type). Don't disable rules, and don't change behaviour.

**Verify:** `ls src/components/ui` lists the 13 new files + `button.tsx`, `sheet.tsx`, `.gitkeep`; `grep -rn "from ['\"]cn['\"]" src` prints nothing; `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "chore(web): add shadcn primitives (M03-T3)"`

---

### T4 — Button variants and sizes (SPEC §2.9)
- [x] done

**Files:** `src/components/ui/button.tsx`, `src/mocks/dev/DevPanel.tsx`
**Context:** SPEC §2.9 button rows, §6.10 danger button, §9 focus ring (the global `:focus-visible` outline in `globals.css`, so primitives must **not** set `outline-none` or `ring-*`). ARCH §5.3 variant names. Touch targets ≥ 44 on phone.
**Do:**
1. Replace `button.tsx` with:
```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none disabled:opacity-60 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        outline: 'border-[1.5px] border-primary bg-surface text-primary hover:bg-primary-soft',
        secondary: 'border border-border bg-surface text-text hover:bg-page',
        'danger-outline': 'border-[1.5px] border-border bg-surface text-text hover:border-danger hover:text-danger-text',
        cta: 'bg-cta text-on-cta hover:bg-cta-hover',
        danger: 'bg-danger-text text-primary-foreground hover:bg-danger',
        ghost: 'text-text-muted hover:bg-page hover:text-text',
        link: 'text-primary hover:text-primary-hover',
      },
      size: {
        lg: 'h-12 px-6 text-body-sm font-bold', // 48: page/primary actions
        md: 'h-11 px-4 text-label font-semibold sm:h-10', // 40 (44 on phone)
        sm: 'h-11 rounded-sm px-3 text-meta font-semibold sm:h-[34px]', // 34 (44 on phone)
        icon: 'size-11', // 44 icon button
        inline: 'h-auto p-0 text-label font-semibold', // text link
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

function Button({
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```
2. In `DevPanel.tsx`, change `variant={controls.latency === l ? 'default' : 'outline'}` to `variant={controls.latency === l ? 'primary' : 'outline'}`. Run `pnpm typecheck`. If any other `variant="default"`, `size="default"` or a removed size (`xs`, `icon-xs`, `icon-sm`, `icon-lg`, `lg` used as 40) remains, map it: `default` → `primary`/`md`, `icon-*` → `icon`.

**Verify:** `pnpm verify` is green.
**Commit:** `git commit -am "feat(web): button variants and sizes from SPEC (M03-T4)"`

---

### T5 — Restyle overlay primitives (dialog, sheet, dropdown-menu, popover, tooltip)
- [x] done

**Files:** `src/components/ui/{dialog,sheet,dropdown-menu,popover,tooltip}.tsx`
**Context:** SPEC §2.1 `overlay`, `tooltip-bg`; §2.5 `shadow-modal`, `shadow-tooltip`; §2.8 sheet slide 200 ms ease-out; §6.10; §9 focus ring.
**Do:** edit class strings only (no structural or behaviour changes):
1. **All five files:** delete every `dark:` class. Replace `bg-black/50` with `bg-overlay`. Replace `bg-background` with `bg-surface`. Delete `ring-offset-background`, every `focus:ring-*`, `focus-visible:ring-*`, `focus:ring-offset-*`, `focus:outline-hidden` and `focus:outline-none` on **close buttons** (`DialogPrimitive.Close`, `SheetPrimitive.Close`). Give those close buttons `grid size-11 place-items-center rounded-md text-text-muted hover:bg-page hover:text-text` in place of their positioning/opacity classes, and keep `absolute right-4 top-4`.
2. `dialog.tsx` → `DialogContent`: replace its size/shape classes (`max-w-[calc(100%-2rem)]`, `sm:max-w-lg`, `rounded-lg`, `border`, `p-6`, `shadow-lg`) with `w-[calc(100%-2rem)] max-w-auth rounded-2xl bg-surface p-8 shadow-modal`. Keep the position, animation and `outline-none` classes on the content container (it isn't a control).
3. `sheet.tsx` → `SheetContent`: `shadow-lg` → `shadow-modal`; `data-[state=closed]:duration-300 data-[state=open]:duration-500` → `duration-200 ease-out`. `SheetTitle`: `text-foreground font-semibold` → `text-title-md text-text`. `SheetDescription`: `text-muted-foreground text-sm` → `text-body-sm text-text-muted`.
4. `dropdown-menu.tsx` → `DropdownMenuContent`: shape → `min-w-[220px] rounded-lg border border-border bg-surface p-1.5 text-text shadow-tooltip`. `DropdownMenuItem`: size → `min-h-11 gap-3 rounded-md px-3 text-label font-semibold`. Keep its `focus:bg-accent focus:text-accent-foreground` highlight (= `primary-soft`/`primary`, the menu-item focus indicator) and its `outline-hidden`. `DropdownMenuSeparator`: `bg-border`. `DropdownMenuLabel`: `px-3 py-2`.
5. `popover.tsx` → `PopoverContent`: `rounded-lg border border-border bg-surface text-text shadow-tooltip`.
6. `tooltip.tsx` → `TooltipContent`: `max-w-[280px] rounded-md bg-tooltip-bg px-3.5 py-3 text-meta font-medium text-primary-foreground shadow-tooltip`. Arrow: `bg-tooltip-bg fill-tooltip-bg`. Remove `bg-foreground`/`text-background`/`bg-primary` if present.

**Verify:**
- `grep -nE "dark:|bg-black|ring-offset|focus(-visible)?:ring" src/components/ui/{dialog,sheet,dropdown-menu,popover,tooltip}.tsx` prints nothing.
- `pnpm verify` is green.

**Commit:** `git commit -am "style(web): overlay primitives use design tokens (M03-T5)"`

---

### T6 — Restyle form primitives and skeleton
- [x] done

**Files:** `src/components/ui/{input,textarea,label,skeleton,checkbox,radio-group,switch,select,tabs}.tsx`, `src/styles/globals.css`
**Context:** SPEC §2.9 Input/select (48 high, 1.5px `border`, `radius-md`, focus border `primary`), Checkbox (20×20 `radius-xs`, 1.5px `border-control`, on = `primary`), Toggle (44×26, off `border-strong`, on `success`, knob 20 `shadow-knob`), §6.1 skeleton (`placeholder-a`, 1.2 s opacity pulse 0.6 ↔ 1), §2.3 (input text never below 16px on phone), §9 focus ring.
**Do:**
1. Replace `input.tsx`:
```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-12 w-full min-w-0 rounded-md border-[1.5px] border-border bg-surface px-3 text-body font-medium text-text transition-colors placeholder:text-text-subtle focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
```
2. Replace `textarea.tsx` the same way, with `<textarea data-slot="textarea">` and classes `min-h-28 w-full rounded-md border-[1.5px] border-border bg-surface px-3 py-3 text-body text-text placeholder:text-text-subtle focus-visible:border-primary disabled:opacity-60 aria-invalid:border-danger`.
3. `label.tsx`: set the label classes to `text-label font-semibold text-text` and keep the `peer-disabled`/`group-data-[disabled=true]` classes.
4. In `globals.css`, inside the `@theme { … }` block, after `--default-transition-duration`, add:
```css
  /* SPEC §6.1 skeleton pulse */
  --animate-skeleton: skeleton-pulse 1.2s ease-in-out infinite;
  @keyframes skeleton-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
```
5. Replace `skeleton.tsx`:
```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

/** SPEC §6.1: placeholder-a block, 1.2 s opacity pulse (static under reduced motion via the global rule). Decorative. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-skeleton rounded-md bg-placeholder-a', className)}
      {...props}
    />
  );
}

export { Skeleton };
```
6. `checkbox.tsx` root: `size-5 shrink-0 rounded-xs border-[1.5px] border-border-control bg-surface data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground aria-invalid:border-danger disabled:opacity-60`. Remove `outline-none`, `shadow-xs` and every `focus-visible:ring*`.
7. `radio-group.tsx` item: `size-5 shrink-0 rounded-full border-[1.5px] border-border-control bg-surface data-[state=checked]:border-primary disabled:opacity-60`; indicator dot `fill-primary`/`bg-primary`. Remove `outline-none` and `focus-visible:ring*`.
8. `switch.tsx` root: `inline-flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] transition-colors data-[state=checked]:bg-success data-[state=unchecked]:bg-border-strong disabled:opacity-60`. Thumb: `block size-5 rounded-full bg-surface shadow-knob transition-transform data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0`. Remove `outline-none`, `focus-visible:ring*` and `dark:`.
9. `select.tsx` → `SelectTrigger`: `h-12 w-full rounded-md border-[1.5px] border-border bg-surface px-3 text-body font-medium text-text data-[placeholder]:text-text-subtle aria-invalid:border-danger`. Remove `outline-none` and `focus-visible:ring*` from the **trigger only**. `SelectContent`: `rounded-lg border border-border bg-surface shadow-tooltip`. Items keep their `focus:bg-accent` highlight.
10. `tabs.tsx` → `TabsTrigger`: remove `outline-none`/`focus-visible:ring*`/`focus-visible:outline-*`; `data-[state=active]:bg-surface data-[state=active]:shadow-xs`. `TabsList`: `rounded-md bg-page p-1`.
11. In all files of this task: delete every `dark:` class.

**Verify:**
- `grep -nE "dark:|focus-visible:ring" src/components/ui/{input,textarea,label,skeleton,checkbox,radio-group,switch,select,tabs}.tsx` prints nothing.
- `grep -n "outline-none" src/components/ui/{input,textarea,checkbox,radio-group,switch,tabs}.tsx` prints nothing.
- `pnpm verify` is green.

**Commit:** `git commit -am "style(web): form primitives and skeleton use design tokens (M03-T6)"`

---

### T7 — Toaster, `lib/toast.ts` and providers
- [x] done

**Files:** `src/components/ui/sonner.tsx` (create), `src/lib/toast.ts`, `src/lib/toast.test.ts`, `src/app/providers.tsx`
**Context:** SPEC §2.9 Toast, §6.5 (4 s, 8 s with action, pause on hover/focus, one at a time, phone bottom 16 and width calc(100% − 32), 44-high action), §6.3 error toast (leading `CircleAlert`, `Try again`), §9 (white focus outline on dark surfaces). ARCH §5.5 (`visibleToasts={1}`, `bottom-center`). D-f.
**Do:**
1. Create `src/components/ui/sonner.tsx`:
```tsx
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** SPEC §6.5 toast: tooltip-bg, r14, 14/600 white, action 14/700 toast-action. Sonner pauses the timer on hover and focus. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      visibleToasts={1}
      offset={28}
      mobileOffset={16}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3 rounded-lg bg-tooltip-bg py-3 pl-[18px] pr-4 text-label font-semibold text-primary-foreground shadow-toast sm:w-max sm:max-w-[480px]',
          title: 'min-w-0 flex-1',
          icon: 'shrink-0 text-primary-foreground',
          actionButton:
            'ml-auto inline-flex min-h-11 shrink-0 items-center px-1 text-label font-bold text-toast-action focus-visible:outline-primary-foreground sm:min-h-0',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
```
2. Create `src/lib/toast.ts`:
```ts
import { createElement } from 'react';
import { CircleAlert } from 'lucide-react';
import { toast } from 'sonner';

export const TOAST_MS = 4000; // SPEC §6.5
export const TOAST_WITH_ACTION_MS = 8000;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export const toastDuration = (action?: ToastAction): number => (action ? TOAST_WITH_ACTION_MS : TOAST_MS);

/** One toast at a time: a new one replaces the old (SPEC §6.5). */
export function notify(message: string, action?: ToastAction): void {
  toast.dismiss();
  toast(message, action ? { duration: toastDuration(action), action } : { duration: toastDuration() });
}

/** SPEC §6.3 "Action failed": leading CircleAlert and an optional `Try again` action. */
export function notifyError(message: string, retry?: () => void): void {
  const icon = createElement(CircleAlert, { className: 'size-4', 'aria-hidden': true });
  const action = retry ? { label: 'Try again', onClick: retry } : undefined;
  toast.dismiss();
  toast(message, action ? { icon, duration: toastDuration(action), action } : { icon, duration: toastDuration() });
}
```
3. Replace `src/app/providers.tsx`:
```tsx
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from './query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
```
**Test:** `src/lib/toast.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toastFn = vi.hoisted(() => Object.assign(vi.fn(), { dismiss: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastFn }));

import { notify, notifyError, toastDuration } from './toast';

describe('toast helpers (SPEC §6.5)', () => {
  beforeEach(() => {
    toastFn.mockClear();
    toastFn.dismiss.mockClear();
  });
  it('lasts 4 s, or 8 s with an action', () => {
    expect(toastDuration()).toBe(4000);
    expect(toastDuration({ label: 'Undo', onClick: () => undefined })).toBe(8000);
  });
  it('notify replaces the current toast and passes the duration', () => {
    notify('Saved Bell & Sons Plumbing.');
    expect(toastFn.dismiss).toHaveBeenCalledOnce();
    expect(toastFn).toHaveBeenCalledWith('Saved Bell & Sons Plumbing.', { duration: 4000 });
    const action = { label: 'Undo', onClick: vi.fn() };
    notify('Removed Bell & Sons Plumbing from saved.', action);
    expect(toastFn).toHaveBeenLastCalledWith('Removed Bell & Sons Plumbing from saved.', { duration: 8000, action });
  });
  it('notifyError adds Try again when a retry is given', () => {
    const retry = vi.fn();
    notifyError("Couldn't save. Try again.", retry);
    const opts = toastFn.mock.lastCall?.[1] as { duration: number; action: { label: string; onClick: () => void } };
    expect(opts.duration).toBe(8000);
    expect(opts.action.label).toBe('Try again');
    opts.action.onClick();
    expect(retry).toHaveBeenCalledOnce();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- toast` passes; `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): toaster and toast helpers (M03-T7)"`

---

### T8 — `lib/format.ts`
- [x] done

**Files:** `src/lib/format.ts`, `src/lib/format.test.ts`
**Context:** SPEC §1.3 (money, service price BR-09, short price, dates, phone, rating "New"), §9 Stars text alternative. D-g.
**Do:** create `src/lib/format.ts`:
```ts
import { colomboStartOfDay, formatInColombo, type PriceUnit } from '@fixit/contracts';

const grouping = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** `LKR 2,500` (whole rupees). */
export const formatLkr = (amount: number): string => `LKR ${grouping.format(amount)}`;

const UNIT_SUFFIX: Record<PriceUnit, string> = { per_hour: ' / hour', per_visit: ' / visit', fixed: ' fixed' };

/** BR-09: `from LKR 2,500 / hour`, `from LKR 1,500 / visit`, `LKR 4,500 fixed`. */
export function formatServicePrice(amount: number, unit: PriceUnit): string {
  return unit === 'fixed' ? `${formatLkr(amount)} fixed` : `from ${formatLkr(amount)}${UNIT_SUFFIX[unit]}`;
}

/** Short price for cards: big `LKR 2,500` + small suffix ` / hour` | ` / visit` | ` fixed`. */
export function priceParts(amount: number, unit: PriceUnit): { amount: string; suffix: string } {
  return { amount: formatLkr(amount), suffix: UNIT_SUFFIX[unit] };
}

/** 'YYYY-MM-DD' is a Colombo calendar day; anything else is an instant (ISO date-time or Date). */
function toInstant(value: string | Date): Date {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return colomboStartOfDay(value);
  return typeof value === 'string' ? new Date(value) : value;
}

/** `Sat, 21 Nov 2026` */
export const formatDateLong = (value: string | Date): string => formatInColombo(toInstant(value), 'EEE, d MMM yyyy');
/** `Sat, 21 Nov` (tables) */
export const formatDateShort = (value: string | Date): string => formatInColombo(toInstant(value), 'EEE, d MMM');
/** `21 Nov 2026, 3:42 PM` (history) */
export const formatDateTime = (value: string | Date): string => formatInColombo(toInstant(value), 'd MMM yyyy, h:mm a');

/** E.164 `+94771234567` → `+94 77 123 4567`. Anything else is returned unchanged. */
export function formatPhone(e164: string): string {
  if (!/^\+947\d{8}$/.test(e164)) return e164;
  return `+94 ${e164.slice(3, 5)} ${e164.slice(5, 8)} ${e164.slice(8)}`;
}

/** 1 decimal; no reviews → `New`. */
export function formatRating(rating: number | null, count: number): string {
  return rating === null || count === 0 ? 'New' : rating.toFixed(1);
}

/** SPEC §9 Stars text alternative. */
export function ratingAriaLabel(rating: number | null, count: number): string {
  if (rating === null || count === 0) return 'New, no reviews yet';
  return `Rated ${rating.toFixed(1)} out of 5, ${String(count)} ${count === 1 ? 'review' : 'reviews'}`;
}

/** Avatar initials: first letter of the first and last word. `Olivia Martinez` → `OM`. */
export function initialsOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
```
**Test:** `src/lib/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  formatDateLong,
  formatDateShort,
  formatDateTime,
  formatLkr,
  formatPhone,
  formatRating,
  formatServicePrice,
  initialsOf,
  priceParts,
  ratingAriaLabel,
} from './format';

describe('format (SPEC §1.3)', () => {
  it('money', () => {
    expect(formatLkr(2500)).toBe('LKR 2,500');
    expect(formatLkr(1000000)).toBe('LKR 1,000,000');
    expect(formatLkr(0)).toBe('LKR 0');
  });
  it('service price (BR-09) and short price', () => {
    expect(formatServicePrice(2500, 'per_hour')).toBe('from LKR 2,500 / hour');
    expect(formatServicePrice(1500, 'per_visit')).toBe('from LKR 1,500 / visit');
    expect(formatServicePrice(4500, 'fixed')).toBe('LKR 4,500 fixed');
    expect(priceParts(2500, 'per_hour')).toEqual({ amount: 'LKR 2,500', suffix: ' / hour' });
    expect(priceParts(4500, 'fixed')).toEqual({ amount: 'LKR 4,500', suffix: ' fixed' });
  });
  it('dates in Asia/Colombo', () => {
    expect(formatDateLong('2026-11-21')).toBe('Sat, 21 Nov 2026');
    expect(formatDateShort('2026-11-21')).toBe('Sat, 21 Nov');
    expect(formatDateTime('2026-11-21T10:12:00.000Z')).toBe('21 Nov 2026, 3:42 PM');
    expect(formatDateLong('2026-11-21T20:00:00.000Z')).toBe('Sun, 22 Nov 2026');
    expect(formatDateLong(new Date('2026-11-21T20:00:00.000Z'))).toBe('Sun, 22 Nov 2026');
  });
  it('phone', () => {
    expect(formatPhone('+94771234567')).toBe('+94 77 123 4567');
    expect(formatPhone('0771234567')).toBe('0771234567');
  });
  it('rating', () => {
    expect(formatRating(4.9, 212)).toBe('4.9');
    expect(formatRating(5, 3)).toBe('5.0');
    expect(formatRating(null, 0)).toBe('New');
    expect(ratingAriaLabel(4.9, 212)).toBe('Rated 4.9 out of 5, 212 reviews');
    expect(ratingAriaLabel(4, 1)).toBe('Rated 4.0 out of 5, 1 review');
    expect(ratingAriaLabel(null, 0)).toBe('New, no reviews yet');
  });
  it('initials', () => {
    expect(initialsOf('Olivia Martinez')).toBe('OM');
    expect(initialsOf('  Marcus  van Bell ')).toBe('MB');
    expect(initialsOf('Admin')).toBe('A');
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- format` passes; `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): format helpers for money, dates, phone and rating (M03-T8)"`

---

### T9 — `useMediaQuery` and the test `matchMedia` stub
- [x] done

**Files:** `src/lib/use-media-query.ts`, `src/lib/use-media-query.test.tsx`, `src/test/media.ts`, `src/test/setup.ts`
**Context:** ARCH §5.2 (`sm` = 641px, `lg` = 1024px; the switchers render only one variant in the DOM). jsdom has no `matchMedia`.
**Do:**
1. Create `src/lib/use-media-query.ts`:
```ts
import { useCallback, useSyncExternalStore } from 'react';

/** The only two breakpoints (SPEC §2.7, ARCH §5.2). */
export const MQ = { sm: '(min-width: 641px)', lg: '(min-width: 1024px)' } as const;

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => {
        list.removeEventListener('change', onChange);
      };
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
```
2. Create `src/test/media.ts`:
```ts
import { act } from '@testing-library/react';

type Listener = (event: MediaQueryListEvent) => void;
interface Entry {
  query: string;
  last: boolean;
  listeners: Set<Listener>;
}

let width = 1440;
const entries = new Set<Entry>();

/** Supports `(min-width: Npx)` and `(max-width: Npx)`, joined with `and`. */
function evaluate(query: string, w: number): boolean {
  const re = /\((min|max)-width:\s*(\d+(?:\.\d+)?)px\)/g;
  let found = false;
  let ok = true;
  for (let m = re.exec(query); m !== null; m = re.exec(query)) {
    found = true;
    const v = Number(m[2]);
    ok = ok && (m[1] === 'min' ? w >= v : w <= v);
  }
  return found && ok;
}

/** Called from setup.ts before each test: viewport 1440 and no listeners. */
export function installMatchMedia(): void {
  width = 1440;
  entries.clear();
  window.matchMedia = (query: string): MediaQueryList => {
    const entry: Entry = { query, last: evaluate(query, width), listeners: new Set() };
    entries.add(entry);
    const list = {
      media: query,
      onchange: null,
      get matches() {
        return evaluate(query, width);
      },
      addEventListener: (_type: string, l: Listener) => entry.listeners.add(l),
      removeEventListener: (_type: string, l: Listener) => entry.listeners.delete(l),
      addListener: (l: Listener) => entry.listeners.add(l),
      removeListener: (l: Listener) => entry.listeners.delete(l),
      dispatchEvent: () => true,
    };
    return list as unknown as MediaQueryList;
  };
}

/** Changes the simulated viewport and fires `change` on every query whose result flipped. */
export function setViewportWidth(next: number): void {
  act(() => {
    width = next;
    for (const e of entries) {
      const now = evaluate(e.query, width);
      if (now === e.last) continue;
      e.last = now;
      for (const l of e.listeners) l({ matches: now, media: e.query } as MediaQueryListEvent);
    }
  });
}
```
3. In `src/test/setup.ts`, import `installMatchMedia` from `./media` and call it as the **first** line of the existing `beforeEach`.

**Test:** `src/lib/use-media-query.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { setViewportWidth } from '@/test/media';
import { MQ, useMediaQuery } from './use-media-query';

describe('useMediaQuery', () => {
  it('matches the 641 and 1024 breakpoints and updates on change', () => {
    const sm = renderHook(() => useMediaQuery(MQ.sm));
    const lg = renderHook(() => useMediaQuery(MQ.lg));
    expect([sm.result.current, lg.result.current]).toEqual([true, true]); // 1440 default
    setViewportWidth(800);
    expect([sm.result.current, lg.result.current]).toEqual([true, false]);
    setViewportWidth(640);
    expect(sm.result.current).toBe(false);
    setViewportWidth(641);
    expect(sm.result.current).toBe(true);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test` passes (all suites); `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): useMediaQuery with a test matchMedia stub (M03-T9)"`

---

### T10 — `useDelayedFlag` (150 ms skeleton delay)
- [x] done

**Files:** `src/lib/use-delayed-flag.ts`, `src/lib/use-delayed-flag.test.ts`
**Context:** SPEC §6.1 ("only if loading takes longer than 150 ms"). ARCH §5.6.
**Do:** create `src/lib/use-delayed-flag.ts`:
```ts
import { useEffect, useState } from 'react';

/** True only once `flag` has stayed true for `delayMs` (no skeleton flash on fast loads). */
export function useDelayedFlag(flag: boolean, delayMs = 150): boolean {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    if (!flag) {
      setElapsed(false);
      return;
    }
    const t = setTimeout(() => {
      setElapsed(true);
    }, delayMs);
    return () => {
      clearTimeout(t);
    };
  }, [flag, delayMs]);
  return flag && elapsed;
}
```
**Test:** `src/lib/use-delayed-flag.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDelayedFlag } from './use-delayed-flag';

describe('useDelayedFlag', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('turns on after 150 ms and off immediately', () => {
    const { result, rerender } = renderHook(({ f }) => useDelayedFlag(f), { initialProps: { f: true } });
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(149));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);
    rerender({ f: false });
    expect(result.current).toBe(false);
  });
  it('never turns on when the flag clears before the delay', () => {
    const { result, rerender } = renderHook(({ f }) => useDelayedFlag(f), { initialProps: { f: true } });
    act(() => vi.advanceTimersByTime(100));
    rerender({ f: false });
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe(false);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- use-delayed-flag` passes; `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): useDelayedFlag for skeleton delay (M03-T10)"`

---

### T11 — Optimistic mutation helper
- [x] done

**Files:** `src/lib/optimistic.ts`, `src/lib/optimistic.test.tsx`
**Context:** ARCH §5.5 (code adapted to `lib/toast.ts`). SPEC §6.3 action-failed toast, §6.5 (Undo only where the caller passes `undo`).
**Do:** create `src/lib/optimistic.ts`:
```ts
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { notify, notifyError } from './toast';

export interface OptimisticOptions<TVars, TData, TCache> {
  queryKey: QueryKey;
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Returns the cache as it should look right away. */
  apply: (cache: TCache | undefined, vars: TVars) => TCache | undefined;
  /** SPEC §6.3 copy, e.g. "Couldn't save. Try again." */
  errorToast: string;
  successToast?: (vars: TVars) => { message: string; undo?: () => void } | undefined;
  invalidate?: QueryKey[];
}

/** ARCH §5.5: apply → server → revert + error toast (Try again) on failure → invalidate. */
export function useOptimisticMutation<TVars, TData, TCache>(o: OptimisticOptions<TVars, TData, TCache>) {
  const qc = useQueryClient();
  const m = useMutation<TData, Error, TVars, { prev: TCache | undefined }>({
    mutationFn: o.mutationFn,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: o.queryKey });
      const prev = qc.getQueryData<TCache>(o.queryKey);
      qc.setQueryData<TCache>(o.queryKey, (c) => o.apply(c, vars));
      return { prev };
    },
    onError: (_e, vars, ctx) => {
      qc.setQueryData(o.queryKey, ctx?.prev);
      notifyError(o.errorToast, () => {
        m.mutate(vars);
      });
    },
    onSuccess: (_d, vars) => {
      const t = o.successToast?.(vars);
      if (t) notify(t.message, t.undo ? { label: 'Undo', onClick: t.undo } : undefined);
    },
    onSettled: async () => {
      await Promise.all([o.queryKey, ...(o.invalidate ?? [])].map((k) => qc.invalidateQueries({ queryKey: k })));
    },
  });
  return m;
}
```
**Test:** `src/lib/optimistic.test.tsx`:
```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient, createWrapper } from '@/test/render';

const toasts = vi.hoisted(() => ({ notify: vi.fn(), notifyError: vi.fn() }));
vi.mock('./toast', () => toasts);

import { useOptimisticMutation } from './optimistic';

function deferred() {
  let resolve!: () => void; // assigned synchronously by the Promise executor below
  let reject!: (e: Error) => void; // same
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useOptimisticMutation', () => {
  beforeEach(() => {
    toasts.notify.mockClear();
    toasts.notifyError.mockClear();
  });

  it('applies at once, reverts on failure and offers Try again', async () => {
    const client = createTestQueryClient();
    client.setQueryData(['saved'], ['p01']);
    let call = deferred();
    const mutationFn = vi.fn(() => call.promise);
    const { result } = renderHook(
      () =>
        useOptimisticMutation<string, void, string[]>({
          queryKey: ['saved'],
          mutationFn,
          apply: (c, id) => [...(c ?? []), id],
          errorToast: "Couldn't save. Try again.",
        }),
      { wrapper: createWrapper(client) },
    );
    act(() => {
      result.current.mutate('p02');
    });
    await waitFor(() => {
      expect(client.getQueryData(['saved'])).toEqual(['p01', 'p02']);
    });
    call.reject(new Error('boom'));
    await waitFor(() => {
      expect(toasts.notifyError).toHaveBeenCalledOnce();
    });
    expect(client.getQueryData(['saved'])).toEqual(['p01']);
    const [message, retry] = toasts.notifyError.mock.lastCall as [string, () => void];
    expect(message).toBe("Couldn't save. Try again.");
    call = deferred();
    act(() => {
      retry();
    });
    await waitFor(() => {
      expect(mutationFn).toHaveBeenCalledTimes(2);
    });
  });

  it('shows the success toast with Undo only when the caller provides one', async () => {
    const client = createTestQueryClient();
    client.setQueryData(['saved'], ['p01']);
    const undo = vi.fn();
    const { result } = renderHook(
      () =>
        useOptimisticMutation<string, void, string[]>({
          queryKey: ['saved'],
          mutationFn: () => Promise.resolve(),
          apply: (c, id) => (c ?? []).filter((x) => x !== id),
          errorToast: "Couldn't remove. Try again.",
          successToast: () => ({ message: 'Removed Bell & Sons Plumbing from saved.', undo }),
        }),
      { wrapper: createWrapper(client) },
    );
    act(() => {
      result.current.mutate('p01');
    });
    await waitFor(() => {
      expect(toasts.notify).toHaveBeenCalledOnce();
    });
    const [message, action] = toasts.notify.mock.lastCall as [string, { label: string; onClick: () => void }];
    expect(message).toBe('Removed Bell & Sons Plumbing from saved.');
    expect(action.label).toBe('Undo');
    action.onClick();
    expect(undo).toHaveBeenCalledOnce();
    expect(client.getQueryData(['saved'])).toEqual([]);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- optimistic` passes; `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): optimistic mutation helper with toast (M03-T11)"`

---

### T12 — Contact email env, online status, `clearSignOutReason`, `useLogout`
- [x] done

**Files:** `src/lib/env.ts`, `src/vite-env.d.ts`, `/.env.example`, `src/lib/use-online-status.ts`, `src/lib/auth-store.ts`, `src/lib/auth-store.test.ts`, `src/features/auth/hooks.ts`
**Context:** D-c, D-i. SPEC §8.1 A4 (Log out → `/`, admins → `/admin/login`), §6.3 offline banner. ARCH §5.6 (`useOnlineStatus`), §10.3 (`VITE_CONTACT_EMAIL`). The milestone note asks for `queryClient.clear()` on logout.
**Do:**
1. `src/vite-env.d.ts`: add `readonly VITE_CONTACT_EMAIL?: string;` inside `ImportMetaEnv`.
2. Create `src/lib/env.ts`:
```ts
/** SPEC §10.2 #2: public contact email (placeholder until M22). */
export const CONTACT_EMAIL: string = import.meta.env.VITE_CONTACT_EMAIL ?? 'hello@fixit.test';
```
3. Create `/.env.example` at the repo root (it doesn't exist yet) with:
```
# Copy the web variables to apps/web/.env.local. Full list: docs/ARCHITECTURE.md §10.3
VITE_MOCK_DOMAINS=none
VITE_CONTACT_EMAIL=hello@fixit.test
```
4. Create `src/lib/use-online-status.ts`:
```ts
import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
```
5. `src/lib/auth-store.ts`: add this method to `authStore` after `signOut`:
```ts
  /** D-c: after logout navigation, forget the `logout` reason so guards redirect normally again. Other reasons stay for S5's banner. */
  clearSignOutReason: (): void => {
    if (state.status === 'guest' && state.signOutReason === 'logout') set({ ...state, signOutReason: null });
  },
```
6. `src/features/auth/hooks.ts`: add these imports, then append the hook:
```ts
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { logout } from './api';
```
(merge `logout` into the existing `./api` import, and `useQueryClient` into the existing `@tanstack/react-query` import)
```ts
/** A4: POST /auth/logout → clear cache → `/` (admins → `/admin/login`). D-c: guards render nothing while reason = 'logout'. */
export function useLogout(): () => Promise<void> {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return useCallback(async () => {
    const wasAdmin = authStore.getState().me?.roles.includes('admin') ?? false;
    await logout();
    qc.clear();
    await navigate(wasAdmin ? '/admin/login' : '/', { replace: true });
    authStore.clearSignOutReason();
  }, [navigate, qc]);
}
```

**Test:** add to `src/lib/auth-store.test.ts` inside `describe('authStore', …)`:
```ts
  it('clearSignOutReason clears only the logout reason', () => {
    authStore.setSession(session());
    authStore.signOut('logout');
    authStore.clearSignOutReason();
    expect(authStore.getState().signOutReason).toBeNull();
    authStore.signOut('expired');
    authStore.clearSignOutReason();
    expect(authStore.getState().signOutReason).toBe('expired');
  });
```
**Verify:** `pnpm --filter @fixit/web test -- auth-store` passes; `pnpm verify` is green.
**Commit:** `git add -A . && git commit -m "feat(web): contact email env, online status and useLogout (M03-T12)"`

---

### T13 — `StatusPill` and `VerifiedBadge`
- [x] done

**Files:** `src/components/verified-badge.tsx`, `src/components/status-pill.tsx`
**Context:** SPEC §2.2 (every request/verification/account/review/availability/trust variant; normal 28 high 13/700 padding 0 12, compact 24 high 12/700 padding 0 10; leading 6×6 dot `aria-hidden`), §2.9 Verified badge, §9 (status never by colour alone).
**Do:**
1. Create `src/components/verified-badge.tsx`:
```tsx
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VerifiedBadge({ size = 'md', className }: { size?: 'md' | 'sm'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-soft pr-2.5 font-bold text-success-text',
        size === 'md' ? 'h-7 pl-1 text-meta' : 'h-6 pl-1 text-caption',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid place-items-center rounded-full bg-success text-primary-foreground',
          size === 'md' ? 'size-[18px]' : 'size-4',
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      Verified
    </span>
  );
}
```
2. Create `src/components/status-pill.tsx`:
```tsx
import type { AccountStatus, RequestStatus, ReviewVisibility, VerificationStatus } from '@fixit/contracts';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from './verified-badge';

type Tone = 'pending' | 'accepted' | 'completed' | 'declined' | 'cancelled' | 'expired' | 'muted';

const TONE: Record<Tone, { pill: string; dot: string }> = {
  pending: { pill: 'bg-warning-soft text-warning-text', dot: 'bg-warning' },
  accepted: { pill: 'bg-primary-soft text-primary', dot: 'bg-primary' },
  completed: { pill: 'bg-success-soft text-success-text', dot: 'bg-success' },
  declined: { pill: 'bg-danger-soft text-danger-text', dot: 'bg-danger' },
  cancelled: { pill: 'bg-surface-muted text-text-muted', dot: 'bg-icon-subtle' },
  expired: { pill: 'border border-dashed border-border-strong bg-page text-text-muted', dot: 'bg-border-control' },
  muted: { pill: 'bg-surface-muted text-text-muted', dot: '' },
};

export type StatusPillProps = { compact?: boolean; className?: string } & (
  | { kind: 'request'; status: RequestStatus }
  | { kind: 'verification'; status: VerificationStatus }
  | { kind: 'account'; status: AccountStatus }
  | { kind: 'review'; visibility: ReviewVisibility }
  | { kind: 'availability' } // BR-15 "Not taking requests"
  | { kind: 'trust'; verified: boolean } // listing trust
);

type Resolved = { tone: Tone; label: string; dot: boolean; semibold?: boolean } | 'verified' | null;

const REQUEST: Record<RequestStatus, [Tone, string]> = {
  pending: ['pending', 'Pending'],
  accepted: ['accepted', 'Accepted'],
  completed: ['completed', 'Completed'],
  declined: ['declined', 'Declined'],
  cancelled: ['cancelled', 'Cancelled'],
  expired: ['expired', 'Expired'],
};

function resolve(p: StatusPillProps): Resolved {
  switch (p.kind) {
    case 'request': {
      const [tone, label] = REQUEST[p.status];
      return { tone, label, dot: true };
    }
    case 'verification':
      if (p.status === 'verified') return 'verified';
      if (p.status === 'pending_review') return { tone: 'pending', label: 'Pending review', dot: true };
      if (p.status === 'rejected') return { tone: 'declined', label: 'Rejected', dot: true };
      return { tone: 'cancelled', label: 'Not submitted', dot: true };
    case 'account':
      return p.status === 'active'
        ? { tone: 'completed', label: 'Active', dot: true }
        : { tone: 'declined', label: 'Suspended', dot: true };
    case 'review':
      return p.visibility === 'hidden' ? { tone: 'cancelled', label: 'Hidden', dot: true } : null;
    case 'availability':
      return { tone: 'pending', label: 'Not taking requests', dot: false };
    case 'trust':
      return p.verified ? 'verified' : { tone: 'muted', label: 'Not yet verified', dot: false, semibold: true };
  }
}

/** SPEC §2.2. Renders nothing for a visible review; the Verified badge for verified states. */
export function StatusPill(props: StatusPillProps) {
  const r = resolve(props);
  if (r === null) return null;
  if (r === 'verified') return <VerifiedBadge size={props.compact ? 'sm' : 'md'} className={props.className} />;
  const tone = TONE[r.tone];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full',
        props.compact ? 'h-6 px-2.5 text-caption' : 'h-7 px-3 text-meta',
        r.semibold ? 'font-semibold' : 'font-bold',
        tone.pill,
        props.className,
      )}
    >
      {r.dot && <span aria-hidden="true" className={cn('size-1.5 rounded-full', tone.dot)} />}
      {r.label}
    </span>
  );
}
```
**Verify:** `pnpm verify` is green. (No test: markup only.)
**Commit:** `git add -A apps/web && git commit -m "feat(web): StatusPill and VerifiedBadge (M03-T13)"`

---

### T14 — `Stars` and `PriceLabel`
- [x] done

**Files:** `src/components/stars.tsx`, `src/components/price-label.tsx`
**Context:** SPEC §1.3 (rating 1 decimal, "New"; short price), §2.1 `star`/`star-empty`, §9 Stars (`aria-label`, glyphs `aria-hidden`). Prototype `01-home-desktop.png` featured cards: `★★★★★ 4.9 (212)`, i.e. 5 filled stars for 4.7–4.9 (rounded).
**Do:**
1. Create `src/components/stars.tsx`:
```tsx
import { Star } from 'lucide-react';
import { formatRating, ratingAriaLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

interface StarsProps {
  rating: number | null;
  count: number;
  /** Icon size in px (prototype 13–16). */
  size?: number;
  /** Show `4.9 (212)` / `New` after the stars. */
  showValue?: boolean;
  className?: string;
}

export function Stars({ rating, count, size = 14, showValue = true, className }: StarsProps) {
  const filled = rating === null || count === 0 ? 0 : Math.round(rating);
  return (
    <span role="img" aria-label={ratingAriaLabel(rating, count)} className={cn('inline-flex items-center gap-1.5', className)}>
      <span aria-hidden="true" className="inline-flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={cn('fill-current', i < filled ? 'text-star' : 'text-star-empty')}
            strokeWidth={0}
          />
        ))}
      </span>
      {showValue && (
        <span aria-hidden="true" className="inline-flex items-baseline gap-1">
          <span className="text-label font-bold text-text">{formatRating(rating, count)}</span>
          {count > 0 && <span className="text-meta text-text-subtle">({count})</span>}
        </span>
      )}
    </span>
  );
}
```
2. Create `src/components/price-label.tsx`:
```tsx
import type { PriceUnit } from '@fixit/contracts';
import { formatServicePrice, priceParts } from '@/lib/format';
import { cn } from '@/lib/utils';

interface PriceLabelProps {
  amount: number;
  unit: PriceUnit;
  /** full = `from LKR 2,500 / hour` (BR-09); short = big `LKR 2,500` + small ` / hour`. */
  variant?: 'full' | 'short';
  /** Size class for the short variant's number, e.g. `text-price-lg` (cards) or `text-price-xl` (profile). */
  amountClassName?: string;
  className?: string;
}

export function PriceLabel({ amount, unit, variant = 'full', amountClassName = 'text-price-lg', className }: PriceLabelProps) {
  if (variant === 'full') {
    return <span className={cn('text-body-sm text-text', className)}>{formatServicePrice(amount, unit)}</span>;
  }
  const p = priceParts(amount, unit);
  return (
    <span className={cn('inline-flex items-baseline whitespace-nowrap', className)}>
      <span className={cn('text-text', amountClassName)}>{p.amount}</span>
      <span className="text-meta font-medium text-text-subtle">{p.suffix}</span>
    </span>
  );
}
```
(`style={{ width, height }}` is a size, not a colour, so it's allowed.)
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): Stars and PriceLabel (M03-T14)"`

---

### T15 — `EmptyState` and `SectionError`
- [x] done

**Files:** `src/components/empty-state.tsx`, `src/components/section-error.tsx`
**Context:** SPEC §2.9 Empty state (white, 1px dashed `border-strong`, r16, padding 56×24, 56×56 `primary-soft` r16 icon tile with 28 icon, 18/700 title, 15 muted body, primary 48 button), §6.2, §6.3 "Section failed to load" (`TriangleAlert` warning tile; `We couldn't load this.` / `Check your connection and try again.` / `Try again`), §5.E (S41 tile `warning-soft`/`warning-text`).
**Do:**
1. Create `src/components/empty-state.tsx`:
```tsx
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type EmptyAction = { label: string; to: string } | { label: string; onClick: () => void };

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: ReactNode;
  action?: EmptyAction;
  secondaryAction?: EmptyAction;
  tone?: 'primary' | 'warning';
  /** h1 on system pages (S39–S41); h2 inside a page. */
  titleAs?: 'h1' | 'h2' | 'h3';
  children?: ReactNode;
  className?: string;
}

function ActionButton({ action, variant }: { action: EmptyAction; variant: 'primary' | 'secondary' }) {
  if ('to' in action) {
    return (
      <Button asChild size="lg" variant={variant} className="w-full sm:w-auto">
        <Link to={action.to}>{action.label}</Link>
      </Button>
    );
  }
  return (
    <Button size="lg" variant={variant} className="w-full sm:w-auto" onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({ icon: Icon, title, body, action, secondaryAction, tone = 'primary', titleAs: Title = 'h2', children, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-14 text-center', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'grid size-14 place-items-center rounded-xl',
          tone === 'primary' ? 'bg-primary-soft text-primary' : 'bg-warning-soft text-warning-text',
        )}
      >
        <Icon className="size-7" />
      </span>
      <Title className="text-lead font-bold text-text">{title}</Title>
      {body !== undefined && <div className="max-w-md text-body-sm text-text-muted">{body}</div>}
      {children}
      {(action ?? secondaryAction) && (
        <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {action && <ActionButton action={action} variant="primary" />}
          {secondaryAction && <ActionButton action={secondaryAction} variant="secondary" />}
        </div>
      )}
    </div>
  );
}
```
2. Create `src/components/section-error.tsx`:
```tsx
import { TriangleAlert } from 'lucide-react';
import { EmptyState } from './empty-state';

/** SPEC §6.3: replaces one section's card; `onRetry` refetches only that section. */
export function SectionError({ onRetry, className }: { onRetry: () => void; className?: string }) {
  return (
    <EmptyState
      icon={TriangleAlert}
      tone="warning"
      title="We couldn't load this."
      body="Check your connection and try again."
      action={{ label: 'Try again', onClick: onRetry }}
      className={className}
    />
  );
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): EmptyState and SectionError (M03-T15)"`

---

### T16 — Skeletons and `LoadingRegion` (AC9)
- [x] done

**Files:** `src/components/skeletons.tsx`, `src/components/loading-region.tsx`, `src/components/loading-region.test.tsx`
**Context:** SPEC §6.1 table (each skeleton has the same box as the real component), `aria-busy="true"`, visually hidden `Loading…`, 150 ms delay. Milestone AC9.
**Do:**
1. Create `src/components/skeletons.tsx`. Each is a `<div>` card with the shape from SPEC §6.1. Use `Skeleton` from `@/components/ui/skeleton` for every block. Card classes: `rounded-xl border border-border bg-surface` (r16) unless stated. Exports and shapes:
   - `SkeletonCategoryCard`: r16 card `p-5 flex flex-col gap-3`; block `h-12 w-[52px] rounded-lg`; line `h-[17px] w-3/5`; line `h-3.5 w-4/5`.
   - `SkeletonFeaturedCard`: r16 card `overflow-hidden`; block `h-[180px] w-full rounded-none`; body `p-4 flex flex-col gap-2`: lines `h-[19px] w-2/3`, `h-3.5 w-1/2`; divider `border-t border-border my-2`; row `flex justify-between`: `h-4 w-[60px]` + `h-10 w-24 rounded-md`.
   - `SkeletonResultCard`: r16 card `p-5 flex flex-col gap-4 sm:flex-row`; square `size-[132px] rounded-lg shrink-0`; middle `flex-1 flex flex-col gap-2`: lines `h-5 w-2/5`, `h-3.5 w-[30%]`, `h-3.5 w-[70%]`; right `flex flex-col gap-2 sm:items-end`: `h-7 w-20`, `h-10 w-[110px] rounded-md`.
   - `SkeletonProfileHeader`: card `rounded-3xl p-6 flex flex-col gap-6 lg:flex-row`; square `size-[220px] max-w-full rounded-lg`; 4 lines (`h-10 w-3/5`, `h-4 w-2/5`, `h-4 w-1/2`, `h-4 w-1/3`); right column 3 blocks `h-10 w-48`.
   - `SkeletonSectionCard({ lines = 4 })`: card `rounded-2xl p-6 flex flex-col gap-3`; title `h-5 w-[30%]`; `lines` (3–5) body lines `h-3.5`, widths cycling `w-full`, `w-11/12`, `w-4/5`, `w-2/3`, `w-3/4`.
   - `SkeletonStatTile`: r16 card `p-5 flex flex-col gap-4`; row `flex justify-between`: `h-3.5 w-1/2` + `size-10 rounded-md`; value `h-10 w-[60px]`.
   - `SkeletonTableRows({ rows = 5, columns = 5 })`: fragment of `rows` `<div className="flex items-center gap-6 border-t border-border px-6 py-4">`: first cell `size-9 rounded-full` + 2 lines (`h-3.5 w-28`, `h-3 w-16`); middle `columns - 2` cells each with 2 lines (`h-3.5 w-24`, `h-3 w-16`) except the last middle cell has 1 line; last cell `h-7 w-[90px] rounded-full`.
   - `SkeletonPhoneCards({ count = 5 })`: `flex flex-col gap-3` of `count` r16 cards `p-4 flex flex-col gap-2`: row `flex justify-between` (`h-4 w-1/2` + `h-6 w-20 rounded-full`), lines `h-3.5 w-3/4`, `h-3.5 w-2/5`.
   - `SkeletonReviewRow`: `flex gap-4 py-4`: `size-11 rounded-full shrink-0`; column: `h-4 w-1/3`, `h-3 w-1/4`, stars `h-3.5 w-24`, 3 lines `h-3.5 w-full / w-11/12 / w-3/5`.
2. Create `src/components/loading-region.tsx`:
```tsx
import type { ReactNode } from 'react';
import { useDelayedFlag } from '@/lib/use-delayed-flag';

interface LoadingRegionProps {
  loading: boolean;
  /** Same box as the final content (SPEC §6.1). Shown only after 150 ms. */
  skeleton: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function LoadingRegion({ loading, skeleton, children, className }: LoadingRegionProps) {
  const showSkeleton = useDelayedFlag(loading);
  return (
    <div aria-busy={loading} className={className}>
      {loading ? (
        <>
          {showSkeleton && skeleton}
          <span className="sr-only">Loading…</span>
        </>
      ) : (
        children
      )}
    </div>
  );
}
```
**Test:** `src/components/loading-region.test.tsx` (AC9):
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { LoadingRegion } from './loading-region';

describe('LoadingRegion (SPEC §6.1, AC9)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('is aria-busy at once, shows the skeleton only after 150 ms, then the content', () => {
    const { container, rerender } = render(
      <LoadingRegion loading skeleton={<div data-testid="sk" />}>
        <p>Loaded</p>
      </LoadingRegion>,
    );
    const region = container.firstElementChild;
    expect(region?.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Loading…')).toBeTruthy();
    act(() => vi.advanceTimersByTime(149));
    expect(screen.queryByTestId('sk')).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId('sk')).toBeTruthy();
    rerender(
      <LoadingRegion loading={false} skeleton={<div data-testid="sk" />}>
        <p>Loaded</p>
      </LoadingRegion>,
    );
    expect(region?.getAttribute('aria-busy')).toBe('false');
    expect(screen.queryByTestId('sk')).toBeNull();
    expect(screen.getByText('Loaded')).toBeTruthy();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- loading-region` passes; `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): skeletons and LoadingRegion with 150 ms delay (M03-T16)"`

---

### T17 — `NoticeBanner`
- [ ] done

**Files:** `src/components/notice-banner.tsx`
**Context:** SPEC §2.9 Notice banner (r14, padding 14×16, 14/600, leading icon, optional link/button right; warning = `warning-soft` + 1px dashed `warning` + `warning-text-strong`; info = `primary-soft`/`primary`; danger = `danger-soft`/`danger-text`, solid border), §6.8 ("Phone: text wraps, and the action becomes a link on its own line (44 target)"; some are dismissible).
**Do:** create `src/components/notice-banner.tsx`:
```tsx
import type { ReactNode } from 'react';
import { CircleAlert, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export type NoticeAction = { label: string; to: string } | { label: string; onClick: () => void };

const VARIANT: Record<'warning' | 'info' | 'danger', { box: string; icon: LucideIcon }> = {
  warning: { box: 'border border-dashed border-warning bg-warning-soft text-warning-text-strong', icon: TriangleAlert },
  info: { box: 'border border-primary-soft-border bg-primary-soft text-primary', icon: Info },
  danger: { box: 'border border-danger bg-danger-soft text-danger-text', icon: CircleAlert },
};

interface NoticeBannerProps {
  variant: 'warning' | 'info' | 'danger';
  children: ReactNode;
  action?: NoticeAction;
  onDismiss?: () => void;
  className?: string;
}

const actionClass =
  'inline-flex min-h-11 items-center self-start font-bold underline-offset-2 hover:underline sm:min-h-0 sm:self-center';

export function NoticeBanner({ variant, children, action, onDismiss, className }: NoticeBannerProps) {
  const v = VARIANT[variant];
  const Icon = v.icon;
  return (
    <div className={cn('flex items-start gap-2 rounded-lg px-4 py-3.5 text-label font-semibold', v.box, className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <Icon aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
          <p className="min-w-0 flex-1">{children}</p>
        </div>
        {action &&
          ('to' in action ? (
            <Link to={action.to} className={actionClass}>
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={actionClass}>
              {action.label}
            </button>
          ))}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-my-2.5 -mr-2 grid size-11 shrink-0 place-items-center rounded-md"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): NoticeBanner (M03-T17)"`

---

### T18 — `ResponsiveDialog` (AC7)
- [ ] done

**Files:** `src/components/responsive-dialog.tsx`, `src/components/responsive-dialog.test.tsx`
**Context:** SPEC §6.10 (desktop modal r20 padding 32 max 440 `shadow-modal`, buttons right-aligned secondary → primary; phone bottom sheet §2.9: top radius 20, `shadow-toast`, grab handle 36×4 `border-strong`, header title + 44 close, sticky footer, buttons stacked full width with primary/danger first; focus trapped; Esc/overlay close except while submitting; focus returns to trigger). ARCH §5.2 (Dialog ≥ 641, Sheet bottom below, one in the DOM). Milestone note: features never use `Dialog`/`Sheet` directly.
**Do:** create `src/components/responsive-dialog.tsx`:
```tsx
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MQ, useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';

export interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** 56×56 icon tile (single-message dialogs). */
  icon?: ReactNode;
  /** 'center' for single-message dialogs (prototype), 'left' for forms (SPEC §6.10). */
  align?: 'center' | 'left';
  /** Optional trigger; focus returns to it on close. */
  trigger?: ReactNode;
  children?: ReactNode;
  /** Buttons in desktop order: secondary first, then primary/danger. Phone reverses them so primary is first. */
  footer?: ReactNode;
  /** false while submitting: Esc, overlay and the close button do nothing. */
  dismissible?: boolean;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  align = 'left',
  trigger,
  children,
  footer,
  dismissible = true,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery(MQ.sm);
  const handleOpenChange = (next: boolean) => {
    if (!next && !dismissible) return;
    onOpenChange(next);
  };
  const block = (e: Event) => {
    if (!dismissible) e.preventDefault();
  };
  const describedBy = description === undefined ? { 'aria-describedby': undefined } : {};

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent
          data-variant="dialog"
          showCloseButton={false}
          onEscapeKeyDown={block}
          onInteractOutside={block}
          className={cn('flex flex-col gap-4', align === 'center' && 'items-center text-center')}
          {...describedBy}
        >
          {icon}
          <DialogTitle className="text-title-md text-text">{title}</DialogTitle>
          {description !== undefined && (
            <DialogDescription className="text-body-sm text-text-muted">{description}</DialogDescription>
          )}
          {children}
          {footer && (
            <div className={cn('mt-2 flex gap-3', align === 'center' ? 'justify-center' : 'justify-end')}>{footer}</div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        data-variant="sheet"
        side="bottom"
        showCloseButton={false}
        onEscapeKeyDown={block}
        onInteractOutside={block}
        className="max-h-[90dvh] gap-0 rounded-t-2xl border-0 p-0 shadow-toast"
        {...describedBy}
      >
        <span aria-hidden="true" className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-border-strong" />
        <div className="flex items-center gap-2 py-1 pl-4 pr-1">
          <SheetTitle className="min-w-0 flex-1 text-title-md text-text">{title}</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close" disabled={!dismissible}>
              <X aria-hidden="true" className="size-5" />
            </Button>
          </SheetClose>
        </div>
        <div className={cn('flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-4', align === 'center' && 'items-center text-center')}>
          {icon}
          {description !== undefined && (
            <SheetDescription className="text-body-sm text-text-muted">{description}</SheetDescription>
          )}
          {children}
        </div>
        {footer && (
          <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&>*]:w-full">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```
If `DialogContent` from T3 has no `showCloseButton` prop, **STOP** and write a blocker.

**Test:** `src/components/responsive-dialog.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setViewportWidth } from '@/test/media';
import { ResponsiveDialog } from './responsive-dialog';

function renderDialog(props: Partial<Parameters<typeof ResponsiveDialog>[0]> = {}) {
  const onOpenChange = vi.fn();
  render(
    <ResponsiveDialog open onOpenChange={onOpenChange} title="Decline Olivia's request?" footer={<button>Decline</button>} {...props}>
      <p>Body</p>
    </ResponsiveDialog>,
  );
  return { onOpenChange };
}

describe('ResponsiveDialog (SPEC §6.10, AC7)', () => {
  it('is a centred dialog at 1440px', () => {
    renderDialog();
    const dialogs = screen.getAllByRole('dialog');
    expect(dialogs).toHaveLength(1);
    expect(dialogs[0]?.dataset.variant).toBe('dialog');
  });
  it('is a bottom sheet at 390px', () => {
    setViewportWidth(390);
    renderDialog();
    const dialogs = screen.getAllByRole('dialog');
    expect(dialogs).toHaveLength(1);
    expect(dialogs[0]?.dataset.variant).toBe('sheet');
  });
  it('closes on Esc unless it is not dismissible', async () => {
    const user = userEvent.setup();
    const a = renderDialog();
    await user.keyboard('{Escape}');
    expect(a.onOpenChange).toHaveBeenCalledWith(false);
  });
  it('ignores Esc while submitting', async () => {
    const user = userEvent.setup();
    const a = renderDialog({ dismissible: false });
    await user.keyboard('{Escape}');
    expect(a.onOpenChange).not.toHaveBeenCalled();
  });
});
```
If `@testing-library/user-event` isn't installed, add it first: `pnpm --filter @fixit/web add -D @testing-library/user-event@^14`.
**Verify:** `pnpm --filter @fixit/web test -- responsive-dialog` passes; `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): ResponsiveDialog switches dialog/bottom sheet (M03-T18)"`

---

### T19 — `DataList` (AC7)
- [ ] done

**Files:** `src/components/data-list.tsx`, `src/components/data-list.test.tsx`
**Context:** SPEC §2.9 Data table (header row `page` 12/700 uppercase subtle, 10×24 padding; rows 16×24 padding, `border` top), §6.9 (cards at ≤ 640: white r16 1px `border` padding 16 gap 8; identity + status on row 1; secondary 13 muted lines; full-width actions row 44 high; whole card is the row link; no column headers). ARCH §5.2 (one column definition, `useMediaQuery` so only one form is in the DOM). Uses `LoadingRegion`, `SkeletonTableRows`, `SkeletonPhoneCards` (T16).
**Do:** create `src/components/data-list.tsx`:
```tsx
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { MQ, useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { LoadingRegion } from './loading-region';
import { SkeletonPhoneCards, SkeletonTableRows } from './skeletons';

export interface DataListColumn<T> {
  id: string;
  /** Table header; dropped on phone cards. */
  header: string;
  cell: (row: T) => ReactNode;
  /** Where the value goes on the phone card (SPEC §6.9). Exactly one column should be 'title'. */
  card: 'title' | 'status' | 'meta' | 'actions' | 'hidden';
  /** Extra classes for th/td (e.g. widths). */
  className?: string;
}

interface DataListProps<T> {
  rows: readonly T[];
  columns: readonly DataListColumn<T>[];
  getRowKey: (row: T) => string;
  /** Table caption / list label (visually hidden). */
  caption: string;
  /** Makes the whole row/card a link (stretched over the row; actions stay clickable). */
  rowHref?: (row: T) => string;
  /** Accessible name of the row link, e.g. "FX-2061, Olivia Martinez". */
  rowLabel?: (row: T) => string;
  loading?: boolean;
  /** Rendered instead of the list when there are no rows. */
  empty?: ReactNode;
}

const stretched = "before:absolute before:inset-0 before:content-['']";

export function DataList<T>({ rows, columns, getRowKey, caption, rowHref, rowLabel, loading = false, empty }: DataListProps<T>) {
  const isTable = useMediaQuery(MQ.sm);

  const titleCell = (row: T, col: DataListColumn<T>) =>
    rowHref ? (
      <Link to={rowHref(row)} aria-label={rowLabel?.(row)} className={cn('block', stretched)}>
        {col.cell(row)}
      </Link>
    ) : (
      col.cell(row)
    );

  return (
    <LoadingRegion
      loading={loading}
      skeleton={isTable ? <SkeletonTableRows columns={columns.length} /> : <SkeletonPhoneCards />}
    >
      {rows.length === 0 ? (
        empty
      ) : isTable ? (
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-page">
            <tr>
              {columns.map((c) => (
                <th key={c.id} scope="col" className={cn('px-6 py-2.5 text-caption uppercase tracking-[0.05em] text-text-subtle', c.className)}>
                  {c.card === 'actions' ? <span className="sr-only">{c.header}</span> : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)} className={cn('border-t border-border', rowHref && 'relative hover:bg-page')}>
                {columns.map((c) => (
                  <td key={c.id} className={cn('px-6 py-4 align-middle text-body-sm text-text', c.card === 'actions' && 'relative z-10', c.className)}>
                    {c.card === 'title' ? titleCell(row, c) : c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul aria-label={caption} className="flex flex-col gap-3">
          {rows.map((row) => {
            const title = columns.find((c) => c.card === 'title');
            const statuses = columns.filter((c) => c.card === 'status');
            const metas = columns.filter((c) => c.card === 'meta');
            const actions = columns.filter((c) => c.card === 'actions');
            return (
              <li key={getRowKey(row)} className="relative flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 text-body-sm font-semibold text-text">{title && titleCell(row, title)}</div>
                  {statuses.map((c) => (
                    <div key={c.id} className="shrink-0">
                      {c.cell(row)}
                    </div>
                  ))}
                </div>
                {metas.map((c) => (
                  <div key={c.id} className="text-meta text-text-muted">
                    {c.cell(row)}
                  </div>
                ))}
                {actions.length > 0 && (
                  <div className="relative z-10 mt-1 flex gap-2 [&_a]:min-h-11 [&_a]:flex-1 [&_button]:min-h-11 [&_button]:flex-1">
                    {actions.map((c) => (
                      <div key={c.id} className="flex flex-1 gap-2">
                        {c.cell(row)}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </LoadingRegion>
  );
}
```
**Test:** `src/components/data-list.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { setViewportWidth } from '@/test/media';
import { DataList, type DataListColumn } from './data-list';

interface Row {
  ref: string;
  name: string;
  status: string;
}
const rows: Row[] = [
  { ref: 'FX-2061', name: 'Olivia Martinez', status: 'Pending' },
  { ref: 'FX-2059', name: 'James Carter', status: 'Accepted' },
];
const columns: DataListColumn<Row>[] = [
  { id: 'name', header: 'Customer', card: 'title', cell: (r) => r.name },
  { id: 'ref', header: 'Reference', card: 'meta', cell: (r) => r.ref },
  { id: 'status', header: 'Status', card: 'status', cell: (r) => r.status },
];

function renderList() {
  return render(
    <MemoryRouter>
      <DataList rows={rows} columns={columns} getRowKey={(r) => r.ref} caption="Requests" rowHref={(r) => `/dashboard/requests/${r.ref}`} />
    </MemoryRouter>,
  );
}

describe('DataList (SPEC §6.9, AC7)', () => {
  it('renders a table at ≥641px and no card list', () => {
    setViewportWidth(641);
    renderList();
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Customer', 'Reference', 'Status']);
  });
  it('renders cards at 390px and no table; each card links to the row', () => {
    setViewportWidth(390);
    renderList();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Olivia Martinez' }).getAttribute('href')).toBe('/dashboard/requests/FX-2061');
  });
  it('switches when the viewport crosses 641px', () => {
    renderList();
    expect(screen.getByRole('table')).toBeTruthy();
    setViewportWidth(640);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('list')).toBeTruthy();
  });
  it('shows the empty state when there are no rows', () => {
    render(
      <MemoryRouter>
        <DataList rows={[]} columns={columns} getRowKey={(r) => r.ref} caption="Requests" empty={<p>No requests with this status.</p>} />
      </MemoryRouter>,
    );
    expect(screen.getByText('No requests with this status.')).toBeTruthy();
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- data-list` passes; `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): DataList renders table or cards from one column set (M03-T19)"`

---

### T20 — `Pagination`
- [ ] done

**Files:** `src/components/pagination.tsx`, `src/components/pagination.test.ts`
**Context:** SPEC S2.E12 (hidden when 1 page; current page `primary` bg, white; `Previous` · `1 2 3 … 8` · `Next`), S2 phone note 6 (`‹ Previous` · `Page 2 of 5` · `Next ›`), §9 (44 targets on phone). Pagination is URL-driven (`?page=`), so pages are links.
**Do:** create `src/components/pagination.tsx`:
```tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/** 1 … around current … last; at most 7 items. */
export function pageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, Math.min(current - 1, total - 4));
  const end = Math.min(total - 1, Math.max(current + 1, 5));
  const items: PageItem[] = [1];
  if (start > 2) items.push('ellipsis-start');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push('ellipsis-end');
  items.push(total);
  return items;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  className?: string;
}

const box = 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-3 text-label font-semibold sm:min-h-10 sm:min-w-10';

export function Pagination({ page, totalPages, hrefFor, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;
  const edge = (target: number | null, label: string, icon: 'prev' | 'next') => {
    const content = (
      <>
        {icon === 'prev' && <ChevronLeft aria-hidden="true" className="size-4" />}
        {label}
        {icon === 'next' && <ChevronRight aria-hidden="true" className="size-4" />}
      </>
    );
    return target === null ? (
      <span aria-disabled="true" className={cn(box, 'text-text-subtle opacity-60')}>
        {content}
      </span>
    ) : (
      <Link to={hrefFor(target)} className={cn(box, 'text-text-muted hover:bg-page hover:text-text')}>
        {content}
      </Link>
    );
  };
  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-between gap-2 sm:justify-center', className)}>
      {edge(prev, 'Previous', 'prev')}
      <span className="text-label font-semibold text-text-muted sm:hidden">{`Page ${String(page)} of ${String(totalPages)}`}</span>
      <ul className="hidden items-center gap-1 sm:flex">
        {pageItems(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <Link
                to={hrefFor(item)}
                aria-current={item === page ? 'page' : undefined}
                className={cn(box, 'px-0', item === page ? 'bg-primary text-primary-foreground' : 'text-text-muted hover:bg-page hover:text-text')}
              >
                {item}
              </Link>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-1 text-text-subtle">
              …
            </li>
          ),
        )}
      </ul>
      {edge(next, 'Next', 'next')}
    </nav>
  );
}
```
**Test:** `src/components/pagination.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { pageItems } from './pagination';

describe('pageItems', () => {
  it('lists every page up to 7', () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('collapses with ellipses around the current page', () => {
    expect(pageItems(1, 8)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 8]);
    expect(pageItems(5, 10)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 10]);
    expect(pageItems(10, 10)).toEqual([1, 'ellipsis-start', 6, 7, 8, 9, 10]);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- pagination` passes; `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): Pagination (M03-T20)"`

---

### T21 — `SegmentedTabs`
- [ ] done

**Files:** `src/components/segmented-tabs.tsx`
**Context:** SPEC §2.9 Segmented tabs (track `page` r12 padding 4 gap 4; tab 34 high r9 13/600; count 12 subtle; active white + `shadow-xs` + `text`), L2 (links; phone: track full width, scrolls horizontally, each tab ≥ 44 high), §9 (status tabs = `tablist`, or links with `aria-current` when they change the URL).
**Do:** create `src/components/segmented-tabs.tsx`:
```tsx
import { useRef, type KeyboardEvent } from 'react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';

export interface SegmentedTabItem {
  value: string;
  label: string;
  count?: number;
  /** Links mode: the URL this tab opens. */
  to?: string;
}

const track = 'flex w-full gap-1 overflow-x-auto rounded-md bg-page p-1 sm:inline-flex sm:w-auto';
const tab =
  'inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3 text-meta font-semibold text-text-muted transition-colors hover:text-text sm:h-[34px] sm:min-h-0';
const active = 'bg-surface text-text shadow-xs';

function Count({ n }: { n: number | undefined }) {
  return n === undefined ? null : <span className="text-caption font-semibold text-text-subtle">{n}</span>;
}

/** Links mode (changes the URL): `<SegmentedTabs label="Account sections" items={[{ value, label, to }]} />`. */
export function SegmentedTabLinks({ label, items, className }: { label: string; items: SegmentedTabItem[]; className?: string }) {
  return (
    <nav aria-label={label} className={cn(track, className)}>
      {items.map((it) => (
        <NavLink key={it.value} to={it.to ?? '#'} end className={({ isActive }) => cn(tab, isActive && active)}>
          {it.label}
          <Count n={it.count} />
        </NavLink>
      ))}
    </nav>
  );
}

/** Tabs mode (local state): role=tablist, arrow keys move and select. */
export function SegmentedTabs({
  label,
  items,
  value,
  onValueChange,
  className,
}: {
  label: string;
  items: SegmentedTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (delta === 0) return;
    e.preventDefault();
    const next = (index + delta + items.length) % items.length;
    const item = items[next];
    if (!item) return;
    onValueChange(item.value);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cn(track, className)}>
      {items.map((it, i) => {
        const selected = it.value === value;
        return (
          <button
            key={it.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              onValueChange(it.value);
            }}
            onKeyDown={(e) => {
              onKeyDown(e, i);
            }}
            className={cn(tab, selected && active)}
          >
            {it.label}
            <Count n={it.count} />
          </button>
        );
      })}
    </div>
  );
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): SegmentedTabs (links and tablist) (M03-T21)"`

---

### T22 — `BackLink`, `FormField`, `PhoneInput`
- [ ] done

**Files:** `src/components/back-link.tsx`, `src/components/form-field.tsx`, `src/components/phone-input.tsx`
**Context:** SPEC L2 back link (`ArrowLeft` + 15/600 muted, hover `primary`); §5 form conventions (errors 13/19 `danger-text` with `CircleAlert` 16; border turns `danger`); §9 Labels (visible label; `aria-describedby` for help + error; `aria-invalid`; required → `(required)` for screen readers; optional fields show `Optional`); S12 mobile field (tel input with fixed `+94` prefix; parsing by `MobileInput` from contracts in M04/M08 forms).
**Do:**
1. `src/components/back-link.tsx`:
```tsx
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export function BackLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link
      to={to}
      className={cn('inline-flex min-h-11 items-center gap-2 self-start text-body-sm font-semibold text-text-muted transition-colors hover:text-primary sm:min-h-0', className)}
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
      {children}
    </Link>
  );
}
```
2. `src/components/form-field.tsx`:
```tsx
import { useId, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  'aria-required': true | undefined;
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  /** Shows a visible "Optional" after the label. */
  optional?: boolean;
  help?: ReactNode;
  error?: string;
  /** Render the control with the wiring props spread onto it. */
  children: (control: FieldControlProps) => ReactNode;
  className?: string;
}

export function FormField({ label, required = false, optional = false, help, error, children, className }: FormFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [help !== undefined ? helpId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="sr-only"> (required)</span>}
        {optional && <span className="ml-1.5 font-medium text-text-subtle">Optional</span>}
      </Label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })}
      {help !== undefined && (
        <p id={helpId} className="text-meta text-text-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-meta text-danger-text">
          <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
```
3. `src/components/phone-input.tsx`:
```tsx
import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Tel input with a fixed `+94` prefix. The value is what the user typed; forms parse it with `MobileInput`. */
export function PhoneInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body font-medium text-text-muted">
        +94
      </span>
      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="77 123 4567"
        className={cn('pl-12', className)}
        {...props}
      />
    </div>
  );
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): BackLink, FormField and PhoneInput (M03-T22)"`

---

### T23 — Nav configuration (links, active rules, menus, sidebars, footer)
- [ ] done

**Files:** `src/app/layouts/nav-config.ts`, `src/app/layouts/nav-config.test.ts`
**Context:** SPEC L1 "Nav content per role", avatar menu, active link rules, footer links; L2 section tabs; L3 nav items (badge = Pending count, Verification dot when Not submitted or Rejected); L4 nav items; §4.1 Should/Could gating; D-b. `lib/features.ts`.
**Do:** create `src/app/layouts/nav-config.ts`:
```ts
import type { Me } from '@fixit/contracts';
import {
  BriefcaseBusiness,
  ChartColumn,
  ClipboardList,
  Heart,
  Inbox,
  LayoutDashboard,
  Map,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  Tags,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { features as defaultFeatures, type FeatureFlag } from '@/lib/features';

type Flags = Readonly<Record<FeatureFlag, boolean>>;
export type ViewerRole = 'guest' | 'customer' | 'provider' | 'admin';

export function viewerRole(me: Me | null): ViewerRole {
  if (!me) return 'guest';
  if (me.roles.includes('admin')) return 'admin';
  return me.roles.includes('provider') ? 'provider' : 'customer';
}

/* ---------- L1 top links ---------- */
export type PublicLinkId = 'home' | 'discover' | 'forProviders' | 'myRequests';
export interface PublicLink {
  id: PublicLinkId;
  label: string;
  to: string;
}
const LINK: Record<PublicLinkId, PublicLink> = {
  home: { id: 'home', label: 'Home', to: '/' },
  discover: { id: 'discover', label: 'Find Providers', to: '/discover' },
  forProviders: { id: 'forProviders', label: 'For Providers', to: '/for-providers' },
  myRequests: { id: 'myRequests', label: 'My requests', to: '/requests' },
};

export function publicNavLinks(role: ViewerRole): PublicLink[] {
  if (role === 'guest') return [LINK.home, LINK.discover, LINK.forProviders];
  if (role === 'admin') return [LINK.home, LINK.discover];
  return [LINK.home, LINK.discover, LINK.myRequests];
}

/** SPEC L1 active link rules. */
export function isPublicLinkActive(id: PublicLinkId, pathname: string): boolean {
  switch (id) {
    case 'home':
      return pathname === '/';
    case 'discover':
      return pathname === '/discover' || pathname.startsWith('/providers/');
    case 'myRequests':
      return pathname.startsWith('/requests') || pathname === '/saved' || pathname === '/account';
    case 'forProviders':
      return pathname === '/for-providers';
  }
}

/* ---------- Avatar menu (also the signed-in part of the phone sheet) ---------- */
export interface MenuItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export function accountMenuItems(me: Me, f: Flags = defaultFeatures): MenuItem[] {
  const items: MenuItem[] = [{ label: 'My requests', to: '/requests', icon: Inbox }];
  if (f.savedProviders) items.push({ label: 'Saved providers', to: '/saved', icon: Heart });
  items.push({ label: 'Account settings', to: '/account', icon: User });
  items.push(
    me.roles.includes('provider')
      ? { label: 'Provider dashboard', to: '/dashboard', icon: LayoutDashboard }
      : { label: 'Become a provider', to: `/become-a-provider/${String(me.provider?.onboarding.step ?? 1)}`, icon: BriefcaseBusiness },
  );
  return items;
}

/* ---------- L2 section tabs ---------- */
export function customerTabs(f: Flags = defaultFeatures): { value: string; label: string; to: string }[] {
  return [
    { value: 'requests', label: 'My requests', to: '/requests' },
    ...(f.savedProviders ? [{ value: 'saved', label: 'Saved', to: '/saved' }] : []),
    { value: 'account', label: 'Account', to: '/account' },
  ];
}

/* ---------- L3 / L4 sidebar ---------- */
export interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** NavLink `end` (index routes). */
  end?: boolean;
  count?: number;
  /** Screen-reader text for the count, e.g. "3 new requests". */
  countLabel?: string;
  /** 8×8 warning dot. */
  dot?: boolean;
}

export function providerSidebarItems(me: Me, f: Flags = defaultFeatures): SidebarItem[] {
  const p = me.provider;
  const pending = p?.pendingRequestCount ?? 0;
  const needsVerification = p?.verificationStatus === 'not_submitted' || p?.verificationStatus === 'rejected';
  const items: SidebarItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    {
      to: '/dashboard/requests',
      label: 'Requests',
      icon: Inbox,
      ...(pending > 0 ? { count: pending, countLabel: `${String(pending)} new requests` } : {}),
    },
    { to: '/dashboard/services', label: 'My Services', icon: BriefcaseBusiness },
    { to: '/dashboard/profile', label: 'Profile', icon: User },
    { to: '/dashboard/areas', label: 'Service areas', icon: Map },
    { to: '/dashboard/verification', label: 'Verification', icon: ShieldCheck, ...(needsVerification ? { dot: true } : {}) },
  ];
  if (f.providerReviews || f.replies) items.push({ to: '/dashboard/reviews', label: 'Reviews', icon: Star });
  if (f.pause) items.push({ to: '/dashboard/settings', label: 'Settings', icon: Settings }); // D-b
  return items;
}

export function adminSidebarItems(f: Flags = defaultFeatures): SidebarItem[] {
  return [
    { to: '/admin', label: 'Overview', icon: ChartColumn, end: true },
    { to: '/admin/verifications', label: 'Verification', icon: ShieldCheck }, // count wired in M13 (D-d)
    { to: '/admin/users', label: 'Users', icon: Users },
    ...(f.adminRequests ? [{ to: '/admin/requests', label: 'Requests', icon: ClipboardList }] : []),
    { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
    ...(f.adminCatalog ? [{ to: '/admin/catalog', label: 'Categories & towns', icon: Tags }] : []),
  ];
}

/* ---------- Footer ---------- */
export interface FooterColumn {
  title: string;
  links: { label: string; to: string }[];
}

export function footerColumns(role: ViewerRole): FooterColumn[] {
  const guest = role === 'guest';
  return [
    {
      title: 'Customers',
      links: [
        { label: 'Find Providers', to: '/discover' },
        { label: 'How it works', to: '/#how-it-works' },
        { label: 'My requests', to: '/requests' },
      ],
    },
    {
      title: 'Providers',
      links: [
        { label: 'For Providers', to: '/for-providers' },
        { label: 'Get verified', to: guest ? '/for-providers' : '/dashboard/verification' },
        { label: 'Dashboard', to: guest ? '/login?next=%2Fdashboard' : '/dashboard' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', to: '/about' },
        { label: 'Contact', to: '/contact' },
        { label: 'Privacy', to: '/privacy' },
      ],
    },
  ];
}
```
**Test:** `src/app/layouts/nav-config.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { db } from '@/mocks/db/store';
import { buildMe } from '@/mocks/lib/me';
import { features } from '@/lib/features';
import {
  accountMenuItems,
  adminSidebarItems,
  isPublicLinkActive,
  providerSidebarItems,
  publicNavLinks,
  viewerRole,
} from './nav-config';

const me = (id: string) => buildMe(db(), id);
const allOn = Object.fromEntries(Object.keys(features).map((k) => [k, true])) as typeof features;

describe('nav config', () => {
  it('top links per role (SPEC L1)', () => {
    expect(publicNavLinks('guest').map((l) => l.label)).toEqual(['Home', 'Find Providers', 'For Providers']);
    expect(publicNavLinks(viewerRole(me('u-olivia'))).map((l) => l.label)).toEqual(['Home', 'Find Providers', 'My requests']);
    expect(publicNavLinks(viewerRole(me('u-marcus'))).map((l) => l.label)).toEqual(['Home', 'Find Providers', 'My requests']);
    expect(publicNavLinks(viewerRole(me('u-admin'))).map((l) => l.label)).toEqual(['Home', 'Find Providers']);
  });
  it('active link rules', () => {
    expect(isPublicLinkActive('home', '/')).toBe(true);
    expect(isPublicLinkActive('home', '/discover')).toBe(false);
    expect(isPublicLinkActive('discover', '/providers/p01')).toBe(true);
    expect(isPublicLinkActive('myRequests', '/requests/FX-2061')).toBe(true);
    expect(isPublicLinkActive('myRequests', '/account')).toBe(true);
    expect(isPublicLinkActive('forProviders', '/for-providers')).toBe(true);
  });
  it('avatar menu (AC2): no Saved while F-10 is off; Become a provider vs Provider dashboard', () => {
    expect(accountMenuItems(me('u-olivia')).map((i) => i.label)).toEqual(['My requests', 'Account settings', 'Become a provider']);
    expect(accountMenuItems(me('u-olivia')).at(-1)?.to).toBe('/become-a-provider/1');
    expect(accountMenuItems(me('u-kasun')).at(-1)?.to).toBe('/become-a-provider/3');
    expect(accountMenuItems(me('u-marcus')).map((i) => i.label)).toEqual(['My requests', 'Account settings', 'Provider dashboard']);
    expect(accountMenuItems(me('u-olivia'), allOn).map((i) => i.label)).toContain('Saved providers');
  });
  it('provider sidebar (AC3): flagged items hidden; count and dot', () => {
    const marcus = me('u-marcus');
    const items = providerSidebarItems(marcus);
    expect(items.map((i) => i.label)).toEqual(['Dashboard', 'Requests', 'My Services', 'Profile', 'Service areas', 'Verification']);
    expect(items[1]?.count).toBe(marcus.provider?.pendingRequestCount || undefined);
    expect(items.find((i) => i.label === 'Verification')?.dot).toBeUndefined();
    expect(providerSidebarItems(me('u-hank')).find((i) => i.label === 'Verification')?.dot).toBe(true);
    expect(providerSidebarItems(marcus, allOn)).toHaveLength(8);
  });
  it('admin sidebar (AC3): no Requests / Categories while flags are off', () => {
    expect(adminSidebarItems().map((i) => i.label)).toEqual(['Overview', 'Verification', 'Users', 'Reviews']);
    expect(adminSidebarItems(allOn)).toHaveLength(6);
  });
});
```
**Verify:** `pnpm --filter @fixit/web test -- nav-config` passes; `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): nav, menu, sidebar and footer configuration (M03-T23)"`

---

### T24 — Layout parts: Logo, SkipLink, OfflineBanner, BannerSlot
- [ ] done

**Files:** `src/app/layouts/parts/logo.tsx`, `skip-link.tsx`, `offline-banner.tsx`, `banner-slot.tsx`
**Context:** SPEC L1 logo (34×34 `primary` tile r10 with white "F" 17/800 + "Fixit" `text-logo`; footer: white tile with `primary` F, "Fixit" white), §9 Skip link (first focusable element of every layout), §6.3 Offline (thin `warning-soft` banner under the nav/top bar, aria-live polite, `You're offline. Some things won't work until you reconnect.`), §6.8 placement + "at most 2 banners".
**Do:**
1. `logo.tsx`:
```tsx
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export function Logo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <Link to="/" aria-label="Fixit home" className={cn('inline-flex min-h-11 shrink-0 items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'grid size-[34px] place-items-center rounded-sm text-title-xs font-extrabold',
          inverse ? 'bg-surface text-primary' : 'bg-primary text-primary-foreground',
        )}
      >
        F
      </span>
      <span aria-hidden="true" className={cn('text-logo', inverse ? 'text-primary-foreground' : 'text-text')}>
        Fixit
      </span>
    </Link>
  );
}
```
2. `skip-link.tsx`:
```tsx
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-3 focus:text-label focus:font-semibold focus:text-primary focus:shadow-modal"
    >
      Skip to content
    </a>
  );
}
```
3. `offline-banner.tsx`:
```tsx
import { useOnlineStatus } from '@/lib/use-online-status';

export function OfflineBanner() {
  const online = useOnlineStatus();
  return (
    <div role="status" aria-live="polite">
      {!online && (
        <p className="bg-warning-soft px-4 py-2 text-center text-label font-semibold text-warning-text-strong">
          You&apos;re offline. Some things won&apos;t work until you reconnect.
        </p>
      )}
    </div>
  );
}
```
4. `banner-slot.tsx`:
```tsx
import type { ReactNode } from 'react';

/** SPEC §6.8: at most 2 banners, already in priority order. Rules arrive in M04/M11; layouts pass [] for now. */
export function BannerSlot({ banners, placement }: { banners: readonly ReactNode[]; placement: 'strip' | 'main' }) {
  const shown = banners.slice(0, 2);
  if (shown.length === 0) return null;
  if (placement === 'main') return <div className="flex flex-col gap-2">{shown}</div>;
  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-content flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">{shown}</div>
    </div>
  );
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): logo, skip link, offline banner and banner slot (M03-T24)"`

---

### T25 — `AccountMenu` (avatar dropdown)
- [ ] done

**Files:** `src/app/layouts/parts/account-menu.tsx`
**Context:** SPEC L1 avatar menu (dropdown white r14 `shadow-tooltip` 1px `border` min-width 220; items 44 high 14/600 with icon; header name 14/700 + email 13 subtle; divider; Log out `LogOut`, hover `danger-text`). Trigger: initials 40 circle (`primary-soft`/`primary` 800) + `ChevronDown` on desktop; on phone the trigger is the 40×40 avatar only. AC2. Uses `accountMenuItems` (T23), `useLogout` (T12), `initialsOf` (T8).
**Do:** create `account-menu.tsx`:
```tsx
import type { Me } from '@fixit/contracts';
import { ChevronDown, LogOut } from 'lucide-react';
import { Link } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/features/auth/hooks';
import { initialsOf } from '@/lib/format';
import { accountMenuItems } from '../nav-config';

export function AccountMenu({ me }: { me: Me }) {
  const logout = useLogout();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${me.fullName}`}
        className="inline-flex min-h-11 items-center gap-1 rounded-full text-text-muted"
      >
        <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-label font-extrabold text-primary">
          {initialsOf(me.fullName)}
        </span>
        <ChevronDown aria-hidden="true" className="hidden size-4 lg:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-label font-bold text-text">{me.fullName}</span>
          <span className="break-all text-meta font-normal text-text-subtle">{me.email}</span>
        </DropdownMenuLabel>
        {accountMenuItems(me).map(({ label, to, icon: Icon }) => (
          <DropdownMenuItem key={to} asChild>
            <Link to={to}>
              <Icon aria-hidden="true" className="size-[18px] text-text-muted" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void logout();
          }}
          className="hover:text-danger-text focus:text-danger-text"
        >
          <LogOut aria-hidden="true" className="size-[18px]" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): avatar account menu (M03-T25)"`

---

### T26 — `NavSheet` (phone/tablet right sheet)
- [ ] done

**Files:** `src/app/layouts/parts/nav-sheet.tsx`
**Context:** SPEC L1 "Tablet & phone": hamburger `Menu` 44×44; right sheet (full height, width min(360, 100vw), `shadow-modal`, overlay); close `X` 44 top-right; nav links as 56-high rows 16/600, active `primary` + `primary-soft` bg; guests: two full-width 48 buttons `Log in` (secondary) and `Sign up` (primary); signed-in: account-menu items; admin: `Admin console` + `Log out` (L1 role table). Closes on link tap, overlay tap, Esc; focus trapped; returns focus to the hamburger (Radix `SheetTrigger` does this). AC1.
**Do:** create `nav-sheet.tsx`:
```tsx
import { useState } from 'react';
import type { Me } from '@fixit/contracts';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLogout } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';
import { accountMenuItems, isPublicLinkActive, publicNavLinks, viewerRole } from '../nav-config';

const row = 'flex min-h-14 items-center gap-3 rounded-md px-4 text-body font-semibold text-text hover:bg-page';

export function NavSheet({ me }: { me: Me | null }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const logout = useLogout();
  const role = viewerRole(me);
  const close = () => {
    setOpen(false);
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="text-text lg:hidden">
          <Menu aria-hidden="true" className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" showCloseButton={false} aria-describedby={undefined} className="w-full max-w-[360px] gap-0 p-0 sm:max-w-[360px]">
        <div className="flex h-nav items-center justify-between pl-4 pr-2">
          <SheetTitle className="text-title-md text-text">Menu</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close menu">
              <X aria-hidden="true" className="size-6" />
            </Button>
          </SheetClose>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 overflow-y-auto px-2 pb-6">
          {publicNavLinks(role).map((l) => {
            const active = isPublicLinkActive(l.id, pathname);
            return (
              <Link key={l.id} to={l.to} onClick={close} aria-current={active ? 'page' : undefined} className={cn(row, active && 'bg-primary-soft text-primary hover:bg-primary-soft')}>
                {l.label}
              </Link>
            );
          })}
          {role === 'guest' && (
            <div className="mt-4 flex flex-col gap-3 px-2">
              <Button asChild variant="secondary" size="lg">
                <Link to="/login" onClick={close}>Log in</Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/signup" onClick={close}>Sign up</Link>
              </Button>
            </div>
          )}
          {me && role !== 'admin' && (
            <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
              {accountMenuItems(me).map(({ label, to, icon: Icon }) => (
                <Link key={to} to={to} onClick={close} className={row}>
                  <Icon aria-hidden="true" className="size-5 text-text-muted" />
                  {label}
                </Link>
              ))}
            </div>
          )}
          {role === 'admin' && (
            <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
              <Link to="/admin" onClick={close} className={row}>
                <LayoutDashboard aria-hidden="true" className="size-5 text-text-muted" />
                Admin console
              </Link>
            </div>
          )}
          {me && (
            <button
              type="button"
              onClick={() => {
                close();
                void logout();
              }}
              className={cn(row, 'text-left hover:text-danger-text')}
            >
              <LogOut aria-hidden="true" className="size-5" />
              Log out
            </button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): phone and tablet nav sheet (M03-T26)"`

---

### T27 — `PublicNav` (L1 top bar)
- [ ] done

**Files:** `src/app/layouts/parts/public-nav.tsx`
**Context:** SPEC L1 desktop (sticky top 0, z 10, white, 1px bottom `border`, height 72 / 64 phone via `h-nav`; inner max 1240, padding 0 32 (24 tablet, 16 phone), gap 48; links gap 32, 15/600, active `primary` + 2px underline, inactive `text-muted` hover `text`; actions gap 10 right). Role table: Guest `Log in` (secondary 40) · `Sign up` (primary 40); Customer avatar menu; Provider `Dashboard` (outline 40, `LayoutDashboard`) + avatar; Admin `Admin console` (outline 40) + `Log out` (secondary 40). ≤1023: logo left; right: avatar (signed-in, not admin) + hamburger. S29: logo only. Prototype `01-home-desktop.png` top bar.
**Do:** create `public-nav.tsx`:
```tsx
import { LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/features/auth/hooks';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { isPublicLinkActive, publicNavLinks, viewerRole } from '../nav-config';
import { AccountMenu } from './account-menu';
import { Logo } from './logo';
import { NavSheet } from './nav-sheet';

export function PublicNav({ variant = 'full' }: { variant?: 'full' | 'logo' }) {
  const { me } = useAuth();
  const { pathname } = useLocation();
  const logout = useLogout();
  const role = viewerRole(me);
  return (
    <header className="sticky top-0 z-10 h-nav border-b border-border bg-surface">
      <div className="mx-auto flex h-full max-w-content items-center gap-12 px-4 sm:px-6 lg:px-8">
        <Logo />
        {variant === 'full' && (
          <>
            <nav aria-label="Main" className="hidden h-full items-stretch gap-8 lg:flex">
              {publicNavLinks(role).map((l) => {
                const active = isPublicLinkActive(l.id, pathname);
                return (
                  <Link
                    key={l.id}
                    to={l.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center text-body-sm font-semibold transition-colors',
                      active
                        ? 'text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
                        : 'text-text-muted hover:text-text',
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-2.5">
              {role === 'guest' && (
                <>
                  <Button asChild variant="secondary" className="hidden lg:inline-flex">
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button asChild className="hidden lg:inline-flex">
                    <Link to="/signup">Sign up</Link>
                  </Button>
                </>
              )}
              {role === 'provider' && (
                <Button asChild variant="outline" className="hidden lg:inline-flex">
                  <Link to="/dashboard">
                    <LayoutDashboard aria-hidden="true" />
                    Dashboard
                  </Link>
                </Button>
              )}
              {role === 'admin' && (
                <>
                  <Button asChild variant="outline" className="hidden lg:inline-flex">
                    <Link to="/admin">Admin console</Link>
                  </Button>
                  <Button variant="secondary" className="hidden lg:inline-flex" onClick={() => void logout()}>
                    Log out
                  </Button>
                </>
              )}
              {me && role !== 'admin' && <AccountMenu me={me} />}
              <NavSheet me={me} />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): L1 public nav (M03-T27)"`

---

### T28 — `Footer`
- [ ] done

**Files:** `src/app/layouts/parts/footer.tsx`
**Context:** SPEC L1 footer (`footer-bg`, margin-top auto; max 1240, padding 56 32 28; grid `1.6fr 1fr 1fr 1fr` gap 40; brand block: white tile with `primary` F, "Fixit" white, "Home service booking marketplace." 14/20; column titles white 700 14; links `footer-text` 14 gap 10; bottom rule 1px `footer-divider`, padding-top 20, 13 `footer-meta` "© 2026 Fixit"). Phone/tablet: brand full width, link columns in a 2-column grid, links ≥ 44 high. §9 white focus outline on the footer. S29 (`minimal`): only the copyright row. AC1.
**Do:** create `footer.tsx`:
```tsx
import { Link } from 'react-router';
import { useAuth } from '@/lib/auth-store';
import { footerColumns, viewerRole } from '../nav-config';
import { Logo } from './logo';

export function Footer({ variant = 'full' }: { variant?: 'full' | 'minimal' }) {
  const { me } = useAuth();
  return (
    <footer className="mt-auto bg-footer-bg [&_a:focus-visible]:outline-primary-foreground">
      <div className="mx-auto max-w-content px-4 pb-7 pt-14 sm:px-6 lg:px-8">
        {variant === 'full' && (
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
              <Logo inverse />
              <p className="text-label text-footer-text">Home service booking marketplace.</p>
            </div>
            {footerColumns(viewerRole(me)).map((col) => (
              <div key={col.title} className="flex flex-col gap-2.5">
                <h2 className="text-label font-bold text-primary-foreground">{col.title}</h2>
                <ul className="flex flex-col lg:gap-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="flex min-h-11 items-center text-label text-footer-text hover:text-primary-foreground lg:min-h-0">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <p className={variant === 'full' ? 'mt-10 border-t border-footer-divider pt-5 text-meta text-footer-meta' : 'text-meta text-footer-meta'}>
          © 2026 Fixit
        </p>
      </div>
    </footer>
  );
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): footer (M03-T28)"`

---

### T29 — `PublicLayout`, `AuthLayout`, `CustomerLayout` + `CustomerPageHeader`, `PlaceholderScreen`
- [ ] done

**Files:** `src/app/layouts/public-layout.tsx`, `auth-layout.tsx`, `customer-layout.tsx`, `src/app/placeholder-screen.tsx`
**Context:** SPEC L1, L1-auth (main `page` bg, padding 56 16 88; card max 440 r20 padding 32 / 24 phone, 1px `border`; S29 logo-only), L2 (max 1240, padding 32 32 88 / phone 20 16 56, gap 24; header H1 `text-title-lg` + 15 muted subtitle; section tabs as links; detail pages use a back link instead), §6.8 placement, §9 skip link. D-a (PublicLayout accepts children so guards can render S40 inside it).
**Do:**
1. `public-layout.tsx`:
```tsx
import type { ReactNode } from 'react';
import { Outlet } from 'react-router';
import { BannerSlot } from './parts/banner-slot';
import { Footer } from './parts/footer';
import { OfflineBanner } from './parts/offline-banner';
import { PublicNav } from './parts/public-nav';
import { SkipLink } from './parts/skip-link';

/** L1 (and the L1 frame of L2). `children` is used by guards that render S40 outside the route tree (D-a). */
export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <PublicNav />
      <OfflineBanner />
      <BannerSlot banners={[]} placement="strip" />
      <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  );
}
```
2. `auth-layout.tsx`:
```tsx
import { Outlet } from 'react-router';
import { Footer } from './parts/footer';
import { OfflineBanner } from './parts/offline-banner';
import { PublicNav } from './parts/public-nav';
import { SkipLink } from './parts/skip-link';

/** L1-auth; `logoOnly` for S29 (nav links and footer columns hidden). */
export function AuthLayout({ logoOnly = false }: { logoOnly?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <PublicNav variant={logoOnly ? 'logo' : 'full'} />
      <OfflineBanner />
      <main id="main" tabIndex={-1} className="flex-1 bg-page px-4 pb-22 pt-14">
        <div className="mx-auto flex w-full max-w-auth flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <Outlet />
        </div>
      </main>
      <Footer variant={logoOnly ? 'minimal' : 'full'} />
    </div>
  );
}
```
3. `customer-layout.tsx`:
```tsx
import { Outlet } from 'react-router';
import { SegmentedTabLinks } from '@/components/segmented-tabs';
import { customerTabs } from './nav-config';

/** L2 main area (inside PublicLayout). */
export function CustomerLayout() {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 pb-14 pt-5 sm:px-6 sm:pb-22 sm:pt-8 lg:px-8">
      <Outlet />
    </div>
  );
}

/** L2 page header: H1 + subtitle + section tabs (list pages). Detail pages render a BackLink instead of tabs. */
export function CustomerPageHeader({ title, subtitle, tabs = false }: { title: string; subtitle?: string; tabs?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg text-text">{title}</h1>
        {subtitle && <p className="text-body-sm text-text-muted">{subtitle}</p>}
      </div>
      {tabs && <SegmentedTabLinks label="Account sections" items={customerTabs()} />}
    </div>
  );
}
```
4. `src/app/placeholder-screen.tsx`:
```tsx
/** M03 placeholder body: the SPEC title as H1 only (real content arrives in M04–M13). */
export function PlaceholderScreen({ title, frame = 'page' }: { title: string; frame?: 'page' | 'card' | 'bare' }) {
  if (frame === 'card') return <h1 className="text-title-md text-text">{title}</h1>;
  if (frame === 'bare') return <h1 className="text-title-lg text-text">{title}</h1>;
  return (
    <div className="mx-auto w-full max-w-content px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-22">
      <h1 className="text-title-lg text-text">{title}</h1>
    </div>
  );
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): L1, L1-auth and L2 layouts (M03-T29)"`

---

### T30 — `DashboardShell` (ResponsiveSidebar) and `SidebarNav`
- [ ] done

**Files:** `src/app/layouts/parts/sidebar-nav.tsx`, `src/app/layouts/parts/dashboard-shell.tsx`
**Context:** SPEC L3 desktop (grid `256px minmax(0,1fr)`, min-height 100vh, `page` bg; sidebar sticky 100vh, white, 1px right `border`, padding 24 16, gap 28; nav gap 4; items 44 high, padding 0 12, r12, gap 12, icon 22, 15/600; active `primary` on `primary-soft`; inactive `text-muted`, hover bg `page`; count badge min-width 22 h22 `accent`(= `cta`)/`on-accent` 12/800; footer block margin-top auto; main padding 32 40 64, gap 28, max 1240, banner slot at top). ≤1023: top bar sticky 56 white 1px bottom border padding 0 8: `Menu` 44 · logo + badge · spacer · action icon button 44 with count overlay; `Menu` opens a left drawer (width min(320, 85vw), `shadow-modal`) with the same items as 48-high rows; closes on navigation, overlay, Esc; main padding 20 16 56 (tablet 24 24 64), gap 20. ARCH §5.2 `ResponsiveSidebar`. AC3, AC8.
**Do:**
1. `sidebar-nav.tsx`:
```tsx
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import type { SidebarItem } from '../nav-config';

export function SidebarNav({ label, items, dense = true, onNavigate }: { label: string; items: SidebarItem[]; dense?: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-1">
        {items.map(({ to, label: text, icon: Icon, end, count, countLabel, dot }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 text-body-sm font-semibold transition-colors',
                  dense ? 'h-11' : 'h-12',
                  isActive ? 'bg-primary-soft text-primary' : 'text-text-muted hover:bg-page',
                )
              }
            >
              <Icon aria-hidden="true" className="size-[22px] shrink-0" />
              <span className="min-w-0 flex-1 truncate">{text}</span>
              {count !== undefined && (
                <span className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-cta px-1.5 text-caption font-extrabold text-on-cta">
                  <span aria-hidden="true">{count}</span>
                  <span className="sr-only">{countLabel}</span>
                </span>
              )}
              {dot && (
                <span className="size-2 rounded-full bg-warning">
                  <span className="sr-only">Needs attention</span>
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```
2. `dashboard-shell.tsx`:
```tsx
import { useState, type ReactNode } from 'react';
import { Menu, X, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { SidebarItem } from '../nav-config';
import { BannerSlot } from './banner-slot';
import { Logo } from './logo';
import { OfflineBanner } from './offline-banner';
import { SidebarNav } from './sidebar-nav';
import { SkipLink } from './skip-link';

export interface TopBarAction {
  to: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface DashboardShellProps {
  navLabel: 'Dashboard' | 'Admin';
  badge: ReactNode;
  items: SidebarItem[];
  /** Business/admin card, Switch to booking, Log out. Receives a close callback for the drawer. */
  footer: (close: () => void) => ReactNode;
  topBarAction: TopBarAction;
  children: ReactNode;
}

/** ARCH §5.2 ResponsiveSidebar: sidebar ≥1024, top bar + left drawer below (CSS-switched; the drawer mounts only when open). */
export function DashboardShell({ navLabel, badge, items, footer, topBarAction, children }: DashboardShellProps) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };
  const ActionIcon = topBarAction.icon;
  const brand = (
    <div className="flex items-center gap-2">
      <Logo />
      {badge}
    </div>
  );
  return (
    <div className="min-h-dvh bg-page lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <SkipLink />
      <aside className="sticky top-0 hidden h-dvh flex-col gap-7 overflow-y-auto border-r border-border bg-surface px-4 py-6 lg:flex">
        {brand}
        <SidebarNav label={navLabel} items={items} />
        <div className="mt-auto flex flex-col gap-3">{footer(() => undefined)}</div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-topbar items-center gap-1 border-b border-border bg-surface px-2 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="text-text">
                <Menu aria-hidden="true" className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" showCloseButton={false} aria-describedby={undefined} className="w-[85vw] max-w-80 gap-0 overflow-y-auto p-0 sm:max-w-80">
              <div className="flex h-topbar items-center justify-between border-b border-border pl-4 pr-2">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                {brand}
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Close menu">
                    <X aria-hidden="true" className="size-6" />
                  </Button>
                </SheetClose>
              </div>
              <div className="flex flex-1 flex-col gap-7 px-4 py-6">
                <SidebarNav label={navLabel} items={items} dense={false} onNavigate={close} />
                <div className="mt-auto flex flex-col gap-3">{footer(close)}</div>
              </div>
            </SheetContent>
          </Sheet>
          {brand}
          <div className="flex-1" />
          <Link
            to={topBarAction.to}
            aria-label={topBarAction.count ? `${topBarAction.label}, ${String(topBarAction.count)} new` : topBarAction.label}
            className="relative grid size-11 place-items-center rounded-md text-text-muted hover:bg-page"
          >
            <ActionIcon aria-hidden="true" className="size-6" />
            {topBarAction.count !== undefined && topBarAction.count > 0 && (
              <span aria-hidden="true" className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-cta px-1 text-mono font-extrabold text-on-cta">
                {topBarAction.count}
              </span>
            )}
          </Link>
        </header>
        <OfflineBanner />
        <main id="main" tabIndex={-1} className="mx-auto flex w-full min-w-0 max-w-content flex-col gap-5 px-4 pb-14 pt-5 sm:px-6 sm:pb-16 sm:pt-6 lg:gap-7 lg:px-10 lg:pt-8">
          <BannerSlot banners={[]} placement="main" />
          {children}
        </main>
      </div>
    </div>
  );
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): dashboard shell with sidebar, top bar and drawer (M03-T30)"`

---

### T31 — `ProviderLayout` (L3) and `AdminLayout` (L4)
- [ ] done

**Files:** `src/app/layouts/provider-layout.tsx`, `src/app/layouts/admin-layout.tsx`
**Context:** SPEC L3 (Pro badge 22 high, padding 0 8, `warning-soft`/`warning-text` 11/700; business card padding 12, 1px `border`, r14, 40×40 r10 tile, business name 14/700 ellipsis + owner 12 subtle; **Switch to booking** `ArrowLeftRight` 20, 14/600 muted → `/`; **Log out** `LogOut` 14/600 muted hover `danger-text`; top-bar action Requests with the count), L4 (Admin badge `footer-bg` + white 11/700; admin card: initials avatar, name 14/700, "Super admin" 12 subtle; Log out; no Switch to booking; top-bar action Verification). D-d, D-e. AC3.
**Do:**
1. `provider-layout.tsx`:
```tsx
import { ArrowLeftRight, BriefcaseBusiness, Inbox, LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { useLogout } from '@/features/auth/hooks';
import { useAuth } from '@/lib/auth-store';
import { providerSidebarItems } from './nav-config';
import { DashboardShell } from './parts/dashboard-shell';

export const footerLink = 'flex min-h-11 items-center gap-3 rounded-md px-3 text-label font-semibold text-text-muted transition-colors';

export function ProviderLayout() {
  const { me } = useAuth();
  const logout = useLogout();
  if (!me?.provider) return null; // RequireProvider guarantees both
  const p = me.provider;
  return (
    <DashboardShell
      navLabel="Dashboard"
      badge={<span className="inline-flex h-[22px] items-center rounded-full bg-warning-soft px-2 text-mono font-bold text-warning-text">Pro</span>}
      items={providerSidebarItems(me)}
      topBarAction={{ to: '/dashboard/requests', label: 'Requests', icon: Inbox, count: p.pendingRequestCount }}
      footer={(close) => (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-sm bg-primary-soft text-primary">
              <BriefcaseBusiness className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-label font-bold text-text">{p.businessName ?? 'Your business'}</p>
              <p className="truncate text-caption font-normal text-text-subtle">{me.fullName}</p>
            </div>
          </div>
          <Link to="/" onClick={close} className={`${footerLink} hover:text-text`}>
            <ArrowLeftRight aria-hidden="true" className="size-5" />
            Switch to booking
          </Link>
          <button
            type="button"
            onClick={() => {
              close();
              void logout();
            }}
            className={`${footerLink} text-left hover:text-danger-text`}
          >
            <LogOut aria-hidden="true" className="size-5" />
            Log out
          </button>
        </>
      )}
    >
      <Outlet />
    </DashboardShell>
  );
}
```
2. `admin-layout.tsx`:
```tsx
import { LogOut, ShieldCheck } from 'lucide-react';
import { Outlet } from 'react-router';
import { useLogout } from '@/features/auth/hooks';
import { useAuth } from '@/lib/auth-store';
import { initialsOf } from '@/lib/format';
import { adminSidebarItems } from './nav-config';
import { DashboardShell } from './parts/dashboard-shell';
import { footerLink } from './provider-layout';

export function AdminLayout() {
  const { me } = useAuth();
  const logout = useLogout();
  if (!me) return null; // RequireAdmin guarantees it
  return (
    <DashboardShell
      navLabel="Admin"
      badge={<span className="inline-flex h-[22px] items-center rounded-full bg-footer-bg px-2 text-mono font-bold text-primary-foreground">Admin</span>}
      items={adminSidebarItems()}
      topBarAction={{ to: '/admin/verifications', label: 'Verification', icon: ShieldCheck }}
      footer={(close) => (
        <>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-label font-extrabold text-primary">
              {initialsOf(me.fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-label font-bold text-text">{me.fullName}</p>
              <p className="text-caption font-normal text-text-subtle">Super admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              close();
              void logout();
            }}
            className={`${footerLink} text-left hover:text-danger-text`}
          >
            <LogOut aria-hidden="true" className="size-5" />
            Log out
          </button>
        </>
      )}
    >
      <Outlet />
    </DashboardShell>
  );
}
```
(`text-caption` has weight 700 by token; `font-normal` makes the owner/role line 12/400 as in the prototype.)
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): L3 provider and L4 admin layouts (M03-T31)"`

---

### T32 — System pages S39, S40, S41 and `RouteErrorBoundary`
- [ ] done

**Files:** `src/app/errors/not-found-page.tsx`, `forbidden-page.tsx`, `error-page.tsx`, `route-error-boundary.tsx`
**Context:** SPEC §5.E (empty-state pattern centred, padding 88 16; S39 generic/provider/request copy and buttons per area; S40 `Lock` + email + `Go to home` · `Log out`; S41 `TriangleAlert` warning tile, contact email, 12 mono subtle `Error ID: {id}`, `Try again` (reloads) · `Go to home`), §6.4. ARCH §5.6 (ApiError 404 → S39 variant by route, 403 → S40, else S41 with `requestId` or a client id). D-i. AC5, AC6.
**Do:**
1. `not-found-page.tsx`:
```tsx
import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/empty-state';

export type Area = 'public' | 'provider' | 'admin';
export type NotFoundVariant = 'generic' | 'provider' | 'request';

const HOME: Record<Area, { label: string; to: string }> = {
  public: { label: 'Go to home', to: '/' },
  provider: { label: 'Go to dashboard', to: '/dashboard' },
  admin: { label: 'Go to overview', to: '/admin' },
};

export function areaOf(pathname: string): Area {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'provider';
  if (pathname === '/admin' || (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login'))) return 'admin';
  return 'public';
}

export function SystemFrame({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-content px-4 py-22">{children}</div>;
}

/** S39. */
export function NotFoundPage({ area = 'public', variant = 'generic' }: { area?: Area; variant?: NotFoundVariant }) {
  if (variant === 'provider') {
    return (
      <SystemFrame>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
          <h1 className="sr-only">Provider not found</h1>
          <p className="text-body-sm text-text-muted">This provider couldn&apos;t be found.</p>
          <Link to="/discover" className="inline-flex min-h-11 items-center text-label font-bold text-primary hover:text-primary-hover">
            Browse all providers
          </Link>
        </div>
      </SystemFrame>
    );
  }
  if (variant === 'request') {
    const back = area === 'provider' ? { label: 'Go to requests', to: '/dashboard/requests' } : { label: 'Go to my requests', to: '/requests' };
    return (
      <SystemFrame>
        <EmptyState icon={SearchX} titleAs="h1" title="We can't find that request" body="Check the reference, or find it in your list." action={back} />
      </SystemFrame>
    );
  }
  return (
    <SystemFrame>
      <EmptyState
        icon={SearchX}
        titleAs="h1"
        title="We can't find that page"
        body="The link may be broken, or the page may have been removed."
        action={HOME[area]}
      />
    </SystemFrame>
  );
}
```
2. `forbidden-page.tsx`:
```tsx
import { Lock } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { useLogout } from '@/features/auth/hooks';
import { useAuth } from '@/lib/auth-store';
import { SystemFrame } from './not-found-page';

/** S40. */
export function ForbiddenPage() {
  const { me } = useAuth();
  const logout = useLogout();
  return (
    <SystemFrame>
      <EmptyState
        icon={Lock}
        titleAs="h1"
        title="You don't have access to this page"
        body={`You're signed in as ${me?.email ?? 'another account'}. Log out and sign in with a different account if you need to.`}
        action={{ label: 'Go to home', to: '/' }}
        secondaryAction={{ label: 'Log out', onClick: () => void logout() }}
      />
    </SystemFrame>
  );
}
```
3. `error-page.tsx`:
```tsx
import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { CONTACT_EMAIL } from '@/lib/env';
import { SystemFrame } from './not-found-page';

/** S41. `errorId` = server requestId when known, else a short client id. */
export function ErrorPage({ errorId }: { errorId?: string }) {
  const [fallbackId] = useState(() => crypto.randomUUID().slice(0, 8));
  return (
    <SystemFrame>
      <EmptyState
        icon={TriangleAlert}
        tone="warning"
        titleAs="h1"
        title="Something went wrong"
        body={`Please try again. If it keeps happening, email us at ${CONTACT_EMAIL}.`}
        action={{ label: 'Try again', onClick: () => window.location.reload() }}
        secondaryAction={{ label: 'Go to home', to: '/' }}
      >
        <p className="font-mono text-caption font-normal text-text-subtle">{`Error ID: ${errorId ?? fallbackId}`}</p>
      </EmptyState>
    </SystemFrame>
  );
}
```
4. `route-error-boundary.tsx`:
```tsx
import { useEffect } from 'react';
import { isRouteErrorResponse, useLocation, useRouteError } from 'react-router';
import { ApiError } from '@/lib/http';
import { ErrorPage } from './error-page';
import { ForbiddenPage } from './forbidden-page';
import { areaOf, NotFoundPage, type NotFoundVariant } from './not-found-page';

function notFoundVariant(pathname: string): NotFoundVariant {
  if (/^\/providers\/[^/]+$/.test(pathname)) return 'provider';
  if (/^\/(dashboard\/)?requests\/[^/]+/.test(pathname)) return 'request';
  return 'generic';
}

/** ARCH §5.6: errorElement inside each layout (so the layout stays). */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const { pathname } = useLocation();
  useEffect(() => {
    console.error(error);
  }, [error]);
  const status = error instanceof ApiError ? error.status : isRouteErrorResponse(error) ? error.status : null;
  if (status === 404) return <NotFoundPage area={areaOf(pathname)} variant={notFoundVariant(pathname)} />;
  if (status === 403) return <ForbiddenPage />;
  return <ErrorPage errorId={error instanceof ApiError ? error.envelope?.requestId : undefined} />;
}
```
**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): S39, S40, S41 and route error boundary (M03-T32)"`

---

### T33 — Route guards
- [ ] done

**Files:** `src/app/guards/guards.tsx`
**Context:** ARCH §5.1 guard semantics; SPEC §8.4 (guest → `/login?next={path}`; guest `/admin*` → `/admin/login?next=…`; signed-in on `/login`/`/signup` → `/` (providers → `/dashboard`); customer (not provider) on `/dashboard*` → `/become-a-provider/{resume step}` (1 if not started); non-admin on `/admin*` → S40; admin on L2/L3 → S40), §6.4. D-a, D-c. Guards are UX only.
**Do:** create `guards.tsx`:
```tsx
import type { ReactNode } from 'react';
import type { Me } from '@fixit/contracts';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/lib/auth-store';
import { ForbiddenPage } from '../errors/forbidden-page';
import { PublicLayout } from '../layouts/public-layout';

/** `/login?next=%2Frequests` — same-site path + query only. */
export function loginUrl(base: '/login' | '/admin/login', pathname: string, search: string): string {
  return `${base}?${new URLSearchParams({ next: pathname + search }).toString()}`;
}

const isAdmin = (me: Me | null) => me?.roles.includes('admin') ?? false;
const isProvider = (me: Me | null) => me?.roles.includes('provider') ?? false;

/** Signed-in → `/` (providers → `/dashboard`; `area="admin"`: admins → `/admin`). */
export function RequireGuest({ area = 'public', children }: { area?: 'public' | 'admin'; children?: ReactNode }) {
  const { status, me } = useAuth();
  if (status === 'booting') return null;
  if (status === 'signed-in') {
    const to = area === 'admin' && isAdmin(me) ? '/admin' : isProvider(me) ? '/dashboard' : '/';
    return <Navigate to={to} replace />;
  }
  return children ?? <Outlet />;
}

/** Guest → `/login?next=…`. While a logout is navigating away (D-c) render nothing. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { status, signOutReason } = useAuth();
  const { pathname, search } = useLocation();
  if (status === 'booting') return null;
  if (status === 'guest') {
    if (signOutReason === 'logout') return null;
    return <Navigate to={loginUrl('/login', pathname, search)} replace />;
  }
  return children ?? <Outlet />;
}

/** `role="user"` = customer or provider (ARCH endpoint access 'user'). Wrong role → S40 (`forbidden` overrides where it renders). */
export function RequireRole({ role, forbidden, children }: { role: 'user'; forbidden?: ReactNode; children?: ReactNode }) {
  const { me } = useAuth();
  const ok = role === 'user' && (me?.roles.includes('customer') ?? false);
  if (!ok) return forbidden ?? <ForbiddenPage />;
  return children ?? <Outlet />;
}

/** No published listing → `/become-a-provider/{step}` (1 if never started). */
export function RequireProvider({ children }: { children?: ReactNode }) {
  const { me } = useAuth();
  if (!isProvider(me)) return <Navigate to={`/become-a-provider/${String(me?.provider?.onboarding.step ?? 1)}`} replace />;
  return children ?? <Outlet />;
}

/** Onboarding routes: a published provider goes to `/dashboard`. */
export function RedirectPublishedProvider({ children }: { children?: ReactNode }) {
  const { me } = useAuth();
  if (isProvider(me)) return <Navigate to="/dashboard" replace />;
  return children ?? <Outlet />;
}

/** Guest → `/admin/login?next=…`; non-admin → S40 inside L1 (D-a). */
export function RequireAdmin({ children }: { children?: ReactNode }) {
  const { status, me, signOutReason } = useAuth();
  const { pathname, search } = useLocation();
  if (status === 'booting') return null;
  if (status === 'guest') {
    if (signOutReason === 'logout') return null;
    return <Navigate to={loginUrl('/admin/login', pathname, search)} replace />;
  }
  if (!isAdmin(me)) {
    return (
      <PublicLayout>
        <ForbiddenPage />
      </PublicLayout>
    );
  }
  return children ?? <Outlet />;
}
```
**Verify:** `pnpm verify` is green. (Behaviour is tested in T36.)
**Commit:** `git add -A apps/web && git commit -m "feat(web): route guards (M03-T33)"`

---

### T34 — Placeholder pages per lazy chunk
- [ ] done

**Files:** `src/app/chunks/{home,public,auth,customer,onboarding,provider,admin}.tsx`
**Context:** Milestone "Out of scope": pages render an H1 with the SPEC title only. SPEC §4.1 screen names. ARCH §5.1 chunks. D-h. L2 pages use `CustomerPageHeader` (list pages with tabs) or `BackLink` + H1 (detail pages).
**Do:** create each file exactly as below. Every export is a named function component.
1. `home.tsx` (entry chunk, imported statically):
```tsx
import { PlaceholderScreen } from '../placeholder-screen';
export function HomePage() {
  return <PlaceholderScreen title="Home" />;
}
```
2. `public.tsx`: `DiscoverPage` → `Discover`; `ProviderProfilePage` → `Provider profile`; `ForProvidersPage` → `For providers`; `AboutPage` → `About`; `ContactPage` → `Contact`; `PrivacyPage` → `Privacy`. Each: `return <PlaceholderScreen title="…" />;`
3. `auth.tsx` (all `frame="card"`): `LoginPage` → `Log in`; `SignupPage` → `Sign up`; `CheckEmailPage` → `Check your email`; `ConfirmEmailPage` → `Confirm email`; `GoogleDonePage` → `Signing you in`; `ForgotPasswordPage` → `Forgot password`; `ResetPasswordPage` → `Reset password`; `AdminLoginPage` → `Admin sign-in`.
4. `customer.tsx`:
```tsx
import { BackLink } from '@/components/back-link';
import { CustomerPageHeader } from '../layouts/customer-layout';
import { PlaceholderScreen } from '../placeholder-screen';

export function RequestFormPage() {
  return <PlaceholderScreen title="Request form" />;
}
export function RequestSentPage() {
  return <PlaceholderScreen title="Request sent" />;
}
export function MyRequestsPage() {
  return <CustomerPageHeader title="My requests" tabs />;
}
export function SavedPage() {
  return <CustomerPageHeader title="Saved providers" tabs />;
}
export function AccountPage() {
  return <CustomerPageHeader title="Account settings" tabs />;
}
export function CustomerRequestPage() {
  return (
    <>
      <BackLink to="/requests">Back to my requests</BackLink>
      <PlaceholderScreen frame="bare" title="Request detail" />
    </>
  );
}
export function LeaveReviewPage() {
  return (
    <>
      <BackLink to="..">Back to request</BackLink>
      <PlaceholderScreen frame="bare" title="Leave a review" />
    </>
  );
}
```
(`to=".."` is relative to the `requests/:ref/review` route → `/requests/:ref`. If React Router resolves it to `/requests`, use `useParams()` and build `/requests/${ref}`.)
5. `onboarding.tsx`: `BecomeProviderPage` → `Become a provider`; `OnboardingDonePage` → `Your listing is live`. Default frame.
6. `provider.tsx` (all `frame="bare"`, the shell provides padding): `ProviderOverviewPage` → `Provider overview`; `ProviderRequestsPage` → `Requests`; `ProviderRequestPage` → `Request detail`; `ServicesPage` → `My Services`; `BusinessProfilePage` → `Business profile`; `ServiceAreasPage` → `Service areas`; `VerificationPage` → `Verification`; `ProviderReviewsPage` → `Reviews`; `ProviderSettingsPage` → `Settings`.
7. `admin.tsx` (all `frame="bare"`): `AdminOverviewPage` → `Overview`; `VerificationQueuePage` → `Verification`; `VerificationReviewPage` → `Verification review`; `UsersPage` → `Users`; `UserDetailPage` → `User detail`; `AdminRequestsPage` → `All requests`; `AdminRequestPage` → `Request detail`; `ReviewsModerationPage` → `Reviews`; `CatalogPage` → `Categories & towns`.

**Verify:** `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "feat(web): placeholder pages per route chunk (M03-T34)"`

---

### T35 — Route table, router, root layout, boot wiring, test render helper
- [ ] done

**Files:** `src/app/routes.tsx`, `src/app/router.tsx`, `src/app/layouts/root-layout.tsx`, `src/main.tsx`, `src/mocks/dev/DevPanel.tsx`, `src/test/render.tsx`, delete `src/app/placeholder-page.tsx`, `src/app/chunks/dev.tsx` (stub)
**Context:** ARCH §5.1 route map (guards, layouts, chunks; Should/Could routes gated by `lib/features.ts`), §5.6 (route `errorElement`), §4.4 boot order (`enableMocks` → `bootstrapAuth` → render). SPEC §5.E (S39/S41 by area). D-a, D-b, D-c, D-h. ARCH §9.4 (`render.tsx` with a memory router).
**Do:**
1. Create `src/app/chunks/dev.tsx` (filled in T37):
```tsx
import { PlaceholderScreen } from '../placeholder-screen';
export function DevUiPage() {
  return <PlaceholderScreen title="UI kit" />;
}
/** AC6: a route that throws while rendering. */
export function DevThrowPage(): never {
  throw new Error('Dev route error (M03 AC6)');
}
```
2. Create `src/app/layouts/root-layout.tsx`:
```tsx
import { lazy, Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';

// Dev only: the branch is removed from production builds, so the DevPanel chunk never ships.
const DevPanel = import.meta.env.DEV
  ? lazy(() => import('@/mocks/dev/DevPanel').then((m) => ({ default: m.DevPanel })))
  : null;

/** Inside the router so the DevPanel can use router hooks (useLogout). */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
      {DevPanel && (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      )}
    </>
  );
}
```
3. Create `src/app/routes.tsx`:
```tsx
import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import { features } from '@/lib/features';
import { HomePage } from './chunks/home';
import { ErrorPage } from './errors/error-page';
import { ForbiddenPage } from './errors/forbidden-page';
import { NotFoundPage } from './errors/not-found-page';
import { RouteErrorBoundary } from './errors/route-error-boundary';
import { RedirectPublishedProvider, RequireAdmin, RequireAuth, RequireGuest, RequireProvider, RequireRole } from './guards/guards';
import { AdminLayout } from './layouts/admin-layout';
import { AuthLayout } from './layouts/auth-layout';
import { CustomerLayout } from './layouts/customer-layout';
import { ProviderLayout } from './layouts/provider-layout';
import { PublicLayout } from './layouts/public-layout';
import { RootLayout } from './layouts/root-layout';

type Lazy = () => Promise<{ Component: ComponentType }>;
const page =
  <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K): Lazy =>
  async () => ({ Component: (await load())[name] });

// One import() per area = one chunk per area (ARCH §5.1).
const pub = () => import('./chunks/public');
const auth = () => import('./chunks/auth');
const customer = () => import('./chunks/customer');
const onboarding = () => import('./chunks/onboarding');
const provider = () => import('./chunks/provider');
const admin = () => import('./chunks/admin');
const dev = () => import('./chunks/dev');

const when = (on: boolean, r: RouteObject): RouteObject[] => (on ? [r] : []);
/** errorElement on a pathless child keeps the layout around S41/S39 (SPEC §5.E). */
const withBoundary = (children: RouteObject[]): RouteObject[] => [{ errorElement: <RouteErrorBoundary />, children }];

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />, // a layout itself failed
    children: [
      /* ---------- L1 public (+ L2 customer area) ---------- */
      {
        element: <PublicLayout />,
        children: withBoundary([
          { index: true, element: <HomePage /> },
          { path: 'discover', lazy: page(pub, 'DiscoverPage') },
          { path: 'providers/:id', lazy: page(pub, 'ProviderProfilePage') },
          { path: 'for-providers', lazy: page(pub, 'ForProvidersPage') },
          { path: 'about', lazy: page(pub, 'AboutPage') },
          { path: 'contact', lazy: page(pub, 'ContactPage') },
          { path: 'privacy', lazy: page(pub, 'PrivacyPage') },
          {
            element: (
              <RequireAuth>
                <RequireRole role="user" />
              </RequireAuth>
            ),
            children: [
              { path: 'providers/:id/request', lazy: page(customer, 'RequestFormPage') },
              { path: 'requests/:ref/sent', lazy: page(customer, 'RequestSentPage') },
              {
                element: <CustomerLayout />,
                children: [
                  { path: 'requests', lazy: page(customer, 'MyRequestsPage') },
                  { path: 'requests/:ref', lazy: page(customer, 'CustomerRequestPage') },
                  { path: 'requests/:ref/review', lazy: page(customer, 'LeaveReviewPage') },
                  ...when(features.savedProviders, { path: 'saved', lazy: page(customer, 'SavedPage') }),
                  { path: 'account', lazy: page(customer, 'AccountPage') },
                ],
              },
              {
                path: 'become-a-provider',
                element: <RedirectPublishedProvider />,
                children: [
                  { path: 'done', lazy: page(onboarding, 'OnboardingDonePage') },
                  { path: ':step', lazy: page(onboarding, 'BecomeProviderPage') },
                ],
              },
            ],
          },
          ...(import.meta.env.DEV
            ? [
                { path: 'dev/ui', lazy: page(dev, 'DevUiPage') },
                { path: 'dev/throw', lazy: page(dev, 'DevThrowPage') },
              ]
            : []),
          { path: '*', element: <NotFoundPage area="public" /> },
        ]),
      },
      /* ---------- L1-auth ---------- */
      {
        element: <AuthLayout />,
        children: withBoundary([
          {
            element: <RequireGuest />,
            children: [
              { path: 'login', lazy: page(auth, 'LoginPage') },
              { path: 'signup', lazy: page(auth, 'SignupPage') },
              { path: 'forgot-password', lazy: page(auth, 'ForgotPasswordPage') },
            ],
          },
          { path: 'signup/check-email', lazy: page(auth, 'CheckEmailPage') },
          { path: 'auth/confirm', lazy: page(auth, 'ConfirmEmailPage') },
          { path: 'auth/google/done', lazy: page(auth, 'GoogleDonePage') },
          { path: 'reset-password', lazy: page(auth, 'ResetPasswordPage') },
        ]),
      },
      {
        path: 'admin/login',
        element: <AuthLayout logoOnly />,
        children: withBoundary([{ element: <RequireGuest area="admin" />, children: [{ index: true, lazy: page(auth, 'AdminLoginPage') }] }]),
      },
      /* ---------- L3 provider ---------- */
      {
        path: 'dashboard',
        element: (
          <RequireAuth>
            <RequireRole
              role="user"
              forbidden={
                <PublicLayout>
                  <ForbiddenPage />
                </PublicLayout>
              }
            >
              <RequireProvider>
                <ProviderLayout />
              </RequireProvider>
            </RequireRole>
          </RequireAuth>
        ),
        children: withBoundary([
          { index: true, lazy: page(provider, 'ProviderOverviewPage') },
          { path: 'requests', lazy: page(provider, 'ProviderRequestsPage') },
          { path: 'requests/:ref', lazy: page(provider, 'ProviderRequestPage') },
          { path: 'services', lazy: page(provider, 'ServicesPage') },
          { path: 'profile', lazy: page(provider, 'BusinessProfilePage') },
          { path: 'areas', lazy: page(provider, 'ServiceAreasPage') },
          { path: 'verification', lazy: page(provider, 'VerificationPage') },
          ...when(features.providerReviews || features.replies, { path: 'reviews', lazy: page(provider, 'ProviderReviewsPage') }),
          ...when(features.pause, { path: 'settings', lazy: page(provider, 'ProviderSettingsPage') }), // D-b
          { path: '*', element: <NotFoundPage area="provider" /> },
        ]),
      },
      /* ---------- L4 admin ---------- */
      {
        path: 'admin',
        element: (
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        ),
        children: withBoundary([
          { index: true, lazy: page(admin, 'AdminOverviewPage') },
          { path: 'verifications', lazy: page(admin, 'VerificationQueuePage') },
          { path: 'verifications/:id', lazy: page(admin, 'VerificationReviewPage') },
          { path: 'users', lazy: page(admin, 'UsersPage') },
          { path: 'users/:id', lazy: page(admin, 'UserDetailPage') },
          ...when(features.adminRequests, { path: 'requests', lazy: page(admin, 'AdminRequestsPage') }),
          ...when(features.adminRequests, { path: 'requests/:ref', lazy: page(admin, 'AdminRequestPage') }),
          { path: 'reviews', lazy: page(admin, 'ReviewsModerationPage') },
          ...when(features.adminCatalog, { path: 'catalog', lazy: page(admin, 'CatalogPage') }),
          { path: '*', element: <NotFoundPage area="admin" /> },
        ]),
      },
    ],
  },
];
```
If TypeScript rejects `page(pub, 'DiscoverPage')` (module namespace not assignable to `Record<K, ComponentType>`), change `page` to `(load: () => Promise<Record<string, unknown>>, name: string)` and return `{ Component: mod[name] as ComponentType }` **only after** checking `typeof mod[name] === 'function'` (throw `Error(\`missing page ${name}\`)` otherwise). Don't use `any`.
4. Create `src/app/router.tsx`:
```tsx
import { createBrowserRouter } from 'react-router';
import { routes } from './routes';

export const router = createBrowserRouter(routes);
```
5. Replace `src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import '@/styles/globals.css';
import { AppProviders } from '@/app/providers';
import { router } from '@/app/router';
import { bootstrapAuth } from '@/lib/bootstrap-auth';
import { enableMocks } from '@/mocks/enable';

async function boot(rootEl: HTMLElement): Promise<void> {
  await enableMocks();
  await bootstrapAuth();
  createRoot(rootEl).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
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
6. `git rm src/app/placeholder-page.tsx`.
7. `DevPanel.tsx`: in `SessionSection`, add `const doLogout = useLogout();` (import from `@/features/auth/hooks`) and change `run('logout', logout)` to `run('logout', doLogout)`. Remove `logout` from the `@/features/auth/api` import.
8. `src/test/render.tsx`: add at the end (with the imports `createMemoryRouter, RouterProvider` from `react-router` and `routes` from `@/app/routes`):
```tsx
/** Renders the real route table at `path` (guards, layouts, lazy pages). ARCH §9.4. */
export function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  const location = () => `${router.state.location.pathname}${router.state.location.search}`;
  return { router, queryClient, location, ...utils };
}
```
Also remove the comment `/** Router wrapper arrives in M03. */`.

**Verify:** `pnpm verify` is green. Then `pnpm dev:mock`, open `http://localhost:5173/` (H1 `Home` inside L1), `/discover`, `/login`, `/nope` (S39). Stop the server.
**Commit:** `git add -A apps/web && git commit -m "feat(web): route table with guards, layouts and lazy chunks (M03-T35)"`

---

### T36 — Routing tests: redirect matrix, 404s, error page, logout (AC4, AC5, AC6)
- [ ] done

**Files:** `src/app/routes.test.tsx`
**Context:** Milestone AC4 (verbatim matrix), AC5, AC6, SPEC §8.1 A4, §8.4. `signInAs` (`src/test/sign-in.ts`) personas: `customer` (Olivia), `provider` (Marcus), `providerDraft` (Kasun, step 3), `admin`.
**Do / Test:** create `src/app/routes.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

const guest = () => {
  authStore.setGuest();
};

describe('guards (SPEC §8.4, AC4)', () => {
  it.each([
    ['guest', '/requests', '/login?next=%2Frequests'],
    ['guest', '/admin', '/admin/login?next=%2Fadmin'],
    ['providerDraft', '/dashboard', '/become-a-provider/3'],
    ['customer', '/dashboard', '/become-a-provider/1'],
    ['customer', '/login', '/'],
    ['provider', '/login', '/dashboard'],
    ['admin', '/admin/login', '/admin'],
    ['provider', '/become-a-provider/1', '/dashboard'],
  ] as const)('%s on %s → %s', async (who, from, to) => {
    if (who === 'guest') guest();
    else signInAs(who);
    const r = renderRoute(from);
    await waitFor(() => {
      expect(r.location()).toBe(to);
    });
  });

  it('Olivia on /admin sees S40 with her email', async () => {
    signInAs('customer');
    renderRoute('/admin');
    expect(await screen.findByRole('heading', { level: 1, name: "You don't have access to this page" })).toBeTruthy();
    expect(screen.getByText(/You're signed in as olivia@fixit\.test\./)).toBeTruthy();
  });

  it.each(['/requests', '/dashboard'])('Admin on %s sees S40', async (path) => {
    signInAs('admin');
    const r = renderRoute(path);
    expect(await screen.findByRole('heading', { level: 1, name: "You don't have access to this page" })).toBeTruthy();
    expect(r.location()).toBe(path);
  });

  it('Marcus reaches /dashboard inside L3', async () => {
    signInAs('provider');
    renderRoute('/dashboard');
    expect(await screen.findByRole('heading', { level: 1, name: 'Provider overview' })).toBeTruthy();
    expect(screen.getAllByRole('navigation', { name: 'Dashboard' }).length).toBeGreaterThan(0);
  });
});

describe('S39 by area (AC5)', () => {
  it('/nope → S39 inside L1 with Go to home', async () => {
    guest();
    renderRoute('/nope');
    expect(await screen.findByRole('heading', { level: 1, name: "We can't find that page" })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to home' }).getAttribute('href')).toBe('/');
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0);
  });
  it('/dashboard/nope → S39 inside L3 with Go to dashboard', async () => {
    signInAs('provider');
    renderRoute('/dashboard/nope');
    expect(await screen.findByRole('link', { name: 'Go to dashboard' })).toBeTruthy();
    expect(screen.getAllByRole('navigation', { name: 'Dashboard' }).length).toBeGreaterThan(0);
  });
  it('/admin/nope → S39 inside L4 with Go to overview', async () => {
    signInAs('admin');
    renderRoute('/admin/nope');
    expect(await screen.findByRole('link', { name: 'Go to overview' })).toBeTruthy();
    expect(screen.getAllByRole('navigation', { name: 'Admin' }).length).toBeGreaterThan(0);
  });
  it('flagged routes are not registered: /dashboard/settings → S39', async () => {
    signInAs('provider');
    renderRoute('/dashboard/settings');
    expect(await screen.findByRole('link', { name: 'Go to dashboard' })).toBeTruthy();
  });
});

describe('S41 (AC6)', () => {
  it('a route that throws renders S41 with an Error ID inside L1', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    guest();
    renderRoute('/dev/throw');
    expect(await screen.findByRole('heading', { level: 1, name: 'Something went wrong' })).toBeTruthy();
    expect(screen.getByText(/^Error ID: \S+$/)).toBeTruthy();
    expect(screen.getByText(/hello@fixit\.test/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0);
    spy.mockRestore();
  });
});

describe('logout (A4)', () => {
  it('customer: S40 Log out → / and session cleared', async () => {
    signInAs('customer');
    const r = renderRoute('/admin');
    await userEvent.click(await screen.findByRole('button', { name: 'Log out' }));
    await waitFor(() => {
      expect(r.location()).toBe('/');
    });
    expect(authStore.getState()).toMatchObject({ status: 'guest', signOutReason: null });
  });
  it('admin: Log out → /admin/login', async () => {
    signInAs('admin');
    const r = renderRoute('/admin');
    await screen.findByRole('heading', { level: 1, name: 'Overview' });
    const buttons = screen.getAllByRole('button', { name: 'Log out' });
    await userEvent.click(buttons[0] as HTMLElement);
    await waitFor(() => {
      expect(r.location()).toBe('/admin/login');
    });
  });
});
```
If a test fails because of a real bug in T23–T35 code, fix that code in this task and note it in the commit body. If it fails because the expectation contradicts the milestone, **STOP** (blocker).
**Verify:** `pnpm --filter @fixit/web test -- routes` passes; `pnpm verify` is green.
**Commit:** `git add -A apps/web && git commit -m "test(web): guard redirect matrix, 404 by area, error page and logout (M03-T36)"`

---

### T37 — Dev demo page `/dev/ui` (AC7)
- [ ] done

**Files:** `src/app/chunks/dev.tsx`
**Context:** Milestone AC7 (DataList table/cards, ResponsiveDialog dialog/sheet, toast 4 s / 8 s pausing on hover/focus). Dev-only route registered in T35 (`import.meta.env.DEV`). Shows every shared component once so later milestones and the human checkpoint can see them.
**Do:** replace `DevUiPage` in `src/app/chunks/dev.tsx` (keep `DevThrowPage`). Wrap the page in `<div className="mx-auto flex w-full max-w-content flex-col gap-10 px-4 pb-22 pt-8 sm:px-6 lg:px-8">` with H1 `UI kit` (`text-title-lg`) and one `<section className="flex flex-col gap-4">` per item below, each with an H2 (`text-title-md`):
1. **DataList**: 5 rows typed `{ ref: string; name: string; service: string; date: string; status: RequestStatus }` (FX-2061 Olivia Martinez · Leak repair · '2026-11-23' · pending; FX-2059 James Carter · Water heater install · '2026-11-26' · pending; FX-2054 Ethan Brooks · Fixture replacement · '2026-11-22' · accepted; FX-2046 Olivia Martinez · Leak repair · '2026-11-15' · completed; FX-2037 Marcus Lee · Water heater install · '2026-11-08' · declined). Columns: Customer (`title`, name + `<span className="block font-mono text-mono text-text-subtle">{ref}</span>`), Service (`meta`), Date (`meta`, `formatDateShort(date)`), Status (`status`, `<StatusPill kind="request" status={…} compact />`), Actions (`actions`, `<Button variant="secondary" size="sm" onClick={() => notify(\`Opened ${ref}\`)}>View</Button>`). `rowHref={(r) => \`/dev/ui#${r.ref}\`}`. Wrap in a card `overflow-hidden rounded-2xl border border-border bg-surface sm:p-0`. Add a `Toggle loading` secondary button that switches `loading` on the DataList.
2. **ResponsiveDialog**: trigger `<Button>Open dialog</Button>`; title `Decline Olivia's request?`; description `Olivia will be emailed that you can't take this job.`; footer `<Button variant="secondary" onClick={close}>Cancel</Button><Button variant="danger" onClick={() => { close(); notify("Declined Olivia's request"); }}>Decline</Button>`. A second centred example with `icon` = 56×56 `bg-primary-soft text-primary rounded-xl` tile containing `Info`, `align="center"`, single `OK` button.
3. **Toasts**: buttons `Toast (4 s)` → `notify('Saved Bell & Sons Plumbing.')`; `Toast with Undo (8 s)` → `notify('Removed Bell & Sons Plumbing from saved.', { label: 'Undo', onClick: () => notify('Saved Bell & Sons Plumbing.') })`; `Error toast` → `notifyError("Couldn't save. Try again.", () => notify('Saved Bell & Sons Plumbing.'))`.
4. **Status pills**: every `RequestStatus` (normal and `compact`), verification ×4, account ×2, review hidden, availability, trust false/true.
5. **Stars / PriceLabel / VerifiedBadge**: `<Stars rating={4.9} count={212} />`, `<Stars rating={null} count={0} />`, `<PriceLabel amount={2500} unit="per_hour" />`, `<PriceLabel amount={2500} unit="per_hour" variant="short" />`, `<PriceLabel amount={4500} unit="fixed" variant="short" />`, `<VerifiedBadge />`, `<VerifiedBadge size="sm" />`.
6. **Notice banners**: warning with action `{ label: 'Get verified', to: '/dashboard/verification' }` and copy `Your listing shows as "Not yet verified". Upload your ID to get the Verified badge.`; info dismissible (`We're checking your documents. We'll email you when it's done.`); danger with action `Fix and resubmit` (`Your verification wasn't approved: Photo is blurry`).
7. **Empty / error**: `<EmptyState icon={Inbox} title="No requests yet" body="When customers send you requests, they'll show up here." />`, `<SectionError onRetry={() => notify('Retrying…')} />`.
8. **Skeletons**: `LoadingRegion` with a `Reload` button that sets `loading` true for 2 s (`setTimeout`), skeleton = `SkeletonSectionCard`; also render one of each skeleton statically in a 2-column grid (`grid gap-4 sm:grid-cols-2`).
9. **Pagination / tabs / back link**: `<Pagination page={2} totalPages={8} hrefFor={(p) => \`/dev/ui?page=${p}\`} />`; `<SegmentedTabs label="Status" value={tab} onValueChange={setTab} items={[{ value: 'all', label: 'All', count: 8 }, { value: 'pending', label: 'Pending', count: 3 }, { value: 'accepted', label: 'Accepted', count: 2 }]} />`; `<SegmentedTabLinks label="Account sections" items={customerTabs()} />`; `<BackLink to="/">Back to results</BackLink>`.
10. **Form field**: `<FormField label="Mobile number" required help="Saved to your account." error="Enter a Sri Lankan mobile number, like 077 123 4567.">{(c) => <PhoneInput {...c} />}</FormField>` and `<FormField label="Notes" optional>{(c) => <Textarea {...c} />}</FormField>`.

**Verify:** `pnpm verify` is green. `pnpm dev:mock`, open `/dev/ui` at 1440 and 390 (devtools device toolbar) and check: one table at 1440 / cards at 390 (`document.querySelectorAll('table').length` is 1 / 0); dialog centred at 1440, bottom sheet at 390; the plain toast disappears after ~4 s, the Undo toast after ~8 s, and both stay while hovered or while their action button has keyboard focus (Tab to it).
If the toast does **not** pause while focused, **STOP** and write a blocker (options: a focus-pause wrapper, or accept hover-only).
**Commit:** `git add -A apps/web && git commit -m "feat(web): dev UI kit page for shared components (M03-T37)"`

---

### T38 — Acceptance walk-through
- [ ] done

**Files:** `docs/plans/PLAN-M03-app-shell.md` (tick boxes), `docs/milestones/M00-index.md` (M03 status → Done, if the index tracks status)
**Context:** Milestone M03 acceptance criteria 1–9.
**Do:** run `pnpm verify` (green), then `pnpm dev:mock`. Check each criterion and write ✅/❌ plus a one-line note under a new `## Acceptance results` heading at the end of this plan. In the browser devtools device toolbar use widths **390**, **800** and **1440**. "No horizontal scroll" = in the console, `document.documentElement.scrollWidth <= window.innerWidth` is `true`.

| AC | How to check |
|---|---|
| 1 | Guest at 1440 on `/`: nav shows Home · Find Providers · For Providers + `Log in` / `Sign up`; footer has Customers / Providers / Company + brand and `© 2026 Fixit`. At 390: logo + hamburger only. Tap hamburger → right sheet; Tab cycles inside it (focus trapped); Esc closes and focus is back on the hamburger; reopen → tap overlay closes; reopen → tap `Find Providers` navigates and closes. |
| 2 | DevPanel → Customer (Olivia): avatar menu shows My requests · Account settings · Become a provider · Log out (no Saved). DevPanel → Marcus: nav adds `Dashboard`; menu shows Provider dashboard. Also covered by `nav-config.test.ts`. |
| 3 | Marcus `/dashboard` at 1440: sidebar Dashboard · Requests (with count) · My Services · Profile · Service areas · Verification (Reviews and Settings hidden, D-b), Pro badge, business card "Bell & Sons Plumbing" + "Marcus Bell", Switch to booking, Log out. At 390 and 800: 56-high top bar with Menu → left drawer; drawer closes on item tap, Esc and overlay. Admin `/admin`: **Admin** badge, Overview · Verification · Users · Reviews, no Switch to booking. |
| 4 | `pnpm --filter @fixit/web test -- routes` (redirect matrix) is green. |
| 5 | `/nope` (L1, Go to home), `/dashboard/nope` as Marcus (L3, Go to dashboard), `/admin/nope` as Admin (L4, Go to overview), in the browser and in `routes.test.tsx`. |
| 6 | Open `/dev/throw`: S41 with `Error ID: …` inside L1; `Try again` reloads the page (still S41). Test in `routes.test.tsx`. |
| 7 | `/dev/ui` as in T37 Verify; `data-list.test.tsx`, `responsive-dialog.test.tsx`, `toast.test.ts` are green. |
| 8 | For `/`, `/login`, `/admin/login`, `/requests` (Olivia), `/dashboard` (Marcus), `/admin` (Admin), `/dev/ui`: no horizontal scroll at 390, 800, 1440. Tab through each shell: every link/button shows the 2px `primary` outline (white on the footer). At 390, spot-check with devtools that hamburger, avatar, sheet rows, sidebar rows, footer links and pagination are ≥ 44px high. |
| 9 | `pnpm --filter @fixit/web test -- loading-region use-delayed-flag` is green. |

Fix any ❌ that is a bug in this milestone's code (commit as `fix(web): … (M03-T38)`). If a ❌ needs a decision, write it under `## Blockers`. Then `git tag m03-done`.
**Commit:** `git commit -am "chore: M03 acceptance checks (M03-T38)"`

## Checkpoints
- After T6: "Human: run `pnpm dev:mock`, open the DevPanel sheet. Are the restyled sheet overlay, buttons (48/40/34) and focus outline acceptable before every screen is built on them?"
- After T31: "Human: `pnpm dev:mock` at 1440 and 390. Sign in as Marcus, then Admin, then Olivia from the DevPanel. Open `/dashboard`, `/admin` and `/` and compare the L3 sidebar with `reference/screens/07-provider-dashboard-desktop.png` (left column) and the L1 nav with `reference/screens/01-home-desktop.png` (top bar). Confirm D-a (S40 in L1) and D-b (Settings hidden)."
- After T37: "Human: open `/dev/ui` at 1440 and 390 and approve the shared components (pills, banners, empty states, dialog/sheet, toasts) before M04 starts using them."

## Blockers
(executor writes here; leave empty)

## Notes for review (not tasks)
- **D-a** differs from SPEC §5.E for S40 only ("L3 or L4 for `/dashboard*` and `/admin*`"). Rendering L3/L4 for a user without that role would show provider/admin chrome built from data they don't have. If the SPEC wording is kept, a decision record should say S40 for those areas uses L1.
- **D-b** reads SPEC §4.1 literally (S28 is F-22-gated), so L3 shows 6 items now, not the "8 minus Reviews" the milestone AC3 implies. M24 (F-22) adds Settings back.
- **D-d** The L4 Verification count (SPEC L4) has no data source until M13. M13 should add it, from the admin overview or queue count query, to `adminSidebarItems` and the top-bar action.
- Milestone AC7 says the toast "pauses on hover/focus". Sonner pauses on hover. Focus pausing is checked manually in T37 and becomes a blocker if missing.
- SPEC L3 lists "swipe left" to close the drawer. AC3 doesn't require it, and Radix Sheet has no swipe, so it's left out.
- Nice-to-haves (not in this plan): move focus to the page H1 after route changes (SPEC §9 "Focus management"; the skip link and `main#main` are in place); a Playwright no-horizontal-scroll smoke test per route (planned for M21); route-level `<title>` per screen; a lint rule that bans `outline-none` in `components/ui` except on menu/content containers.
