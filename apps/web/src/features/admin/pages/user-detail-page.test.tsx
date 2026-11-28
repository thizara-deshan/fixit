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

describe('S34 user detail', () => {
  it('suspend Hank: effects, reason validation, toast, pill, history, cascade; then reactivate', async () => {
    const user = userEvent.setup();
    renderAdminRoute('/admin/users/u-hank');
    expect(await screen.findByRole('heading', { level: 1, name: 'Hank Morales' })).toBeTruthy();
    expect(screen.getByText('Provider listing')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Suspend account' }));
    const dialog = await screen.findByRole('dialog', { name: 'Suspend Hank Morales?' });
    expect(
      within(dialog).getByText(
        '1 pending requests will be declined and 1 accepted requests cancelled. Customers are emailed.',
      ),
    ).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Suspend account' }));
    expect(
      await within(dialog).findByText("Give a reason. It's included in the email to Hank Morales."),
    ).toBeTruthy();
    await user.type(within(dialog).getByLabelText(/Reason/), 'Repeated complaints from customers.');
    await user.click(within(dialog).getByRole('button', { name: 'Suspend account' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Hank Morales is suspended.');
    });
    expect(await screen.findByRole('button', { name: 'Reactivate account' })).toBeTruthy();
    expect(screen.getByText('Reason: Repeated complaints from customers.')).toBeTruthy();
    const req = Object.values(db().requests).find((r) => r.ref === 'FX-2042');
    expect(req).toMatchObject({ status: 'declined', reason: 'Provider unavailable' });

    await user.click(screen.getByRole('button', { name: 'Reactivate account' }));
    const re = await screen.findByRole('dialog', { name: 'Reactivate Hank Morales?' });
    await user.type(within(re).getByLabelText(/Reason/), 'Complaints were resolved by phone.');
    await user.click(within(re).getByRole('button', { name: 'Reactivate' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Hank Morales is active again.');
    });
    expect(await screen.findByRole('button', { name: 'Suspend account' })).toBeTruthy();
  });

  it('admin account → S39', async () => {
    renderAdminRoute('/admin/users/u-admin');
    expect(await screen.findByRole('heading', { level: 1, name: "We can't find that page" })).toBeTruthy();
  });
});
