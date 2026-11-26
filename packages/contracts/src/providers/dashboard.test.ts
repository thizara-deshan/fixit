import { describe, expect, it } from 'vitest';
import { dashboardStats } from './dashboard';

const now = new Date('2026-11-22T04:30:00.000Z'); // Sun 22 Nov 10:00 Colombo
describe('dashboardStats', () => {
  it('counts by status; completed this month uses the Colombo month', () => {
    const s = dashboardStats(
      [
        { status: 'pending', completedAt: null },
        { status: 'pending', completedAt: null },
        { status: 'accepted', completedAt: null },
        { status: 'completed', completedAt: '2026-10-31T18:30:00.000Z' }, // 1 Nov 00:00 Colombo → Nov
        { status: 'completed', completedAt: '2026-10-31T18:29:00.000Z' }, // 31 Oct 23:59 Colombo → Oct
        { status: 'declined', completedAt: null },
      ],
      { rating: 4.9, count: 212 },
      now,
    );
    expect(s).toEqual({ pending: 2, accepted: 1, completedThisMonth: 1, rating: 4.9, reviewCount: 212 });
  });
  it('no reviews → rating null', () => {
    expect(dashboardStats([], { rating: null, count: 0 }, now).rating).toBeNull();
  });
});
