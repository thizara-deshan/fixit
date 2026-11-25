export interface RankFields {
  id: string;
  businessName: string;
  rating: number | null;
  reviewCount: number;
}

type Comparator = (a: RankFields, b: RankFields) => number;

const byRating: Comparator = (a, b) => {
  const ar = a.reviewCount > 0 ? a.rating : null;
  const br = b.reviewCount > 0 ? b.rating : null;
  if (ar === null && br !== null) return 1;
  if (br === null && ar !== null) return -1;
  if (ar !== null && br !== null && ar !== br) return br - ar;
  if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount;
  const byName = a.businessName.localeCompare(b.businessName, 'en');
  if (byName !== 0) return byName;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

const COMPARATORS = { rating: byRating }; // M06 adds 'reviews' and 'town'

/** BR-06 Top rated: rating high→low, ties by review count, no reviews last. Then name, then id, so order is stable. */
export function compareProviders(sort: keyof typeof COMPARATORS): Comparator {
  return COMPARATORS[sort];
}

export const FEATURED_LIMIT = 4;

/** BR-08: up to 4 verified providers with ≥ 1 review, Top rated order. Input must already be listed only (BR-01). */
export function selectFeatured<T extends RankFields & { verified: boolean }>(cards: readonly T[]): T[] {
  return cards
    .filter((c) => c.verified && c.reviewCount >= 1)
    .sort(compareProviders('rating'))
    .slice(0, FEATURED_LIMIT);
}
