import { describe, expect, it } from 'vitest';
import {
  formatDateLong,
  formatDeadline,
  formatDateShort,
  formatDateTime,
  formatLkr,
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
