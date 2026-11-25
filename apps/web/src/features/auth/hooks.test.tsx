import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { authStore } from '@/lib/auth-store';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { rememberAfterSignup, takeAfterSignupTarget, useMe, useSignup } from './hooks';

describe('useMe', () => {
  it('fetches Me when signed in', async () => {
    signInAs('provider');
    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.data?.email).toBe('marcus@fixit.test');
    });
  });
  it('stays idle for a guest', () => {
    authStore.setGuest();
    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('takeAfterSignupTarget', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  it.each([
    [{ next: '/requests', intent: 'provider' }, '/become-a-provider/1'],
    [{ next: '/requests', intent: null }, '/requests'],
    [{ next: 'https://evil.test', intent: null }, '/'],
  ] as const)('%j → %s', (v, out) => {
    rememberAfterSignup(v);
    expect(takeAfterSignupTarget()).toBe(out);
    expect(takeAfterSignupTarget()).toBe('/'); // cleared
  });
});

describe('useSignup', () => {
  it('registers and returns a session for the new unconfirmed user', async () => {
    const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });
    const s = await result.current.mutateAsync({
      form: { fullName: 'Ann Lee', email: 'ann@fixit.test', password: 'abc12345' },
      intent: null,
    });
    expect([s.user.email, s.user.emailConfirmed]).toEqual(['ann@fixit.test', false]);
  });
});
