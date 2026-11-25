import { describe, expect, it } from 'vitest';
import { CatalogResponse, DiscoverResult, ProviderCard, selectFeatured } from '@fixit/contracts';
import { z } from 'zod';
import { db } from '../db/store';
import { armForcedError } from '../lib/controls';
import { listedCards } from '../lib/cards';

const get = (path: string) => fetch(new URL(`/api${path}`, window.location.origin));

describe('GET /catalog', () => {
  it('returns active categories in admin order, towns grouped by district', async () => {
    const res = await get('/catalog');
    expect(res.status).toBe(200);
    const c = CatalogResponse.parse(await res.json());
    expect(c.categories).toHaveLength(8);
    expect(c.categories.map((x) => x.order)).toEqual(
      [...c.categories.map((x) => x.order)].sort((a, b) => a - b),
    );
    expect(c.districts.map((x) => x.name)).toEqual(['Colombo', 'Gampaha', 'Kalutara']);
    expect(c.towns.some((t) => t.id === 'dehiwala-mount-lavinia')).toBe(true);
    const firstIdx = (id: string) => c.towns.findIndex((t) => t.districtId === id);
    expect(firstIdx('colombo')).toBeLessThan(firstIdx('gampaha'));
  });
  it('hides an inactive category', async () => {
    const cat = db().categories[0];
    if (!cat) throw new Error('no categories');
    cat.active = false;
    const c = CatalogResponse.parse(await (await get('/catalog')).json());
    expect(c.categories.some((x) => x.id === cat.id)).toBe(false);
  });
});

describe('GET /providers/featured', () => {
  it('returns BR-08 selection, ≤ 4, all verified with reviews', async () => {
    const res = await get('/providers/featured');
    expect(res.status).toBe(200);
    const list = z.array(ProviderCard).parse(await res.json());
    expect(list.length).toBeLessThanOrEqual(4);
    expect(list.length).toBeGreaterThan(0);
    for (const p of list) expect(p.verified && p.reviewCount >= 1).toBe(true);
    expect(list.map((p) => p.id)).toEqual(selectFeatured(listedCards(db())).map((p) => p.id));
  });
  it('returns [] when no provider qualifies', async () => {
    for (const p of Object.values(db().providers)) p.verificationStatus = 'not_submitted';
    const list = z.array(ProviderCard).parse(await (await get('/providers/featured')).json());
    expect(list).toEqual([]);
  });
  it('honours a DevPanel forced 500', async () => {
    armForcedError('providers_featured', '500');
    expect((await get('/providers/featured')).status).toBe(500);
  });
});

describe('GET /providers', () => {
  it('returns a DiscoverResult for a guest', async () => {
    const res = await get('/providers?q=plumb&loc=dehiwala-mount-lavinia');
    expect(res.status).toBe(200);
    const r = DiscoverResult.parse(await res.json());
    expect(r.matchedCategoryId).toBe('plumbing');
  });
  it('junk params → 200 with defaults', async () => {
    const res = await get('/providers?rating=9&page=-1&cat=,,x');
    expect(res.status).toBe(200);
    expect(DiscoverResult.parse(await res.json()).page).toBe(1);
  });
  it('honours a DevPanel forced 500', async () => {
    armForcedError('providers_search', '500');
    expect((await get('/providers')).status).toBe(500);
  });
});
