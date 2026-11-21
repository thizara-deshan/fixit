# M09 — My requests, cancel & leave a review
Phase: B   Depends on: M08   Est: 1½ days
Mock domains after this milestone: all

## Goal
Customers track every request they've sent by status, open a request to see its full history, the provider's phone once accepted, and any agreed price, cancel when the rules allow, and leave a one-time review on a completed job within 30 days. Expired, declined and cancelled requests explain what happened.

## Scope
- PRODUCT F-12, F-13, F-25 (display), F-27 (customer side), F-28, F-29 (recalc on post); BR-12, BR-24, BR-25, BR-26, BR-27, BR-30, BR-31; §6.3 privacy (customer sees provider mobile only when Accepted/Completed).
- SPEC S14 (tabs All/Open/Completed/Closed, table/cards, pagination 20, empty states), S15 (status panel table for every status incl. admin/system cancels, contact block, details, history, review block), S16 Leave a review, §8.1 A12 + A19, §8.3 request lifecycle in the UI.
- ARCHITECTURE §3.4 `GET /me/requests` (+ counts), `POST /me/requests/:ref/cancel`; §3.5 `POST /me/requests/:ref/review`; contracts `RequestListQuery`, `CancelBody`, `CreateReviewBody`, `Review`, `reviewEligibility()`, `ratingFrom()`; mock `expireDue()` at the start of each requests handler.

## Out of scope
- Provider-side actions that produce Accepted/Completed (M10) — fixtures already contain requests in every status.
- Hidden-review pill comes from fixture data only; moderation itself is M13.

## Acceptance criteria
1. At 1440px as Olivia, `/requests`: H1 `My requests`, tabs `All` / `Open` / `Completed` / `Closed` with counts, table Provider · Service · Date · Town · Status, most recently updated first. Accepted rows show `Contact details shown`; an eligible Completed row shows `Leave a review`. Tabs set `?status=` and reset the page.
2. At 390px the tabs scroll sideways and each request is a full-card link (name + compact pill, mono ref, service, date · slot · town, optional full-width action). No horizontal scroll.
3. A new user with no requests sees `No requests yet` + `Find providers`; an empty tab shows `No requests with this status.` Loading shows list skeletons; forced 500 shows the section error with `Try again`.
4. `/requests/{pending ref}`: status panel `Waiting for {Business} to reply` with the deadline; `Cancel request` → dialog (bottom sheet at 390px) with optional reason → toast `Request cancelled.`; the panel becomes `You cancelled this request`, History adds `Cancelled · {time} · by you`, and the provider's phone is not shown.
5. `/requests/{accepted ref}`: `{Business} accepted your request`, mobile `+94 77 …` with `Call` (`tel:`) and `Copy` (toast `Number copied.`), agreed price line if set, and `You can cancel until 11:59 PM on {day before}.` For the accepted-today fixture: no cancel button and `It's too late to cancel online. Contact {Business} directly.`
6. Declined (with reason and system "Provider unavailable"), Cancelled by admin, Expired (`{Business} didn't reply in time.`) each show their SPEC panel and `Find another provider` → `/discover?cat=…&loc=…`. A Pending fixture whose `expiresAt` has passed shows Expired after reload (mock sweep).
7. Completed + eligible: `How did it go?` + `You can review until {date}` → `/requests/{ref}/review`. Submitting empty shows `Choose a star rating.` and `Write at least 10 characters.`; star targets are 44×44 with Poor…Excellent labels; notice `Reviews can't be edited after posting. Your name shows as Olivia M.` Post → `/requests/{ref}` + toast `Thanks — your review is live.`, the block shows `Your review`, and the provider's profile rating/count changed accordingly.
8. Reopening `/requests/{ref}/review` after posting redirects to S15; a completed request older than 30 days shows `The review window for this job has closed.`; another customer's ref → S39 request variant; Marcus (as customer) only sees his own customer requests; Admin → S40.
9. Vitest: `reviewEligibility` (not completed, > 30 days, already reviewed, other customer), `ratingFrom` rounding, mock cancel refuses `past_cancel_deadline` and returns 409 like the API.

## Notes for the planner
- `canCancel`, `cancelDeadline`, review `eligible`/`deadline` come from the view (server-computed); the UI never evaluates the rules itself.
- Posting a review recomputes the provider's rating and count in the mock using `ratingFrom()` over visible reviews; invalidate `catalog` queries.
- History actor wording: `by you`, `by {Business}`, `by Fixit`, `automatically` (S15.E7).
- S16 needs the sticky `Post review` bar on phone and the discard-changes confirm.
