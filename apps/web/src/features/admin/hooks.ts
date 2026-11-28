import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AdminUserListQuery, ModerationQuery, VerificationQueueQuery } from '@fixit/contracts';
import { qk } from '@/lib/query-keys';
import {
  fetchDocumentBlob,
  fetchModeration,
  fetchOverview,
  fetchQueue,
  fetchUser,
  fetchUsers,
  fetchVerification,
} from './api';

/** SPEC §6.11: the admin queue and the nav badge refetch on focus and every 60 s. */
const LIVE = { refetchInterval: 60_000, refetchOnWindowFocus: true } as const;

export const useAdminOverview = () =>
  useQuery({ queryKey: qk.admin.overview, queryFn: fetchOverview, ...LIVE });
export const useVerificationQueue = (q: VerificationQueueQuery) =>
  useQuery({
    queryKey: qk.admin.queue(q),
    queryFn: () => fetchQueue(q),
    placeholderData: keepPreviousData,
    ...LIVE,
  });
export const useVerification = (id: string) =>
  useQuery({ queryKey: qk.admin.verification(id), queryFn: () => fetchVerification(id), retry: false });
export const useDocumentBlob = (id: string | null) =>
  useQuery({
    queryKey: qk.admin.document(id ?? ''),
    queryFn: ({ signal }) => fetchDocumentBlob(id ?? '', signal),
    enabled: id !== null,
    staleTime: Infinity,
  });
export const useAdminUsers = (q: AdminUserListQuery) =>
  useQuery({ queryKey: qk.admin.users(q), queryFn: () => fetchUsers(q), placeholderData: keepPreviousData });
export const useAdminUser = (id: string) =>
  useQuery({ queryKey: qk.admin.user(id), queryFn: () => fetchUser(id), retry: false });
export const useModeration = (q: ModerationQuery) =>
  useQuery({
    queryKey: qk.admin.reviews(q),
    queryFn: () => fetchModeration(q),
    placeholderData: keepPreviousData,
  });
