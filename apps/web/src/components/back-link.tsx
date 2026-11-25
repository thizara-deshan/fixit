import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export function BackLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'text-body-sm text-text-muted hover:text-primary inline-flex min-h-11 items-center gap-2 self-start font-semibold transition-colors sm:min-h-0',
        className,
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
      {children}
    </Link>
  );
}
