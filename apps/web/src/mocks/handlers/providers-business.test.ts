import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscoverResult, ErrorEnvelope, OwnProvider, ProviderPublicProfile, Service } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const call = (method: string, path: string, persona?: PersonaKey, body?: unknown) =>
  fetch(new URL(`/api${path}`, window.location.origin), {
    method,
    headers: {
      ...(persona ? { Authorization: `Bearer ${signInAs(persona).accessToken}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const errorOf = async (res: Response) => ErrorEnvelope.parse(await res.json()).error;
const gutter = { name: 'Gutter cleaning', price: 1500, unit: 'per_visit' };
const serviceOf = (providerId: string) => {
  const s = Object.values(db().services).find((x) => x.providerId === providerId);
  if (!s) throw new Error('fixture service missing');
  return s;
};

describe('services handlers', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('roles: anon 401, Olivia 403, admin 403', async () => {
    expect((await call('POST', '/me/provider/services', undefined, gutter)).status).toBe(401);
    expect((await call('POST', '/me/provider/services', 'customer', gutter)).status).toBe(403);
    expect((await call('POST', '/me/provider/services', 'admin', gutter)).status).toBe(403);
  });
  it('AC1: add → own, S3 profile and Discover show LKR 1,500 / visit', async () => {
    const res = await call('POST', '/me/provider/services', 'provider', gutter);
    expect(Service.parse(await res.json())).toMatchObject(gutter);
    const own = OwnProvider.parse(await (await call('GET', '/me/provider', 'provider')).json());
    expect(own.startingPrice).toEqual({ amount: 1500, unit: 'per_visit' });
    const profile = ProviderPublicProfile.parse(await (await call('GET', '/providers/p01')).json());
    expect(profile.startingPrice).toEqual({ amount: 1500, unit: 'per_visit' });
    const found = DiscoverResult.parse(
      await (await call('GET', '/providers?cat=plumbing&loc=colombo')).json(),
    );
    expect(found.items.find((c) => c.id === 'p01')?.startingPrice).toEqual({
      amount: 1500,
      unit: 'per_visit',
    });
  });
  it('AC2: bad bodies → 400 with SPEC copy; duplicate → 409 service_name_taken', async () => {
    const low = await call('POST', '/me/provider/services', 'provider', { ...gutter, price: 50 });
    expect((await errorOf(low)).fieldErrors?.price).toEqual([
      'Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.',
    ]);
    const noUnit = await call('POST', '/me/provider/services', 'provider', { name: 'Gutters', price: 1500 });
    expect((await errorOf(noUnit)).fieldErrors?.unit).toEqual(['Choose how this price is charged.']);
    const dup = await call('POST', '/me/provider/services', 'provider', { ...gutter, name: 'LEAK repair' });
    expect(dup.status).toBe(409);
    expect((await errorOf(dup)).details?.rule).toBe('service_name_taken');
  });
  it('AC7: PATCH / DELETE another provider’s service → 404; own edit 200; delete 204', async () => {
    const other = serviceOf('p02');
    expect((await call('PATCH', `/me/provider/services/${other.id}`, 'provider', gutter)).status).toBe(404);
    expect((await call('DELETE', `/me/provider/services/${other.id}`, 'provider')).status).toBe(404);
    const mine = serviceOf('p01');
    expect((await call('PATCH', `/me/provider/services/${mine.id}`, 'provider', gutter)).status).toBe(200);
    expect((await call('DELETE', `/me/provider/services/${mine.id}`, 'provider')).status).toBe(204);
  });
});
