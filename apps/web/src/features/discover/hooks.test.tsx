import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { DiscoverQuery } from '@fixit/contracts';
import { createWrapper } from '@/test/render';
import { armForcedError } from '@/mocks/lib/controls';
import { useDiscover } from './hooks';

describe('useDiscover', () => {
  it('loads results through the mock', async () => {
    const { result } = renderHook(() => useDiscover(DiscoverQuery.parse({ q: 'plumb' })), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.matchedCategoryId).toBe('plumbing');
  });
  it('surfaces a forced 500 as an error', async () => {
    armForcedError('providers_search', '500');
    const { result } = renderHook(() => useDiscover(DiscoverQuery.parse({})), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
