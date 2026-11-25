import { BadgeCheck } from 'lucide-react';
import { Link } from 'react-router';
import type { ProviderCard } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { Stars } from '@/components/stars';
import { HeroSearch } from './hero-search';

export function Hero({ floating }: { floating: ProviderCard | null }) {
  return (
    <section className="border-border bg-surface border-b">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:px-8 lg:pb-[88px] lg:pt-[72px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* S1.E1 */}
          <span className="bg-success-soft text-success-text text-meta inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 font-bold">
            <BadgeCheck aria-hidden="true" className="size-4" /> Verified pros across the Western Province
          </span>
          {/* S1.E2 */}
          <h1 className="text-display text-text text-balance">
            Trusted local help, <span className="text-primary">right when you need it.</span>
          </h1>
          {/* S1.E3 */}
          <p className="text-body text-text-muted sm:text-lead max-w-[560px]">
            Find reviewed plumbers, electricians, cleaners and more near you — compare them side by side and
            send a request in minutes.
          </p>
          <HeroSearch />
        </div>
        {/* S1.E6 */}
        <div className="relative mb-6 lg:mb-0">
          <div
            aria-hidden="true"
            className="bg-primary-soft lg:rounded-4xl h-[220px] rounded-2xl sm:h-[320px] lg:h-[520px]"
          />
          {/* Accepted card: hidden on phone */}
          <div
            aria-hidden="true"
            className="bg-surface shadow-float absolute right-6 top-6 hidden items-center gap-3 rounded-xl px-4 py-3 sm:flex"
          >
            <span className="bg-primary-soft text-primary text-meta inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-bold">
              <span className="bg-primary size-1.5 rounded-full" /> Accepted
            </span>
            <span className="text-meta text-text font-semibold">Your request was accepted</span>
          </div>
          {floating && (
            <Link
              to={`/providers/${floating.id}`}
              className="bg-surface shadow-float focus-visible:ring-primary absolute inset-x-3 -bottom-6 flex items-center gap-3 rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 lg:inset-x-auto lg:-left-10 lg:bottom-10 lg:w-[300px]"
            >
              {floating.photoUrl ? (
                <img src={floating.photoUrl} alt="" className="size-11 shrink-0 rounded-sm object-cover" />
              ) : (
                <span className="bg-primary-soft text-primary grid size-11 shrink-0 place-items-center rounded-sm">
                  <CategoryIcon icon={floating.category.icon} className="size-6" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="text-label text-text block truncate font-bold">{floating.businessName}</span>
                <Stars rating={floating.rating} count={floating.reviewCount} size={12} />
              </span>
              {floating.verified && (
                <BadgeCheck aria-label="Verified" className="text-success size-6 shrink-0" />
              )}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
