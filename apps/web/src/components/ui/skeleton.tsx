import * as React from 'react';
import { cn } from '@/lib/utils';

/** SPEC §6.1: placeholder-a block, 1.2 s opacity pulse (static under reduced motion via the global rule). Decorative. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-skeleton bg-placeholder-a rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
