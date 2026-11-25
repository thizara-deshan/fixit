import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-border bg-surface text-body text-text placeholder:text-text-subtle focus-visible:border-primary aria-invalid:border-danger min-h-28 w-full rounded-md border-[1.5px] px-3 py-3 disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
