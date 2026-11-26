import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CancelBody, CreateRequestBody, CreateReviewBody, RequestListQuery } from '@fixit/contracts';
import { refreshMe } from '@/features/auth/hooks';
import { fetchEligibility } from '@/features/provider-profile/api';
import { qk } from '@/lib/query-keys';
import { cancelMyRequest, createRequest, fetchMyRequest, fetchMyRequests, postReview } from './api';

export const useEligibility = (providerId: string) =>
  useQuery({
    queryKey: qk.eligibility(providerId),
    queryFn: () => fetchEligibility(providerId),
    retry: false,
  });

export const useMyRequest = (ref: string) =>
  useQuery({ queryKey: qk.myRequests.detail(ref), queryFn: () => fetchMyRequest(ref), retry: false });

/** A11. Afterwards: S13 has the view cached, eligibility and lists refetch, `me` refreshes (mobile, openRequestCount). */
export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRequestBody) => createRequest(body),
    onSuccess: (view, body) => {
      qc.setQueryData(qk.myRequests.detail(view.ref), view);
      void qc.invalidateQueries({ queryKey: qk.eligibility(body.providerId) });
      refreshMe(qc);
    },
  });
}

export const useMyRequests = (q: RequestListQuery) =>
  useQuery({
    queryKey: qk.myRequests.list(q),
    queryFn: () => fetchMyRequests(q),
    placeholderData: keepPreviousData,
  });

/** A12. The view returned by the server replaces the cached detail (contact hidden, history updated). */
export function useCancelRequest(ref: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CancelBody) => cancelMyRequest(ref, body),
    onSuccess: (view) => {
      qc.setQueryData(qk.myRequests.detail(ref), view);
      void qc.invalidateQueries({ queryKey: [...qk.myRequests.all, 'list'] });
      void qc.invalidateQueries({ queryKey: qk.eligibility(view.provider.id) });
      refreshMe(qc); // openRequestCount
    },
  });
}

/** A19. Detail + lists refetch (review block, Leave a review button); catalog refetches (rating/count). */
export function usePostReview(ref: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReviewBody) => postReview(ref, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.myRequests.all });
      void qc.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
}
