/** BR-27: average of visible ratings rounded to 1 dp; no ratings → null ("New"). */
export function ratingFrom(visibleRatings: readonly number[]): { rating: number | null; count: number } {
  const count = visibleRatings.length;
  if (count === 0) return { rating: null, count: 0 };
  const sum = visibleRatings.reduce((a, b) => a + b, 0);
  return { rating: Math.round((sum / count) * 10) / 10, count };
}
