import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { authStore } from '@/lib/auth-store';
import { rememberDiscover } from '@/lib/last-discover';
import { armForcedError } from '@/mocks/lib/controls';

const TIP = "Fixit has checked this provider's national ID and, where listed, their trade qualification.";

const scrollIntoView = vi.fn();

describe('ProviderProfilePage', () => {
  beforeEach(() => {
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
    authStore.setGuest();
  });
  it('AC1: header, sections, back link to last Discover URL', async () => {
    rememberDiscover('?q=plumb');
    renderRoute('/providers/p01');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bell & Sons Plumbing' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Owned & run by Marcus Bell')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to results' })).toHaveAttribute(
      'href',
      '/discover?q=plumb',
    );
    expect(
      screen.getByText('Final price is confirmed by the provider after reviewing your request.'),
    ).toBeInTheDocument();
    const area = screen.getByRole('region', { name: 'Service area' });
    expect(within(area).getAllByRole('listitem')[0]).toHaveTextContent('ColomboBased here');
    await userEvent.click(screen.getByRole('link', { name: '212 reviews' }));
    expect(scrollIntoView).toHaveBeenCalled();
  });
  it('AC2: verified tooltip opens on hover and closes on Esc', async () => {
    renderRoute('/providers/p01');
    const badge = await screen.findByRole('button', { name: /Verified/ });
    expect(badge).toHaveAccessibleDescription(`What does Verified mean? ${TIP}`);
    await userEvent.hover(badge);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(TIP);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });
  it('AC2: unverified provider shows Not yet verified', async () => {
    renderRoute('/providers/p08');
    expect(await screen.findByText('Not yet verified')).toBeInTheDocument();
  });
  it('AC3: 5 reviews, then 10 more', async () => {
    renderRoute('/providers/p01');
    const reviews = await screen.findByRole('region', { name: 'Reviews' });
    await waitFor(() => {
      expect(within(reviews).getAllByRole('listitem')).toHaveLength(5);
    });
    expect(within(reviews).getByText('Sarah K.')).toBeInTheDocument();
    await userEvent.click(within(reviews).getByRole('button', { name: 'Show more reviews' }));
    await waitFor(() => {
      expect(within(reviews).getAllByRole('listitem')).toHaveLength(15);
    });
  });
  it('AC3: provider with no reviews', async () => {
    renderRoute('/providers/p12');
    expect(await screen.findByText('New')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No reviews yet' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more reviews' })).not.toBeInTheDocument();
  });
  it.each([
    ['guest', null, 'Request Service', '/login?next=/providers/p01/request'],
    ['owner', 'provider', 'Edit your listing', '/dashboard/profile'],
    ['open request', 'customer', 'View your request', '/requests/FX-2061'],
  ] as const)('AC4: %s', async (_label, persona, name, href) => {
    if (persona) signInAs(persona);
    renderRoute('/providers/p01');
    const links = await screen.findAllByRole('link', { name });
    expect(links[0]).toHaveAttribute('href', href);
  });
  it('AC4: admin sees no Request Service', async () => {
    signInAs('admin');
    renderRoute('/providers/p01');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText('Request Service')).not.toBeInTheDocument();
  });
  it('AC4: limit is disabled with helper copy', async () => {
    signInAs('customerAtLimit');
    renderRoute('/providers/p01');
    expect((await screen.findAllByRole('button', { name: /Request Service/ }))[0]).toBeDisabled();
    expect(
      screen.getAllByText(
        'You have 5 open requests. Wait for one to finish or cancel one to send another.',
      )[0],
    ).toBeInTheDocument();
  });
  it('AC4: paused provider (guest)', async () => {
    renderRoute('/providers/p13');
    expect((await screen.findAllByRole('button', { name: /Request Service/ }))[0]).toBeDisabled();
    expect(
      screen.getAllByText("Lanka Paint Works isn't taking new requests right now.")[0],
    ).toBeInTheDocument();
    expect(screen.getByText('Not taking requests')).toBeInTheDocument();
  });
  it.each(['unknown', 'p14', 'p11'])('AC6: %s → not found only', async (id) => {
    renderRoute(`/providers/${id}`);
    expect(await screen.findByText("This provider couldn't be found.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse all providers' })).toHaveAttribute('href', '/discover');
    expect(screen.queryByRole('link', { name: 'Back to results' })).not.toBeInTheDocument();
  });
  it('AC7: reviews 500 → section error, rest renders; retry loads', async () => {
    armForcedError('providers_reviews', '500');
    renderRoute('/providers/p01');
    expect(await screen.findByText("We couldn't load this.")).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Bell & Sons Plumbing' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Sarah K.')).toBeInTheDocument();
  });
});
