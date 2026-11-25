import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCooldown } from './use-cooldown';

describe('useCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('reads 0:59 after start, then counts down to 0', () => {
    const { result } = renderHook(() => useCooldown(60));
    expect(result.current.remaining).toBe(0);
    act(() => {
      result.current.start();
    });
    expect(result.current.label).toBe('0:59');
    act(() => {
      vi.advanceTimersByTime(14_000);
    });
    expect(result.current.label).toBe('0:45');
    act(() => {
      vi.advanceTimersByTime(46_000);
    });
    expect(result.current.remaining).toBe(0);
  });
});
