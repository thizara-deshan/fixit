import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';
import { notify } from '@/lib/toast';
import { renderAdminRoute } from '../test-routes';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  vi.mocked(notify).mockClear();
  Element.prototype.scrollIntoView = vi.fn();
  signInAs('admin');
});
afterEach(() => {
  vi.useRealTimers();
});

const business = () => db().providers.p02?.businessName ?? '';

describe('S32 verification review', () => {
  it('shows tiles, provider card and checklist; no previous decisions', async () => {
    renderAdminRoute('/admin/verifications/s-p02-1');
    expect(await screen.findByRole('heading', { level: 1, name: business() })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open NIC — front' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open NIC — back' })).toBeTruthy();
    expect(screen.getAllByText('Not provided')).toHaveLength(2);
    expect(screen.getByText(db().users[db().providers.p02?.userId ?? '']?.email ?? '#')).toBeTruthy();
    expect(screen.getByText('Before you approve')).toBeTruthy();
    expect(screen.queryByText('Previous decisions')).toBeNull();
  });

  it('approve → toast → queue shows Nothing to review', async () => {
    const user = userEvent.setup();
    const { location } = renderAdminRoute('/admin/verifications/s-p02-1');
    await screen.findByRole('heading', { level: 1, name: business() });
    // desktop and phone bars both render in jsdom: use the first Approve
    await user.click(screen.getAllByRole('button', { name: /^Approve$/ })[0] as HTMLElement);
    const dialog = await screen.findByRole('dialog', { name: `Approve ${business()}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith(`${business()} is verified.`);
    });
    expect(await screen.findByText('Nothing to review')).toBeTruthy();
    expect(location()).toBe('/admin/verifications');
  });

  it('reject: short reason shows the SPEC error; a valid one toasts', async () => {
    const user = userEvent.setup();
    renderAdminRoute('/admin/verifications/s-p02-1');
    await screen.findByRole('heading', { level: 1, name: business() });
    await user.click(screen.getAllByRole('button', { name: 'Reject' })[0] as HTMLElement);
    const dialog = await screen.findByRole('dialog');
    const box = within(dialog).getByLabelText(/Reason for rejection/);
    await user.type(box, 'blurr');
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }));
    expect(await within(dialog).findByText('Give a reason so the provider knows what to fix.')).toBeTruthy();
    await user.clear(box);
    await user.type(box, 'The NIC photo is cut off on the left.');
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith(`Rejected. ${business()} has been emailed.`);
    });
  });

  it('forced 409 on approve → "This submission has changed"', async () => {
    const user = userEvent.setup();
    renderAdminRoute('/admin/verifications/s-p02-1');
    await screen.findByRole('heading', { level: 1, name: business() });
    await user.click(screen.getAllByRole('button', { name: /^Approve$/ })[0] as HTMLElement);
    const dialog = await screen.findByRole('dialog', { name: `Approve ${business()}?` });
    armForcedError('admin_verification_approve', '409');
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));
    expect(await screen.findByText('This submission has changed')).toBeTruthy();
  });

  it('unknown submission → S39', async () => {
    renderAdminRoute('/admin/verifications/s-nope');
    expect(await screen.findByRole('heading', { level: 1, name: "We can't find that page" })).toBeTruthy();
  });
});
