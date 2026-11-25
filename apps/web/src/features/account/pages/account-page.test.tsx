import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { armForcedError } from '@/mocks/lib/controls';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

describe('S18 Account settings', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('saves name and mobile; nav initials update', async () => {
    signInAs('customer');
    renderRoute('/account');
    const name = await screen.findByLabelText(/^Full name/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Zara Perera');
    const mobile = screen.getByLabelText(/^Mobile number/);
    await userEvent.clear(mobile);
    await userEvent.type(mobile, '077 123 4567');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(authStore.getState().me?.fullName).toBe('Zara Perera');
    });
    expect(authStore.getState().me?.mobile).toBe('+94771234567');
    expect(await screen.findAllByText('ZP')).not.toHaveLength(0);
  });

  it('invalid mobile → S12 message', async () => {
    signInAs('customer');
    renderRoute('/account');
    const mobile = await screen.findByLabelText(/^Mobile number/);
    await userEvent.clear(mobile);
    await userEvent.type(mobile, '12345');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      await screen.findByText('Enter a Sri Lankan mobile number, like 077 123 4567.'),
    ).toBeInTheDocument();
  });

  it('provider clearing mobile → BR-23 message', async () => {
    signInAs('provider');
    renderRoute('/account');
    await userEvent.clear(await screen.findByLabelText(/^Mobile number/));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      await screen.findByText('Providers need a mobile number — customers use it after you accept.'),
    ).toBeInTheDocument();
  });

  it('wrong current password → field message', async () => {
    signInAs('customer');
    renderRoute('/account');
    await userEvent.type(await screen.findByLabelText(/^Current password/), 'nope1234');
    await userEvent.type(screen.getByLabelText(/^New password/), 'abc12345');
    await userEvent.type(screen.getByLabelText(/^Confirm new password/), 'abc12345');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('Current password is incorrect.')).toBeInTheDocument();
  });

  it('offer-services: Olivia off → onboarding; Marcus on and disabled', async () => {
    signInAs('customer');
    const r = renderRoute('/account');
    await userEvent.click(await screen.findByRole('switch', { name: 'I offer services' }));
    await waitFor(() => {
      expect(r.location()).toBe('/become-a-provider/1');
    });
    r.unmount();
    signInAs('provider');
    renderRoute('/account');
    expect(await screen.findByRole('switch', { name: 'I offer services' })).toBeDisabled();
    expect(screen.getByText("You're listed as Bell & Sons Plumbing.")).toBeInTheDocument();
  });

  it('dirty form → Discard changes? on leaving', async () => {
    signInAs('customer');
    const r = renderRoute('/account');
    await userEvent.type(await screen.findByLabelText(/^Full name/), 'x');
    await userEvent.click(screen.getAllByRole('link', { name: 'My requests' })[0] as HTMLElement);
    expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await waitFor(() => {
      expect(r.location()).toBe('/requests');
    });
  });

  it('session expiry while editing → /login?next=/account, name restored after login', async () => {
    signInAs('customer');
    armForcedError('me_update', '401');
    armForcedError('auth_refresh', '401');
    const r = renderRoute('/account');
    const name = await screen.findByLabelText(/^Full name/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Draft Name');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(r.location()).toBe('/login?next=%2Faccount');
    });
    expect(await screen.findByText('Your session expired. Log in again to continue.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^Email/), 'olivia@fixit.test');
    await userEvent.type(screen.getByLabelText(/^Password/), 'demo1234');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => {
      expect(r.location()).toBe('/account');
    });
    expect(await screen.findByDisplayValue('Draft Name')).toBeInTheDocument();
  });
});
