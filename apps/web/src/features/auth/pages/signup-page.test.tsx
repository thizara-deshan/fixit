import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { renderRoute } from '@/test/render';

describe('S6 Sign up', () => {
  it('empty submit shows the three SPEC messages', async () => {
    authStore.setGuest();
    renderRoute('/signup');
    await userEvent.click(await screen.findByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Enter your full name.')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters with a letter and a number.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Full name/)).toHaveFocus();
  });
  it('taken email → field message + Log in instead', async () => {
    authStore.setGuest();
    renderRoute('/signup');
    await userEvent.type(await screen.findByLabelText(/^Full name/), 'Olivia M');
    await userEvent.type(screen.getByLabelText(/^Email/), 'olivia@fixit.test');
    await userEvent.type(screen.getByLabelText(/^Password/), 'abc12345');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('This email already has an account.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in instead' })).toHaveAttribute('href', '/login');
  });
  it('success → S7 with the email, signed in', async () => {
    authStore.setGuest();
    const r = renderRoute('/signup?intent=provider');
    expect(await screen.findByRole('heading', { name: 'Join Fixit as a provider' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^Full name/), 'Ann Lee');
    await userEvent.type(screen.getByLabelText(/^Email/), 'ann@fixit.test');
    await userEvent.type(screen.getByLabelText(/^Password/), 'abc12345');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => {
      expect(r.location()).toBe('/signup/check-email');
    });
    await waitFor(() => {
      expect(authStore.getState().me?.email).toBe('ann@fixit.test'); // S7 sets the session on mount
    });
  });
});
