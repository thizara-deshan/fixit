# 005 — Customer request view carries the provider category; `reviewEligibility` takes the actor
Date: 2026-11-26 · Status: accepted · Milestone: M09

## Context
1. SPEC S15 closed-status panels link `Find another provider` → `/discover?cat={cat}&loc={town}`. ARCH §2.5 `CustomerRequestView.provider` has `categoryIcon` but no category id, so the UI can't build the link.
2. ARCH §4 sketches `reviewEligibility(request, existingReview, now)`. BR-24 says only the request's customer may review, and M09 AC9 tests the "other customer" case. Without the actor id, the function can't check that case. Callers would have to check it on their own, so the rule would end up in more than one place.

## Decision
- `CustomerRequestView.provider` gains `categoryId: Id`. The API mapper and the mock `customerViewOf` fill it from the provider's category.
- The signature becomes `reviewEligibility(request, existingReview, actorId, now)` → `{ ok: true, deadline } | { ok: false, rule }`. It checks, in order:
  1. other customer → `review_not_eligible`
  2. not Completed → `review_not_eligible`
  3. existing review → `already_reviewed`
  4. `now ≥ completedAt + 30 days` → `review_window_closed`
- `toCustomerView` derives `review.eligible` from `reviewEligibility`, so the rule exists once.

## Consequences
- Both changes are additive for the web. No existing screen reads a field that changed.
- The API (when it is built) uses the same function in `POST /me/requests/:ref/review` and in its customer mapper.
- ARCH §2.5 and §4 are updated to match.
