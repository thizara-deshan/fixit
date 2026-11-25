import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { LoadingRegion } from './loading-region';

describe('LoadingRegion (SPEC §6.1, AC9)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('is aria-busy at once, shows the skeleton only after 150 ms, then the content', () => {
    const { container, rerender } = render(
      <LoadingRegion loading skeleton={<div data-testid="sk" />}>
        <p>Loaded</p>
      </LoadingRegion>,
    );
    const region = container.firstElementChild;
    expect(region?.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Loading…')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(screen.queryByTestId('sk')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('sk')).toBeTruthy();
    rerender(
      <LoadingRegion loading={false} skeleton={<div data-testid="sk" />}>
        <p>Loaded</p>
      </LoadingRegion>,
    );
    expect(region?.getAttribute('aria-busy')).toBe('false');
    expect(screen.queryByTestId('sk')).toBeNull();
    expect(screen.getByText('Loaded')).toBeTruthy();
  });
});
