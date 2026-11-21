import { useQuery } from '@tanstack/react-query';
import { authStore, useAuth } from '@/lib/auth-store';
import { qk } from '@/lib/query-keys';
import { fetchMe } from './api';

/** GET /auth/me while signed in; keeps authStore.me fresh. */
export function useMe() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      const me = await fetchMe();
      authStore.setMe(me);
      return me;
    },
    enabled: status === 'signed-in',
  });
}
