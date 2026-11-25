import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VerifiedBadge({
  size = 'md',
  className,
}: {
  size?: 'md' | 'sm';
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        'bg-success-soft text-success-text inline-flex shrink-0 items-center gap-1.5 rounded-full pr-2.5 font-bold',
        size === 'md' ? 'text-meta h-7 pl-1' : 'text-caption h-6 pl-1',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'bg-success text-primary-foreground grid place-items-center rounded-full',
          size === 'md' ? 'size-[18px]' : 'size-4',
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      Verified
    </span>
  );
}
