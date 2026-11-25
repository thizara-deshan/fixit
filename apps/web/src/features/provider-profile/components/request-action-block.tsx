import { Pencil, Send } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { RequestAction } from '../request-action';

export function RequestActionBlock({
  action,
  helperId,
  className,
}: {
  action: RequestAction;
  helperId: string;
  className?: string;
}) {
  if (action.kind === 'hidden') return null;
  if (action.kind === 'loading') return <Skeleton className={cn('h-12 w-full rounded-md', className)} />;
  const helper = 'helper' in action ? action.helper : null;
  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      {action.kind === 'request' && (
        <Button asChild size="lg" className="w-full">
          <Link to={action.to}>
            <Send aria-hidden="true" />
            Request Service
          </Link>
        </Button>
      )}
      {action.kind === 'disabled' && (
        <Button size="lg" className="w-full" disabled aria-describedby={helperId}>
          <Send aria-hidden="true" />
          Request Service
        </Button>
      )}
      {action.kind === 'edit' && (
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link to={action.to}>
            <Pencil aria-hidden="true" />
            Edit your listing
          </Link>
        </Button>
      )}
      {action.kind === 'view' && (
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link to={action.to}>View your request</Link>
        </Button>
      )}
      {helper && (
        <p id={helperId} className="text-meta text-text-muted">
          {helper}
        </p>
      )}
    </div>
  );
}
