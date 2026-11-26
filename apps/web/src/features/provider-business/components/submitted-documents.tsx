import { FileImage, FileText } from 'lucide-react';
import type { DocumentMeta } from '@fixit/contracts';
import { formatFileSize } from '@/lib/format';
import { SLOT_TITLE } from './document-slot';

export function SubmittedDocuments({ documents }: { documents: DocumentMeta[] }) {
  if (documents.length === 0) return null;
  return (
    <section
      aria-labelledby="submitted-docs"
      className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 sm:p-6"
    >
      <h2 id="submitted-docs" className="text-title-sm text-text">
        Submitted documents
      </h2>
      <ul className="flex flex-col gap-2">
        {documents.map((d) => (
          <li key={d.id} className="flex min-w-0 items-center gap-3">
            {d.mimeType === 'application/pdf' ? (
              <FileText aria-hidden="true" className="text-text-muted size-5 shrink-0" />
            ) : (
              <FileImage aria-hidden="true" className="text-text-muted size-5 shrink-0" />
            )}
            <span className="text-body-sm text-text font-semibold">{SLOT_TITLE[d.type]}</span>
            <span className="text-meta text-text-muted min-w-0 truncate">
              {d.fileName} · {formatFileSize(d.sizeBytes)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
