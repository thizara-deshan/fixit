import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient, createWrapper } from '@/test/render';

const toasts = vi.hoisted(() => ({ notify: vi.fn(), notifyError: vi.fn() }));
vi.mock('./toast', () => toasts);

import { useOptimisticMutation } from './optimistic';

function deferred() {
  let resolve!: (v?: undefined) => void; // assigned synchronously by the Promise executor below
  let reject!: (e: Error) => void; // same
  const promise = new Promise<undefined>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useOptimisticMutation', () => {
  beforeEach(() => {
    toasts.notify.mockClear();
    toasts.notifyError.mockClear();
  });

  it('applies at once, reverts on failure and offers Try again', async () => {
    const client = createTestQueryClient();
    client.setQueryData(['saved'], ['p01']);
    let call = deferred();
    const mutationFn = vi.fn(() => call.promise);
    const { result } = renderHook(
      () =>
        useOptimisticMutation<string, undefined, string[]>({
          queryKey: ['saved'],
          mutationFn,
          apply: (c, id) => [...(c ?? []), id],
          errorToast: "Couldn't save. Try again.",
        }),
      { wrapper: createWrapper(client) },
    );
    act(() => {
      result.current.mutate('p02');
    });
    await waitFor(() => {
      expect(client.getQueryData(['saved'])).toEqual(['p01', 'p02']);
    });
    call.reject(new Error('boom'));
    await waitFor(() => {
      expect(toasts.notifyError).toHaveBeenCalledOnce();
    });
    expect(client.getQueryData(['saved'])).toEqual(['p01']);
    const [message, retry] = toasts.notifyError.mock.lastCall as [string, () => void];
    expect(message).toBe("Couldn't save. Try again.");
    call = deferred();
    act(() => {
      retry();
    });
    await waitFor(() => {
      expect(mutationFn).toHaveBeenCalledTimes(2);
    });
  });

  it('shows the success toast with Undo only when the caller provides one', async () => {
    const client = createTestQueryClient();
    client.setQueryData(['saved'], ['p01']);
    const undo = vi.fn();
    const { result } = renderHook(
      () =>
        useOptimisticMutation<string, undefined, string[]>({
          queryKey: ['saved'],
          mutationFn: () => Promise.resolve(undefined),
          apply: (c, id) => (c ?? []).filter((x) => x !== id),
          errorToast: "Couldn't remove. Try again.",
          successToast: () => ({ message: 'Removed Bell & Sons Plumbing from saved.', undo }),
        }),
      { wrapper: createWrapper(client) },
    );
    act(() => {
      result.current.mutate('p01');
    });
    await waitFor(() => {
      expect(toasts.notify).toHaveBeenCalledOnce();
    });
    const [message, action] = toasts.notify.mock.lastCall as [string, { label: string; onClick: () => void }];
    expect(message).toBe('Removed Bell & Sons Plumbing from saved.');
    expect(action.label).toBe('Undo');
    action.onClick();
    expect(undo).toHaveBeenCalledOnce();
    expect(client.getQueryData(['saved'])).toEqual([]);
  });
});
