import { Award, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import type { ProviderCard } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { Stars } from '@/components/stars';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { formatRating, priceParts } from '@/lib/format';

export function ResultCard({ provider: p }: { provider: ProviderCard }) {
  const price = priceParts(p.startingPrice.amount, p.startingPrice.unit);
  const href = `/providers/${p.id}`;
  return (
    <article className="border-border bg-surface hover:border-border-strong hover:shadow-hover grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl border p-4 transition sm:grid-cols-[132px_minmax(0,1fr)_auto] sm:gap-5 sm:p-5">
      <div className="bg-primary-soft text-primary grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-md sm:row-span-2 sm:size-[132px] sm:rounded-lg">
        {p.photoUrl ? (
          <img src={p.photoUrl} alt="" className="size-full object-cover" />
        ) : (
          <CategoryIcon icon={p.category.icon} className="size-8 sm:size-12" />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 className="text-title-sm text-text">
          <Link
            to={href}
            className="hover:text-primary focus-visible:ring-primary rounded-xs focus-visible:outline-none focus-visible:ring-2"
          >
            {p.businessName}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill kind="trust" verified={p.verified} compact />
          {p.paused && <StatusPill kind="availability" compact />}
        </div>
        {p.reviewCount > 0 ? (
          <span className="flex flex-wrap items-center gap-x-2">
            <Stars rating={p.rating} count={p.reviewCount} size={14} showValue={false} />
            <span className="text-label text-text font-bold">{formatRating(p.rating, p.reviewCount)}</span>
            <span className="text-meta text-text-subtle">({p.reviewCount} reviews)</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="bg-primary-soft text-primary text-caption rounded-full px-2.5 py-0.5 font-bold">
              New
            </span>
            <span className="text-label text-text-subtle">No reviews yet</span>
          </span>
        )}
      </div>

      <div className="col-span-2 flex min-w-0 flex-col gap-2 sm:col-span-1 sm:col-start-2">
        <ul className="text-label text-text-muted flex flex-wrap gap-x-4 gap-y-1">
          <li className="flex items-center gap-1.5">
            <CategoryIcon icon={p.category.icon} className="text-icon-subtle size-4" />
            {p.category.name}
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="text-icon-subtle size-4" />
            {p.baseTown.name}
          </li>
          <li className="flex items-center gap-1.5">
            <Award aria-hidden="true" className="text-icon-subtle size-4" />
            {p.yearsExperience} yrs experience
          </li>
        </ul>
        <p className="text-body-sm text-text-subtle line-clamp-2">{p.bio}</p>
      </div>

      <div className="border-border col-span-2 flex items-center justify-between gap-3 border-t pt-3 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:w-[150px] sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <div className="flex flex-col sm:items-end">
          <span className="text-meta text-text-subtle">Starting at</span>
          <span className="whitespace-nowrap">
            <span className="text-price-lg text-text">{price.amount}</span>
            <span className="text-meta text-text-subtle font-medium">{price.suffix}</span>
          </span>
        </div>
        <Button asChild variant="outline" size="md" className="h-11">
          <Link to={href} aria-label={`View profile: ${p.businessName}`}>
            View profile
          </Link>
        </Button>
      </div>
    </article>
  );
}
