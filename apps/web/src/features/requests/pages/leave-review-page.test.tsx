import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notify } from '@/lib/toast';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));

const REVIEW = 'Fixed the leak quickly and cleanly.';

async function fillAndPost() {
  await userEvent.click(await screen.findByRole('radio', { name: '5 stars, Excellent' }));
  await userEvent.type(screen.getByRole('textbox'), REVIEW);
  await userEvent.click(screen.getByRole('button', { name: 'Post review' }));
}

describe('LeaveReviewPage (S16)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    vi.mocked(notify).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('1: empty submit → both SPEC errors', async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2046/review');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Review Bell & Sons Plumbing' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Reviews can't be edited after posting. Your name shows as Olivia M."),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Post review' }));
    expect(await screen.findByText('Choose a star rating.')).toBeInTheDocument();
    expect(screen.getByText('Write at least 10 characters.')).toBeInTheDocument();
  });

  it('2: five 44px star radios with labels; choosing 4 shows Very good', async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2046/review');
    const radios = await screen.findAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('aria-label'))).toEqual([
      '1 star, Poor',
      '2 stars, Fair',
      '3 stars, Good',
      '4 stars, Very good',
      '5 stars, Excellent',
    ]);
    for (const r of radios) expect(r.parentElement).toHaveClass('size-11');
    await userEvent.click(screen.getByRole('radio', { name: '4 stars, Very good' }));
    expect(screen.getByText('Very good')).toBeInTheDocument();
  });

  it('3: counter shows n / 1,000', async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2046/review');
    expect(await screen.findByText('0 / 1,000')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), 'twelve chars');
    expect(screen.getByText('12 / 1,000')).toBeInTheDocument();
  });

  it('4: post → S15 with Your review + toast; rating count updated on the profile', async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2046/review');
    const before = db().providers.p01?.reviewCount ?? 0;
    await fillAndPost();
    expect(await screen.findByRole('heading', { level: 1, name: 'Leak repair' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Your review' })).toBeInTheDocument();
    expect(notify).toHaveBeenCalledWith('Thanks — your review is live.');
    expect(db().providers.p01?.reviewCount).toBe(before + 1);
  });

  it('4b: the provider profile shows the new count', async () => {
    signInAs('customer');
    const first = renderRoute('/requests/FX-2046/review');
    const before = db().providers.p01?.reviewCount ?? 0;
    await fillAndPost();
    await screen.findByRole('heading', { name: 'Your review' });
    first.unmount();
    renderRoute('/providers/p01');
    expect((await screen.findAllByText(`${String(before + 1)} reviews`)).length).toBeGreaterThan(0);
  });

  it('5: reopening after posting redirects to S15', async () => {
    signInAs('customer');
    const first = renderRoute('/requests/FX-2046/review');
    await fillAndPost();
    await screen.findByRole('heading', { name: 'Your review' });
    first.unmount();
    renderRoute('/requests/FX-2046/review');
    expect(await screen.findByRole('heading', { name: 'Your review' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Post review' })).not.toBeInTheDocument();
  });

  it.each(['FX-2029', 'FX-2030'])('6/7: %s → closed message, no form', async (ref) => {
    signInAs('customer');
    renderRoute(`/requests/${ref}/review`);
    expect(await screen.findByText('The review window for this job has closed.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Post review' })).not.toBeInTheDocument();
  });

  it("8: another customer's ref → S39; admin → S40", async () => {
    signInAs('customer');
    const first = renderRoute('/requests/FX-2041/review');
    expect(await screen.findByRole('heading', { name: "We can't find that request" })).toBeInTheDocument();
    first.unmount();
    signInAs('admin');
    renderRoute('/requests/FX-2041/review');
    expect(
      await screen.findByRole('heading', { name: "You don't have access to this page" }),
    ).toBeInTheDocument();
  });

  it('9: dirty form → discard dialog; Keep editing stays, Discard leaves', async () => {
    signInAs('customer');
    const { location } = renderRoute('/requests/FX-2046/review');
    await userEvent.type(await screen.findByRole('textbox'), 'Some draft text');
    await userEvent.click(screen.getByRole('link', { name: 'Back to request' }));
    expect(await screen.findByRole('dialog', { name: 'Discard changes?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(location()).toBe('/requests/FX-2046/review');
    await userEvent.click(screen.getByRole('link', { name: 'Back to request' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Leak repair' })).toBeInTheDocument();
  });

  it('10: server error → banner, values kept', async () => {
    armForcedError('reviews_create', '500');
    signInAs('customer');
    renderRoute('/requests/FX-2046/review');
    await fillAndPost();
    expect(
      await screen.findByText("We couldn't save your changes. Check your connection and try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue(REVIEW);
  });
});
