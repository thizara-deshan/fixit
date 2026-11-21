import { QueryClient } from '@tanstack/react-query';
import { authStore } from '@/lib/auth-store';
import { ApiError } from '@/lib/http';

export const shouldRetry = (failureCount: number, error: unknown): boolean =>
  failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500);

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

export const queryClient = createQueryClient();

// Cached data belongs to one user: clear it whenever the signed-in user changes (sign-out included).
let lastUserId: string | null = null;
authStore.subscribe(() => {
  const id = authStore.getState().me?.id ?? null;
  if (id !== lastUserId) {
    lastUserId = id;
    queryClient.clear();
  }
});
