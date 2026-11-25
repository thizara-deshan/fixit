import { CircleCheck } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router';
import { NotFoundPage } from '@/app/errors/not-found-page';
import { LoadingRegion } from '@/components/loading-region';
import { SkeletonSectionCard } from '@/components/skeletons';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { formatDateLong, formatDeadline, SLOT_LABEL } from '@/lib/format';
import { ApiError } from '@/lib/http';
import { lastDiscoverUrl } from '@/lib/last-discover';
import { useMyRequest } from '../hooks';

/** S13. */
export function RequestSentPage() {
  const { ref = '' } = useParams();
  const q = useMyRequest(ref);
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFoundPage variant="request" />;
    throw q.error;
  }
  const r = q.data;
  if (r && r.status !== 'pending') return <Navigate to={`/requests/${r.ref}`} replace />;
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-10 sm:py-14">
      <LoadingRegion loading={!r} skeleton={<SkeletonSectionCard lines={6} />}>
        {r && (
          <div className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-6 sm:p-8">
            <span
              aria-hidden="true"
              className="bg-success-soft text-success grid size-14 place-items-center rounded-xl"
            >
              <CircleCheck className="size-7" />
            </span>
            <h1 className="text-title-md text-text">Request sent to {r.provider.businessName}</h1>
            <p className="text-body text-text-muted">
              We&apos;ve emailed {r.provider.businessName}. They have until {formatDeadline(r.expiresAt)} to
              accept or decline — we&apos;ll email you as soon as they reply.
            </p>
            <dl className="border-border grid grid-cols-[96px_minmax(0,1fr)] gap-x-4 gap-y-3 border-t pt-5">
              <dt className="text-body-sm text-text-muted">Reference</dt>
              <dd className="text-body text-text font-mono">{r.ref}</dd>
              <dt className="text-body-sm text-text-muted">Service</dt>
              <dd className="text-body text-text">{r.service.name}</dd>
              <dt className="text-body-sm text-text-muted">Date</dt>
              <dd className="text-body text-text">
                {formatDateLong(r.preferredDate)} · {SLOT_LABEL[r.slot]}
              </dd>
              <dt className="text-body-sm text-text-muted">Town</dt>
              <dd className="text-body text-text">{r.town.name}</dd>
              <dt className="text-body-sm text-text-muted">Status</dt>
              <dd>
                <StatusPill kind="request" status={r.status} />
              </dd>
            </dl>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to={`/requests/${r.ref}`}>View request</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <Link to={lastDiscoverUrl()}>Back to search</Link>
              </Button>
            </div>
          </div>
        )}
      </LoadingRegion>
    </div>
  );
}
