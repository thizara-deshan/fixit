import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('L1 account banners', () => {
  it('unconfirmed user sees the banner with Resend email', async () => {
    signInAs('customerUnconfirmed');
    renderRoute('/');
    expect(
      await screen.findByText('Confirm your email to send requests. We sent a link to nimal@fixit.test.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resend email' })).toBeInTheDocument();
  });

  it('confirmed user sees no banner', async () => {
    signInAs('customer');
    renderRoute('/');
    await screen.findByRole('main');
    expect(screen.queryByText(/Confirm your email/)).not.toBeInTheDocument();
  });
});
