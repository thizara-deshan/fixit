import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { signInAs } from '@/test/sign-in';
import { useProviderCta } from './use-provider-cta';

describe('useProviderCta', () => {
  it('guest → signup with provider intent', () => {
    authStore.setGuest();
    expect(renderHook(() => useProviderCta()).result.current).toEqual({
      label: 'Join as a provider',
      to: '/signup?intent=provider',
    });
  });
  it('customer (Olivia) → onboarding step 1', () => {
    signInAs('customer');
    expect(renderHook(() => useProviderCta()).result.current?.to).toBe('/become-a-provider/1');
  });
  it('provider (Marcus) → dashboard', () => {
    signInAs('provider');
    expect(renderHook(() => useProviderCta()).result.current).toEqual({
      label: 'Go to your dashboard',
      to: '/dashboard',
    });
  });
  it('admin → null', () => {
    signInAs('admin');
    expect(renderHook(() => useProviderCta()).result.current).toBeNull();
  });
});
