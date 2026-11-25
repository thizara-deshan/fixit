import {
  compareProviders,
  normalizeDiscoverQuery,
  PAGE_SIZE,
  type DiscoverQuery,
  type DiscoverResult,
  type ProviderCard,
} from '@fixit/contracts';
import type { MockDb } from '../db/schema';
import { listedCards } from './cards';

/** Mock stand-in for M16's SearchService (ARCH §7.6). Pure over the db snapshot. */
export function discoverSearch(d: MockDb, query: DiscoverQuery): DiscoverResult {
  const activeCats = d.categories.filter((c) => c.active);
  const activeTowns = d.towns.filter((t) => t.active);
  const n = normalizeDiscoverQuery(query, { categories: activeCats, towns: activeTowns });

  const serviceNames = new Map<string, string[]>();
  for (const s of Object.values(d.services)) {
    serviceNames.set(s.providerId, [...(serviceNames.get(s.providerId) ?? []), s.name]);
  }
  const servesTown = (providerId: string, townId: string) =>
    d.areas.some((a) => a.providerId === providerId && a.townId === townId);

  const matchesText = (c: ProviderCard) => {
    if (n.text === null) return true;
    const hay = [c.businessName, c.category.name, ...(serviceNames.get(c.id) ?? [])].join(' ').toLowerCase();
    return hay.includes(n.text); // BR-03
  };

  // base: every filter except category (BR-05 counts)
  const base = listedCards(d).filter(
    (c) =>
      matchesText(c) &&
      (n.loc === null || servesTown(c.id, n.loc)) && // BR-04
      (n.minRating === null || (c.reviewCount > 0 && c.rating !== null && c.rating >= n.minRating)) &&
      (!n.verifiedOnly || c.verified) &&
      (n.maxPrice === null || c.startingPrice.amount <= n.maxPrice),
  );

  const categoryCounts: Record<string, number> = {};
  for (const cat of activeCats) {
    categoryCounts[cat.id] = base.filter((c) => c.category.id === cat.id).length;
  }

  const cats = n.cats;
  const filtered = (cats === null ? base : base.filter((c) => cats.includes(c.category.id))).sort(
    compareProviders(n.sort, n.loc),
  );

  const pageSize = PAGE_SIZE.discover;
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const page = Math.min(n.page, Math.max(totalPages, 1)); // beyond last → last
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total,
    totalPages,
    categoryCounts,
    matchedCategoryId: n.matchedCategoryId,
  };
}
