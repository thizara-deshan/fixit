import { describe, expect, it } from 'vitest';
import { AccessTokenClaims } from '@fixit/contracts';
import {
  clearMockRefresh,
  decodeJwtPayload,
  issueAccessToken,
  readMockRefresh,
  setMockRefresh,
} from './tokens';

describe('mock tokens', () => {
  it('round-trips claims with a 15-minute exp and the .mock suffix', () => {
    const now = new Date('2026-11-22T04:30:00.000Z');
    const token = issueAccessToken('u-olivia', ['customer'], now);
    expect(token.endsWith('.mock')).toBe(true);
    const claims = AccessTokenClaims.parse(decodeJwtPayload(token));
    expect(claims).toEqual({ sub: 'u-olivia', roles: ['customer'], iat: 1795321800, exp: 1795322700 });
  });
  it('two tokens in the same second differ', () => {
    const now = new Date();
    expect(issueAccessToken('u-olivia', ['customer'], now)).not.toBe(
      issueAccessToken('u-olivia', ['customer'], now),
    );
  });
  it('garbage → null payload', () => {
    expect(decodeJwtPayload('nope')).toBeNull();
    expect(decodeJwtPayload('a.%%%.b')).toBeNull();
  });
  it('refresh entry set / read / clear', () => {
    expect(readMockRefresh()).toBeNull();
    setMockRefresh('u-marcus');
    expect(readMockRefresh()).toBe('u-marcus');
    clearMockRefresh();
    expect(readMockRefresh()).toBeNull();
  });
});
