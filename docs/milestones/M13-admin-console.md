# M13 — Admin console (Must)
Phase: B   Depends on: M09, M11   Est: 1½ days
Mock domains after this milestone: all

## Goal
A super admin works the verification queue (view documents, approve or reject with a reason), finds users and suspends or reactivates them with the automatic request effects, and hides or restores reviews. The overview shows what needs attention. This completes the Must frontend on mocks.

## Scope
- PRODUCT F-31, F-32, F-33, F-29 (rating recalculated on hide/restore); BR-18, BR-19, BR-20, BR-27, BR-29, BR-40, BR-41, BR-42, BR-43.
- SPEC L4 (nav with Verification badge), S30 "Needs attention" tiles only (E1–E2), S31 Verification queue (tabs, oldest first, pagination 25), S32 Verification review (document tiles + full-screen viewer, provider card, local checklist, previous decisions, approve/reject dialogs, go to next), S33 Users (search, tabs, table/cards), S34 User detail (header card, listing, requests as customer/provider, account history, suspend/reactivate dialogs with computed effects), S37 Reviews moderation (search, tabs, hide/restore, hidden metadata), §8.1 A29–A33, §8.5.
- ARCHITECTURE §3.6 MSW handlers: `GET /admin/overview` (attention part), verifications ×4, users ×4, reviews ×3; contracts `VerificationQueueQuery/Row`, `VerificationDetail`, `RejectBody`, `AdminUserListQuery/Row`, `AdminUserDetail`, `SuspendBody`, `ReactivateBody`, `ModerationQuery/Row`, `HideReviewBody`, `AuditEntry`, `AdminOverview`; suspension cascade in the mock via `assertTransition` with actor `system`; mock `audit` rows.

## Out of scope
- S30 metrics (F-36, M25), S35/S36 all requests (F-35, M23), S38 catalog (F-34, M26) — nav items hidden by flags.
- Emails (M20).

## Acceptance criteria
1. At 1440px as Admin, `/admin`: date line, H1 `Overview`, tiles `Waiting for verification` (`{n}` / `oldest {d} days`, or `0` / `all caught up`) → `/admin/verifications`, and `Suspended accounts` → `/admin/users?status=suspended`. No metrics section.
2. `/admin/verifications`: Pending review tab lists p02 (oldest first) with Provider, Category, Submitted (`{21 Nov}` + `{3 days ago}`), Attempt (`First` / `Resubmission {n}`), `Review`. Approved/Rejected tabs work; an empty Pending tab shows `Nothing to review`.
3. `/admin/verifications/{id}`: 4 document tiles (missing optional → `Not provided`); a tile opens the full-screen viewer (fit / 100% / pinch, PDF embedded, `Open in new tab`, Esc closes); provider card with account name, owner, email, mobile; checklist ticks are local. `Approve` → `Approve {Business}?` → toast `{Business} is verified.` → next pending submission or the queue's empty state; the public profile now shows the Verified badge. `Reject` with a 5-char reason → `Give a reason so the provider knows what to fix.`; a valid reason → toast `Rejected. {Business} has been emailed.` and the provider's S26 shows the reason.
4. `/admin/users`: search `marcus` finds Marcus; tabs All/Customers/Providers/Suspended; `No users match "{q}"` + `Clear search`; URL `?q=&role=&status=&page=` survives reload.
5. `/admin/users/{p08 owner}`: `Suspend account` dialog lists the computed effects (`{n} pending requests will be declined and {m} accepted requests cancelled. Customers are emailed.` etc.); reason required (10–500) → toast `{name} is suspended.`; the status pill becomes Suspended, Account history adds the entry, p08 disappears from Discover and its profile shows "couldn't be found", and the affected customer's S15 shows `Reason: Provider unavailable`. The suspended user can't sign in (DevPanel login shows the suspended banner). `Reactivate` → toast `{name} is active again.`; the listing returns; closed requests stay closed; verification unchanged. Admin accounts can't be opened (404).
6. `/admin/reviews`: search, tabs All/Visible/Hidden; `Hide` with reason → toast `Review hidden. {Business}'s rating is updated.` and the provider's rating/count change on S3; hidden rows show `Hidden {date} by {admin} · Reason: …`; `Restore` → toast `Review restored.` and the rating returns.
7. At 390px: tables become cards, S32 actions move to a sticky bottom bar (`Reject` / `Approve`), S34's action is a full-width button under the header, S37 actions sit under the body, dialogs are bottom sheets; the top bar shows the Verification icon with its count; no horizontal scroll. At 800px the sidebar is a drawer.
8. Loading skeletons on every admin page; forced 500 shows the section error; forced `409` on approve (already decided) shows the conflict copy and refreshes the item.
9. Access: Olivia and Marcus → `/admin*` show S40; guest → `/admin/login?next=…`.
10. Vitest: mock suspension cascade (pending → declined "Provider unavailable", accepted → cancelled, customer-side cancels with "Customer account closed" for the provider), refusing to suspend an admin (`cannot_suspend_admin`), hide/restore recomputes `ratingFrom`.

## Notes for the planner
- `AdminOverview` must allow the metrics part to be absent/unused until M25 — confirm the contract shape; raise a Blocker if it can't.
- Every admin mutation writes a mock `audit` row (shape = `AuditEntry`), mirroring the API's same-transaction rule.
- The Verification nav badge = pending-review count from `/admin/overview`, refetched every 60 s (SPEC §6.11).
- After this milestone the **frontend complete gate** is reviewed: every Must screen works with `pnpm dev:mock` at 390 and 1440.
