import { describe, expect, it } from 'vitest';
import { compareProviders, selectFeatured } from './compare';

const p = (id: string, rating: number | null, reviewCount: number, verified = true) => ({
  id,
  businessName: id.toUpperCase(),
  rating,
  reviewCount,
  verified,
});

describe('compareProviders(rating)', () => {
  it('rating desc, then review count desc, no reviews last', () => {
    const list = [p('a', null, 0), p('b', 4.5, 10), p('c', 4.9, 2), p('d', 4.5, 30)];
    expect(list.sort(compareProviders('rating')).map((x) => x.id)).toEqual(['c', 'd', 'b', 'a']);
  });
  it('full ties fall back to name', () => {
    expect([p('z', 4, 1), p('m', 4, 1)].sort(compareProviders('rating')).map((x) => x.id)).toEqual([
      'm',
      'z',
    ]);
  });
});

describe('selectFeatured (BR-08)', () => {
  it('keeps verified with ≥ 1 review, top 4 by rating', () => {
    const list = [
      p('a', 5, 1, false), // not verified
      p('b', null, 0), // no reviews
      p('c', 4.1, 5),
      p('d', 4.9, 5),
      p('e', 4.5, 5),
      p('f', 4.7, 5),
      p('g', 4.2, 5),
    ];
    expect(selectFeatured(list).map((x) => x.id)).toEqual(['d', 'f', 'e', 'g']);
  });
  it('returns [] when nobody qualifies', () => {
    expect(selectFeatured([p('a', null, 0), p('b', 5, 3, false)])).toEqual([]);
  });
});
