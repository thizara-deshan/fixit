import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AdminOverview,
  AdminUserDetail,
  AdminUserList,
  ErrorEnvelope,
  VerificationDecisionResult,
} from '@fixit/contracts';
import { DEMO_PASSWORD, type PersonaKey } from '@fixit/fixtures';
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

describe('admin handlers — users', () => {
  it('list search marcus', async () => {
    const body = AdminUserList.parse(await (await call('GET', '/admin/users?q=marcus', 'admin')).json());
    expect(body.items.map((u) => u.fullName)).toContain('Marcus Bell');
  });
  it('admin detail → 404', async () => {
    expect((await call('GET', '/admin/users/u-admin', 'admin')).status).toBe(404);
  });
  it('suspend admin → 422 cannot_suspend_admin', async () => {
    const res = await call('POST', '/admin/users/u-admin/suspend', 'admin', {
      reason: 'Trying the guard rail.',
    });
    expect(res.status).toBe(422);
    expect(ErrorEnvelope.parse(await res.json()).error.details?.rule).toBe('cannot_suspend_admin');
  });
  it('suspend Hank: detail suspended with history; Hank can no longer log in; profile 404', async () => {
    const res = await call('POST', '/admin/users/u-hank/suspend', 'admin', {
      reason: 'Repeated complaints from customers.',
    });
    const v = AdminUserDetail.parse(await res.json());
    expect(v.status).toBe('suspended');
    expect(v.history[0]?.action).toBe('user_suspend');
    const login = await fetch(new URL('/api/auth/login', window.location.origin), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hank@fixit.test', password: DEMO_PASSWORD }),
    });
    expect(ErrorEnvelope.parse(await login.json()).error.code).toBe('ACCOUNT_SUSPENDED');
    expect((await fetch(new URL('/api/providers/p08', window.location.origin))).status).toBe(404);
  });
  it('reason 9 chars → 400', async () => {
    expect((await call('POST', '/admin/users/u-hank/suspend', 'admin', { reason: '123456789' })).status).toBe(
      400,
    );
  });
});
