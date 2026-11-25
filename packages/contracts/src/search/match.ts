import type { DiscoverQuery } from '../catalog/schemas';

export interface NamedCategory {
  id: string;
  name: string;
  order: number;
}

/**
 * BR-02: trimmed, case-insensitive. Equal to a category name → that category.
 * Else a prefix of a category name and ≥ 4 characters → that category (first by `order` if several).
 * Otherwise null (the text is used as free text, BR-03).
 */
export function matchCategory<C extends NamedCategory>(
  q: string | undefined,
  categories: readonly C[],
): C | null {
  const t = (q ?? '').trim().toLowerCase();
  if (!t) return null;
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  const exact = sorted.find((c) => c.name.toLowerCase() === t);
  if (exact) return exact;
  if (t.length < 4) return null;
  return sorted.find((c) => c.name.toLowerCase().startsWith(t)) ?? null;
}

/** BR-05 / SPEC S2.E5. `Any` is the absence of the param. */
export const RATING_STEPS = [
  { value: '3.5', label: '3.5+', min: 3.5 },
  { value: '4', label: '4.0+', min: 4 },
  { value: '4.5', label: '4.5+', min: 4.5 },
] as const;

/** BR-05 / SPEC S2.E7. */
export const PRICE_STEPS = [
  { value: '2000', label: 'Up to LKR 2,000', max: 2000 },
  { value: '5000', label: 'Up to LKR 5,000', max: 5000 },
  { value: '10000', label: 'Up to LKR 10,000', max: 10000 },
] as const;

export interface NormalizedDiscover {
  text: string | null; // BR-03 free text, lowercased; null when empty or a category match
  cats: string[] | null; // known ids only; includes the BR-02 match; null = no category filter
  matchedCategoryId: string | null;
  loc: string | null; // known town id or null
  minRating: number | null;
  verifiedOnly: boolean;
  maxPrice: number | null;
  sort: DiscoverQuery['sort'];
  page: number;
}

export function normalizeDiscoverQuery(
  q: DiscoverQuery,
  catalog: { categories: readonly NamedCategory[]; towns: readonly { id: string }[] },
): NormalizedDiscover {
  const matched = matchCategory(q.q, catalog.categories);
  const known = new Set(catalog.categories.map((c) => c.id));
  const cats = [
    ...new Set([...(q.cat ?? []).filter((id) => known.has(id)), ...(matched ? [matched.id] : [])]),
  ];
  const loc = q.loc && catalog.towns.some((t) => t.id === q.loc) ? q.loc : null;
  return {
    text: matched || !q.q ? null : q.q.trim().toLowerCase(),
    cats: cats.length > 0 ? cats : null,
    matchedCategoryId: matched?.id ?? null,
    loc,
    minRating: RATING_STEPS.find((s) => s.value === q.rating)?.min ?? null,
    verifiedOnly: q.verified === '1',
    maxPrice: PRICE_STEPS.find((s) => s.value === q.price)?.max ?? null,
    sort: q.sort,
    page: q.page,
  };
}
