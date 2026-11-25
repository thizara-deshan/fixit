import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { renderRoute } from '@/test/render';

describe('S29 Admin sign-in', () => {
  it('customer credentials → generic error; admin → /admin', async () => {
    authStore.setGuest();
    const r = renderRoute('/admin/login');
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument();
    await userEvent.type(await screen.findByLabelText(/^Email/), 'olivia@fixit.test');
    await userEvent.type(screen.getByLabelText(/^Password/), 'demo1234');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText("That email and password don't match.")).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText(/^Email/));
    await userEvent.type(screen.getByLabelText(/^Email/), 'admin@fixit.test');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(r.location()).toBe('/admin');
    });
    expect(screen.queryByRole('link', { name: 'Sign up' })).not.toBeInTheDocument();
  });
});
