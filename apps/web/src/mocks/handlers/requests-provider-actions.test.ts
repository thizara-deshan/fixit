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

describe('POST …/decline (A14)', () => {
  it('pending → declined with reason; Olivia sees the reason; contact stays hidden', async () => {
    const v = await view(
      await call('POST', '/me/provider/requests/FX-2061/decline', 'provider', {
        reason: 'Not available that week.',
      }),
    );
    expect([v.status, v.reason, v.closedBy]).toEqual(['declined', 'Not available that week.', 'provider']);
    expect(v.customer).toEqual({ revealed: false, displayName: 'Olivia M.' });
    const olivia = CustomerRequestView.parse(
      await (await call('GET', '/me/requests/FX-2061', 'customer')).json(),
    );
    expect([olivia.status, olivia.reason]).toEqual(['declined', 'Not available that week.']);
  });
  it('empty reason → null', async () => {
    expect(
      (await view(await call('POST', '/me/provider/requests/FX-2059/decline', 'provider', { reason: '' })))
        .reason,
    ).toBeNull();
  });
  it('accepted → 409', async () => {
    expect((await call('POST', '/me/provider/requests/FX-2050/decline', 'provider', {})).status).toBe(409);
  });
});

describe('POST …/complete (A16)', () => {
  it('accepted on its preferred date → completed, review window open', async () => {
    const v = await view(
      await call('POST', '/me/provider/requests/FX-2054/complete', 'provider', { agreedPrice: 4000 }),
    );
    expect([v.status, v.agreedPrice, v.completedAt]).toEqual(['completed', 4000, FIXED_NOW.toISOString()]);
    expect(v.reviewDeadline).toBe(new Date(FIXED_NOW.getTime() + 30 * 86_400_000).toISOString());
    expect(v.canComplete).toBe(false);
  });
  it('no price → keeps the existing price', async () => {
    const v = await view(await call('POST', '/me/provider/requests/FX-2054/complete', 'provider', {}));
    expect(v.agreedPrice).toBe(3500);
  });
  it('before the preferred date → 409 before_preferred_date (BR-32)', async () => {
    const res = await call('POST', '/me/provider/requests/FX-2050/complete', 'provider', {});
    expect(res.status).toBe(409);
    expect((await err(res)).details?.reason).toBe('before_preferred_date');
  });
  it('pending → 409 invalid_transition', async () => {
    expect(
      (await err(await call('POST', '/me/provider/requests/FX-2061/complete', 'provider', {}))).details
        ?.reason,
    ).toBe('invalid_transition');
  });
});
