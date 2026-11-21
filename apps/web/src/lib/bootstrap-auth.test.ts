import { describe, expect, it } from 'vitest';
import { setMockRefresh } from '@/mocks/lib/tokens';
import { authStore } from './auth-store';
import { bootstrapAuth } from './bootstrap-auth';

describe('bootstrapAuth', () => {
  it('no refresh session → guest', async () => {
    await bootstrapAuth();
    expect(authStore.getState()).toMatchObject({ status: 'guest', signOutReason: null });
  });
  it('refresh session → signed in as that user (AC2 reload)', async () => {
    setMockRefresh('u-kasun');
    await bootstrapAuth();
    expect(authStore.getState().me?.email).toBe('kasun@fixit.test');
  });
});
