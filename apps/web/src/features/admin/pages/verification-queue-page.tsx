import { useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import type { VerificationQueueRow } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { DataList, type DataListColumn } from '@/components/data-list';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { SectionError } from '@/components/section-error';
import { SegmentedTabLinks } from '@/components/segmented-tabs';
import { Button } from '@/components/ui/button';
import { formatDayMonth, formatDaysAgo } from '@/lib/format';
import { attemptLabel, triggerNote } from '../copy';
import { useVerificationQueue } from '../hooks';
import { parseQueueSearch, queueHref } from '../url-state';

const TABS = [
  { status: 'pending_review', label: 'Pending review' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
] as const;

/** S31. */
export function VerificationQueuePage() {
  const [sp] = useSearchParams();
  const q = parseQueueSearch(sp);
  const list = useVerificationQueue(q);
  const [now] = useState(() => new Date());

  const columns: DataListColumn<VerificationQueueRow>[] = [
    {
      id: 'provider',
      header: 'Provider',
      card: 'title',
      cell: (r) => (
        <span className="flex items-center gap-3">
          {r.provider.photoUrl ? (
            <img src={r.provider.photoUrl} alt="" className="size-9 rounded-full object-cover" />
          ) : (
            <span className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-full">
              <CategoryIcon icon={r.provider.category.icon} className="size-5" />
            </span>
          )}
          <span className="min-w-0">
            <span className="text-body-sm text-text block truncate font-bold">{r.provider.businessName}</span>
            <span className="text-meta text-text-subtle block truncate">{r.provider.ownerName}</span>
          </span>
        </span>
      ),
    },
    { id: 'category', header: 'Category', card: 'meta', cell: (r) => r.provider.category.name },
    {
      id: 'submitted',
      header: 'Submitted',
      card: 'meta',
      cell: (r) => (
        <span>
          {formatDayMonth(r.submittedAt)}
          <span className="text-meta text-text-subtle block">{formatDaysAgo(r.submittedAt, now)}</span>
        </span>
      ),
    },
    {
      id: 'attempt',
      header: 'Attempt',
      card: 'meta',
      cell: (r) => {
        const note = triggerNote(r.trigger);
        return (
          <span>
            {attemptLabel(r.attempt)}
            {note && <span className="text-meta text-text-subtle block">{note}</span>}
          </span>
        );
      },
    },
    {
      id: 'action',
      header: 'Action',
      card: 'actions',
      cell: (r) => (
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link to={`/admin/verifications/${r.id}`}>Review</Link>
        </Button>
      ),
    },
  ];

  const empty =
    q.status === 'pending_review' ? (
      <div className="p-4 sm:p-6">
        <EmptyState icon={CircleCheck} title="Nothing to review" body="New submissions show up here." />
      </div>
    ) : (
      <p className="text-body-sm text-text-subtle px-4 py-10 text-center">No submissions with this status.</p>
    );

  return (
    <>
      <header className="flex flex-col gap-1.5">
        <h1 className="text-title-xl text-text">Verification</h1>
        <p className="text-body text-text-muted">
          Check providers&apos; documents and approve or reject them.
        </p>
      </header>
      {list.isError ? (
        <SectionError
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : (
        <section
          aria-label="Verification queue"
          className="border-border bg-surface overflow-hidden rounded-2xl border"
        >
          <div className="border-border flex flex-col gap-3 border-b p-4 sm:px-6 sm:py-5">
            <SegmentedTabLinks
              label="Filter by status"
              items={TABS.map((t) => ({
                value: t.status,
                label: t.label,
                to: queueHref({ status: t.status }),
                active: t.status === q.status,
              }))}
              className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
            />
          </div>
          <div className="p-4 sm:p-0">
            <DataList
              caption="Verification queue"
              rows={list.data?.items ?? []}
              columns={columns}
              getRowKey={(r) => r.id}
              rowHref={(r) => `/admin/verifications/${r.id}`}
              rowLabel={(r) => r.provider.businessName}
              loading={list.isPending}
              empty={empty}
            />
          </div>
          <Pagination
            page={q.page}
            totalPages={list.data?.totalPages ?? 0}
            hrefFor={(p) => queueHref({ status: q.status, page: p })}
            className="p-4 sm:px-6"
          />
        </section>
      )}
    </>
  );
}
