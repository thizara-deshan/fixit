import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Tel input with a fixed `+94` prefix. The value is what the user typed; forms parse it with `MobileInput`. */
export function PhoneInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="text-body text-text-muted pointer-events-none absolute inset-y-0 left-3 flex items-center font-medium"
      >
        +94
      </span>
      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="77 123 4567"
        className={cn('pl-12', className)}
        {...props}
      />
    </div>
  );
}
