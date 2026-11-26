import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { rememberDiscover } from '@/lib/last-discover';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('RequestSentPage (S13)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('pending → summary and Back to search uses the last Discover URL', async () => {
    rememberDiscover('?q=plumb');
    signInAs('customer');
    renderRoute('/requests/FX-2061/sent');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Request sent to Bell & Sons Plumbing' }),
    ).toBeInTheDocument();
    expect(screen.getByText('FX-2061')).toHaveClass('font-mono');
    expect(screen.getByRole('link', { name: 'Back to search' })).toHaveAttribute('href', '/discover?q=plumb');
  });
  it('no longer pending → S15', async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2046/sent');
    expect(await screen.findByRole('heading', { level: 1, name: 'Leak repair' })).toBeInTheDocument();
  });
  it("another customer's ref → S39 request", async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2059/sent');
    expect(await screen.findByRole('heading', { name: "We can't find that request" })).toBeInTheDocument();
  });
});
