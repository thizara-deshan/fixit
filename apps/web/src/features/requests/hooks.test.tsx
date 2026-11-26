import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { bookingWindow, type CustomerRequestView } from '@fixit/contracts';
import { qk } from '@/lib/query-keys';
import { authStore } from '@/lib/auth-store';
import { commit, db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { createTestQueryClient, createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useCancelRequest, useCreateRequest, useMyRequest, usePostReview } from './hooks';

describe('requests hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('useMyRequest loads a view', async () => {
    signInAs('customer');
    const { result } = renderHook(() => useMyRequest('FX-2061'), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.data?.ref).toBe('FX-2061');
    });
  });
  it('useCreateRequest refreshes me with the saved mobile', async () => {
    const nimal = db().users['u-nimal'];
    if (!nimal) throw new Error('u-nimal');
    nimal.emailConfirmedAt = FIXED_NOW.toISOString();
    commit();
    signInAs('customerUnconfirmed');
    const service = Object.values(db().services).find((s) => s.providerId === 'p03');
    const { result } = renderHook(() => useCreateRequest(), { wrapper: createWrapper() });
    result.current.mutate({
      providerId: 'p03',
      serviceId: service?.id ?? '',
      preferredDate: bookingWindow(FIXED_NOW).min,
      slot: 'evening',
      townId: 'sri-jayawardenepura-kotte',
      addressLine1: '12 Galle Road',
      addressLine2: undefined,
      description: 'Two sockets in the kitchen stopped working.',
      mobile: '+94771234567',
    });
    await waitFor(() => {
      expect(authStore.getState().me?.mobile).toBe('+94771234567');
    });
  });
});

describe('useCancelRequest', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('replaces the cached detail with the cancelled view', async () => {
    signInAs('customer');
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useCancelRequest('FX-2030'), { wrapper: createWrapper(queryClient) });
    result.current.mutate({ reason: undefined });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    const view = queryClient.getQueryData<CustomerRequestView>(qk.myRequests.detail('FX-2030'));
    expect(view?.status).toBe('cancelled');
    expect(view?.provider.mobile).toBeNull();
  });
});
describe('usePostReview', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('invalidates catalog queries', async () => {
    signInAs('customer');
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => usePostReview('FX-2046'), { wrapper: createWrapper(queryClient) });
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    result.current.mutate({ rating: 5, text: 'Great work, thank you!' });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['catalog'] });
  });
});
