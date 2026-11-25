import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('S7 Check your email', () => {
  it('resend → toast and countdown label', async () => {
    signInAs('customerUnconfirmed');
    renderRoute('/signup/check-email');
    expect(await screen.findByText('nimal@fixit.test')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Resend email' }));
    expect(await screen.findByRole('button', { name: /^Resend in 0:5\d$/ })).toBeDisabled();
  });
});
