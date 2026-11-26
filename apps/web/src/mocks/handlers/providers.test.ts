import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dashboardStats, ProviderDashboard } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const get = (persona?: PersonaKey) =>
  fetch(new URL('/api/me/provider/dashboard', window.location.origin), {
    headers: persona ? { Authorization: `Bearer ${signInAs(persona).accessToken}` } : {},
  });

describe('GET /me/provider/dashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('Marcus: tiles and services', async () => {
    const dash = ProviderDashboard.parse(await (await get('provider')).json());
    const expected = dashboardStats(
      Object.values(db().requests).filter((r) => r.providerId === 'p01'),
      { rating: 4.9, count: 212 },
      FIXED_NOW,
    );
    expect(dash.stats).toEqual(expected);
    expect(dash.stats).toMatchObject({ pending: 3, accepted: 2, rating: 4.9, reviewCount: 212 });
    expect(dash.stats.completedThisMonth).toBeGreaterThan(0);
    expect(dash.services[0]).toMatchObject({ name: 'Leak repair', price: 2500, unit: 'per_hour' });
    expect(dash.checklist).toBeNull();
  });
  it('a provider with no requests or reviews', async () => {
    const dash = ProviderDashboard.parse(await (await get('providerNoRequests')).json());
    expect(dash.stats).toEqual({
      pending: 0,
      accepted: 0,
      completedThisMonth: 0,
      rating: null,
      reviewCount: 0,
    });
  });
  it('customer 403, anonymous 401', async () => {
    expect((await get('customer')).status).toBe(403);
    expect((await get()).status).toBe(401);
  });
});
