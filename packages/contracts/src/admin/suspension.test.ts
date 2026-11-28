import { describe, expect, it } from 'vitest';
import type { RequestRecord } from '../requests/record';
import { CUSTOMER_ACCOUNT_CLOSED, planSuspension, PROVIDER_UNAVAILABLE, suspendImpact } from './suspension';

const now = new Date('2026-11-24T06:00:00Z');
const rec = (
  id: string,
  status: RequestRecord['status'],
  customerId: string,
  providerUserId: string,
): RequestRecord =>
  ({
    id,
    ref: `FX-${id}`,
    customerId,
    providerId: `p-${providerUserId}`,
    providerUserId,
    serviceId: 'svc',
    service: { name: 'Leak repair', price: 2500, unit: 'per_hour' },
    preferredDate: '2026-11-28',
    slot: 'morning',
    townId: 'colombo',
    addressLine1: '1 Main St',
    addressLine2: null,
    description: 'x'.repeat(20),
    customerMobile: '+94770000001',
    agreedPrice: null,
    status,
    reason: null,
    closedBy: null,
    createdAt: '2026-11-24T00:00:00Z',
    updatedAt: '2026-11-24T00:00:00Z',
    expiresAt: '2026-11-27T00:00:00Z',
    completedAt: null,
    events: [],
  }) satisfies RequestRecord;

describe('planSuspension', () => {
  const rows = [
    rec('1001', 'pending', 'c1', 'hank'),
    rec('1002', 'accepted', 'c2', 'hank'),
    rec('1003', 'completed', 'c3', 'hank'),
    rec('1004', 'pending', 'hank', 'other'),
    rec('1005', 'accepted', 'hank', 'other2'),
    rec('1006', 'pending', 'c4', 'other'),
  ];
  it('provider side: pending → declined, accepted → cancelled, "Provider unavailable"', () => {
    const e = planSuspension(rows, 'hank', now).filter((x) => x.side === 'provider');
    expect(e).toEqual([
      { requestId: '1001', to: 'declined', side: 'provider', reason: PROVIDER_UNAVAILABLE },
      { requestId: '1002', to: 'cancelled', side: 'provider', reason: PROVIDER_UNAVAILABLE },
    ]);
  });
  it('customer side: open → cancelled, "Customer account closed"', () => {
    const e = planSuspension(rows, 'hank', now).filter((x) => x.side === 'customer');
    expect(e.map((x) => [x.requestId, x.to, x.reason])).toEqual([
      ['1004', 'cancelled', CUSTOMER_ACCOUNT_CLOSED],
      ['1005', 'cancelled', CUSTOMER_ACCOUNT_CLOSED],
    ]);
  });
  it('final and unrelated requests are untouched', () => {
    const ids = planSuspension(rows, 'hank', now).map((x) => x.requestId);
    expect(ids).not.toContain('1003');
    expect(ids).not.toContain('1006');
  });
  it('suspendImpact counts each bucket', () => {
    expect(suspendImpact(planSuspension(rows, 'hank', now))).toEqual({
      providerPending: 1,
      providerAccepted: 1,
      customerOpen: 2,
    });
  });
});
