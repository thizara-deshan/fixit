import type { ProviderPublicProfile } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { Stars } from '@/components/stars';
import { StatusPill } from '@/components/status-pill';
import { cn } from '@/lib/utils';

export function ProviderMiniRow({
  profile,
  compact = false,
  className,
}: {
  profile: ProviderPublicProfile;
  compact?: boolean;
  className?: string;
}) {
  const box = compact ? 'size-12' : 'size-14';
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      {profile.photoUrl ? (
        <img src={profile.photoUrl} alt="" className={cn(box, 'shrink-0 rounded-md object-cover')} />
      ) : (
        <span
          aria-hidden="true"
          className={cn(box, 'bg-primary-soft text-primary grid shrink-0 place-items-center rounded-md')}
        >
          <CategoryIcon icon={profile.category.icon} className="size-6" />
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-lead text-text truncate font-bold">{profile.businessName}</p>
        {!compact && <StatusPill kind="trust" verified={profile.verified} compact />}
        <Stars rating={profile.rating} count={profile.reviewCount} />
      </div>
    </div>
  );
}
