import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { NotFoundPage } from '@/app/errors/not-found-page';
import { BackLink } from '@/components/back-link';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { LoadingRegion } from '@/components/loading-region';
import { useProviderProfile } from '@/features/provider-profile/hooks';
import { useAuth } from '@/lib/auth-store';
import { ApiError } from '@/lib/http';
import { lastDiscoverLoc } from '@/lib/last-discover';
import { useBodyClass } from '@/lib/use-body-class';
import { toBlock } from '../blocked-state';
import { BlockedCard } from '../components/blocked-card';
import { ProviderMiniRow } from '../components/provider-mini-row';
import { RequestForm } from '../components/request-form';
import { RequestFormSkeleton } from '../components/request-form-skeleton';
import { RequestSummary, WhatHappensNext } from '../components/request-summary';
import { useEligibility } from '../hooks';
import { initialTownId } from '../town-prefill';

/** S12. Guards already sent guests to /login?next=… and admins to S40. */
export function RequestFormPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { me } = useAuth();
  const profile = useProviderProfile(id);
  const eligibility = useEligibility(id);
  const [serviceId, setServiceId] = useState('');
  const [dirty, setDirty] = useState(false);
  const [sentRef, setSentRef] = useState<string | null>(null);
  const p = profile.data;
  const loc = lastDiscoverLoc();
  const block =
    p && me
      ? toBlock(eligibility.data, {
          providerId: p.id,
          businessName: p.businessName,
          categoryId: p.category.id,
          email: me.email,
          loc,
        })
      : { kind: 'none' as const };
  const showForm = Boolean(p && me && !eligibility.isPending && block.kind === 'none');
  useBodyClass(showForm ? 'pb-24 sm:pb-0' : '');
  useEffect(() => {
    if (sentRef) void navigate(`/requests/${sentRef}/sent`);
  }, [sentRef, navigate]);
  const onDirtyChange = useCallback((d: boolean) => {
    setDirty(d);
  }, []);

  if (profile.isError) {
    if (profile.error instanceof ApiError && profile.error.status === 404)
      return <NotFoundPage variant="provider" />;
    throw profile.error; // S41
  }
  if (block.kind === 'not_found') return <NotFoundPage variant="provider" />;

  const loading = !p || !me || eligibility.isPending;
  return (
    <div className="max-w-content lg:pb-22 mx-auto flex w-full flex-col gap-4 px-4 pb-14 pt-6 sm:px-6 lg:gap-6 lg:px-8">
      <DiscardChangesGuard
        when={dirty && sentRef === null}
        title="Discard this request?"
        description="Your details won't be saved."
      />
      <BackLink to={`/providers/${id}`}>{p ? `Back to ${p.businessName}` : 'Back'}</BackLink>
      <header className="flex flex-col gap-1">
        <h1 className="text-title-md lg:text-title-lg text-text">Request a service</h1>
        {p && <p className="text-body text-text-muted">from {p.businessName}</p>}
      </header>
      <LoadingRegion loading={loading} skeleton={<RequestFormSkeleton />}>
        {p && me && (
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <div className="flex min-w-0 flex-col gap-6">
              <ProviderMiniRow
                profile={p}
                compact
                className="border-border bg-surface rounded-xl border p-4 lg:hidden"
              />
              {block.kind === 'card' ? (
                <BlockedCard block={block} />
              ) : (
                <RequestForm
                  profile={p}
                  me={me}
                  initialTownId={initialTownId(p.areas, loc)}
                  onServiceChange={setServiceId}
                  onDirtyChange={onDirtyChange}
                  onSent={setSentRef}
                />
              )}
              {block.kind === 'none' && (
                <WhatHappensNext businessName={p.businessName} className="lg:hidden" />
              )}
            </div>
            <RequestSummary profile={p} serviceId={serviceId} />
          </div>
        )}
      </LoadingRegion>
    </div>
  );
}
