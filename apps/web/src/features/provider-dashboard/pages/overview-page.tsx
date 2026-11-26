import { useState } from 'react';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { useAuth } from '@/lib/auth-store';
import { firstNameOf } from '../copy';
import { useDashboard } from '../hooks';
import { MyServicesCard } from '../components/my-services-card';
import { OverviewHeader } from '../components/overview-header';
import { RecentRequestsSection } from '../components/recent-requests-section';
import { useRequestActions } from '../components/request-actions';
import { StatTiles, StatTilesSkeleton } from '../components/stat-tiles';

/** S20. */
export function ProviderOverviewPage() {
  const { me } = useAuth();
  const dash = useDashboard();
  const actions = useRequestActions();
  const [now] = useState(() => new Date());
  if (!me?.provider) return null; // RequireProvider guarantees it
  const retry = () => {
    void dash.refetch();
  };
  return (
    <>
      <OverviewHeader
        firstName={firstNameOf(me.fullName)}
        pending={dash.data?.stats.pending ?? me.provider.pendingRequestCount}
        providerId={me.provider.id}
        now={now}
      />
      {dash.isError ? (
        <SectionError onRetry={retry} />
      ) : (
        <LoadingRegion loading={dash.isPending} skeleton={<StatTilesSkeleton />}>
          {dash.data && <StatTiles stats={dash.data.stats} now={now} />}
        </LoadingRegion>
      )}
      <RecentRequestsSection onAccept={actions.openAccept} onDecline={actions.openDecline} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start gap-6">
        {dash.isError ? (
          <SectionError onRetry={retry} />
        ) : (
          <LoadingRegion loading={dash.isPending} skeleton={<SkeletonSectionCard lines={5} />}>
            {dash.data && <MyServicesCard services={dash.data.services} />}
          </LoadingRegion>
        )}
      </div>
      {actions.dialogs}
    </>
  );
}
