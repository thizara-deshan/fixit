# M27 — F-24 Provider reviews & F-23 replies
Phase: E   Depends on: M26   Est: 1 day
Mock domains after this milestone: none (MSW handlers added so `pnpm dev:mock` keeps working)

## Goal
Providers get a Reviews page in the dashboard with their rating summary and distribution, and can post (and later edit) one public reply per review, which then shows under the review on their public profile. Full stack; flags `providerReviews` and `replies` turned on.

## Scope
- PRODUCT F-24 (Should, priority 7), F-23 (Should, priority 6); BR-28, BR-29 (hidden reviews not shown here; reply hidden with its review).
- SPEC L3 Reviews nav item, S27 (summary card, 5→1 distribution, tabs `All` / `Needs a reply`, list with `{FX-2061} · {Service}`, inline reply editor, empty state), S3.E12 reply block, S20.E6 Average-rating tile link, S22.E5 `View review` link, §8.1 A20.
- ARCHITECTURE §3.5 `GET /me/provider/reviews` (`ProviderReviewList`, `needsReply?`), `PUT /me/provider/reviews/:id/reply` (`ReplyBody` 2–1,000); `PublicReview.reply` populated on `GET /providers/:id/reviews`.

## Out of scope
- Replies by admins; deleting a reply; reply notifications.

## Acceptance criteria
1. The authorization matrix rows for both endpoints pass (another provider's review id → 404; hidden review → 404/rule; customers → 403).
2. At 1440px as Marcus (real data and `pnpm dev:mock`): `/dashboard/reviews` shows the big rating, stars, `{212} reviews`, the 5→1 distribution, and the list newest first with ref and service. `Needs a reply` tab lists only unreplied reviews.
3. `Reply` opens an inline textarea (`{n} / 1,000`); empty → `Write your reply.`; post → toast `Reply posted.`; the review on `/providers/p01` now shows `Response from Bell & Sons` + text. `Edit reply` → `Save reply` → toast `Reply updated.`
4. When an admin hides that review, it disappears from S27 and S3 together with its reply; restoring brings both back.
5. The S20 Average rating tile links to `/dashboard/reviews`; S22's completed request with a review shows `View review` → `/dashboard/reviews#{id}` and scrolls to it.
6. At 390px: distribution under the rating, reply editor full width with 44-high buttons; no horizontal scroll. A provider with no reviews sees `No reviews yet`; loading skeleton; forced 500 → section error.

## Notes for the planner
- Both flags flip together here; if only one of F-23/F-24 survives a cut, SPEC §4.1 says the Reviews nav item is hidden only when both are off — keep the flags independent in code.
- Reply writes don't change rating aggregates.
