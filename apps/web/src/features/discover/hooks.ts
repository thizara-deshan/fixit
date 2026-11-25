import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DiscoverQuery } from '@fixit/contracts';
import { qk } from '@/lib/query-keys';
import { fetchDiscover } from './api';

/** Results for the URL state. Keeps the previous result while a new one loads (D-5). */
export const useDiscover = (q: DiscoverQuery) =>
  useQuery({
    queryKey: qk.discover(q),
    queryFn: () => fetchDiscover(q),
    placeholderData: keepPreviousData,
  });
