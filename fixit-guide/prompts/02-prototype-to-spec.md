# Prompt 02 — Prototype → Spec

> **Setup** · run once · **Model:** Opus 5.5 · new session · interactive (one or two gates)
> **Inputs:** `docs/PRODUCT.md`, `reference/prototype/unpacked/*`, `reference/screens/*.png`
> **Output:** `docs/SPEC.md`

## When to use
Right after PRODUCT is approved. Two jobs:
1. **Extract** the 4 prototype screens exactly: elements, states, copy, design tokens.
2. **Design on paper** every screen PRODUCT needs that the prototype lacks (auth, booking
   form, customer area, provider management, admin console), plus **phone layouts for
   all screens**, because the prototype breaks at 390px. Everything is written in the
   prototype's visual language.

Every later prompt points to SPEC IDs (S3.E4…), so be thorough here.

## Variables
```
{{EXTRA_NOTES}}  — anything visual you already want (or "none")
```

## The prompt
````text
You are a senior product designer + front-end lead writing the UI build spec
for "Fixit", a home-service booking marketplace with three roles.

### Inputs
- `docs/PRODUCT.md` — roles, features (F-xx), lifecycle, business rules (BR-xx).
- `reference/prototype/unpacked/source.html` (authoritative for exact colors,
  sizes, radii, shadows, fonts, copy), `markup.html`, `logic.js`, `data.json`.
- `reference/screens/*-desktop.png` and `*-phone.png`. Look at each one at full
  detail. NOTE: the phone screenshots show the prototype is NOT responsive;
  they show what to fix, not what to copy.
- Notes: {{EXTRA_NOTES}}

Ignore prototype-only artifacts: "coming in the next milestone" modals, the
"Sample requests — prototype" badge, the fixed date "Friday, October 9, 2026",
placeholder boxes ("provider photo", "map — Austin metro coverage") which
become real images/an area list.

### Process
1. **Design tokens** (from source.html, so exact, not estimated): colors as
   semantic roles (primary, primary-hover, primary-soft, page, surface,
   border, border-strong, text, text-muted, text-subtle, success(+soft),
   warning/pending(+soft,+text), danger(+soft,+text), accent-orange for the
   provider CTA band), typography (families, the size/weight/line-height
   scale actually used), radii, shadows (incl. hover elevation), spacing,
   content max-width, nav height, breakpoints. Status-pill color sets for
   every request status in PRODUCT (prototype defines 4; design the rest
   to match). Map the Material Symbols icons used → lucide-react names.
2. **Layouts (app frames).** L1 Public (top nav + footer), L2 Customer
   area, L3 Provider dashboard (sidebar as in prototype), L4 Admin console
   (same sidebar pattern, distinguishable, e.g. a different badge than
   "Pro"). For each: desktop + phone (≤ 640px: e.g. sidebar → top bar +
   sheet/drawer; nav → hamburger), and what the nav shows for guest vs
   logged-in per role.
3. **Screen inventory.** Every screen needed by PRODUCT's v1 features:
   ID, route (real paths, not hash routes; e.g. /, /discover, /providers/:id),
   layout, roles allowed, feature IDs, source = PROTOTYPE | INFERRED.
   Expect roughly: home, discover, provider profile, login, sign-up
   (customer / provider), forgot/reset password, request form, request
   sent confirmation, my requests (list + detail), saved providers, leave
   review, account settings; provider: overview, requests (list + detail),
   services editor, business profile, service areas, verification,
   reviews; admin: overview, verification queue + detail, providers,
   customers/users, requests, categories & locations, reviews moderation;
   plus 404 / 403 / generic error.
4. **Screen specs.** For each screen: purpose, desktop layout grid,
   **phone layout** (stacking order, what collapses into a sheet, e.g.
   Discover filters → "Filters" button opening a bottom sheet with an
   applied-count badge; tables → card lists), then an element table:
   | ID | Element | Data | States | Interaction | Copy |
   Copy verbatim for PROTOTYPE screens; propose copy for INFERRED ones in
   the same tone. Forms: every field with type, required, validation rule
   and the exact error message.
5. **Cross-cutting states.** Loading (skeletons matching the card shapes),
   empty (reuse the Discover empty-state pattern), error + retry, 403, 404,
   optimistic actions with Undo toast (as in the prototype's accept/decline),
   session expired, form submitting, unverified-provider banners.
6. **Domain model (UI view).** Entities and fields the screens display or
   submit, with enums, from data.json + PRODUCT: User, CustomerProfile,
   ProviderProfile, Category, Location, Service (name, price, unit), ServiceArea,
   ServiceRequest (ref like FX-2061, status, slot, …), Review,
   VerificationSubmission, SavedProvider, Notification. No DB detail.
7. **Interactions & rules.** Action → expected result → feedback, for every
   mutating action, referencing BR-xx and the state machine in PRODUCT.
   Include URL state for Discover (q, loc, cat, rating, verified, price,
   sort, page) so searches are shareable, as the prototype's hash does.
8. **Accessibility & quality bar.** Keyboard reachable, visible focus,
   44px min touch targets on phone, labels on inputs, contrast of the
   muted text, tooltip (the "What does Verified mean?" tip) works on tap,
   not only hover.
9. **Open questions.**

### Output — `docs/SPEC.md`
Sections: 1 Overview · 2 Design tokens · 3 Layouts · 4 Screen inventory ·
5 Screens (one subsection per screen, IDs S1…, elements S1.E1…) ·
6 Cross-cutting states · 7 Domain model · 8 Interactions & rules ·
9 Accessibility · 10 Open questions.

### Rules
- PROTOTYPE screens: describe what is there, exactly. Do not "improve" them,
  except where they break at phone width.
- INFERRED screens: reuse existing patterns (cards, pills, tables, the search
  bar, the filter sidebar, the stat tiles, the dashboard sidebar) before
  inventing new ones. Keep them minimal.
- Every v1 feature in PRODUCT must map to at least one screen; list the mapping.
- No implementation detail (file paths, libraries, endpoints) except the
  lucide icon names and the token names.

### Gate
First present: the token table, the layout list, the screen inventory
(with PROTOTYPE/INFERRED and feature mapping), and the open questions.
STOP and wait for my answers. Then write the full file. If it is very long,
write it in parts and tell me when each part is done.
````

## Tip: designing the inferred screens visually
SPEC describes the inferred screens in words, and that's enough for Sonnet to build them.
If you want them pixel-faithful, take the admin console, booking form, and provider
services editor into Claude Design using SPEC's screen descriptions, export them, re-run
the tools, and add an "Updated visuals" note to SPEC (prompt 09 if it changes decisions).

## Gate checklist
- [ ] Tokens are exact values from source (not estimated) and include all status colors
- [ ] Every screen has a phone layout, and Discover's filters and the dashboard tables are solved for 390px
- [ ] Every v1 feature in PRODUCT maps to a screen
- [ ] Every form field has its validation rule and error message
- [ ] Commit: `git add docs/SPEC.md && git commit -m "docs: SPEC"`
