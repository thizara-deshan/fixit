import { describe, expect, it } from 'vitest';
import { AuthSession, ErrorEnvelope, Me } from '@fixit/contracts';
import { DEMO_PASSWORD } from '@fixit/fixtures';
import { db } from '../db/store';
import { issueAccessToken } from '../lib/tokens';

const call = (path: string, init: RequestInit = {}) =>
  fetch(new URL(`/api${path}`, window.location.origin), init);
const post = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const bearer = (token: string): RequestInit => ({ headers: { Authorization: `Bearer ${token}` } });
const login = async (email: string, password = DEMO_PASSWORD) =>
  call('/auth/login', post({ email, password }));
const envelope = async (res: Response) => ErrorEnvelope.parse(await res.json()).error;

describe('POST /auth/login', () => {
  it.each([
    ['olivia@fixit.test', ['customer']],
    ['nimal@fixit.test', ['customer']],
    ['marcus@fixit.test', ['customer', 'provider']],
    ['hank@fixit.test', ['customer', 'provider']],
    ['kasun@fixit.test', ['customer']],
    ['admin@fixit.test', ['admin']],
  ])('%s → roles %j', async (email, roles) => {
    const res = await login(email);
    expect(res.status).toBe(200);
    const s = AuthSession.parse(await res.json());
    expect([s.user.email, s.user.roles, s.expiresIn]).toEqual([email, roles, 900]);
  });
  it('is case-insensitive on email', async () => {
    expect((await login('  OLIVIA@Fixit.test ')).status).toBe(200);
  });
  it.each([
    ['olivia@fixit.test', 'wrong-pass'],
    ['nobody@fixit.test', DEMO_PASSWORD],
  ])('%s / %s → 401 invalid_credentials', async (email, password) => {
    const res = await login(email, password);
    expect(res.status).toBe(401);
    const e = await envelope(res);
    expect([e.code, e.details?.rule]).toEqual(['UNAUTHENTICATED', 'invalid_credentials']);
  });
  it('empty body → 400 with SPEC field messages', async () => {
    const res = await call('/auth/login', post({ email: '', password: '' }));
    expect(res.status).toBe(400);
    expect((await envelope(res)).fieldErrors).toEqual({
      email: ['Enter your email address.'],
      password: ['Enter your password.'],
    });
  });
  it('suspended → 401 ACCOUNT_SUSPENDED', async () => {
    const olivia = db().users['u-olivia'];
    if (olivia) olivia.status = 'suspended';
    const res = await login('olivia@fixit.test');
    expect(res.status).toBe(401);
    expect((await envelope(res)).code).toBe('ACCOUNT_SUSPENDED');
  });
  it('Me carries counts and provider state', async () => {
    const olivia = AuthSession.parse(await (await login('olivia@fixit.test')).json()).user;
    expect([olivia.displayName, olivia.openRequestCount, olivia.provider]).toEqual(['Olivia M.', 1, null]);
    const marcus = AuthSession.parse(await (await login('marcus@fixit.test')).json()).user;
    expect(marcus.provider).toMatchObject({
      id: 'p01',
      verificationStatus: 'verified',
      pendingRequestCount: 3,
    });
    const kasun = AuthSession.parse(await (await login('kasun@fixit.test')).json()).user;
    expect(kasun.provider?.onboarding).toEqual({ complete: false, step: 3 });
  });
});

describe('POST /auth/refresh and /auth/logout', () => {
  it('no refresh session → 401', async () => {
    const res = await call('/auth/refresh', { method: 'POST' });
    expect(res.status).toBe(401);
  });
  it('after login → new session for the same user; after logout → 401', async () => {
    await login('marcus@fixit.test');
    const res = await call('/auth/refresh', { method: 'POST' });
    expect(AuthSession.parse(await res.json()).user.email).toBe('marcus@fixit.test');
    expect((await call('/auth/logout', { method: 'POST' })).status).toBe(204);
    expect((await call('/auth/refresh', { method: 'POST' })).status).toBe(401);
  });
  it('suspended user → 401 ACCOUNT_SUSPENDED', async () => {
    await login('olivia@fixit.test');
    const olivia = db().users['u-olivia'];
    if (olivia) olivia.status = 'suspended';
    const res = await call('/auth/refresh', { method: 'POST' });
    expect((await envelope(res)).code).toBe('ACCOUNT_SUSPENDED');
  });
});

describe('GET /auth/me', () => {
  it('anonymous → 401', async () => {
    expect((await call('/auth/me')).status).toBe(401);
  });
  it('garbage or expired token → 401', async () => {
    expect((await call('/auth/me', bearer('nope'))).status).toBe(401);
    const expired = issueAccessToken('u-olivia', ['customer'], new Date(Date.now() - 20 * 60_000));
    expect((await call('/auth/me', bearer(expired))).status).toBe(401);
  });
  it('valid token → Me', async () => {
    const res = await call('/auth/me', bearer(issueAccessToken('u-olivia', ['customer'])));
    expect(Me.parse(await res.json()).email).toBe('olivia@fixit.test');
  });
  it('admin may call it (access user, admin)', async () => {
    const res = await call('/auth/me', bearer(issueAccessToken('u-admin', ['admin'])));
    expect(Me.parse(await res.json()).roles).toEqual(['admin']);
  });
});
