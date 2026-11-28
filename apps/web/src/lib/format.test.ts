import { describe, expect, it } from 'vitest';
import {
  formatCancelCutoffDay,
  formatCount,
  formatDateLong,
  formatDeadline,
  formatFileSize,
  formatDateShort,
  formatDateTime,
  formatDayMonth,
  formatDaysAgo,
  formatLkr,
  formatMonthName,
  formatReplyBy,
  formatPhone,
  formatReviewDate,
  formatRating,
  formatServicePrice,
  initialsOf,
  priceParts,
  ratingAriaLabel,
} from './format';

describe('format (SPEC §1.3)', () => {
  it('money', () => {
    expect(formatLkr(2500)).toBe('LKR 2,500');
    expect(formatLkr(1000000)).toBe('LKR 1,000,000');
    expect(formatLkr(0)).toBe('LKR 0');
  });
  it('service price (BR-09) and short price', () => {
    expect(formatServicePrice(2500, 'per_hour')).toBe('from LKR 2,500 / hour');
    expect(formatServicePrice(1500, 'per_visit')).toBe('from LKR 1,500 / visit');
    expect(formatServicePrice(4500, 'fixed')).toBe('LKR 4,500 fixed');
    expect(priceParts(2500, 'per_hour')).toEqual({ lead: 'From', amount: 'LKR 2,500', suffix: ' / hour' });
    expect(priceParts(4500, 'fixed')).toEqual({ lead: null, amount: 'LKR 4,500', suffix: ' fixed' });
  });
  it('dates in Asia/Colombo', () => {
    expect(formatDateLong('2026-11-21')).toBe('Sat, 21 Nov 2026');
    expect(formatDateShort('2026-11-21')).toBe('Sat, 21 Nov');
    expect(formatDateTime('2026-11-21T10:12:00.000Z')).toBe('21 Nov 2026, 3:42 PM');
    expect(formatDateLong('2026-11-21T20:00:00.000Z')).toBe('Sun, 22 Nov 2026');
    expect(formatDateLong(new Date('2026-11-21T20:00:00.000Z'))).toBe('Sun, 22 Nov 2026');
  });
  it('phone', () => {
    expect(formatPhone('+94771234567')).toBe('+94 77 123 4567');
    expect(formatPhone('0771234567')).toBe('0771234567');
  });
  it('rating', () => {
    expect(formatRating(4.9, 212)).toBe('4.9');
    expect(formatRating(5, 3)).toBe('5.0');
    expect(formatRating(null, 0)).toBe('New');
    expect(ratingAriaLabel(4.9, 212)).toBe('Rated 4.9 out of 5, 212 reviews');
    expect(ratingAriaLabel(4, 1)).toBe('Rated 4.0 out of 5, 1 review');
    expect(ratingAriaLabel(null, 0)).toBe('New, no reviews yet');
  });
  it('initials', () => {
    expect(initialsOf('Olivia Martinez')).toBe('OM');
    expect(initialsOf('  Marcus  van Bell ')).toBe('MB');
    expect(initialsOf('Admin')).toBe('A');
  });
});

describe('priceParts lead', () => {
  it('From for per_hour, null for fixed', () => {
    expect(priceParts(2500, 'per_hour')).toEqual({ lead: 'From', amount: 'LKR 2,500', suffix: ' / hour' });
    expect(priceParts(15000, 'fixed')).toEqual({ lead: null, amount: 'LKR 15,000', suffix: ' fixed' });
  });
});

describe('formatReviewDate', () => {
  it('formats in Colombo time', () => {
    expect(formatReviewDate('2026-09-11T20:00:00Z')).toBe('12 Sep 2026');
  });
});

describe('formatDeadline', () => {
  it('formats in Colombo', () => {
    expect(formatDeadline('2026-11-21T10:12:00.000Z')).toBe('Sat, 21 Nov, 3:42 PM');
    expect(formatDeadline('2026-11-22T18:30:00.000Z')).toBe('Mon, 23 Nov, 12:00 AM');
  });
});

describe('formatCancelCutoffDay', () => {
  it('is the day before the preferred date', () => {
    expect(formatCancelCutoffDay('2026-11-22')).toBe('Sat, 21 Nov');
  });
});
describe('formatCount', () => {
  it('groups thousands', () => {
    expect(formatCount(1000)).toBe('1,000');
  });
});

describe('M10 formats', () => {
  it('formatReplyBy', () => {
    expect(formatReplyBy('2026-11-23T22:30:00.000Z')).toBe('Tue 4:00 AM');
  });
  it('formatMonthName uses Colombo', () => {
    expect(formatMonthName('2026-10-31T18:30:00.000Z')).toBe('November');
  });
});

describe('formatFileSize', () => {
  it('KB below 1 MB, MB above', () => {
    expect(formatFileSize(482_113)).toBe('471 KB');
    expect(formatFileSize(10)).toBe('1 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('admin day formatters', () => {
  const now = new Date('2026-11-24T06:00:00Z');
  it('formatDayMonth', () => {
    expect(formatDayMonth('2026-11-21T04:00:00Z')).toBe('21 Nov');
  });
  it('formatDaysAgo', () => {
    expect(formatDaysAgo('2026-11-24T01:00:00Z', now)).toBe('today');
    expect(formatDaysAgo('2026-11-23T10:00:00Z', now)).toBe('yesterday');
    expect(formatDaysAgo('2026-11-21T04:00:00Z', now)).toBe('3 days ago');
  });
});
