import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { armForcedError } from '@/mocks/lib/controls';
import { createWrapper } from '@/test/render';
import { useCatalog, useFeatured } from './hooks';

describe('site hooks', () => {
  it('useCatalog loads 8 categories', async () => {
    const { result } = renderHook(() => useCatalog(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.categories).toHaveLength(8);
  });
  it('useFeatured surfaces a 500 as error', async () => {
    armForcedError('providers_featured', '500');
    const { result } = renderHook(() => useFeatured(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
