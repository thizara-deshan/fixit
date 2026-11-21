# M19 — Reviews API
Phase: C   Depends on: M18   Est: ½ day
Mock domains after this milestone: `admin`

## Goal
Customers post a review on their own completed request within 30 days, once; the provider's rating and review count are recomputed from visible reviews in the same transaction, so Discover, the profile and the dashboard show the new figures immediately.

## Scope
- PRODUCT F-28, F-29; BR-24, BR-25, BR-26, BR-27.
- ARCHITECTURE §3.5 `POST /me/requests/:ref/review` only; §7.7 rating recompute with `ratingFrom()` after locking the provider row; `reviewEligibility()`; contracts `CreateReviewBody`, `Review`.
- Matrix row; integration tests for `review_not_eligible`, `review_window_closed`, `already_reviewed`, other customer → 404, concurrent double post → one 201.

## Out of scope
- `GET /me/provider/reviews` and replies (F-24 / F-23, M27). Hide/restore (M20).

## Acceptance criteria
1. The authorization matrix row for `POST /me/requests/:ref/review` passes (provider-of-the-request and other customers → 404; admin → 403; anon → 401).
2. With `VITE_MOCK_DOMAINS=admin`, the M09 review criteria pass on real data at 1440px and 390px: Olivia reviews the seeded completed request → S15 shows `Your review`; reopening `/requests/{ref}/review` redirects to S15; the 31-day-old request shows the window-closed message.
3. After posting a 1-star review, `GET /providers/p01` and Discover show the recomputed rating (1 dp) and count; sorting Top rated reflects it; the S20 Average rating tile updates.
4. Text 9 chars → 400 with `Write at least 10 characters.`; rating 0 → `Choose a star rating.`
5. The review appears first on S3 with author `Olivia M.` and no email/id of the author in the response (privacy probe).

## Notes for the planner
- Rating stored rounded to 1 dp so display and filters agree (ARCHITECTURE §7.7).
- `searchText` is not affected by reviews.
