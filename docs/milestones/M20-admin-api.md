# M20 — Admin API
Phase: C   Depends on: M19   Est: 1½ days
Mock domains after this milestone: none (`VITE_MOCK_DOMAINS=none`)

## Goal
The admin console runs on real data: the overview's attention counts, the verification queue with approve/reject, user search with suspend/reactivate and its automatic request cascade, and review moderation with rating recompute. Every admin mutation writes an audit row in the same transaction and emails the people affected. After this milestone nothing is mocked.

## Scope
- PRODUCT F-31, F-32, F-33, F-26 (verification approved/rejected, suspension cascade, account suspended/reactivated emails); BR-18 – BR-20, BR-27, BR-29, BR-40 – BR-43.
- ARCHITECTURE §3.6 rows: `GET /admin/overview` (attention part), `GET /admin/verifications`, `GET /admin/verifications/:id`, approve, reject, `GET /admin/users`, `GET /admin/users/:id`, suspend, reactivate, `GET /admin/reviews`, hide, restore; §6.1 suspension (revoke all refresh tokens; next call 401), §7.4 suspension cascade (system transitions via `assertTransition`, reasons `Provider unavailable` / `Customer account closed`), §7.7 recompute on hide/restore, §7.9 `AuditService.record(tx, …)`, D14.
- Matrix rows; integration tests for the cascade, `cannot_suspend_admin`, `already_in_state`, approve/reject of a non-pending submission → 409, audit rows present.

## Out of scope
- `/admin/requests*` (F-35, M23), overview metrics (F-36, M25), `/admin/catalog*` (F-34, M26).

## Acceptance criteria
1. The authorization matrix rows for every M20 endpoint pass (customer/provider → 403, anon → 401; `GET /admin/users/{adminId}` → 404).
2. With `VITE_MOCK_DOMAINS=none`, every M13 user-visible criterion passes on real data at 1440px and 390px.
3. Approve p02 → profile shows Verified, Discover "Verified only" includes it, Mailpit has the approval email, S32 moves to the next pending item. Reject with a reason → provider's S26 shows `Reason: …`, Mailpit has the rejection email.
4. Suspend p08's owner → in one transaction its pending requests become Declined and accepted ones Cancelled with `Provider unavailable` and `system` events; affected customers and the provider are emailed; the owner's next API call returns 401 `ACCOUNT_SUSPENDED` and the web shows the suspended login banner; p08 is gone from search and its link 404s. Reactivate → listing back, closed requests stay closed, verification unchanged, email sent.
5. Suspending a customer cancels their open requests with `Customer account closed` shown to providers; their reviews stay visible.
6. Hide a review → S3 rating/count recomputed, the reply (if any) hidden too, S37 shows `Hidden {date} by {admin} · Reason: …` from the audit log; restore reverts.
7. `pnpm dev` with `VITE_MOCK_DOMAINS=none`: click through every Must screen as guest, Olivia, Marcus and Admin with no MSW registered (DevPanel shows no mocked domains) and no console errors.

## Notes for the planner
- S34 account history and S37 hidden metadata read from `AuditLog`; S32 previous decisions read from `VerificationSubmission`.
- Overview `oldest {n} days` is computed in Colombo time with the injected clock.
- Keep the `AdminOverview` metrics fields as the contract allows (absent/unused until M25).
- Run `pnpm e2e` locally at the end if M21's specs exist; otherwise record a manual smoke in the review.
