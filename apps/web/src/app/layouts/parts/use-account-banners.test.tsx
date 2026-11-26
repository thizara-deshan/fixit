import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { commit, db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

const NOT_SUBMITTED = 'Your listing shows as "Not yet verified". Upload your ID to get the Verified badge.';
const REJECTED =
  "Your verification wasn't approved: The photo of the back of your NIC is blurry. Upload a clearer photo.";
const PENDING = "We're checking your documents. We'll email you when it's done.";
const BADGE =
  "Your Verified badge was removed because you changed your category. We're checking your documents again.";
const ALL = [NOT_SUBMITTED, REJECTED, PENDING, BADGE];

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe('L3 provider banners (§6.8)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('Hank: not submitted → Get verified', async () => {
    signInAs('providerNotSubmitted');
    renderRoute('/dashboard');
    expect(await screen.findByText(NOT_SUBMITTED)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get verified' })).toHaveAttribute(
      'href',
      '/dashboard/verification',
    );
  });
  it('Grace: rejected → reason and Fix and resubmit', async () => {
    signInAs('providerRejected');
    renderRoute('/dashboard');
    expect(await screen.findByText(REJECTED)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Fix and resubmit' })).toBeInTheDocument();
  });
  it('pending review: dismissible for the session', async () => {
    const hank = db().providers.p08;
    if (hank) hank.verificationStatus = 'pending_review';
    commit();
    signInAs('providerNotSubmitted');
    const first = renderRoute('/dashboard');
    expect(await screen.findByText(PENDING)).toBeInTheDocument();
    await user().click(screen.getByRole('button', { name: /Dismiss/ }));
    expect(screen.queryByText(PENDING)).not.toBeInTheDocument();
    first.unmount();
    renderRoute('/dashboard');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(PENDING)).not.toBeInTheDocument();
  });
  it('re-verification: badge removed copy', async () => {
    const hank = db().providers.p08;
    if (hank) {
      hank.verificationStatus = 'pending_review';
      hank.reverificationReason = 'category';
    }
    commit();
    signInAs('providerNotSubmitted');
    renderRoute('/dashboard');
    expect(await screen.findByText(BADGE)).toBeInTheDocument();
    expect(screen.queryByText(PENDING)).not.toBeInTheDocument();
  });
  it('Marcus (verified) and Olivia on / see none of them', async () => {
    signInAs('provider');
    const a = renderRoute('/dashboard');
    await screen.findByRole('heading', { level: 1 });
    for (const t of ALL) expect(screen.queryByText(t)).not.toBeInTheDocument();
    a.unmount();
    signInAs('customer');
    renderRoute('/');
    await screen.findByRole('heading', { level: 1 });
    for (const t of ALL) expect(screen.queryByText(t)).not.toBeInTheDocument();
  });
});
