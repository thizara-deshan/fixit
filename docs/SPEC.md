# Fixit — UI Build Spec (v1)

Status: draft 2026-11-22 · Inputs: `docs/PRODUCT.md` (v1, approved 2026-11-21), `reference/prototype/unpacked/*`, `reference/screens/*`.
Gate decisions: all recommendations in §10 "Resolved at gate" were approved on 2026-11-22.

---

## 1. Overview

### 1.1 Purpose
This spec tells a front-end developer exactly what to build for Fixit v1: tokens, app frames, every screen, every state, every mutating interaction. It covers the three roles of PRODUCT §3 (customer, provider, super admin) plus guests.

### 1.2 How to read it
- **PROTOTYPE** screens (S1, S2, S3, S20) are described as they exist in `source.html`. They are not redesigned. Changes are limited to (a) phone-width fixes, (b) product decisions in PRODUCT that override prototype content (currency, location, sort, tooltip copy, no Undo), and (c) the two contrast fixes approved at the gate (§2.1). Each such change is marked **Δ**.
- **INFERRED** screens are new. They reuse existing patterns (§2.9 component inventory) and are kept minimal. Copy for them is proposed in the prototype's tone: short, plain, second person, sentence case, no exclamation marks.
- IDs: screens `S1…S41`; elements `S1.E1…`; layouts `L1…L4`; business rules `BR-xx` and features `F-xx` refer to PRODUCT.
- Prototype-only artifacts are ignored everywhere: "coming in the next milestone" modals, the "Sample requests — prototype" badge, the fixed date "Friday, October 9, 2026", the "provider photo" / "hero photo" / "map — Austin metro coverage" placeholder boxes, and the "University project prototype" footer suffix.

### 1.3 Global formatting (from PRODUCT §2)
| Thing | Format | Example |
|---|---|---|
| Money | `LKR` + space + whole rupees with thousands separators | `LKR 2,500` |
| Service price (BR-09) | per hour / per visit: `from LKR {n} / hour`, `from LKR {n} / visit`; fixed: `LKR {n} fixed` | `from LKR 2,500 / hour` |
| Short price (cards, "Starting at") | big number `LKR 2,500` + small unit suffix ` / hour`, ` / visit`, ` fixed` | — |
| Date (long) | `EEE, d MMM yyyy` | `Sat, 21 Nov 2026` |
| Date (table) | `EEE, d MMM` | `Sat, 21 Nov` |
| Date + time (history) | `d MMM yyyy, h:mm a` | `21 Nov 2026, 3:42 PM` |
| Time zone | Asia/Colombo for all display, cut-offs and "today" | — |
| Phone | `+94 7X XXX XXXX` | `+94 77 123 4567` |
| Request reference | `FX-` + number, JetBrains Mono | `FX-2061` |
| Rating | 1 decimal; no reviews → "New" | `4.9`, `New` |
| Person names shown to the other party | First name + last initial (reviews, Pending requests) | `Sarah K.` |
| Town | Town name only; district shown only in grouped selects and the area list | `Dehiwala-Mount Lavinia` |

---

## 2. Design tokens

All values are taken from `source.html` unless marked **(new)** (needed for v1 screens, derived to match) or **(Δ a11y)** (approved contrast fix).

### 2.1 Color roles
| Token | Value | Role / where used |
|---|---|---|
| `color-primary` | `#1E4FA3` | Primary buttons, links, active nav item text + underline, logo tile, focus ring |
| `color-primary-hover` | `#163C7E` | Hover/pressed of primary buttons and links |
| `color-primary-soft` | `#EAF0FA` | Icon tiles, avatar-initials circles, active sidebar item, selected rating option, Saved state, outline-button hover |
| `color-primary-soft-border` | `#C9D6EE` | Save button border (unsaved) |
| `color-primary-flash` | `#F3F7FD` | Row background for ~0.9 s after a status change |
| `color-page` | `#F6F7F9` | Page background; ghost-button hover; table header row; segmented-tab track |
| `color-surface` | `#FFFFFF` | Cards, nav, panels, inputs |
| `color-surface-muted` | `#F1F2F4` | "Not yet verified" pill; Cancelled pill |
| `color-placeholder-a` / `-b` | `#EEF0F3` / `#E6E9EE` | Image skeleton stripes only (never shipped as content) |
| `color-divider-subtle` | `#EEF0F3` | Row dividers inside compact lists (My Services card) |
| `color-border` | `#E3E6EB` | Card, input, nav, table borders; dividers; empty stars; step numerals |
| `color-border-strong` | `#D3D8E0` | Result-card hover border; dashed empty-state border; toggle off |
| `color-border-control` | `#C5CBD5` | Unchecked checkbox border; unchecked checklist icon |
| `color-text` | `#1A1D24` | Body and headings |
| `color-text-muted` | `#545B68` | Secondary text, inactive nav, field help |
| `color-text-subtle` | `#6E7482` **(Δ a11y)** | Meta text, captions, counts, placeholders (was `#8A909C`, 3.21:1 → ≈4.5:1) |
| `color-icon-subtle` | `#8A909C` | Decorative icons inside inputs and meta rows; never text |
| `color-success` | `#1F8A4C` | Verified tile/dot, toggle on, check icons |
| `color-success-soft` | `#E7F5EC` | Verified badge background, Completed pill, success tint |
| `color-success-text` | `#17703D` **(Δ a11y)** | Text on `success-soft` (Verified badge label, Completed pill, Active pill) |
| `color-warning` | `#F2843A` | Pending dot; dashed notice border |
| `color-warning-soft` | `#FDF0E6` | Pending pill, "Pro" badge, stat tints, notice banners |
| `color-warning-text` | `#A44E12` | Text on `warning-soft` |
| `color-warning-text-strong` | `#8A4310` | Text in dashed notice pills/banners |
| `color-danger` | `#D64545` | Declined dot; danger-button hover border; field error border |
| `color-danger-soft` | `#FBECEC` | Declined pill; error banner background |
| `color-danger-text` | `#B23A3A` | Text on `danger-soft`; field error message; Log out hover |
| `color-accent` | `#F2843A` | Provider CTA ("Join as a provider"), step-03 tile, sidebar count badge |
| `color-accent-hover` | `#E0722A` | Hover of accent CTA |
| `color-on-accent` | `#1A1D24` | Text on accent |
| `color-star` | `#F2843A` | Filled stars |
| `color-star-empty` | `#E3E6EB` | Empty stars |
| `color-on-primary-muted` | `#D6E0F3` | Body text on the blue CTA band |
| `color-cta-outline` | `#6E8FCB` | Outline button border on the blue CTA band |
| `color-footer-bg` | `#14254A` | Footer background; Admin badge background (new use) |
| `color-footer-text` | `#C9D3E6` | Footer links/body |
| `color-footer-divider` | `#2A3D66` | Footer rule |
| `color-footer-meta` | `#8FA0C2` | Copyright line |
| `color-tooltip-bg` | `#1A1D24` | Tooltip and toast background |
| `color-toast-action` | `#9DB8EA` | Toast action link |
| `color-overlay` | `rgba(20,24,36,.5)` | Modal / sheet / drawer backdrop |

### 2.2 Status pills
Shape (prototype): height 28, padding 0 12, radius `full`, gap 6, 13/700, leading 6×6 dot. A compact variant (height 24, 12/700, padding 0 10) is used inside cards on phone.

| Status | Background | Text | Dot | Source |
|---|---|---|---|---|
| Pending | `#FDF0E6` | `#A44E12` | `#F2843A` | PROTOTYPE |
| Accepted | `#EAF0FA` | `#1E4FA3` | `#1E4FA3` | PROTOTYPE |
| Completed | `#E7F5EC` | `#17703D` (Δ) | `#1F8A4C` | PROTOTYPE |
| Declined | `#FBECEC` | `#B23A3A` | `#D64545` | PROTOTYPE |
| Cancelled | `#F1F2F4` | `#545B68` | `#8A909C` | new |
| Expired | `#F6F7F9` + 1px dashed `#D3D8E0` | `#545B68` | `#C5CBD5` | new |

Other status sets reuse the same palette:

| Domain | Value → pill style |
|---|---|
| Verification (BR-18) | Not submitted → Cancelled style · Pending review → Pending style · Verified → Verified badge (§2.9) · Rejected → Declined style |
| Account | Active → Completed style · Suspended → Declined style |
| Review | Visible → no pill · Hidden → Cancelled style, label "Hidden" |
| Listing availability (BR-15) | Not taking requests → Pending style without dot |
| Listing trust | Verified → Verified badge · Not yet verified → `surface-muted` / `text-muted` pill, 28 high, 13/600 (prototype) |

### 2.3 Typography
Families: `font-sans` = `'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`; `font-mono` = `'JetBrains Mono', monospace` (request references only). Antialiased. Weights loaded: 400, 500, 600, 700, 800.

| Token | Size / line-height | Weight | Tracking | Prototype usage |
|---|---|---|---|---|
| `text-display` | 56 / 64 | 800 | −0.03em | Home hero H1 (balance wrap) |
| `text-title-xl` | 40 / 48 | 800 | −0.02em | Provider name H1; dashboard greeting H1 |
| `text-stat` | 34 / 40 | 800 | −0.02em | Stat tile value |
| `text-price-xl` | 30 / 38 | 800 | — | Profile "Starting at" price |
| `text-title-lg` | 28 / 36 | 700 | −0.01em | Section H2s; Discover count H1; CTA band H2 (−0.02em) |
| `text-price-lg` | 22 / 28 | 800 | — | Result-card price |
| `text-logo` | 21 | 800 | −0.02em | Wordmark |
| `text-title-md` | 20 / 28 | 700 | — | Card section H2; step titles; modal title |
| `text-title-sm` | 19 / 26 | 700 | — | Result-card provider name |
| `text-lead` | 18 / 28 | 400 | — | Hero paragraph; 18/800 for "Filters", 18/700 empty-state title |
| `text-title-xs` | 17 / 22 | 700 | — | Featured-card name; category-card name |
| `text-body` | 16 / 24 (26 in About) | 400 | — | Section subtitles, About text; 16/700 large button |
| `text-body-sm` | 15 / 23 | 400–600 | — | Reviews, step copy, nav links (600), secondary buttons (600) |
| `text-label` | 14 / 20 | 500–700 | — | Buttons (600), filter group labels (700), form labels (600, new) |
| `text-meta` | 13 / 19 | 500–700 | — | Pills, tooltip, captions, chips |
| `text-caption` | 12 / 16 | 700 | 0.05em, uppercase for table heads | Table header; search micro-labels "Service"/"Location" (not uppercase) |
| `text-mono` | 11 / 16 | 400 | — | `FX-2061` |

Phone overrides (≤ 640): `text-display` → 36/44; `text-title-xl` → 28/36; `text-title-lg` → 22/30; `text-stat` → 28/36; `text-price-xl` → 24/32. Everything else unchanged. Never below 16px for input text on phone (prevents iOS zoom).

### 2.4 Radii
| Token | Value | Used for |
|---|---|---|
| `radius-xs` | 6 | Checkbox |
| `radius-sm` | 10 | Small buttons (34 high), logo tile, rating options, stat icon tile on phone |
| `radius-md` | 12 | Buttons (40/48 high), inputs, selects, stat icon tile, segmented track |
| `radius-lg` | 14 | Search submit (13–14), thumbnails, toast, category icon tile |
| `radius-xl` | 16 | Cards (category, featured, result, stat tile), empty state, how-it-works icon tile |
| `radius-2xl` | 20 | Panels (filter, profile sections, dashboard sections), modal, home search bar, step cards |
| `radius-3xl` | 24 | Profile header card, CTA band |
| `radius-4xl` | 28 | Hero image |
| `radius-full` | 999 | Pills, chips, badges, toggle, progress bar, avatars |
| (segmented tab) | 9 | Tab inside the segmented track |

### 2.5 Shadows
| Token | Value | Used for |
|---|---|---|
| `shadow-xs` | `0 1px 3px rgba(20,24,36,.1)` | Active segmented tab |
| `shadow-knob` | `0 1px 3px rgba(0,0,0,.2)` | Toggle knob |
| `shadow-badge` | `0 2px 8px rgba(20,24,36,.08)` | Verified badge over a photo |
| `shadow-search-sm` | `0 6px 20px rgba(20,24,36,.05)` | Discover search bar |
| `shadow-hover` | `0 8px 24px rgba(20,24,36,.08)` | Card hover elevation (+ `translateY(-2px)` on category cards; transition .15s) |
| `shadow-search` | `0 12px 32px rgba(20,24,36,.08)` | Home search bar |
| `shadow-tooltip` | `0 12px 32px rgba(20,24,36,.2)` | Tooltip, dropdown menu (new use) |
| `shadow-float` | `0 16px 40px rgba(20,24,36,.14)` | Floating hero cards (`.12` variant for the small one) |
| `shadow-toast` | `0 16px 40px rgba(20,24,36,.25)` | Toast; bottom sheet (new use) |
| `shadow-modal` | `0 24px 64px rgba(20,24,36,.25)` | Modal / dialog; drawer (new use) |

### 2.6 Spacing & layout
| Token | Value |
|---|---|
| Spacing scale | 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72, 88 |
| `layout-max-width` | 1240 |
| `layout-gutter` | 32 desktop · 24 tablet · 16 phone |
| `section-gap` | 88 desktop · 56 phone (between home sections, page bottom padding) |
| `nav-height` | 72 desktop · 64 phone |
| `dash-topbar-height` | 56 (phone/tablet only) |
| `sidebar-width` | 256 (provider/admin) |
| `filter-panel-width` | 280 (Discover); sticky `top: 96` |
| `profile-aside-width` | 380 (Service area aside); sticky `top: 96` |
| `auth-card-width` | 440 |
| `form-max-width` | 720 (single-column forms in L2/L3/L4) |
| `touch-min` | 44 × 44 on phone |

### 2.7 Breakpoints
| Name | Range | Main switches |
|---|---|---|
| `phone` | ≤ 640 | Hamburger nav; one-column everything; tables → card lists; filters → bottom sheet; sticky bottom action bars |
| `tablet` | 641–1023 | Hamburger nav; sidebar → drawer; Discover filters → sheet; 2-column grids |
| `desktop` | ≥ 1024 | Prototype layout |

### 2.8 Motion
Hover transitions .15s (prototype). Row flash .3s fade (prototype, flash held 900 ms). Toast visible 4 s. Sheet/drawer slide 200 ms ease-out. Respect `prefers-reduced-motion`: no translate/slide, fades only.

### 2.9 Component inventory (patterns to reuse)
| Pattern | Prototype spec |
|---|---|
| Button primary | 48 high (40 in nav, 34 small), padding 0 20–28, `radius-md`, `primary` bg, white 14–16/600–700; hover `primary-hover` |
| Button outline | 40 high, 1.5px `primary` border, white bg, `primary` text 14/600; hover `primary-soft` bg (or solid primary on result card) |
| Button secondary | 40 high, 1px `border`, white bg, `text` 14/600; hover `page` |
| Button danger-outline (Decline) | 34 high, 1.5px `border`, hover border `danger` + text `danger-text` |
| Button accent | 48 high, `accent` bg, `on-accent` 15/700, hover `accent-hover` |
| Text link | `primary` 14–15/600–700; with trailing `ArrowRight` 20 |
| Input / select | 48 high, padding 0 12, 1.5px `border`, `radius-md`, 14–16/500; focus border `primary` + ring (§9) |
| Search bar | Prototype home (radius 20, pad 8, 60 high fields, `shadow-search`) and discover variant (radius 16, pad 6, 56 high, `shadow-search-sm`) |
| Checkbox row | 20×20 `radius-xs`, 1.5px `border-control`; on: `primary` fill + white ✓ |
| Option row (radio-like) | 38 high, 1.5px border, `radius-sm`; selected `primary` border + `primary-soft` bg |
| Toggle | 44×26 track `radius-full`, off `border-strong`, on `success`; knob 20, `shadow-knob` |
| Chip | 32 high, padding 0 12, 1px `border`, `text-muted` 13/600; hover border+text `primary` |
| Card | white, 1px `border`, `radius-xl` or `radius-2xl`, padding 20–28 |
| Stat tile | white card r16 pad 20; label 14/600 muted; 40×40 tinted icon tile r12; value `text-stat` + 13 subtle sub |
| Segmented tabs | track `page` r12 pad 4 gap 4; tab 34 high r9 13/600, count 12 subtle; active white + `shadow-xs` + `text` |
| Data table | header row `page` 12/700 uppercase subtle, 10×24 pad; rows 16×24 pad, `border` top |
| Verified badge | 24–28 high pill `success-soft`, 16–18 circle `success` with white ✓, label 12–13/700 `success-text` |
| Avatar initials | circle `primary-soft`, `primary` 800 text (36 table, 44 reviews) |
| Empty state | white, 1px dashed `border-strong`, r16, pad 56×24, 56×56 `primary-soft` r16 icon tile (28 icon), 18/700 title, 15 muted body, primary 48 button |
| Toast | fixed bottom 28 centered, `tooltip-bg`, r14, pad 12/16/12/18, 14/600 white, optional action 14/700 `toast-action` |
| Modal / dialog | overlay; white r20 pad 32, max-width 440, `shadow-modal`, 56×56 icon tile, 20/700 title, 15/22 body, buttons |
| Tooltip | `tooltip-bg`, width 280, r12, pad 12×14, 13/19 500 white, bold title line |
| Progress bar | 10 high `primary-soft` track, `primary` fill, `radius-full` |
| Notice banner (new) | r14, pad 14×16, `warning-soft` bg, 1px dashed `warning`, `warning-text-strong` 14/600, leading icon, optional link/button right. Variants: info (`primary-soft`/`primary`), danger (`danger-soft`/`danger-text`, solid border) |
| Bottom sheet (new) | phone only; white, top radius 20, `shadow-toast`, grab handle 36×4 `border-strong`; header row title + close (44 target); sticky footer with primary action |
| Drawer (new) | left, width min(320, 85vw), white, `shadow-modal`, holds sidebar contents |

### 2.10 Icons (Material Symbols Rounded → lucide-react)
Stroke width 2 default; sizes follow the prototype (15–28). Filled-state Material icons (`FILL 1`) become lucide icons with `fill="currentColor"` where noted.

