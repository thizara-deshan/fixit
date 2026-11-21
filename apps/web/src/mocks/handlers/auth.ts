import { ENDPOINTS as E, type AuthSession } from '@fixit/contracts';
import type { MockDb } from '../db/schema';
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
];
