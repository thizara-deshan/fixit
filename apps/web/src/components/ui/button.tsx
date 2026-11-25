import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors disabled:pointer-events-none disabled:opacity-60 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        outline: 'border-[1.5px] border-primary bg-surface text-primary hover:bg-primary-soft',
        secondary: 'border border-border bg-surface text-text hover:bg-page',
        'danger-outline':
          'border-[1.5px] border-border bg-surface text-text hover:border-danger hover:text-danger-text',
        cta: 'bg-cta text-on-cta hover:bg-cta-hover',
        danger: 'bg-danger-text text-primary-foreground hover:bg-danger',
        ghost: 'text-text-muted hover:bg-page hover:text-text',
        link: 'text-primary hover:text-primary-hover',
      },
      size: {
        lg: 'h-12 px-6 text-body-sm font-bold', // 48: page/primary actions
        md: 'h-11 px-4 text-label font-semibold sm:h-10', // 40 (44 on phone)
        sm: 'h-11 rounded-sm px-3 text-meta font-semibold sm:h-[34px]', // 34 (44 on phone)
        icon: 'size-11', // 44 icon button
        inline: 'h-auto p-0 text-label font-semibold', // text link
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

function Button({
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
