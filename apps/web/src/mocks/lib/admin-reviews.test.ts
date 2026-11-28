import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ratingFrom } from '@fixit/contracts';
import { FIXED_NOW } from '@/test/fixed-now';
import { db } from '../db/store';
import { hideReview, moderationPage, moderationRowOf, restoreReview, reviewOr404 } from './admin-reviews';
import { MockHttpError } from './errors';

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('review moderation (mock)', () => {
  it('hidden tab shows FX-2028 with seeded metadata', () => {
    const rows = moderationPage(db(), { q: '', visibility: 'hidden', page: 1 }).items;
    expect(rows.find((r) => r.requestRef === 'FX-2028')?.hidden).toMatchObject({ by: 'Fixit Admin' });
  });
  it('hide then restore recomputes rating/count with ratingFrom', () => {
    const d = db();
    const v = Object.values(d.reviews).find((x) => x.providerId === 'p01' && x.visibility === 'visible');
    if (!v) throw new Error('no p01 review');
    const visible = () =>
      Object.values(d.reviews)
        .filter((x) => x.providerId === 'p01' && x.visibility === 'visible')
        .map((x) => x.rating);
    const before = d.providers.p01?.reviewCount ?? 0;
    hideReview(d, v, 'u-admin', 'Contains a phone number.', new Date());
    expect(d.providers.p01?.reviewCount).toBe(before - 1);
    expect(d.providers.p01?.ratingAvg).toBe(ratingFrom(visible()).rating);
    expect(moderationRowOf(d, v).hidden?.reason).toBe('Contains a phone number.');
    restoreReview(d, v, 'u-admin', new Date());
    expect(d.providers.p01?.reviewCount).toBe(before);
    expect(d.providers.p01?.ratingAvg).toBe(ratingFrom(visible()).rating);
  });
  it('hiding a hidden review → 409', () => {
    const d = db();
    let status: number | null = null;
    try {
      hideReview(d, reviewOr404(d, 'v-FX-2028'), 'u-admin', 'Second attempt at hiding.', new Date());
    } catch (e) {
      if (e instanceof MockHttpError) status = e.status;
      else throw e;
    }
    expect(status).toBe(409);
  });
});
