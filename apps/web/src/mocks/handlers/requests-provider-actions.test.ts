import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerRequestView, ErrorEnvelope, Me, ProviderRequestView } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

export const call = (method: 'GET' | 'POST' | 'PUT', path: string, persona?: PersonaKey, body?: unknown) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (persona) headers.Authorization = `Bearer ${signInAs(persona).accessToken}`;
  return fetch(new URL(`/api${path}`, window.location.origin), {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
};
const view = async (res: Response) => ProviderRequestView.parse(await res.json());
const err = async (res: Response) => ErrorEnvelope.parse(await res.json()).error;

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('POST …/accept (A13)', () => {
  it('pending → accepted with a price; contact revealed both ways; pending count −1', async () => {
    const res = await call('POST', '/me/provider/requests/FX-2061/accept', 'provider', { agreedPrice: 6500 });
    expect(res.status).toBe(200);
    const v = await view(res);
    expect([v.status, v.agreedPrice]).toEqual(['accepted', 6500]);
    expect(v.customer).toMatchObject({ revealed: true, fullName: 'Olivia Martinez' });
    expect(v.history.at(-1)).toMatchObject({ status: 'accepted', actor: 'provider' });
    const olivia = CustomerRequestView.parse(
      await (await call('GET', '/me/requests/FX-2061', 'customer')).json(),
    );
    expect(olivia.agreedPrice).toBe(6500);
    expect(olivia.provider.mobile).not.toBeNull();
    const me = Me.parse(await (await call('GET', '/auth/me', 'provider')).json());
    expect(me.provider?.pendingRequestCount).toBe(2);
  });
  it('no price → agreedPrice null', async () => {
    expect(
      (await view(await call('POST', '/me/provider/requests/FX-2059/accept', 'provider', {}))).agreedPrice,
    ).toBeNull();
  });
  it('6.5 → 400 with the SPEC message', async () => {
    const res = await call('POST', '/me/provider/requests/FX-2061/accept', 'provider', { agreedPrice: 6.5 });
    expect(res.status).toBe(400);
    expect((await err(res)).fieldErrors?.agreedPrice).toEqual(['Enter a whole amount in rupees, like 6500.']);
  });
  it('already accepted → 409 invalid_transition', async () => {
    const res = await call('POST', '/me/provider/requests/FX-2054/accept', 'provider', {});
    expect(res.status).toBe(409);
    expect(await err(res)).toMatchObject({
      code: 'INVALID_TRANSITION',
      details: { reason: 'invalid_transition', status: 'accepted' },
    });
  });
  it('lapsed pending (sweep not run) → 409 expired (AC10, D-5)', async () => {
    vi.setSystemTime(new Date(FIXED_NOW.getTime() + 71 * 3_600_000));
    const res = await call('POST', '/me/provider/requests/FX-2061/accept', 'provider', {});
    expect(res.status).toBe(409);
    expect((await err(res)).details?.reason).toBe('expired');
  });
  it('other provider 404, customer 403, anonymous 401', async () => {
    expect(
      (await call('POST', '/me/provider/requests/FX-2061/accept', 'providerNotSubmitted', {})).status,
    ).toBe(404);
    expect((await call('POST', '/me/provider/requests/FX-2061/accept', 'customer', {})).status).toBe(403);
    expect((await call('POST', '/me/provider/requests/FX-2061/accept', undefined, {})).status).toBe(401);
  });
});
