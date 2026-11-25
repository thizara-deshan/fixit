import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { notify, notifyError } from './toast';

export interface OptimisticOptions<TVars, TData, TCache> {
  queryKey: QueryKey;
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Returns the cache as it should look right away. */
  apply: (cache: TCache | undefined, vars: TVars) => TCache | undefined;
  /** SPEC §6.3 copy, e.g. "Couldn't save. Try again." */
  errorToast: string;
  successToast?: (vars: TVars) => { message: string; undo?: () => void } | undefined;
  invalidate?: QueryKey[];
}

/** ARCH §5.5: apply → server → revert + error toast (Try again) on failure → invalidate. */
export function useOptimisticMutation<TVars, TData, TCache>(o: OptimisticOptions<TVars, TData, TCache>) {
  const qc = useQueryClient();
  const m = useMutation<TData, Error, TVars, { prev: TCache | undefined }>({
    mutationFn: o.mutationFn,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: o.queryKey });
      const prev = qc.getQueryData<TCache>(o.queryKey);
      qc.setQueryData<TCache>(o.queryKey, (c) => o.apply(c, vars));
      return { prev };
    },
    onError: (_e, vars, ctx) => {
      qc.setQueryData(o.queryKey, ctx?.prev);
      notifyError(o.errorToast, () => {
        m.mutate(vars);
      });
    },
    onSuccess: (_d, vars) => {
      const t = o.successToast?.(vars);
      if (t) notify(t.message, t.undo ? { label: 'Undo', onClick: t.undo } : undefined);
    },
    onSettled: async () => {
      await Promise.all(
        [o.queryKey, ...(o.invalidate ?? [])].map((k) => qc.invalidateQueries({ queryKey: k })),
      );
    },
  });
  return m;
}
