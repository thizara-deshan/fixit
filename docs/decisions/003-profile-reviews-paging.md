# 003 — Profile reviews: fixed 5-then-10 window
Date: 2026-11-25 · Status: accepted · Milestone: M07

## Context
SPEC S3.E11 shows the 5 newest reviews, then `Show more reviews` loads 10 more. ARCH §3.2 gave the endpoint `PageQuery + size (5|10)`. With plain page × size paging, page 2 of size 10 starts at review 11, so reviews 6–10 would be skipped (or repeated if the client re-requests page 1 at size 10).

## Decision
`GET /providers/:id/reviews` takes `PageQuery` only. Page 1 = the 5 newest visible reviews; page n ≥ 2 = the next 10, offset `5 + (n − 2) × 10`. The response is `Paginated<PublicReview>` with `pageSize` 5 or 10 and `totalPages = total = 0 ? 0 : total ≤ 5 ? 1 : 1 + ceil((total − 5) / 10)`. The window is `reviewsWindow(page)` in `@fixit/contracts` (shared by mocks and API).

## Consequences
`size` is not accepted. The client uses an infinite query and stops when the loaded count reaches `total`.
