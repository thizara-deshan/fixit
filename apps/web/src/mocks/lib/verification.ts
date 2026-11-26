import {
  isVerificationEditable,
  missingRequiredDocuments,
  type DocumentMeta,
  type DocumentType,
  type VerificationState,
} from '@fixit/contracts';
import type { FxDocument, FxProvider } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';
import { deleteFile, putFile } from './files';

const notEditable = () =>
  mockError(422, 'RULE_VIOLATION', 'Verification not editable', {
    details: { rule: 'verification_not_editable' },
  });

export const toDocumentMeta = (doc: FxDocument): DocumentMeta => ({
  id: doc.id,
  type: doc.type,
  fileName: doc.fileName,
  mimeType: doc.mimeType,
  sizeBytes: doc.sizeBytes,
  url: `/api/files/documents/${doc.id}`,
  createdAt: doc.createdAt,
});

const ORDER: Record<DocumentType, number> = {
  nic_front: 0,
  nic_back: 1,
  trade_certificate: 2,
  business_registration: 3,
};
const byOrder = (a: FxDocument, b: FxDocument) => ORDER[a.type] - ORDER[b.type];

export const stagedDocs = (d: MockDb, providerId: string): FxDocument[] =>
  Object.values(d.documents)
    .filter((x) => x.providerId === providerId && x.submissionId === null)
    .sort(byOrder);

export function verificationStateOf(d: MockDb, p: FxProvider): VerificationState {
  const editable = isVerificationEditable(p.verificationStatus);
  const subs = Object.values(d.submissions)
    .filter((s) => s.providerId === p.id)
    .sort((a, b) => b.attempt - a.attempt);
  const latest = subs[0];
  const lastRejected = subs.find((s) => s.status === 'rejected');
  const docs = editable
    ? stagedDocs(d, p.id)
    : Object.values(d.documents)
        .filter((x) => latest && x.submissionId === latest.id)
        .sort(byOrder);
  return {
    status: p.verificationStatus,
    editable,
    verifiedAt: p.verifiedAt,
    rejectionReason: p.verificationStatus === 'rejected' ? (lastRejected?.rejectionReason ?? null) : null,
    documents: docs.map(toDocumentMeta),
  };
}

/** S26.E1 upload: replaces a staged document of the same type. */
export function stageDocument(
  d: MockDb,
  p: FxProvider,
  file: { type: DocumentType; fileName: string; mimeType: string; bytes: Uint8Array<ArrayBuffer> },
  now: Date,
): FxDocument {
  if (!isVerificationEditable(p.verificationStatus)) throw notEditable();
  for (const old of stagedDocs(d, p.id).filter((x) => x.type === file.type)) {
    Reflect.deleteProperty(d.documents, old.id);
    deleteFile(`doc:${old.id}`);
  }
  const doc: FxDocument = {
    id: `d-${crypto.randomUUID().slice(0, 8)}`,
    providerId: p.id,
    submissionId: null,
    type: file.type,
    fileName: file.fileName,
    mimeType: file.mimeType,
    sizeBytes: file.bytes.length,
    createdAt: now.toISOString(),
  };
  d.documents[doc.id] = doc;
  putFile(`doc:${doc.id}`, new Blob([file.bytes], { type: file.mimeType }));
  return doc;
}

export function unstageDocument(d: MockDb, p: FxProvider, id: string): void {
  const doc = d.documents[id];
  if (!doc || doc.providerId !== p.id || doc.submissionId !== null)
    throw mockError(404, 'NOT_FOUND', 'No such document');
  if (!isVerificationEditable(p.verificationStatus)) throw notEditable();
  Reflect.deleteProperty(d.documents, id);
  deleteFile(`doc:${id}`);
}

/** A27: new attempt, staged → submitted, status pending_review. */
export function submitVerification(d: MockDb, p: FxProvider, now: Date): void {
  if (!isVerificationEditable(p.verificationStatus)) throw notEditable();
  const staged = stagedDocs(d, p.id);
  if (missingRequiredDocuments(staged.map((x) => x.type)).length > 0)
    throw mockError(422, 'RULE_VIOLATION', 'NIC front and back required', {
      details: { rule: 'documents_missing' },
    });
  const attempt =
    Math.max(
      0,
      ...Object.values(d.submissions)
        .filter((s) => s.providerId === p.id)
        .map((s) => s.attempt),
    ) + 1;
  const id = `s-${p.id}-${String(attempt)}`;
  d.submissions[id] = {
    id,
    providerId: p.id,
    attempt,
    trigger: 'provider',
    status: 'pending_review',
    submittedAt: now.toISOString(),
    decidedAt: null,
    rejectionReason: null,
  };
  for (const doc of staged) doc.submissionId = id;
  p.verificationStatus = 'pending_review';
  p.reverificationReason = null;
}
