import { FileImage, FileText } from 'lucide-react';
import type { DocumentMeta } from '@fixit/contracts';
import { DOCUMENT_ORDER, SLOT_TITLE } from '@/components/document-titles';
import { formatFileSize } from '@/lib/format';

/** S32.E1: one tile per document slot; missing optional slots say so. */
export function DocumentTiles({
  documents,
  onOpen,
}: {
  documents: DocumentMeta[];
  onOpen: (d: DocumentMeta) => void;
}) {
  return (
    <section
      aria-labelledby="docs"
      className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6"
    >
      <h2 id="docs" className="text-title-sm text-text">
        Documents
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DOCUMENT_ORDER.map((type) => {
          const doc = documents.find((d) => d.type === type);
          if (!doc)
            return (
              <div
                key={type}
                className="border-border-strong flex min-h-11 items-center gap-3 rounded-xl border border-dashed p-4"
              >
                <div className="min-w-0">
                  <p className="text-body-sm text-text font-semibold">{SLOT_TITLE[type]}</p>
                  <p className="text-meta text-text-subtle">Not provided</p>
                </div>
              </div>
            );
          const Icon = doc.mimeType === 'application/pdf' ? FileText : FileImage;
          return (
            <button
              key={type}
              type="button"
              aria-label={`Open ${SLOT_TITLE[type]}`}
              onClick={() => {
                onOpen(doc);
              }}
              className="border-border hover:border-primary focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2"
            >
              <Icon aria-hidden="true" className="text-text-muted size-6 shrink-0" />
              <span className="min-w-0">
                <span className="text-body-sm text-text block font-semibold">{SLOT_TITLE[type]}</span>
                <span className="text-meta text-text-muted block truncate">
                  {doc.fileName} · {formatFileSize(doc.sizeBytes)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
