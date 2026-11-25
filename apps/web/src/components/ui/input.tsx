import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-border bg-surface text-body text-text placeholder:text-text-subtle focus-visible:border-primary aria-invalid:border-danger h-12 w-full min-w-0 rounded-md border-[1.5px] px-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
