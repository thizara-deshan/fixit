import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/mocks/db/store';
import { notify } from '@/lib/toast';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';
import { renderAdminRoute } from '../test-routes';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  vi.mocked(notify).mockClear();
  Element.prototype.scrollIntoView = vi.fn();
  signInAs('admin');
});
afterEach(() => {
  vi.useRealTimers();
});

describe('S37 reviews moderation', () => {
  it('hidden tab: FX-2028 with seeded metadata and a Restore button; restore toasts', async () => {
    const user = userEvent.setup();
    renderAdminRoute('/admin/reviews?visibility=hidden');
    expect(
      await screen.findByText(
        /by Fixit Admin · Reason: Personal remarks about the provider that break the review rules\./,
      ),
    ).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Restore review FX-2028' }));
    const dialog = await screen.findByRole('dialog', { name: 'Restore this review?' });
    await user.click(within(dialog).getByRole('button', { name: 'Restore' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Review restored.');
    });
  });

  it('hide a Bell & Sons review with a reason: toast and rating count −1', async () => {
    const user = userEvent.setup();
    const business = db().providers.p01?.businessName ?? '';
    const before = db().providers.p01?.reviewCount ?? 0;
    renderAdminRoute(`/admin/reviews?visibility=visible&q=${encodeURIComponent(business)}`);
    const hide = (await screen.findAllByRole('button', { name: /^Hide review/ }))[0];
    if (!hide) throw new Error('no review to hide');
    await user.click(hide);
    const dialog = await screen.findByRole('dialog', { name: 'Hide this review?' });
    await user.type(within(dialog).getByLabelText(/Reason/), 'Contains a phone number.');
    await user.click(within(dialog).getByRole('button', { name: 'Hide review' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith(`Review hidden. ${business}'s rating is updated.`);
    });
    expect(db().providers.p01?.reviewCount).toBe(before - 1);
  });

  it('no match → empty state', async () => {
    renderAdminRoute('/admin/reviews?q=zzzz');
    expect(await screen.findByText('No reviews match "zzzz"')).toBeTruthy();
  });
});
