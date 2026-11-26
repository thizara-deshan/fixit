import { Link } from 'react-router';
import type { CustomerRequestView } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { Stars } from '@/components/stars';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';

/** S15.E3. */
export function ProviderAsideCard({ provider }: { provider: CustomerRequestView['provider'] }) {
  return (
    <aside className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 lg:sticky lg:top-24">
      <div className="flex min-w-0 items-center gap-3">
        {provider.photoUrl ? (
          <img src={provider.photoUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="bg-primary-soft text-primary grid size-14 shrink-0 place-items-center rounded-xl"
          >
            <CategoryIcon icon={provider.categoryIcon} className="size-6" />
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-title-sm text-text truncate">{provider.businessName}</p>
          {provider.verified && <StatusPill kind="trust" verified compact />}
          <Stars rating={provider.rating} count={provider.reviewCount} />
        </div>
      </div>
      {provider.listed ? (
        <Button asChild variant="secondary" size="md" className="w-full">
          <Link to={`/providers/${provider.id}`}>View profile</Link>
        </Button>
      ) : (
        <p className="text-meta text-text-subtle">No longer on Fixit</p>
      )}
    </aside>
  );
}