| Material | lucide | Where |
|---|---|---|
| verified (filled) | `BadgeCheck` | Hero chip, floating card |
| search | `Search` | Search bars, step 01 |
| location_on | `MapPin` | Location fields, meta rows, area list |
| arrow_forward / arrow_back | `ArrowRight` / `ArrowLeft` | Section links, Back to results |
| compare_arrows | `ArrowLeftRight` | Step 02 |
| send | `Send` | Step 03, Request Service |
| workspace_premium | `Award` | Years experience |
| info | `Info` | Verified badge tip trigger |
| favorite (fill on save) | `Heart` | Save button |
| check_circle (filled) | `CircleCheck` | Services list, checklist done |
| radio_button_unchecked | `Circle` | Checklist todo |
| search_off | `SearchX` | Empty states |
| space_dashboard | `LayoutDashboard` | Sidebar: Dashboard / Overview |
| inbox | `Inbox` | Sidebar: Requests; stat "New requests" |
| home_repair_service | `BriefcaseBusiness` | Sidebar: My Services |
| person | `User` | Sidebar: Profile; account menu |
| star | `Star` | Sidebar: Reviews; stat "Average rating" |
| settings | `Settings` | Sidebar: Settings |
| logout | `LogOut` | Log out |
| visibility | `Eye` | View public profile |
| event_available | `CalendarCheck` | Stat "Accepted" |
| task_alt | `CircleCheckBig` | Stat "Completed this month" |
| check | `Check` | Accept |
| edit | `Pencil` | Edit buttons |
| plumbing | `Wrench` | Category Plumbing |
| electrical_services | `Zap` | Category Electrical |
| cleaning_services | `SprayCan` | Category Cleaning |
| yard | `Sprout` | Category Gardening |
| format_paint | `PaintRoller` | Category Painting & Decorating |
| carpenter | `Hammer` | Category Carpentry |
| handyman | `Drill` | Category Handyman |
| local_laundry_service | `WashingMachine` | Category Appliance Repair |
| construction, science | — | Prototype-only; dropped |

New (INFERRED screens): `Menu`, `X`, `SlidersHorizontal` (Filters button), `ChevronDown`, `ChevronRight`, `ChevronLeft`, `ShieldCheck` (Verification), `Map` (Service areas), `Users` (admin Users), `ClipboardList` (admin Requests), `Tags` (Categories & towns), `MessageSquare` (admin Reviews), `ChartColumn` (Overview metrics), `EyeOff` (hide review), `Ban` (suspend), `RotateCcw` (restore/reactivate), `Phone`, `CalendarDays`, `Clock`, `Upload`, `FileText`, `Trash2`, `Plus`, `TriangleAlert`, `Lock`, `CircleAlert`, `PauseCircle`, `MessageSquareReply`, `Mail`, `ArrowLeftRight` (Switch to booking), `ImageOff` (photo fallback not used — category icon instead).

New categories added by admin (F-34) choose an icon from the fixed set above; default `Wrench`.

---

## 3. Layouts

### L1 — Public
**Desktop (≥ 1024)** — prototype.
- **Nav** (sticky top 0, z 10, white, 1px bottom `border`, height 72). Inner row max-width 1240, padding 0 32, gap 48: logo (34×34 `primary` tile r10 with white "F" 17/800 + "Fixit" `text-logo`) · links (gap 32, 15/600, padding 25 0; active: `primary` + 2px inset underline; inactive `text-muted`, hover `text`) · actions (gap 10, right).
- **Footer** (`footer-bg`, margin-top auto): max-width 1240, padding 56 32 28, gap 40. Grid `1.6fr 1fr 1fr 1fr` gap 40: brand block (white tile with `primary` F, "Fixit" white, "Home service booking marketplace." 14/20) · Customers · Providers · Company columns (title white 700 14; links `footer-text` 14, gap 10). Bottom rule 1px `footer-divider`, pad-top 20, 13 `footer-meta`: "© 2026 Fixit". **Δ** ("University project prototype" removed.)
- Footer links: **Customers** — Find Providers (`/discover`), How it works (`/#how-it-works`), My requests (`/requests`). **Providers** — For Providers (`/for-providers`), Get verified (`/dashboard/verification`; guests → `/for-providers`), Dashboard (`/dashboard`; guests → `/login?next=/dashboard`). **Company** — About, Contact, Privacy.

**Tablet & phone (≤ 1023)**
- Nav height 64 (phone) / 72 (tablet), gutter 16/24: logo left; right: (signed-in) avatar button 40×40 + hamburger `Menu` 44×44. Links and auth buttons move into a **right sheet** (full height, width min(360, 100vw), `shadow-modal`, overlay): close `X` 44 top-right; nav links as 56-high rows 16/600 with active `primary` + `primary-soft` bg; then for guests two full-width 48 buttons "Log in" (secondary) and "Sign up" (primary); for signed-in users the account-menu items. Sheet closes on link tap, overlay tap, Esc; focus trapped; returns focus to hamburger.
- Footer: brand block full width, then the three link columns in a 2-column grid (Company wraps to second row), links get 44 min height.

**Nav content per role**
| Role | Links | Right side |
|---|---|---|
| Guest | Home · Find Providers · For Providers | `Log in` (secondary 40) · `Sign up` (primary 40) |
| Customer | Home · Find Providers · My requests | Avatar menu (initials 40 circle + `ChevronDown`) |
| Provider (also customer) | Home · Find Providers · My requests | `Dashboard` (outline 40, `LayoutDashboard`) · Avatar menu |
| Admin | Home · Find Providers | `Admin console` (outline 40) · `Log out` (secondary 40) |

Avatar menu (dropdown, white r14, `shadow-tooltip`, 1px `border`, min-width 220, items 44 high 14/600 with icon): header (name 14/700 + email 13 subtle) · My requests (`Inbox`) · Saved providers (`Heart`, only if F-10 ships) · Account settings (`User`) · **Become a provider** (`BriefcaseBusiness`, customers who are not providers) **or** Provider dashboard (`LayoutDashboard`, providers) · divider · Log out (`LogOut`, hover `danger-text`).

Active link rules: Home on `/`; Find Providers on `/discover` and `/providers/*`; My requests on `/requests*`, `/saved`, `/account`; For Providers on `/for-providers`.

### L1-auth — Public, narrow
L1 nav and footer. Main: `page` background, padding 56 16 88, a single white card centered, max-width 440, r20, padding 32 (24 on phone), `shadow-none`, 1px `border`. Card header: 56×56 `primary-soft` r16 icon tile (optional), title `text-title-md`, subtitle 15/22 muted. On phone the card is full width (gutter 16). S29 uses this layout with nav links and footer columns hidden (logo only).

### L2 — Customer area
L1 nav + footer. Main: max-width 1240, padding 32 32 88 (phone 20 16 56), gap 24.
- **Page header**: H1 `text-title-lg` + 15 muted subtitle.
- **Section tabs**: segmented tabs (§2.9) as links: `My requests` · `Saved` (only if F-10) · `Account`. Active by route. On phone the track is full width and scrolls horizontally if needed; each tab ≥ 44 high.
- Detail pages (S15, S16) replace the tabs with a back link (prototype "Back to results" pattern: `ArrowLeft` + 15/600 muted, hover `primary`), e.g. "Back to my requests".

### L3 — Provider dashboard
**Desktop (≥ 1024)** — prototype.
- Grid `256px minmax(0,1fr)`, min-height 100vh, `page` bg.
- **Sidebar** (sticky, 100vh, white, 1px right `border`, padding 24 16, gap 28): logo + "Fixit" + **Pro** badge (22 high, pad 0 8, `warning-soft`/`warning-text` 11/700, r999) · nav list (gap 4; items 44 high, pad 0 12, r12, gap 12, icon 22, 15/600; active `primary` on `primary-soft`; inactive `text-muted`, hover bg `page`; count badge min-width 22 h22 `accent`/`on-accent` 12/800) · footer block (margin-top auto): business card (pad 12, 1px `border`, r14; 40×40 r10 photo or category-icon tile; business name 14/700 ellipsis + owner 12 subtle) · **Switch to booking** link (`ArrowLeftRight` 20, 14/600 muted, → `/`) · **Log out** (`LogOut`, 14/600 muted, hover `danger-text`).
- Nav items (in order): Dashboard (`LayoutDashboard`, `/dashboard`) · Requests (`Inbox`, `/dashboard/requests`, badge = Pending count) · My Services (`BriefcaseBusiness`) · Profile (`User`) · Service areas (`Map`) · Verification (`ShieldCheck`, shows a 8×8 `warning` dot when status is Not submitted or Rejected) · Reviews (`Star`) · Settings (`Settings`).
- **Main**: padding 32 40 64, gap 28, max-width 1240. A **banner slot** sits at the top of main for account-level notices (§6.8).

**Tablet & phone (≤ 1023)**
- Sidebar hidden. **Top bar** sticky, height 56, white, 1px bottom `border`, pad 0 8: `Menu` button 44 · logo tile + "Fixit" + Pro badge · spacer · Requests icon button 44 (`Inbox`, with the count badge overlaid top-right) .
- `Menu` opens a **left drawer** containing the full sidebar (same order, same items, 48-high rows). Closes on navigation, overlay tap, Esc, swipe left.
- Main padding 20 16 56 (tablet 24 24 64), gap 20.

**Access**: only accounts with a completed provider profile. A customer without one who opens `/dashboard*` is redirected to `/become-a-provider/1` (or to the step they left). A suspended provider can't be signed in (BR-41).

