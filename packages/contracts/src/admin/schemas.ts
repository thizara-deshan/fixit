import { z } from 'zod';
import {
  AuditAction,
  AuditTargetType,
  CategoryIcon,
  SubmissionStatus,
  SubmissionTrigger,
  VerificationStatus,
} from '../common/enums';
import { PageQuery, paginated } from '../common/pagination';
import { adminReason, Id, IsoDateTime, Mobile } from '../common/primitives';
import { DocumentMeta } from '../providers/own';

/* ---------- Reasons (SPEC §8.7: admin reasons 10–500, required) ---------- */
export const REJECT_REASON_MESSAGE = 'Give a reason so the provider knows what to fix.';
export const HIDE_REASON_MESSAGE = 'Give a reason for the moderation log.';
export const accountReasonMessage = (name: string): string =>
  `Give a reason. It's included in the email to ${name}.`;

export const RejectBody = z.object({ reason: adminReason(REJECT_REASON_MESSAGE) });
export type RejectBody = z.infer<typeof RejectBody>;
export const HideReviewBody = z.object({ reason: adminReason(HIDE_REASON_MESSAGE) });
export type HideReviewBody = z.infer<typeof HideReviewBody>;
/** API bodies (D-11). The S34 forms use makeAccountReasonBody(name) for the named message. */
export const SuspendBody = z.object({ reason: adminReason(accountReasonMessage('them')) });
export type SuspendBody = z.infer<typeof SuspendBody>;
export const ReactivateBody = z.object({ reason: adminReason(accountReasonMessage('them')) });
export type ReactivateBody = z.infer<typeof ReactivateBody>;
export const makeAccountReasonBody = (name: string) =>
  z.object({ reason: adminReason(accountReasonMessage(name)) });

/* ---------- Audit (ARCH §7.9, D14) ---------- */
export const AuditEntry = z.object({
  id: Id,
  action: AuditAction,
  targetType: AuditTargetType,
  targetId: Id,
  reason: z.string().nullable(),
  at: IsoDateTime,
  adminId: Id,
  adminName: z.string(),
});
export type AuditEntry = z.infer<typeof AuditEntry>;

/* ---------- Overview (S30.E1–E2; D-1: M25 adds `metrics` as an optional key) ---------- */
export const AdminAttention = z.object({
  pendingVerifications: z.number().int().min(0),
  oldestPendingAt: IsoDateTime.nullable(),
  suspendedUsers: z.number().int().min(0),
});
export type AdminAttention = z.infer<typeof AdminAttention>;
export const AdminOverview = z.object({ attention: AdminAttention });
export type AdminOverview = z.infer<typeof AdminOverview>;

/* ---------- Verification queue (S31) and review (S32) ---------- */
export const VerificationQueueQuery = PageQuery.extend({
  status: SubmissionStatus.catch('pending_review').default('pending_review'),
});
export type VerificationQueueQuery = z.infer<typeof VerificationQueueQuery>;

export const AdminProviderBrief = z.object({
  id: Id,
  businessName: z.string(),
  ownerName: z.string(),
  photoUrl: z.string().nullable(),
  category: z.object({ id: Id, name: z.string(), icon: CategoryIcon }),
});
export type AdminProviderBrief = z.infer<typeof AdminProviderBrief>;

export const VerificationQueueRow = z.object({
  id: Id,
  status: SubmissionStatus,
  attempt: z.number().int().min(1),
  trigger: SubmissionTrigger,
  submittedAt: IsoDateTime,
  decidedAt: IsoDateTime.nullable(),
  provider: AdminProviderBrief,
});
export type VerificationQueueRow = z.infer<typeof VerificationQueueRow>;
export const VerificationQueue = paginated(VerificationQueueRow);
export type VerificationQueue = z.infer<typeof VerificationQueue>;

export const PreviousDecision = z.object({
  id: Id,
  attempt: z.number().int().min(1),
  status: SubmissionStatus,
  submittedAt: IsoDateTime,
  decidedAt: IsoDateTime.nullable(),
  rejectionReason: z.string().nullable(),
  decidedByName: z.string().nullable(),
});
export type PreviousDecision = z.infer<typeof PreviousDecision>;

export const VerificationDetail = z.object({
  id: Id,
  status: SubmissionStatus,
  attempt: z.number().int().min(1),
  trigger: SubmissionTrigger,
  submittedAt: IsoDateTime,
  decidedAt: IsoDateTime.nullable(),
  rejectionReason: z.string().nullable(),
  documents: z.array(DocumentMeta), // this submission's files, S26 slot order
  provider: AdminProviderBrief.extend({
    userId: Id,
    accountName: z.string(),
    email: z.string(),
    mobile: Mobile.nullable(),
    baseTownName: z.string(),
    joinedAt: IsoDateTime,
    verificationStatus: VerificationStatus,
  }),
  previous: z.array(PreviousDecision), // earlier attempts, newest first; [] on a first submission
});
export type VerificationDetail = z.infer<typeof VerificationDetail>;

/** approve / reject response: the decided submission + the next pending one (oldest first) or null. */
export const VerificationDecisionResult = z.object({ detail: VerificationDetail, nextId: Id.nullable() });
export type VerificationDecisionResult = z.infer<typeof VerificationDecisionResult>;
