import { describe, expect, it } from 'vitest';
import { ratingFrom } from './rules';

describe('ratingFrom', () => {
  it('no ratings → New', () => {
    expect(ratingFrom([])).toEqual({ rating: null, count: 0 });
  });
  it.each([
    [[5, 4, 4], 4.3],
    [[5, 5, 4], 4.7],
    [[5, 4, 4, 4], 4.3], // 4.25 rounds up
    [[3], 3],
  ])('%j → %d', (ratings, rating) => {
    expect(ratingFrom(ratings)).toEqual({ rating, count: ratings.length });
  });
});
