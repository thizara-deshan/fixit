import type { ProviderCard } from '@fixit/contracts';
import type { FxProvider } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';

/** BR-01: onboarding complete, published, owner account active. */
export function isListed(d: MockDb, p: FxProvider): boolean {
  return p.onboardingComplete && p.publishedAt !== null && d.users[p.userId]?.status === 'active';
}

/** ProviderCard for a listed provider; null if a field a listed provider must have is missing (never expected with fixtures). */
export function toProviderCard(d: MockDb, p: FxProvider): ProviderCard | null {
  const category = d.categories.find((c) => c.id === p.categoryId);
  const town = d.towns.find((t) => t.id === p.baseTownId);
  if (!p.businessName || !category || !town || p.startingPrice === null || p.startingUnit === null)
    return null;
  return {
    id: p.id,
    businessName: p.businessName,
    photoUrl: p.photoKey ? `/api/files/photos/${p.photoKey}` : null,
    category: { id: category.id, name: category.name, icon: category.icon },
    baseTown: { id: town.id, name: town.name },
    yearsExperience: p.yearsExperience ?? 0,
    bio: p.bio ?? '',
    verified: p.verificationStatus === 'verified',
    paused: p.paused,
    rating: p.reviewCount > 0 ? p.ratingAvg : null,
    reviewCount: p.reviewCount,
    startingPrice: { amount: p.startingPrice, unit: p.startingUnit },
  };
}

/** Cards for every listed provider. */
export function listedCards(d: MockDb): ProviderCard[] {
  return Object.values(d.providers)
    .filter((p) => isListed(d, p))
    .map((p) => toProviderCard(d, p))
    .filter((c): c is ProviderCard => c !== null);
}
