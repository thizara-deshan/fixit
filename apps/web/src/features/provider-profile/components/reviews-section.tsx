import { Star } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonReviewRow } from '@/components/skeletons';
import { Stars } from '@/components/stars';
import { Button } from '@/components/ui/button';
import { formatRating, formatReviewDate, initialsOf } from '@/lib/format';
import { useProviderReviews } from '../hooks';
import { SectionCard } from './profile-sections';

interface ReviewsSectionProps {
  providerId: string;
  businessName: string;
  rating: number | null;
  reviewCount: number;
  className?: string;
}

export function ReviewsSection({
  providerId,
  businessName,
  rating,
  reviewCount,
  className,
}: ReviewsSectionProps) {
  const q = useProviderReviews(providerId, reviewCount > 0);
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const aside =
    reviewCount > 0 ? (
      <span className="text-body-sm text-text-subtle">
        <Star aria-hidden="true" className="text-star inline size-4 fill-current" strokeWidth={0} />{' '}
        <b className="text-text">{formatRating(rating, reviewCount)}</b> · {reviewCount} reviews
      </span>
    ) : undefined;

  let body;
  if (reviewCount === 0) {
    body = (
      <EmptyState
        icon={Star}
        title="No reviews yet"
        body={`${businessName} is new on Fixit. Reviews appear here after completed jobs.`}
        titleAs="h3"
        className="py-8"
      />
    );
  } else if (q.isError && !q.data) {
    body = (
      <SectionError
        onRetry={() => {
          void q.refetch();
        }}
      />
    );
  } else {
    body = (
      <LoadingRegion
        loading={q.isPending}
        skeleton={
          <>
            <SkeletonReviewRow />
            <SkeletonReviewRow />
            <SkeletonReviewRow />
          </>
        }
        className="flex flex-col gap-4"
      >
        <ul>
          {items.map((r) => (
            <li key={r.id} className="border-border flex gap-4 border-b py-4 last:border-b-0">
              <span
                aria-hidden="true"
                className="bg-primary-soft text-primary text-label grid size-11 shrink-0 place-items-center rounded-full font-extrabold"
              >
                {initialsOf(r.authorDisplayName.replace('.', ''))}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-body-sm text-text font-bold">{r.authorDisplayName}</p>
                  <time dateTime={r.createdAt} className="text-meta text-text-subtle">
                    {formatReviewDate(r.createdAt)}
                  </time>
                </div>
                <Stars rating={r.rating} count={1} showValue={false} size={14} />
                <p className="text-body-sm text-text-muted mt-1">{r.text}</p>
              </div>
            </li>
          ))}
        </ul>
        {q.isFetchNextPageError && (
          <SectionError
            onRetry={() => {
              void q.fetchNextPage();
            }}
          />
        )}
        {q.hasNextPage && !q.isFetchNextPageError && (
          <Button
            variant="secondary"
            className="self-start"
            onClick={() => {
              void q.fetchNextPage();
            }}
            disabled={q.isFetchingNextPage}
            aria-busy={q.isFetchingNextPage}
          >
            Show more reviews
          </Button>
        )}
      </LoadingRegion>
    );
  }

  return (
    <SectionCard id="reviews" title="Reviews" aside={aside} className={`scroll-mt-22 ${className ?? ''}`}>
      {body}
    </SectionCard>
  );
}
