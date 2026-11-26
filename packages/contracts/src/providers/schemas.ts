import { z } from 'zod';
import { PriceUnit } from '../common/enums';
import { Id, Lkr } from '../common/primitives';

export const Service = z.object({ id: Id, name: z.string(), price: Lkr, unit: PriceUnit });
export type Service = z.infer<typeof Service>;

const count = z.number().int().min(0);
export const DashboardStats = z.object({
  pending: count,
  accepted: count, // D-2: every Accepted request
  completedThisMonth: count, // completedAt in the current Colombo month
  rating: z.number().min(1).max(5).nullable(), // null → "New"
  reviewCount: count,
});
export type DashboardStats = z.infer<typeof DashboardStats>;

export const ProviderDashboard = z.object({
  stats: DashboardStats,
  services: z.array(Service),
  /** F-21 profile completeness. Always null until M24 widens it to ProfileChecklist.nullable() (D-1). */
  checklist: z.null(),
});
export type ProviderDashboard = z.infer<typeof ProviderDashboard>;
