import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { notify } from '@/lib/toast';
import { FIXED_NOW } from '@/test/fixed-now';
import { setViewportWidth } from '@/test/media';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));
const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe('S23 My Services', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    Element.prototype.scrollIntoView = vi.fn();
    setViewportWidth(1440);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC1: header, preview tile, table; add Gutter cleaning → toast and LKR 1,500 / visit', async () => {
    signInAs('provider');
    renderRoute('/dashboard/services');
    expect(await screen.findByText('LKR 2,500 / hour')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'My Services' })).toBeInTheDocument();
    const table = screen.getByRole('table');
    for (const h of ['Service', 'Price', 'Unit', 'Shows as'])
      expect(within(table).getByRole('columnheader', { name: h })).toBeInTheDocument();
    expect(within(table).getByText('from LKR 2,500 / hour')).toBeInTheDocument();
    const u = user();
    await u.click(screen.getByRole('button', { name: 'Add service' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add service' });
    await u.type(within(dialog).getByLabelText(/Service name/), 'Gutter cleaning');
    await u.type(within(dialog).getByLabelText(/Price/), '1500');
    await u.click(within(dialog).getByLabelText('per visit'));
    expect(within(dialog).getByText('from LKR 1,500 / visit')).toBeInTheDocument();
    await u.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('LKR 1,500 / visit')).toBeInTheDocument();
    expect(notify).toHaveBeenCalledWith('Service added.');
  });
  it('AC2: dialog errors — price 50, no unit, duplicate name', async () => {
    signInAs('provider');
    renderRoute('/dashboard/services');
    const u = user();
    await u.click(await screen.findByRole('button', { name: 'Add service' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add service' });
    await u.type(within(dialog).getByLabelText(/Service name/), 'Leak repair');
    await u.type(within(dialog).getByLabelText(/Price/), '50');
    await u.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(
      await within(dialog).findByText('Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Choose how this price is charged.')).toBeInTheDocument();
    await u.clear(within(dialog).getByLabelText(/Price/));
    await u.type(within(dialog).getByLabelText(/Price/), '900');
    await u.click(within(dialog).getByLabelText('fixed'));
    await u.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('You already have a service with this name.')).toBeInTheDocument();
  });
  it('AC2: edit → Service saved.; delete → Delete {name}? → Service deleted.', async () => {
    signInAs('provider');
    renderRoute('/dashboard/services');
    const u = user();
    await u.click(await screen.findByRole('button', { name: 'Edit Leak repair' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit service' });
    await u.clear(within(dialog).getByLabelText(/Price/));
    await u.type(within(dialog).getByLabelText(/Price/), '2600');
    await u.click(within(dialog).getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Service saved.');
    });
    await u.click(screen.getByRole('button', { name: 'Delete Drain unclogging' }));
    const confirm = await screen.findByRole('dialog', { name: 'Delete Drain unclogging?' });
    await u.click(within(confirm).getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Service deleted.');
    });
  });
  it('AC2: one service left → tap shows the tip; 20 services → Add disabled with help', async () => {
    signInAs('provider');
    const d = db();
    const mine = Object.values(d.services).filter((s) => s.providerId === 'p01');
    for (const s of mine.slice(1)) Reflect.deleteProperty(d.services, s.id);
    const view = renderRoute('/dashboard/services');
    const u = user();
    const only = mine[0]?.name ?? '';
    await u.click(await screen.findByRole('button', { name: `Delete ${only}` }));
    expect(await screen.findByText('You need at least one service.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: `Delete ${only}?` })).not.toBeInTheDocument();
    view.unmount();
    for (let i = 1; i < 20; i++)
      d.services[`x${String(i)}`] = {
        id: `x${String(i)}`,
        providerId: 'p01',
        name: `Extra ${String(i)}`,
        price: 5000,
        unit: 'fixed',
      };
    renderRoute('/dashboard/services');
    // Add is also disabled while loading, so wait for the help text before asserting.
    expect(await screen.findByText('You can list up to 20 services.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add service' })).toBeDisabled();
  });
  it('AC6: forced 500 keeps the dialog and values; forced services_min shows its copy', async () => {
    signInAs('provider');
    renderRoute('/dashboard/services');
    const u = user();
    await u.click(await screen.findByRole('button', { name: 'Edit Leak repair' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit service' });
    armForcedError('provider_service_update', '500');
    await u.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(
      await within(dialog).findByText("We couldn't save your changes. Check your connection and try again."),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Service name/)).toHaveValue('Leak repair');
    await u.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await u.click(screen.getByRole('button', { name: 'Delete Leak repair' }));
    armForcedError('provider_service_delete', 'rule_services_min');
    const confirm = await screen.findByRole('dialog', { name: 'Delete Leak repair?' });
    await u.click(within(confirm).getByRole('button', { name: 'Delete' }));
    expect(await within(confirm).findByText('You need at least one service.')).toBeInTheDocument();
  });
  it('§6.7: closing a dirty dialog asks Discard changes?', async () => {
    signInAs('provider');
    renderRoute('/dashboard/services');
    const u = user();
    await u.click(await screen.findByRole('button', { name: 'Add service' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add service' });
    await u.type(within(dialog).getByLabelText(/Service name/), 'Gu');
    await u.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('dialog', { name: 'Discard changes?' })).toBeInTheDocument();
  });
  it('AC5: 390px → phone cards, no table', async () => {
    setViewportWidth(390);
    signInAs('provider');
    renderRoute('/dashboard/services');
    expect(await screen.findByRole('list', { name: 'Your services' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('from LKR 2,500 / hour')).toBeInTheDocument();
  });
});
