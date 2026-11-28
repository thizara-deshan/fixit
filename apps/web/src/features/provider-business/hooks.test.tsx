import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { FIXED_NOW } from '@/test/fixed-now';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { uploadDocument } from './api';
import {
  useCreateService,
  useOwnProvider,
  useSubmitVerification,
  useUpdateBusiness,
  useVerification,
} from './hooks';

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
  it('useCreateService: own provider refetched with the new starting price before resolve', async () => {
    signInAs('provider');
    const wrapper = createWrapper();
    const h = renderHook(() => ({ own: useOwnProvider(), add: useCreateService() }), { wrapper });
    await waitFor(() => {
      expect(h.result.current.own.data?.startingPrice).toEqual({ amount: 2500, unit: 'per_hour' });
    });
    await act(async () => {
      await h.result.current.add.mutateAsync({ name: 'Gutter cleaning', price: 1500, unit: 'per_visit' });
    });
    await waitFor(() => {
      expect(h.result.current.own.data?.startingPrice).toEqual({ amount: 1500, unit: 'per_visit' });
    });
  });
  it('useUpdateBusiness: rename → reverification, Me pending_review with reason', async () => {
    signInAs('provider');
    const h = renderHook(() => useUpdateBusiness(), { wrapper: createWrapper() });
    let reason: string | null = null;
    await act(async () => {
      reason = (
        await h.result.current.mutateAsync({
          businessName: 'Bell Plumbing',
          bio: 'Family-run plumbing business serving Colombo for over a decade.',
          yearsExperience: 14,
          categoryId: 'plumbing',
        })
      ).reverification;
    });
    expect(reason).toBe('business_name');
    await waitFor(() => {
      expect(authStore.getState().me?.provider).toMatchObject({
        verificationStatus: 'pending_review',
        reverificationReason: 'business_name',
      });
    });
  });
});
