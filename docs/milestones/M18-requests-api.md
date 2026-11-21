# M18 — Requests API, expiry & request emails
Phase: C   Depends on: M17   Est: 1½ days
Mock domains after this milestone: `reviews,admin`

## Goal
The booking lifecycle runs on the server: eligibility, creating requests under a lock so limits can't race, customer cancel, provider accept / decline / complete / agreed price, and automatic expiry every minute. Every change goes through the shared state machine inside a transaction with its history row, privacy projections decide who sees contact details, and both parties get the SPEC emails after commit.

## Scope
- PRODUCT F-11, F-12, F-13, F-14, F-17 (request list/detail), F-18, F-19, F-25, F-26 (request events), F-27; §6.1 state machine, §6.2 fields, §6.3 privacy; BR-12, BR-16, BR-23, BR-30 – BR-34; §8 emails: new request, accepted, declined, cancelled by customer, expired, completed (with review link).
- ARCHITECTURE §3.4 all rows (eligibility, `POST/GET /me/requests`, `GET /me/requests/:ref`, cancel, provider list/detail, accept, decline, complete, agreed-price, expiry job); §7.4 transaction + `lockRequest` + `assertTransition` + `RequestStatusEvent` pattern, create locks the customer row, `checkCreateRequest` via `*.policies.ts`, expiry `@Cron` (≤ 200/run, idempotent, refresh-token cleanup), §7.5 refs, §7.3 `TransitionError` mapping (not_owner → 404, not_allowed_for_actor → 403, else 409), D6, D7, D8, D18.
- Matrix rows for every requests endpoint; integration tests incl. concurrent BR-33 create, double accept, expiry run with FakeClock, privacy probe on every view.

## Out of scope
- Posting reviews (M19). Admin cancel and suspension cascade (M23 / M20).

## Acceptance criteria
1. The authorization matrix rows for all §3.4 endpoints pass; another customer's or provider's ref → 404; an admin → 403; the privacy probe finds no customer mobile/address/full name in a pending/declined/cancelled/expired `ProviderRequestView`, and no provider mobile in a pending `CustomerRequestView`.
2. With `VITE_MOCK_DOMAINS=reviews,admin`, every M07 (Request Service states), M08, M09 (except posting the review, still mocked) and M10 user-visible criterion passes on real data at 1440px and 390px.
3. Olivia sends a request → S13 shows `FX-2062` (or the next sequence value) and the deadline; Mailpit has `New request` for Marcus; Marcus accepts with LKR 6,500 → Mailpit has the accepted email to Olivia with his phone and price; S15 shows his mobile and the agreed price; S22 shows her full contact.
4. Concurrency (integration): two simultaneous creates by a customer at 4 open requests → exactly one succeeds, the other 422 `open_limit_reached`; two simultaneous accepts → one 200, one 409 `INVALID_TRANSITION`.
5. Expiry: with FakeClock at `expiresAt`, `ExpiryJob.run(now)` moves the pending request to Expired with a `system` event and emails both parties; a second run changes nothing. In the UI, a request whose deadline passed shows Expired on S15/S22 after the next minute.
6. Rules over HTTP: customer cancel of an accepted request at 00:00 Colombo on the preferred date → 409 `past_cancel_deadline`; complete before the preferred date → 409 `before_preferred_date`; create for the provider's own listing → 422 `own_listing`; town not served → 422 `town_not_served`; date tomorrow-1 → 400 with the SPEC range message.
7. Completing the seeded accepted-today request emails Olivia the review link `{APP_ORIGIN}/requests/{ref}/review`; the dashboard tiles and the sidebar pending badge update after each action.
8. Email failures (MemoryMail throwing) are logged and never fail the request.

## Notes for the planner
- Never `new Date()` in services; `Clock` everywhere. Views computed with `toCustomerView/toProviderView(record, now)` from contracts; the mapper builds a `RequestRecord` and nothing else.
- `canCancel`, `canComplete`, `cancelDeadline`, `expiresAt` in views come from contracts rules — the same ones the mock used.
- Mixed mode: `reviews` is still mocked, so S15's review block posts to MSW; that's expected until M19.
- `ENABLE_JOBS=false` in tests; call the job directly.
