import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** SPEC §6.1: every skeleton has the same box as the real component. */
const card = 'rounded-xl border border-border bg-surface';

export function SkeletonCategoryCard() {
  return (
    <div className={cn(card, 'flex flex-col gap-3 p-4 sm:p-5')}>
      <Skeleton className="h-10 w-11 rounded-lg sm:h-12 sm:w-[52px]" />
      <Skeleton className="h-[17px] w-3/5" />
      <Skeleton className="h-3.5 w-4/5" />
    </div>
  );
}

export function SkeletonFeaturedCard() {
  return (
    <div className={cn(card, 'overflow-hidden')}>
      <Skeleton className="h-[180px] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-[19px] w-2/3" />
        <Skeleton className="h-3.5 w-1/2" />
        <div className="border-border my-2 border-t" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonResultCard() {
  return (
    <div className={cn(card, 'flex flex-col gap-4 p-5 sm:flex-row')}>
      <Skeleton className="size-[132px] shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-3.5 w-[30%]" />
        <Skeleton className="h-3.5 w-[70%]" />
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-10 w-[110px] rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonProfileHeader() {
  return (
    <div className="border-border bg-surface flex flex-col gap-6 rounded-3xl border p-6 lg:flex-row">
      <Skeleton className="size-[220px] max-w-full rounded-lg" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-10 w-3/5" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
}

const LINE_WIDTHS = ['w-full', 'w-11/12', 'w-4/5', 'w-2/3', 'w-3/4'] as const;

export function SkeletonSectionCard({ lines = 4 }: { lines?: number }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-6">
      <Skeleton className="h-5 w-[30%]" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3.5', LINE_WIDTHS[i % LINE_WIDTHS.length])} />
      ))}
    </div>
  );
}

export function SkeletonStatTile() {
  return (
    <div className={cn(card, 'flex flex-col gap-4 p-5')}>
      <div className="flex justify-between">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="size-10 rounded-md" />
      </div>
      <Skeleton className="h-10 w-[60px]" />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  const middle = Math.max(columns - 2, 0);
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="border-border flex items-center gap-6 border-t px-6 py-4">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          {Array.from({ length: middle }, (_, c) => (
            <div key={c} className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-24" />
              {c < middle - 1 && <Skeleton className="h-3 w-16" />}
            </div>
          ))}
          <Skeleton className="ml-auto h-7 w-[90px] rounded-full" />
        </div>
      ))}
    </>
  );
}

export function SkeletonPhoneCards({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn(card, 'flex flex-col gap-2 p-4')}>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3.5 w-2/5" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonReviewRow() {
  return (
    <div className="flex gap-4 py-4">
      <Skeleton className="size-11 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>
    </div>
  );
}
