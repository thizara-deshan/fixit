import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { bookingWindow } from '@fixit/contracts';
import { authStore } from '@/lib/auth-store';
import { commit, db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useCreateRequest, useMyRequest } from './hooks';

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
