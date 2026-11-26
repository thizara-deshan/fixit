import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notify } from '@/lib/toast';
import { armForcedError } from '@/mocks/lib/controls';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));

describe('S20 provider overview', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    vi.mocked(notify).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC1: header, tiles, table and services', async () => {
    signInAs('provider');
    renderRoute('/dashboard');
    expect(await screen.findByRole('heading', { level: 1, name: 'Good morning, Marcus' })).toBeTruthy();
    expect(screen.getByText('Sun, 22 Nov 2026')).toBeTruthy();
    expect(screen.getByText('You have 3 new requests waiting for a reply.')).toBeTruthy();
    const profile = screen.getByRole('link', { name: 'View public profile' });
    expect([profile.getAttribute('href'), profile.getAttribute('target')]).toEqual([
      '/providers/p01',
      '_blank',
    ]);
    const tile = await screen.findByRole('link', { name: /New requests/ });
    expect(tile.getAttribute('href')).toBe('/dashboard/requests?status=pending');
    expect(within(tile).getByText('3')).toBeTruthy();
    expect(screen.getByText('in November')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Average rating/ })).toBeNull(); // F-24 flag off
    expect(await screen.findByRole('link', { name: 'FX-2061, Olivia M., Leak repair' })).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(9); // header + 8
    expect(screen.getByRole('link', { name: 'View all requests' })).toBeTruthy();
    expect(screen.getByText('from LKR 2,500 / hour')).toBeTruthy();
  });

  it('AC2: accept with a price → toast, revealed name, counts −1, no Undo', async () => {
    const user = userEvent.setup();
    signInAs('provider');
    renderRoute('/dashboard');
    await user.click(await screen.findByRole('button', { name: 'Accept request FX-2061' }));
    const price = await screen.findByLabelText(/Agreed price/);
    await user.type(price, '6.5');
    await user.click(screen.getByRole('button', { name: 'Accept request' }));
    expect(await screen.findByText('Enter a whole amount in rupees, like 6500.')).toBeTruthy();
    await user.clear(price);
    await user.type(price, '6500');
    await user.click(screen.getByRole('button', { name: 'Accept request' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith("Accepted Olivia's request"); // exact args: no Undo action
    });
    expect(await screen.findByRole('link', { name: 'FX-2061, Olivia Martinez, Leak repair' })).toBeTruthy();
    await waitFor(() => {
      expect(within(screen.getByRole('link', { name: /New requests/ })).getByText('2')).toBeTruthy();
    });
    expect(await screen.findByText('2 new requests')).toBeTruthy(); // sidebar badge (sr text)
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it('AC3 (S20): decline with a reason', async () => {
    const user = userEvent.setup();
    signInAs('provider');
    renderRoute('/dashboard');
    await user.click(await screen.findByRole('button', { name: 'Decline request FX-2059' }));
    await user.type(await screen.findByLabelText(/Reason/), 'Fully booked.');
    await user.click(screen.getByRole('button', { name: 'Decline request' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith("Declined James's request"); // exact args: no Undo action
    });
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });

  it('AC8: forced 409 → conflict dialog; forced 500 → section errors', async () => {
    const user = userEvent.setup();
    signInAs('provider');
    renderRoute('/dashboard');
    await user.click(await screen.findByRole('button', { name: 'Accept request FX-2061' }));
    armForcedError('requests_accept', '409');
    await user.click(await screen.findByRole('button', { name: 'Accept request' }));
    expect(await screen.findByText('This request has changed')).toBeTruthy();
    expect(screen.getByText("It's now Pending, so this action isn't available.")).toBeTruthy();
  });

  it('AC8: dashboard 500 → both dashboard sections show the section error', async () => {
    armForcedError('provider_dashboard', '500');
    signInAs('provider');
    renderRoute('/dashboard');
    expect(await screen.findAllByText("We couldn't load this.")).toHaveLength(2);
  });

  it('AC8: provider with no requests', async () => {
    signInAs('providerNoRequests');
    renderRoute('/dashboard');
    expect(await screen.findByText('No requests yet')).toBeTruthy();
    expect(screen.getByText("You're all caught up.")).toBeTruthy();
    expect(await screen.findByText('no reviews yet')).toBeTruthy();
  });
});
