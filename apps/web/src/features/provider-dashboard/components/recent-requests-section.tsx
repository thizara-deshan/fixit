import { useState } from 'react';
import { ArrowRight, Inbox } from 'lucide-react';
import { Link } from 'react-router';
import type { ProviderRequestView } from '@fixit/contracts';
import { EmptyState } from '@/components/empty-state';
import { SectionError } from '@/components/section-error';
import { SegmentedTabs } from '@/components/segmented-tabs';
import { useInbox } from '../hooks';
import { ProviderRequestsList } from './provider-requests-list';

const TABS = ['all', 'pending', 'accepted', 'completed', 'declined'] as const;
type Tab = (typeof TABS)[number];
const LABEL: Record<Tab, string> = {
  all: 'All',
  pending: 'Pending',
  accepted: 'Accepted',
  completed: 'Completed',
  declined: 'Declined',
};
const MAX_ROWS = 8;

export function RecentRequestsSection({
  onAccept,
  onDecline,
}: {
  onAccept: (v: ProviderRequestView) => void;
  onDecline: (v: ProviderRequestView) => void;
}) {
  const [tab, setTab] = useState<Tab>('all');
  const list = useInbox({ status: tab, q: '', page: 1 });
  const counts = list.data?.counts;

  if (list.isError)
    return (
      <SectionError
        onRetry={() => {
          void list.refetch();
        }}
      />
    );
  if (counts?.all === 0)
    return (
      <EmptyState
        icon={Inbox}
        title="No requests yet"
        body="When customers send you a request, it shows up here and we email you."
        className="py-10"
      />
    );

  return (
    <section
      aria-labelledby="incoming-requests"
      className="border-border bg-surface overflow-hidden rounded-2xl border"
    >
      <div className="border-border flex flex-col gap-3 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <h2 id="incoming-requests" className="text-title-md text-text">
          Incoming service requests
        </h2>
        <SegmentedTabs
          label="Filter by status"
          items={TABS.map((t) => ({ value: t, label: LABEL[t], ...(counts ? { count: counts[t] } : {}) }))}
          value={tab}
          onValueChange={(v) => {
            const next = TABS.find((t) => t === v);
            if (next) setTab(next);
          }}
          className="-mx-4 px-4 sm:mx-0 sm:px-0"
        />
      </div>
      <div className="p-4 sm:p-0">
        <ProviderRequestsList
          caption="Incoming service requests"
          rows={(list.data?.items ?? []).slice(0, MAX_ROWS)}
          loading={list.isPending}
          onAccept={onAccept}
          onDecline={onDecline}
          empty={
            <p className="text-body-sm text-text-subtle px-4 py-10 text-center">
              No requests with this status.
            </p>
          }
        />
      </div>
      {(list.data?.total ?? 0) > MAX_ROWS && (
        <div className="border-border border-t px-4 py-2 sm:px-6 sm:py-4">
          <Link
            to="/dashboard/requests"
            className="text-label text-primary hover:text-primary-hover inline-flex min-h-11 items-center gap-1 font-bold sm:min-h-0"
          >
            View all requests
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
        </div>
      )}
    </section>
  );
}
