import { describe, expect, it } from 'vitest';
import { matchCategory, normalizeDiscoverQuery } from './match';
import { DiscoverQuery } from '../catalog/schemas';

const cats = [
  { id: 'plumbing', name: 'Plumbing', order: 1 },
  { id: 'painting', name: 'Painting & Decorating', order: 5 },
  { id: 'appliance', name: 'Appliance Repair', order: 8 },
];

describe('matchCategory (BR-02)', () => {
  it('exact name, any case', () => {
    expect(matchCategory('plumbing', cats)?.id).toBe('plumbing');
    expect(matchCategory('PAINTING & DECORATING', cats)?.id).toBe('painting');
  });
  it('prefix ≥ 4 chars', () => {
    expect(matchCategory('plumb', cats)?.id).toBe('plumbing');
    expect(matchCategory('Appl', cats)?.id).toBe('appliance');
  });
  it('prefix < 4 chars is free text', () => {
    expect(matchCategory('plu', cats)).toBeNull();
    expect(matchCategory('pa', cats)).toBeNull();
  });
  it('trims whitespace', () => {
    expect(matchCategory('  plumb  ', cats)?.id).toBe('plumbing');
  });
  it('non-prefix text and empty input → null', () => {
    expect(matchCategory('leaky tap', cats)).toBeNull();
    expect(matchCategory('lumbing', cats)).toBeNull();
    expect(matchCategory('', cats)).toBeNull();
    expect(matchCategory(undefined, cats)).toBeNull();
  });
});

const catalog = { categories: cats, towns: [{ id: 'colombo' }, { id: 'dehiwala-mount-lavinia' }] };
const n = (raw: Record<string, string>) => normalizeDiscoverQuery(DiscoverQuery.parse(raw), catalog);

describe('normalizeDiscoverQuery', () => {
  it('category match → cats, no free text', () => {
    expect(n({ q: 'plumb' })).toMatchObject({
      text: null,
      cats: ['plumbing'],
      matchedCategoryId: 'plumbing',
    });
  });
  it('free text is lowercased; no cats', () => {
    expect(n({ q: 'Leaky Tap' })).toMatchObject({ text: 'leaky tap', cats: null, matchedCategoryId: null });
  });
  it('drops unknown cat and loc ids', () => {
    expect(n({ cat: 'x,plumbing', loc: 'atlantis' })).toMatchObject({ cats: ['plumbing'], loc: null });
    expect(n({ cat: ',,x' }).cats).toBeNull();
  });
  it('maps rating, verified, price', () => {
    expect(n({ rating: '4.5', verified: '1', price: '2000' })).toMatchObject({
      minRating: 4.5,
      verifiedOnly: true,
      maxPrice: 2000,
    });
    expect(n({})).toMatchObject({
      minRating: null,
      verifiedOnly: false,
      maxPrice: null,
      sort: 'rating',
      page: 1,
    });
  });
  it('union of cat and the matched category, no duplicates', () => {
    expect(n({ q: 'plumbing', cat: 'plumbing,painting' }).cats).toEqual(['plumbing', 'painting']);
  });
});
