import type { MouseEvent } from 'react';
import { Award, MapPin } from 'lucide-react';
import type { ProviderPublicProfile } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { PriceLabel } from '@/components/price-label';
import { Stars } from '@/components/stars';
import { formatRating } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { RequestAction } from '../request-action';
import { RequestActionBlock } from './request-action-block';
import { VerifiedTip } from './verified-tip';

function Photo({ profile, className }: { profile: ProviderPublicProfile; className: string }) {
  if (profile.photoUrl) {
    return (
      <img src={profile.photoUrl} alt={profile.businessName} className={cn('object-cover', className)} />
    );
  }
  return (
    <div
      role="img"
      aria-label={profile.businessName}
      className={cn('bg-primary-soft text-primary grid place-items-center', className)}
    >
      <CategoryIcon icon={profile.category.icon} className="size-10 lg:size-16" />
    </div>
  );
}

const scrollToReviews = (e: MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault();
  document.getElementById('reviews')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });
};

/** S3.E6: also used by the phone sticky bar. */
export function PriceBlock({ profile }: { profile: ProviderPublicProfile }) {
  return (
    <div>
      <p className="text-caption text-text-subtle font-medium normal-case">Starting at</p>
      <PriceLabel
        variant="short"
        amount={profile.startingPrice.amount}
        unit={profile.startingPrice.unit}
        amountClassName="text-price-xl"
      />
    </div>
  );
}

export function ProfileHeader({
  profile,
  action,
}: {
  profile: ProviderPublicProfile;
  action: RequestAction;
}) {
  const count = profile.reviewCount;
  return (
    <section
      aria-labelledby="provider-name"
      className="border-border bg-surface grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-2xl border p-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-x-8 sm:rounded-3xl sm:p-7 lg:grid-cols-[220px_minmax(0,1fr)_auto]"
    >
      <Photo profile={profile} className="size-[88px] rounded-xl sm:row-span-2 sm:size-40 lg:size-[220px]" />
      <div className="flex min-w-0 flex-col justify-center gap-1 sm:justify-end">
        <p className="text-label text-primary inline-flex items-center gap-1.5 font-semibold">
          <CategoryIcon icon={profile.category.icon} className="size-4" />
          {profile.category.name}
        </p>
        <h1 id="provider-name" className="text-title-xl text-text break-words">
          {profile.businessName}
        </h1>
      </div>
      <div className="col-span-2 flex flex-col gap-3 sm:col-span-1 sm:col-start-2">
        <p className="text-body-sm text-text-muted">Owned &amp; run by {profile.ownerName}</p>
        <ul className="text-body-sm text-text-muted flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
          <li className="inline-flex items-center gap-2">
            {count > 0 ? (
              <>
                <Stars rating={profile.rating} count={count} showValue={false} size={16} />
                <span className="text-text font-bold">{formatRating(profile.rating, count)}</span>
                <a
                  href="#reviews"
                  onClick={scrollToReviews}
                  className="text-text hover:text-primary underline underline-offset-2"
                >
                  {count} {count === 1 ? 'review' : 'reviews'}
                </a>
              </>
            ) : (
              <>
                <span className="bg-primary-soft text-primary text-meta rounded-full px-2.5 py-0.5 font-bold">
                  New
                </span>
                <span>No reviews yet</span>
              </>
            )}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="text-icon-subtle size-4" />
            {profile.baseTown.name}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Award aria-hidden="true" className="text-icon-subtle size-4" />
            {profile.yearsExperience} years experience
          </li>
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          {profile.verified ? (
            <VerifiedTip />
          ) : (
            <span className="bg-surface-muted text-text-muted text-meta inline-flex h-7 items-center rounded-full px-3 font-semibold">
              Not yet verified
            </span>
          )}
          {profile.paused && (
            <span className="bg-warning-soft text-warning-text text-meta inline-flex h-7 items-center rounded-full px-3 font-bold">
              Not taking requests
            </span>
          )}
        </div>
      </div>
      <div className="border-border col-span-2 hidden flex-col gap-4 border-t pt-5 sm:flex lg:col-span-1 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:w-[240px] lg:justify-center lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <PriceBlock profile={profile} />
        <RequestActionBlock action={action} helperId="request-helper-header" />
      </div>
    </section>
  );
}
