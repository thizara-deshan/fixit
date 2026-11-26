import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ProviderRequestListQuery } from '@fixit/contracts';
import { qk } from '@/lib/query-keys';
import { fetchDashboard, fetchInbox, fetchInboxRequest } from './api';

/** SPEC §6.11: provider screens refetch on focus and every 60 s. */
const LIVE = { refetchInterval: 60_000, refetchOnWindowFocus: true } as const;

export const useDashboard = () => useQuery({ queryKey: qk.dashboard, queryFn: fetchDashboard, ...LIVE });

export const useInbox = (q: ProviderRequestListQuery) =>
  useQuery({
    queryKey: qk.inbox.list(q),
    queryFn: () => fetchInbox(q),
    placeholderData: keepPreviousData,
    ...LIVE,
  });

export const useInboxRequest = (ref: string) =>
  useQuery({ queryKey: qk.inbox.detail(ref), queryFn: () => fetchInboxRequest(ref), retry: false, ...LIVE });
