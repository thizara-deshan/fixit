import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXED_NOW } from '@/test/fixed-now';
import { db } from '../db/store';
import { MockHttpError } from './errors';
import { reactivateUser, suspendUser } from './admin-suspension';
import { isListed } from './cards';

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
});
afterEach(() => {
  vi.useRealTimers();
});

function thrown(fn: () => void): MockHttpError {
  try {
    fn();
  } catch (e) {
    if (e instanceof MockHttpError) return e;
    throw e;
  }
  throw new Error('expected the call to throw');
}

describe('suspension cascade (mock)', () => {
  it('provider: pending → declined "Provider unavailable", accepted → cancelled; listing hidden; audit', () => {
    const d = db();
    const hank = d.users['u-hank'];
    if (!hank) throw new Error('hank');
    suspendUser(d, hank, 'u-admin', 'Repeated complaints from customers.', new Date());
    const byRef = (ref: string) => Object.values(d.requests).find((r) => r.ref === ref);
    expect(byRef('FX-2042')).toMatchObject({
      status: 'declined',
      reason: 'Provider unavailable',
      closedBy: 'system',
    });
    expect(byRef('FX-2043')).toMatchObject({
      status: 'cancelled',
      reason: 'Provider unavailable',
      closedBy: 'system',
    });
    expect(byRef('FX-2042')?.events.at(-1)).toMatchObject({ actor: 'system', status: 'declined' });
    const p08 = d.providers.p08;
    if (!p08) throw new Error('p08');
    expect(isListed(d, p08)).toBe(false);
    expect(d.audit.at(-1)).toMatchObject({ action: 'user_suspend', targetId: 'u-hank' });
  });
  it('customer: open requests → cancelled "Customer account closed"', () => {
    const d = db();
    const dilani = d.users['u-dilani'];
    if (!dilani) throw new Error('dilani');
    suspendUser(d, dilani, 'u-admin', 'Fraudulent bookings reported.', new Date());
    const mine = Object.values(d.requests).filter(
      (r) => r.customerId === 'u-dilani' && r.ref.startsWith('FX-199'),
    );
    expect(mine).toHaveLength(5);
    for (const r of mine) expect(r).toMatchObject({ status: 'cancelled', reason: 'Customer account closed' });
  });
  it('refuses to suspend an admin (cannot_suspend_admin) and a suspended user (409)', () => {
    const d = db();
    const admin = d.users['u-admin'];
    const ruwan = d.users['u-ruwan'];
    if (!admin || !ruwan) throw new Error('users');
    const admin422 = thrown(() => {
      suspendUser(d, admin, 'u-admin', 'Testing the guard rail.', new Date());
    });
    expect(admin422.status).toBe(422);
    expect(admin422.extra).toEqual({ details: { rule: 'cannot_suspend_admin' } });
    const again = thrown(() => {
      suspendUser(d, ruwan, 'u-admin', 'Testing the guard rail.', new Date());
    });
    expect(again.status).toBe(409);
  });
  it('reactivate: listing back, closed requests stay closed, verification unchanged', () => {
    const d = db();
    const hank = d.users['u-hank'];
    const p08 = d.providers.p08;
    if (!hank || !p08) throw new Error('fixtures');
    suspendUser(d, hank, 'u-admin', 'Repeated complaints from customers.', new Date());
    reactivateUser(d, hank, 'u-admin', 'Complaints were resolved by phone.', new Date());
    expect(isListed(d, p08)).toBe(true);
    expect(Object.values(d.requests).find((r) => r.ref === 'FX-2042')?.status).toBe('declined');
    expect(p08.verificationStatus).toBe('not_submitted');
    expect(d.audit.at(-1)).toMatchObject({ action: 'user_reactivate' });
  });
});
