# M05 — Home & site pages
Phase: B   Depends on: M03   Est: 1 day
Mock domains after this milestone: all

## Goal
The public Home page matches the prototype (localised for Sri Lanka) with a working search hand-off to Discover, the category grid, featured providers and the role-aware provider CTA. The For providers, About, Contact and Privacy pages exist.

## Scope
- PRODUCT F-05, F-06 (search hand-off only), F-15 (S4 entry), F-29 (rating / "New" on cards), F-37; BR-08 (featured rule), BR-09 (price labels).
- SPEC S1 (E1–E12, desktop / tablet / phone layouts), S4 For providers, S11 About · Contact · Privacy (Privacy shows the fixed headings with `Content coming before launch.`).
- ARCHITECTURE §3.2 `GET /catalog`, `GET /providers/featured` as MSW handlers + `ENDPOINTS` entries; contracts `Category`, `District`, `Town`, `CatalogResponse`, `ProviderCard`, `StartingPrice`, `priceLabel()`.
- `VITE_CONTACT_EMAIL` in Contact copy.

## Out of scope
- Discover results (M06) — the search submits to `/discover?…`, which can still be a placeholder until M06.
- Final Privacy body copy (needed by M22; see M00 gap #1). Hero photo asset (placeholder `primary-soft` panel).

## Acceptance criteria
1. At 1440px: Home shows hero (eyebrow `Verified pros across the Western Province`, H1, lead, search bar with Service + Location grouped by Colombo / Gampaha / Kalutara), Popular services 4-column grid of the 8 categories, Featured providers (≤ 4 verified providers with ≥ 1 review in Top-rated order), How it works (3 steps), CTA band, footer.
2. At 390px: search bar stacks (Service, divider, Location, full-width Search), hero image under the search with only the provider floating card, categories 2 columns with blurbs clamped to 2 lines, featured 1 column, CTA buttons full width; no horizontal scroll. At 800px categories/featured are 2 columns.
3. Type "plumb", pick "Dehiwala-Mount Lavinia", press Enter → URL is `/discover?q=plumb&loc=dehiwala-mount-lavinia`; empty fields are omitted. Tapping the `Cleaning` chip fills the input without submitting.
4. Category card → `/discover?cat=plumbing`. Featured card name / `View profile` → `/providers/{id}`; prices read `From` / `LKR 2,500 / hour`; a provider with no photo shows the category-icon tile.
5. CTA band: guest `Join as a provider` → `/signup?intent=provider`; Olivia → `/become-a-provider/1`; Marcus sees `Go to your dashboard` → `/dashboard`. Same rules on S4's primary CTA and CTA band.
6. Loading: featured cards and category grid show skeletons of the final size; error (DevPanel forced 500 on featured) shows a section error with `Try again` while the rest of Home works; 0 qualifying providers hides the Featured section and the hero floating card.
7. `/about`, `/contact`, `/privacy` render the S11 article card at 1440px and 390px (padding 24, gutter 16); Contact shows `hello@fixit.test`; Privacy shows each heading with `Content coming before launch.`; footer "How it works" scrolls to `#how-it-works` with the 72px offset.

## Notes for the planner
- Featured selection (BR-08) and ordering use `compareProviders('rating')` from contracts `search/` in the mock; write that comparator + test here if M06 hasn't (M06 extends it).
- Category order = admin `order`; icons per SPEC §2.10 via the `CategoryIcon` enum → lucide map in one shared component.
- Price label is `priceLabel()` from contracts, displayed through `lib/format.ts`.
- S4 is static except the role-aware CTA; role comes from the auth store (UX only).
