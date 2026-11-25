import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authStore, useAuth } from '@/lib/auth-store';
import { qk } from '@/lib/query-keys';
import { fetchMe, logout } from './api';

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

/** A4: POST /auth/logout → clear cache → `/` (admins → `/admin/login`). D-c: guards render nothing while reason = 'logout'. */
export function useLogout(): () => Promise<void> {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return useCallback(async () => {
    const wasAdmin = authStore.getState().me?.roles.includes('admin') ?? false;
    await logout();
    qc.clear();
    await navigate(wasAdmin ? '/admin/login' : '/', { replace: true });
    authStore.clearSignOutReason();
  }, [navigate, qc]);
}
