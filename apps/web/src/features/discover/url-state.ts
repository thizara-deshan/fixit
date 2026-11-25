import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { DiscoverQuery, matchCategory, type Category } from '@fixit/contracts';

export function readDiscover(sp: URLSearchParams): DiscoverQuery {
  return DiscoverQuery.parse(Object.fromEntries(sp)); // invalid → defaults (.catch)
}

/** Canonical URL params: defaults omitted. */
export function writeDiscover(s: Partial<DiscoverQuery>): URLSearchParams {
  const out = new URLSearchParams();
  if (s.q) out.set('q', s.q);
  if (s.loc) out.set('loc', s.loc);
  if (s.cat?.length) out.set('cat', s.cat.join(','));
  if (s.rating) out.set('rating', s.rating);
  if (s.verified) out.set('verified', '1');
  if (s.price) out.set('price', s.price);
  if (s.sort && s.sort !== 'rating') out.set('sort', s.sort);
  if (s.page && s.page > 1) out.set('page', String(s.page));
  return out;
}

/** D-2: categories shown ticked = cat ∪ the BR-02 match of q. */
export function tickedCategories(state: DiscoverQuery, categories: readonly Category[]): string[] {
  const m = matchCategory(state.q, categories);
  return [...new Set([...(state.cat ?? []), ...(m ? [m.id] : [])])];
}

/** S2 phone toolbar badge: 1 per ticked category + 1 each for loc, rating, verified, price. */
export function appliedFilterCount(state: DiscoverQuery, categories: readonly Category[]): number {
  return (
    tickedCategories(state, categories).length +
    (state.loc ? 1 : 0) +
    (state.rating ? 1 : 0) +
    (state.verified ? 1 : 0) +
    (state.price ? 1 : 0)
  );
}

export type DiscoverPatch = Partial<
  Pick<DiscoverQuery, 'loc' | 'cat' | 'rating' | 'verified' | 'price' | 'sort'>
>;

/** Pure next-state functions (unit-tested); the hook only wires them to the router. */
export const next = {
  newSearch(state: DiscoverQuery, q: string, loc: string | undefined, categories: readonly Category[]) {
    const t = q.trim();
    const m = matchCategory(t, categories);
    return writeDiscover({
      q: t || undefined,
      loc: loc || undefined,
      cat: m ? [m.id] : undefined,
      sort: state.sort,
    });
  },
  setFilter(state: DiscoverQuery, patch: DiscoverPatch, categories: readonly Category[]) {
    const clearQ = 'cat' in patch && state.q !== undefined && matchCategory(state.q, categories) !== null;
    return writeDiscover({ ...state, ...patch, ...(clearQ ? { q: undefined } : {}), page: 1 });
  },
  setPage(state: DiscoverQuery, page: number) {
    return writeDiscover({ ...state, page });
  },
};

export function useDiscoverParams(categories: readonly Category[]) {
  const [sp, setSp] = useSearchParams();
  const state = useMemo(() => readDiscover(sp), [sp]);
  return {
    state,
    /** Search bar submit: PUSH (SPEC §8.2). */
    newSearch: (q: string, loc: string | undefined) => {
      setSp(next.newSearch(state, q, loc, categories));
    },
    /** Filters, sort, location: REPLACE, page → 1. */
    setFilter: (patch: DiscoverPatch) => {
      setSp(next.setFilter(state, patch, categories), { replace: true });
    },
    /** Toggle one category row (D-2). */
    toggleCategory: (id: string) => {
      const ticked = tickedCategories(state, categories);
      const cat = ticked.includes(id) ? ticked.filter((x) => x !== id) : [...ticked, id];
      setSp(next.setFilter(state, { cat }, categories), { replace: true });
    },
    hrefForPage: (page: number) => {
      const s = next.setPage(state, page).toString();
      return s ? `/discover?${s}` : '/discover';
    },
    clearAll: () => {
      setSp(new URLSearchParams(), { replace: true });
    },
  };
}
