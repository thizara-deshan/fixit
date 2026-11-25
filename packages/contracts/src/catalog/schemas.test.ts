import { describe, expect, it } from 'vitest';
import { CatalogResponse, DiscoverQuery, ProviderCard, ProviderPublicProfile } from './schemas';

const card = {
  id: 'p-bell',
  businessName: 'Bell & Sons Plumbing',
  photoUrl: null,
  category: { id: 'plumbing', name: 'Plumbing', icon: 'wrench' },
  baseTown: { id: 'dehiwala-mount-lavinia', name: 'Dehiwala-Mount Lavinia' },
  yearsExperience: 12,
  bio: 'Family plumbers.',
  verified: true,
  paused: false,
  rating: 4.9,
  reviewCount: 212,
  startingPrice: { amount: 2500, unit: 'per_hour' },
};

describe('catalog schemas', () => {
  it('parses a provider card', () => {
    expect(ProviderCard.parse(card)).toEqual(card);
  });
  it('accepts rating null (New)', () => {
    expect(ProviderCard.parse({ ...card, rating: null, reviewCount: 0 }).rating).toBeNull();
  });
  it('rejects a non-integer price', () => {
    expect(
      ProviderCard.safeParse({ ...card, startingPrice: { amount: 2500.5, unit: 'per_hour' } }).success,
    ).toBe(false);
  });
  it('rejects an unknown icon', () => {
    expect(
      ProviderCard.safeParse({ ...card, category: { ...card.category, icon: 'construction' } }).success,
    ).toBe(false);
  });
  it('parses an empty catalog', () => {
    expect(CatalogResponse.parse({ categories: [], districts: [], towns: [] }).towns).toEqual([]);
  });
});

describe('DiscoverQuery', () => {
  it('defaults for an empty query', () => {
    expect(DiscoverQuery.parse({})).toEqual({ sort: 'rating', page: 1 });
  });
  it('parses a full valid query', () => {
    expect(
      DiscoverQuery.parse({
        q: ' plumb ',
        loc: 'colombo',
        cat: 'plumbing,electrical',
        rating: '4',
        verified: '1',
        price: '5000',
        sort: 'reviews',
        page: '3',
      }),
    ).toEqual({
      q: 'plumb',
      loc: 'colombo',
      cat: ['plumbing', 'electrical'],
      rating: '4',
      verified: '1',
      price: '5000',
      sort: 'reviews',
      page: 3,
    });
  });
  it('junk → defaults, no throw', () => {
    expect(
      DiscoverQuery.parse({
        rating: '9',
        page: '-1',
        cat: ',,x',
        sort: 'nearest',
        verified: 'yes',
        price: '40',
        q: '   ',
        loc: 'bad id!',
      }),
    ).toEqual({
      cat: ['x'],
      sort: 'rating',
      page: 1,
    });
    expect(DiscoverQuery.parse({ cat: ',,' }).cat).toBeUndefined();
    expect(DiscoverQuery.parse({ page: 'abc' }).page).toBe(1);
  });
  it('dedupes cat ids', () => {
    expect(DiscoverQuery.parse({ cat: 'a,a,b' }).cat).toEqual(['a', 'b']);
  });
});

describe('ProviderPublicProfile', () => {
  it('rejects a profile without ownerName', () => {
    const ok = {
      ...card,
      ownerName: 'Marcus Bell',
      services: [],
      areas: [],
      ratingSummary: { rating: null, reviewCount: 0 },
    };
    expect(ProviderPublicProfile.safeParse(ok).success).toBe(true);
    const bad: Partial<typeof ok> = { ...ok };
    delete bad.ownerName;
    expect(ProviderPublicProfile.safeParse(bad).success).toBe(false);
  });
});
