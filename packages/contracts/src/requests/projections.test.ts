import { describe, expect, it } from 'vitest';
import type { RequestStatus } from '../common/enums';
import type { RequestRecord } from './record';
import { toCustomerView, type CustomerViewContext } from './projections';
import { CustomerRequestView } from './schemas';

const now = new Date('2026-11-22T04:30:00.000Z');
const at = '2026-11-22T04:00:00.000Z';
const base: RequestRecord = {
  id: 'r-FX-3000',
  ref: 'FX-3000',
  customerId: 'u-c',
  providerId: 'p-1',
  providerUserId: 'u-p',
  serviceId: 's-1',
  service: { name: 'Leak repair', price: 2500, unit: 'per_hour' },
  preferredDate: '2026-11-25',
  slot: 'morning',
  townId: 'colombo',
  addressLine1: '12 Galle Road',
  addressLine2: null,
  description: 'Kitchen tap is leaking badly.',
  customerMobile: '+94770001001',
  agreedPrice: null,
  status: 'pending',
  reason: null,
  closedBy: null,
  createdAt: at,
  updatedAt: at,
  expiresAt: '2026-11-24T18:30:00.000Z',
  completedAt: null,
  events: [{ status: 'pending', at, actor: 'customer', actorUserId: 'u-c', reason: null }],
};
const ctx: CustomerViewContext = {
  provider: {
    id: 'p-1',
    businessName: 'Bell & Sons Plumbing',
    photoUrl: null,
    categoryId: 'plumbing',
    categoryIcon: 'wrench',
    verified: true,
    rating: 4.9,
    reviewCount: 212,
    listed: true,
    mobile: '+94770001101',
  },
  town: { id: 'colombo', name: 'Colombo' },
  ownReview: null,
};
const view = (o: Partial<RequestRecord>, c: CustomerViewContext = ctx) =>
  CustomerRequestView.parse(toCustomerView({ ...base, ...o }, c, now));

describe('toCustomerView', () => {
  it.each<[RequestStatus, string | null]>([
    ['pending', null],
    ['accepted', '+94770001101'],
    ['completed', '+94770001101'],
    ['declined', null],
    ['cancelled', null],
    ['expired', null],
  ])('%s → provider mobile %s', (status, mobile) => {
    const completedAt = status === 'completed' ? '2026-11-21T10:00:00.000Z' : null;
    expect(view({ status, completedAt }).provider.mobile).toBe(mobile);
  });
  it('pending: history, cancel deadline, canCancel, no review block', () => {
    const v = view({});
    expect(v.provider.categoryId).toBe('plumbing');
    expect(v.history).toEqual([{ status: 'pending', at, actor: 'customer', actorName: null, reason: null }]);
    expect(v.cancelDeadline).toBe('2026-11-24T18:30:00.000Z');
    expect(v.canCancel).toBe(true);
    expect(v.review).toBeNull();
    expect(v.addressLine1).toBe('12 Galle Road');
  });
  it('expired: cannot cancel', () => {
    expect(view({ status: 'expired' }).canCancel).toBe(false);
  });
  it('completed: review window, then own review closes eligibility', () => {
    const completedAt = '2026-11-21T10:00:00.000Z';
    expect(view({ status: 'completed', completedAt }).review).toEqual({
      eligible: true,
      deadline: '2026-12-21T10:00:00.000Z',
      own: null,
    });
    const own = {
      id: 'rv1',
      rating: 5,
      text: 'Great work, on time.',
      createdAt: at,
      visibility: 'visible' as const,
    };
    expect(view({ status: 'completed', completedAt }, { ...ctx, ownReview: own }).review?.eligible).toBe(
      false,
    );
  });
});
