import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { db } from '@/mocks/db/store';
import { approveSubmission, submissionOr404 } from '@/mocks/lib/admin-verification';
import { armForcedError } from '@/mocks/lib/controls';
import { formatDayMonth } from '@/lib/format';
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

const business = (id: string) => db().providers[id]?.businessName ?? '';

describe('S31 verification queue', () => {
  it('pending tab: p02 row with First, submitted day and a Review link', async () => {
    renderAdminRoute('/admin/verifications');
    const row = (await screen.findByRole('link', { name: business('p02') })).closest('tr');
    if (!row) throw new Error('no row');
    expect(within(row).getByText('First')).toBeTruthy();
    expect(
      within(row).getByText(formatDayMonth(db().submissions['s-p02-1']?.submittedAt ?? '')),
    ).toBeTruthy();
    expect(within(row).getByRole('link', { name: 'Review' }).getAttribute('href')).toBe(
      '/admin/verifications/s-p02-1',
    );
  });
  it('approved and rejected tabs list p01 and p10', async () => {
    renderAdminRoute('/admin/verifications?status=approved');
    expect(await screen.findByRole('link', { name: business('p01') })).toBeTruthy();
    renderAdminRoute('/admin/verifications?status=rejected');
    expect(await screen.findByRole('link', { name: business('p10') })).toBeTruthy();
  });
  it('after approving s-p02-1 the pending tab says Nothing to review', async () => {
    const d = db();
    approveSubmission(d, submissionOr404(d, 's-p02-1'), 'u-admin', new Date());
    renderAdminRoute('/admin/verifications');
    expect(await screen.findByText('Nothing to review')).toBeTruthy();
  });
  it('forced 500 → section error', async () => {
    armForcedError('admin_verifications_list', '500');
    renderAdminRoute('/admin/verifications');
    expect(await screen.findByText("We couldn't load this.")).toBeTruthy();
  });
});
