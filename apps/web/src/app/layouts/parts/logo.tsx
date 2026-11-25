import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export function Logo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Fixit home"
      className={cn('inline-flex min-h-11 shrink-0 items-center gap-2.5', className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'text-title-xs grid size-[34px] place-items-center rounded-sm font-extrabold',
          inverse ? 'bg-surface text-primary' : 'bg-primary text-primary-foreground',
        )}
      >
        F
      </span>
      <span aria-hidden="true" className={cn('text-logo', inverse ? 'text-primary-foreground' : 'text-text')}>
        Fixit
      </span>
    </Link>
  );
}
