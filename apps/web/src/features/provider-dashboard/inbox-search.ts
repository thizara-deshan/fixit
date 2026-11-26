import { ProviderRequestListQuery, type InboxStatus } from '@fixit/contracts';

export const parseInboxSearch = (sp: URLSearchParams): ProviderRequestListQuery =>
  ProviderRequestListQuery.parse(Object.fromEntries(sp));

/** Defaults are left out: `/dashboard/requests`, `…?status=pending&q=olivia&page=2`. */
export function inboxHref({
  status = 'all',
  q = '',
  page = 1,
}: {
  status?: InboxStatus;
  q?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (status !== 'all') sp.set('status', status);
  if (q.trim() !== '') sp.set('q', q.trim());
  if (page > 1) sp.set('page', String(page));
  const s = sp.toString();
  return s ? `/dashboard/requests?${s}` : '/dashboard/requests';
}
