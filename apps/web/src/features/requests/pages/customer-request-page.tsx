import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { NotFoundPage } from '@/app/errors/not-found-page';
import { BackLink } from '@/components/back-link';
import { LoadingRegion } from '@/components/loading-region';
import { SkeletonSectionCard } from '@/components/skeletons';
import { REQUEST_LABEL, StatusPill } from '@/components/status-pill';
import { ApiError } from '@/lib/http';
import { CancelRequestDialog } from '../components/cancel-request-dialog';
import { ConflictDialog } from '../components/conflict-dialog';
import { ProviderAsideCard } from '../components/provider-aside-card';
import { RequestDetailsCard } from '../components/request-details-card';
import { RequestHistory } from '../components/request-history';
import { StatusPanelCard } from '../components/status-panel-card';
import { useMyRequest } from '../hooks';

const GRID = 'flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start';

function DetailSkeleton() {
  return (
    <div className={GRID}>
      <div className="flex min-w-0 flex-col gap-6">
        <SkeletonSectionCard lines={3} />
        <SkeletonSectionCard lines={5} />
        <SkeletonSectionCard lines={3} />
      </div>
      <div className="hidden lg:block">
        <SkeletonSectionCard lines={3} />
      </div>
    </div>
  );
}

/** S15. */
export function CustomerRequestPage() {
  const { ref = '' } = useParams();
  const q = useMyRequest(ref);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFoundPage variant="request" />;
    throw q.error; // S41
  }
  const v = q.data;
  const onConflict = (reason: string | null) => {
    void q.refetch().then((res) => {
      const now = res.data ?? v;
      if (!now) return;
      setConflict(
        reason === 'past_cancel_deadline'
          ? `It's too late to cancel online. Contact ${now.provider.businessName} directly.`
          : `It's now ${REQUEST_LABEL[now.status]}, so this action isn't available.`,
      );
    });
  };

  return (
    <>
      <BackLink to="/requests">Back to my requests</BackLink>
      <LoadingRegion loading={!v} skeleton={<DetailSkeleton />}>
        {v && (
          <>
            <header className="flex flex-col gap-2">
              <h1 className="text-title-lg text-text">{v.service.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-mono text-text-subtle font-mono">{v.ref}</span>
                <StatusPill kind="request" status={v.status} />
                <span className="text-body-sm text-text-muted">
                  with{' '}
                  {v.provider.listed ? (
                    <Link className="text-primary font-semibold" to={`/providers/${v.provider.id}`}>
                      {v.provider.businessName}
                    </Link>
                  ) : (
                    v.provider.businessName
                  )}
                </span>
              </div>
            </header>
            <div className={GRID}>
              <div className="flex min-w-0 flex-col gap-6">
                <StatusPanelCard
                  view={v}
                  onCancel={() => {
                    setCancelOpen(true);
                  }}
                />
                <div className="lg:hidden">
                  <ProviderAsideCard provider={v.provider} />
                </div>
                <RequestDetailsCard view={v} />
                <RequestHistory history={v.history} businessName={v.provider.businessName} />
              </div>
              <div className="hidden lg:block">
                <ProviderAsideCard provider={v.provider} />
              </div>
            </div>
            <CancelRequestDialog
              view={v}
              open={cancelOpen}
              onOpenChange={setCancelOpen}
              onConflict={onConflict}
            />
            <ConflictDialog
              open={conflict !== null}
              onOpenChange={(o) => {
                if (!o) setConflict(null);
              }}
              body={conflict ?? ''}
            />
          </>
        )}
      </LoadingRegion>
    </>
  );
}
