import { useEffect, useState, type SyntheticEvent } from 'react';
import { Search, SearchX } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { ModerationRow } from '@fixit/contracts';
import { ConflictDialog } from '@/components/conflict-dialog';
import { EmptyState } from '@/components/empty-state';
import { LoadingRegion } from '@/components/loading-region';
import { Pagination } from '@/components/pagination';
import { SectionError } from '@/components/section-error';
import { SegmentedTabLinks } from '@/components/segmented-tabs';
import { SkeletonReviewRow } from '@/components/skeletons';
import { Input } from '@/components/ui/input';
import { qk } from '@/lib/query-keys';
import { HideReviewDialog } from '../components/hide-review-dialog';
import { ModerationRowItem } from '../components/moderation-row';
import { RestoreReviewDialog } from '../components/restore-review-dialog';
import { CONFLICT } from '../copy';
import { useModeration } from '../hooks';
import { parseReviewsSearch, reviewsHref } from '../url-state';

const TABS = [
  { visibility: 'all', label: 'All' },
  { visibility: 'visible', label: 'Visible' },
  { visibility: 'hidden', label: 'Hidden' },
] as const;

/** S37. */
export function ReviewsModerationPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = parseReviewsSearch(sp);
  const list = useModeration(q);
  const [text, setText] = useState(q.q);
  const [hiding, setHiding] = useState<ModerationRow | null>(null);
  const [restoring, setRestoring] = useState<ModerationRow | null>(null);
  const [conflict, setConflict] = useState(false);
  useEffect(() => {
    setText(q.q); // Back/Forward
  }, [q.q]);

  const onSearch = (e: SyntheticEvent) => {
    e.preventDefault();
    void navigate(reviewsHref({ q: text, visibility: q.visibility }));
  };
  const onConflict = () => {
    setConflict(true);
    void qc.invalidateQueries({ queryKey: qk.admin.all });
  };

  const rows = list.data?.items ?? [];
  const empty =
    q.q !== '' ? (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={SearchX}
          title={`No reviews match "${q.q}"`}
          body="Check the spelling or try something else."
          action={{ label: 'Clear search', to: reviewsHref({ visibility: q.visibility }) }}
        />
      </div>
    ) : (
      <p className="text-body-sm text-text-subtle px-4 py-10 text-center">No reviews with this status.</p>
    );

  return (
    <>
      <header className="flex flex-col gap-1.5">
        <h1 className="text-title-xl text-text">Reviews</h1>
      </header>
      {list.isError ? (
        <SectionError
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : (
        <section aria-label="Reviews" className="border-border bg-surface overflow-hidden rounded-2xl border">
          <div className="border-border flex flex-col gap-3 border-b p-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
            <SegmentedTabLinks
              label="Filter by visibility"
              items={TABS.map((t) => ({
                value: t.visibility,
                label: t.label,
                to: reviewsHref({ q: q.q, visibility: t.visibility }),
                active: t.visibility === q.visibility,
              }))}
              className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
            />
            <form role="search" onSubmit={onSearch} className="relative w-full lg:w-[320px]">
              <Search
                aria-hidden="true"
                className="text-icon-subtle pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2"
              />
              <Input
                type="search"
                aria-label="Search reviews"
                placeholder="Search provider, author or text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                }}
                className="text-body h-11 pl-10 sm:h-10"
              />
            </form>
          </div>
          <LoadingRegion
            loading={list.isPending}
            skeleton={
              <div className="divide-border divide-y">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="p-4 sm:p-6">
                    <SkeletonReviewRow />
                  </div>
                ))}
              </div>
            }
          >
            {rows.length === 0 ? (
              empty
            ) : (
              <ul className="divide-border divide-y">
                {rows.map((r) => (
                  <ModerationRowItem key={r.id} row={r} onHide={setHiding} onRestore={setRestoring} />
                ))}
              </ul>
            )}
          </LoadingRegion>
          <Pagination
            page={q.page}
            totalPages={list.data?.totalPages ?? 0}
            hrefFor={(p) => reviewsHref({ ...q, page: p })}
            className="p-4 sm:px-6"
          />
        </section>
      )}
      {hiding && (
        <HideReviewDialog
          row={hiding}
          open
          onOpenChange={(o) => {
            if (!o) setHiding(null);
          }}
          onConflict={onConflict}
        />
      )}
      {restoring && (
        <RestoreReviewDialog
          row={restoring}
          open
          onOpenChange={(o) => {
            if (!o) setRestoring(null);
          }}
          onConflict={onConflict}
        />
      )}
      <ConflictDialog
        open={conflict}
        onOpenChange={setConflict}
        title={CONFLICT.review.title}
        body={CONFLICT.review.body}
      />
    </>
  );
}
