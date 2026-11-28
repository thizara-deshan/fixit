import { z } from 'zod';
import { AuditAction, AuditTargetType } from '../common/enums';
import { adminReason, Id, IsoDateTime } from '../common/primitives';

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
