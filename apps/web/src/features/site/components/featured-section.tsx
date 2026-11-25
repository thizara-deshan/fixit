import type { UseQueryResult } from '@tanstack/react-query';
import type { ProviderCard } from '@fixit/contracts';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonFeaturedCard } from '@/components/skeletons';
import { FeaturedCard } from './featured-card';
import { SectionHeader } from './section-header';

const GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4';

export function FeaturedSection({ query }: { query: UseQueryResult<ProviderCard[]> }) {
  if (query.isSuccess && query.data.length === 0) return null; // S1.E9: hidden when 0 qualify
  return (
    <section aria-labelledby="featured-providers" className="flex flex-col gap-6">
      <SectionHeader
        id="featured-providers"
        title="Featured providers near you"
        sub="Highly rated, verified pros in the Western Province."
        link={{ label: 'See all providers', to: '/discover' }}
      />
      {query.isError ? (
        <SectionError
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <LoadingRegion
          loading={query.isPending}
          skeleton={
            <div className={GRID}>
              {Array.from({ length: 4 }, (_, i) => (
                <SkeletonFeaturedCard key={i} />
              ))}
            </div>
          }
        >
          <ul className={GRID}>
            {query.data?.map((p) => (
              <li key={p.id}>
                <FeaturedCard provider={p} />
              </li>
            ))}
          </ul>
        </LoadingRegion>
      )}
    </section>
  );
}
