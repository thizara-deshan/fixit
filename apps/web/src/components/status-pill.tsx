import type { AccountStatus, RequestStatus, ReviewVisibility, VerificationStatus } from '@fixit/contracts';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from './verified-badge';

type Tone = 'pending' | 'accepted' | 'completed' | 'declined' | 'cancelled' | 'expired' | 'muted';

const TONE: Record<Tone, { pill: string; dot: string }> = {
  pending: { pill: 'bg-warning-soft text-warning-text', dot: 'bg-warning' },
  accepted: { pill: 'bg-primary-soft text-primary', dot: 'bg-primary' },
  completed: { pill: 'bg-success-soft text-success-text', dot: 'bg-success' },
  declined: { pill: 'bg-danger-soft text-danger-text', dot: 'bg-danger' },
  cancelled: { pill: 'bg-surface-muted text-text-muted', dot: 'bg-icon-subtle' },
  expired: {
    pill: 'border border-dashed border-border-strong bg-page text-text-muted',
    dot: 'bg-border-control',
  },
  muted: { pill: 'bg-surface-muted text-text-muted', dot: '' },
};

export type StatusPillProps = { compact?: boolean; className?: string } & (
  | { kind: 'request'; status: RequestStatus }
  | { kind: 'verification'; status: VerificationStatus }
  | { kind: 'account'; status: AccountStatus }
  | { kind: 'review'; visibility: ReviewVisibility }
  | { kind: 'availability' } // BR-15 "Not taking requests"
  | { kind: 'trust'; verified: boolean } // listing trust
  | { kind: 'email'; confirmed: boolean }
);

type Resolved = { tone: Tone; label: string; dot: boolean; semibold?: boolean } | 'verified' | null;

const REQUEST: Record<RequestStatus, [Tone, string]> = {
  pending: ['pending', 'Pending'],
  accepted: ['accepted', 'Accepted'],
  completed: ['completed', 'Completed'],
  declined: ['declined', 'Declined'],
  cancelled: ['cancelled', 'Cancelled'],
  expired: ['expired', 'Expired'],
};

function resolve(p: StatusPillProps): Resolved {
  switch (p.kind) {
    case 'request': {
      const [tone, label] = REQUEST[p.status];
      return { tone, label, dot: true };
    }
    case 'verification':
      if (p.status === 'verified') return 'verified';
      if (p.status === 'pending_review') return { tone: 'pending', label: 'Pending review', dot: true };
      if (p.status === 'rejected') return { tone: 'declined', label: 'Rejected', dot: true };
      return { tone: 'cancelled', label: 'Not submitted', dot: true };
    case 'account':
      return p.status === 'active'
        ? { tone: 'completed', label: 'Active', dot: true }
        : { tone: 'declined', label: 'Suspended', dot: true };
    case 'review':
      return p.visibility === 'hidden' ? { tone: 'cancelled', label: 'Hidden', dot: true } : null;
    case 'availability':
      return { tone: 'pending', label: 'Not taking requests', dot: false };
    case 'email':
      return {
        tone: p.confirmed ? 'completed' : 'pending',
        label: p.confirmed ? 'Confirmed' : 'Not confirmed',
        dot: true,
      };
    case 'trust':
      return p.verified
        ? 'verified'
        : { tone: 'muted', label: 'Not yet verified', dot: false, semibold: true };
  }
}

/** SPEC §2.2. Renders nothing for a visible review; the Verified badge for verified states. */
export function StatusPill(props: StatusPillProps) {
  const r = resolve(props);
  if (r === null) return null;
  if (r === 'verified')
    return <VerifiedBadge size={props.compact ? 'sm' : 'md'} className={props.className} />;
  const tone = TONE[r.tone];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full',
        props.compact ? 'text-caption h-6 px-2.5' : 'text-meta h-7 px-3',
        r.semibold ? 'font-semibold' : 'font-bold',
        tone.pill,
        props.className,
      )}
    >
      {r.dot && <span aria-hidden="true" className={cn('size-1.5 rounded-full', tone.dot)} />}
      {r.label}
    </span>
  );
}
