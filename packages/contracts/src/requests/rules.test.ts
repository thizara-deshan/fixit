import { describe, expect, it } from 'vitest';
import {
  bookingWindow,
  canComplete,
  cancelDeadline,
  checkCreateRequest,
  expiresAt,
  type CreateRequestContext,
} from './rules';

const at = (iso: string) => new Date(iso);

describe('expiresAt (BR-31)', () => {
  it('uses the 72 h bound when it comes first', () => {
    expect(expiresAt(at('2026-03-09T04:30:00.000Z'), '2026-03-15').toISOString()).toBe(
      '2026-03-12T04:30:00.000Z',
    );
  });
  it('uses 00:00 Colombo on the preferred date when it comes first', () => {
    expect(expiresAt(at('2026-03-09T04:30:00.000Z'), '2026-03-11').toISOString()).toBe(
      '2026-03-10T18:30:00.000Z',
    );
  });
  it('uses Colombo midnight, not UTC midnight, when the UTC day differs', () => {
    // created 01:30 Colombo on 10 Mar (still 9 Mar in UTC); 72 h → 2026-03-12T20:00Z; midnight 12 Mar Colombo → 2026-03-11T18:30Z
    expect(expiresAt(at('2026-03-09T20:00:00.000Z'), '2026-03-12').toISOString()).toBe(
      '2026-03-11T18:30:00.000Z',
    );
  });
  it('both bounds equal → that instant', () => {
    expect(expiresAt(at('2026-03-09T18:30:00.000Z'), '2026-03-13').toISOString()).toBe(
      '2026-03-12T18:30:00.000Z',
    );
  });
});

describe('bookingWindow (BR-34)', () => {
  it('at 23:59 Colombo on 10 Mar → 11 Mar … 9 May', () => {
    expect(bookingWindow(at('2026-03-10T18:29:00.000Z'))).toEqual({ min: '2026-03-11', max: '2026-05-09' });
  });
  it('at 00:00 Colombo on 11 Mar → 12 Mar … 10 May', () => {
    expect(bookingWindow(at('2026-03-10T18:30:00.000Z'))).toEqual({ min: '2026-03-12', max: '2026-05-10' });
  });
});

describe('cancelDeadline (BR-30)', () => {
  it('is 00:00 Colombo on the preferred date across a month boundary', () => {
    expect(cancelDeadline('2026-04-01').toISOString()).toBe('2026-03-31T18:30:00.000Z');
  });
});

describe('canComplete (BR-32)', () => {
  it('false at 23:59 Colombo the day before, true at 00:00 on the day and later', () => {
    expect(canComplete('2026-03-15', at('2026-03-14T18:29:00.000Z'))).toBe(false);
    expect(canComplete('2026-03-15', at('2026-03-14T18:30:00.000Z'))).toBe(true);
    expect(canComplete('2026-03-15', at('2026-04-14T06:00:00.000Z'))).toBe(true);
  });
});

describe('checkCreateRequest (S12 order)', () => {
  const now = new Date('2026-11-22T04:30:00.000Z');
  const base: CreateRequestContext = {
    now,
    customer: { id: 'u-c', emailConfirmed: true, hasMobile: true },
    provider: { userId: 'u-p', listed: true, paused: false, serviceIds: ['s1'], townIds: ['colombo'] },
    openTotal: 0,
    openWithProviderRef: null,
    body: {
      providerId: 'p1',
      serviceId: 's1',
      preferredDate: '2026-11-25',
      slot: 'morning',
      townId: 'colombo',
      addressLine1: '12 Galle Road',
      addressLine2: undefined,
      description: 'Two sockets in the kitchen stopped working.',
    },
  };
  const all = (o: Partial<CreateRequestContext>): CreateRequestContext => ({ ...base, ...o });
  it('ok', () => {
    expect(checkCreateRequest(base)).toEqual({ ok: true });
  });
  it.each([
    [
      'own_listing beats paused',
      all({ customer: { ...base.customer, id: 'u-p' }, provider: { ...base.provider, paused: true } }),
      'own_listing',
    ],
    [
      'provider_unavailable beats paused',
      all({ provider: { ...base.provider, listed: false, paused: true } }),
      'provider_unavailable',
    ],
    [
      'provider_paused beats unconfirmed',
      all({
        provider: { ...base.provider, paused: true },
        customer: { ...base.customer, emailConfirmed: false },
      }),
      'provider_paused',
    ],
    [
      'email_unconfirmed beats open',
      all({ customer: { ...base.customer, emailConfirmed: false }, openWithProviderRef: 'FX-2061' }),
      'email_unconfirmed',
    ],
    ['open_limit_reached', all({ openTotal: 5 }), 'open_limit_reached'],
    ['mobile_missing', all({ customer: { ...base.customer, hasMobile: false } }), 'mobile_missing'],
    ['service_not_offered', all({ body: { ...base.body, serviceId: 's9' } }), 'service_not_offered'],
    ['town_not_served', all({ body: { ...base.body, townId: 'galle' } }), 'town_not_served'],
    ['date today', all({ body: { ...base.body, preferredDate: '2026-11-22' } }), 'date_out_of_window'],
    ['date +61', all({ body: { ...base.body, preferredDate: '2027-01-22' } }), 'date_out_of_window'],
  ] as const)('%s', (_name, ctx, rule) => {
    expect(checkCreateRequest(ctx)).toEqual({ ok: false, rule });
  });
  it('open_with_provider carries the ref and beats the total limit', () => {
    expect(checkCreateRequest(all({ openWithProviderRef: 'FX-2061', openTotal: 5 }))).toEqual({
      ok: false,
      rule: 'open_with_provider',
      ref: 'FX-2061',
    });
  });
  it('a mobile in the body satisfies BR-23', () => {
    expect(
      checkCreateRequest(
        all({
          customer: { ...base.customer, hasMobile: false },
          body: { ...base.body, mobile: '+94771234567' },
        }),
      ),
    ).toEqual({ ok: true });
  });
});
