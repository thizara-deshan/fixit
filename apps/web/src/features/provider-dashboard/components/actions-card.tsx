import { Check, CircleCheckBig } from 'lucide-react';
import { Link } from 'react-router';
import type { ProviderRequestView } from '@fixit/contracts';
import { Button } from '@/components/ui/button';
import { CONTACT_EMAIL } from '@/lib/env';
import { features } from '@/lib/features';
import { formatDateLong, formatDateShort, formatDeadline, formatLkr } from '@/lib/format';
import { closedCopy } from '../copy';
import { AgreedPriceEditor } from './agreed-price-editor';

interface Props {
  view: ProviderRequestView;
  /** D-14: false on phone, where Pending buttons live in the sticky bar. */
  showPendingButtons: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onComplete: () => void;
  onConflict: (ref: string) => void;
}

const P = 'text-body-sm text-text';
const NOTE = 'text-meta text-text-muted';

/** S22.E3–E6. Every flag comes from the server view. */
export function ActionsCard({
  view: v,
  showPendingButtons,
  onAccept,
  onDecline,
  onComplete,
  onConflict,
}: Props) {
  let content;
  if (v.status === 'pending') {
    content = (
      <>
        <p className={P}>{`Respond by ${formatDeadline(v.expiresAt)}`}</p>
        {showPendingButtons && (
          <div className="flex flex-col gap-2">
            <Button size="lg" className="w-full" onClick={onAccept}>
              <Check aria-hidden="true" className="size-5" />
              Accept
            </Button>
            <Button size="lg" variant="danger-outline" className="w-full" onClick={onDecline}>
              Decline
            </Button>
          </div>
        )}
      </>
    );
  } else if (v.status === 'accepted') {
    content = (
      <>
        <AgreedPriceEditor view={v} onConflict={onConflict} />
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full"
            disabled={!v.canComplete}
            onClick={onComplete}
            aria-describedby={v.canComplete ? undefined : 'complete-help'}
          >
            <CircleCheckBig aria-hidden="true" className="size-5" />
            Mark as completed
          </Button>
          {!v.canComplete && (
            <p id="complete-help" className={NOTE}>
              {`You can mark this job completed from ${formatDateShort(v.completeFrom)}.`}
            </p>
          )}
        </div>
        <p className={NOTE}>
          {`Need to cancel? Call the customer, then email us at ${CONTACT_EMAIL} — providers can't cancel accepted jobs.`}
        </p>
      </>
    );
  } else if (v.status === 'completed') {
    content = (
      <>
        {v.completedAt && (
          <p className={`${P} font-bold`}>{`Completed on ${formatDateLong(v.completedAt)}`}</p>
        )}
        {v.agreedPrice !== null && <p className={P}>{`Agreed price: ${formatLkr(v.agreedPrice)}`}</p>}
        {v.review ? (
          <p className={P}>
            {`${v.review.authorDisplayName} left a ${String(v.review.rating)}-star review`}
            {features.providerReviews && (
              <>
                {' '}
                <Link className="text-primary font-semibold" to={`/dashboard/reviews#${v.review.id}`}>
                  View review
                </Link>
              </>
            )}
          </p>
        ) : (
          v.reviewDeadline && (
            <p className={NOTE}>{`The customer can review until ${formatDateLong(v.reviewDeadline)}.`}</p>
          )
        )}
      </>
    );
  } else {
    const c = closedCopy(v);
    content = c && (
      <>
        <p className={P}>{c.line}</p>
        {c.reason && <p className={NOTE}>{`Reason: ${c.reason}`}</p>}
      </>
    );
  }
  return (
    <section
      aria-label="Actions"
      className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6"
    >
      {content}
    </section>
  );
}
