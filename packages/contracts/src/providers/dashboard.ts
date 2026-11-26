import { formatInColombo } from '../common/dates';
import type { RequestRecord } from '../requests/record';
import type { DashboardStats } from './schemas';

const month = (instant: Date): string => formatInColombo(instant, 'yyyy-MM');

/** S20.E6 counts from the provider's own request rows (mock now, API in M17). */
export function dashboardStats(
  records: readonly Pick<RequestRecord, 'status' | 'completedAt'>[],
  rating: { rating: number | null; count: number },
  now: Date,
): DashboardStats {
  const thisMonth = month(now);
  return {
    pending: records.filter((r) => r.status === 'pending').length,
    accepted: records.filter((r) => r.status === 'accepted').length,
    completedThisMonth: records.filter(
      (r) =>
        r.status === 'completed' && r.completedAt !== null && month(new Date(r.completedAt)) === thisMonth,
    ).length,
    rating: rating.count > 0 ? rating.rating : null,
    reviewCount: rating.count,
  };
}
