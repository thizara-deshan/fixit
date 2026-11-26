import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { commit, db } from '@/mocks/db/store';
import { applyOnboardingStep } from '@/mocks/lib/own-provider';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe('S19 done', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC2/AC4: publish → done → Dashboard nav, listed unverified', async () => {
    const d = db();
    const body1 = {
      businessName: 'Martinez Home Fix',
      bio: 'Small repairs and odd jobs around the house, done well.',
      yearsExperience: 4,
    };
    applyOnboardingStep(d, 'u-olivia', { step: 1, body: body1 }, FIXED_NOW);
    applyOnboardingStep(d, 'u-olivia', { step: 2, body: { categoryId: 'handyman' } }, FIXED_NOW);
    applyOnboardingStep(
      d,
      'u-olivia',
      { step: 3, body: { services: [{ name: 'Shelf fitting', price: 1800, unit: 'per_hour' }] } },
      FIXED_NOW,
    );
    applyOnboardingStep(
      d,
      'u-olivia',
      { step: 4, body: { baseTownId: 'colombo', otherTownIds: [] } },
      FIXED_NOW,
    );
    commit();
    signInAs('customer');
    const view = renderRoute('/become-a-provider/5');
    await user().click(await screen.findByRole('button', { name: 'Publish listing' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your listing is live' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Customers can now find Martinez Home Fix. It shows as "Not yet verified" until you upload your ID.',
      ),
    ).toBeInTheDocument();
    expect(view.location()).toBe('/become-a-provider/done');
    await waitFor(() => {
      expect(authStore.getState().me?.roles).toContain('provider');
    });
    expect((await screen.findAllByRole('link', { name: 'Dashboard' })).length).toBeGreaterThan(0);
    const cta = screen.getAllByRole('link', { name: 'Get verified' })[0]; // the footer has one too
    if (!cta) throw new Error('no Get verified link');
    await user().click(cta);
    await waitFor(() => {
      expect(view.location()).toBe('/dashboard/verification');
    });
  });
  it('done for a draft → back to its step', async () => {
    signInAs('providerDraft');
    const view = renderRoute('/become-a-provider/done');
    await waitFor(() => {
      expect(view.location()).toBe('/become-a-provider/3');
    });
  });
});
