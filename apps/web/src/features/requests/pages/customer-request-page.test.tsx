import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { colomboStartOfDay } from '@fixit/contracts';
import { notify } from '@/lib/toast';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));

const heading = (name: string | RegExp) => screen.findByRole('heading', { level: 2, name });

describe('CustomerRequestPage (S15)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    vi.mocked(notify).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('1: pending → cancel with a reason updates the panel and history; no phone', async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2061');
    expect(await heading('Waiting for Bell & Sons Plumbing to reply')).toBeInTheDocument();
    expect(screen.getByText(/They have until/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel request' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this request?' });
    expect(
      within(dialog).getByText('Bell & Sons Plumbing will be emailed that you cancelled.'),
    ).toBeInTheDocument();
    await userEvent.type(within(dialog).getByRole('textbox'), 'Fixed it myself.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel request' }));
    expect(await heading('You cancelled this request')).toBeInTheDocument();
    expect(notify).toHaveBeenCalledWith('Request cancelled.');
    expect(screen.getByText('Reason: Fixed it myself.')).toBeInTheDocument();
    expect(screen.getByText('Cancelled', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getAllByText(/· by you/)).toHaveLength(2); // created + cancelled
    expect(document.querySelector('a[href^="tel:"]')).toBeNull();
  });

  it('2: reason over 500 characters → field error, request stays open', async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2061');
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel request' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this request?' });
    const box = within(dialog).getByRole('textbox');
    await userEvent.click(box);
    await userEvent.paste('x'.repeat(501));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel request' }));
    expect(await within(dialog).findByText('Keep the reason under 500 characters.')).toBeInTheDocument();
    expect(notify).not.toHaveBeenCalled();
  });

  it('3: accepted → mobile, Call, Copy, price, cut-off sentence', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    signInAs('customer');
    renderRoute('/requests/FX-2030');
    expect(await heading('Fresh Nest Cleaning accepted your request')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Call' })[0]?.getAttribute('href')).toMatch(/^tel:\+94/);
    expect(screen.getAllByText(/^\+94 7\d \d{3} \d{4}$/).length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Number copied.');
    });
    expect(screen.getByText(/^Agreed price: LKR/)).toBeInTheDocument();
    expect(screen.getByText('You can cancel until 11:59 PM on Thu, 26 Nov.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel request' })).toBeInTheDocument();
  });

  it('4: accepted on the preferred day → too late, no cancel', async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2031');
    expect(
      await screen.findByText("It's too late to cancel online. Contact GreenLeaf Gardens directly."),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel request' })).not.toBeInTheDocument();
  });

  it('5: the cut-off passes while the page is open → 409 → conflict dialog', async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2030');
    const cancelBtn = await screen.findByRole('button', { name: 'Cancel request' });
    const r = Object.values(db().requests).find((x) => x.ref === 'FX-2030');
    if (!r) throw new Error('FX-2030');
    vi.setSystemTime(colomboStartOfDay(r.preferredDate));
    await userEvent.click(cancelBtn);
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this request?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel request' }));
    const conflict = await screen.findByRole('dialog', { name: 'This request has changed' });
    expect(
      within(conflict).getByText("It's too late to cancel online. Contact Fresh Nest Cleaning directly."),
    ).toBeInTheDocument();
    await userEvent.click(within(conflict).getByRole('button', { name: 'OK' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Cancel request' })).not.toBeInTheDocument();
    });
    expect(
      screen.getByText("It's too late to cancel online. Contact Fresh Nest Cleaning directly."),
    ).toBeInTheDocument();
  });

  it.each([
    ['FX-2033', 'Oak & Iron Carpentry declined this request', 'Reason: Fully booked that week.'],
    ['FX-2034', 'ApplianceDoc declined this request', 'Reason: Provider unavailable'],
    ['FX-2035', 'Fixit cancelled this request', 'Reason: The provider reported a family emergency.'],
    ['FX-2036', 'This request expired', "Fresh Nest Cleaning didn't reply in time."],
  ])('6: %s shows its panel and Find another provider', async (ref, title, line) => {
    signInAs('customer');
    renderRoute(`/requests/${ref}`);
    expect(await heading(title)).toBeInTheDocument();
    expect(screen.getByText(line)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find another provider' }).getAttribute('href')).toMatch(
      /^\/discover\?cat=/,
    );
  });

  it('7: a pending request past expiresAt shows Expired (mock sweep)', async () => {
    vi.setSystemTime(new Date(FIXED_NOW.getTime() + 10 * 60_000));
    signInAs('customer');
    renderRoute('/requests/FX-2032');
    expect(await heading('This request expired')).toBeInTheDocument();
    expect(screen.getByText(/· automatically/)).toBeInTheDocument();
  });

  it('8: admin cancellation says by Fixit in the history', async () => {
    signInAs('customer');
    renderRoute('/requests/FX-2035');
    await heading('Fixit cancelled this request');
    expect(screen.getByText(/· by Fixit/)).toBeInTheDocument();
  });

  it("9: another customer's ref → S39; admin → S40", async () => {
    signInAs('customer');
    const first = renderRoute('/requests/FX-2059');
    expect(await screen.findByRole('heading', { name: "We can't find that request" })).toBeInTheDocument();
    first.unmount();
    signInAs('admin');
    renderRoute('/requests/FX-2059');
    expect(
      await screen.findByRole('heading', { name: "You don't have access to this page" }),
    ).toBeInTheDocument();
  });

  it('10: review block per state', async () => {
    signInAs('customer');
    const a = renderRoute('/requests/FX-2046');
    expect(await screen.findByRole('heading', { name: 'How did it go?' })).toBeInTheDocument();
    expect(screen.getByText(/^You can review until /)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leave a review' })).toHaveAttribute(
      'href',
      '/requests/FX-2046/review',
    );
    a.unmount();
    const b = renderRoute('/requests/FX-2029');
    expect(await screen.findByText('The review window for this job has closed.')).toBeInTheDocument();
    b.unmount();
    renderRoute('/requests/FX-2028');
    expect(await screen.findByRole('heading', { name: 'Your review' })).toBeInTheDocument();
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });

  it('11: forced 500 → S41', async () => {
    armForcedError('requests_get', '500');
    signInAs('customer');
    renderRoute('/requests/FX-2061');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();
  });
});
