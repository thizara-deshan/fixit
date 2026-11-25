import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useUpdateMe } from './hooks';

describe('useUpdateMe', () => {
  it('updates authStore.me', async () => {
    signInAs('customer');
    const { result } = renderHook(() => useUpdateMe(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ fullName: 'Olivia Perera', mobile: '+94771234567' });
    expect(authStore.getState().me?.fullName).toBe('Olivia Perera');
  });
});