### L4 — Admin console
Same shell as L3 (desktop sidebar / phone top bar + drawer) with these differences, so the two are never confused:
- Badge after the wordmark reads **Admin**: 22 high, pad 0 8, `footer-bg` background, white 11/700.
- Active nav item: `primary` on `primary-soft`, same as L3 (no new colour); the badge, the nav set and the absence of "Switch to booking" carry the distinction.
- Nav items: Overview (`ChartColumn`, `/admin`) · Verification (`ShieldCheck`, `/admin/verifications`, badge = Pending review count) · Users (`Users`, `/admin/users`) · Requests (`ClipboardList`, `/admin/requests`, F-35) · Reviews (`MessageSquare`, `/admin/reviews`) · Categories & towns (`Tags`, `/admin/catalog`, F-34). Should-items not built are hidden from the nav.
- Footer block: admin card (initials avatar, name 14/700, "Super admin" 12 subtle) · Log out. No "Switch to booking" (admins don't book).
- Phone top bar right button: Verification icon with count.

**Access**: admin accounts only (signed in via S29). Any other user → S40 (403).

---

## 4. Screen inventory

### 4.1 Screens
| ID | Screen | Route | Layout | Roles allowed | Features | Source |
|---|---|---|---|---|---|---|
| S1 | Home | `/` | L1 | all | F-05, F-29 | PROTOTYPE |
| S2 | Discover | `/discover` | L1 | all | F-06, F-07, F-08, F-29 | PROTOTYPE |
| S3 | Provider profile | `/providers/:id` | L1 | all | F-09, F-10, F-22 (display), F-23 (display), F-29 | PROTOTYPE |
| S4 | For providers | `/for-providers` | L1 | guest, customer, provider | F-15 (entry) | INFERRED |
| S5 | Log in | `/login` | L1-auth | guest | F-01, F-02, F-04 | INFERRED |
| S6 | Sign up | `/signup` | L1-auth | guest | F-01, F-02, F-04 | INFERRED |
| S7 | Check your email | `/signup/check-email` | L1-auth | guest, unconfirmed | F-01 | INFERRED |
| S8 | Confirm email (result) | `/auth/confirm` | L1-auth | any | F-01 | INFERRED |
| S9 | Forgot password | `/forgot-password` | L1-auth | guest | F-01 | INFERRED |
| S10 | Reset password | `/reset-password` | L1-auth | guest (token) | F-01 | INFERRED |
| S11 | About · Contact · Privacy | `/about`, `/contact`, `/privacy` | L1 | all | F-37 | INFERRED |
| S12 | Request form | `/providers/:id/request` | L1 | customer, provider (not own listing) | F-11, F-14, F-04, F-03, F-39 (hidden) | INFERRED |
| S13 | Request sent | `/requests/:ref/sent` | L1 | request owner | F-11 | INFERRED |
| S14 | My requests | `/requests` | L2 | customer, provider | F-12, F-25 | INFERRED |
| S15 | Request detail (customer) | `/requests/:ref` | L2 | request owner | F-12, F-13, F-27, F-28 | INFERRED |
| S16 | Leave a review | `/requests/:ref/review` | L2 | request owner, eligible | F-28 | INFERRED |
| S17 | Saved providers | `/saved` | L2 | customer, provider | F-10 (Could) | INFERRED |
| S18 | Account settings | `/account` | L2 | customer, provider | F-03, F-01, F-40 (hidden) | INFERRED |
| S19 | Become a provider (5-step wizard) | `/become-a-provider/:step` (1–5) | L1 | customer (confirmed email) | F-15, F-03 | INFERRED |
| S20 | Provider overview | `/dashboard` | L3 | provider | F-17, F-18, F-21, F-22 | PROTOTYPE |
| S21 | Provider requests | `/dashboard/requests` | L3 | provider | F-17, F-18, F-25 | INFERRED |
| S22 | Request detail (provider) | `/dashboard/requests/:ref` | L3 | provider of the request | F-17, F-18, F-19, F-27 | INFERRED |
| S23 | My Services | `/dashboard/services` | L3 | provider | F-20 | INFERRED |
| S24 | Business profile | `/dashboard/profile` | L3 | provider | F-20 | INFERRED |
| S25 | Service areas | `/dashboard/areas` | L3 | provider | F-20 | INFERRED |
| S26 | Verification | `/dashboard/verification` | L3 | provider | F-16 | INFERRED |
| S27 | Reviews (provider) | `/dashboard/reviews` | L3 | provider | F-24, F-23 | INFERRED |
| S28 | Provider settings | `/dashboard/settings` | L3 | provider | F-22 | INFERRED |
| S29 | Admin sign-in | `/admin/login` | L1-auth (logo only) | guest | F-30 | INFERRED |
| S30 | Admin overview | `/admin` | L4 | admin | F-36 | INFERRED |
| S31 | Verification queue | `/admin/verifications` | L4 | admin | F-31 | INFERRED |
| S32 | Verification review | `/admin/verifications/:id` | L4 | admin | F-31 | INFERRED |
| S33 | Users | `/admin/users` | L4 | admin | F-32 | INFERRED |
| S34 | User detail | `/admin/users/:id` | L4 | admin | F-32 | INFERRED |
| S35 | All requests | `/admin/requests` | L4 | admin | F-35 | INFERRED |
| S36 | Request detail (admin) | `/admin/requests/:ref` | L4 | admin | F-35 | INFERRED |
| S37 | Reviews moderation | `/admin/reviews` | L4 | admin | F-33 | INFERRED |
| S38 | Categories & towns | `/admin/catalog` | L4 | admin | F-34 | INFERRED |
| S39 | Not found (404) | any unmatched route; unknown `:id`/`:ref` | L1 / L3 / L4 by area | all | F-38 | INFERRED |
| S40 | No access (403) | role mismatch | L1 / L3 / L4 by area | all | — | INFERRED |
| S41 | Something went wrong | unexpected error | L1 / L3 / L4 by area | all | — | INFERRED |

Should/Could gating: screens and nav items for F-10 (S17), F-21 (S20 checklist), F-22 (S20 toggle, S28), F-23 (replies on S3/S27), F-24 (S27), F-34 (S38), F-35 (S35/S36), F-36 (S30 metrics) are hidden entirely when the feature is not built. If F-36 is not built, S30 shows only the "Needs attention" block (§5 S30). If F-24 and F-23 are both not built, the Reviews nav item is hidden.

### 4.2 Feature → screen mapping
| Feature | MoSCoW | Screens |
|---|---|---|
| F-01 Email+password sign-up/in, confirmation, reset | Must | S5, S6, S7, S8, S9, S10, S18 (change password) |
| F-02 Google sign-in | Must | S5, S6 |
| F-03 Account profile, mobile, "I offer services" | Must | S18, S19 (step 1 mobile), S12 (inline mobile) |
| F-04 Return to provider + open request form after auth | Must | S3 → S5/S6 → S12 |
| F-05 Home | Must | S1 |
| F-06 Search | Must | S1, S2 |
| F-07 Filters | Must | S2 |
| F-08 Sort | Must | S2 |
| F-09 Provider profile | Must | S3 |
| F-10 Saved providers | Could | S3 (Save button), S17 |
| F-11 Request form | Must | S12, S13 |
| F-12 My requests list + detail | Must | S14, S15 |
| F-13 Cancel own request | Must | S15 |
| F-14 Request limits | Must | S3 (disabled state), S12 |
| F-15 Onboarding wizard | Must | S4, S19 |
| F-16 Verification submit/resubmit | Must | S26, S19 (finish screen link) |
| F-17 Dashboard, list, detail | Must | S20, S21, S22 |
| F-18 Accept / Decline | Must | S20, S21, S22 |
| F-19 Mark Completed, agreed price | Must | S22 |
| F-20 Edit business, services, areas, photo | Must | S23, S24, S25 |
| F-21 Completeness checklist | Should | S20 |
| F-22 Pause switch | Should | S20, S28, S3 (display) |
| F-23 Review reply | Should | S27, S3 (display) |
| F-24 Dashboard reviews | Should | S27 |
| F-25 Automatic expiry | Must | S14, S15, S21, S22 (Expired pill + copy) |
| F-26 Email notifications | Must | No screen; in-app counters on L3 nav, S20 stats, pills on S14 (§8.6 lists subjects) |
| F-27 Contact reveal / hide | Must | S15, S22 |
| F-28 Write a review | Must | S15, S16 |
| F-29 Rating aggregation, "New" | Must | S1, S2, S3, S20 |
| F-30 Admin sign-in | Must | S29 |
| F-31 Verification queue | Must | S31, S32 |
| F-32 Suspend / reactivate | Must | S33, S34 |
| F-33 Hide / restore reviews | Must | S37 |
| F-34 Categories & towns | Should | S38 |
| F-35 All requests + admin cancel | Should | S35, S36 |
| F-36 Metrics | Should | S30 |
| F-37 About / Contact / Privacy | Must | S11 |
| F-38 Responsive | Must | All (L1–L4 phone rules) |
| F-39 Request photos | Could | S12 (field hidden unless built), S15, S22 |
| F-40 Self-service account deletion | Could | S18 (section hidden unless built) |
| F-41 – F-52 | Won't | — |

---

## 5. Screens

Conventions for every element table: **Data** names fields from §7; **States** lists non-default states (loading/empty/error states not listed here follow §6); **Copy** is verbatim for PROTOTYPE screens (Δ = changed by an approved product decision) and proposed for INFERRED screens. `{x}` = data placeholder. Form field tables give type, required, validation and the exact error message; errors show under the field in 13/19 `danger-text` with a `CircleAlert` 16 icon, the input border turns `danger`, and on submit focus moves to the first invalid field.

### 5.A Public

#### S1 — Home `/` · L1 · PROTOTYPE · F-05, F-29

**Purpose.** Let anyone start a search, browse by category, see top providers, learn how Fixit works, and find the provider sign-up.

**Desktop layout.** Six blocks, top to bottom:
1. Hero band: white with a 1px bottom `border`. Max width 1240, padding 72 32 88. Grid `1.15fr 1fr`, gap 64.
2. Popular services: padding-top 88, header row then a 4-column grid, gap 20.
3. Featured providers: same header pattern, 4-column grid.
4. How it works: centred header, 3-column grid, gap 24.
5. CTA band: blue, r24, padding 48 56, inside a section padded 88 32.
6. Footer.

**Phone layout (≤ 640).**
1. **Hero** becomes one column: eyebrow pill, H1 (36/44), lead (16/24), then the search bar.
   - The search bar stacks vertically: Service field (56 high), a 1px horizontal divider, Location field (56 high), then a full-width Search button (52 high, r14). Container padding is 8 and radius 20.
   - Popular chips wrap.
   - The hero image follows the search bar at 220 high, r20, full width. Only the provider floating card is shown, overlapping the bottom edge by 24 and inset 12 on each side; the "Accepted" card is hidden.
   - Hero padding is 32 16 48.
2. **Section headers** stack, with the "All services →" link on its own line under the subtitle. Section spacing is 56.
3. **Categories:** 2-column grid, gap 12. Cards have padding 16 and gap 12, with a 44×40 icon tile and a 24 icon. The blurb is clamped to 2 lines.
4. **Featured:** one column; each card's photo is 160 high.
5. **How it works:** one column, card padding 24.
6. **CTA band:** padding 28 24, radius 20. Text stacks over two full-width 48 buttons.

**Tablet (641–1023):** hero in one column with the image at 320 high; categories and featured in 2 columns; how it works in 3 columns if ≥ 900 px, otherwise 1.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S1.E1 | Eyebrow pill | — | — | none | `[BadgeCheck] Verified pros across the Western Province` Δ (was "Austin metro") |
| S1.E2 | Hero H1 | — | — | none | `Trusted local help, ` + (`primary`) `right when you need it.` |
| S1.E3 | Lead | — | — | none | `Find reviewed plumbers, electricians, cleaners and more near you — compare them side by side and send a request in minutes.` |
| S1.E4 | Search bar | Category names (for BR-02), Locations (active, grouped by district) | Focus: field label row gets `primary` 2px ring on the container (§9) | Submit (button or Enter) → `/discover?q={trimmed text}&loc={townId}`; empty fields are omitted | Labels `Service`, `Location`; placeholder `What service do you need?`; select first option `All locations`, then `<optgroup>` per district (Colombo, Gampaha, Kalutara) with towns; button `[Search] Search` |
| S1.E5 | Popular chips | Fixed: Plumbing, Cleaning, Electrical, Handyman | Hover: `primary` border + text | Tap fills the Service input with the label and does not submit (prototype) | `Popular:` · `Plumbing` · `Cleaning` · `Electrical` · `Handyman` |
| S1.E6 | Hero image + floating cards | Hero photo (static asset); floating provider = 1st featured provider (name, rating, reviewCount, verified) | No featured provider → hide the floating provider card. Image not loaded → `primary-soft` panel | Floating provider card links to that provider's profile | Status card: pill `Accepted` + `Your request was accepted` |
| S1.E7 | Popular services header | — | — | `All services →` → `/discover` | H2 `Popular services`; sub `Pick a category to see pros available near you.`; link `All services` |
| S1.E8 | Category card ×N | Category: icon, name, blurb (active categories, admin order) | Hover: `primary` border, `shadow-hover`, lift −2px | Card is one link → `/discover?cat={categoryId}` | `{name}` / `{blurb}` e.g. `Plumbing` / `Leaks, drains, water heaters` |
| S1.E9 | Featured header | — | Section hidden if 0 providers qualify | `See all providers →` → `/discover` | H2 `Featured providers near you`; sub `Highly rated, verified pros in the Western Province.` Δ; link `See all providers` |
| S1.E10 | Featured provider card ×≤4 | Featured list (BR-08): photo, verified, businessName, categoryName, baseTownName, rating, reviewCount, startingPrice | Hover `shadow-hover`. No photo → `primary-soft` panel with category icon 48 `primary` | Name link and `View profile` → `/providers/{id}` | Overlay badge `✓ Verified`; meta `{Category} · [MapPin] {Town}`; stars + `{4.9}` + `({212})`; `From` / `LKR 2,500 / hour` Δ; button `View profile` |
| S1.E11 | How it works | — | Anchor `#how-it-works`, scroll-margin 72 | Footer "How it works" scrolls here | H2 `How it works`; sub `Get the job done in three simple steps.`; `01 Search` — `Tell us what you need and where. We'll show local pros who do exactly that.`; `02 Compare` — `Check ratings, reviews, prices and Verified badges to pick the right fit.`; `03 Request` (accent tile) — `Send a service request with your details. The provider accepts and you're booked.` |
| S1.E12 | Provider CTA band | Viewer role | Provider: primary button becomes `Go to your dashboard` → `/dashboard` | `Join as a provider` → guest `/signup?intent=provider`; customer `/become-a-provider/1`. `Learn more` → `/for-providers` | H2 `Are you a service provider? Join us.`; p `List your business, get verified and receive requests from customers in your area — free to join.`; buttons `Join as a provider →`, `Learn more` |

#### S2 — Discover `/discover` · L1 · PROTOTYPE · F-06, F-07, F-08, F-29

**Purpose.** Search, filter and sort listed providers (BR-01 – BR-07). The URL is the source of truth (§8.2).

**Desktop layout.**
1. White search band (padding 28 32) holding the discover-variant search bar.
2. Main: max width 1240, padding 32 32 88. Grid `280px minmax(0,1fr)`, gap 32.
   - Left: sticky filter panel (r20, padding 24, gap 24, 1px dividers between groups).
   - Right: column, gap 20. A header row (count H1 and context on the left; "Sort by" select on the right), then result cards, then pagination.

**Phone layout (≤ 640). Tablet (641–1023) follows the same rules.**
1. **Search band** (padding 16): the search bar stacks as on S1 phone.
2. **Results header:** H1 (22/30) count with the context line below.
3. **Toolbar** (sticky under the nav, white, 1px bottom border, padding 8 16), split 50/50:
   - Left: **Filters** button (secondary, 44 high, `SlidersHorizontal`). When filters are applied it shows a `primary` count badge (20×20, white 12/800). The count is 1 per selected category, plus 1 each for location, rating ≠ Any, Verified only and price ≠ Any.
   - Right: **Sort** select, 44 high.
4. **Filters bottom sheet** (max height 88vh, content scrolls):
   - Header: `Filters` and a close `X`.
   - Body: the same groups as the desktop panel, in the same order. Category rows and rating options are 44 high.
   - Sticky footer: `Clear all` text button on the left; primary `Show {n} providers` on the right, which closes the sheet.
   - Filter changes apply live; the button shows the live count.
   - On tablet the sheet slides in from the right, 380 wide.
5. **Result cards:** padding 16, gap 12.
   - Grid of 72×72 photo (r12) beside a block of name, badges and rating.
   - Below that: a wrapping meta row, then the bio clamped to 2 lines.
   - Footer row: a 1px top border, "Starting at" price on the left, `View profile` (outline, 44 high) on the right. The vertical divider is removed.
   - Tablet (≥ 641) uses the desktop card.
6. **Pagination** collapses to `‹ Previous` · `Page 2 of 5` · `Next ›`.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S2.E1 | Search bar (discover variant) | `q`, `loc` from URL | Prefilled from the URL | Submit → new search (§8.2: keeps q, loc, cat derived by BR-02; resets rating, verified, price, page). Changing Location applies immediately (prototype) | As S1.E4 |
| S2.E2 | Filter panel header | — | — | `Clear all` → resets cat, loc, rating, verified, price, q, page (prototype clears q too) | `Filters` · `Clear all` |
| S2.E3 | Service category group | Active categories; count per category = providers matching all *other* active filters (BR-05) | Checked: `primary` box with ✓. Count 0 → row text `text-subtle`, still selectable | Toggle → add/remove from `cat` (OR); if the search text was a category match, it is cleared (prototype) | Group label `Service category`; rows `{name}` + `{count}` |
| S2.E4 | Location select | Locations grouped by district | — | Change → `loc` | Label `Location`; first option `All locations` |
| S2.E5 | Minimum rating | Any, 3.5+, 4.0+, 4.5+ | Selected: `primary` border, `primary-soft` bg. Stars show floor(value) filled | Pick → `rating` (BR-05: providers with no reviews only appear under Any) | Label `Minimum rating`; options `Any`, `3.5+`, `4.0+`, `4.5+` |
| S2.E6 | Verified toggle | `verified` | On: `success` track | Tap the whole row toggles (row is a switch, §9) | `Verified providers only` / `ID checked by Fixit` Δ |
| S2.E7 | Starting price | Any, ≤2,000, ≤5,000, ≤10,000 (BR-05) | Selected as S2.E5; header right shows the selection in `primary` 14/600 | Pick → `price` | Label `Starting price`; right label `Any price` / `Up to LKR 2,000` …; options `Any price`, `Up to LKR 2,000`, `Up to LKR 5,000`, `Up to LKR 10,000` Δ (replaces the $40–$100 slider) |
| S2.E8 | Results heading | Total count; context | — | none | H1 `{n} providers found` / `1 provider found`; context `Showing {label} in {Town \| all locations}` where label = one category name, `{k} categories`, `“{text}”`, or `all services` (Δ no ", TX") |
| S2.E9 | Sort select | `sort` | — | Change → `sort`, page reset to 1 | Label `Sort by`; options `Top rated`, `Most reviews`, `Based in your town first` Δ (replaces Nearest; BR-06) |
| S2.E10 | Result card ×≤10 | Provider: photo, businessName, verified, paused, rating, reviewCount, category (icon+name), baseTown, yearsExperience, bio, startingPrice + unit | Hover: `shadow-hover` + `border-strong`. Verified → green `✓ Verified` badge; unverified → `Not yet verified` pill (Δ, BR-01); paused → `Not taking requests` pill (F-22). 0 reviews → stars hidden, `New` pill (`primary-soft`/`primary` 12/700) + `No reviews yet` 14 subtle. No photo → `primary-soft` tile with category icon | Name and `View profile` → `/providers/{id}` (the profile's Back link returns to this exact URL) | meta `[Category icon] {Category}` · `[MapPin] {Town}` (Δ no distance) · `[Award] {n} yrs experience`; rating `({n} reviews)`; price `Starting at` / `LKR 2,500` + ` / hour`; button `View profile` |
| S2.E11 | Empty state | — | Shown when 0 results | `Clear filters` = S2.E2 Clear all | `No providers match your filters` / `Try another location or loosen the rating and price filters.` / `Clear filters` |
| S2.E12 | Pagination (new) | `page`, total pages (10 per page) | Hidden when 1 page. Current page: `primary` bg, white | Page links update `page` and scroll to the results heading | `Previous` · `1 2 3 … 8` · `Next` |

#### S3 — Provider profile `/providers/:id` · L1 · PROTOTYPE · F-09, F-10, F-22, F-23, F-29

**Purpose.** Help a visitor decide on a provider and start a request.

**Desktop layout.** Main: padding 24 32 88, gap 24.
1. Back link.
2. Header card: r24, padding 28. Grid `220px 1fr auto`, gap 32. The action column has a left border and padding-left 32.
3. Below: grid `minmax(0,1fr) 380px`, gap 24.
   - Left column (gap 24): About, Services offered, Reviews.
   - Right: sticky Service area aside.

**Phone layout (≤ 640).**
1. Back link.
2. Header card (r20, padding 20). Top row: 88×88 photo (r16) beside the category line and H1 (28/36). Below it, stacked: owner line; meta items, one per line (rating, town, experience); badges row.
3. Action column becomes a **sticky bottom bar**:
   - White, 1px top border, padding 12 16 plus safe-area inset.
   - Left: `Starting at` (12) over the price (20/800).
   - Right: `Request Service` (primary, 48, flex 1). If F-10 ships, a 48×48 Save icon button (Heart, aria-label `Save` / `Saved`) sits beside it.
   - Page bottom padding grows by the bar's height.
4. Sections stack: About → Services offered → Service area → Reviews.
5. Services rows wrap the name; the price is right-aligned with min-width auto.
6. The tooltip opens below the badge, width min(280, 100vw − 32), clamped to the viewport.

**Tablet:** header grid `160px 1fr`, with the action column as a full-width row underneath. The aside moves under Reviews.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S3.E1 | Back link | Last Discover URL (session) | No Discover visit in session → `/discover` | Navigate | `[ArrowLeft] Back to results` |
| S3.E2 | Photo | photoUrl | None → 220 `primary-soft` tile with category icon 64 `primary` | none | alt `{Business name}` |
| S3.E3 | Identity | categoryName/icon, businessName, ownerName | — | none | `[icon] {Category}`; H1 `{Business}`; `Owned & run by {Owner name}` |
| S3.E4 | Meta row | rating, reviewCount, baseTownName, yearsExperience | 0 reviews → `New` pill + `No reviews yet` (no link) | `{n} reviews` link smooth-scrolls to `#reviews` (offset 88) | stars + `{4.9}` + `{212} reviews`; `[MapPin] {Town}` Δ (no ", TX"); `[Award] {n} years experience` |
| S3.E5 | Verified badge + tooltip | verificationStatus | Verified → green badge with `Info` 16. Otherwise → `Not yet verified` pill. Paused → also `Not taking requests` pill | Tooltip opens on hover, keyboard focus, **and** tap/click (toggles); closes on Esc, tap outside, blur, mouse leave. The badge is a `button` with `aria-describedby` → tooltip (§9) | Badge `✓ Verified`; tooltip title `What does Verified mean?`; body `Fixit has checked this provider's national ID and, where listed, their trade qualification.` Δ (BR-20) |
| S3.E6 | Price block | startingPrice + unit (BR-10) | Fixed-only → `LKR 15,000` + ` fixed` | none | `Starting at` / `LKR 2,500` + ` / hour` |
| S3.E7 | Request Service button | Viewer, eligibility (§8.3) | See the "Request Service states" table below | See table | `[Send] Request Service` |
| S3.E8 | Save button (F-10, Could) | saved? | Unsaved: white + `primary-soft-border`. Saved: `primary-soft` bg + `primary` border + filled heart. Hidden if F-10 not built, for admins, and on the viewer's own listing | Guest → `/login?next=/providers/{id}`; signed in → toggles optimistically (§8.1) | `Save` / `Saved` |
| S3.E9 | About | bio | — | none | H2 `About` |
| S3.E10 | Services offered | Services (name, price, unit) | Fixed price: no `from` label | none | H2 `Services offered`; rows `[CircleCheck] {name}` `from` `LKR 2,500 / hour` (or `LKR 15,000 fixed`); note `Final price is confirmed by the provider after reviewing your request.` |
| S3.E11 | Reviews | Visible reviews, newest first, 5 at a time; rating summary | 0 → empty card (dashed, compact): `No reviews yet` / `{Business} is new on Fixit. Reviews appear here after completed jobs.` | `Show more reviews` (secondary 40) loads 10 more; hidden when all are shown | H2 `Reviews`; summary `★ {4.9} · {212} reviews`; review: initials avatar (44×44 circle Δ, prototype 44×48), `{Sarah K.}`, `{12 Sep 2026}` Δ, stars, text |
| S3.E12 | Provider reply (F-23) | review.reply | Shown under the review text when present | none | Block: left 3px `primary-soft` border, `page` bg, r12, padding 12 14; `Response from {Business}` 13/700 + `{reply}` 14/22 muted |
| S3.E13 | Service area | Base town + other towns | — | none | H2 `Service area`; rows `[MapPin] {Town}` + `Based here` on the base town (first; the rest alphabetical) Δ map placeholder removed |
| S3.E14 | Not found | — | Unknown id, suspended, or onboarding incomplete (BR-01, BR-41) → only this box (+ back link) | Link → `/discover` | `This provider couldn't be found.` `Browse all providers` |

**Request Service states (S3.E7)** — evaluated in this order:
| Condition | Rendering | Click | Helper text (13 `text-muted`, under the button) |
|---|---|---|---|
| Viewer is admin | Hidden | — | — |
| Viewer owns this listing (BR-16) | Replaced by outline `[Pencil] Edit your listing` | → `/dashboard/profile` | `This is your listing.` |
| Provider paused (BR-15) | Disabled primary | — | `{Business} isn't taking new requests right now.` |
| Guest | Enabled | → `/login?next=/providers/{id}/request` (F-04) | — |
| Has an open request with this provider (BR-33) | Outline `View your request` | → `/requests/{ref}` | `You already have an open request with {Business}.` |
| Has 5 open requests (BR-33) | Disabled primary | — | `You have 5 open requests. Wait for one to finish or cancel one to send another.` |
| Otherwise | Enabled | → `/providers/{id}/request` (S12 handles email/mobile prerequisites) | — |

#### S4 — For providers `/for-providers` · L1 · INFERRED · F-15

**Purpose.** Explain the provider offer and start onboarding. Built from S1 patterns.

**Desktop layout.** White hero band (padding 72 32 72), one centred column, max 720. Then a 3-step "How it works" grid (S1.E11 pattern). Then a "What you'll need" card (max 720, centred). Then the CTA band (S1.E12 pattern).

**Phone.** Same blocks stacked with S1 phone rules; buttons full width.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S4.E1 | Eyebrow pill (success) | — | — | — | `Free to join` |
| S4.E2 | H1 + lead | — | — | — | H1 (`title-xl`) `Get local jobs without paying to join.`; lead `List your business on Fixit, get verified and receive requests from customers in the Western Province. Customers pay you directly — Fixit takes no commission.` |
| S4.E3 | Primary CTA | Viewer role | Provider → `Go to your dashboard` | Guest → `/signup?intent=provider`; customer → `/become-a-provider/1`; provider → `/dashboard` | `Join as a provider` |
| S4.E4 | Steps | — | — | — | H2 `How it works for providers`; `01 Create your listing` — `Add your business, services, prices and the towns you cover.` (`BriefcaseBusiness`); `02 Get verified` — `Upload your NIC, and your trade certificate if you have one. We check it and add the Verified badge.` (`ShieldCheck`); `03 Receive requests` (accent) — `Accept the jobs that suit you, contact the customer and get paid directly.` (`Inbox`) |
| S4.E5 | What you'll need | — | — | — | H2 `What you'll need`; list with `CircleCheck` icons: `A mobile number`, `Your NIC (front and back)`, `Your prices for each service`, `Optional: trade certificate or NVQ, business registration` |
| S4.E6 | CTA band | — | As S4.E3 | As S4.E3 | H2 `Ready to get started?`; p `It takes about 10 minutes to set up your listing.`; button `Join as a provider →` |

#### S5 — Log in `/login` · L1-auth · INFERRED · F-01, F-02, F-04

**Purpose.** Sign in, then return to where the user was going (`next`).

**Layout.** Auth card (§3). Phone: full-width card; buttons are 48 high and full width.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S5.E1 | Title | — | — | — | `Log in to Fixit` / sub `Welcome back.` |
| S5.E2 | Context banner (info) | `next` points at a request form → provider name | Only when `next=/providers/{id}/request` | — | `Log in to send your request to {Business}.` |
| S5.E3 | Google button | — | Loading: spinner and disabled | Google OAuth → back to `next` | `Continue with Google` (secondary 48, Google "G" mark) |
| S5.E4 | Divider | — | — | — | `or` |
| S5.E5 | Form | — | Submitting: button `Logging in…`, disabled | Submit → §8.4 | Button `Log in` |
| S5.E6 | Forgot link | — | — | → `/forgot-password` (email prefilled) | `Forgot password?` (right-aligned on the Password label row) |
| S5.E7 | Footer | — | — | → `/signup` (keeps `next`) | `New to Fixit?` `Sign up` |
| S5.E8 | Form-level error banner (danger) | — | Shown after server rejection | — | Wrong credentials: `That email and password don't match. Try again or reset your password.` · Suspended: `Your account is suspended. If you think this is a mistake, email us at {contact email}.` · Rate limited: `Too many attempts. Wait a few minutes and try again.` · Google cancelled: `Google sign-in was cancelled. Try again or use your email.` |

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Email | email, autocomplete `email` | yes | Trimmed, valid email format | Empty: `Enter your email address.` · Invalid: `Enter a valid email address, like name@example.com.` |
| Password | password with show/hide toggle (`Eye`/`EyeOff`, 44 target, label `Show password`) | yes | Non-empty | `Enter your password.` |

**Success redirect:** `next` if present and same-site; otherwise providers go to `/dashboard` and customers to `/`. Unconfirmed email accounts can log in; the global unconfirmed banner shows (§6.8).

#### S6 — Sign up `/signup` · L1-auth · INFERRED · F-01, F-02, F-04

**Purpose.** Create an account (every account is a customer, BR-35). `?intent=provider` sends the user into onboarding afterwards. `?next=` is preserved through confirmation.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S6.E1 | Title | intent | Provider intent variant | — | `Create your Fixit account` / sub `Book trusted local pros in minutes.` · Provider: `Join Fixit as a provider` / sub `Create an account first — next you'll set up your listing.` |
| S6.E2 | Google button | — | As S5.E3 | New Google account → already confirmed (F-02) → `next`, or `/become-a-provider/1` for provider intent | `Continue with Google` |
| S6.E3 | Form | — | Submitting: `Creating account…` | Success → S7 | Button `Create account` |
| S6.E4 | Consent line | — | — | Link → `/privacy` (new tab) | `By signing up you agree to our Privacy policy.` (13 muted) |
| S6.E5 | Footer | — | — | → `/login` (keeps `next`) | `Already have an account?` `Log in` |

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Full name | text, autocomplete `name` | yes | Trimmed, 2–80 characters | Empty: `Enter your full name.` · Length: `Name must be 2 to 80 characters.` |
| Email | email | yes | Valid format; not already registered | Empty/invalid as S5 · Taken: `This email already has an account.` + link `Log in instead` |
| Password | password, autocomplete `new-password`, show/hide | yes | ≥ 8 characters, at least one letter and one number | `Use at least 8 characters with a letter and a number.` |

Help under Password (13 muted, replaced by the error when invalid): `At least 8 characters, with a letter and a number.`

#### S7 — Check your email `/signup/check-email` · L1-auth · INFERRED · F-01

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S7.E1 | Icon + title + body | email | — | — | `Mail` tile; `Check your email`; `We sent a confirmation link to {email}. Open it to confirm your account — the link works for 24 hours.` |
| S7.E2 | Resend button | — | 60-second cooldown: disabled, label `Resend in 0:45` | Resend → toast `Email sent again.` | `Resend email` (secondary 48) |
| S7.E3 | Change email | — | — | → `/signup` | `Use a different email` (link) |
| S7.E4 | Note | — | — | `Browse providers` → `/discover` | `You can browse Fixit while you wait, but you'll need to confirm your email before sending a request or setting up a listing.` + link `Browse providers` |

#### S8 — Confirm email result `/auth/confirm?token=` · L1-auth · INFERRED · F-01

| State | Icon tile | Title | Body | Button |
|---|---|---|---|---|
| Success | `CircleCheck`, `success-soft`/`success` | `Email confirmed` | `You're all set.` | `Continue` → stored `next`, or `/become-a-provider/1` (provider intent), or `/` |
| Already confirmed | same | `Your email is already confirmed` | `You can carry on where you left off.` | `Continue` |
| Expired / invalid | `TriangleAlert`, `warning-soft`/`warning-text` | `This link has expired` | `Confirmation links work for 24 hours. We can send you a new one.` | Signed in: `Send a new link` → toast `Email sent again.` · Signed out: `Log in to resend` → `/login` |
| Loading | skeleton title + body lines | — | — | — |

#### S9 — Forgot password `/forgot-password` · L1-auth · INFERRED · F-01

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S9.E1 | Title | — | — | — | `Reset your password` / sub `Enter your account email and we'll send you a reset link.` |
| S9.E2 | Email field + button | — | Submitting `Sending…` | Submit → the same success state whether or not the account exists (no account enumeration) | Field as S5; button `Send reset link` |
| S9.E3 | Sent state (replaces the form) | email | — | `Back to log in` → `/login` | `Mail` tile; `Check your email`; `If an account exists for {email}, you'll get a reset link in a few minutes. It works for 1 hour.` |

#### S10 — Reset password `/reset-password?token=` · L1-auth · INFERRED · F-01

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S10.E1 | Title | — | — | — | `Choose a new password` |
| S10.E2 | Form | — | Submitting `Saving…` | Success → `/login` + toast `Password updated. Log in with your new password.` | Button `Save new password` |
| S10.E3 | Invalid / expired token | — | Replaces the form | `Request a new link` → `/forgot-password` | `TriangleAlert` tile; `This reset link has expired`; `Reset links work for 1 hour. Request a new one.` |

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| New password | password, show/hide | yes | As S6 | `Use at least 8 characters with a letter and a number.` |
| Confirm new password | password | yes | Equals New password | `Passwords don't match.` |

#### S11 — About · Contact · Privacy · L1 · INFERRED · F-37

**Layout.** Main padding 48 32 88. White article card, max 720, centred, r20, padding 40 (phone: padding 24, gutter 16). H1 `title-lg`; H2 `title-md` with margin-top 32; body 16/26 `text-muted`; links `primary`.

| Page | Content |
|---|---|
| About `/about` | H1 `About Fixit`. Body: `Fixit helps households in the Western Province find a trusted local plumber, electrician, cleaner or other home-service pro, compare them on reviews, prices and verification, and send a job request in minutes.` H2 `How Fixit works` — `You choose a provider and send a request. They accept or decline. You agree the final price and pay the provider directly — Fixit doesn't handle payments or take a commission.` H2 `What "Verified" means` — the BR-20 tooltip sentence. |
| Contact `/contact` | H1 `Contact us`. `Email us at {contact email} and we'll reply within 2 working days.` H2 `Deleting your account` — `To delete your account, email us from the address you signed up with.` (stands in for F-40). H2 `Problems with a job` — `Contact the provider first using the phone number shown on your request. If that doesn't work, email us with your request reference (like FX-2061).` |
| Privacy `/privacy` | H1 `Privacy`. Fixed headings, with body copy to come from the legal draft (PRODUCT §11): `What we collect` · `Your national ID and other documents` · `Who sees your details` · `How long we keep it` · `Your choices` · `Contact`. Until the draft exists, each section shows `Content coming before launch.` in 15 subtle, and the page must not ship like that. |

### 5.B Customer

#### S12 — Request form `/providers/:id/request` · L1 · INFERRED · F-11, F-14, F-04, F-03, F-39

**Purpose.** Send one request for one listed service (PRODUCT §6.2). Guests are redirected to `/login?next=…` (F-04).

**Desktop layout.** Main max-width 1240, padding 24 32 88.
1. Back link `Back to {Business}`.
2. H1 `title-lg` with a subtitle.
3. Grid `minmax(0,1fr) 380px`, gap 24.
   - Left: form card (r20, padding 28, field gap 24).
   - Right: sticky summary card (top 96): provider mini row (56 photo r12, name 17/700, Verified badge or `Not yet verified`, rating line); the selected service and price; the BR-11 note; a "What happens next" list.

**Phone layout.**
1. Back link and H1 (22/30).
2. A compact provider row (48 photo, name, rating) replaces the summary card.
3. Form fields full width. Service options are full-width cards. Time slot is a 3-column segmented control, 48 high.
4. "What happens next" moves below the form as a plain list.
5. Sticky bottom bar holds `Send request` (full width, 48).

**Blocked states** replace the form card with an empty-state card (§2.9). They are evaluated in this order:
| Condition | Icon | Title | Body | Buttons |
|---|---|---|---|---|
| Own listing (BR-16) | `Lock` | `You can't request your own listing` | `Customers see this page when they want to book you.` | `Go to your dashboard` |
| Provider not listed / suspended | → S39 provider variant | | | |
| Provider paused (BR-15) | `PauseCircle` | `{Business} isn't taking new requests right now` | `Try again later or choose another provider.` | `Find another provider` → `/discover?cat={cat}&loc={loc}` |
| Email not confirmed (F-01) | `Mail` | `Confirm your email first` | `We sent a link to {email}. Confirm it, then come back to send your request.` | `Resend email` · `Back to profile` |
| Open request with this provider (BR-33) | `Inbox` | `You already have an open request with {Business}` | `You can send another once this one is finished.` | `View request` |
| 5 open requests (BR-33) | `Inbox` | `You have 5 open requests` | `You can have up to 5 open requests at a time. Cancel one or wait for one to finish.` | `Go to my requests` |

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S12.E1 | Header | businessName | — | Back → `/providers/{id}` | H1 `Request a service`; sub `from {Business}`; back `Back to {Business}` |
| S12.E2 | Form fields | See field table | — | — | — |
| S12.E3 | Final price note | — | — | — | `Final price is confirmed by the provider after reviewing your request.` (BR-11, 13 subtle, above the submit button) |
| S12.E4 | Submit | — | Submitting: `Sending…`, disabled, spinner | Valid → create request (§8.3) → S13 | `[Send] Send request` |
| S12.E5 | Cancel | form dirty? | Dirty → confirm dialog | → `/providers/{id}` | Link `Cancel`; dialog `Discard this request?` / `Your details won't be saved.` / `Keep editing` · `Discard` |
| S12.E6 | Server error banner | — | After a failed submit | — | Paused/suspended in the meantime: `{Business} can't take requests right now. Your request wasn't sent.` · Limit hit: limit copy above · Date became invalid: `That date is no longer available. Choose another date.` · Other: §6.3 |
| S12.E7 | What happens next (summary card) | expiry rule | — | — | H3 `What happens next`; `{Business} has up to 3 days to accept or decline.` · `We'll email you as soon as they reply.` · `Their phone number is shown once they accept.` |

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Service | Radio cards: one per listed service with name 15/600 + price label (BR-09) | yes | One of the provider's current services | `Choose a service.` |
| Preferred date | Date picker (native on phone). Min = tomorrow, max = today + 60 days, Asia/Colombo (BR-34) | yes | Within range | Empty: `Choose a date.` · Range: `Choose a date from {tomorrow} to {max date}.` Help: `Same-day bookings aren't available.` |
| Time slot | Segmented radio: `Morning` · `Afternoon` · `Evening` | yes | One of the three | `Choose a time slot.` |
| Town | Select, limited to the provider's service areas (base town first). Prefilled from the Discover `loc` if it's in the list | yes | In the provider's areas | `Choose your town.` Help: `{Business} works in these towns.` |
| Address line 1 | text, autocomplete `address-line1` | yes | Trimmed 5–120 characters | Empty: `Enter your address.` · Short: `Enter a fuller address so the provider can find you.` · Long: `Keep each address line under 120 characters.` |
| Address line 2 | text, autocomplete `address-line2` | no | ≤ 120 characters | `Keep each address line under 120 characters.` Help (under the pair): `Only shared with {Business} if they accept.` |
| Description | Textarea, 5 rows, live counter `{n} / 1,000` | yes | Trimmed 20–1,000 characters | Short: `Describe the job in at least 20 characters.` · Long: `Keep the description under 1,000 characters.` Placeholder: `What needs doing? Include anything that helps the provider quote — the problem, the size of the job, access details.` |
| Mobile number | If the profile has one: read-only row `Your mobile: {+94 77 123 4567}` + link `Change` (→ `/account`). If missing: tel input with fixed `+94` prefix | yes (BR-23) | Sri Lankan mobile: 9 digits starting with 7 after +94; a leading 0 is accepted and dropped; spaces ignored | `Enter a Sri Lankan mobile number, like 077 123 4567.` Help: `Saved to your account. {Business} sees it only after accepting.` |
| Photos (F-39, Could) | — | — | Hidden in v1 unless built | — |

#### S13 — Request sent `/requests/:ref/sent` · L1 · INFERRED · F-11

**Layout.** Centred card, max 560, r20, padding 32 (phone: 24, gutter 16), on `page`.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S13.E1 | Icon + title | businessName | — | — | `CircleCheck` tile (`success-soft`/`success`); H1 (`title-md`) `Request sent to {Business}` |
| S13.E2 | Body | expiresAt | — | — | `We've emailed {Business}. They have until {Sat, 21 Nov, 3:42 PM} to accept or decline — we'll email you as soon as they reply.` |
| S13.E3 | Summary | ref, service, date, slot, town, status | — | — | Definition list: `Reference` `FX-2061` (mono) · `Service` · `Date` `{Sat, 21 Nov 2026} · {Morning}` · `Town` · `Status` [Pending pill] |
| S13.E4 | Actions | — | — | `View request` → `/requests/{ref}`; `Back to search` → last Discover URL or `/discover` | Primary `View request`; secondary `Back to search` |

If the request is no longer Pending when this route loads, redirect to S15.

#### S14 — My requests `/requests` · L2 · INFERRED · F-12, F-25

**Desktop layout.**
1. L2 page header and section tabs.
2. A card (r20, overflow hidden) with a header row: H2 (`title-md`) and status filter tabs (segmented, S20 pattern).
3. Below it, the table: columns Provider · Service · Date · Town · Status (S20 table pattern, `1.4fr 1.3fr 1fr .9fr 240px`).

**Phone layout.**
1. Status filter tabs scroll sideways.
2. Each request is a card (r16, padding 16, gap 8):
   - Row 1: provider name (15/700) and the status pill (compact).
   - Row 2: ref (mono).
   - Row 3: service (14/600).
   - Row 4: `CalendarDays` date · slot · `MapPin` town (13 muted).
   - Row 5 (optional): action button, full width, 44 high.
3. The whole card is a link.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S14.E1 | Page header | — | — | — | H1 `My requests`; sub `Track the requests you've sent.` |
| S14.E2 | Status tabs | Counts per group | — | Sets `?status=`; page resets | `All` · `Open` (Pending + Accepted) · `Completed` · `Closed` (Declined + Cancelled + Expired), each with its count |
| S14.E3 | Row / card ×≤20 | Request: provider (photo 36 r10, businessName), ref, serviceName, servicePriceLabel, preferredDate, slot, townName, status | Hover: `page` bg. Accepted: under the pill, a 13 muted line `[Phone] Contact details shown`. Completed + review eligible: outline small button `Leave a review` | Row → `/requests/{ref}`; `Leave a review` → `/requests/{ref}/review` | Date `{Sat, 21 Nov}` + slot under it |
| S14.E4 | Order | — | — | — | Most recently updated first |
| S14.E5 | Pagination | 20 per page | Hidden when 1 page | `?page=` | As S2.E12 |
| S14.E6 | Empty (no requests at all) | — | — | `Find providers` → `/discover` | `Inbox` tile; `No requests yet`; `Find a provider and send your first request.`; button `Find providers` |
| S14.E7 | Empty (filter) | — | — | — | `No requests with this status.` (prototype copy, centred 15 subtle, padding 40) |

#### S15 — Request detail (customer) `/requests/:ref` · L2 · INFERRED · F-12, F-13, F-27, F-28

**Desktop layout.**
1. Back link `Back to my requests`.
2. Header row: H1 service name (`title-lg`); under it, the mono ref, the status pill and `with {Business}` (link).
3. Grid `minmax(0,1fr) 380px`, gap 24.
   - Main column (gap 24): status panel, Details card, History card.
   - Aside (sticky top 96): provider card.

**Phone layout.** One column: back link, header, status panel, provider card, details, history. Panel action buttons are full width.

**Status panel** (a card with a coloured top border, 4px, in the status dot colour; title `title-md` + body 15 muted + actions):
| Status | Title | Body | Actions |
|---|---|---|---|
| Pending | `Waiting for {Business} to reply` | `They have until {expiresAt} to accept or decline. We'll email you either way.` | `Cancel request` (danger-outline) |
| Accepted | `{Business} accepted your request` | Contact block (S15.E4). Agreed price line if set: `Agreed price: LKR 6,500` + 13 subtle `For your records — you pay the provider directly.` (BR-12). Before the cut-off: `You can cancel until 11:59 PM on {day before preferred date}.` After the cut-off: `It's too late to cancel online. Contact {Business} directly.` | `Cancel request` (only before the cut-off, BR-30) |
| Completed | `Job completed on {completedAt date}` | Agreed price line if set | Review block (S15.E6) |
| Declined | `{Business} declined this request` | `Reason: {reason}` if given; system decline: `Reason: Provider unavailable` | `Find another provider` → `/discover?cat={cat}&loc={town}` |
| Cancelled (by you) | `You cancelled this request` | `Reason: {reason}` if given | `Find another provider` |
| Cancelled (by admin) | `Fixit cancelled this request` | `Reason: {reason}` | `Find another provider` |
| Cancelled (system, provider suspended) | `This request was cancelled` | `Reason: Provider unavailable` | `Find another provider` |
| Expired | `This request expired` | `{Business} didn't reply in time.` | `Find another provider` |

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S15.E1 | Header | serviceName, ref, status, businessName | — | Provider link → profile (if still listed) | `with {Business}` |
| S15.E2 | Status panel | See table | See table | Cancel → dialog (§8.3) | See table |
| S15.E3 | Provider card | photo, businessName, verified, rating | Provider no longer listed → name without link + 13 subtle `No longer on Fixit` | `View profile` | `View profile` |
| S15.E4 | Contact block | provider mobile (Accepted, Completed only — §6.3) | Hidden in other statuses | `Call` = `tel:` link; `Copy` → toast `Number copied.` | Label `{Business}'s mobile`; value `+94 77 123 4567`; buttons `[Phone] Call` (primary 40) · `Copy` (secondary 40) |
| S15.E5 | Details card | serviceName + price label (copied at creation), preferredDate, slot, townName, address lines, description, customer mobile | — | — | H2 `Request details`; labels `Service`, `Preferred date`, `Time slot`, `Town`, `Address`, `Description`, `Your mobile` |
| S15.E6 | Review block (Completed) | review eligibility, own review | Eligible, not reviewed: H3 `How did it go?` + `You can review until {completedAt + 30 days}.` + primary `Leave a review`. Reviewed: `Your review` + stars + text (+ `Hidden` pill if hidden by an admin). Window closed: `The review window for this job has closed.` | `Leave a review` → S16 | — |
| S15.E7 | History | status history entries | — | — | H2 `History`; vertical timeline (8px dots in status colours, 1px `border` line): `{Status}` 14/600 · `{21 Nov 2026, 3:42 PM}` 13 subtle · actor `by you` / `by {Business}` / `by Fixit` / `automatically` |

#### S16 — Leave a review `/requests/:ref/review` · L2 · INFERRED · F-28

**Layout.** Back link `Back to request`. Card max 640, r20, padding 28 (phone: 20). Top: provider mini row (48 photo, business name) and a context line `{FX-2061} · {Service} · completed {date}`. Phone: sticky bottom bar with `Post review`.

Ineligible (BR-24, BR-25): already reviewed → redirect to S15. Window closed or not Completed → in-card message `The review window for this job has closed.` (or S39 if not the owner).

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Rating | 5-star radio group. Each star is a 44×44 target; hover/focus previews and shows a label: `Poor`, `Fair`, `Good`, `Very good`, `Excellent` | yes | 1–5 | `Choose a star rating.` |
| Review | Textarea, 6 rows, counter `{n} / 1,000` | yes | Trimmed 10–1,000 characters (BR-26) | Short: `Write at least 10 characters.` · Long: `Keep your review under 1,000 characters.` Placeholder: `What went well? What could have been better?` |

| ID | Element | Copy |
|---|---|---|
| S16.E1 | Title | H1 `Review {Business}` |
| S16.E2 | Notice (13 muted, above the button) | `Reviews can't be edited after posting. Your name shows as {Sarah K.}.` |
| S16.E3 | Submit | `Post review` / submitting `Posting…` → S15 + toast `Thanks — your review is live.` |

#### S17 — Saved providers `/saved` · L2 · INFERRED · F-10 (Could)

**Layout.** Grid of featured cards (S1.E10 pattern): 4 columns desktop, 2 tablet, 1 phone. A 40×40 white circular `Heart` button (filled, `primary`, `shadow-badge`, aria-label `Remove from saved`) sits top-right on each photo.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S17.E1 | Header | — | — | — | H1 `Saved providers`; sub `Providers you've saved for later.` |
| S17.E2 | Card ×N | saved providers (listed only; suspended or unlisted ones are left out) | — | Heart → optimistic remove + Undo toast (§8.1) | Toast `Removed {Business} from saved.` + `Undo` |
| S17.E3 | Empty | — | — | `Find providers` → `/discover` | `Heart` tile; `No saved providers yet`; `Tap Save on a provider's profile to keep them here.`; `Find providers` |

#### S18 — Account settings `/account` · L2 · INFERRED · F-03, F-01, F-40

**Layout.** One column of cards, max 720 (r20, padding 28, gap 20). Each card has its own Save button, bottom-right (phone: full width). Phone: card padding 20.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S18.E1 | Your details card | name, mobile, email, emailConfirmed | Unconfirmed: email row shows `Not confirmed` pill (Pending style) + link `Resend email` | Save → toast `Changes saved.` | H2 `Your details`; email row `Email` (read-only) + `Confirmed` / `Not confirmed`; help `Your email is never shown to providers.` |
| S18.E2 | Password card | authMethods | Google-only account → replaced by the text `You sign in with Google.` | Save → toast `Password updated.` | H2 `Password`; button `Update password` |
| S18.E3 | "I offer services" card (F-03) | isProvider, businessName, onboardingStep | Not a provider: switch off. Provider: switch on and disabled + text | Off → on: navigate to `/become-a-provider/{resume step}`. A draft in progress shows `Continue setting up your listing` | H2 `I offer services`; off: `List your business on Fixit and receive job requests.` · on: `You're listed as {Business}.` + link `Go to your dashboard` + 13 subtle `To stop new requests for a while, pause them in your dashboard settings.` |
| S18.E4 | Delete account (F-40) | — | Self-service hidden unless F-40 ships | — | 13 muted line at the page bottom: `To delete your account, email us at {contact email}.` |

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Full name | text | yes | 2–80 | As S6 |
| Mobile number | tel with `+94` prefix | Customers: no (needed before sending a request). Providers: yes | As S12 | Format: as S12 · Provider clearing it: `Providers need a mobile number — customers use it after you accept.` |
| Current password | password | yes (password card) | Matches the current password (server) | `Current password is incorrect.` |
| New password | password | yes | As S6; different from current | Rule as S6 · Same: `Choose a password you haven't just used.` |
| Confirm new password | password | yes | Equals new | `Passwords don't match.` |

#### S19 — Become a provider `/become-a-provider/:step` · L1 · INFERRED · F-15, F-03

**Purpose.** Five-step wizard. Each step saves a draft on Continue, so the user can leave and come back at the same step. Finishing publishes the listing as "Not yet verified" (BR-01).

**Gate.** Email must be confirmed; otherwise the S12 "Confirm your email first" card is shown. A completed provider opening this route goes to `/dashboard`.

**Desktop layout.**
1. Main padding 40 32 88, column max 720, centred.
2. Stepper: `Step {n} of 5 · {Step title}` (14/600 muted) over a 5-segment progress bar (segments gap 4, height 6, `primary` done/current, `primary-soft` todo).
3. Step card: r20, padding 28. H1 `title-lg`, sub 15 muted, fields.
4. Footer row: `Back` (secondary) on the left; `Continue` (primary) on the right.

**Phone layout.** Padding 20 16. The stepper stays; the card loses its border (padding 0, on `page`). The footer becomes a sticky bottom bar with `Back` (secondary, 1/3) and `Continue` (primary, 2/3).

| Step | Title / sub | Fields |
|---|---|---|
| 1 | `Business details` / `This is what customers see first.` | Business name, Short bio, Years of experience, Mobile (only if missing). Read-only line `Owner: {account name}` + 13 subtle `Change your name in Account settings.` |
| 2 | `Category` / `Choose the one category that fits your work best.` | Category radio cards (icon tile, name, blurb; 2 columns desktop, 1 phone). Note (13 muted): `You can only choose one category. Changing it later means we check your documents again.` |
| 3 | `Services & prices` / `Add the services you offer. Your lowest price shows as "Starting at".` | Services repeater (same editor as S23, inline rows) |
| 4 | `Service areas` / `Where do you work? Customers in these towns can find you.` | Base town, Other towns (as S25) |
| 5 | `Profile photo` / `A clear photo of you or your logo builds trust.` | Photo upload (as S24.E2); `Skip for now` link next to the publish button |
| Done `/become-a-provider/done` | `CircleCheck` tile; `Your listing is live` / `Customers can now find {Business}. It shows as "Not yet verified" until you upload your ID.` | Buttons `Get verified` (primary → `/dashboard/verification`) · `Go to dashboard` (secondary) |

Buttons: steps 1–4 use `Continue` (submitting `Saving…`); step 5 uses `Publish listing` (submitting `Publishing…`). `Back` on step 1 goes to the previous page.

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Business name | text | yes | Trimmed 2–60 | Empty: `Enter your business name.` · Length: `Business name must be 2 to 60 characters.` |
| Short bio | Textarea, counter `{n} / 600` | yes | 30–600 | Short: `Tell customers about your business in at least 30 characters.` · Long: `Keep your bio under 600 characters.` |
| Years of experience | number, step 1 | yes | Integer 0–60 | `Enter a number from 0 to 60.` |
| Mobile number | As S12 | yes if missing (BR-23) | As S12 | As S12 |
| Category | Radio cards | yes | One active category | `Choose a category.` |
| Services | Repeater, 1–20 rows (BR-14) | ≥ 1 | Per row: see S23 | `Add at least one service.` |
| Base town | Select grouped by district | yes | Active town | `Choose your base town.` |
| Other towns | Checkbox list grouped by district; base town excluded; counter `{n} of 9 selected` | no | ≤ 9 (BR-14) | At 9, unchecked boxes are disabled with help `You can add up to 9 other towns.` |
| Photo | Image upload | no | As S24 | As S24 |

### 5.C Provider

#### S20 — Provider overview `/dashboard` · L3 · PROTOTYPE · F-17, F-18, F-21, F-22

**Purpose.** See today's workload at a glance and respond to new requests.

**Desktop layout** (prototype). Main gap 28, in this order:
1. Header row (flex, space-between, align end, wrap).
2. Stat tiles: 4 columns, gap 16.
3. Requests section (r20).
4. A grid `repeat(auto-fit,minmax(320px,1fr))`, gap 24, holding Profile completeness and My Services.

**Phone layout.**
1. **Header:** date line, H1 (28/36), sub. Then a full-width availability row (switch + label, 48 high, white card r14), then a full-width `View public profile` outline button (44).
2. **Stats:** 2×2 grid, gap 12. Tiles have padding 16 and a 36 icon tile; the value is 28/36 with the sub on its own line.
3. **Requests section:**
   - Header stacks: H2, then tabs in a sideways-scrolling track.
   - The table becomes a card list, one card per row with an internal 1px top border, padding 16.
   - Card rows: initials avatar 36 + name + ref, with the status pill on the right; service (14/600) and note (1 line, ellipsis); `CalendarDays` date · slot · `MapPin` area (13 muted).
   - Pending cards add a button row: `Accept` (primary) and `Decline` (secondary), each 50%, 44 high.
4. **Bottom cards:** stacked, padding 20.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S20.E1 | Date line | Today (Asia/Colombo) | — | — | `{Sun, 22 Nov 2026}` Δ (was fixed "Friday, October 9, 2026") |
| S20.E2 | Greeting | owner first name, local time | Morning 05:00–11:59, afternoon 12:00–16:59, evening otherwise Δ | — | `Good morning, {Marcus}` / `Good afternoon, …` / `Good evening, …` |
| S20.E3 | Greeting sub | pending count | 0 → caught-up copy | — | `You have {3} new requests waiting for a reply.` / `You have 1 new request waiting for a reply.` / `You're all caught up.` |
| S20.E4 | Availability switch (F-22) Δ | paused | On (taking requests): `success` track. Off: `border-strong` track + label in `warning-text` | Toggle → §8.3 pause/resume; toast | Label on: `Taking requests`; off: `Paused` (switch aria-label `Taking new requests`) |
| S20.E5 | View public profile | providerId | — | → `/providers/{id}` (new tab) | `[Eye] View public profile` |
| S20.E6 | Stat tiles ×4 | counts, rating | Rating with 0 reviews → value `New`, sub `no reviews yet` | Each tile links: New requests → `/dashboard/requests?status=pending`; Accepted → `?status=accepted`; Completed → `?status=completed`; Average rating → `/dashboard/reviews` (if built) | `New requests` / `{n}` / `awaiting reply` (`Inbox`, warning tint) · `Accepted` / `{n}` / `upcoming jobs` (`CalendarCheck`, primary tint) · `Completed this month` / `{n}` / `in {November}` (`CircleCheckBig`, success tint) · `Average rating` / `{4.9}` / `★ {212} reviews` (`Star`, warning tint) |
| S20.E7 | Requests header | — | — | — | H2 `Incoming service requests` (Δ "Sample requests — prototype" badge removed) |
| S20.E8 | Status tabs | counts | Active tab: white + `shadow-xs` | Filters the list in place | `All` · `Pending` · `Accepted` · `Completed` · `Declined` (prototype set, with counts). Cancelled and Expired rows appear under All with their pills |
| S20.E9 | Table header | — | — | — | `Customer` · `Service` · `Date` · `Area` · `Status` |
| S20.E10 | Request row ×≤8 (newest first) | ref, customer display name (§6.3: Pending → `Olivia M.`; Accepted/Completed → `Olivia Martinez`; closed → `Olivia M.`), serviceName, description (first line), preferredDate, slot, townName, status | Pending: `Accept` + `Decline` buttons before the pill. Row flash `primary-flash` for 900 ms after a change. Hover `page` | Row click → `/dashboard/requests/{ref}`. `Accept` → Accept dialog; `Decline` → Decline dialog (§8.3; Δ no Undo) | Buttons `[Check] Accept`, `Decline`; date `{Sun, 11 Oct}` + slot |
| S20.E11 | View all link | — | Shown when there are more than 8 rows | → `/dashboard/requests` | `View all requests →` (row under the table, padding 16 24) |
| S20.E12 | Empty (tab) | — | — | — | `No requests with this status.` |
| S20.E13 | Empty (no requests ever) | — | — | — | `Inbox` tile (compact); `No requests yet`; `When customers send you a request, it shows up here and we email you.` |
| S20.E14 | Success toast | — | 4 s, no Undo Δ | — | `Accepted {Olivia}'s request` / `Declined {Olivia}'s request` (prototype copy) |
| S20.E15 | Profile completeness (F-21) | 5 checks | Done: filled `CircleCheck` `success`, text `text-muted`. Todo: `Circle` `border-control`, text `text` + right link | Links: Business details → `/dashboard/profile`; Services & prices → `/dashboard/services`; Service area → `/dashboard/areas`; ID verified → `/dashboard/verification`; Profile photo → `/dashboard/profile#photo` | H2 `Profile completeness` + `{80%}`; items `Business details`, `Services & prices`, `Service area`, `ID verified` Δ (was "ID & licence verified"), `Profile photo`; todo link `Add` (photo), `Verify` (not submitted), `Fix` (rejected); pending review shows 13 subtle `In review` and no link |
| S20.E16 | My Services | services | — | `Edit` → `/dashboard/services` | H2 `My Services`; button `[Pencil] Edit`; rows `{name}` + `from LKR 2,500 / hour` Δ (BR-09) |

#### S21 — Provider requests `/dashboard/requests` · L3 · INFERRED · F-17, F-18, F-25

**Layout.** The S20 requests section as a full page, with H1 (`title-xl` on desktop, matching S20) `Requests` and sub `Every request customers have sent you.` The card header gets a search input (40 high, `Search` icon, placeholder `Search by name or reference`, 260 wide; full width on phone). Tabs: `All` · `Pending` · `Accepted` · `Completed` · `Declined` · `Cancelled` · `Expired`, each with its count. Pagination 20 per page (S2.E12). URL: `?status=&q=&page=`.

Order: Pending by `expiresAt` ascending (most urgent first) when the Pending tab is active; otherwise newest first.

Pending rows also show a 12 `warning-text` line under the date: `Reply by {Sat 3:42 PM}`.

Empty search: `No requests match "{q}".` + `Clear search` link. Rows, actions and phone cards are as S20.

#### S22 — Request detail (provider) `/dashboard/requests/:ref` · L3 · INFERRED · F-17, F-18, F-19, F-27

**Desktop layout.**
1. Back link `Back to requests`.
2. Header: H1 service (`title-lg`); under it, the ref (mono), the status pill and `Requested {21 Nov 2026, 3:42 PM}`.
3. Grid `minmax(0,1fr) 340px`, gap 24.
   - Main (gap 24): Customer card, Job details card, History card.
   - Aside (sticky top 32): Actions card.

**Phone layout.** One column: header, Actions card content (as a card), Customer, Job details, History. Pending primary actions also move into a sticky bottom bar: `Decline` (secondary) and `Accept` (primary), 50/50, 48 high.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S22.E1 | Customer card | §6.3 privacy | Pending, Declined, Cancelled, Expired: initials avatar, `Olivia M.`, town, plus `Lock` note. Accepted/Completed: full name, address lines, mobile with `Call` / `Copy` | `Call` = `tel:`; `Copy` → toast `Number copied.` | H2 `Customer`. Pending note: `Full name, address and mobile number are shown after you accept.` Closed note: `Contact details are hidden because this request is {declined / cancelled / expired}.` |
| S22.E2 | Job details card | serviceName + price label, preferredDate, slot, townName, description | — | — | H2 `Job details`; labels `Service`, `Preferred date`, `Time slot`, `Town`, `Description` |
| S22.E3 | Actions card — Pending | expiresAt | — | `Accept` → Accept dialog; `Decline` → Decline dialog | `Respond by {Sat, 21 Nov, 3:42 PM}`; buttons `[Check] Accept` (primary, full), `Decline` (danger-outline, full) |
| S22.E4 | Actions card — Accepted | agreedPrice, preferredDate | `Mark as completed` disabled before the preferred date (BR-32), with help. Agreed price inline edit: view → input + `Save` / `Cancel` | Save price → toast `Agreed price saved.`; Mark completed → dialog | H3 `Agreed price`: `LKR 6,500` or `Not set` + link `Edit` / `Add`; help `For your records only — the customer pays you directly.`; button `[CircleCheckBig] Mark as completed`; disabled help `You can mark this job completed from {Sun, 29 Nov}.`; footer note (13 muted): `Need to cancel? Call the customer, then email us at {contact email} — providers can't cancel accepted jobs.` |
| S22.E5 | Actions card — Completed | completedAt, agreedPrice, review | — | Review link → `/dashboard/reviews#{reviewId}` | `Completed on {date}`; `Agreed price: LKR …`; review: `{Sarah K.} left a {5}-star review` + `View review`, or `The customer can review until {date}.` |
| S22.E6 | Actions card — Declined / Cancelled / Expired | reason, actor | — | — | Declined: `You declined this request.` + `Reason: …`. System: `Declined automatically — your account was suspended.` Cancelled: `{Olivia} cancelled this request.` / `Fixit cancelled this request.` + `Reason: …`. Expired: `This request expired on {date} because it wasn't answered in time.` |
| S22.E7 | History | statusHistory | — | — | As S15.E7; actors `by you`, `by the customer`, `by Fixit`, `automatically` |

| Field (Accepted, inline / dialogs) | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Agreed price | number, `LKR` prefix, step 1 | no | Whole number 1–10,000,000 | `Enter a whole amount in rupees, like 6500.` |

#### S23 — My Services `/dashboard/services` · L3 · INFERRED · F-20

**Layout.**
1. Header: H1 `My Services`, sub `What you offer and what it costs. Your lowest price shows as "Starting at".`, and on the right a primary `[Plus] Add service`.
2. Preview card (S20 stat-tile style, one tile): `Starting at` / `LKR 2,500 / hour` (BR-10).
3. Table card: columns Service · Price · Unit · Shows as · actions (`Pencil` edit, `Trash2` delete; 40×40 icon buttons).

Phone: list cards with name (15/700) and `Shows as` line, plus 44×44 icon buttons on the right. `Add service` is full width, under the header.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S23.E1 | Add service | count | Disabled at 20 with help `You can list up to 20 services.` (BR-14) | Opens the service dialog | `[Plus] Add service` |
| S23.E2 | Row ×1–20 | name, price, unit | Delete disabled when only 1 is left; tooltip on tap/hover `You need at least one service.` | Edit → dialog; Delete → confirm | `Shows as` `from LKR 2,500 / hour` |
| S23.E3 | Service dialog | — | Submitting `Saving…` | Save → toast `Service saved.` (`Service added.` for new) | Title `Add service` / `Edit service`; live preview `Shows as: from LKR 2,500 / hour`; buttons `Cancel` · `Save` |
| S23.E4 | Delete confirm | — | — | Delete → toast `Service deleted.` | `Delete {name}?` / `Customers won't see it any more. Requests already sent aren't affected.` / `Cancel` · `Delete` (danger) |

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Service name | text | yes | Trimmed 2–60; unique within the provider (case-insensitive) | Empty: `Enter a service name.` · Length: `Service name must be 2 to 60 characters.` · Duplicate: `You already have a service with this name.` |
| Price | number, `LKR` prefix, step 1 | yes | Whole number 100–1,000,000 | `Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.` |
| Unit | Segmented radio: `per hour` · `per visit` · `fixed` | yes | One of the three | `Choose how this price is charged.` |

#### S24 — Business profile `/dashboard/profile` · L3 · INFERRED · F-20, BR-21

**Layout.** Header: H1 `Profile`, sub `How your business appears to customers.`, with `[Eye] View public profile` on the right. Cards (max 720): Photo (`#photo`), Business details. Phone: cards full width; Save buttons full width.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S24.E1 | Photo card | photoUrl | None: 160 `primary-soft` tile with category icon. Uploading: progress bar under the preview | `Upload photo` / `Replace` → file picker; `Remove` → confirm `Remove your photo?` → toast `Photo removed.` | H2 `Profile photo`; help `JPG, PNG or WebP, at least 400 × 400 px, up to 5 MB. We crop it to a square.` |
| S24.E2 | Photo errors | — | — | — | `Use a JPG, PNG or WebP image.` · `Image must be 5 MB or smaller.` · `Image must be at least 400 × 400 pixels.` · `Upload failed. Check your connection and try again.` |
| S24.E3 | Business details card | businessName, categoryId, bio, yearsExperience, ownerName, verificationStatus | Name or category changed while verification is Verified or Pending review → inline warning banner under the field: `Changing your {business name / category} removes your Verified badge until Fixit checks your documents again.` | Save → if re-verification applies, confirm dialog; else toast `Changes saved.` | H2 `Business details`; fields as S19 step 1 + Category select; read-only `Owner` `{name}` + link `Change in Account settings` |
| S24.E4 | Re-verify dialog | — | — | Confirm → save; badge removed; status → Pending review; toast `Saved. Your listing is back in review.` | `Save and re-verify?` / `Your Verified badge will be removed and your listing goes back to review. We'll email you when it's checked.` / `Cancel` · `Save and re-verify` |

Fields as S19 (business name, bio, years) plus Category (select of active categories; required; `Choose a category.`).

#### S25 — Service areas `/dashboard/areas` · L3 · INFERRED · F-20

**Layout.** Header: H1 `Service areas`, sub `Customers in these towns can find and request you.` One card (max 720) with:
- Base town select.
- Other towns as checkbox groups per district: 3 columns on desktop, 1 on phone, district heading 14/700, rows 44 high on phone.
- Counter `{n} of 9 selected`.
- `Save changes`.

Footnote (13 muted): `Removing a town doesn't affect requests you've already received.`

Validation and errors: as S19 step 4. A newly chosen base town is unticked from the other-towns list automatically. Save → toast `Service areas saved.`

#### S26 — Verification `/dashboard/verification` · L3 · INFERRED · F-16, BR-17, BR-18

**Layout.**
1. Header: H1 `Verification`.
2. Status card (r20, padding 24): pill, title, body.
3. Upload card when uploads are allowed: 2×2 grid of document slots (desktop), 1 column on phone.
4. Privacy note.
5. Submit button.

| Status | Pill | Title | Body | Uploads |
|---|---|---|---|---|
| Not submitted | `Not submitted` | `Get the Verified badge` | `Upload your national ID so Fixit can check who you are. Verified providers get a badge and appear under "Verified only".` | Enabled |
| Pending review | `Pending review` | `We're checking your documents` | `This usually takes 1–2 working days. We'll email you when it's done.` | Read-only list of submitted files |
| Verified | Verified badge | `You're verified` | `Verified on {date}. If you change your business name or category, we'll check your documents again.` | Read-only list |
| Rejected | `Rejected` | `Your documents weren't approved` | Danger banner: `Reason: {reason}` + `Fix the issue below and submit again.` | Enabled; slots prefilled with the previous files (each can be replaced) |

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S26.E1 | Document slot ×4 | type, file | Empty: dashed `border-strong` drop zone r14, `Upload` icon, button `Choose file`. Uploading: progress bar + `Cancel`. Uploaded: thumbnail (image) or `FileText` (PDF), filename (ellipsis), size, `Replace` · `Remove`. Error: danger border + message | Click/tap or drag-drop. Phone opens the file picker, including the camera | Titles: `NIC — front` (Required), `NIC — back` (Required), `Trade certificate or NVQ` (Optional), `Business registration` (Optional); help `JPG, PNG or PDF, up to 5 MB` |
| S26.E2 | Privacy note | — | — | — | `[Lock] Only you and Fixit admins can see these documents.` |
| S26.E3 | Submit | — | Disabled while uploading; submitting `Submitting…` | → status Pending review; toast `Documents submitted. We'll email you when they're checked.` | `Submit for review` / resubmission: `Submit again` |

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| NIC front | file (image/jpeg, image/png, application/pdf) | yes | Type; ≤ 5 MB | Missing: `Upload the front of your NIC.` · Type: `Use a JPG, PNG or PDF file.` · Size: `File must be 5 MB or smaller.` |
| NIC back | file | yes | Same | Missing: `Upload the back of your NIC.` · others as above |
| Trade certificate / NVQ | file | no | Same | As above |
| Business registration | file | no | Same | As above |

#### S27 — Reviews (provider) `/dashboard/reviews` · L3 · INFERRED · F-24, F-23

**Layout.**
1. Header: H1 `Reviews`.
2. Summary card: big rating 34/800, stars, `{212} reviews`, and a 5→1 distribution (each row: `5 ★`, a progress bar, the count). On phone the distribution sits under the rating.
3. Tabs: `All` · `Needs a reply` (only if F-23 ships).
4. List of reviews (S3.E11 pattern) inside one card. Each review adds a line `{FX-2061} · {Service}`.

Hidden reviews are not shown here (BR-29).

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S27.E1 | Reply action (F-23) | reply | No reply: outline small `[MessageSquareReply] Reply`. Has reply: S3.E12 block + link `Edit reply` | Opens an inline textarea under the review with `Cancel` · `Post reply` / `Save reply` | Placeholder `Write a public reply. Everyone can see it.`; toast `Reply posted.` / `Reply updated.` |
| S27.E2 | Empty | — | — | — | `Star` tile; `No reviews yet`; `Reviews appear here after customers rate completed jobs.` |

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Reply | Textarea, counter `{n} / 1,000` | yes | Trimmed 2–1,000 | Empty: `Write your reply.` · Long: `Keep your reply under 1,000 characters.` |

#### S28 — Provider settings `/dashboard/settings` · L3 · INFERRED · F-22

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S28.E1 | Availability card (F-22) | paused | Switch row (S2.E6 pattern) | Toggle → §8.3; toast | H2 `Availability`; `Taking new requests`; help on: `Customers can send you requests.` · off: `Your profile stays visible with "Not taking requests". Requests you already have aren't affected.` |
| S28.E2 | Account card | — | — | Link → `/account` | H2 `Account`; `Name, mobile number and password are in your account settings.` + link `Account settings →` |
| S28.E3 | Emails card | — | — | — | H2 `Email notifications`; `We email you about new requests, status changes and verification. You can't turn these off.` |

### 5.D Admin

All admin tables follow the S20 table pattern on desktop and switch to cards on phone (§6.9). Admin views show full names and contact details (admins aren't limited by §6.3), except that admin screens never show passwords or Google tokens.

#### S29 — Admin sign-in `/admin/login` · L1-auth (logo only) · INFERRED · F-30

| ID | Element | Copy / behaviour |
|---|---|---|
| S29.E1 | Title | `Fixit admin` / sub `Sign in with your admin account.` |
| S29.E2 | Fields | Email, Password (rules and messages as S5) |
| S29.E3 | Submit | `Sign in` / `Signing in…` → `/admin` |
| S29.E4 | Error banner | Any failure, including a non-admin account: `That email and password don't match.` (no role disclosure). Rate limit as S5 |
| S29.E5 | Forgot link | `Forgot password?` → `/forgot-password` |

No Google button and no sign-up link. Nothing in the public UI links to this page.

#### S30 — Admin overview `/admin` · L4 · INFERRED · F-36, BR-50

**Layout.**
1. Header: date line (S20.E1), H1 `Overview`.
2. **Needs attention** row (always shown): 2 tiles (S20 stat-tile pattern).
3. **This month** (F-36): 4 stat tiles, then a card with the "Requests this month" status breakdown.

Phone: tiles 2×2; the breakdown card is full width.

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S30.E1 | Verification tile | pending review count | 0 → value `0`, sub `all caught up` | → `/admin/verifications` | `Waiting for verification` / `{n}` / `oldest {3} days` (`ShieldCheck`, warning tint) |
| S30.E2 | Suspended tile | suspended users | — | → `/admin/users?status=suspended` | `Suspended accounts` / `{n}` / `in total` (`Ban`, danger tint) |
| S30.E3 | Customers | total customers | — | → `/admin/users?role=customer` | `Customers` / `{n}` / `in total` (`Users`, primary tint) |
| S30.E4 | Providers | totals by verification | — | → `/admin/users?role=provider` | `Providers` / `{n}` / `{v} verified · {p} in review · {u} not submitted` (`BriefcaseBusiness`, primary tint) |
| S30.E5 | Completion rate | Completed ÷ (Accepted or later) this month | No data → `—` | — | `Completion rate` / `{82%}` / `of accepted jobs this month` (`CircleCheckBig`, success tint) |
| S30.E6 | Expired share | Expired ÷ Pending created this month | No data → `—` | — | `Expired requests` / `{9%}` / `of new requests this month` (`Clock`, warning tint) |
| S30.E7 | Requests this month card | count per status | — | Each row → `/admin/requests?status={s}` | H2 `Requests this month`; rows: status pill + count, right-aligned 16/800; total row `Total` |

If F-36 is not built, only S30.E1–E2 render, with H1 `Overview`.

#### S31 — Verification queue `/admin/verifications` · L4 · INFERRED · F-31

**Layout.** Header: H1 `Verification`, sub `Check providers' documents and approve or reject them.` Card with tabs `Pending review` (default) · `Approved` · `Rejected`, then the table. Columns: Provider (photo 36 + business + owner name) · Category · Submitted (`{21 Nov}` + 13 subtle `{3 days ago}`) · Attempt (`First` / `Resubmission {n}`) · action (`Review` outline small). Pending is ordered oldest first. Pagination 25.

Empty (Pending tab): `CircleCheck` tile; `Nothing to review`; `New submissions show up here.`

#### S32 — Verification review `/admin/verifications/:id` · L4 · INFERRED · F-31, BR-19

**Desktop layout.**
1. Back link `Back to queue`.
2. Header: H1 business name; under it the status pill, `Submitted {date}`, and `Resubmission {n}` when relevant.
3. Grid `minmax(0,1fr) 340px`.
   - Main: Documents card (2×2 grid of document tiles), then a Previous decisions list.
   - Aside (sticky): Provider card, Checklist, Actions.

**Phone layout.** One column. Actions move to a sticky bottom bar: `Reject` (danger-outline) and `Approve` (primary).

| ID | Element | Data | States | Interaction | Copy |
|---|---|---|---|---|---|
| S32.E1 | Document tile ×4 | type, file, mime | Optional and missing: dashed tile `Not provided` | Click opens a full-screen viewer dialog: image zoom (fit / 100% / pinch) or embedded PDF; `Open in new tab`; Esc closes | Titles as S26.E1 |
| S32.E2 | Provider card | businessName, ownerName, account name, email, mobile, category, baseTown, joined date, link to profile and user | — | `View user` → `/admin/users/{id}`; `View listing` → `/providers/{id}` (new tab) | Labels `Account name`, `Owner on listing`, `Email`, `Mobile`, `Category`, `Base town`, `Joined` |
| S32.E3 | Checklist (BR-19) | — | Local ticks only, not saved | — | H3 `Before you approve`; `Name on the NIC matches {account name} or {owner name}`; `Documents are clear and readable`; `Documents look unaltered` |
| S32.E4 | Previous decisions | earlier submissions | Hidden on a first submission | — | Rows: `{date}` · status pill · `Reason: …` · `by {admin}` |
| S32.E5 | Approve | — | Only when Pending review | Confirm dialog → §8.5 | Button `[BadgeCheck] Approve`; dialog `Approve {Business}?` / `They'll get the Verified badge and an email.` / `Cancel` · `Approve`; toast `{Business} is verified.` |
| S32.E6 | Reject | — | Only when Pending review | Dialog with reason → §8.5 | Button `Reject`; dialog `Reject {Business}'s documents?` / field / `Cancel` · `Reject` (danger); toast `Rejected. {Business} has been emailed.` |

After approve or reject: go to the next Pending submission (oldest first), or back to the queue with the empty state.

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Reason for rejection | Textarea, counter `{n} / 500` | yes | Trimmed 10–500 | `Give a reason so the provider knows what to fix.` Help: `The provider sees this in the email and on their Verification page.` |

#### S33 — Users `/admin/users` · L4 · INFERRED · F-32

**Layout.**
1. Header: H1 `Users`.
2. Toolbar: search input (placeholder `Search name, email, mobile or business`, 320 wide; full width on phone).
3. Tabs: `All` · `Customers` · `Providers` · `Suspended`.
4. Table. Columns: Name (initials avatar + name + 13 subtle email) · Roles (pills: `Customer` in Cancelled style, `Provider` in Accepted style) · Verification (provider's pill or `—`) · Joined (`{21 Nov 2026}`) · Status (Active/Suspended pill) · `View`.

Pagination 25. URL `?q=&role=&status=&page=`. Empty search: S2.E11 pattern — `No users match "{q}"` / `Check the spelling or try an email address.` / `Clear search`.

#### S34 — User detail `/admin/users/:id` · L4 · INFERRED · F-32, BR-40 – BR-43

**Layout.**
1. Back link `Back to users`.
2. Header card: avatar 56, name (`title-lg`), email, mobile, `Joined {date}`, role pills and status pill. The primary action sits on the right: `[Ban] Suspend account` (danger-outline) or `[RotateCcw] Reactivate account` (primary).
3. Sections, each a card:
   - **Provider listing** (providers only): business, category, verification pill + `View submission`, rating, `Paused` pill if paused, `View listing`.
   - **Requests as customer:** counts (open / total) and the last 5 rows in S35 format.
   - **Requests as provider:** same.
   - **Account history:** suspend/reactivate entries with date, reason and admin.

Phone: stacked; the action is a full-width button under the header.

| ID | Element | Copy |
|---|---|---|
| S34.E1 | Suspend dialog | Title `Suspend {name}?`. Effects list (computed, `CircleAlert` bullets): `They won't be able to sign in.` · (provider) `Their listing will be hidden from search and their profile link will stop working.` · (provider) `{n} pending requests will be declined and {m} accepted requests cancelled. Customers are emailed.` · (customer) `{k} of their open requests will be cancelled. Providers are emailed.` · `Their reviews stay visible unless you hide them.` Field Reason. Buttons `Cancel` · `Suspend account` (danger). Toast `{name} is suspended.` |
| S34.E2 | Reactivate dialog | Title `Reactivate {name}?`; body `They can sign in again and their listing comes back. Cancelled or declined requests stay closed, and verification doesn't change.` Field Reason. Buttons `Cancel` · `Reactivate`. Toast `{name} is active again.` |

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Reason (suspend / reactivate) | Textarea, counter `{n} / 500` | yes (BR-40) | Trimmed 10–500 | `Give a reason. It's included in the email to {name}.` |

#### S35 — All requests `/admin/requests` · L4 · INFERRED · F-35

**Layout.** Header: H1 `Requests`, sub `All service requests on Fixit.` Toolbar: search (`Search by reference, customer or provider`). Tabs: `All` + the six statuses. Table columns: Ref (mono) · Customer (full name) · Provider (business) · Service · Date (date + slot) · Town · Status. Newest first, pagination 25, URL `?status=&q=&page=`. Row → S36. Read-only list.

#### S36 — Request detail (admin) `/admin/requests/:ref` · L4 · INFERRED · F-35

**Layout.** As S22, with both parties shown in full: a Customer card (name, email, mobile, address) and a Provider card (business, owner, mobile, links to users). Job details and full history follow, with every actor named (`by {customer name}`, `by {business}`, `by {admin name}`, `automatically`).

Action card (only when Pending or Accepted, BR-30): `Cancel request` (danger-outline).

| ID | Element | Copy |
|---|---|---|
| S36.E1 | Cancel dialog | `Cancel {FX-2061}?` / `{Customer} and {Business} will both be emailed with your reason.` / field / `Keep request` · `Cancel request` (danger). Toast `Request cancelled. Both parties have been emailed.` |
| S36.E2 | Closed request | Action card text: `This request is {status}. No actions available.` |

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Reason (shown to both) | Textarea, counter `{n} / 500` | yes | Trimmed 10–500 | `Give a reason. Both the customer and the provider will see it.` |

#### S37 — Reviews moderation `/admin/reviews` · L4 · INFERRED · F-33, BR-29

**Layout.**
1. Header: H1 `Reviews`.
2. Search (`Search provider, author or text`).
3. Tabs: `All` · `Visible` · `Hidden`.
4. A list of review rows in one card. Each row has a header line (provider business link · `{FX-2061}` · date) and the S3.E11 review body, with the provider reply (if any) underneath.
5. On the right of each row: the status pill (Hidden only) and the action.

Phone: actions sit under the body, full width.

| ID | Element | Copy |
|---|---|---|
| S37.E1 | Hide | Button `[EyeOff] Hide` (danger-outline small). Dialog `Hide this review?` / `It disappears from {Business}'s profile and stops counting toward their rating. Its reply is hidden too.` / field `Reason` / `Cancel` · `Hide review` (danger). Toast `Review hidden. {Business}'s rating is updated.` |
| S37.E2 | Restore | Button `[RotateCcw] Restore` (outline small). Dialog `Restore this review?` / `It shows on {Business}'s profile and counts toward their rating again.` / `Cancel` · `Restore`. Toast `Review restored.` |
| S37.E3 | Hidden metadata | Under hidden rows (13 subtle): `Hidden {date} by {admin} · Reason: {reason}` |

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Reason (hide) | Textarea, counter `{n} / 500` | yes | Trimmed 10–500 | `Give a reason for the moderation log.` Help: `Only admins see this.` |

#### S38 — Categories & towns `/admin/catalog` · L4 · INFERRED · F-34

**Layout.** Header: H1 `Categories & towns`. Tabs: `Categories` · `Towns` (URL `?tab=`).

**Categories tab**
- Header: primary `[Plus] Add category`.
- Table columns: order (up/down buttons, 40×40) · Icon · Name · Blurb · Providers (count) · Status (`Active` or `Hidden` pill) · `Edit`.
- Order controls the S1 grid and the S2 filter list.

**Towns tab**
- Header: `[Plus] Add town` and `Add district`.
- One card per district (Colombo, Gampaha, Kalutara, …) with heading row `{District}` + `Rename`.
- Rows: town · providers covering it (count) · status · `Edit`.

Phone: tables become cards; order buttons stay as 44×44.

| ID | Element | Copy / behaviour |
|---|---|---|
| S38.E1 | Category dialog | Title `Add category` / `Edit category`. Fields below. Buttons `Cancel` · `Save`. Toast `Category saved.` |
| S38.E2 | Hide category | Allowed only with 0 providers in it. Otherwise the button is disabled with help `{n} providers use this category. It can't be hidden while they do.` Confirm `Hide {name}?` / `It disappears from search and the home page. You can show it again later.` Toast `Category hidden.` / `Category shown.` |
| S38.E3 | Town dialog | Title `Add town` / `Edit town`. Fields below. Toast `Town saved.` |
| S38.E4 | Hide town | Confirm `Hide {town}?` / `{n} providers list this town. They keep it, but customers can no longer choose it in search or requests. Existing requests aren't affected.` Toast `Town hidden.` / `Town shown.` |
| S38.E5 | District dialog | Title `Add district` / `Rename district`. Field `District name`. Toast `District saved.` |

Categories and towns are never deleted, only hidden (they are referenced by providers and requests). Renaming a category does not trigger re-verification (BR-21 applies to the provider changing category).

| Field | Type | Required | Validation | Error message |
|---|---|---|---|---|
| Category name | text | yes | Trimmed 2–40, unique (case-insensitive) | Empty: `Enter a category name.` · Duplicate: `A category with this name already exists.` |
| Blurb | text | yes | 5–60 | `Write a short description, 5 to 60 characters.` |
| Icon | Icon picker (grid of the §2.10 category icons, 44 targets) | yes | One of the set | `Choose an icon.` |
| District (town dialog) | Select | yes | Existing district | `Choose a district.` |
| Town name | text | yes | Trimmed 2–40, unique within the district | Empty: `Enter a town name.` · Duplicate: `{District} already has a town with this name.` |
| District name | text | yes | Trimmed 2–40, unique | Empty: `Enter a district name.` · Duplicate: `A district with this name already exists.` |

### 5.E System

All three use the empty-state pattern (§2.9) centred in the current layout's main area (padding 88 16). They render in L1 for public and customer routes, and in L3 or L4 for `/dashboard*` and `/admin*`.

| Screen | Icon tile | Title | Body | Buttons |
|---|---|---|---|---|
| S39 404 — generic | `SearchX` | `We can't find that page` | `The link may be broken, or the page may have been removed.` | `Go to home` (L1) / `Go to dashboard` (L3) / `Go to overview` (L4) |
| S39 404 — provider (prototype box, S3.E14) | — | — | `This provider couldn't be found.` | link `Browse all providers` |
| S39 404 — request | `SearchX` | `We can't find that request` | `Check the reference, or find it in your list.` | `Go to my requests` / `Go to requests` |
| S40 403 | `Lock` | `You don't have access to this page` | `You're signed in as {email}. Log out and sign in with a different account if you need to.` | `Go to home` · `Log out` |
| S41 Error | `TriangleAlert` (`warning-soft`/`warning-text`) | `Something went wrong` | `Please try again. If it keeps happening, email us at {contact email}.` + 12 mono subtle `Error ID: {id}` | `Try again` (reloads) · `Go to home` |

Requests that exist but belong to someone else return S39 (request), not S40, so their existence isn't revealed.

---

## 6. Cross-cutting states

### 6.1 Loading — skeletons
Rules:
- Show the skeleton only if loading takes longer than 150 ms (no flash on fast loads). It must match the final layout's dimensions so nothing jumps.
- Skeleton blocks use `placeholder-a` with a 1.2 s opacity pulse (0.6 ↔ 1). With reduced motion, they are static.
- The region gets `aria-busy="true"` and visually hidden text `Loading…`.
- Navigation keeps the layout chrome (nav, sidebar) rendered and only skeletons the main area.

| Skeleton | Shape (same box as the real component) | Used on |
|---|---|---|
| Category card | r16 card; 52×48 r14 block; line 60% × 17; line 80% × 14 | S1 (8) |
| Featured card | r16 card; 180-high block; 2 lines; divider; 60×16 + 96×40 r12 | S1 (4), S17 |
| Result card | r16 card; 132×132 r14 square; 3 lines (40%, 30%, 70%); right column 80×28 + 110×40 | S2 (4) |
| Profile header | r24 card; 220 square; 4 lines; right column 3 blocks | S3 |
| Section card | r20 card; title line 30%; 3–5 body lines | S3, S15, S22, forms |
| Stat tile | r16 card; label line 50%; 40×40 r12; value block 60×40 | S20, S30 |
| Table row | 36 circle + 2 lines; 2 lines; 2 lines; 1 line; 90×28 pill | S14, S20, S21, S31, S33, S35 (5 rows) |
| Phone list card | r16; 2 lines + pill block; 2 lines | phone versions of the above |
| Review row | 44 circle; 2 lines; stars line; 3 text lines | S3, S27, S37 (3) |

Buttons in a submitting state: the label changes to its `…ing` form (given per screen), a 16px spinner replaces the leading icon, the width stays fixed, the button is disabled and `aria-busy` is set. While submitting, the rest of the form stays editable but can't be re-submitted.

### 6.2 Empty states
Every empty state uses the Discover pattern (S2.E11): dashed card, 56 icon tile, 18/700 title, 15 muted body, an optional primary 48 button. Small in-table empties use the prototype line `No requests with this status.` (15 subtle, centred, padding 40).

| Where | Icon | Title / body / button |
|---|---|---|
| S2 no results | `SearchX` | Prototype copy (S2.E11) |
| S3 no reviews | `Star` | S3.E11 |
| S14 none | `Inbox` | S14.E6 |
| S17 none | `Heart` | S17.E3 |
| S20 none | `Inbox` | S20.E13 |
| S27 none | `Star` | S27.E2 |
| S31 none | `CircleCheck` | S31 |
| Search with no match (S21, S33, S35, S37) | `SearchX` | `No {requests/users/reviews} match "{q}"` / `Check the spelling or try something else.` / `Clear search` |

### 6.3 Errors and retry
| Case | Rendering | Copy |
|---|---|---|
| Section failed to load | That section's card is replaced by an empty-state card with a `TriangleAlert` warning tile; the rest of the page still works | `We couldn't load this.` / `Check your connection and try again.` / `Try again` (refetches only that section) |
| Whole page failed | S41 | S41 |
| Form submit failed (validation) | Field errors (§5 conventions) + focus on the first one | Per field |
| Form submit failed (server/network) | Danger banner at the top of the form, scrolled into view; form data kept | `We couldn't save your changes. Check your connection and try again.` |
| Action failed (button or toggle outside a form) | Toast with a leading `CircleAlert` and a `Try again` action; optimistic UI reverts | `Couldn't {save / update / remove}. Try again.` |
| Conflict: status changed meanwhile (e.g. accept an expired request) | Dialog, then the data refreshes | `This request has changed` / `It's now {Expired / Cancelled by the customer}, so this action isn't available.` / `OK` |
| Offline | Thin banner under the nav or top bar (`warning-soft`), aria-live polite | `You're offline. Some things won't work until you reconnect.` |
| Upload failed | Slot error state (S26.E1) | `Upload failed. Check your connection and try again.` |

### 6.4 403 / 404
- Unknown routes, provider ids, refs and user ids → S39 variants.
- Wrong role → S40.
- A signed-out user opening a protected route → `/login?next={path}`, not S40.
- Admin routes visited by a signed-out user → `/admin/login?next=…`.

### 6.5 Optimistic actions and the Undo toast
Toast spec (prototype): fixed bottom 28, centred, `tooltip-bg`, r14, 14/600 white, action 14/700 `toast-action`.
- Visible for 4 s, or 8 s when it has an action. The timer pauses while the toast is hovered or focused.
- One toast at a time; a new one replaces the old.
- `role="status"`, aria-live polite.
- Phone: bottom 16 plus any sticky bar height; width calc(100% − 32); the action is a 44-high target.

| Action | Optimistic? | Undo? | Toast |
|---|---|---|---|
| Save / unsave provider (F-10) | yes | Unsave only: `Undo` re-saves | `Saved {Business}.` / `Removed {Business} from saved.` + `Undo` |
| Pause / resume (F-22) | yes; reverts on failure | no | `You're not taking new requests.` / `You're taking requests again.` |
| Category reorder (S38) | yes | no | none on success; error toast on failure |
| Accept / Decline (F-18) | **no** — confirm dialog, then server; row flash on success | **no** (F-49; approved at gate) | `Accepted {Olivia}'s request` / `Declined {Olivia}'s request` |
| Everything else (forms, status changes, moderation) | no | no | Per screen |

### 6.6 Session expired
- **On navigation:** redirect to `/login?next={current path}` with an info banner on S5: `Your session expired. Log in again to continue.`
- **On a form submit:** the form values (excluding files and passwords) are kept for the tab session and restored after logging in and returning via `next`. The same banner is shown.
- **Admin:** the same, via S29.

### 6.7 Form submitting
See §6.1 for buttons. Leaving a dirty form (S12, S19 step, S23 dialog, S24, S25, S26 with files picked, S16) triggers a confirm: `Discard changes?` / `What you've entered won't be saved.` / `Keep editing` · `Discard`. A browser unload prompt is used for hard navigation.

### 6.8 Account-level banners
Notice banner pattern (§2.9). Placement:
- L1/L2: full-width strip directly under the nav, inner max width 1240.
- L3/L4: the banner slot at the top of main.

At most 2 banners show at once, in this priority order. They aren't dismissible unless marked.

| # | Who / where | Condition | Variant | Copy | Action |
|---|---|---|---|---|---|
| 1 | Provider, L3 | Verification Rejected | danger | `Your verification wasn't approved: {reason}` | `Fix and resubmit` → S26 |
| 2 | Provider, L3 | Paused (F-22) | warning | `You're not taking new requests. Customers see "Not taking requests" on your profile.` | `Resume` (toggles, toast) |
| 3 | Provider, L3 | Badge removed by an edit (BR-21) | info | `Your Verified badge was removed because you changed your {business name / category}. We're checking your documents again.` | — (dismissible) |
| 4 | Provider, L3 | Not submitted | warning (dashed) | `Your listing shows as "Not yet verified". Upload your ID to get the Verified badge.` | `Get verified` → S26 |
| 5 | Provider, L3 | Pending review | info | `We're checking your documents. We'll email you when it's done.` | — (dismissible for the session) |
| 6 | Any signed-in user, L1/L2/L3 | Email not confirmed | warning | `Confirm your email to send requests. We sent a link to {email}.` | `Resend email` → toast `Email sent again.` |
| 7 | Customer, L1/L2 | Onboarding draft in progress | info | `You haven't finished setting up your listing.` | `Continue` → `/become-a-provider/{step}` |

Phone: text wraps, and the action becomes a link on its own line (44 target).

### 6.9 Tables on phone
Every data table becomes a list of cards at ≤ 640:
- Card: white, r16, 1px `border`, padding 16, gap 8.
- Primary identity on row 1 with the status pill on the right; secondary fields as 13 muted lines with icons; actions in a full-width bottom row, 44 high.
- The whole card is the row link.
- Column headers are dropped; each value is self-explanatory or carries an icon.

### 6.10 Dialogs and sheets
- **Desktop:** the prototype modal (r20, padding 32, max 440, `shadow-modal`, overlay). Left-aligned for forms (the prototype's centred layout is kept for single-message dialogs). Buttons are right-aligned: secondary, then primary or danger.
- **Phone:** all dialogs render as bottom sheets (§2.9). Buttons stack full width, primary/danger first.
- Focus moves to the first field (or the primary button) and is trapped. Esc and overlay tap close the dialog, except while submitting. Focus returns to the trigger.
- **Danger button (new variant):** bg `danger-text`, white 14/700; hover bg `danger`.

### 6.11 Freshness
- Provider dashboard (S20, S21, S22) and admin queue (S31) refetch on window focus and every 60 s.
- When a row's status changes in the background it updates in place with the row flash. No toast.
- The sidebar count badges update with them.

---

## 7. Domain model (UI view)

Field names are descriptive (no storage detail). `?` = optional. Derived fields are computed for display.

### 7.1 Enums
| Enum | Values |
|---|---|
| `AccountStatus` | `active`, `suspended` |
| `AuthMethod` | `password`, `google` |
| `PriceUnit` | `per_hour` ("/ hour"), `per_visit` ("/ visit"), `fixed` ("fixed") |
| `TimeSlot` | `morning`, `afternoon`, `evening` |
| `RequestStatus` | `pending`, `accepted`, `declined`, `cancelled`, `expired`, `completed` |
| `RequestActor` | `customer`, `provider`, `admin`, `system` |
| `VerificationStatus` | `not_submitted`, `pending_review`, `verified`, `rejected` |
| `SubmissionStatus` | `pending_review`, `approved`, `rejected` |
| `DocumentType` | `nic_front`, `nic_back`, `trade_certificate`, `business_registration` |
| `ReviewVisibility` | `visible`, `hidden` |
| `OnboardingState` | `not_started`, `in_progress` (with `step` 1–5), `complete` |
| `CategoryIcon` | `wrench`, `zap`, `spray-can`, `sprout`, `paint-roller`, `hammer`, `drill`, `washing-machine` |
| `SortKey` | `rating`, `reviews`, `town` |

### 7.2 Entities
| Entity | Fields | Shown on |
|---|---|---|
| **User** | id; fullName; displayName (derived: first name + last initial); firstName (derived); email; emailConfirmed; mobile? (`+94 7X XXX XXXX`); authMethods[]; isAdmin; status `AccountStatus`; createdAt | S5–S10, S18, S33, S34, nav |
| **CustomerProfile** (every non-admin user) | userId; openRequestCount (derived, BR-33); savedProviderIds[] (F-10) | S3 eligibility, S12, S14, S17 |
| **ProviderProfile** | id; userId; businessName; ownerName (= user fullName); bio; yearsExperience; categoryId; photoUrl?; baseTownId; otherTownIds[] (≤ 9); verificationStatus; verifiedAt?; reverificationReason? (`business_name`/`category`); paused; onboarding `OnboardingState`; listed (derived: onboarding complete ∧ user active, BR-01); rating? (avg of visible reviews, 1 dp; null → "New"); reviewCount; startingPrice (derived lowest service: amount + unit, BR-10); pendingRequestCount (derived); completedThisMonth (derived) | S1–S3, S19–S28, S32, S34 |
| **Category** | id; name; blurb; icon `CategoryIcon`; order; active; providerCount (derived; per-filter count on S2) | S1, S2, S19, S24, S38 |
| **District** | id; name; order | Grouped selects, S38 |
| **Location** (town) | id; name; districtId; active; providerCount (derived) | Search, S12, S19, S25, S38 |
| **Service** | id; providerId; name; price (whole LKR); unit `PriceUnit`; priceLabel (derived, BR-09) | S3, S12, S20, S23 |
| **ServiceArea** | providerId; townId; isBase | S3, S25 |
| **ServiceRequest** | id; ref (`FX-####`); customerId; providerId; serviceSnapshot {name, price, unit}; preferredDate; slot `TimeSlot`; townId; addressLine1; addressLine2?; description; customerMobile; agreedPrice?; status `RequestStatus`; reason? (decline/cancel); closedBy? `RequestActor`; createdAt; expiresAt (derived: min(createdAt + 72 h, 00:00 on preferredDate), BR-31); cancelDeadline (derived: 23:59 on the day before preferredDate, BR-30); canComplete (derived: today ≥ preferredDate, BR-32); completedAt?; reviewDeadline (derived: completedAt + 30 days); history[] `StatusHistoryEntry`; photos[] (F-39, Could) | S12–S16, S20–S22, S35, S36 |
| **ServiceRequest — customer view of provider** | provider public fields; providerMobile only when accepted/completed (§6.3) | S15 |
| **ServiceRequest — provider view of customer** | customer displayName, townId, service, date, slot, description; + fullName, address, mobile only when accepted/completed (§6.3) | S20–S22 |
| **StatusHistoryEntry** | status; at; actor `RequestActor`; actorName? (admin only sees names); reason? | S15, S22, S36 |
| **Review** | id; requestId; providerId; authorDisplayName (`Sarah K.`); rating 1–5; text; createdAt; visibility `ReviewVisibility`; hiddenReason?; hiddenBy?; hiddenAt?; reply? {text, createdAt, updatedAt} | S3, S15, S16, S27, S37 |
| **VerificationSubmission** | id; providerId; attempt (1, 2, …); documents[] {type `DocumentType`, fileName, mimeType, sizeBytes, viewUrl (restricted to owner + admins)}; status `SubmissionStatus`; submittedAt; decidedAt?; decidedBy?; rejectionReason? | S26, S31, S32 |
| **SavedProvider** | userId; providerId; createdAt | S3, S17 |
| **AccountAction** | userId; action (`suspend`/`reactivate`); reason; adminId; at | S34 |
| **Notification** | No in-app notification centre (F-45 Won't). The UI only shows counters: provider pendingRequestCount (L3 badge, S20), admin pendingVerificationCount (L4 badge, S30). Emails are listed in §8.6 | L3, L4 |
| **AdminMetrics** (F-36) | totalCustomers; providers {verified, pendingReview, notSubmitted}; requestsThisMonth by status; completionRate; expiredShare; suspendedCount | S30 |

---

## 8. Interactions & rules

### 8.1 Mutating actions
| # | Action | Who / where | Preconditions | Result | Feedback | Rules |
|---|---|---|---|---|---|---|
| A1 | Sign up (email) | Guest, S6 | Email not registered | Account created (customer), unconfirmed; confirmation email sent | → S7 | F-01, BR-35 |
| A2 | Continue with Google | Guest, S5/S6 | — | Signed in; new accounts created confirmed | Redirect to `next` / onboarding / home | F-02 |
| A3 | Log in | Guest, S5 / S29 | Account active | Session started | Redirect (§8.4) | F-01, F-30, BR-41/42 |
| A4 | Log out | Any, nav / sidebar | — | Session ended | → `/` (admins → `/admin/login`) | — |
| A5 | Resend confirmation | Unconfirmed, S7/S8/banner | 60 s cooldown | Email sent | Toast `Email sent again.` | F-01 |
| A6 | Confirm email | Link, S8 | Token valid (24 h) | emailConfirmed = true | S8 success | F-01 |
| A7 | Request password reset | Guest, S9 | — | Email sent if the account exists | S9 sent state | F-01 |
| A8 | Reset password | Token holder, S10 | Token valid (1 h) | Password changed; other sessions ended | → S5 + toast | F-01 |
| A9 | Update details / password | User, S18 | Valid | Saved | Toast | F-03 |
| A10 | Save / unsave provider | Signed-in, S3/S17 | Not own listing | SavedProvider added/removed | §6.5 | F-10 |
| A11 | Send request | Customer, S12 | §6.1 entry conditions of PRODUCT: confirmed email, mobile set, provider listed/not paused/not self, town in areas, date in window, BR-33 limits | Request **Pending**; expiresAt set; provider emailed; provider count +1 | → S13 | F-11, F-14, BR-16, BR-23, BR-31, BR-33, BR-34 |
| A12 | Cancel request (customer) | Owner, S15 | Pending; or Accepted before cancelDeadline | **Cancelled**, closedBy customer; contact hidden; provider emailed | Toast `Request cancelled.`; panel updates | F-13, BR-30 |
| A13 | Accept | Provider, S20/S21/S22 | Pending, not expired | **Accepted**; agreedPrice? saved; contact revealed both ways; customer emailed | Toast + row flash; S22 shows customer details | F-18, F-27, §6.3 |
| A14 | Decline | Provider, S20/S21/S22 | Pending, not expired | **Declined**; reason?; customer emailed | Toast + row flash | F-18 |
| A15 | Set / change agreed price | Provider, S22 | Accepted | agreedPrice updated (customer sees it on S15; no email) | Toast `Agreed price saved.` | F-19, BR-12 |
| A16 | Mark completed | Provider, S22 | Accepted ∧ today ≥ preferredDate | **Completed**; agreedPrice? updated; customer emailed with review link; completed count +1 | Toast `Job marked completed.` | F-19, BR-32 |
| A17 | Expire | System | Pending ∧ now ≥ expiresAt | **Expired**; both emailed | Pill updates on next load/refresh | F-25, BR-31 |
| A18 | Admin cancel | Admin, S36 | Pending or Accepted | **Cancelled**, closedBy admin, reason; contact hidden; both emailed | Toast | F-35, BR-30 |
| A19 | Post review | Customer, S16 | Completed ∧ own ∧ ≤ 30 days ∧ no review yet | Review visible; provider rating/count recalculated | → S15 + toast | F-28, F-29, BR-24 – BR-27 |
| A20 | Post / edit reply | Provider, S27 | Review on own listing, visible | Reply saved, shown on S3 | Toast | F-23, BR-28 |
| A21 | Onboarding step save | Customer, S19 | Email confirmed | Draft saved; onboarding step advanced | Next step | F-15 |
| A22 | Publish listing | Customer, S19 step 5 | Steps 1–4 valid; mobile set | Provider listed, verificationStatus `not_submitted` | → done screen | F-15, BR-01, BR-23 |
| A23 | Edit business details | Provider, S24 | Valid | Saved. If businessName or categoryId changed ∧ status ∈ {verified, pending_review} → status `pending_review`, badge removed, provider emailed | Re-verify dialog → toast | F-20, BR-21 |
| A24 | Add / edit / delete service | Provider, S23 | 1–20 services kept | Services updated; startingPrice recalculated | Toast | F-20, BR-09, BR-10, BR-14 |
| A25 | Save service areas | Provider, S25 | Base town set; ≤ 9 others | Areas updated (search matching changes immediately) | Toast | F-20, BR-04, BR-14 |
| A26 | Upload / remove photo | Provider, S19/S24 | Valid image | photoUrl updated | Toast | F-20 |
| A27 | Submit verification | Provider, S26 | Not submitted or Rejected; NIC front + back uploaded | New submission; status `pending_review` | Toast; status card updates; admin badge +1 | F-16, BR-17, BR-18 |
| A28 | Pause / resume | Provider, S20/S28/banner | — | paused toggled; profile shows/hides "Not taking requests"; Request Service disabled/enabled | §6.5 | F-22, BR-15 |
| A29 | Approve verification | Admin, S32 | Pending review | Submission approved; provider `verified`, verifiedAt set; badge on; provider emailed | Toast; next item | F-31, BR-19, BR-20 |
| A30 | Reject verification | Admin, S32 | Pending review; reason | Submission rejected; provider `rejected` with reason; emailed | Toast; next item | F-31, BR-18 |
| A31 | Suspend | Admin, S34 | Active, not admin; reason | Status suspended; sessions ended; effects BR-41/BR-42 applied (provider: Pending → Declined "Provider unavailable", Accepted → Cancelled "Provider unavailable", listing hidden; customer: own Pending/Accepted → Cancelled); all affected parties emailed | Toast; S34 refreshes counts | F-32, BR-40 – BR-42 |
| A32 | Reactivate | Admin, S34 | Suspended; reason | Status active; listing restored; closed requests stay closed; verification unchanged; emailed | Toast | F-32, BR-43 |
| A33 | Hide / restore review | Admin, S37 | Hide: reason | Visibility toggled; rating and count recalculated; reply hidden with it | Toast | F-33, BR-27, BR-29 |
| A34 | Category add/edit/hide/reorder | Admin, S38 | Hide only with 0 providers | Catalog updated; S1/S2 reflect it immediately | Toast | F-34 |
| A35 | Town / district add/edit/hide | Admin, S38 | — | Catalog updated; hidden towns leave search and request selects | Toast | F-34 |

### 8.2 Discover URL state
The URL is the single source of truth; the page renders from it, so any Discover URL can be shared or bookmarked.

| Param | Values | Default (omitted) | Notes |
|---|---|---|---|
| `q` | free text, trimmed | empty | Kept as typed for display in the search box. If it matches a category (BR-02) it is not used as free text |
| `loc` | town id | all locations | BR-04 |
| `cat` | comma-separated category ids | none | OR (BR-05); unknown ids dropped |
| `rating` | `3.5`, `4`, `4.5` | Any | BR-05 |
| `verified` | `1` | off | |
| `price` | `2000`, `5000`, `10000` | Any | On "starting at" |
| `sort` | `rating`, `reviews`, `town` | `rating` | `town` without `loc` behaves as `rating` (BR-06) |
| `page` | integer ≥ 2 | 1 | 10 per page; out of range → last page |

Behaviour:
- **Submitting the search bar** (S1 or S2) is a new search.
  - On S1 it sets only `q` and `loc` (empty ones omitted); Discover then applies BR-02 from `q` when it loads (changed by decision 001).
  - On S2 it sets `q` and `loc`, and sets `cat` from BR-02 (the matched category, else none).
  - It drops `rating`, `verified`, `price` and `page` (BR-05), and keeps `sort`.
  - It pushes a history entry, so Back returns to the previous search.
- **Changing a filter, sort or location** applies immediately, replaces the history entry, and resets `page`. This matches the prototype's `replaceState`.
- **Changing page** pushes a history entry.
- **Ticking a category** while `q` is a category match clears `q` (prototype).
- **`Clear all`** returns to plain `/discover`.
- **Invalid values** are ignored and treated as defaults.
- **Plain `/discover`** shows all listed providers. Δ The prototype defaulted to "Plumbing in Austin"; that is dropped.
- **Back to results:** the last Discover URL is stored for the tab session; S3's back link and S13's `Back to search` use it.

### 8.3 Request lifecycle in the UI
Mapping of PRODUCT §6.1 to UI surfaces:

| Transition | Trigger UI | Confirm | Email (§8.6) | UI after |
|---|---|---|---|---|
| — → Pending | S12 `Send request` | none | Provider: new request | S13; S14 row; L3 badge +1 |
| Pending → Accepted | `Accept` (S20/S21/S22) | **Accept dialog**: `Accept {Olivia}'s request?` / `{Olivia} will be emailed, and you'll see their full name, address and mobile number.` / field `Agreed price (optional)` (LKR, help `You can change it until the job is completed.`) / `Cancel` · `Accept request` | Customer: accepted (phone, agreed price) | Toast; contact revealed on S22 and S15 |
| Pending → Declined | `Decline` | **Decline dialog**: `Decline {Olivia}'s request?` / `{Olivia} will be emailed. This can't be undone.` / field `Reason (optional)` (≤ 500, help `Shown to the customer.`) / `Cancel` · `Decline request` (danger) | Customer: declined (+ reason) | Toast |
| Pending → Cancelled | S15 `Cancel request` | **Cancel dialog**: `Cancel this request?` / `{Business} will be emailed that you cancelled.` / field `Reason (optional)` (≤ 500) / `Keep request` · `Cancel request` (danger) | Provider: cancelled by customer | Toast `Request cancelled.` |
| Pending → Expired | System at expiresAt | — | Both: expired | Pill; S15/S22 copy |
| Accepted → Cancelled (customer) | S15, before cancelDeadline | Same cancel dialog | Provider | Contact hidden |
| Accepted → Cancelled (admin) | S36 | Admin cancel dialog (reason required) | Both | Contact hidden |
| Accepted → Completed | S22 `Mark as completed`, on/after preferredDate | **Complete dialog**: `Mark this job completed?` / `{Olivia} will get an email asking for a review. This can't be undone.` / field `Final agreed price (optional)`, prefilled / `Not yet` · `Mark completed` | Customer: completed + review link | Toast; S15 review CTA |
| Pending → Declined (system) / Accepted → Cancelled (system) | Admin suspends the provider (A31) | — | Customer: provider unavailable | Reason `Provider unavailable` |
| Pending/Accepted → Cancelled (system) | Admin suspends the customer | — | Provider | Reason shown to the provider: `Customer account closed` |

Reason fields: optional ones are ≤ 500 characters, with error `Keep the reason under 500 characters.` Admin reasons are required, 10–500 (S36).

Stale actions: if the server reports the request is no longer in the expected state, show the §6.3 conflict dialog and refresh.

### 8.4 Auth, routing and redirects
| Situation | Behaviour |
|---|---|
| Guest clicks Request Service (F-04) | → `/login?next=/providers/{id}/request`. After login, sign-up + confirmation, or Google → back to S12 with the form open |
| Guest opens any L2/L3 route | → `/login?next={path}` |
| Guest opens an `/admin*` route | → `/admin/login?next={path}` |
| Signed-in user opens `/login` or `/signup` | → `/` (providers → `/dashboard`) |
| Customer (not provider) opens `/dashboard*` | → `/become-a-provider/{resume step}` (1 if not started) |
| Non-admin opens `/admin*` while signed in | S40 |
| Admin opens L2/L3 routes | S40 |
| `next` validation | Same-site relative paths only; anything else is ignored |
| Unconfirmed email | Can browse and log in; S12 and S19 show the confirm-first block; banner §6.8 #6 |
| Mobile missing | S12 and S19 step 1 ask for it inline and save it to the profile (BR-23) |
| Suspended at login | S5.E8 suspended message |
| Suspended while signed in | Next request returns unauthorised → signed out → S5 with the suspended message |

### 8.5 Verification flow (provider ↔ admin)
1. **Provider:** `not_submitted` → submits on S26 (A27) → `pending_review`. The submission enters the S31 queue, oldest first.
2. **Admin:** opens S32, checks BR-19, then approves (A29) → `verified`, or rejects with a reason (A30) → `rejected`. The provider is emailed either way.
3. **After rejection:** S26 shows the reason with prefilled slots; resubmitting creates attempt n+1 → `pending_review`.
4. **Re-verification on edit (A23, BR-21):** the badge is removed immediately, the status goes to `pending_review` and the latest approved documents are re-queued as a new attempt (no re-upload needed). This shows as `Resubmission {n}` with the reason `Business name changed` / `Category changed` on S31/S32. The provider is emailed and sees banner #3.

### 8.6 Email notifications (subjects only)
| Event | To | Subject |
|---|---|---|
| Email confirmation | User | `Confirm your email for Fixit` |
| Password reset | User | `Reset your Fixit password` |
| New request | Provider | `New request {FX-2061}: {Service} on {Sat, 21 Nov}` |
| Accepted | Customer | `{Business} accepted your request {FX-2061}` |
| Declined | Customer | `{Business} declined your request {FX-2061}` |
| Cancelled by customer | Provider | `{Olivia M.} cancelled request {FX-2061}` |
| Cancelled by admin | Both | `Request {FX-2061} was cancelled by Fixit` |
| Expired | Both | `Request {FX-2061} expired` |
| Completed | Customer | `How did {Business} do? Leave a review` |
| Party suspended | Other party | `Request {FX-2061} was cancelled` / `… was declined` |
| Verification approved | Provider | `You're verified on Fixit` |
| Verification rejected | Provider | `Your Fixit verification needs another look` |
| Badge removed (re-verification) | Provider | `We're checking your documents again` |
| Account suspended | User | `Your Fixit account has been suspended` |
| Account reactivated | User | `Your Fixit account is active again` |

Email bodies are out of scope for this spec.

### 8.7 Limits and validation summary
| Rule | Value | Where enforced in UI |
|---|---|---|
| Open requests | 1 per provider, 5 total (BR-33) | S3.E7, S12 blocked states, server error banner |
| Booking window | Tomorrow to +60 days (BR-34) | S12 date picker min/max |
| Description | 20–1,000 characters | S12 |
| Review | 1–5 stars, 10–1,000 characters, ≤ 30 days, one per request (BR-24 – BR-26) | S15, S16 |
| Services | 1–20 per provider (BR-14) | S19, S23 |
| Towns | Base + ≤ 9 others (BR-14) | S19, S25 |
| Documents | JPG/PNG/PDF ≤ 5 MB; NIC front + back required (BR-17) | S26 |
| Photo | JPG/PNG/WebP ≤ 5 MB, ≥ 400 × 400 | S19, S24 |
| Service price | Whole LKR 100 – 1,000,000 | S19, S23 |
| Agreed price | Whole LKR 1 – 10,000,000, optional | S22, dialogs |
| Admin reasons | 10–500 characters, required | S32, S34, S36, S37 |
| Optional reasons | ≤ 500 characters | Decline, customer cancel |

---

## 9. Accessibility & quality bar

Target: WCAG 2.2 AA.

| Area | Requirement |
|---|---|
| Keyboard | Every interactive element is reachable with Tab in visual order and works with Enter/Space. Custom controls use native elements or the correct ARIA pattern: category rows = checkboxes; rating, price, slot and service options = radio groups (arrow keys move); the verified toggle and availability switch = `role="switch"` with `aria-checked`; status tabs = `tablist` (or links with `aria-current` where they change the URL); star rating input = radio group. A `Skip to content` link is the first focusable element in every layout |
| Focus | Visible ring on every focusable element: 2px `primary` outline, 2px offset (on dark surfaces such as the footer, CTA band and toast, a 2px white outline). Never `outline: none` without a replacement (the prototype removes outlines from search inputs; Δ the search bar container gets `:focus-within` ring instead) |
| Focus management | Dialogs, sheets and drawers trap focus, close on Esc and return focus to the trigger. After route changes, focus moves to the page H1. After a list filter changes, the result count is announced via aria-live polite (`{n} providers found`) |
| Touch targets | ≥ 44 × 44 on phone for every control, including checkbox rows, rating options, pagination, chips (32 visual height, 44 hit area via padding), icon buttons, toast actions and tooltip triggers |
| Labels | Every input has a visible `<label>` (the search bar's "Service"/"Location" micro-labels are real labels). Help text and errors are linked with `aria-describedby`; invalid fields get `aria-invalid="true"`. Required fields are marked in the label (`(required)` for screen readers; optional fields show `Optional` visibly) |
| Contrast | Text ≥ 4.5:1 (≥ 3:1 for ≥ 18.66px bold / 24px). Approved fixes: `text-subtle` `#6E7482`, `success-text` `#17703D`. `#8A909C` is allowed only for icons and decoration. Placeholder text uses `text-subtle`. Verified: `text-muted` on white 6.8:1, `warning-text` on `warning-soft` 5.1:1, `danger-text` on `danger-soft` 5.1:1, `primary` on `primary-soft` 6.8:1, `on-accent` on `accent` 6.5:1, footer text 10:1, CTA band text 5.9:1 |
| Non-text contrast | Focus and selected states use `primary` (≥ 3:1). The prototype's resting input/checkbox borders (`#E3E6EB` ≈ 1.2:1, `#C5CBD5` ≈ 1.6:1) are below the 3:1 that WCAG 1.4.11 asks for; v1 keeps them pending §10.2 #17. Card borders are decorative and unaffected |
| Tooltip | The "What does Verified mean?" tip opens on hover, focus **and** tap/click; it closes on Esc, outside tap and blur. The trigger is a `button` with `aria-expanded` and `aria-describedby`. The content is also reachable as text (About page) |
| Status | Status is never conveyed by colour alone: pills always carry the text label; the dot is decorative (`aria-hidden`) |
| Stars | Rating displays have a text alternative: `aria-label="Rated 4.9 out of 5, 212 reviews"`; decorative star glyphs are `aria-hidden` |
| Images | Provider photos alt = business name; hero image alt describes it; category icons `aria-hidden` with visible names |
| Live regions | Toasts `role="status"`; form-level error banners `role="alert"`; count badges have text equivalents (`3 new requests`) |
| Motion | `prefers-reduced-motion`: no lift on hover, no slide on sheets (fade), no skeleton pulse, no smooth scroll |
| Zoom & reflow | Usable at 200% zoom and 320 px width with no horizontal page scroll (tables become cards) |
| Language & formats | `lang="en"`; dates and phone numbers follow §1.3 |
| Performance (quality bar) | Phone LCP ≤ 2.5 s on a mid-range device over 4G for S1, S2 and S3; images responsive and lazy-loaded below the fold; fonts `font-display: swap` |

---

## 10. Open questions

### 10.1 Resolved at gate (2026-11-22)
| # | Question | Decision |
|---|---|---|
| G1 | Undo on accept/decline | No Undo (F-49). Accept = dialog with optional agreed price; Decline = confirm with optional reason. Undo toast kept only for unsave |
| G2 | Verified tooltip | BR-20 copy; filter sub-label `ID checked by Fixit` |
| G3 | Prototype localisation | Copy verbatim except Western Province, LKR (BR-09), town names, "Based in your town first", no distance |
| G4 | Price filter | 4 option rows (Any, ≤ 2,000, ≤ 5,000, ≤ 10,000) |
| G5 | Discover URL | All filters in the URL; new search resets rating/verified/price/page (§8.2) |
| G6 | Featured header | Kept; subline `Highly rated, verified pros in the Western Province.` |
| G7 | Image placeholders | Category-icon tile fallback; real hero photo supplied by the team (see 10.2 #1) |
| G8 | Dashboard date/greeting | Live Asia/Colombo date; time-of-day greeting |
| G9 | Contrast | `text-subtle` → `#6E7482`; new `success-text` `#17703D` |
| G10 | Provider nav | 8 items, incl. Service areas and Verification |
| G11 | Pause switch | In S20 header and S28 |
| G12 | Emails | Subject lines only (§8.6) |
| G13 | Sign-up | One screen; `?intent=provider` variant |
| G14 | Admin sign-in | Separate `/admin/login`, email+password only, unlinked |

### 10.2 Still open (defaults used in this spec; confirm or change)
| # | Question | Default used |
|---|---|---|
| 1 | Hero photo: who supplies it, and what are the usage rights? | `primary-soft` panel until supplied |
| 2 | Public contact email address for S11, S18, S22 and error copy | `{contact email}` placeholder |
| 3 | Link lifetimes | Confirmation 24 h; password reset 1 h |
| 4 | Verification turnaround promised to providers | "1–2 working days" (S26) |
| 5 | Text limits not in PRODUCT | Business name 2–60, bio 30–600, service name 2–60, address line 5–120, reply 2–1,000, reasons ≤ 500 (admin 10–500), category name 2–40, town 2–40 |
| 6 | Service price bounds; agreed-price bounds | LKR 100–1,000,000; agreed price 1–10,000,000 |
| 7 | Photo requirements | JPG/PNG/WebP, ≤ 5 MB, ≥ 400 × 400, auto square crop |
| 8 | Can a provider switch off the provider role? PRODUCT has no exit | No; S18 shows the switch on and disabled, pointing to pause (F-22) or Contact |
| 9 | Admin cancel of **Pending** requests: BR-30 says "any open request" but §6.1 lists only Accepted → Cancelled | Allowed for Pending and Accepted (S36) |
| 10 | Should the author of a hidden review be told, and see the reason? | Author sees a `Hidden` pill on S15, no reason, no email |
| 11 | Should providers see reviews hidden on their listing? | No (S27 lists visible only) |
| 12 | Hiding a category that still has providers | Not allowed until it has 0 providers |
| 13 | Customer-facing reason when a customer is suspended | Provider sees `Customer account closed` |
| 14 | Pagination sizes | Discover 10; My requests and provider requests 20; admin lists 25; reviews 5 + 10 more |
| 15 | Privacy page copy (PRODUCT §11) | Headings fixed; body blocked on the legal draft — S11 must not ship with placeholders |
| 16 | Re-verification re-queues the last approved documents without re-upload (§8.5 step 4) | Yes |
| 17 | Resting input and checkbox borders fail 3:1 non-text contrast. Darken them to `#8A909C` (3.2:1), or keep the prototype look? | Keep the prototype look for v1 |
