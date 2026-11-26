import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type {
  AcceptBody,
  AgreedPriceBody,
  CompleteBody,
  DeclineBody,
  ProviderRequestListQuery,
  ProviderRequestView,
} from '@fixit/contracts';
import { refreshMe } from '@/features/auth/hooks';
import { qk } from '@/lib/query-keys';
import {
  acceptRequest,
  completeRequest,
  declineRequest,
  fetchDashboard,
  fetchInbox,
  fetchInboxRequest,
  setAgreedPrice,
} from './api';

/** SPEC §6.11: provider screens refetch on focus and every 60 s. */
const LIVE = { refetchInterval: 60_000, refetchOnWindowFocus: true } as const;

export const useDashboard = () => useQuery({ queryKey: qk.dashboard, queryFn: fetchDashboard, ...LIVE });

export const useInbox = (q: ProviderRequestListQuery) =>
  useQuery({
    queryKey: qk.inbox.list(q),
    queryFn: () => fetchInbox(q),
    placeholderData: keepPreviousData,
    ...LIVE,
  });

export const useInboxRequest = (ref: string) =>
  useQuery({ queryKey: qk.inbox.detail(ref), queryFn: () => fetchInboxRequest(ref), retry: false, ...LIVE });

/** After any provider action: the detail takes the server view; lists and tiles refetch; the badge (me) optionally. */
function afterChange(qc: QueryClient, view: ProviderRequestView, me: boolean): void {
  qc.setQueryData(qk.inbox.detail(view.ref), view);
  void qc.invalidateQueries({ queryKey: [...qk.inbox.all, 'list'] });
  void qc.invalidateQueries({ queryKey: qk.dashboard });
  if (me) refreshMe(qc); // pendingRequestCount → sidebar + top-bar badge
}

type Vars<B> = { ref: string; body: B };

/** A13 — not optimistic (SPEC §6.5). */
export function useAcceptRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, body }: Vars<AcceptBody>) => acceptRequest(ref, body),
    onSuccess: (view) => {
      afterChange(qc, view, true);
    },
  });
}

/** A14 — not optimistic, no Undo. */
export function useDeclineRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, body }: Vars<DeclineBody>) => declineRequest(ref, body),
    onSuccess: (view) => {
      afterChange(qc, view, true);
    },
  });
}

/** A16. */
export function useCompleteRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, body }: Vars<CompleteBody>) => completeRequest(ref, body),
    onSuccess: (view) => {
      afterChange(qc, view, false);
    },
  });
}

/** A15. */
export function useSetAgreedPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, body }: Vars<AgreedPriceBody>) => setAgreedPrice(ref, body),
    onSuccess: (view) => {
      afterChange(qc, view, false);
    },
  });
}
