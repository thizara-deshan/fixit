import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonCategoryCard } from '@/components/skeletons';
import { useCatalog } from '../hooks';
import { CategoryCard } from './category-card';
import { SectionHeader } from './section-header';

const GRID = 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4';

export function CategoriesSection() {
  const catalog = useCatalog();
  return (
    <section aria-labelledby="popular-services" className="flex flex-col gap-6">
      <SectionHeader
        id="popular-services"
        title="Popular services"
        sub="Pick a category to see pros available near you."
        link={{ label: 'All services', to: '/discover' }}
      />
      {catalog.isError ? (
        <SectionError
          onRetry={() => {
            void catalog.refetch();
          }}
        />
      ) : (
        <LoadingRegion
          loading={catalog.isPending}
          skeleton={
            <div className={GRID}>
              {Array.from({ length: 8 }, (_, i) => (
                <SkeletonCategoryCard key={i} />
              ))}
            </div>
          }
        >
          <ul className={GRID}>
            {catalog.data?.categories.map((c) => (
              <li key={c.id}>
                <CategoryCard category={c} />
              </li>
            ))}
          </ul>
        </LoadingRegion>
      )}
    </section>
  );
}
