import { useEffect, useState, type SyntheticEvent } from 'react';
import { Inbox, Search, SearchX } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import type { InboxStatus } from '@fixit/contracts';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { SectionError } from '@/components/section-error';
import { SegmentedTabLinks } from '@/components/segmented-tabs';
import { Input } from '@/components/ui/input';
import { useInbox } from '../hooks';
import { inboxHref, parseInboxSearch } from '../inbox-search';
import { ProviderRequestsList } from '../components/provider-requests-list';
import { useRequestActions } from '../components/request-actions';

const TABS: readonly InboxStatus[] = [
  'all',
  'pending',
  'accepted',
  'completed',
  'declined',
  'cancelled',
  'expired',
];
const LABEL: Record<InboxStatus, string> = {
  all: 'All',
  pending: 'Pending',
  accepted: 'Accepted',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

/** S21. */
export function ProviderRequestsPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const q = parseInboxSearch(sp);
  const list = useInbox(q);
  const actions = useRequestActions();
  const [text, setText] = useState(q.q);
  useEffect(() => {
    setText(q.q); // Back/Forward
  }, [q.q]);
  const counts = list.data?.counts;

  const onSearch = (e: SyntheticEvent) => {
    e.preventDefault();
    void navigate(inboxHref({ status: q.status, q: text }));
  };

  let body;
  if (list.isError)
    body = (
      <SectionError
        onRetry={() => {
          void list.refetch();
        }}
      />
    );
  else if (q.q === '' && counts?.all === 0)
    body = (
      <EmptyState
        icon={Inbox}
        title="No requests yet"
        body="When customers send you a request, it shows up here and we email you."
      />
    );
  else
    body = (
      <section aria-label="Requests" className="border-border bg-surface overflow-hidden rounded-2xl border">
        <div className="border-border flex flex-col gap-3 border-b p-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
          <SegmentedTabLinks
            label="Filter by status"
            items={TABS.map((s) => ({
              value: s,
              label: LABEL[s],
              ...(counts ? { count: counts[s] } : {}),
              to: inboxHref({ status: s, q: q.q }),
              active: s === q.status,
            }))}
            className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          />
          <form role="search" onSubmit={onSearch} className="relative w-full lg:w-[260px]">
            <Search
              aria-hidden="true"
              className="text-icon-subtle pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2"
            />
            <Input
              type="search"
              aria-label="Search requests"
              placeholder="Search by name or reference"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
              className="text-body h-11 pl-10 sm:h-10"
            />
          </form>
        </div>
        {q.q !== '' && counts?.all === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={SearchX}
              title={`No requests match "${q.q}".`}
              body="Check the spelling or try something else."
              action={{ label: 'Clear search', to: inboxHref({ status: q.status }) }}
            />
          </div>
        ) : (
          <div className="p-4 sm:p-0">
            <ProviderRequestsList
              caption="Requests"
              rows={list.data?.items ?? []}
              loading={list.isPending}
              showReplyBy
              onAccept={actions.openAccept}
              onDecline={actions.openDecline}
              empty={
                <p className="text-body-sm text-text-subtle px-4 py-10 text-center">
                  No requests with this status.
                </p>
              }
            />
          </div>
        )}
        <Pagination
          page={q.page}
          totalPages={list.data?.totalPages ?? 0}
          hrefFor={(p) => inboxHref({ status: q.status, q: q.q, page: p })}
          className="p-4 sm:px-6"
        />
      </section>
    );

  return (
    <>
      <header className="flex flex-col gap-1.5">
        <h1 className="text-title-xl text-text">Requests</h1>
        <p className="text-body text-text-muted">Every request customers have sent you.</p>
      </header>
      {body}
      {actions.dialogs}
    </>
  );
}
