import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { CONTACT_EMAIL } from '@/lib/env';
import { renderRoute } from '@/test/render';
import { PRIVACY_HEADINGS } from './privacy-page';

describe('S11 pages', () => {
  it('about', async () => {
    authStore.setGuest();
    renderRoute('/about');
    expect(await screen.findByRole('heading', { level: 1, name: 'About Fixit' })).toBeInTheDocument();
  });
  it('contact shows the contact email (AC7)', async () => {
    authStore.setGuest();
    renderRoute('/contact');
    expect(await screen.findByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute(
      'href',
      `mailto:${CONTACT_EMAIL}`,
    );
  });
  it('privacy shows every heading with the placeholder (AC7)', async () => {
    authStore.setGuest();
    renderRoute('/privacy');
    for (const h of PRIVACY_HEADINGS)
      expect(await screen.findByRole('heading', { level: 2, name: h })).toBeInTheDocument();
    expect(screen.getAllByText('Content coming before launch.')).toHaveLength(PRIVACY_HEADINGS.length);
  });
});
