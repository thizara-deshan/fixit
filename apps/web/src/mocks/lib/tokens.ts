// apps/web/src/mocks/lib/tokens.ts
import { z } from 'zod';
import { Id, type AccessTokenClaims, type Role } from '@fixit/contracts';

export const ACCESS_TOKEN_TTL_SEC = 900;
export const REFRESH_KEY = 'fixit.mock.refresh';

const b64urlEncode = (s: string): string =>
  btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlDecode = (s: string): string => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
};

/** `base64url(header).base64url(claims).mock` — unsigned, mock only. */
export function issueAccessToken(userId: string, roles: Role[], now: Date = new Date()): string {
  const iat = Math.floor(now.getTime() / 1000);
  const claims: AccessTokenClaims = { sub: userId, roles, iat, exp: iat + ACCESS_TOKEN_TTL_SEC };
  const header = b64urlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = b64urlEncode(JSON.stringify({ ...claims, jti: crypto.randomUUID() }));
  return `${header}.${payload}.mock`;
}

/** Reads the payload of a mock or real JWT without verifying it (D2). */
export function decodeJwtPayload(token: string): unknown {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(b64urlDecode(part)) as unknown;
  } catch {
    return null;
  }
}

const RefreshEntry = z.object({ userId: Id });

export function setMockRefresh(userId: string): void {
  localStorage.setItem(REFRESH_KEY, JSON.stringify({ userId }));
}
export function readMockRefresh(): string | null {
  try {
    const raw = localStorage.getItem(REFRESH_KEY);
    if (!raw) return null;
    const parsed = RefreshEntry.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.userId : null;
  } catch {
    return null;
  }
}
export function clearMockRefresh(): void {
  try {
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // storage unavailable
  }
}
