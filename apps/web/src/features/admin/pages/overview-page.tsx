import { useState } from 'react';
import { Ban, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonStatTile } from '@/components/skeletons';
import { formatDateLong } from '@/lib/format';
import { cn } from '@/lib/utils';
import { oldestSub } from '../copy';
import { useAdminOverview } from '../hooks';

const GRID = 'grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4';

interface TileProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  tint: string;
  to: string;
}

function AttentionTile({ label, value, sub, icon: Icon, tint, to }: TileProps) {
  return (
    <Link
      to={to}
      className="border-border bg-surface hover:shadow-hover focus-visible:ring-ring flex h-full flex-col gap-3.5 rounded-xl border p-4 focus-visible:outline-none focus-visible:ring-2 sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-label text-text-muted font-semibold">{label}</span>
        <span
          className={cn('grid size-9 shrink-0 place-items-center rounded-sm sm:size-10 sm:rounded-md', tint)}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <span className="text-stat text-text font-extrabold">{value}</span>
      <span className="text-meta text-text-subtle">{sub}</span>
    </Link>
  );
}

/** S30 (E1–E2 only; metrics are F-36, flag off). */
export function AdminOverviewPage() {
  const [now] = useState(() => new Date());
  const q = useAdminOverview();
  const a = q.data?.attention;
  return (
    <>
      <header className="flex flex-col gap-1.5">
        <p className="text-label text-text-subtle font-semibold">{formatDateLong(now)}</p>
        <h1 className="text-title-xl text-text">Overview</h1>
      </header>
      <section aria-labelledby="attention" className="flex flex-col gap-3">
        <h2 id="attention" className="text-title-md text-text">
          Needs attention
        </h2>
        {q.isError ? (
          <SectionError
            onRetry={() => {
              void q.refetch();
            }}
          />
        ) : (
          <LoadingRegion
            loading={q.isPending}
            className={GRID}
            skeleton={
              <>
                <SkeletonStatTile />
                <SkeletonStatTile />
              </>
            }
          >
            {a && (
              <>
                <AttentionTile
                  label="Waiting for verification"
                  value={String(a.pendingVerifications)}
                  sub={oldestSub(a.oldestPendingAt, now)}
                  icon={ShieldCheck}
                  tint="bg-warning-soft text-warning-text"
                  to="/admin/verifications"
                />
                <AttentionTile
                  label="Suspended accounts"
                  value={String(a.suspendedUsers)}
                  sub="in total"
                  icon={Ban}
                  tint="bg-danger-soft text-danger-text"
                  to="/admin/users?status=suspended"
                />
              </>
            )}
          </LoadingRegion>
        )}
      </section>
    </>
  );
}
