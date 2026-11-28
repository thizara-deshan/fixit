import type { SubmissionStatus, VerificationStatus } from '@fixit/contracts';
import { StatusPill } from '@/components/status-pill';

const MAP: Record<SubmissionStatus, VerificationStatus> = {
  approved: 'verified',
  rejected: 'rejected',
  pending_review: 'pending_review',
};

/** A submission's status shown with the verification pill styles (SPEC §2.2). */
export function SubmissionPill({ status, compact }: { status: SubmissionStatus; compact?: boolean }) {
  return <StatusPill kind="verification" status={MAP[status]} {...(compact ? { compact } : {})} />;
}
