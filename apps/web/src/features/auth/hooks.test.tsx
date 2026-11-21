import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { authStore } from '@/lib/auth-store';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useMe } from './hooks';

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
