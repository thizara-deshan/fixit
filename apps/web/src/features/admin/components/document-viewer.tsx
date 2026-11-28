import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { DocumentMeta } from '@fixit/contracts';
import { SLOT_TITLE } from '@/components/document-titles';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useDocumentBlob } from '../hooks';

/** S32.E1 full-screen viewer. Bytes come through httpBlob (Bearer token), shown from an object URL. */
export function DocumentViewer({ doc, onClose }: { doc: DocumentMeta | null; onClose: () => void }) {
  const blob = useDocumentBlob(doc?.id ?? null);
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState<'fit' | 'actual'>('fit');

  useEffect(() => {
    if (!blob.data) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob.data);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob.data]);

  useEffect(() => {
    setZoom('fit');
  }, [doc?.id]);

  const isPdf = doc?.mimeType === 'application/pdf';
  const title = doc ? SLOT_TITLE[doc.type] : '';

  return (
    <Dialog
      open={doc !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="bg-surface left-0 top-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0"
      >
        <div className="border-border flex items-center gap-2 border-b px-2 py-2 sm:px-4">
          <DialogTitle className="text-title-sm text-text min-w-0 flex-1 truncate">{title}</DialogTitle>
          {doc && !isPdf && (
            <div className="flex gap-1" role="group" aria-label="Zoom">
              <Button
                variant="secondary"
                size="sm"
                aria-pressed={zoom === 'fit'}
                onClick={() => {
                  setZoom('fit');
                }}
              >
                Fit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                aria-pressed={zoom === 'actual'}
                onClick={() => {
                  setZoom('actual');
                }}
              >
                100%
              </Button>
            </div>
          )}
          <Button
            asChild
            variant="outline"
            size="sm"
            className={url ? undefined : 'pointer-events-none opacity-60'}
          >
            <a href={url ?? undefined} target="_blank" rel="noopener noreferrer">
              Open in new tab
            </a>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>
        <DialogDescription className="sr-only">{doc?.fileName ?? ''}</DialogDescription>
        <div className="bg-page min-h-0 flex-1 touch-pinch-zoom overflow-auto">
          {blob.isError ? (
            <SectionError
              className="m-4"
              onRetry={() => {
                void blob.refetch();
              }}
            />
          ) : (
            <LoadingRegion
              loading={blob.isPending || url === null}
              className="size-full"
              skeleton={<div className="bg-placeholder-a m-auto size-64 rounded-lg" />}
            >
              {url &&
                doc &&
                (isPdf ? (
                  <iframe src={url} title={title} className="size-full border-0" />
                ) : zoom === 'fit' ? (
                  <div className="flex size-full items-center justify-center p-4">
                    <img src={url} alt={title} className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <img src={url} alt={title} className="max-w-none" />
                ))}
            </LoadingRegion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
