import { describe, expect, it } from 'vitest';
import { bookingWindow, canComplete, cancelDeadline, expiresAt } from './rules';

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
