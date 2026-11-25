import type { SortKey } from '../common/enums';

export interface RankFields {
  id: string;
  businessName: string;
  rating: number | null;
  reviewCount: number;
  baseTown?: { id: string };
}

type Comparator = (a: RankFields, b: RankFields) => number;

const stable: Comparator = (a, b) => {
  const byName = a.businessName.localeCompare(b.businessName, 'en');
  if (byName !== 0) return byName;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

const ratingOf = (p: RankFields) => (p.reviewCount > 0 ? p.rating : null);

/** Top rated: rating desc, ties by review count desc, no reviews last, then name, then id. */
const byRating: Comparator = (a, b) => {
  const ar = ratingOf(a);
  const br = ratingOf(b);
  if (ar === null && br !== null) return 1;
  if (br === null && ar !== null) return -1;
  if (ar !== null && br !== null && ar !== br) return br - ar;
  if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount;
  return stable(a, b);
};

/** Most reviews: review count desc, ties by Top rated (which puts no-review providers last). */
const byReviews: Comparator = (a, b) =>
  a.reviewCount !== b.reviewCount ? b.reviewCount - a.reviewCount : byRating(a, b);

/** BR-06. `town` puts providers based in `loc` first, each group Top rated; without `loc` it is Top rated. */
export function compareProviders(sort: SortKey, loc?: string | null): Comparator {
  if (sort === 'reviews') return byReviews;
  if (sort === 'town' && loc) {
    return (a, b) => {
      const ag = a.baseTown?.id === loc ? 0 : 1;
      const bg = b.baseTown?.id === loc ? 0 : 1;
      return ag !== bg ? ag - bg : byRating(a, b);
    };
  }
  return byRating;
}

export const FEATURED_LIMIT = 4;

/** BR-08: up to 4 verified providers with ≥ 1 review, Top rated order. Input must already be listed only (BR-01). */
export function selectFeatured<T extends RankFields & { verified: boolean }>(cards: readonly T[]): T[] {
  return cards
    .filter((c) => c.verified && c.reviewCount >= 1)
    .sort(compareProviders('rating'))
    .slice(0, FEATURED_LIMIT);
}
