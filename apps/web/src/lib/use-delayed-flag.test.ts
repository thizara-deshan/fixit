import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDelayedFlag } from './use-delayed-flag';

describe('useDelayedFlag', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('turns on after 150 ms and off immediately', () => {
    const { result, rerender } = renderHook(({ f }) => useDelayedFlag(f), { initialProps: { f: true } });
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
    rerender({ f: false });
    expect(result.current).toBe(false);
  });
  it('never turns on when the flag clears before the delay', () => {
    const { result, rerender } = renderHook(({ f }) => useDelayedFlag(f), { initialProps: { f: true } });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ f: false });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(false);
  });
});
