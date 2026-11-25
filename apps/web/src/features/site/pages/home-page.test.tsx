import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('S1 Home', () => {
  it('search hand-off: q + loc, empty omitted (AC3)', async () => {
    authStore.setGuest();
    const user = userEvent.setup();
    const { location } = renderRoute('/');
    await user.type(await screen.findByLabelText('Service'), 'plumb');
    const loc = screen.getByLabelText('Location');
    await waitFor(() => {
      expect(within(loc).getByRole('option', { name: 'Dehiwala-Mount Lavinia' })).toBeInTheDocument();
    });
    await user.selectOptions(loc, 'dehiwala-mount-lavinia');
    await user.type(screen.getByLabelText('Service'), '{Enter}');
    await waitFor(() => {
      expect(location()).toBe('/discover?q=plumb&loc=dehiwala-mount-lavinia');
    });
  });
  it('chip fills the input without submitting (AC3)', async () => {
    authStore.setGuest();
    const user = userEvent.setup();
    const { location } = renderRoute('/');
    await user.click(await screen.findByRole('button', { name: 'Cleaning' }));
    expect(screen.getByLabelText('Service')).toHaveValue('Cleaning');
    expect(location()).toBe('/');
  });
  it('category card links to /discover?cat= (AC4)', async () => {
    authStore.setGuest();
    renderRoute('/');
    const links = await screen.findAllByRole('link', { name: /Plumbing/ });
    expect(links.some((l) => l.getAttribute('href') === '/discover?cat=plumbing')).toBe(true);
  });
  it('featured cards: ≤ 4, From price, profile links (AC1, AC4)', async () => {
    authStore.setGuest();
    renderRoute('/');
    const section = (await screen.findByRole('heading', { name: 'Featured providers near you' })).closest(
      'section',
    );
    if (!section) throw new Error('no section');
    await waitFor(() => {
      expect(within(section).getAllByRole('article').length).toBeGreaterThan(0);
    });
    const cards = within(section).getAllByRole('article');
    expect(cards.length).toBeLessThanOrEqual(4);
    const first = within(cards[0] as HTMLElement).getAllByRole('link')[0];
    expect(first?.getAttribute('href')).toMatch(/^\/providers\//);
  });
  it('featured 500 shows a section error; categories still render (AC6)', async () => {
    authStore.setGuest();
    armForcedError('providers_featured', '500');
    renderRoute('/');
    expect(await screen.findByText("We couldn't load this.")).toBeInTheDocument();
    expect((await screen.findAllByRole('link', { name: /Plumbing/ })).length).toBeGreaterThan(0);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Featured providers near you' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("We couldn't load this.")).not.toBeInTheDocument();
    });
  });
  it('0 qualifying providers hides Featured and the floating card (AC6)', async () => {
    for (const p of Object.values(db().providers)) p.verificationStatus = 'not_submitted';
    authStore.setGuest();
    renderRoute('/');
    await screen.findAllByRole('link', { name: /Plumbing/ });
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Featured providers near you' })).not.toBeInTheDocument();
    });
  });
  it.each([
    ['guest', null, 'Join as a provider', '/signup?intent=provider'],
    ['customer', 'customer', 'Join as a provider', '/become-a-provider/1'],
    ['provider', 'provider', 'Go to your dashboard', '/dashboard'],
  ] as const)('CTA band for %s (AC5)', async (_, persona, label, href) => {
    if (persona) signInAs(persona);
    else authStore.setGuest();
    renderRoute('/');
    const band = (
      await screen.findByRole('heading', { name: 'Are you a service provider? Join us.' })
    ).closest('section');
    if (!band) throw new Error('no band');
    expect(within(band).getByRole('link', { name: label })).toHaveAttribute('href', href);
    expect(within(band).getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', '/for-providers');
  });
});
