import { Inbox } from 'lucide-react';
import { useSearchParams } from 'react-router';
import type { RequestStatusGroup } from '@fixit/contracts';
import { CustomerPageHeader } from '@/app/layouts/customer-layout';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { SectionError } from '@/components/section-error';
import { SegmentedTabLinks, type SegmentedTabItem } from '@/components/segmented-tabs';
import { MyRequestsList } from '../components/my-requests-list';
import { useMyRequests } from '../hooks';
import { listHref, parseListSearch } from '../list-search';

const TAB_LABEL: Record<RequestStatusGroup, string> = {
  all: 'All',
  open: 'Open',
  completed: 'Completed',
  closed: 'Closed',
};

/** S14. */
export function MyRequestsPage() {
  const [sp] = useSearchParams();
  const q = parseListSearch(sp);
  const list = useMyRequests(q);
  const counts = list.data?.counts;
  const tabs: SegmentedTabItem[] = (['all', 'open', 'completed', 'closed'] as const).map((g) => ({
    value: g,
    label: TAB_LABEL[g],
    ...(counts ? { count: counts[g] } : {}),
    to: listHref(g),
    active: g === q.status,
  }));

  let body;
  if (list.isError) {
    body = (
      <SectionError
        onRetry={() => {
          void list.refetch();
        }}
      />
    );
  } else if (counts?.all === 0) {
    body = (
      <EmptyState
        icon={Inbox}
        title="No requests yet"
        body="Find a provider and send your first request."
        action={{ label: 'Find providers', to: '/discover' }}
      />
    );
  } else {
    body = (
      <section className="border-border bg-surface overflow-hidden rounded-2xl border">
        <div className="border-border flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <h2 className="text-title-md text-text">{TAB_LABEL[q.status]}</h2>
          <SegmentedTabLinks
            label="Filter by status"
            items={tabs}
            className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          />
        </div>
        <div className="p-4 sm:p-0">
          <MyRequestsList
            rows={list.data?.items ?? []}
            loading={list.isPending}
            empty={
              <p className="text-body-sm text-text-subtle px-4 py-10 text-center">
                No requests with this status.
              </p>
            }
          />
        </div>
        <Pagination
          page={q.page}
          totalPages={list.data?.totalPages ?? 0}
          hrefFor={(p) => listHref(q.status, p)}
          className="p-4 sm:px-6"
        />
      </section>
    );
  }

  return (
    <>
      <CustomerPageHeader title="My requests" subtitle="Track the requests you've sent." tabs />
      {body}
    </>
  );
}
