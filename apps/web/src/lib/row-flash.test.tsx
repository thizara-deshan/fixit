import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { flashRow, ROW_FLASH_MS, useFlashingRows, useFlashOnStatusChange } from './row-flash';

describe('row flash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('flashRow holds for 900 ms', () => {
    const { result } = renderHook(() => useFlashingRows());
    act(() => {
      flashRow('FX-1');
    });
    expect(result.current.has('FX-1')).toBe(true);
    act(() => {
      vi.advanceTimersByTime(ROW_FLASH_MS);
    });
    expect(result.current.has('FX-1')).toBe(false);
  });
  it('flashes only rows whose status changed', () => {
    const flashing = renderHook(() => useFlashingRows());
    const { rerender } = renderHook(
      ({ rows }) => {
        useFlashOnStatusChange(rows);
      },
      {
        initialProps: {
          rows: [
            { ref: 'FX-2', status: 'pending' },
            { ref: 'FX-3', status: 'pending' },
          ],
        },
      },
    );
    expect(flashing.result.current.size).toBe(0);
    rerender({
      rows: [
        { ref: 'FX-2', status: 'accepted' },
        { ref: 'FX-3', status: 'pending' },
      ],
    });
    expect([...flashing.result.current]).toEqual(['FX-2']);
  });
});
