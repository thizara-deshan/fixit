import { z } from 'zod';
import type { RequestStatus } from '../common/enums';
import { paginated } from '../common/pagination';
import { CustomerRequestView } from './schemas';

export const RequestStatusGroup = z.enum(['all', 'open', 'completed', 'closed']);
export type RequestStatusGroup = z.infer<typeof RequestStatusGroup>;

const GROUPS: Record<Exclude<RequestStatusGroup, 'all'>, readonly RequestStatus[]> = {
  open: ['pending', 'accepted'],
  completed: ['completed'],
  closed: ['declined', 'cancelled', 'expired'],
};

/** SPEC S14.E2. `all` → every status. */
export function statusesOf(group: RequestStatusGroup): readonly RequestStatus[] {
  return group === 'all' ? [...GROUPS.open, ...GROUPS.completed, ...GROUPS.closed] : GROUPS[group];
}

export function groupOf(status: RequestStatus): Exclude<RequestStatusGroup, 'all'> {
  if (GROUPS.open.includes(status)) return 'open';
  if (status === 'completed') return 'completed';
  return 'closed';
}

/** URL `?status=&page=` and GET /me/requests query. Invalid values fall back to defaults. */
export const RequestListQuery = z.object({
  status: RequestStatusGroup.catch('all').default('all'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});
export type RequestListQuery = z.infer<typeof RequestListQuery>;

export const RequestCounts = z.object({
  all: z.number().int().min(0),
  open: z.number().int().min(0),
  completed: z.number().int().min(0),
  closed: z.number().int().min(0),
});
export type RequestCounts = z.infer<typeof RequestCounts>;

export const MyRequestList = paginated(CustomerRequestView).extend({ counts: RequestCounts });
export type MyRequestList = z.infer<typeof MyRequestList>;

export const REASON_MAX_MESSAGE = 'Keep the reason under 500 characters.';

/** §8.3 customer cancel: optional reason ≤ 500. Empty → undefined. */
export const CancelBody = z.object({
  reason: z
    .string()
    .trim()
    .max(500, REASON_MAX_MESSAGE)
    .optional()
    .transform((s) => (s === '' ? undefined : s)),
});
export type CancelBody = z.infer<typeof CancelBody>;
