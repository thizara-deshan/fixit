import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/http';
import { authStore } from '@/lib/auth-store';
import { signInAs } from '@/test/sign-in';
import { queryClient, shouldRetry } from './query-client';

describe('query client', () => {
  it('retries a network/5xx error once, never a 4xx', () => {
    expect(shouldRetry(0, new ApiError(0, 'NETWORK', 'x'))).toBe(true);
    expect(shouldRetry(1, new ApiError(500, 'INTERNAL', 'x'))).toBe(false);
    expect(shouldRetry(0, new ApiError(404, 'NOT_FOUND', 'x'))).toBe(false);
  });
  it('sign-out clears cached data', () => {
    signInAs('customer');
    queryClient.setQueryData(['auth', 'me'], { cached: true });
    authStore.signOut('logout');
    expect(queryClient.getQueryData(['auth', 'me'])).toBeUndefined();
  });
});
