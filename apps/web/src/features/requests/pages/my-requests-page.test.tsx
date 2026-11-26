import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { commit, db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { FIXED_NOW } from '@/test/fixed-now';
import { setViewportWidth } from '@/test/media';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('MyRequestsPage (S14)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('1: Olivia at 1440: H1, tabs with counts, column headers, newest update first', async () => {
    signInAs('customer');
    renderRoute('/requests');
    expect(await screen.findByRole('heading', { level: 1, name: 'My requests' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Open\s*4/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /All\s*11/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Completed\s*3/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Closed\s*4/ })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Provider',
      'Service',
      'Date',
      'Town',
      'Status',
    ]);
    const rows = await screen.findAllByRole('row');
    expect(rows[1]).toHaveTextContent('FX-2061');
  });

  it('2: accepted rows say Contact details shown; only the eligible completed row has Leave a review', async () => {
    signInAs('customer');
    renderRoute('/requests');
    await screen.findByText('FX-2061');
    expect(screen.getAllByText('Contact details shown')).toHaveLength(2);
    const reviewLinks = screen.getAllByRole('link', { name: 'Leave a review' });
    expect(reviewLinks).toHaveLength(1);
    expect(reviewLinks[0]).toHaveAttribute('href', '/requests/FX-2046/review');
  });

  it('3: a tab sets ?status= and resets the page', async () => {
    signInAs('customer');
    const { location } = renderRoute('/requests?status=all&page=2');
    await userEvent.click(await screen.findByRole('link', { name: /Closed\s*4/ }));
    expect(location()).toBe('/requests?status=closed');
    expect(await screen.findAllByRole('row')).toHaveLength(5); // header + 4
  });

  it('4: 390 — one card link per request', async () => {
    setViewportWidth(390);
    signInAs('customer');
    renderRoute('/requests');
    const list = await screen.findByRole('list', { name: 'My requests' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(11);
    const first = items[0];
    if (!first) throw new Error('no cards');
    expect(within(first).getByRole('link', { name: /^FX-2061/ })).toBeInTheDocument();
    expect(within(first).getByText('Pending')).toBeInTheDocument();
  });

  it('5: Nimal (no requests) → No requests yet + Find providers', async () => {
    signInAs('customerUnconfirmed');
    renderRoute('/requests');
    expect(await screen.findByRole('heading', { name: 'No requests yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find providers' })).toHaveAttribute('href', '/discover');
  });

  it('6: empty tab → No requests with this status.', async () => {
    // Olivia keeps other requests, but none are Completed.
    const mock = db();
    for (const [id, r] of Object.entries(mock.requests)) {
      if (r.customerId === 'u-olivia' && r.status === 'completed') Reflect.deleteProperty(mock.requests, id);
    }
    commit();
    signInAs('customer');
    renderRoute('/requests?status=completed');
    expect(await screen.findByText('No requests with this status.')).toBeInTheDocument();
  });

  it('7: forced 500 → section error; retry recovers', async () => {
    armForcedError('requests_list', '500');
    signInAs('customer');
    renderRoute('/requests');
    expect(await screen.findByText("We couldn't load this.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('FX-2061')).toBeInTheDocument();
  });

  it('8: only the signed-in customer’s own requests', async () => {
    signInAs('customer');
    renderRoute('/requests');
    await screen.findByText('FX-2061');
    expect(screen.queryByText('FX-2037')).not.toBeInTheDocument();
    expect(screen.queryByText('FX-2059')).not.toBeInTheDocument();
  });
});
