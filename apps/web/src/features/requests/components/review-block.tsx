import { Link } from 'react-router';
import type { CustomerRequestView } from '@fixit/contracts';
import { Stars } from '@/components/stars';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { formatDateLong } from '@/lib/format';

/** S15.E6. Rendered only when `view.review` is non-null. */
export function ReviewBlock({ view }: { view: CustomerRequestView }) {
  const review = view.review;
  if (!review) return null;
  const own = review.own;
  return (
    <div className="border-border mt-2 flex flex-col gap-3 border-t pt-4">
      {own ? (
        <>
          <div className="flex items-center gap-3">
            <h3 className="text-title-sm text-text">Your review</h3>
            <StatusPill kind="review" visibility={own.visibility} />
          </div>
          <Stars rating={own.rating} count={1} showValue={false} />
          <p className="text-body-sm text-text whitespace-pre-line">{own.text}</p>
        </>
      ) : review.eligible && review.deadline ? (
        <>
          <h3 className="text-title-sm text-text">How did it go?</h3>
          <p className="text-body-sm text-text-muted">
            You can review until {formatDateLong(review.deadline)}.
          </p>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to={`/requests/${view.ref}/review`}>Leave a review</Link>
          </Button>
        </>
      ) : (
        <p className="text-body-sm text-text-muted">The review window for this job has closed.</p>
      )}
    </div>
  );
}
