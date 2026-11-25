import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { setViewportWidth } from '@/test/media';
import { MQ, useMediaQuery } from './use-media-query';

describe('useMediaQuery', () => {
  it('matches the 641 and 1024 breakpoints and updates on change', () => {
    const sm = renderHook(() => useMediaQuery(MQ.sm));
    const lg = renderHook(() => useMediaQuery(MQ.lg));
    expect([sm.result.current, lg.result.current]).toEqual([true, true]); // 1440 default
    setViewportWidth(800);
    expect([sm.result.current, lg.result.current]).toEqual([true, false]);
    setViewportWidth(640);
    expect(sm.result.current).toBe(false);
    setViewportWidth(641);
    expect(sm.result.current).toBe(true);
  });
});
