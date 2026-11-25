import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { db } from '@/mocks/db/store';
import { renderRoute } from '@/test/render';
import { forgotPassword, login } from '../api';

describe('S10 Reset password', () => {
  it('mismatch → Passwords don’t match.; success → /login; old password fails', async () => {
    authStore.setGuest();
    await forgotPassword({ email: 'olivia@fixit.test' });
    const token = new URL(db().lastEmailLink ?? '', 'http://x').searchParams.get('token') ?? '';
    const r = renderRoute(`/reset-password?token=${token}`);
    await userEvent.type(await screen.findByLabelText(/^New password/), 'newpass99');
    await userEvent.type(screen.getByLabelText(/^Confirm new password/), 'newpass98');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText(/^Confirm new password/));
    await userEvent.type(screen.getByLabelText(/^Confirm new password/), 'newpass99');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    await waitFor(() => {
      expect(r.location()).toBe('/login');
    });
    await expect(login({ email: 'olivia@fixit.test', password: 'demo1234' })).rejects.toMatchObject({
      status: 401,
    });
  });

  it('bad token → expired state', async () => {
    authStore.setGuest();
    renderRoute('/reset-password?token=nope');
    await userEvent.type(await screen.findByLabelText(/^New password/), 'newpass99');
    await userEvent.type(screen.getByLabelText(/^Confirm new password/), 'newpass99');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(await screen.findByRole('heading', { name: 'This reset link has expired' })).toBeInTheDocument();
  });
});
