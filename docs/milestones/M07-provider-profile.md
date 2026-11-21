# M07 — Provider public profile
Phase: B   Depends on: M04, M06   Est: 1 day
Mock domains after this milestone: all

## Goal
Visitors can open a provider's public profile to read about them, their services and prices, service area and reviews, check what "Verified" means, and start a request. The Request Service button shows the right state for each viewer (guest, own listing, paused, open request, limit reached, admin).

## Scope
- PRODUCT F-09, F-04 (guest → login → back to the form), F-14 (S3 disabled states), F-29; BR-01, BR-09, BR-10, BR-11, BR-15 display, BR-16, BR-20 tooltip copy, BR-27, BR-33 display, BR-41 (suspended → not found).
- SPEC S3 (E1–E14 except E8 Save and E12 reply, which are flag-gated), "Request Service states" table, §6.1 profile skeleton.
- ARCHITECTURE §3.2 `GET /providers/:id`, `GET /providers/:id/reviews` (5 then 10 more); §3.4 `GET /me/request-eligibility/:providerId` (domain `requests`); contracts `ProviderPublicProfile`, `PublicReview`, `Service`, `Eligibility`.

## Out of scope
- Save button (F-10, Backlog) and provider replies display (F-23, M27) — hidden by flags.
- Request form itself (M08); `Request Service` navigates to `/providers/{id}/request`.

## Acceptance criteria
1. At 1440px `/providers/p01`: back link (returns to the exact last Discover URL, else `/discover`), header card with photo or category tile, `Owned & run by Marcus Bell`, stars + rating + `{n} reviews` (smooth-scrolls to `#reviews`), town, years, Verified badge, `Starting at` price, Request Service; below, About, Services offered (each with `from LKR … / hour` or `LKR … fixed`) + BR-11 note, Reviews, sticky Service area aside (base town first with `Based here`, rest alphabetical).
2. Verified badge tooltip opens on hover, keyboard focus **and** tap, closes on Esc / tap outside, and reads `Fixit has checked this provider's national ID and, where listed, their trade qualification.` An unverified provider shows `Not yet verified`.
3. Reviews show 5 newest with `Sarah K.`-style names and `12 Sep 2026` dates; `Show more reviews` loads 10 more and disappears when all are shown. A provider with 0 reviews shows `New` and the `No reviews yet` card.
4. Request Service states (each demoable via DevPanel personas / fixtures): Admin → hidden; Marcus on p01 → `Edit your listing` → `/dashboard/profile` + `This is your listing.`; guest → `/login?next=/providers/p01/request` and after logging in as Olivia lands on `/providers/p01/request`; Olivia with an open request to that provider → `View your request` → `/requests/{ref}`; a customer with 5 open requests → disabled with the 5-requests helper; a paused fixture provider → disabled with `{Business} isn't taking new requests right now.`
5. At 390px: header stacks (88×88 photo beside name), meta one per line, sections in order About → Services → Service area → Reviews, and a sticky bottom bar with `Starting at` + full-width `Request Service`; page bottom padding clears the bar; tooltip clamps to the viewport. At 800px the aside moves under Reviews.
6. `/providers/unknown`, a suspended provider and Kasun's draft listing show only `This provider couldn't be found.` + `Browse all providers`.
7. Loading shows the profile skeleton; a forced 500 on reviews shows a section error inside Reviews while the rest of the profile renders.
8. Vitest: the eligibility → button-state mapping follows the SPEC evaluation order; the mock eligibility handler returns `own_listing`, `open_with_provider` (with ref), `open_limit_reached`, `provider_paused`, `ok` for the matching fixtures.

## Notes for the planner
- The button state comes from the server's `Eligibility` (plus client-only `guest`), never from client-side rule evaluation (ARCHITECTURE §2.8 "the web never calls canTransition").
- `paused` exists in fixtures/contract now; the pause *switch* is M24. Make sure at least one fixture provider is paused so the state can be shown.
- Eligibility handler lives in `mocks/handlers/requests.ts` even though the screen is in `provider-profile`.
