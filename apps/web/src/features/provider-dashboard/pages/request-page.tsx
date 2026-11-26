import { Check } from 'lucide-react';
import { useParams } from 'react-router';
import { NotFoundPage } from '@/app/errors/not-found-page';
import { BackLink } from '@/components/back-link';
import { LoadingRegion } from '@/components/loading-region';
import { RequestHistory } from '@/components/request-history';
import { SkeletonSectionCard } from '@/components/skeletons';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import { ApiError } from '@/lib/http';
import { MQ, useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { providerActorLabel } from '../copy';
import { useInboxRequest } from '../hooks';
import { ActionsCard } from '../components/actions-card';
import { CustomerCard } from '../components/customer-card';
import { JobDetailsCard } from '../components/job-details-card';
import { useRequestActions } from '../components/request-actions';

const GRID = 'flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start';

function DetailSkeleton() {
  return (
    <div className={GRID}>
      <SkeletonSectionCard lines={2} />
      <div className="flex min-w-0 flex-col gap-6 lg:order-first">
        <SkeletonSectionCard lines={3} />
        <SkeletonSectionCard lines={5} />
        <SkeletonSectionCard lines={3} />
      </div>
    </div>
  );
}

/** S22. */
export function ProviderRequestPage() {
  const { ref = '' } = useParams();
  const q = useInboxRequest(ref);
  const actions = useRequestActions();
  const isWide = useMediaQuery(MQ.sm);
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404)
      return <NotFoundPage area="provider" variant="request" />;
    throw q.error; // S41
  }
  const v = q.data;
  const stickyBar = v?.status === 'pending' && !isWide;

  return (
    <div className={cn('flex flex-col gap-6', stickyBar && 'pb-24')}>
      <BackLink to="/dashboard/requests">Back to requests</BackLink>
      <LoadingRegion loading={!v} skeleton={<DetailSkeleton />}>
        {v && (
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
              <h1 className="text-title-lg text-text">{v.service.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-mono text-text-subtle font-mono">{v.ref}</span>
                <StatusPill kind="request" status={v.status} />
                <span className="text-body-sm text-text-muted">{`Requested ${formatDateTime(v.createdAt)}`}</span>
              </div>
            </header>
            <div className={GRID}>
              {/* Phone: Actions first. Desktop: right column, sticky. */}
              <div className="lg:sticky lg:top-8 lg:col-start-2 lg:row-start-1">
                <ActionsCard
                  view={v}
                  showPendingButtons={isWide}
                  onAccept={() => {
                    actions.openAccept(v);
                  }}
                  onDecline={() => {
                    actions.openDecline(v);
                  }}
                  onComplete={() => {
                    actions.openComplete(v);
                  }}
                  onConflict={actions.onConflict}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
                <CustomerCard view={v} />
                <JobDetailsCard view={v} />
                <RequestHistory history={v.history} actorLabel={providerActorLabel} />
              </div>
            </div>
            {stickyBar && (
              <div className="border-border bg-surface fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    actions.openDecline(v);
                  }}
                >
                  Decline
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    actions.openAccept(v);
                  }}
                >
                  <Check aria-hidden="true" className="size-5" />
                  Accept
                </Button>
              </div>
            )}
          </div>
        )}
      </LoadingRegion>
      {actions.dialogs}
    </div>
  );
}
