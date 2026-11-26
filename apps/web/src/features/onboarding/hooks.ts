import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMe } from '@/features/account/api';
import { refreshMe } from '@/features/auth/hooks';
import { authStore } from '@/lib/auth-store';
import { qk } from '@/lib/query-keys';
import { publishListing, saveStep, type StepBody } from './api';

/** A21. D-4: a missing mobile is saved through PATCH /me first, in the same mutation. */
export function useSaveStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StepBody & { mobile?: string | undefined }) => {
      if (input.mobile !== undefined) {
        const me = await updateMe({ mobile: input.mobile });
        authStore.setMe(me);
        qc.setQueryData(qk.me, me);
      }
      return saveStep(input);
    },
    onSuccess: (own) => {
      qc.setQueryData(qk.ownProvider, own);
      refreshMe(qc); // Me.provider (draft step, business name)
    },
  });
}

/** A22. D-5: does not touch the auth store; the done page refreshes Me. */
export function usePublishListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: publishListing,
    onSuccess: (own) => {
      qc.setQueryData(qk.ownProvider, own);
      void qc.invalidateQueries({ queryKey: ['catalog'] }); // Discover / profile now include the listing
    },
  });
}
