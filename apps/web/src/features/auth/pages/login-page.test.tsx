import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { armForcedError } from '@/mocks/lib/controls';
import { renderRoute } from '@/test/render';

async function logIn(email: string, password = 'demo1234') {
  await userEvent.type(await screen.findByLabelText(/^Email/), email);
  await userEvent.type(screen.getByLabelText(/^Password/), password);
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('S5 Log in', () => {
  it('empty submit shows SPEC messages', async () => {
    authStore.setGuest();
    renderRoute('/login');
    await userEvent.click(await screen.findByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
  });
  it('wrong password → banner', async () => {
    authStore.setGuest();
    renderRoute('/login');
    await logIn('olivia@fixit.test', 'wrong-pass');
    expect(
      await screen.findByText("That email and password don't match. Try again or reset your password."),
    ).toBeInTheDocument();
  });
  it.each([
    ['olivia@fixit.test', '/login', '/'],
    ['marcus@fixit.test', '/login', '/dashboard'],
    ['olivia@fixit.test', '/login?next=%2Frequests', '/requests'],
  ])('%s from %s → %s', async (email, from, to) => {
    authStore.setGuest();
    const r = renderRoute(from);
    await logIn(email);
    await waitFor(() => {
      expect(r.location()).toBe(to);
    });
  });
  it('suspended account → suspended banner', async () => {
    authStore.setGuest();
    renderRoute('/login');
    await logIn('ruwan@fixit.test');
    expect(await screen.findByText(/Your account is suspended\./)).toBeInTheDocument();
  });
  it('forced 500 → §6.3 banner', async () => {
    authStore.setGuest();
    armForcedError('auth_login', '500');
    renderRoute('/login');
    await logIn('olivia@fixit.test');
    expect(
      await screen.findByText("We couldn't save your changes. Check your connection and try again."),
    ).toBeInTheDocument();
  });
  it('session expired → info banner', async () => {
    authStore.signOut('expired');
    renderRoute('/login?next=%2Faccount');
    expect(await screen.findByText('Your session expired. Log in again to continue.')).toBeInTheDocument();
  });
});
