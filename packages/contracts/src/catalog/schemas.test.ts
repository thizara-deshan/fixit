import { describe, expect, it } from 'vitest';
import { CatalogResponse, ProviderCard } from './schemas';

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
