import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD } from '@fixit/fixtures';
import { authStore } from '@/lib/auth-store';
import { ApiError, refreshOnce } from '@/lib/http';
import { googleStartUrl, login, logout, register, signIn } from './api';

describe('auth api', () => {
  it('signIn stores the session', async () => {
    await signIn({ email: 'marcus@fixit.test', password: DEMO_PASSWORD });
    expect(authStore.getState().me?.roles).toEqual(['customer', 'provider']);
  });
  it('signIn with a wrong password → ApiError invalid_credentials, still guest', async () => {
    authStore.setGuest();
    const err = await signIn({ email: 'olivia@fixit.test', password: 'wrong-pass' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    if (err instanceof ApiError) expect(err.rule).toBe('invalid_credentials');
    expect(authStore.getState().status).toBe('guest');
  });
  it('logout signs out and kills the refresh session', async () => {
    await signIn({ email: 'olivia@fixit.test', password: DEMO_PASSWORD });
    await logout();
    expect(authStore.getState()).toMatchObject({ status: 'guest', signOutReason: 'logout' });
    expect(await refreshOnce()).toBe(false);
  });
  it('register → 204, then login works (unconfirmed)', async () => {
    await register({ fullName: 'Ann Lee', email: 'ann@fixit.test', password: 'abc12345' });
    const s = await login({ email: 'ann@fixit.test', password: 'abc12345' });
    expect(s.user.emailConfirmed).toBe(false);
  });
  it('googleStartUrl keeps next and intent', () => {
    expect(googleStartUrl({ next: '/requests', intent: 'provider' })).toBe(
      `${window.location.origin}/api/auth/google?next=%2Frequests&intent=provider`,
    );
  });
});
