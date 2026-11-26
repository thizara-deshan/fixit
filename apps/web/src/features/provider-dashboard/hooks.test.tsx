import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '@/lib/http';
import { FIXED_NOW } from '@/test/fixed-now';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useDashboard, useInbox, useInboxRequest } from './hooks';

describe('provider dashboard queries', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    signInAs('provider');
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('useDashboard loads the stats', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.data?.stats.pending).toBe(3);
    });
  });
  it('useInbox passes status and q', async () => {
    const { result } = renderHook(() => useInbox({ status: 'pending', q: 'fx-2059', page: 1 }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.data?.items.map((r) => r.ref)).toEqual(['FX-2059']);
    });
  });
  it('useInboxRequest: unknown ref is an ApiError 404', async () => {
    const { result } = renderHook(() => useInboxRequest('FX-9999'), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(ApiError);
    });
    expect(result.current.error).toMatchObject({ status: 404 });
  });
});
