import type { DocumentType } from '../common/enums';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOAD_LIMITS = {
  maxBytes: MAX_UPLOAD_BYTES,
  photo: { mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], minPx: 400 },
  document: { mimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
} as const;
export type UploadKind = 'photo' | 'document';

export const UPLOAD_COPY = {
  photo: {
    type: 'Use a JPG, PNG or WebP image.',
    size: 'Image must be 5 MB or smaller.',
    dimensions: 'Image must be at least 400 × 400 pixels.',
    help: 'JPG, PNG or WebP, at least 400 × 400 px, up to 5 MB. We crop it to a square.',
  },
  document: {
    type: 'Use a JPG, PNG or PDF file.',
    size: 'File must be 5 MB or smaller.',
    help: 'JPG, PNG or PDF, up to 5 MB',
  },
  failed: 'Upload failed. Check your connection and try again.',
} as const;

export type UploadProblem = 'type' | 'size';
/** Type first, then size. Shared by the web pickers and the upload handlers. */
export function checkUpload(
  kind: UploadKind,
  file: { mimeType: string; sizeBytes: number },
): UploadProblem | null {
  const types: readonly string[] = UPLOAD_LIMITS[kind].mimeTypes;
  if (!types.includes(file.mimeType)) return 'type';
  if (file.sizeBytes > MAX_UPLOAD_BYTES) return 'size';
  return null;
}

export const REQUIRED_DOCUMENTS = ['nic_front', 'nic_back'] as const satisfies readonly DocumentType[];
export const DOCUMENT_MISSING: Record<(typeof REQUIRED_DOCUMENTS)[number], string> = {
  nic_front: 'Upload the front of your NIC.',
  nic_back: 'Upload the back of your NIC.',
};
/** BR-17: required types that have no document, in slot order. */
export function missingRequiredDocuments(
  types: readonly DocumentType[],
): (typeof REQUIRED_DOCUMENTS)[number][] {
  return REQUIRED_DOCUMENTS.filter((t) => !types.includes(t));
}
