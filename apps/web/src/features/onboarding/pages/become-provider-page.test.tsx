import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { commit, db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { applyOnboardingStep } from '@/mocks/lib/own-provider';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const step1 = {
  businessName: 'Martinez Home Fix',
  bio: 'Small repairs and odd jobs around the house, done well.',
  yearsExperience: 4,
};

describe('S19 become a provider', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('AC1: step 1 stepper, errors, owner line, Continue → step 2', async () => {
    signInAs('customer');
    const view = renderRoute('/become-a-provider/1');
    expect(await screen.findByText('Step 1 of 5 · Business details')).toBeInTheDocument();
    expect(screen.getByText('Owner: Olivia Martinez')).toBeInTheDocument();
    const u = user();
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    for (const m of [
      'Enter your business name.',
      'Tell customers about your business in at least 30 characters.',
      'Enter a number from 0 to 60.',
    ])
      expect(await screen.findByText(m)).toBeInTheDocument();
    await u.type(screen.getByLabelText(/^Business name/), 'Martinez Home Fix');
    await u.type(
      screen.getByLabelText(/^Short bio/),
      'Small repairs and odd jobs around the house, done well.',
    );
    await u.type(screen.getByLabelText(/^Years of experience/), '4');
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Step 2 of 5 · Category')).toBeInTheDocument();
    expect(view.location()).toBe('/become-a-provider/2');
  });
  it('AC2: step 2 has 8 category radios and the note; Continue without choosing → Choose a category.', async () => {
    const d = db();
    applyOnboardingStep(d, 'u-olivia', { step: 1, body: step1 }, FIXED_NOW);
    commit();
    signInAs('customer');
    renderRoute('/become-a-provider/2');
    expect(await screen.findByText('Step 2 of 5 · Category')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(8);
    expect(
      screen.getByText(
        'You can only choose one category. Changing it later means we check your documents again.',
      ),
    ).toBeInTheDocument();
    await user().click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Choose a category.')).toBeInTheDocument();
  });
  it('AC3: resume — Kasun opens /1 → /3 with Silva Electricals saved; Back → step 2 keeps its value', async () => {
    signInAs('providerDraft');
    const view = renderRoute('/become-a-provider/1');
    expect(await screen.findByText('Step 3 of 5 · Services & prices')).toBeInTheDocument();
    expect(view.location()).toBe('/become-a-provider/3');
    await user().click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByText('Step 2 of 5 · Category')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Electrical/ })).toBeChecked();
  });
  it('AC3: Nimal sees the email gate; Marcus → /dashboard', async () => {
    signInAs('customerUnconfirmed');
    const a = renderRoute('/become-a-provider/1');
    expect(await screen.findByText('Confirm your email first')).toBeInTheDocument();
    a.unmount();
    signInAs('provider');
    const b = renderRoute('/become-a-provider/2');
    await waitFor(() => {
      expect(b.location()).toBe('/dashboard');
    });
  });
  it('AC7: leaving a dirty step asks Discard changes?', async () => {
    signInAs('customer');
    const view = renderRoute('/become-a-provider/1');
    await user().type(await screen.findByLabelText(/^Business name/), 'Martinez');
    void view.router.navigate('/discover');
    expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
    await user().click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(view.location()).toBe('/become-a-provider/1');
  });
  it('AC8: forced 500 on Continue keeps values and shows the banner', async () => {
    signInAs('providerDraft');
    renderRoute('/become-a-provider/3');
    const u = user();
    await u.type(await screen.findByLabelText(/^Service name/), 'Fan fitting');
    await u.type(screen.getByLabelText(/^Price/), '1800');
    armForcedError('provider_onboarding_save', '500');
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      await screen.findByText("We couldn't save your changes. Check your connection and try again."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Service name/)).toHaveValue('Fan fitting');
  });
  it('AC9: guest → login with next; admin → S40', async () => {
    authStore.setGuest();
    const a = renderRoute('/become-a-provider/1');
    await waitFor(() => {
      expect(a.location()).toBe('/login?next=%2Fbecome-a-provider%2F1');
    });
    a.unmount();
    signInAs('admin');
    renderRoute('/become-a-provider/1');
    expect(
      await screen.findByRole('heading', { level: 1, name: "You don't have access to this page" }),
    ).toBeInTheDocument();
  });
});
