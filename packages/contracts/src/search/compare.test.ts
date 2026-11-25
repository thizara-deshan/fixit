import { describe, expect, it } from 'vitest';
import { compareProviders, selectFeatured } from './compare';

const p = (id: string, rating: number | null, reviewCount: number, verified = true, town = 'colombo') => ({
  id,
  businessName: id.toUpperCase(),
  rating,
  reviewCount,
  verified,
  baseTown: { id: town },
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

describe('compareProviders(reviews)', () => {
  it('review count desc, ties by rating, no reviews last', () => {
    const list = [p('a', null, 0), p('b', 4.2, 30), p('c', 4.9, 30), p('d', 5, 3)];
    expect(list.sort(compareProviders('reviews')).map((x) => x.id)).toEqual(['c', 'b', 'd', 'a']);
  });
  it('full ties fall back to name', () => {
    expect([p('z', 4, 1), p('m', 4, 1)].sort(compareProviders('reviews')).map((x) => x.id)).toEqual([
      'm',
      'z',
    ]);
  });
});

describe('compareProviders(town)', () => {
  const list = () => [
    p('a', 4.9, 10, true, 'colombo'),
    p('b', 4.1, 5, true, 'dehiwala'),
    p('c', null, 0, true, 'dehiwala'),
    p('d', 4.5, 8, true, 'colombo'),
  ];
  it('based-in-town first, each group Top rated, no reviews last within group', () => {
    expect(
      list()
        .sort(compareProviders('town', 'dehiwala'))
        .map((x) => x.id),
    ).toEqual(['b', 'c', 'a', 'd']);
  });
  it('without loc equals Top rated', () => {
    expect(
      list()
        .sort(compareProviders('town'))
        .map((x) => x.id),
    ).toEqual(
      list()
        .sort(compareProviders('rating'))
        .map((x) => x.id),
    );
    expect(
      list()
        .sort(compareProviders('town', null))
        .map((x) => x.id),
    ).toEqual(['a', 'd', 'b', 'c']);
  });
});

describe('compareProviders(rating) ties', () => {
  it('rating 0-review provider with a stale rating value still sorts last', () => {
    expect([p('a', 5, 0), p('b', 3, 1)].sort(compareProviders('rating')).map((x) => x.id)).toEqual([
      'b',
      'a',
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
