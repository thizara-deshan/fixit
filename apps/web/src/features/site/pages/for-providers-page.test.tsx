import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('S4 For providers', () => {
  it.each([
    ['guest', null, 'Join as a provider', '/signup?intent=provider'],
    ['customer', 'customer', 'Join as a provider', '/become-a-provider/1'],
    ['provider', 'provider', 'Go to your dashboard', '/dashboard'],
  ] as const)('both CTAs for %s (AC5)', async (_, persona, label, href) => {
    if (persona) signInAs(persona);
    else authStore.setGuest();
    renderRoute('/for-providers');
    await screen.findByRole('heading', { name: 'Get local jobs without paying to join.' });
    const links = screen.getAllByRole('link', { name: label });
    expect(links).toHaveLength(2);
    for (const l of links) expect(l).toHaveAttribute('href', href);
  });
});
