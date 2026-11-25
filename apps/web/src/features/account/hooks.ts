import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChangePasswordBody, UpdateMeBody } from '@fixit/contracts';
import { authStore } from '@/lib/auth-store';
import { qk } from '@/lib/query-keys';
import { changePassword, updateMe } from './api';

/** A9: the returned Me replaces the store's, so the nav avatar updates at once. */
export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeBody) => updateMe(body),
    onSuccess: (me) => {
      authStore.setMe(me);
      qc.setQueryData(qk.me, me);
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: (body: ChangePasswordBody) => changePassword(body) });
}
