# M26 — F-34 Categories & towns
Phase: E   Depends on: M25   Est: 1½ days
Mock domains after this milestone: none (MSW handlers added so `pnpm dev:mock` keeps working)

## Goal
Admins manage the catalog: add, edit, reorder and hide categories (hiding only when no provider uses one), and add or rename districts and add, edit or hide towns. Changes show on Home, Discover, onboarding and the request form straight away. Full stack; flag `adminCatalog` turned on.

## Scope
- PRODUCT F-34 (Should, priority 5); §2 launch lists stay pre-loaded.
- SPEC L4 Categories & towns nav item, S38 (Categories tab with order buttons, icon picker, provider counts, hide rules; Towns tab with district cards, rename, town dialogs, hide copy), §6.5 optimistic reorder, §8.1 A34, A35, SPEC §10.2 #12.
- ARCHITECTURE §3.6 `GET /admin/catalog`, `POST /admin/categories`, `PATCH /admin/categories/:id`, `POST /admin/categories/reorder`, `POST /admin/districts`, `PATCH /admin/districts/:id`, `POST /admin/towns`, `PATCH /admin/towns/:id`; contracts `AdminCatalog`, `CategoryUpsert`, `ReorderBody`, `DistrictUpsert`, `TownUpsert`; `searchText` bulk update on category rename (§7.6); audit rows.

## Out of scope
- Deleting categories/towns (never deleted, only hidden). Changing a provider's category from admin.

## Acceptance criteria
1. The authorization matrix rows for all 8 endpoints pass (admin only).
2. At 1440px as Admin (real data and `pnpm dev:mock`): add category `Pest Control` with the `Wrench` icon → toast `Category saved.` → it appears on Home and in the Discover filter list in the chosen order; duplicate name → `A category with this name already exists.`; blurb of 3 chars → `Write a short description, 5 to 60 characters.`
3. Reorder with up/down → Home grid and Discover list follow the new order; a forced failure reverts the order with an error toast.
4. Hiding Plumbing is disabled with `{n} providers use this category. It can't be hidden while they do.`; hiding the new empty category → confirm → toast `Category hidden.` → gone from Home, Discover and onboarding step 2; show it again → `Category shown.`
5. Renaming a category updates Discover free-text matching for its providers (`searchText`) and does not touch their verification.
6. Towns: adding a second `Wattala` to Gampaha → `{District} already has a town with this name.`; hide a town → confirm copy with provider count → it leaves the Location selects on Home/Discover/S12 and the area pickers, while existing requests still show it. Add/rename a district → toast `District saved.`
7. At 390px: tables → cards, order buttons 44×44, dialogs → bottom sheets, `?tab=` keeps the tab; no horizontal scroll. Loading skeletons; forced 500 → section error.
8. Customer and provider → `/admin/catalog` show S40.

## Notes for the planner
- `GET /catalog` (public) returns active items only; `AdminCatalog` includes hidden ones and counts.
- Invalidate the `catalog` query domain after each mutation so S1/S2 reflect changes immediately.
