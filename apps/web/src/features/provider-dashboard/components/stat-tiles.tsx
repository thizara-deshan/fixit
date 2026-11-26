import { CalendarCheck, CircleCheckBig, Inbox, Star, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import type { DashboardStats } from '@fixit/contracts';
import { SkeletonStatTile } from '@/components/skeletons';
import { features } from '@/lib/features';
import { formatCount, formatMonthName, formatRating } from '@/lib/format';
import { cn } from '@/lib/utils';

type Tint = 'warning' | 'primary' | 'success';
const TINT: Record<Tint, string> = {
  warning: 'bg-warning-soft text-warning-text',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
};
interface Tile {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  tint: Tint;
  to: string | null;
}

const GRID = 'grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4';
const BOX = 'border-border bg-surface flex h-full flex-col gap-3.5 rounded-xl border p-4 sm:p-5';

export function tilesFor(s: DashboardStats, now: Date): Tile[] {
  return [
    {
      label: 'New requests',
      value: String(s.pending),
      sub: 'awaiting reply',
      icon: Inbox,
      tint: 'warning',
      to: '/dashboard/requests?status=pending',
    },
    {
      label: 'Accepted',
      value: String(s.accepted),
      sub: 'upcoming jobs',
      icon: CalendarCheck,
      tint: 'primary',
      to: '/dashboard/requests?status=accepted',
    },
    {
      label: 'Completed this month',
      value: String(s.completedThisMonth),
      sub: `in ${formatMonthName(now)}`,
      icon: CircleCheckBig,
      tint: 'success',
      to: '/dashboard/requests?status=completed',
    },
    {
      label: 'Average rating',
      value: formatRating(s.rating, s.reviewCount),
      sub:
        s.reviewCount === 0
          ? 'no reviews yet'
          : `★ ${formatCount(s.reviewCount)} ${s.reviewCount === 1 ? 'review' : 'reviews'}`,
      icon: Star,
      tint: 'warning',
      to: features.providerReviews ? '/dashboard/reviews' : null,
    },
  ];
}

function TileBody({ t }: { t: Tile }) {
  const Icon = t.icon;
  return (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="text-label text-text-muted font-semibold">{t.label}</span>
        <span
          aria-hidden="true"
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-sm sm:size-10 sm:rounded-md',
            TINT[t.tint],
          )}
        >
          <Icon className="size-5" />
        </span>
      </span>
      <span className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
        <span className="text-stat text-text">{t.value}</span>
        <span className="text-meta text-text-subtle">{t.sub}</span>
      </span>
    </>
  );
}

/** S20.E6. */
export function StatTiles({ stats, now }: { stats: DashboardStats; now: Date }) {
  return (
    <ul className={GRID} aria-label="Summary">
      {tilesFor(stats, now).map((t) => (
        <li key={t.label}>
          {t.to ? (
            <Link to={t.to} className={cn(BOX, 'hover:shadow-hover transition-shadow')}>
              <TileBody t={t} />
            </Link>
          ) : (
            <div className={BOX}>
              <TileBody t={t} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function StatTilesSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonStatTile key={i} />
      ))}
    </div>
  );
}
