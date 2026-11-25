import { ENDPOINTS as E, type AuthSession } from '@fixit/contracts';
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
];
