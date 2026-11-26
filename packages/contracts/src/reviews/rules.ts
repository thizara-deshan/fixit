import type { RequestStatus } from '../common/enums';

/** BR-27: average of visible ratings rounded to 1 dp; no ratings → null ("New"). */
export function ratingFrom(visibleRatings: readonly number[]): { rating: number | null; count: number } {
  const count = visibleRatings.length;
  if (count === 0) return { rating: null, count: 0 };
  const sum = visibleRatings.reduce((a, b) => a + b, 0);
  return { rating: Math.round((sum / count) * 10) / 10, count };
}

export const REVIEW_WINDOW_DAYS = 30;
/** BR-24: reviews are accepted while now < completedAt + 30 days. */
export function reviewDeadline(completedAt: Date): Date {
  return new Date(completedAt.getTime() + REVIEW_WINDOW_DAYS * 86_400_000);
}

export interface ReviewableRequest {
  status: RequestStatus;
  customerId: string;
  completedAt: string | null; // IsoDateTime
}
export type ReviewEligibility =
  | { ok: true; deadline: Date }
  | { ok: false; rule: 'review_not_eligible' | 'review_window_closed' | 'already_reviewed' };

/** BR-24/25 (D-4). Same function in mocks, API and the customer view. */
export function reviewEligibility(
  request: ReviewableRequest,
  existingReview: { id: string } | null,
  actorId: string,
  now: Date,
): ReviewEligibility {
  if (request.customerId !== actorId) return { ok: false, rule: 'review_not_eligible' };
  if (request.status !== 'completed' || request.completedAt === null)
    return { ok: false, rule: 'review_not_eligible' };
  if (existingReview !== null) return { ok: false, rule: 'already_reviewed' };
  const deadline = reviewDeadline(new Date(request.completedAt));
  if (now.getTime() >= deadline.getTime()) return { ok: false, rule: 'review_window_closed' };
  return { ok: true, deadline };
}
