import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type {
  AdminUserListQuery,
  HideReviewBody,
  ModerationQuery,
  ReactivateBody,
  RejectBody,
  SuspendBody,
  VerificationQueueQuery,
} from '@fixit/contracts';
import { qk } from '@/lib/query-keys';
import {
  approveVerification,
  fetchDocumentBlob,
  fetchModeration,
  fetchOverview,
  fetchQueue,
  fetchUser,
  fetchUsers,
  fetchVerification,
  hideReview,
  reactivateUser,
  rejectVerification,
  restoreReview,
  suspendUser,
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

/** Every admin write: the admin domain (lists, badge) and the public catalog (badge, rating, listing) refetch. */
function afterAdminChange(qc: QueryClient, extra: readonly (readonly unknown[])[] = []): void {
  void qc.invalidateQueries({ queryKey: qk.admin.all });
  void qc.invalidateQueries({ queryKey: ['catalog'] });
  for (const key of extra) void qc.invalidateQueries({ queryKey: key });
}

/** A29. */
export function useApproveVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveVerification(id),
    onSuccess: (res) => {
      qc.setQueryData(qk.admin.verification(res.detail.id), res.detail);
      afterAdminChange(qc);
    },
  });
}
/** A30. */
export function useRejectVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RejectBody }) => rejectVerification(id, body),
    onSuccess: (res) => {
      qc.setQueryData(qk.admin.verification(res.detail.id), res.detail);
      afterAdminChange(qc);
    },
  });
}
/** A31 — the cascade changes requests too. */
export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SuspendBody }) => suspendUser(id, body),
    onSuccess: (v) => {
      qc.setQueryData(qk.admin.user(v.id), v);
      afterAdminChange(qc, [['requests']]);
    },
  });
}
/** A32. */
export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReactivateBody }) => reactivateUser(id, body),
    onSuccess: (v) => {
      qc.setQueryData(qk.admin.user(v.id), v);
      afterAdminChange(qc);
    },
  });
}
/** A33 hide. */
export function useHideReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: HideReviewBody }) => hideReview(id, body),
    onSuccess: () => {
      afterAdminChange(qc);
    },
  });
}
/** A33 restore. */
export function useRestoreReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreReview(id),
    onSuccess: () => {
      afterAdminChange(qc);
    },
  });
}
