import type { Role } from '@fixit/contracts';
import { cn } from '@/lib/utils';

/** SPEC §2.2 role pills: Customer (muted) and, for providers, Provider (primary). */
export function RolePills({ roles, compact }: { roles: Role[]; compact?: boolean }) {
  const base = cn(
    'inline-flex items-center rounded-full font-bold',
    compact ? 'text-caption h-6 px-2.5' : 'text-meta h-7 px-3',
  );
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      <span className={cn(base, 'bg-surface-muted text-text-muted')}>Customer</span>
      {roles.includes('provider') && (
        <span className={cn(base, 'bg-primary-soft text-primary')}>Provider</span>
      )}
    </span>
  );
}
