import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { authStore } from '@/lib/auth-store';
import { notify } from '@/lib/toast';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));
const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe('S24 Business profile', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC3: bio only → Changes saved. and no dialog', async () => {
    signInAs('provider');
    renderRoute('/dashboard/profile');
    const u = user();
    const bio = await screen.findByLabelText(/Short bio/);
    await u.type(bio, ' Weekend call-outs too.');
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    await vi.waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Changes saved.');
    });
    expect(screen.queryByRole('dialog', { name: 'Save and re-verify?' })).not.toBeInTheDocument();
  });
  it('AC3: rename while Verified → warning, confirm, back in review', async () => {
    signInAs('provider');
    renderRoute('/dashboard/profile');
    const u = user();
    const name = await screen.findByLabelText(/Business name/);
    await u.clear(name);
    await u.type(name, 'Bell Plumbing');
    expect(
      screen.getByText(
        'Changing your business name removes your Verified badge until Fixit checks your documents again.',
      ),
    ).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    const dialog = await screen.findByRole('dialog', { name: 'Save and re-verify?' });
    await u.click(within(dialog).getByRole('button', { name: 'Save and re-verify' }));
    await vi.waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Saved. Your listing is back in review.');
    });
    await vi.waitFor(() => {
      expect(authStore.getState().me?.provider?.verificationStatus).toBe('pending_review');
    });
  });
  it('AC3: category change → category warning and confirm', async () => {
    signInAs('provider');
    renderRoute('/dashboard/profile');
    const u = user();
    await u.selectOptions(await screen.findByLabelText(/Category/), 'handyman');
    expect(
      screen.getByText(
        'Changing your category removes your Verified badge until Fixit checks your documents again.',
      ),
    ).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('dialog', { name: 'Save and re-verify?' })).toBeInTheDocument();
  });
  it('Hank (not submitted): rename saves without warning or dialog', async () => {
    signInAs('providerNotSubmitted');
    renderRoute('/dashboard/profile');
    const u = user();
    const name = await screen.findByLabelText(/Business name/);
    await u.type(name, ' Co');
    expect(screen.queryByText(/removes your Verified badge/)).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    await vi.waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Changes saved.');
    });
  });
  it('AC3: remove photo → Remove your photo? → Photo removed.', async () => {
    const p = db().providers.p01;
    if (p) p.photoKey = 'p01-test';
    signInAs('provider');
    renderRoute('/dashboard/profile');
    const u = user();
    await u.click(await screen.findByRole('button', { name: 'Remove' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove your photo?' });
    await u.click(within(dialog).getByRole('button', { name: 'Remove' }));
    await vi.waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Photo removed.');
    });
    expect(await screen.findByRole('button', { name: 'Upload photo' })).toBeInTheDocument();
  });
  it('AC6: forced 500 keeps values and shows the banner', async () => {
    signInAs('provider');
    renderRoute('/dashboard/profile');
    const u = user();
    const bio = await screen.findByLabelText(/Short bio/);
    await u.type(bio, ' More.');
    armForcedError('provider_business_update', '500');
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(
      await screen.findByText("We couldn't save your changes. Check your connection and try again."),
    ).toBeInTheDocument();
    expect((bio as HTMLTextAreaElement).value.endsWith(' More.')).toBe(true);
  });
  it('§6.7: leaving a dirty form asks Discard changes?', async () => {
    signInAs('provider');
    const view = renderRoute('/dashboard/profile');
    await user().type(await screen.findByLabelText(/Short bio/), ' x');
    void view.router.navigate('/dashboard');
    expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
  });
});
