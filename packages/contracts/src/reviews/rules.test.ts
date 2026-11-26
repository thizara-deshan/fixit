import { describe, expect, it } from 'vitest';
import { ratingFrom, reviewDeadline, reviewEligibility } from './rules';

describe('ratingFrom', () => {
  it('no ratings → New', () => {
    expect(ratingFrom([])).toEqual({ rating: null, count: 0 });
  });
  it.each([
    [[5, 4, 4], 4.3],
    [[5, 5, 4], 4.7],
    [[5, 4, 4, 4], 4.3], // 4.25 rounds up
    [[3], 3],
  ])('%j → %d', (ratings, rating) => {
    expect(ratingFrom(ratings)).toEqual({ rating, count: ratings.length });
  });
});

describe('reviewDeadline', () => {
  it('is 30 days after completion', () => {
    expect(reviewDeadline(new Date('2026-11-21T10:00:00.000Z')).toISOString()).toBe(
      '2026-12-21T10:00:00.000Z',
    );
  });
});

describe('reviewEligibility (BR-24/25)', () => {
  const now = new Date('2026-11-22T04:30:00.000Z');
  const completed = {
    status: 'completed' as const,
    customerId: 'u-olivia',
    completedAt: '2026-11-20T04:30:00.000Z',
  };
  it('own completed request inside 30 days → ok with deadline', () => {
    expect(reviewEligibility(completed, null, 'u-olivia', now)).toEqual({
      ok: true,
      deadline: new Date('2026-12-20T04:30:00.000Z'),
    });
  });
  it('not completed', () => {
    expect(
      reviewEligibility({ ...completed, status: 'accepted', completedAt: null }, null, 'u-olivia', now),
    ).toEqual({ ok: false, rule: 'review_not_eligible' });
  });
  it('more than 30 days', () => {
    const old = { ...completed, completedAt: '2026-10-22T04:29:59.000Z' };
    expect(reviewEligibility(old, null, 'u-olivia', now)).toEqual({
      ok: false,
      rule: 'review_window_closed',
    });
  });
  it('exactly at the deadline is closed', () => {
    const edge = { ...completed, completedAt: '2026-10-23T04:30:00.000Z' };
    expect(reviewEligibility(edge, null, 'u-olivia', now)).toEqual({
      ok: false,
      rule: 'review_window_closed',
    });
  });
  it('already reviewed', () => {
    expect(reviewEligibility(completed, { id: 'v1' }, 'u-olivia', now)).toEqual({
      ok: false,
      rule: 'already_reviewed',
    });
  });
  it('other customer', () => {
    expect(reviewEligibility(completed, null, 'u-marcus', now)).toEqual({
      ok: false,
      rule: 'review_not_eligible',
    });
  });
});
