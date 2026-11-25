import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bookingWindow, colomboToday, CustomerRequestView, ErrorEnvelope } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { commit, db } from '@/mocks/db/store';
import { buildMe } from '@/mocks/lib/me';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const api = (path: string, persona?: PersonaKey, body?: unknown) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (persona) headers.Authorization = `Bearer ${signInAs(persona).accessToken}`;
  return fetch(new URL(`/api${path}`, window.location.origin), {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
};
const serviceOf = (providerId: string) => {
  const s = Object.values(db().services).find((x) => x.providerId === providerId);
  if (!s) throw new Error(providerId);
  return s.id;
};
const townOf = (providerId: string) => {
  const a = db().areas.find((x) => x.providerId === providerId);
  if (!a) throw new Error(providerId);
  return a.townId;
};
const bodyFor = (providerId: string, extra: Record<string, unknown> = {}) => ({
  providerId,
  serviceId: serviceOf(providerId),
  preferredDate: bookingWindow(FIXED_NOW).min,
  slot: 'morning',
  townId: townOf(providerId),
  addressLine1: '12 Galle Road',
  description: 'Two sockets in the kitchen stopped working.',
  ...extra,
});
const ruleOf = async (res: Response) => ErrorEnvelope.parse(await res.json()).error.details?.rule;

describe('POST /me/requests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('Olivia → p03: 200, FX-2062, pending, mobile hidden, provider pending count +1', async () => {
    const before = buildMe(db(), 'u-priya').provider?.pendingRequestCount ?? 0;
    const res = await api('/me/requests', 'customer', bodyFor('p03'));
    expect(res.status).toBe(200);
    const v = CustomerRequestView.parse(await res.json());
    expect(v.ref).toBe('FX-2062');
    expect(v.status).toBe('pending');
    expect(v.provider.mobile).toBeNull();
    expect(buildMe(db(), 'u-priya').provider?.pendingRequestCount).toBe(before + 1);
    const again = await api('/me/request-eligibility/p03', 'customer');
    expect(await again.json()).toEqual({ state: 'open_with_provider', ref: 'FX-2062' });
  });
  it.each([
    ['provider', 'p01', 'own_listing'],
    ['customer', 'p13', 'provider_paused'],
    ['customer', 'p14', 'provider_unavailable'],
    ['customerUnconfirmed', 'p03', 'email_unconfirmed'],
    ['customer', 'p01', 'open_with_provider'],
    ['customerAtLimit', 'p02', 'open_limit_reached'],
  ] as const)('%s → %s: 422 %s', async (persona, providerId, rule) => {
    const res = await api('/me/requests', persona, bodyFor(providerId));
    expect(res.status).toBe(422);
    expect(await ruleOf(res)).toBe(rule);
  });
  it('open_with_provider carries the existing ref', async () => {
    const res = await api('/me/requests', 'customer', bodyFor('p01'));
    expect(ErrorEnvelope.parse(await res.json()).error.details?.ref).toBe('FX-2061');
  });
  it('field rules: service, town, date', async () => {
    expect(
      await ruleOf(await api('/me/requests', 'customer', bodyFor('p03', { serviceId: serviceOf('p02') }))),
    ).toBe('service_not_offered');
    const served = new Set(
      db()
        .areas.filter((a) => a.providerId === 'p03')
        .map((a) => a.townId),
    );
    const other = db().towns.find((t) => !served.has(t.id));
    expect(await ruleOf(await api('/me/requests', 'customer', bodyFor('p03', { townId: other?.id })))).toBe(
      'town_not_served',
    );
    expect(
      await ruleOf(
        await api('/me/requests', 'customer', bodyFor('p03', { preferredDate: colomboToday(FIXED_NOW) })),
      ),
    ).toBe('date_out_of_window');
  });
  it('mobile: missing → mobile_missing; given → saved to the user', async () => {
    const nimal = db().users['u-nimal'];
    if (!nimal) throw new Error('u-nimal');
    nimal.emailConfirmedAt = FIXED_NOW.toISOString();
    commit();
    expect(await ruleOf(await api('/me/requests', 'customerUnconfirmed', bodyFor('p03')))).toBe(
      'mobile_missing',
    );
    const res = await api('/me/requests', 'customerUnconfirmed', bodyFor('p03', { mobile: '077 123 4567' }));
    expect(res.status).toBe(200);
    expect(db().users['u-nimal']?.mobile).toBe('+94771234567');
  });
  it('empty body → 400 with field errors', async () => {
    const res = await api('/me/requests', 'customer', { providerId: 'p03' });
    expect(res.status).toBe(400);
    const env = ErrorEnvelope.parse(await res.json());
    expect(Object.keys(env.error.fieldErrors ?? {})).toEqual(
      expect.arrayContaining(['serviceId', 'preferredDate', 'slot', 'townId', 'addressLine1', 'description']),
    );
  });
  it('anonymous → 401, admin → 403', async () => {
    expect((await api('/me/requests', undefined, bodyFor('p03'))).status).toBe(401);
    expect((await api('/me/requests', 'admin', bodyFor('p03'))).status).toBe(403);
  });
});

describe('GET /me/requests/:ref', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('owner → 200', async () => {
    const res = await api('/me/requests/FX-2061', 'customer');
    expect(res.status).toBe(200);
    expect(CustomerRequestView.parse(await res.json()).ref).toBe('FX-2061');
  });
  it.each([
    ['customer', 'FX-2059'], // another customer's
    ['provider', 'FX-2061'], // the provider of it, as a customer
    ['customer', 'FX-9999'], // unknown
  ] as const)('%s on %s → 404', async (persona, ref) => {
    expect((await api(`/me/requests/${ref}`, persona)).status).toBe(404);
  });
  it('anonymous → 401, admin → 403', async () => {
    expect((await api('/me/requests/FX-2061')).status).toBe(401);
    expect((await api('/me/requests/FX-2061', 'admin')).status).toBe(403);
  });
});
