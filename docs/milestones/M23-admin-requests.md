# M23 — F-35 All requests & admin cancel
Phase: E   Depends on: M22   Est: 1 day
Mock domains after this milestone: none (MSW handlers added so `pnpm dev:mock` keeps working)

## Goal
Admins can browse every request on Fixit, open one with both parties' full details and the named history, and cancel a Pending or Accepted request with a reason that both parties receive by email. Full stack: screens, mock handlers, API, matrix rows; flag `adminRequests` turned on.

## Scope
- PRODUCT F-35 (Should, priority 1); §6.1 Accepted → Cancelled by admin (and Pending, per SPEC §10.2 #9); BR-30; §8 email "Request cancelled by admin" to both parties.
- SPEC L4 Requests nav item, S35 All requests (search, `All` + six status tabs, table/cards, pagination 25, URL `?status=&q=&page=`), S36 Request detail (admin) incl. cancel dialog and closed state, §8.1 A18; S15/S22 "Cancelled by admin" copy already built.
- ARCHITECTURE §3.6 `GET /admin/requests`, `GET /admin/requests/:ref`, `POST /admin/requests/:ref/cancel`; contracts `AdminRequestListQuery`, `AdminRequestView`, `toAdminView`, `AdminCancelBody` (reason 10–500); `assertTransition` with actor admin (`reason_required`); audit row in the same transaction.

## Out of scope
- Bulk actions, editing requests. Metrics (M25).

## Acceptance criteria
1. The authorization matrix rows for the 3 endpoints pass (admin only; others 403; anon 401).
2. At 1440px, as Admin on real data (`VITE_MOCK_DOMAINS=none`) and on mocks (`pnpm dev:mock`): `/admin/requests` lists all requests newest first with Ref (mono), Customer full name, Provider business, Service, Date + slot, Town, Status; search by ref, customer or provider; tabs filter; pagination 25; URL state survives reload.
3. `/admin/requests/{accepted ref}`: customer card (name, email, mobile, address), provider card (business, owner, mobile, links to users), job details, history with every actor named. `Cancel request` → `Cancel FX-…?` dialog; reason under 10 chars → `Give a reason. Both the customer and the provider will see it.`; valid → toast `Request cancelled. Both parties have been emailed.`; Mailpit shows both emails; Olivia's S15 shows `Fixit cancelled this request` + reason, and Marcus's S22 hides the contact again.
4. A closed request shows `This request is {status}. No actions available.`; cancelling it via API → 409.
5. At 390px: table → cards, dialog → bottom sheet, action full width; no horizontal scroll. Loading skeletons; empty search `No requests match …`; forced 500 → section error.
6. Customer and provider → `/admin/requests` show S40.

## Notes for the planner
- Flip `features.adminRequests` in this milestone only; the S30 metrics rows that link to `/admin/requests?status=` come in M25.
- If this milestone is cut, PRODUCT §5 says the admin-cancel transition is removed — that would need a decision record; don't remove it silently.
