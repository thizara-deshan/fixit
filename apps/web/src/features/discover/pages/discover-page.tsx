import { useEffect, useRef } from 'react';
import { SearchX } from 'lucide-react';
import { useLocation } from 'react-router';
import { EmptyState } from '@/components/empty-state';
import { LoadingRegion } from '@/components/loading-region';
import { Pagination } from '@/components/pagination';
import { SectionError } from '@/components/section-error';
import { SkeletonResultCard } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';
import { rememberDiscover } from '@/lib/last-discover';
import { useCatalog } from '@/features/site/hooks';
import { contextLine, resultsTitle } from '../copy';
import { DiscoverSearchBar } from '../components/discover-search-bar';
import { FilterPanel } from '../components/filter-panel';
import { FiltersSheet } from '../components/filters-sheet';
import { ResultCard } from '../components/result-card';
import { ResultsHeading, SortSelect } from '../components/results-header';
import { useDiscover } from '../hooks';
import { appliedFilterCount, tickedCategories, useDiscoverParams } from '../url-state';

export function DiscoverPage() {
  const { data: catalog } = useCatalog();
  const categories = catalog?.categories;
  const nav = useDiscoverParams(categories ?? []);
  const { state } = nav;
  const result = useDiscover(state);
  const location = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    rememberDiscover(location.search); // D-7
  }, [location.search]);

  // Page links scroll to the results heading (S2.E12); not on first render.
  const prevPage = useRef(state.page);
  useEffect(() => {
    if (prevPage.current !== state.page) headingRef.current?.scrollIntoView({ block: 'start' });
    prevPage.current = state.page;
  }, [state.page]);

  const data = result.data;
  const cats = categories ?? [];
  const ticked = tickedCategories(state, cats);
  const groups = {
    catalog: catalog ?? { categories: [], districts: [], towns: [] },
    state,
    ticked,
    counts: data?.categoryCounts,
    onToggleCategory: nav.toggleCategory,
    onChange: nav.setFilter,
  };

  return (
    <>
      <div className="border-border bg-surface border-b">
        <div className="mx-auto max-w-[1240px] px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
          <DiscoverSearchBar
            key={state.q ?? ''}
            catalog={catalog}
            q={state.q}
            loc={state.loc}
            onSearch={nav.newSearch}
            onLocationChange={(loc) => {
              nav.setFilter({ loc });
            }}
          />
        </div>
      </div>
      <div className="mx-auto grid max-w-[1240px] gap-5 px-4 pb-14 pt-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:pb-[88px] lg:pt-8">
        <FilterPanel {...groups} onClearAll={nav.clearAll} />
        <section aria-labelledby="discover-results" className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {data && catalog ? (
              <ResultsHeading
                ref={headingRef}
                id="discover-results"
                title={resultsTitle(data.total)}
                context={contextLine(state, catalog)}
              />
            ) : (
              <Skeleton id="discover-results" className="h-8 w-56" />
            )}
            <div className="hidden lg:block">
              <SortSelect
                value={state.sort}
                onChange={(sort) => {
                  nav.setFilter({ sort });
                }}
              />
            </div>
          </div>
          <div className="border-border bg-surface top-nav sticky z-10 -mx-4 grid grid-cols-2 gap-3 border-b px-4 py-2 sm:-mx-6 sm:px-6 lg:hidden">
            <FiltersSheet
              {...groups}
              badge={appliedFilterCount(state, cats)}
              total={data?.total}
              onClearAll={nav.clearAll}
            />
            <SortSelect
              className="w-full"
              value={state.sort}
              onChange={(sort) => {
                nav.setFilter({ sort });
              }}
            />
          </div>
          {result.isError && !data ? (
            <SectionError
              onRetry={() => {
                void result.refetch();
              }}
            />
          ) : (
            <LoadingRegion
              loading={result.isPending}
              skeleton={
                <div className="flex flex-col gap-5">
                  {[0, 1, 2, 3].map((i) => (
                    <SkeletonResultCard key={i} />
                  ))}
                </div>
              }
            >
              {result.isError && (
                <SectionError
                  onRetry={() => {
                    void result.refetch();
                  }}
                />
              )}
              {data &&
                (data.total === 0 ? (
                  <EmptyState
                    icon={SearchX}
                    title="No providers match your filters"
                    body="Try another location or loosen the rating and price filters."
                    action={{ label: 'Clear filters', onClick: nav.clearAll }}
                  />
                ) : (
                  <>
                    <ul aria-busy={result.isFetching} className="flex flex-col gap-3 sm:gap-5">
                      {data.items.map((p) => (
                        <li key={p.id}>
                          <ResultCard provider={p} />
                        </li>
                      ))}
                    </ul>
                    <Pagination
                      page={data.page}
                      totalPages={data.totalPages}
                      hrefFor={nav.hrefForPage}
                      className="mt-3"
                    />
                  </>
                ))}
            </LoadingRegion>
          )}
        </section>
      </div>
    </>
  );
}
