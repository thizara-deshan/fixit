# M12 — Provider business: services, profile, areas
Phase: B   Depends on: M11   Est: 1 day
Mock domains after this milestone: all

## Goal
A published provider keeps their listing current: adds, edits and deletes services and prices (with the "Starting at" preview), edits business details and photo, and changes their service towns. Changing the business name or category asks for confirmation and sends the listing back to verification.

## Scope
- PRODUCT F-20; BR-09, BR-10, BR-13, BR-14, BR-21 (re-verification), §8 badge-removed email (UI only).
- SPEC S23 My Services (Starting-at preview tile, table/cards, add/edit dialog with live `Shows as`, delete confirm, limits 1–20), S24 Business profile (photo card `#photo`, business details card, inline re-verify warning, re-verify dialog), S25 Service areas, §6.7, §6.8 "back in review" banner, §8.1 A23–A26.
- ARCHITECTURE §3.3 `PATCH /me/provider/business` (`UpdateBusinessResult {provider, reverification}`), `POST/PATCH/DELETE /me/provider/services…`, `PUT /me/provider/areas` (MSW); `computeStartingPrice()` (ties per_hour < per_visit < fixed) recomputed in the mock on every service change; reuse the M11 editors.

## Out of scope
- Pause and settings (M24), provider reviews (M27). Re-verification email (M17).

## Acceptance criteria
1. At 1440px as Marcus, `/dashboard/services`: header + `Add service`, preview tile `Starting at LKR 2,500 / hour`, table Service · Price · Unit · Shows as · edit/delete. Add `Gutter cleaning` LKR 1,500 per visit → toast `Service added.` and the preview changes to `LKR 1,500 / visit`; the S3 profile and Discover card show the new starting price.
2. Dialog errors: duplicate name → `You already have a service with this name.`; price 50 → `Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.`; no unit → `Choose how this price is charged.` Edit → toast `Service saved.`; delete → `Delete {name}?` → toast `Service deleted.` With 1 service left, delete is disabled with `You need at least one service.` (tap shows the tip); at 20 services `Add service` is disabled with `You can list up to 20 services.`
3. `/dashboard/profile`: photo card (upload/replace/remove with confirm `Remove your photo?` → `Photo removed.`), business details card. Changing only the bio → toast `Changes saved.` Changing business name while Verified → inline warning under the field, Save → `Save and re-verify?` dialog → toast `Saved. Your listing is back in review.`, the Verified badge disappears from S3 and S26 shows Pending review. Same for a category change.
4. `/dashboard/areas`: choose a new base town → it is unticked from other towns automatically; counter and 9-town limit as in M11; Save → toast `Service areas saved.`; Discover with that town's `loc` now includes/excludes Marcus accordingly.
5. At 390px: services as cards with 44×44 icon buttons, `Add service` full width under the header, dialogs as bottom sheets, Save buttons full width, area checkboxes 1 column with 44-high rows; no horizontal scroll.
6. Loading skeletons on each page; forced 500 on save keeps the dialog/form open with values and shows the form banner; forced `RULE_VIOLATION services_min` on delete shows its SPEC copy.
7. Access: Olivia (not a provider) → redirected to `/become-a-provider/1`; Admin → S40; a service id of another provider via PATCH returns 404 in the mock.
8. Vitest: `computeStartingPrice` (lowest, tie order), BR-21 rule in the mock (name/category change from verified → pending_review with `reverificationReason`; from pending_review/not_submitted/rejected → no change; decision 006).

## Notes for the planner
- Re-verification re-queues the last approved documents without re-upload (SPEC §10.2 #16) — the mock creates a new pending submission with trigger `business_name` / `category`.
- Leaving a dirty S24/S25 form or the S23 dialog asks `Discard changes?`.
