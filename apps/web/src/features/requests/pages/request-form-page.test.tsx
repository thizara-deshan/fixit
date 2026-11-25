import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { FORM_COPY } from '@/lib/error-copy';
import { rememberDiscover } from '@/lib/last-discover';
import { commit, db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const send = () => screen.findByRole('button', { name: /Send request/ });

async function fillValid(u: ReturnType<typeof user>) {
  await u.click(await screen.findByRole('radio', { name: /Outlet & switch install/ }));
  fireEvent.change(screen.getByLabelText(/^Preferred date/), { target: { value: '2026-11-23' } });
  await u.click(screen.getByRole('radio', { name: 'Morning' }));
  await u.selectOptions(screen.getByRole('combobox', { name: /^Town/ }), 'colombo');
  await u.type(screen.getByLabelText(/^Address line 1/), '12 Galle Road');
  await u.type(screen.getByLabelText(/^Description/), 'Two sockets in the kitchen stopped working.');
}

describe('RequestFormPage (S12)', () => {
  beforeEach(() => {
    sessionStorage.clear(); // the Discover loc from AC1 must not prefill other tests
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC1: header, services, towns base-first, loc prefill, summary', async () => {
    rememberDiscover('?loc=colombo');
    signInAs('customer');
    renderRoute('/providers/p03/request');
    expect(await screen.findByRole('link', { name: 'Back to BrightSpark Electric' })).toHaveAttribute(
      'href',
      '/providers/p03',
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Request a service' })).toBeInTheDocument();
    expect(await screen.findAllByRole('radio', { name: /from LKR|fixed/ })).toHaveLength(5);
    const town = screen.getByRole('combobox', { name: /^Town/ });
    const options = within(town).getAllByRole('option');
    expect(options[1]).toHaveValue('sri-jayawardenepura-kotte');
    expect(town).toHaveValue('colombo');
    expect(screen.getAllByText('What happens next').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText('BrightSpark Electric has up to 3 days to accept or decline.').length,
    ).toBeGreaterThan(0);
  });

  it('AC2: empty submit shows six messages and focuses the first; range; counter', async () => {
    signInAs('customer');
    renderRoute('/providers/p03/request');
    const u = user();
    await u.click(await send());
    for (const m of [
      'Choose a service.',
      'Choose a date.',
      'Choose a time slot.',
      'Choose your town.',
      'Enter your address.',
      'Describe the job in at least 20 characters.',
    ])
      expect(await screen.findByText(m)).toBeInTheDocument();
    expect(screen.getAllByRole('radio', { name: /from LKR|fixed/ })[0]).toHaveFocus();
    const date = screen.getByLabelText(/^Preferred date/);
    expect(date).toHaveAttribute('min', '2026-11-23');
    expect(date).toHaveAttribute('max', '2027-01-21');
    fireEvent.change(date, { target: { value: '2026-11-22' } });
    await u.click(await send());
    expect(
      await screen.findByText('Choose a date from Mon, 23 Nov 2026 to Thu, 21 Jan 2027.'),
    ).toBeInTheDocument();
    await u.type(screen.getByLabelText(/^Description/), 'x'.repeat(25));
    expect(screen.getByText('25 / 1,000')).toBeInTheDocument();
  });

  it('AC3: valid submit → S13 with ref, deadline, summary', async () => {
    signInAs('customer');
    renderRoute('/providers/p03/request');
    const u = user();
    await fillValid(u);
    await u.click(await send());
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Request sent to BrightSpark Electric' }),
    ).toBeInTheDocument();
    expect(screen.getByText('FX-2062')).toBeInTheDocument();
    expect(
      screen.getByText(/They have until Mon, 23 Nov, 12:00 AM to accept or decline/),
    ).toBeInTheDocument();
    expect(screen.getByText('Mon, 23 Nov 2026 · Morning')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View request' })).toHaveAttribute('href', '/requests/FX-2062');
  });

  it('AC4: with a mobile → read-only row; without → +94 input saved to the account', async () => {
    signInAs('customer');
    const view = renderRoute('/providers/p03/request');
    expect(await screen.findByText('Your mobile: +94 77 000 1001')).toBeInTheDocument();
    view.unmount();
    authStore.reset();
    const nimal = db().users['u-nimal'];
    if (!nimal) throw new Error('u-nimal');
    nimal.emailConfirmedAt = FIXED_NOW.toISOString();
    commit();
    signInAs('customerUnconfirmed');
    renderRoute('/providers/p03/request');
    const u = user();
    await fillValid(u);
    await u.type(screen.getByLabelText(/^Mobile number/), '077 123 4567');
    await u.click(await send());
    expect(await screen.findByRole('heading', { level: 1, name: /Request sent to/ })).toBeInTheDocument();
    expect(db().users['u-nimal']?.mobile).toBe('+94771234567');
  });

  it.each([
    ['provider', 'p01', "You can't request your own listing", 'Go to your dashboard'],
    ['customer', 'p13', "Lanka Paint Works isn't taking new requests right now", 'Find another provider'],
    ['customerUnconfirmed', 'p03', 'Confirm your email first', 'Resend email'],
    ['customer', 'p01', 'You already have an open request with Bell & Sons Plumbing', 'View request'],
    ['customerAtLimit', 'p02', 'You have 5 open requests', 'Go to my requests'],
  ] as const)('AC5: %s on %s → %s', async (persona, providerId, title, action) => {
    signInAs(persona);
    renderRoute(`/providers/${providerId}/request`);
    const card = (await screen.findByRole('heading', { name: title })).closest('div');
    if (!card) throw new Error('blocked card not found');
    // scoped to the card: the layout's own unconfirmed-email banner also has a Resend email button
    expect(
      within(card).getByRole(action === 'Resend email' ? 'button' : 'link', { name: action }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Send request/ })).not.toBeInTheDocument();
  });

  it.each(['p14', 'nope'])('AC5: %s → provider not found', async (providerId) => {
    signInAs('customer');
    renderRoute(`/providers/${providerId}/request`);
    expect(await screen.findByText("This provider couldn't be found.")).toBeInTheDocument();
  });

  it('AC6: forced provider_paused → banner, values kept', async () => {
    signInAs('customer');
    renderRoute('/providers/p03/request');
    const u = user();
    await fillValid(u);
    armForcedError('requests_create', 'rule_provider_paused');
    await u.click(await send());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "BrightSpark Electric can't take requests right now. Your request wasn't sent.",
    );
    expect(screen.getByLabelText(/^Description/)).toHaveValue('Two sockets in the kitchen stopped working.');
  });

  it('AC8: forced 500 → §6.3 banner, values kept', async () => {
    signInAs('customer');
    renderRoute('/providers/p03/request');
    const u = user();
    await fillValid(u);
    armForcedError('requests_create', '500');
    await u.click(await send());
    expect(await screen.findByRole('alert')).toHaveTextContent(FORM_COPY.saveFailed);
    expect(screen.getByLabelText(/^Address line 1/)).toHaveValue('12 Galle Road');
  });

  it('AC7: Cancel on a dirty form asks to discard', async () => {
    signInAs('customer');
    renderRoute('/providers/p03/request');
    const u = user();
    await u.type(await screen.findByLabelText(/^Description/), 'Something');
    await u.click(screen.getByRole('link', { name: 'Cancel' }));
    expect(await screen.findByText('Discard this request?')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Keep editing' }));
    await waitFor(() => {
      expect(screen.queryByText('Discard this request?')).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^Description/)).toHaveValue('Something');
  });
});
