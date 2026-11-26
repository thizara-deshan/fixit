import { z } from 'zod';
import { displayNameOf } from '../auth/names';
import type { RequestStatus } from '../common/enums';
import { paginated } from '../common/pagination';
import { isContactRevealed } from './projections';
import { ProviderRequestView } from './schemas';

export const InboxStatus = z.enum([
  'all',
  'pending',
  'accepted',
  'completed',
  'declined',
  'cancelled',
  'expired',
]);
export type InboxStatus = z.infer<typeof InboxStatus>;

/** URL `?status=&q=&page=` and GET /me/provider/requests query. Invalid values fall back to defaults. */
export const ProviderRequestListQuery = z.object({
  status: InboxStatus.catch('all').default('all'),
  q: z.string().trim().max(100).catch('').default(''),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});
export type ProviderRequestListQuery = z.infer<typeof ProviderRequestListQuery>;

const count = z.number().int().min(0);
export const InboxCounts = z.object({
  all: count,
  pending: count,
  accepted: count,
  completed: count,
  declined: count,
  cancelled: count,
  expired: count,
});
export type InboxCounts = z.infer<typeof InboxCounts>;

export const ProviderRequestList = paginated(ProviderRequestView).extend({ counts: InboxCounts });
export type ProviderRequestList = z.infer<typeof ProviderRequestList>;

/** D-3: the search sees only what the provider sees — the ref and the visible name. */
export function matchesInboxSearch(
  q: string,
  row: { ref: string; status: RequestStatus; customerFullName: string },
): boolean {
  const needle = q.trim().toLowerCase();
  if (needle === '') return true;
  const name = isContactRevealed(row.status) ? row.customerFullName : displayNameOf(row.customerFullName);
  return row.ref.toLowerCase().includes(needle) || name.toLowerCase().includes(needle);
}

interface Sortable {
  ref: string;
  createdAt: string; // ISO, same format everywhere → string order = time order
  expiresAt: string;
}
/** S21: Pending tab = most urgent first; every other tab = newest first. Ties by ref. */
export function compareInbox(tab: InboxStatus): (a: Sortable, b: Sortable) => number {
  if (tab === 'pending')
    return (a, b) => a.expiresAt.localeCompare(b.expiresAt) || a.ref.localeCompare(b.ref);
  return (a, b) => b.createdAt.localeCompare(a.createdAt) || b.ref.localeCompare(a.ref);
}
