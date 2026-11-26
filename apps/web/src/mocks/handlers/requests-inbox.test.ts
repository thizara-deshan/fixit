import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderRequestList, ProviderRequestView } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const get = (path: string, persona?: PersonaKey) =>
  fetch(new URL(`/api${path}`, window.location.origin), {
    headers: persona ? { Authorization: `Bearer ${signInAs(persona).accessToken}` } : {},
  });

describe('GET /me/provider/requests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('Marcus: own requests, counts, pending order', async () => {
    const res = await get('/me/provider/requests?status=pending', 'provider');
    expect(res.status).toBe(200);
    const list = ProviderRequestList.parse(await res.json());
    expect(list.counts.pending).toBe(3);
    expect(list.items.map((r) => r.ref)).toEqual(['FX-2058', 'FX-2059', 'FX-2061']);
  });
  it('raw JSON of a pending row has no contact fields (§6.3)', async () => {
    const raw = (await (await get('/me/provider/requests?q=FX-2061', 'provider')).json()) as {
      items: { customer: Record<string, unknown> }[];
    };
    expect(Object.keys(raw.items[0]?.customer ?? {}).sort()).toEqual(['displayName', 'revealed']);
  });
  it('a provider with no requests gets an empty list', async () => {
    const list = ProviderRequestList.parse(
      await (await get('/me/provider/requests', 'providerNoRequests')).json(),
    );
    expect([list.items.length, list.counts.all]).toEqual([0, 0]);
  });
  it('anonymous 401, customer 403, admin 403', async () => {
    expect((await get('/me/provider/requests')).status).toBe(401);
    expect((await get('/me/provider/requests', 'customer')).status).toBe(403);
    expect((await get('/me/provider/requests', 'admin')).status).toBe(403);
  });
});

describe('GET /me/provider/requests/:ref', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('own pending → Olivia M.', async () => {
    const v = ProviderRequestView.parse(
      await (await get('/me/provider/requests/FX-2061', 'provider')).json(),
    );
    expect(v.customer).toEqual({ revealed: false, displayName: 'Olivia M.' });
  });
  it('own completed → full contact', async () => {
    const v = ProviderRequestView.parse(
      await (await get('/me/provider/requests/FX-2046', 'provider')).json(),
    );
    expect(v.customer).toMatchObject({ revealed: true, fullName: 'Olivia Martinez' });
  });
  it("another provider's ref → 404, never 403", async () => {
    expect((await get('/me/provider/requests/FX-2061', 'providerNotSubmitted')).status).toBe(404);
    expect((await get('/me/provider/requests/FX-9999', 'provider')).status).toBe(404);
  });
});
