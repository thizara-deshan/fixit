import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { armForcedError } from '@/mocks/lib/controls';
import { db } from '@/mocks/db/store';
import { approveSubmission, submissionOr404 } from '@/mocks/lib/admin-verification';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';
import { renderAdminRoute } from '../test-routes';

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  signInAs('admin');
});
afterEach(() => {
  vi.useRealTimers();
});

describe('S30 admin overview', () => {
  it('AC1: header, two attention tiles with links, no metrics', async () => {
    renderAdminRoute('/admin');
    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' })).toBeTruthy();
    const pending = await screen.findByRole('link', { name: /Waiting for verification/ });
    expect(pending.getAttribute('href')).toBe('/admin/verifications');
    expect(within(pending).getByText('1')).toBeTruthy();
    expect(within(pending).getByText(/^oldest/)).toBeTruthy();
    const suspended = screen.getByRole('link', { name: /Suspended accounts/ });
    expect(suspended.getAttribute('href')).toBe('/admin/users?status=suspended');
    expect(within(suspended).getByText('1')).toBeTruthy();
    expect(within(suspended).getByText('in total')).toBeTruthy();
    expect(screen.queryByText('This month')).toBeNull();
  });
  it('after the only submission is approved → 0 and "all caught up"', async () => {
    const d = db();
    approveSubmission(d, submissionOr404(d, 's-p02-1'), 'u-admin', new Date());
    renderAdminRoute('/admin');
    const pending = await screen.findByRole('link', { name: /Waiting for verification/ });
    expect(within(pending).getByText('0')).toBeTruthy();
    expect(within(pending).getByText('all caught up')).toBeTruthy();
  });
  it('AC8: forced 500 → section error with Try again', async () => {
    armForcedError('admin_overview', '500');
    renderAdminRoute('/admin');
    expect(await screen.findByText("We couldn't load this.")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});
