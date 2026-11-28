import { z } from 'zod';
import {
  AuditAction,
  AuditTargetType,
  AccountStatus,
  CategoryIcon,
  RequestStatus,
  ReviewVisibility,
  Role,
  SubmissionStatus,
  SubmissionTrigger,
  TimeSlot,
  VerificationStatus,
} from '../common/enums';
import { PageQuery, paginated } from '../common/pagination';
import { adminReason, Id, IsoDate, IsoDateTime, Mobile, RequestRef } from '../common/primitives';
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

/* ---------- Users (S33, S34) ---------- */
const SearchText = z.string().trim().max(80).catch('').default('');

export const AdminUserRoleFilter = z.enum(['all', 'customer', 'provider']);
export type AdminUserRoleFilter = z.infer<typeof AdminUserRoleFilter>;
export const AdminUserStatusFilter = z.enum(['all', 'suspended']);
export type AdminUserStatusFilter = z.infer<typeof AdminUserStatusFilter>;

export const AdminUserListQuery = PageQuery.extend({
  q: SearchText,
  role: AdminUserRoleFilter.catch('all').default('all'),
  status: AdminUserStatusFilter.catch('all').default('all'),
});
export type AdminUserListQuery = z.infer<typeof AdminUserListQuery>;

export const AdminUserRow = z.object({
  id: Id,
  fullName: z.string(),
  email: z.string(),
  mobile: Mobile.nullable(),
  roles: z.array(Role), // ['customer'] | ['customer','provider']
  verificationStatus: VerificationStatus.nullable(), // null = no published listing
  joinedAt: IsoDateTime,
  status: AccountStatus,
});
export type AdminUserRow = z.infer<typeof AdminUserRow>;
export const AdminUserList = paginated(AdminUserRow);
export type AdminUserList = z.infer<typeof AdminUserList>;

/** D-8: compact S35-format row for S34's recent lists. */
export const AdminRequestRow = z.object({
  ref: RequestRef,
  status: RequestStatus,
  customerName: z.string(),
  businessName: z.string(),
  serviceName: z.string(),
  preferredDate: IsoDate,
  slot: TimeSlot,
  townName: z.string(),
});
export type AdminRequestRow = z.infer<typeof AdminRequestRow>;
export const AdminRequestSummary = z.object({
  open: z.number().int().min(0),
  total: z.number().int().min(0),
  recent: z.array(AdminRequestRow).max(5),
});
export type AdminRequestSummary = z.infer<typeof AdminRequestSummary>;

export const SuspendImpact = z.object({
  providerPending: z.number().int().min(0),
  providerAccepted: z.number().int().min(0),
  customerOpen: z.number().int().min(0),
});
export type SuspendImpact = z.infer<typeof SuspendImpact>;

export const AdminUserDetail = z.object({
  id: Id,
  fullName: z.string(),
  email: z.string(),
  mobile: Mobile.nullable(),
  joinedAt: IsoDateTime,
  roles: z.array(Role),
  status: AccountStatus,
  provider: z
    .object({
      id: Id,
      businessName: z.string(),
      categoryName: z.string(),
      verificationStatus: VerificationStatus,
      latestSubmissionId: Id.nullable(),
      rating: z.number().nullable(),
      reviewCount: z.number().int().min(0),
      paused: z.boolean(),
      listed: z.boolean(),
    })
    .nullable(), // published listing only
  asCustomer: AdminRequestSummary,
  asProvider: AdminRequestSummary.nullable(),
  history: z.array(AuditEntry), // user_suspend / user_reactivate, newest first
  impact: SuspendImpact, // what Suspend would do now (zeros when suspended)
});
export type AdminUserDetail = z.infer<typeof AdminUserDetail>;

/* ---------- Reviews moderation (S37) ---------- */
export const ModerationVisibilityFilter = z.enum(['all', 'visible', 'hidden']);
export type ModerationVisibilityFilter = z.infer<typeof ModerationVisibilityFilter>;
export const ModerationQuery = PageQuery.extend({
  q: SearchText,
  visibility: ModerationVisibilityFilter.catch('all').default('all'),
});
export type ModerationQuery = z.infer<typeof ModerationQuery>;

export const ModerationRow = z.object({
  id: Id,
  requestRef: RequestRef,
  provider: z.object({ id: Id, businessName: z.string() }),
  authorDisplayName: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string(),
  createdAt: IsoDateTime,
  reply: z.object({ text: z.string(), createdAt: IsoDateTime }).nullable(),
  visibility: ReviewVisibility,
  hidden: z.object({ at: IsoDateTime, by: z.string(), reason: z.string().nullable() }).nullable(),
});
export type ModerationRow = z.infer<typeof ModerationRow>;
export const ModerationList = paginated(ModerationRow);
export type ModerationList = z.infer<typeof ModerationList>;
