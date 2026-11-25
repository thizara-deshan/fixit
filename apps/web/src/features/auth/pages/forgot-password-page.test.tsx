import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { renderRoute } from '@/test/render';

describe('S9 Forgot password', () => {
  it.each(['olivia@fixit.test', 'nobody@fixit.test'])('%s → same sent state', async (email) => {
    authStore.setGuest();
    renderRoute('/forgot-password');
    await userEvent.type(await screen.findByLabelText(/^Email/), email);
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    const sent = new RegExp(`If an account exists for ${email}`);
    expect(
      await screen.findByText((_, el) => el?.tagName === 'P' && sent.test(el.textContent)),
    ).toBeInTheDocument();
  });
});
