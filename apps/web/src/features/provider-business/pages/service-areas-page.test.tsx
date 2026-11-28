import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { notify } from '@/lib/toast';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));
const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe('S25 Service areas', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC4: new base town is unticked from others; save → toast and db updated', async () => {
    signInAs('provider');
    renderRoute('/dashboard/areas');
    const u = user();
    expect(await screen.findByText('4 of 9 selected')).toBeInTheDocument();
    await u.selectOptions(screen.getByLabelText(/Base town/), 'moratuwa');
    expect(screen.getByText('3 of 9 selected')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Moratuwa' })).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    await vi.waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Service areas saved.');
    });
    expect(db().areas.find((a) => a.providerId === 'p01' && a.isBase)?.townId).toBe('moratuwa');
  });
  it('AC6: forced 500 keeps the selection and shows the banner', async () => {
    signInAs('provider');
    renderRoute('/dashboard/areas');
    const u = user();
    await u.click(await screen.findByRole('checkbox', { name: 'Negombo' }));
    armForcedError('provider_areas_put', '500');
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(
      await screen.findByText("We couldn't save your changes. Check your connection and try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Negombo' })).toBeChecked();
  });
});
