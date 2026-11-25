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
