import type {
  AdminProviderBrief,
  DocumentType,
  VerificationDetail,
  VerificationQueue,
  VerificationQueueQuery,
} from '@fixit/contracts';
import type { FxProvider, FxSubmission } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { alreadyInState, paginate, recordAudit } from './admin-audit';
import { mockError } from './errors';
import { getFile, putFile } from './files';
import { toDocumentMeta } from './verification';

const ORDER: Record<DocumentType, number> = {
  nic_front: 0,
  nic_back: 1,
  trade_certificate: 2,
  business_registration: 3,
};

function providerOf(d: MockDb, s: FxSubmission): FxProvider {
  const p = d.providers[s.providerId];
  if (!p) throw mockError(500, 'INTERNAL', `Submission ${s.id} has no provider`);
  return p;
}

function briefOf(d: MockDb, p: FxProvider): AdminProviderBrief {
  const owner = d.users[p.userId];
  const category = d.categories.find((c) => c.id === p.categoryId);
  if (!owner || !category) throw mockError(500, 'INTERNAL', `Provider ${p.id} is incomplete`);
  return {
    id: p.id,
    businessName: p.businessName ?? '',
    ownerName: owner.fullName,
    photoUrl: p.photoKey ? `/api/files/photos/${p.photoKey}` : null,
    category: { id: category.id, name: category.name, icon: category.icon },
  };
}

const pendingOldestFirst = (d: MockDb): FxSubmission[] =>
  Object.values(d.submissions)
    .filter((s) => s.status === 'pending_review')
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt) || a.id.localeCompare(b.id));

export function queuePage(d: MockDb, q: VerificationQueueQuery): VerificationQueue {
  const rows =
    q.status === 'pending_review'
      ? pendingOldestFirst(d)
      : Object.values(d.submissions)
          .filter((s) => s.status === q.status)
          .sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? '') || a.id.localeCompare(b.id));
  const page = paginate(rows, q.page);
  return {
    ...page,
    items: page.items.map((s) => ({
      id: s.id,
      status: s.status,
      attempt: s.attempt,
      trigger: s.trigger,
      submittedAt: s.submittedAt,
      decidedAt: s.decidedAt,
      provider: briefOf(d, providerOf(d, s)),
    })),
  };
}

export const nextPendingId = (d: MockDb, excludeId: string): string | null =>
  pendingOldestFirst(d).find((s) => s.id !== excludeId)?.id ?? null;

export function submissionOr404(d: MockDb, id: string): FxSubmission {
  const s = d.submissions[id];
  if (!s) throw mockError(404, 'NOT_FOUND', 'No such submission');
  return s;
}

export function verificationDetailOf(d: MockDb, s: FxSubmission): VerificationDetail {
  const p = providerOf(d, s);
  const owner = d.users[p.userId];
  if (!owner) throw mockError(500, 'INTERNAL', `Provider ${p.id} has no owner`);
  const town = d.towns.find((t) => t.id === p.baseTownId);
  return {
    id: s.id,
    status: s.status,
    attempt: s.attempt,
    trigger: s.trigger,
    submittedAt: s.submittedAt,
    decidedAt: s.decidedAt,
    rejectionReason: s.rejectionReason,
    documents: Object.values(d.documents)
      .filter((x) => x.submissionId === s.id)
      .sort((a, b) => ORDER[a.type] - ORDER[b.type])
      .map(toDocumentMeta),
    provider: {
      ...briefOf(d, p),
      userId: owner.id,
      accountName: owner.fullName,
      email: owner.email,
      mobile: owner.mobile,
      baseTownName: town?.name ?? '',
      joinedAt: owner.createdAt,
      verificationStatus: p.verificationStatus,
    },
    previous: Object.values(d.submissions)
      .filter((x) => x.providerId === p.id && x.attempt < s.attempt)
      .sort((a, b) => b.attempt - a.attempt)
      .map((x) => ({
        id: x.id,
        attempt: x.attempt,
        status: x.status,
        submittedAt: x.submittedAt,
        decidedAt: x.decidedAt,
        rejectionReason: x.rejectionReason,
        decidedByName: x.decidedById ? (d.users[x.decidedById]?.fullName ?? null) : null,
      })),
  };
}

function decide(d: MockDb, s: FxSubmission, adminId: string, now: Date): FxProvider {
  if (s.status !== 'pending_review') throw alreadyInState(s.status);
  s.decidedAt = now.toISOString();
  s.decidedById = adminId;
  return providerOf(d, s);
}

/** A29: badge on (BR-20). */
export function approveSubmission(d: MockDb, s: FxSubmission, adminId: string, now: Date): void {
  const p = decide(d, s, adminId, now);
  s.status = 'approved';
  p.verificationStatus = 'verified';
  p.verifiedAt = now.toISOString();
  p.reverificationReason = null;
  recordAudit(
    d,
    { adminId, action: 'verification_approve', targetType: 'submission', targetId: s.id, reason: null },
    now,
  );
}

/** A30 + D-12: the provider's S26 opens with copies of these files staged. */
export function rejectSubmission(
  d: MockDb,
  s: FxSubmission,
  adminId: string,
  reason: string,
  now: Date,
): void {
  const p = decide(d, s, adminId, now);
  s.status = 'rejected';
  s.rejectionReason = reason;
  p.verificationStatus = 'rejected';
  p.verifiedAt = null;
  for (const doc of Object.values(d.documents).filter((x) => x.submissionId === s.id)) {
    const copyId = `d-${crypto.randomUUID().slice(0, 8)}`;
    d.documents[copyId] = { ...doc, id: copyId, submissionId: null, createdAt: now.toISOString() };
    const blob = getFile(`doc:${doc.id}`);
    if (blob) putFile(`doc:${copyId}`, blob);
  }
  recordAudit(
    d,
    { adminId, action: 'verification_reject', targetType: 'submission', targetId: s.id, reason },
    now,
  );
}
