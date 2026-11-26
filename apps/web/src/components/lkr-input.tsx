import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Text input with a fixed `LKR` prefix (agreed price, service price). Text (not type=number) so `6,500` and `6.5` reach validation with the SPEC message. */
export function LkrInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="text-label text-text-muted pointer-events-none absolute inset-y-0 left-3 flex items-center font-semibold"
      >
        LKR
      </span>
      <Input inputMode="numeric" autoComplete="off" className={cn('text-body pl-14', className)} {...props} />
    </div>
  );
}
