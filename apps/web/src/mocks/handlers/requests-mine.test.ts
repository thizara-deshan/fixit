import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerRequestView, ErrorEnvelope, MyRequestList } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const call = (path: string, persona?: PersonaKey, body?: unknown) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (persona) headers.Authorization = `Bearer ${signInAs(persona).accessToken}`;
  return fetch(new URL(`/api${path}`, window.location.origin), {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
};

describe('GET /me/requests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('Olivia: own requests with counts', async () => {
    const res = await call('/me/requests?status=open', 'customer');
    const list = MyRequestList.parse(await res.json());
    expect(list.counts.open).toBe(4);
    expect(list.items.every((r) => r.status === 'pending' || r.status === 'accepted')).toBe(true);
  });
  it("Marcus Bell (provider persona) sees none of p01's incoming requests here", async () => {
    const list = MyRequestList.parse(await (await call('/me/requests', 'provider')).json());
    expect(list.items).toEqual([]);
    expect(list.counts.all).toBe(0);
  });
  it('anonymous → 401, admin → 403', async () => {
    expect((await call('/me/requests')).status).toBe(401);
    expect((await call('/me/requests', 'admin')).status).toBe(403);
  });
  it('sweeps expired pending requests first (F-25)', async () => {
    vi.setSystemTime(new Date(FIXED_NOW.getTime() + 10 * 60_000));
    const list = MyRequestList.parse(await (await call('/me/requests?status=closed', 'customer')).json());
    expect(list.items.find((r) => r.ref === 'FX-2032')?.status).toBe('expired');
  });
});

describe('POST /me/requests/:ref/cancel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('pending → cancelled by customer, with reason and event', async () => {
    const res = await call('/me/requests/FX-2061/cancel', 'customer', { reason: 'Fixed it myself.' });
    expect(res.status).toBe(200);
    const v = CustomerRequestView.parse(await res.json());
    expect([v.status, v.closedBy, v.reason, v.canCancel]).toEqual([
      'cancelled',
      'customer',
      'Fixed it myself.',
      false,
    ]);
    expect(v.history.at(-1)).toMatchObject({ status: 'cancelled', actor: 'customer' });
  });
  it('accepted before the cut-off → cancelled and the mobile is hidden (§6.3)', async () => {
    const v = CustomerRequestView.parse(
      await (await call('/me/requests/FX-2030/cancel', 'customer', {})).json(),
    );
    expect(v.status).toBe('cancelled');
    expect(v.provider.mobile).toBeNull();
  });
  it('accepted on the preferred day → 409 past_cancel_deadline (BR-30)', async () => {
    const res = await call('/me/requests/FX-2031/cancel', 'customer', {});
    expect(res.status).toBe(409);
    const err = ErrorEnvelope.parse(await res.json()).error;
    expect(err).toMatchObject({
      code: 'INVALID_TRANSITION',
      details: { reason: 'past_cancel_deadline', status: 'accepted' },
    });
  });
  it('already closed → 409 final_status', async () => {
    const res = await call('/me/requests/FX-2033/cancel', 'customer', {});
    expect(res.status).toBe(409);
  });
  it("another customer's ref → 404; admin → 403; reason too long → 400", async () => {
    expect((await call('/me/requests/FX-2059/cancel', 'customer', {})).status).toBe(404);
    expect((await call('/me/requests/FX-2061/cancel', 'admin', {})).status).toBe(403);
    const res = await call('/me/requests/FX-2061/cancel', 'customer', { reason: 'x'.repeat(501) });
    expect(res.status).toBe(400);
    expect(ErrorEnvelope.parse(await res.json()).error.fieldErrors).toEqual({
      reason: ['Keep the reason under 500 characters.'],
    });
  });
});
