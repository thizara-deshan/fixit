import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateRequestBody } from '@fixit/contracts';
import { fetchMe } from '@/features/auth/api';
import { fetchEligibility } from '@/features/provider-profile/api';
import { authStore } from '@/lib/auth-store';
import { qk } from '@/lib/query-keys';
import { createRequest, fetchMyRequest } from './api';

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
      void fetchMe()
        .then((me) => {
          authStore.setMe(me);
          qc.setQueryData(qk.me, me);
        })
        .catch(() => undefined); // the session layer handles auth failures
    },
  });
}
