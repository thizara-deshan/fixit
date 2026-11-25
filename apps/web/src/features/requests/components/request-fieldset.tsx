import { useId, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RequestFieldset({
  legend,
  help,
  error,
  children,
  className,
}: {
  legend: string;
  help?: ReactNode;
  error?: string | undefined;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy =
    [help !== undefined ? helpId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset aria-describedby={describedBy} className={cn('flex min-w-0 flex-col gap-2', className)}>
      <legend className="text-label text-text mb-1.5 font-semibold">
        {legend}
        <span className="sr-only"> (required)</span>
      </legend>
      {children}
      {help !== undefined && (
        <p id={helpId} className="text-meta text-text-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-meta text-danger-text flex items-start gap-1.5">
          <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
