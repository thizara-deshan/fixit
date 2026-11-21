# M10 — Provider overview & requests
Phase: B   Depends on: M08   Est: 1½ days
Mock domains after this milestone: all

## Goal
Providers see their workload at a glance on the dashboard (greeting, four stat tiles, latest requests, My Services), work through every request in a searchable inbox, and open a request to accept (with an optional agreed price), decline (with an optional reason), update the agreed price and mark it completed on or after the job date. Customer contact details appear only after accepting.

## Scope
- PRODUCT F-17, F-18, F-19, F-25 (display), F-27 (provider side), F-29 (rating tile); BR-12, BR-32, §6.3 privacy (Pending → `Olivia M.`, Accepted/Completed → full contact, closed → back to Pending view).
- SPEC S20 (E1–E3, E5–E14, E16; **not** E4 availability switch and E15 completeness — flag-gated for M24), S21 (tabs incl. Cancelled/Expired, search, `?status=&q=&page=`, Pending ordering by `expiresAt`, `Reply by …` line), S22 (customer card, job details, actions card per status, history, inline agreed price), §6.5 accept/decline = confirm → server → row flash, no Undo, §8.1 A13–A16.
- ARCHITECTURE §3.3 `GET /me/provider/dashboard`; §3.4 `GET /me/provider/requests`, `GET /me/provider/requests/:ref`, `POST …/accept`, `…/decline`, `…/complete`, `PUT …/agreed-price` (MSW, via `assertTransition` and `toProviderView`); contracts `ProviderDashboard`, `ProviderRequestView`, `CustomerContact`, `AcceptBody`, `DeclineBody`, `CompleteBody`, `AgreedPriceBody`, `ProviderRequestListQuery`; §4.2 `useAcceptRequest` pattern; §4.2 60 s refetch on dashboard/inbox.

## Out of scope
- Pause switch and completeness checklist (M24). Average-rating tile links to `/dashboard/reviews` only when that flag is on (M27).
- Emails (M18).

## Acceptance criteria
1. At 1440px as Marcus, `/dashboard`: date line `{Sun, 22 Nov 2026}` (Colombo), `Good morning|afternoon|evening, Marcus` by local time, sub `You have {n} new requests waiting for a reply.` (or `You're all caught up.`), `View public profile` (new tab), 4 stat tiles (New requests, Accepted, Completed this month, Average rating) each linking to the filtered inbox, the requests table (≤ 8 newest, tabs All/Pending/Accepted/Completed/Declined) and the My Services card with `from LKR … / hour` rows.
2. Accept from the S20 row: dialog with optional agreed price (`Enter a whole amount in rupees, like 6500.` for `6.5`) → toast `Accepted Olivia's request`, the row flashes `primary-flash` ~900 ms, its pill becomes Accepted and the name becomes `Olivia Martinez`; the New requests tile and sidebar badge decrease by 1.
3. Decline from S21: confirm dialog with optional reason → toast `Declined Olivia's request`; no Undo anywhere. Switching to Olivia shows the decline and reason on S15.
4. `/dashboard/requests`: H1 `Requests`, 7 tabs with counts, search by name or ref (`No requests match "{q}".` + `Clear search`), Pending tab ordered by most urgent with `Reply by {Sat 3:42 PM}`, pagination 20, URL state survives reload.
5. `/dashboard/requests/{ref}`: Pending → customer card shows `Olivia M.`, town and the Lock note; after Accept → full name, address, mobile with `Call`/`Copy`. Accepted with a future date → `Mark as completed` disabled with `You can mark this job completed from {date}.`; the accepted-today fixture → enabled → confirm → toast `Job marked completed.`, actions card shows `Completed on {date}` and `The customer can review until {date}.` Agreed price `Add`/`Edit` inline → toast `Agreed price saved.`; Olivia then sees it on S15.
6. Declined / Cancelled (by customer, by Fixit) / Expired requests show the S22.E6 copy, the closed-privacy note and the `Olivia M.` view again.
7. At 390px: stats 2×2, availability row absent (flag off), request cards with full-width 50/50 `Accept`/`Decline` on Pending, S22 sticky bottom bar `Decline` / `Accept`, dialogs as bottom sheets; at 800px the sidebar is a drawer. No horizontal scroll.
8. Empty / loading / error: a provider with no requests sees `No requests yet` (and `No requests with this status.` per tab); table and tile skeletons on load; forced `409 INVALID_TRANSITION` on accept shows the SPEC conflict copy and refreshes the row to its real status; forced 500 shows the section error.
9. Access: Olivia (not a provider) → `/dashboard*` redirects to `/become-a-provider/1`; another provider's ref → S39 request variant (`Go to requests`); Admin → S40.
10. Vitest: `toProviderView` hides contact for pending/declined/cancelled/expired and reveals it for accepted/completed (absent keys, not empty strings); mock accept on an expired pending request is refused `expired`.

## Notes for the planner
- `ProviderDashboard` must not *require* the checklist (F-21, M24) — keep it optional/nullable in the contract or ship it but leave the UI flag off; confirm the shape against ARCHITECTURE §2.1 and raise a Blocker if it can't be optional.
- Accept/Decline are not optimistic (SPEC §6.5, D21). Use `setQueryData` + domain-wide invalidation (`requests`, `providers` dashboard) as in ARCHITECTURE §4.2.
- The sidebar Requests badge and top-bar icon count use `Me.provider.pendingRequestCount`; refetch `/auth/me` after accept/decline.
