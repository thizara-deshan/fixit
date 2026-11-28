import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '@/lib/http';
import { qk } from '@/lib/query-keys';
import { FIXED_NOW } from '@/test/fixed-now';
import { createTestQueryClient, createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { fetchModeration } from './api';
import {
  useAdminOverview,
  useAdminUser,
  useAdminUsers,
  useApproveVerification,
  useHideReview,
  useSuspendUser,
  useVerificationQueue,
} from './hooks';

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

describe('admin mutations', () => {
  it('useApproveVerification resolves nextId null and caches the approved detail', async () => {
    const qc = createTestQueryClient();
    const { result } = renderHook(() => useApproveVerification(), { wrapper: createWrapper(qc) });
    const res = await result.current.mutateAsync('s-p02-1');
    expect(res.nextId).toBeNull();
    expect(qc.getQueryData<{ status: string }>(qk.admin.verification('s-p02-1'))?.status).toBe('approved');
  });
  it('useSuspendUser suspends Hank; a second call is a 409 ApiError', async () => {
    const { result } = renderHook(() => useSuspendUser(), { wrapper: createWrapper() });
    const body = { reason: 'Repeated complaints from customers.' };
    const v = await result.current.mutateAsync({ id: 'u-hank', body });
    expect(v.status).toBe('suspended');
    const e: unknown = await result.current.mutateAsync({ id: 'u-hank', body }).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status: 409 });
  });
  it('useHideReview hides the first visible review', async () => {
    const list = await fetchModeration({ q: '', visibility: 'visible', page: 1 });
    const first = list.items[0];
    if (!first) throw new Error('no visible review');
    const { result } = renderHook(() => useHideReview(), { wrapper: createWrapper() });
    const row = await result.current.mutateAsync({
      id: first.id,
      body: { reason: 'Contains a phone number.' },
    });
    expect(row.visibility).toBe('hidden');
  });
});
