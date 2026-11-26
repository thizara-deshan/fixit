import { RequestListQuery, type RequestStatusGroup } from '@fixit/contracts';

export const parseListSearch = (sp: URLSearchParams): RequestListQuery =>
  RequestListQuery.parse(Object.fromEntries(sp));

/** Defaults are left out of the URL: `/requests`, `/requests?status=open`, `/requests?status=open&page=2`. */
export function listHref(status: RequestStatusGroup, page = 1): string {
  const sp = new URLSearchParams();
  if (status !== 'all') sp.set('status', status);
  if (page > 1) sp.set('page', String(page));
  const s = sp.toString();
  return s ? `/requests?${s}` : '/requests';
}
