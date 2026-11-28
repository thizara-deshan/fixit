import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminOverview, ErrorEnvelope, VerificationDecisionResult } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const call = (method: 'GET' | 'POST', path: string, persona?: PersonaKey, body?: unknown) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (persona) headers.Authorization = `Bearer ${signInAs(persona).accessToken}`;
  return fetch(new URL(`/api${path}`, window.location.origin), {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
};

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('admin handlers — overview & verification', () => {
  it.each([['customer'], ['provider']] as const)('%s → 403', async (persona) => {
    expect((await call('GET', '/admin/overview', persona)).status).toBe(403);
  });
  it('anonymous → 401', async () => {
    expect((await call('GET', '/admin/overview')).status).toBe(401);
  });
  it('overview counts p02 pending and Ruwan suspended', async () => {
    const res = await call('GET', '/admin/overview', 'admin');
    const body = AdminOverview.parse(await res.json());
    expect(body.attention).toMatchObject({ pendingVerifications: 1, suspendedUsers: 1 });
  });
  it('approve returns nextId null and the detail approved; again → 409 already_in_state', async () => {
    const res = await call('POST', '/admin/verifications/s-p02-1/approve', 'admin');
    expect(VerificationDecisionResult.parse(await res.json())).toMatchObject({
      nextId: null,
      detail: { status: 'approved' },
    });
    const again = await call('POST', '/admin/verifications/s-p02-1/approve', 'admin');
    expect(again.status).toBe(409);
    expect(ErrorEnvelope.parse(await again.json()).error.details?.rule).toBe('already_in_state');
  });
  it('reject with 5 chars → 400 with the SPEC message', async () => {
    const res = await call('POST', '/admin/verifications/s-p02-1/reject', 'admin', { reason: 'blurr' });
    expect(res.status).toBe(400);
    expect(ErrorEnvelope.parse(await res.json()).error.fieldErrors?.reason).toEqual([
      'Give a reason so the provider knows what to fix.',
    ]);
  });
  it('unknown submission → 404', async () => {
    expect((await call('GET', '/admin/verifications/s-nope', 'admin')).status).toBe(404);
  });
});
