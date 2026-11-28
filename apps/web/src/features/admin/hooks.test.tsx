import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '@/lib/http';
import { FIXED_NOW } from '@/test/fixed-now';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useAdminOverview, useAdminUser, useAdminUsers, useVerificationQueue } from './hooks';

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  signInAs('admin');
});
afterEach(() => {
  vi.useRealTimers();
});

describe('admin queries', () => {
  it('useAdminOverview resolves the pending count', async () => {
    const { result } = renderHook(() => useAdminOverview(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.data?.attention.pendingVerifications).toBe(1);
    });
  });
  it('useVerificationQueue lists s-p02-1 first', async () => {
    const { result } = renderHook(() => useVerificationQueue({ status: 'pending_review', page: 1 }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.data?.items[0]?.id).toBe('s-p02-1');
    });
  });
  it('useAdminUsers searches', async () => {
    const { result } = renderHook(() => useAdminUsers({ q: 'marcus', role: 'all', status: 'all', page: 1 }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.data?.items.map((u) => u.fullName)).toContain('Marcus Bell');
    });
  });
  it('useAdminUser(u-admin) ends in a 404 ApiError', async () => {
    const { result } = renderHook(() => useAdminUser('u-admin'), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(ApiError);
    });
    expect(result.current.error).toMatchObject({ status: 404 });
  });
});
