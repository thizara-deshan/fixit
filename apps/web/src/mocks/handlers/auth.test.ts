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
    expect([olivia.displayName, olivia.openRequestCount, olivia.provider]).toEqual(['Olivia M.', 4, null]);
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

const tokenFrom = (link: string | null) => new URL(link ?? '', 'http://x').searchParams.get('token') ?? '';
const register = (email: string) =>
  call('/auth/register', post({ fullName: 'Ann Lee', email, password: 'abc12345' }));
const withBearer = (token: string, init: RequestInit = {}): RequestInit => ({
  ...init,
  headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` },
});

describe('POST /auth/register', () => {
  it('creates an unconfirmed customer and a confirmation link', async () => {
    const res = await register('ann@fixit.test');
    expect(res.status).toBe(204);
    const user = Object.values(db().users).find((u) => u.email === 'ann@fixit.test');
    expect([user?.emailConfirmedAt, user?.isAdmin]).toEqual([null, false]);
    expect(db().lastEmailLink).toMatch(/^\/auth\/confirm\?token=[0-9a-f]{48}$/);
  });
  it('taken email → 409 email_taken', async () => {
    const e = await envelope(await register('olivia@fixit.test'));
    expect([e.code, e.details?.rule]).toEqual(['CONFLICT', 'email_taken']);
  });
  it('empty body → 400 with SPEC field messages', async () => {
    const res = await call('/auth/register', post({ fullName: '', email: '', password: '' }));
    const e = await envelope(res);
    expect(res.status).toBe(400);
    expect(e.fieldErrors?.fullName?.[0]).toBe('Enter your full name.');
  });
});

describe('POST /auth/confirm-email', () => {
  it('confirms, then reports already_confirmed; tampered → 422 token_invalid', async () => {
    await register('ann@fixit.test');
    const token = tokenFrom(db().lastEmailLink);
    const first = await call('/auth/confirm-email', post({ token }));
    expect(await first.json()).toEqual({ status: 'confirmed' });
    const again = await call('/auth/confirm-email', post({ token }));
    expect(await again.json()).toEqual({ status: 'already_confirmed' });
    const bad = await call('/auth/confirm-email', post({ token: `${token}x` }));
    expect([bad.status, (await envelope(bad)).details?.rule]).toEqual([422, 'token_invalid']);
  });
});

describe('POST /auth/resend-confirmation', () => {
  it('anonymous → 401', async () => {
    expect((await call('/auth/resend-confirmation', post(undefined))).status).toBe(401);
  });
  it('unconfirmed user: 204, then 429 inside 60 s', async () => {
    const s = AuthSession.parse(await (await login('nimal@fixit.test')).json());
    const first = await call('/auth/resend-confirmation', withBearer(s.accessToken, { method: 'POST' }));
    expect(first.status).toBe(204);
    expect(db().lastEmailLink).toMatch(/^\/auth\/confirm\?token=/);
    const second = await call('/auth/resend-confirmation', withBearer(s.accessToken, { method: 'POST' }));
    expect([second.status, (await envelope(second)).code]).toEqual([429, 'RATE_LIMITED']);
  });
  it('admin → 403', async () => {
    const s = AuthSession.parse(await (await login('admin@fixit.test')).json());
    expect(
      (await call('/auth/resend-confirmation', withBearer(s.accessToken, { method: 'POST' }))).status,
    ).toBe(403);
  });
});

describe('forgot + reset password', () => {
  it('unknown email → 204 and no link', async () => {
    const res = await call('/auth/forgot-password', post({ email: 'nobody@fixit.test' }));
    expect([res.status, db().lastEmailLink]).toEqual([204, null]);
  });
  it('reset changes the password once; old password stops working', async () => {
    await call('/auth/forgot-password', post({ email: 'olivia@fixit.test' }));
    const token = tokenFrom(db().lastEmailLink);
    expect(db().lastEmailLink).toMatch(/^\/reset-password\?token=/);
    expect((await call('/auth/reset-password', post({ token, password: 'newpass99' }))).status).toBe(204);
    expect((await login('olivia@fixit.test')).status).toBe(401);
    expect((await login('olivia@fixit.test', 'newpass99')).status).toBe(200);
    const reuse = await call('/auth/reset-password', post({ token, password: 'other123' }));
    expect((await envelope(reuse)).details?.rule).toBe('token_invalid');
  });
});

describe('POST /auth/admin/login', () => {
  it.each([
    ['olivia@fixit.test', DEMO_PASSWORD],
    ['admin@fixit.test', 'wrong'],
  ])('%s → 401 invalid_credentials', async (email, password) => {
    const res = await call('/auth/admin/login', post({ email, password }));
    expect([res.status, (await envelope(res)).details?.rule]).toEqual([401, 'invalid_credentials']);
  });
  it('admin → session', async () => {
    const res = await call('/auth/admin/login', post({ email: 'admin@fixit.test', password: DEMO_PASSWORD }));
    expect(AuthSession.parse(await res.json()).user.roles).toEqual(['admin']);
  });
});

describe('POST /auth/google/mock', () => {
  it('signs in the Google fixture user via refresh', async () => {
    expect((await call('/auth/google/mock', { method: 'POST' })).status).toBe(204);
    const s = AuthSession.parse(await (await call('/auth/refresh', { method: 'POST' })).json());
    expect([s.user.email, s.user.authMethods]).toEqual(['sanduni@fixit.test', ['google']]);
  });
});

describe('POST /auth/login (M04 fixtures)', () => {
  it('suspended account → 401 ACCOUNT_SUSPENDED', async () => {
    expect((await envelope(await login('ruwan@fixit.test'))).code).toBe('ACCOUNT_SUSPENDED');
  });
  it('Google-only account has no password → invalid_credentials', async () => {
    expect((await envelope(await login('sanduni@fixit.test'))).details?.rule).toBe('invalid_credentials');
  });
});

const sessionFor = async (email: string) => AuthSession.parse(await (await login(email)).json()).accessToken;
const patchMe = (token: string, body: unknown) =>
  call(
    '/me',
    withBearer(token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
const changePw = (token: string, body: unknown) =>
  call(
    '/me/password',
    withBearer(token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

describe('PATCH /me', () => {
  it('updates name and normalises the mobile', async () => {
    const me = Me.parse(
      await (
        await patchMe(await sessionFor('olivia@fixit.test'), {
          fullName: 'Olivia Perera',
          mobile: '077 123 4567',
        })
      ).json(),
    );
    expect([me.fullName, me.mobile, me.displayName]).toEqual(['Olivia Perera', '+94771234567', 'Olivia P.']);
  });
  it('customer may clear the mobile', async () => {
    expect(
      Me.parse(await (await patchMe(await sessionFor('olivia@fixit.test'), { mobile: '' })).json()).mobile,
    ).toBeNull();
  });
  it('provider clearing the mobile → 422 mobile_missing', async () => {
    const e = await envelope(await patchMe(await sessionFor('marcus@fixit.test'), { mobile: '' }));
    expect([e.code, e.details?.rule]).toEqual(['RULE_VIOLATION', 'mobile_missing']);
  });
  it('bad mobile → 400 with the S12 message', async () => {
    const e = await envelope(await patchMe(await sessionFor('olivia@fixit.test'), { mobile: '123' }));
    expect(e.fieldErrors?.mobile).toEqual(['Enter a Sri Lankan mobile number, like 077 123 4567.']);
  });
  it('anonymous → 401; admin → 403', async () => {
    expect(
      (await call('/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' }))
        .status,
    ).toBe(401);
    expect((await patchMe(await sessionFor('admin@fixit.test'), {})).status).toBe(403);
  });
});

describe('POST /me/password', () => {
  it.each([
    [{ currentPassword: 'nope', newPassword: 'abc12345' }, 'current_password_wrong'],
    [{ currentPassword: DEMO_PASSWORD, newPassword: DEMO_PASSWORD }, 'password_reused'],
  ])('%j → %s', async (body, rule) => {
    expect((await envelope(await changePw(await sessionFor('olivia@fixit.test'), body))).details?.rule).toBe(
      rule,
    );
  });
  it('changes the password', async () => {
    expect(
      (
        await changePw(await sessionFor('olivia@fixit.test'), {
          currentPassword: DEMO_PASSWORD,
          newPassword: 'newpass99',
        })
      ).status,
    ).toBe(204);
    expect((await login('olivia@fixit.test', 'newpass99')).status).toBe(200);
  });
});
