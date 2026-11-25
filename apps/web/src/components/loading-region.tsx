import type { ReactNode } from 'react';
import { useDelayedFlag } from '@/lib/use-delayed-flag';

interface LoadingRegionProps {
  loading: boolean;
  /** Same box as the final content (SPEC §6.1). Shown only after 150 ms. */
  skeleton: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function LoadingRegion({ loading, skeleton, children, className }: LoadingRegionProps) {
  const showSkeleton = useDelayedFlag(loading);
  return (
    <div aria-busy={loading} className={className}>
      {loading ? (
        <>
          {showSkeleton && skeleton}
          <span className="sr-only">Loading…</span>
        </>
      ) : (
        children
      )}
    </div>
  );
}
