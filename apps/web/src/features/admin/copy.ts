import { colomboDaysSince, type SubmissionTrigger, type SuspendImpact } from '@fixit/contracts';

/** D-3 */
export const attemptLabel = (attempt: number): string =>
  attempt <= 1 ? 'First' : `Resubmission ${String(attempt - 1)}`;
export const triggerNote = (t: SubmissionTrigger): string | null =>
  t === 'business_name' ? 'Business name changed' : t === 'category' ? 'Category changed' : null;

/** S30.E1 sub (D-4). */
export function oldestSub(oldestPendingAt: string | null, now: Date): string {
  if (oldestPendingAt === null) return 'all caught up';
  const n = colomboDaysSince(new Date(oldestPendingAt), now);
  if (n === 0) return 'oldest today';
  if (n === 1) return 'oldest 1 day';
  return `oldest ${String(n)} days`;
}

/** S34.E1 effects list (D-10). */
export function suspendEffects(impact: SuspendImpact, isProvider: boolean): string[] {
  const lines = ["They won't be able to sign in."];
  if (isProvider) {
    lines.push('Their listing will be hidden from search and their profile link will stop working.');
    lines.push(
      `${String(impact.providerPending)} pending requests will be declined and ${String(impact.providerAccepted)} accepted requests cancelled. Customers are emailed.`,
    );
  }
  if (!isProvider || impact.customerOpen > 0)
    lines.push(
      `${String(impact.customerOpen)} of their open requests will be cancelled. Providers are emailed.`,
    );
  lines.push('Their reviews stay visible unless you hide them.');
  return lines;
}

/** D-6 conflict copy. */
export const CONFLICT = {
  submission: {
    title: 'This submission has changed',
    body: 'Another admin has already decided it. The page now shows the latest status.',
  },
  account: {
    title: 'This account has changed',
    body: 'Its status changed while you were looking at it. The page now shows the latest status.',
  },
  review: {
    title: 'This review has changed',
    body: 'Its visibility changed while you were looking at it. The list now shows the latest status.',
  },
} as const;
