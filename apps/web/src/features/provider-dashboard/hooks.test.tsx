import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { ProviderRequestView } from '@fixit/contracts';
import { authStore } from '@/lib/auth-store';
import { ApiError } from '@/lib/http';
import { qk } from '@/lib/query-keys';
import { FIXED_NOW } from '@/test/fixed-now';
import { createTestQueryClient, createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import {
  useAcceptRequest,
  useCompleteRequest,
  useDashboard,
  useDeclineRequest,
  useInbox,
  useInboxRequest,
  useSetAgreedPrice,
} from './hooks';

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

describe('provider mutations', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    signInAs('provider');
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('accept caches the revealed view and refreshes the badge count', async () => {
    const qc = createTestQueryClient();
    const { result } = renderHook(() => useAcceptRequest(), { wrapper: createWrapper(qc) });
    result.current.mutate({ ref: 'FX-2061', body: { agreedPrice: 6500 } });
    await waitFor(() => {
      expect(qc.getQueryData<ProviderRequestView>(qk.inbox.detail('FX-2061'))?.customer.revealed).toBe(true);
    });
    await waitFor(() => {
      expect(authStore.getState().me?.provider?.pendingRequestCount).toBe(2);
    });
  });
  it('decline, complete and agreed price return the new view', async () => {
    const wrapper = createWrapper();
    const d = renderHook(() => useDeclineRequest(), { wrapper });
    await expect(
      d.result.current.mutateAsync({ ref: 'FX-2059', body: { reason: undefined } }),
    ).resolves.toMatchObject({
      status: 'declined',
    });
    const c = renderHook(() => useCompleteRequest(), { wrapper });
    await expect(c.result.current.mutateAsync({ ref: 'FX-2054', body: {} })).resolves.toMatchObject({
      status: 'completed',
    });
    const p = renderHook(() => useSetAgreedPrice(), { wrapper });
    await expect(
      p.result.current.mutateAsync({ ref: 'FX-2050', body: { agreedPrice: 8000 } }),
    ).resolves.toMatchObject({ agreedPrice: 8000 });
  });
});
