import { ENDPOINTS as E, type AuthSession, type EndpointDef } from '@fixit/contracts';
import { GOOGLE_MOCK_USER_ID } from '@fixit/fixtures';
import type { MockDb, MockUser } from '../db/schema';
import {
  findEmailToken,
  isTokenExpired,
  issueEmailToken,
  lastConfirmSentAt,
  RESEND_COOLDOWN_MS,
} from '../lib/email-tokens';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
import { rolesOf } from '../lib/identity';
import { buildMe } from '../lib/me';
import {
  ACCESS_TOKEN_TTL_SEC,
  clearMockRefresh,
  issueAccessToken,
  readMockRefresh,
  setMockRefresh,
} from '../lib/tokens';

const invalidCredentials = () =>
  mockError(401, 'UNAUTHENTICATED', 'Invalid credentials', { details: { rule: 'invalid_credentials' } });
const suspended = () => mockError(401, 'ACCOUNT_SUSPENDED', 'Account suspended');

function session(d: MockDb, userId: string, now: Date): AuthSession {
  return {
    accessToken: issueAccessToken(userId, rolesOf(d, userId), now),
    expiresIn: ACCESS_TOKEN_TTL_SEC,
    user: buildMe(d, userId),
  };
}

/** MSW-only (ARCH §6.1): stands in for GET /auth/google → callback. Sets the mock refresh "cookie"; the SPA then runs /auth/google/done. Not in ENDPOINTS. */
export const GOOGLE_MOCK = {
  id: 'auth_google_mock',
  domain: 'auth',
  method: 'POST',
  path: '/auth/google/mock',
  access: ['public'],
  owner: 'none',
  refs: ['F-02'],
} as const satisfies EndpointDef;

