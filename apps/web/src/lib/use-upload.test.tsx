import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ApiError } from './http';
import { useUpload } from './use-upload';

const file = new File(['x'], 'a.png', { type: 'image/png' });

describe('useUpload', () => {
  it('uploading → idle with the result', async () => {
    const { result } = renderHook(() => useUpload('document', () => Promise.resolve(42)));
    let out: number | null = null;
    await act(async () => {
      out = await result.current.start(file);
    });
    expect(out).toBe(42);
    expect(result.current.state).toEqual({ status: 'idle' });
  });
  it('failure → error copy; cancel → idle without message', async () => {
    const failing = renderHook(() =>
      useUpload('document', () => Promise.reject(new ApiError(500, 'INTERNAL', 'x'))),
    );
    await act(async () => {
      await failing.result.current.start(file);
    });
    expect(failing.result.current.state).toEqual({
      status: 'error',
      message: 'Upload failed. Check your connection and try again.',
    });
    const hanging = renderHook(() =>
      useUpload(
        'document',
        (_f, signal) =>
          new Promise<never>((_, reject) => {
            signal.addEventListener('abort', () => {
              reject(new DOMException('a', 'AbortError'));
            });
          }),
      ),
    );
    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = hanging.result.current.start(file);
    });
    expect(hanging.result.current.state).toEqual({ status: 'uploading', fileName: 'a.png' });
    await act(async () => {
      hanging.result.current.cancel();
      await pending;
    });
    expect(hanging.result.current.state).toEqual({ status: 'idle' });
  });
});
