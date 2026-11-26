import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notify } from '@/lib/toast';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));

describe('S21 provider requests', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    vi.mocked(notify).mockClear();
    signInAs('provider');
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC4: H1, 7 tabs, pending order with Reply by', async () => {
    renderRoute('/dashboard/requests?status=pending');
    expect(await screen.findByRole('heading', { level: 1, name: 'Requests' })).toBeTruthy();
    const tabs = screen.getByRole('navigation', { name: 'Filter by status' });
    expect(tabs.querySelectorAll('a')).toHaveLength(7);
    const links = await screen.findAllByRole('link', { name: /^FX-20/ });
    expect(links.map((l) => l.getAttribute('aria-label')?.match(/FX-\d+/)?.[0])).toEqual([
      'FX-2058',
      'FX-2059',
      'FX-2061',
    ]);
    expect(screen.getByText('Reply by Tue 4:00 AM')).toBeTruthy();
  });

  it('AC4: search, no match, clear', async () => {
    const user = userEvent.setup();
    const { location } = renderRoute('/dashboard/requests');
    await user.type(await screen.findByRole('searchbox', { name: 'Search requests' }), 'zzz{Enter}');
    expect(await screen.findByText('No requests match "zzz".')).toBeTruthy();
    expect(location()).toBe('/dashboard/requests?q=zzz');
    await user.click(screen.getByRole('link', { name: 'Clear search' }));
    expect(await screen.findByRole('link', { name: 'FX-2061, Olivia M., Leak repair' })).toBeTruthy();
  });

  it('AC4: URL state survives reload (page 2 of completed)', async () => {
    renderRoute('/dashboard/requests?status=completed&page=2');
    const nav = await screen.findByRole('navigation', { name: 'Pagination' });
    const current = within(nav)
      .getAllByRole('link')
      .find((a) => a.getAttribute('aria-current') === 'page');
    expect(current?.textContent).toBe('2');
  });

  it('AC3: decline from S21; Olivia sees the reason on S15', async () => {
    const user = userEvent.setup();
    const first = renderRoute('/dashboard/requests');
    await user.click(await screen.findByRole('button', { name: 'Decline request FX-2061' }));
    await user.type(await screen.findByLabelText(/Reason/), 'Not available that week.');
    await user.click(screen.getByRole('button', { name: 'Decline request' }));
    await vi.waitFor(() => {
      expect(notify).toHaveBeenCalledWith("Declined Olivia's request");
    });
    first.unmount();
    signInAs('customer');
    renderRoute('/requests/FX-2061');
    expect(await screen.findByText('Reason: Not available that week.')).toBeTruthy();
  });
});