export const authHandlers = [
  mockEndpoint(E.auth_login, ({ body, db: d, now }) => {
    const user = Object.values(d.users).find((u) => u.email === body.email);
    if (!user || user.password === null || user.password !== body.password) throw invalidCredentials();
    if (user.status === 'suspended') throw suspended(); // after the password check (ARCH §6.1)
    setMockRefresh(user.id);
    return session(d, user.id, now);
  }),
  mockEndpoint(E.auth_refresh, ({ db: d, now }) => {
    const userId = readMockRefresh();
    const user = userId ? d.users[userId] : undefined;
    if (!user) {
      clearMockRefresh();
      throw mockError(401, 'UNAUTHENTICATED', 'No refresh session');
    }
    if (user.status === 'suspended') {
      clearMockRefresh();
      throw suspended();
    }
    return session(d, user.id, now);
  }),
  mockEndpoint(E.auth_logout, () => {
    clearMockRefresh();
  }),
  mockEndpoint(E.auth_me, ({ actor, db: d }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required'); // unreachable: assertAccess ran
    return buildMe(d, actor.userId);
  }),
  mockEndpoint(E.auth_register, ({ body, db: d, now }) => {
    if (Object.values(d.users).some((u) => u.email === body.email))
      throw mockError(409, 'CONFLICT', 'Email taken', { details: { rule: 'email_taken' } });
    const id = `u-${crypto.randomUUID().slice(0, 8)}`;
    const user: MockUser = {
      id,
      email: body.email,
      fullName: body.fullName,
      isAdmin: false, // BR-35: every account starts as a customer
      status: 'active',
      emailConfirmedAt: null,
      mobile: null,
      authMethods: ['password'],
      createdAt: now.toISOString(),
      password: body.password,
    };
    d.users[id] = user;
    issueEmailToken(d, id, 'confirm_email', now);
  }),
  mockEndpoint(E.auth_confirm_email, ({ body, db: d, now }) => {
    const t = findEmailToken(d, body.token, 'confirm_email');
    const user = t ? d.users[t.userId] : undefined;
    if (!t || !user)
      throw mockError(422, 'RULE_VIOLATION', 'Token invalid', { details: { rule: 'token_invalid' } });
    if (user.emailConfirmedAt !== null) return { status: 'already_confirmed' as const }; // reopening the link (AC2)
    if (t.usedAt !== null || isTokenExpired(t, now))
      throw mockError(422, 'RULE_VIOLATION', 'Token expired', { details: { rule: 'token_invalid' } });
    user.emailConfirmedAt = now.toISOString();
    t.usedAt = now.toISOString();
    return { status: 'confirmed' as const };
  }),
  mockEndpoint(E.auth_resend_confirmation, ({ actor, db: d, now }) => {
    const user = actor ? d.users[actor.userId] : undefined;
    if (!user) throw mockError(404, 'NOT_FOUND', 'User not found');
    if (user.emailConfirmedAt !== null) return; // ARCH §3.1: already confirmed → 204
    const last = lastConfirmSentAt(d, user.id);
    if (last !== null && now.getTime() - last < RESEND_COOLDOWN_MS)
      throw mockError(429, 'RATE_LIMITED', 'Wait 60 s');
    issueEmailToken(d, user.id, 'confirm_email', now);
  }),
  mockEndpoint(E.auth_forgot_password, ({ body, db: d, now }) => {
    const user = Object.values(d.users).find((u) => u.email === body.email);
    if (user) issueEmailToken(d, user.id, 'reset_password', now); // always 204: no account enumeration
  }),
  mockEndpoint(E.auth_reset_password, ({ body, db: d, now }) => {
    const t = findEmailToken(d, body.token, 'reset_password');
    const user = t ? d.users[t.userId] : undefined;
    if (!t || !user || t.usedAt !== null || isTokenExpired(t, now))
      throw mockError(422, 'RULE_VIOLATION', 'Token invalid', { details: { rule: 'token_invalid' } });
    user.password = body.password;
    if (!user.authMethods.includes('password')) user.authMethods = [...user.authMethods, 'password'];
    t.usedAt = now.toISOString();
    if (readMockRefresh() === user.id) clearMockRefresh(); // A8: other sessions end
  }),
  mockEndpoint(E.auth_admin_login, ({ body, db: d, now }) => {
    const user = Object.values(d.users).find((u) => u.email === body.email);
    // S29.E4: any failure (incl. a non-admin or suspended account) is the same 401 — no role disclosure.
    if (!user || !user.isAdmin || user.password !== body.password || user.status === 'suspended')
      throw invalidCredentials();
    setMockRefresh(user.id);
    return session(d, user.id, now);
  }),
  mockEndpoint(GOOGLE_MOCK, ({ db: d }) => {
    const user = d.users[GOOGLE_MOCK_USER_ID];
    if (!user) throw mockError(404, 'NOT_FOUND', 'Google fixture user missing');
    if (user.status === 'suspended') throw suspended();
    setMockRefresh(user.id);
  }),
  mockEndpoint(E.me_update, ({ actor, body, db: d }) => {
    const user = actor ? d.users[actor.userId] : undefined; // self: the id comes from the token only
    if (!actor || !user) throw mockError(404, 'NOT_FOUND', 'User not found');
    if (body.mobile === null && actor.roles.includes('provider'))
      throw mockError(422, 'RULE_VIOLATION', 'Providers need a mobile', {
        details: { rule: 'mobile_missing' },
      }); // BR-23
    if (body.fullName !== undefined) user.fullName = body.fullName;
    if (body.mobile !== undefined) user.mobile = body.mobile;
    return buildMe(d, user.id);
  }),
  mockEndpoint(E.me_password, ({ actor, body, db: d }) => {
    const user = actor ? d.users[actor.userId] : undefined;
    if (!user) throw mockError(404, 'NOT_FOUND', 'User not found');
    if (user.password === null || user.password !== body.currentPassword)
      throw mockError(422, 'RULE_VIOLATION', 'Current password wrong', {
        details: { rule: 'current_password_wrong' },
      });
    if (body.newPassword === body.currentPassword)
      throw mockError(422, 'RULE_VIOLATION', 'Password reused', { details: { rule: 'password_reused' } });
    user.password = body.newPassword;
  }),
];
