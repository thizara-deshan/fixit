import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type EmptyAction = { label: string; to: string } | { label: string; onClick: () => void };

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: ReactNode;
  action?: EmptyAction | undefined;
  secondaryAction?: EmptyAction | undefined;
  tone?: 'primary' | 'warning';
  /** h1 on system pages (S39–S41); h2 inside a page. */
  titleAs?: 'h1' | 'h2' | 'h3';
  children?: ReactNode;
  className?: string | undefined;
}

function ActionButton({ action, variant }: { action: EmptyAction; variant: 'primary' | 'secondary' }) {
  if ('to' in action) {
    return (
      <Button asChild size="lg" variant={variant} className="w-full sm:w-auto">
        <Link to={action.to}>{action.label}</Link>
      </Button>
    );
  }
  return (
    <Button size="lg" variant={variant} className="w-full sm:w-auto" onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  secondaryAction,
  tone = 'primary',
  titleAs: Title = 'h2',
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-border-strong bg-surface flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-14 place-items-center rounded-xl',
          tone === 'primary' ? 'bg-primary-soft text-primary' : 'bg-warning-soft text-warning-text',
        )}
      >
        <Icon className="size-7" />
      </span>
      <Title className="text-lead text-text font-bold">{title}</Title>
      {body !== undefined && <div className="text-body-sm text-text-muted max-w-md">{body}</div>}
      {children}
      {(action ?? secondaryAction) && (
        <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {action && <ActionButton action={action} variant="primary" />}
          {secondaryAction && <ActionButton action={secondaryAction} variant="secondary" />}
        </div>
      )}
    </div>
  );
}
