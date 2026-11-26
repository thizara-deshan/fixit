import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { FIXED_NOW } from '@/test/fixed-now';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { uploadDocument } from './api';
import { useOwnProvider, useSubmitVerification, useVerification } from './hooks';

describe('provider-business hooks', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('useOwnProvider: null when never started, draft for Kasun', async () => {
    signInAs('customer');
    const a = renderHook(() => useOwnProvider(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(a.result.current.isSuccess).toBe(true);
    });
    expect(a.result.current.data).toBeNull();
    signInAs('providerDraft');
    const b = renderHook(() => useOwnProvider(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(b.result.current.data?.onboarding.step).toBe(3);
    });
  });
  it('upload both NIC sides then submit → pending, Me refreshed', async () => {
    signInAs('providerNotSubmitted');
    const signal = new AbortController().signal;
    await uploadDocument('nic_front', new File(['x'], 'f.png', { type: 'image/png' }), signal);
    await uploadDocument('nic_back', new File(['x'], 'b.pdf', { type: 'application/pdf' }), signal);
    const wrapper = createWrapper();
    const v = renderHook(() => ({ state: useVerification(), submit: useSubmitVerification() }), { wrapper });
    await waitFor(() => {
      expect(v.result.current.state.data?.documents).toHaveLength(2);
    });
    await act(async () => {
      await v.result.current.submit.mutateAsync();
    });
    await waitFor(() => {
      expect(v.result.current.state.data?.status).toBe('pending_review');
    });
    await waitFor(() => {
      expect(authStore.getState().me?.provider?.verificationStatus).toBe('pending_review');
    });
  });
});
