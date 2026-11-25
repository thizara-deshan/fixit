import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { db } from '@/mocks/db/store';
import { renderRoute } from '@/test/render';
import { register } from '../api';
import { rememberAfterSignup } from '../hooks';

const linkToken = () => new URL(db().lastEmailLink ?? '', 'http://x').searchParams.get('token') ?? '';

describe('S8 Confirm email', () => {
  it('success → Continue goes to stored provider intent; reopening → already confirmed', async () => {
    authStore.setGuest();
    await register({ fullName: 'Ann Lee', email: 'ann@fixit.test', password: 'abc12345' });
    rememberAfterSignup({ next: null, intent: 'provider' });
    const token = linkToken();
    const r = renderRoute(`/auth/confirm?token=${token}`);
    expect(await screen.findByRole('heading', { name: 'Email confirmed' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => {
      expect(r.location()).toMatch(/^\/(login|become-a-provider\/1)/);
    });
    r.unmount();
    renderRoute(`/auth/confirm?token=${token}`);
    expect(
      await screen.findByRole('heading', { name: 'Your email is already confirmed' }),
    ).toBeInTheDocument();
  });

  it('tampered token → This link has expired + Log in to resend', async () => {
    authStore.setGuest();
    renderRoute('/auth/confirm?token=nope');
    expect(await screen.findByRole('heading', { name: 'This link has expired' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in to resend' })).toBeInTheDocument();
  });
});
