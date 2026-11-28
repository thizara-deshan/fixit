import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { FileImage, FileText, LoaderCircle, Upload } from 'lucide-react';
import {
  checkUpload,
  UPLOAD_COPY,
  UPLOAD_LIMITS,
  type DocumentMeta,
  type DocumentType,
} from '@fixit/contracts';
import { SLOT_TITLE } from '@/components/document-titles';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/format';
import { useUpload } from '@/lib/use-upload';
import { cn } from '@/lib/utils';
import { uploadDocument } from '../api';
import { useDeleteDocument, useDocumentCache } from '../hooks';

export { SLOT_TITLE } from '@/components/document-titles';
export const SLOT_REQUIRED: Record<DocumentType, boolean> = {
  nic_front: true,
  nic_back: true,
  trade_certificate: false,
  business_registration: false,
};

interface DocumentSlotProps {
  type: DocumentType;
  doc: DocumentMeta | null;
  /** Submit-time message (`Upload the front of your NIC.`); the slot's own upload errors win. */
  missingError?: string | undefined;
  onBusyChange: (type: DocumentType, busy: boolean) => void;
  onUploaded: (type: DocumentType) => void;
}

export function DocumentSlot({ type, doc, missingError, onBusyChange, onUploaded }: DocumentSlotProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const cache = useDocumentCache();
  const del = useDeleteDocument();
  const send = (file: File, signal: AbortSignal) => uploadDocument(type, file, signal);
  const { state, start, cancel, fail, reset } = useUpload('document', send);
  const [preview, setPreview] = useState<string | null>(null);
  const busy = state.status === 'uploading';
  useEffect(() => {
    onBusyChange(type, busy);
  }, [busy, type, onBusyChange]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function pick(file: File) {
    reset();
    const problem = checkUpload('document', { mimeType: file.type, sizeBytes: file.size });
    if (problem) {
      fail(UPLOAD_COPY.document[problem]);
      return;
    }
    const meta = await start(file);
    if (!meta) return;
    cache.put(meta);
    setPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    onUploaded(type);
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && !busy) void pick(f);
  };
  const error = state.status === 'error' ? state.message : doc ? undefined : missingError;

  return (
    <section aria-labelledby={`${id}-t`} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id={`${id}-t`} className="text-body text-text font-bold">
          {SLOT_TITLE[type]}
        </h3>
        <span className="text-caption text-text-subtle font-semibold">
          {SLOT_REQUIRED[type] ? 'Required' : 'Optional'}
        </span>
      </div>
      <p id={`${id}-help`} className="text-meta text-text-muted">
        {UPLOAD_COPY.document.help}
      </p>
      <input
        ref={input}
        type="file"
        className="sr-only"
        accept={UPLOAD_LIMITS.document.mimeTypes.join(',')}
        aria-label={`${doc ? 'Replace' : 'Choose file for'} ${SLOT_TITLE[type]}`}
        aria-describedby={`${id}-help`}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void pick(f);
        }}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={onDrop}
        className={cn(
          'flex flex-col gap-3 rounded-lg border p-4',
          doc && !busy ? 'bg-surface' : 'bg-page items-center border-dashed text-center',
          error ? 'border-danger' : doc && !busy ? 'border-border' : 'border-border-strong',
        )}
      >
        {busy && (
          <>
            <div
              role="progressbar"
              aria-label={`Uploading ${state.fileName}`}
              className="bg-primary-soft h-2.5 w-full overflow-hidden rounded-full"
            >
              <div className="bg-primary h-full w-1/3 animate-pulse rounded-full motion-reduce:animate-none" />
            </div>
            <p className="text-meta text-text-muted max-w-full truncate">{state.fileName}</p>
            <Button type="button" variant="secondary" size="sm" onClick={cancel}>
              Cancel
            </Button>
          </>
        )}
        {doc && !busy && (
          <div className="flex min-w-0 items-center gap-3 text-left">
            <div className="bg-surface-muted grid size-14 shrink-0 place-items-center overflow-hidden rounded-md">
              {preview ? (
                <img src={preview} alt="" className="size-full object-cover" />
              ) : doc.mimeType === 'application/pdf' ? (
                <FileText className="text-text-muted size-7" aria-hidden="true" />
              ) : (
                <FileImage className="text-text-muted size-7" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm text-text truncate font-semibold">{doc.fileName}</p>
              <p className="text-meta text-text-muted">{formatFileSize(doc.sizeBytes)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-11 sm:min-h-0"
                disabled={del.isPending}
                onClick={() => input.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-11 sm:min-h-0"
                disabled={del.isPending}
                onClick={() => {
                  reset();
                  del.mutate(doc.id, {
                    onError: () => {
                      fail("Couldn't remove. Try again.");
                    },
                  });
                }}
              >
                {del.isPending && (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                )}
                Remove
              </Button>
            </div>
          </div>
        )}
        {!doc && !busy && (
          <>
            <Upload className="text-text-muted size-6" aria-hidden="true" />
            <Button type="button" variant="secondary" onClick={() => input.current?.click()}>
              Choose file
            </Button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-meta text-danger-text">
          {error}
        </p>
      )}
    </section>
  );
}
