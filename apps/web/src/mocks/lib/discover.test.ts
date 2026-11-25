import { describe, expect, it } from 'vitest';
import { DiscoverQuery, compareProviders, type DiscoverResult } from '@fixit/contracts';
import { db } from '../db/store';
import { listedCards } from './cards';
import { discoverSearch } from './discover';

const run = (raw: Record<string, string>): DiscoverResult => discoverSearch(db(), DiscoverQuery.parse(raw));

/** Adds `count` listed clones of p01 (same category/town/services area) for paging tests. */
function addClones(count: number) {
  const d = db();
  const src = d.providers.p01;
  if (!src) throw new Error('fixture p01 missing');
  for (let i = 0; i < count; i++) {
    const id = `px${String(i)}`;
    d.providers[id] = { ...src, id, businessName: `Clone ${String(i).padStart(2, '0')}` };
    d.areas.push({ providerId: id, townId: src.baseTownId ?? 'colombo', isBase: true });
  }
}

describe('discoverSearch', () => {
  it('no filters: all listed providers, Top rated order', () => {
    const r = run({});
    const all = listedCards(db()).sort(compareProviders('rating'));
    expect(r.total).toBe(all.length);
    expect(r.items.map((c) => c.id)).toEqual(all.slice(0, 10).map((c) => c.id));
    expect(r.matchedCategoryId).toBeNull();
  });
  it('BR-02: q=plumb filters by Plumbing and reports the match', () => {
    const r = run({ q: 'plumb' });
    expect(r.matchedCategoryId).toBe('plumbing');
    expect(r.items.length).toBeGreaterThan(0);
    for (const c of r.items) expect(c.category.id).toBe('plumbing');
  });
  it('BR-03: free text matches business, category or service names', () => {
    const r = run({ q: 'sparkle' });
    expect(r.items.map((c) => c.businessName)).toContain('Sparkle & Shine Cleaners');
    expect(run({ q: 'zzzz-nothing' }).total).toBe(0);
  });
  it('BR-04: loc matches service areas', () => {
    const d = db();
    const r = run({ loc: 'dehiwala-mount-lavinia' });
    for (const c of r.items) {
      expect(d.areas.some((a) => a.providerId === c.id && a.townId === 'dehiwala-mount-lavinia')).toBe(true);
    }
  });
  it('BR-05: categories OR; counts ignore the category filter but respect others', () => {
    const r = run({ cat: 'plumbing,cleaning', verified: '1' });
    for (const c of r.items) expect(['plumbing', 'cleaning']).toContain(c.category.id);
    for (const c of r.items) expect(c.verified).toBe(true);
    const noCat = run({ verified: '1' });
    expect(r.categoryCounts).toEqual(noCat.categoryCounts);
    const sum = Object.values(noCat.categoryCounts).reduce((a, b) => a + b, 0);
    expect(sum).toBe(noCat.total);
  });
  it('BR-05: min rating excludes providers with no reviews', () => {
    for (const c of run({ rating: '3.5' }).items) expect(c.reviewCount).toBeGreaterThan(0);
  });
  it('BR-05: price step on starting price', () => {
    for (const c of run({ price: '2000' }).items) {
      expect(c.startingPrice.amount).toBeLessThanOrEqual(2000);
    }
  });
  it('BR-06: reviews sort', () => {
    const ids = run({ sort: 'reviews' }).items.map((c) => c.id);
    expect(ids).toEqual(
      listedCards(db())
        .sort(compareProviders('reviews'))
        .slice(0, 10)
        .map((c) => c.id),
    );
  });
  it('unknown ids dropped, junk tolerated', () => {
    expect(run({ cat: ',,x', loc: 'atlantis', rating: '9', page: '-1' }).total).toBe(run({}).total);
  });
  it('pages of 10; beyond last page returns the last page', () => {
    addClones(15);
    const r1 = run({});
    expect(r1.totalPages).toBe(Math.ceil(r1.total / 10));
    expect(r1.items).toHaveLength(10);
    const last = run({ page: '99' });
    expect(last.page).toBe(r1.totalPages);
    expect(last.items.length).toBe(r1.total - (r1.totalPages - 1) * 10);
  });
  it('0 results → page 1, totalPages 0', () => {
    expect(run({ q: 'zzzz-nothing' })).toMatchObject({
      total: 0,
      totalPages: 0,
      page: 1,
      items: [],
    });
  });
});
