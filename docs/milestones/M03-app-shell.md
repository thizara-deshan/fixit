# M03 — App shell, layouts & shared states
Phase: A   Depends on: M02   Est: 1½ days
Mock domains after this milestone: all

## Goal
Every route from the ARCHITECTURE route map exists behind the right guard and layout (public, auth, customer, provider, admin) at desktop, tablet and phone widths, with placeholder page bodies. The shared building blocks every feature reuses — toast, responsive dialog/sheet, data list, skeletons, empty/error states, 403/404/error pages — are in place.

## Scope
- SPEC §3 layouts L1, L1-auth, L2, L3, L4 (desktop sidebar, phone/tablet top bar + left drawer, right nav sheet, avatar menu, nav content per role, active link rules, footer), §2.9 component inventory (shared components), §5.E S39 / S40 / S41, §6.1 skeleton rules (150 ms delay, `aria-busy`), §6.2 empty pattern, §6.3 section error + retry, §6.4, §6.5 toast (sonner), §6.8 banner slot (component only), §6.9 tables → cards, §6.10 dialogs → bottom sheets, §9 focus ring / keyboard.
- ARCHITECTURE §5.1 route map + guards (`RequireGuest`, `RequireAuth`, `RequireRole`, `RequireProvider`, `RequireAdmin`), lazy chunks per area, `RouteErrorBoundary`, §5.2 (`ResponsiveDialog`, `DataList`, `ResponsiveSidebar`, `useMediaQuery`), §5.5 optimistic helper (`lib/optimistic.ts`) + toast pattern, §5.6.
- Shared components in `apps/web/src/components/`: StatusPill (all request/verification/account/review variants, normal + compact), VerifiedBadge, Stars, PriceLabel + `lib/format.ts` (LKR, dates EEE d MMM yyyy etc., phone `+94 7X XXX XXXX`), EmptyState, SectionError, Skeleton*, NoticeBanner (warning/info/danger), ResponsiveDialog, DataList, Pagination, SegmentedTabs, BackLink, FormField, PhoneInput.
- Nav/sidebar items hidden when their `lib/features.ts` flag is off (Saved, Reviews, Requests/Categories in admin).

## Out of scope
- Real page content (M04–M13). Pages render an H1 with the SPEC title only.
- Account-level banner *rules* (unconfirmed email, rejected verification…) — the slot exists; banners are wired by M04/M11.
- Provider Pending-count badges: render from `Me.provider.pendingRequestCount` (already in `/auth/me`) — no new endpoint.

## Acceptance criteria
1. At 1440px as a guest: L1 nav shows Home · Find Providers · For Providers + `Log in` / `Sign up`; footer has 4 columns and "© 2026 Fixit". At 390px: logo + hamburger; the right sheet opens, traps focus, closes on Esc/overlay/link tap and returns focus to the hamburger.
2. Signed in as Olivia (DevPanel): avatar menu lists My requests · Account settings · Become a provider · Log out (no Saved). As Marcus: nav adds `Dashboard`; the menu shows Provider dashboard.
3. As Marcus, `/dashboard` at 1440px shows the L3 sidebar with 8 items minus flagged ones (Reviews hidden while F-23/F-24 flags are off), the Pro badge, business card, Switch to booking, Log out; at 390px and 800px a 56-high top bar with Menu → left drawer (closes on navigation/Esc/overlay). As Admin, `/admin` shows L4 with the **Admin** badge, no Switch to booking, and no Requests / Categories items.
4. Guards (Vitest redirect matrix per SPEC §8.4): guest → `/requests` redirects to `/login?next=%2Frequests`; guest → `/admin` → `/admin/login?next=%2Fadmin`; Olivia → `/admin` shows S40 with her email; Admin → `/requests` shows S40; Kasun (draft) → `/dashboard` redirects to `/become-a-provider/3`; Olivia (never started) → `/dashboard` → `/become-a-provider/1`; signed-in Olivia → `/login` → `/`; Marcus → `/login` → `/dashboard`.
5. `/nope` renders S39 inside L1; `/dashboard/nope` inside L3 with `Go to dashboard`; `/admin/nope` inside L4 with `Go to overview`.
6. A route that throws renders S41 with `Error ID: …`, `Try again` reloads.
7. A demo route (dev only, or Vitest) shows: a `DataList` as a table at ≥641px and as cards at 390px (only one in the DOM); a `ResponsiveDialog` as a centred dialog at 1440px and a bottom sheet at 390px; a toast that lasts 4 s (8 s with action) and pauses on hover/focus.
8. Every L1–L4 shell has no horizontal page scroll at 390, 800 and 1440px; every interactive element shows the visible focus ring and phone targets are ≥ 44px.
9. Skeletons only appear after 150 ms (Vitest with fake timers) and the region has `aria-busy="true"`.

## Notes for the planner
- One component per screen; responsive differences via classes plus the three switchers (ARCHITECTURE §5.2). `DataList` renders one column definition two ways.
- Dialog → bottom sheet on phone is mandatory for every dialog in later milestones; build `ResponsiveDialog` so features never touch `Dialog`/`Sheet` directly.
- shadcn primitives (`dialog`, `sheet`, `dropdown-menu`, `popover`, `tooltip`, `switch`, `checkbox`, `radio-group`, `select`, `tabs`, `sonner`, `skeleton`, `input`, `textarea`, `button`, `label`) are added via `pnpm dlx shadcn add` into `components/ui/` and restyled with tokens only.
- Logout: calls `POST /auth/logout`, `queryClient.clear()`, → `/` (admins → `/admin/login`) (SPEC A4).
- Only test logic: guards, `DataList`/`ResponsiveDialog` switching, optimistic helper, format helpers. No markup/snapshot tests.
