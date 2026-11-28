import {
  AdminUserListQuery,
  ModerationQuery,
  VerificationQueueQuery,
  type AdminUserRoleFilter,
  type AdminUserStatusFilter,
  type ModerationVisibilityFilter,
  type SubmissionStatus,
} from '@fixit/contracts';

const href = (base: string, sp: URLSearchParams) =>
  sp.toString() !== '' ? `${base}?${sp.toString()}` : base;
const fromSp = (sp: URLSearchParams) => Object.fromEntries(sp);

export const parseQueueSearch = (sp: URLSearchParams) => VerificationQueueQuery.parse(fromSp(sp));
export function queueHref({
  status = 'pending_review',
  page = 1,
}: {
  status?: SubmissionStatus;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (status !== 'pending_review') sp.set('status', status);
  if (page > 1) sp.set('page', String(page));
  return href('/admin/verifications', sp);
}

export const parseUsersSearch = (sp: URLSearchParams) => AdminUserListQuery.parse(fromSp(sp));
export function usersHref({
  q = '',
  role = 'all',
  status = 'all',
  page = 1,
}: {
  q?: string;
  role?: AdminUserRoleFilter;
  status?: AdminUserStatusFilter;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (q.trim() !== '') sp.set('q', q.trim());
  if (role !== 'all') sp.set('role', role);
  if (status !== 'all') sp.set('status', status);
  if (page > 1) sp.set('page', String(page));
  return href('/admin/users', sp);
}

export type UsersTab = 'all' | 'customers' | 'providers' | 'suspended';
export const USERS_TABS: readonly { tab: UsersTab; label: string }[] = [
  { tab: 'all', label: 'All' },
  { tab: 'customers', label: 'Customers' },
  { tab: 'providers', label: 'Providers' },
  { tab: 'suspended', label: 'Suspended' },
];
export function usersTabOf(q: AdminUserListQuery): UsersTab {
  if (q.status === 'suspended') return 'suspended';
  if (q.role === 'customer') return 'customers';
  if (q.role === 'provider') return 'providers';
  return 'all';
}
/** Switching tab keeps the search and resets the page. */
export function usersTabHref(tab: UsersTab, q: string): string {
  if (tab === 'customers') return usersHref({ q, role: 'customer' });
  if (tab === 'providers') return usersHref({ q, role: 'provider' });
  if (tab === 'suspended') return usersHref({ q, status: 'suspended' });
  return usersHref({ q });
}

export const parseReviewsSearch = (sp: URLSearchParams) => ModerationQuery.parse(fromSp(sp));
export function reviewsHref({
  q = '',
  visibility = 'all',
  page = 1,
}: {
  q?: string;
  visibility?: ModerationVisibilityFilter;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (q.trim() !== '') sp.set('q', q.trim());
  if (visibility !== 'all') sp.set('visibility', visibility);
  if (page > 1) sp.set('page', String(page));
  return href('/admin/reviews', sp);
}
