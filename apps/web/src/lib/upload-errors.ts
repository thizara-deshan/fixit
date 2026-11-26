import { UPLOAD_COPY, type UploadKind } from '@fixit/contracts';
import { ApiError } from './http';

/** Server/network failure of an upload → slot copy. null = the user cancelled (no message). */
export function uploadErrorCopy(err: unknown, kind: UploadKind): string | null {
  if (err instanceof DOMException && err.name === 'AbortError') return null;
  if (err instanceof ApiError && err.status === 413) return UPLOAD_COPY[kind].size;
  if (err instanceof ApiError && err.status === 415) return UPLOAD_COPY[kind].type;
  return UPLOAD_COPY.failed;
}
