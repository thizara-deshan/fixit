import type { MockAuthToken, MockDb } from '../db/schema';

export const CONFIRM_TTL_MS = 24 * 3_600_000; // SPEC S7/S8
export const RESET_TTL_MS = 3_600_000; // SPEC S9/S10
export const RESEND_COOLDOWN_MS = 60_000; // SPEC S7 / ARCH §3.1 RL 1/60 s

type TokenType = MockAuthToken['type'];
const PATH: Record<TokenType, string> = { confirm_email: '/auth/confirm', reset_password: '/reset-password' };

const randomToken = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('');

/** Stands in for the email: stores the token and exposes the link in the DevPanel (ARCH §4.3). */
export function issueEmailToken(d: MockDb, userId: string, type: TokenType, now: Date): MockAuthToken {
  const token = randomToken();
  const ttl = type === 'confirm_email' ? CONFIRM_TTL_MS : RESET_TTL_MS;
  const record: MockAuthToken = {
    id: `t-${token.slice(0, 12)}`,
    userId,
    type,
    token,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttl).toISOString(),
    usedAt: null,
  };
  d.authTokens.push(record);
  d.lastEmailLink = `${PATH[type]}?token=${token}`;
  return record;
}

export const findEmailToken = (d: MockDb, token: string, type: TokenType): MockAuthToken | undefined =>
  d.authTokens.find((t) => t.token === token && t.type === type);

export const isTokenExpired = (t: MockAuthToken, now: Date): boolean =>
  new Date(t.expiresAt).getTime() <= now.getTime();

/** Latest confirmation email for this user, for the resend cooldown. */
export function lastConfirmSentAt(d: MockDb, userId: string): number | null {
  const times = d.authTokens
    .filter((t) => t.userId === userId && t.type === 'confirm_email')
    .map((t) => new Date(t.createdAt).getTime());
  return times.length > 0 ? Math.max(...times) : null;
}
