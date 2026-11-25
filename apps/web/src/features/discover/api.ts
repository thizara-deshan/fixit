import { ENDPOINTS as E, type DiscoverQuery, type DiscoverResult } from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';
import { writeDiscover } from './url-state';

export const fetchDiscover = (q: DiscoverQuery): Promise<DiscoverResult> => {
  const qs = writeDiscover(q).toString();
  return http(`${pathOf(E.providers_search)}${qs ? `?${qs}` : ''}`, {
    schema: E.providers_search.response,
  });
};
