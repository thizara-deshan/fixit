import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { ProviderPublicProfile } from '@fixit/contracts';
import { useAuth } from '@/lib/auth-store';
import { qk } from '@/lib/query-keys';
import { fetchEligibility, fetchProvider, fetchProviderReviews } from './api';
import { toRequestAction, type RequestAction } from './request-action';

export const useProviderProfile = (id: string) =>
  useQuery({ queryKey: qk.provider(id), queryFn: () => fetchProvider(id), retry: false });

/** Decision 003: page 1 = 5, then 10 per page until loaded = total. */
export const useProviderReviews = (id: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: qk.providerReviews(id),
    queryFn: ({ pageParam }) => fetchProviderReviews(id, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled,
  });

/** S3.E7. guest/admin are client-side (D-2); everything else is the server's Eligibility. */
export function useRequestAction(
  p: Pick<ProviderPublicProfile, 'id' | 'businessName' | 'paused'> | undefined,
): RequestAction {
  const { status, me } = useAuth();
  const isAdmin = me?.roles.includes('admin') ?? false;
  const ask = status === 'signed-in' && !isAdmin && p !== undefined;
  const q = useQuery({
    queryKey: qk.eligibility(p?.id ?? ''),
    queryFn: () => fetchEligibility(p?.id ?? ''),
    enabled: ask,
    retry: false,
  });
  if (!p || status === 'booting') return { kind: 'loading' };
  if (status === 'guest') return toRequestAction({ state: 'guest' }, p);
  if (isAdmin) return toRequestAction({ state: 'admin' }, p);
  if (q.isPending && q.fetchStatus !== 'idle') return { kind: 'loading' };
  if (q.data) return toRequestAction(q.data, p);
  return toRequestAction({ state: 'ok' }, p); // D-4: load failure → Otherwise; S12 re-checks
}
