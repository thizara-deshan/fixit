import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useProviderReviews, useRequestAction } from './hooks';

const p01 = { id: 'p01', businessName: 'Bell & Sons Plumbing', paused: false };

describe('useRequestAction', () => {
  it('guest → login next (no eligibility call)', () => {
    authStore.setGuest();
    const { result } = renderHook(() => useRequestAction(p01), { wrapper: createWrapper() });
    expect(result.current).toEqual({ kind: 'request', to: '/login?next=/providers/p01/request' });
  });
  it('admin → hidden', () => {
    signInAs('admin');
    const { result } = renderHook(() => useRequestAction(p01), { wrapper: createWrapper() });
    expect(result.current).toEqual({ kind: 'hidden' });
  });
  it('Olivia on p01 → view FX-2061', async () => {
    signInAs('customer');
    const { result } = renderHook(() => useRequestAction(p01), { wrapper: createWrapper() });
    expect(result.current.kind).toBe('loading');
    await waitFor(() => {
      expect(result.current).toMatchObject({ kind: 'view', to: '/requests/FX-2061' });
    });
  });
});
describe('useProviderReviews', () => {
  it('loads 5 then 10 more', async () => {
    const { result } = renderHook(() => useProviderReviews('p01'), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.data?.pages[0]?.items).toHaveLength(5);
    });
    await result.current.fetchNextPage();
    await waitFor(() => {
      expect(result.current.data?.pages.flatMap((x) => x.items)).toHaveLength(15);
    });
    expect(result.current.hasNextPage).toBe(true);
  });
});
