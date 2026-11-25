import { MapPin } from 'lucide-react';
import { Link } from 'react-router';
import type { ProviderCard } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { Stars } from '@/components/stars';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/verified-badge';
import { priceParts } from '@/lib/format';

export function FeaturedCard({ provider }: { provider: ProviderCard }) {
  const price = priceParts(provider.startingPrice.amount, provider.startingPrice.unit);
  return (
    <article className="border-border bg-surface hover:shadow-hover flex h-full flex-col overflow-hidden rounded-xl border transition">
      <div className="relative h-40 sm:h-[180px]">
        {provider.photoUrl ? (
          <img src={provider.photoUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="bg-primary-soft text-primary grid size-full place-items-center">
            <CategoryIcon icon={provider.category.icon} className="size-12" />
          </div>
        )}
        {provider.verified && <VerifiedBadge size="sm" className="shadow-badge absolute left-3 top-3" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-title-xs text-text">
          <Link
            to={`/providers/${provider.id}`}
            className="hover:text-primary focus-visible:ring-primary rounded-xs focus-visible:outline-none focus-visible:ring-2"
          >
            {provider.businessName}
          </Link>
        </h3>
        <p className="text-meta text-text-subtle flex items-center gap-1">
          {provider.category.name} · <MapPin aria-hidden="true" className="text-icon-subtle size-3.5" />{' '}
          {provider.baseTown.name}
        </p>
        <Stars rating={provider.rating} count={provider.reviewCount} size={13} />
        <div className="border-border mt-auto flex items-end justify-between gap-3 border-t pt-3">
          <div className="flex flex-col">
            <span className="text-meta text-text-subtle" aria-hidden={price.lead === null}>
              {price.lead ?? ' '}
            </span>
            <span className="whitespace-nowrap">
              <span className="text-title-xs text-text font-extrabold">{price.amount}</span>
              <span className="text-meta text-text-subtle font-medium">{price.suffix}</span>
            </span>
          </div>
          <Button asChild variant="outline" size="md">
            <Link to={`/providers/${provider.id}`} aria-label={`View profile: ${provider.businessName}`}>
              View profile
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
