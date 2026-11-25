import { DiscoverQuery } from '@fixit/contracts';

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
