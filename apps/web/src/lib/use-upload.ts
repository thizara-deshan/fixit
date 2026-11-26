import { useCallback, useEffect, useRef, useState } from 'react';
import type { UploadKind } from '@fixit/contracts';
import { uploadErrorCopy } from './upload-errors';

export type UploadState =
  { status: 'idle' } | { status: 'uploading'; fileName: string } | { status: 'error'; message: string };

/** One file at a time. `start` resolves with the result, or null when cancelled/failed (state says which). */
export function useUpload<T>(kind: UploadKind, send: (file: File, signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const start = useCallback(
    async (file: File): Promise<T | null> => {
      controller.current?.abort();
      const c = new AbortController();
      controller.current = c;
      setState({ status: 'uploading', fileName: file.name });
      try {
        const result = await send(file, c.signal);
        if (controller.current === c) setState({ status: 'idle' });
        return result;
      } catch (e) {
        const message = uploadErrorCopy(e, kind);
        if (controller.current === c)
          setState(message === null ? { status: 'idle' } : { status: 'error', message });
        return null;
      }
    },
    [kind, send],
  );
  const cancel = useCallback(() => {
    controller.current?.abort();
  }, []);
  const fail = useCallback((message: string) => {
    setState({ status: 'error', message });
  }, []);
  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);
  return { state, start, cancel, fail, reset };
}
