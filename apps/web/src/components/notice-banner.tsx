import type { ReactNode } from 'react';
import { CircleAlert, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export type NoticeAction = { label: string; to: string } | { label: string; onClick: () => void };

const VARIANT: Record<'warning' | 'info' | 'danger', { box: string; icon: LucideIcon }> = {
  warning: {
    box: 'border border-dashed border-warning bg-warning-soft text-warning-text-strong',
    icon: TriangleAlert,
  },
  info: { box: 'border border-primary-soft-border bg-primary-soft text-primary', icon: Info },
  danger: { box: 'border border-danger bg-danger-soft text-danger-text', icon: CircleAlert },
};

interface NoticeBannerProps {
  variant: 'warning' | 'info' | 'danger';
  children: ReactNode;
  action?: NoticeAction | undefined;
  onDismiss?: (() => void) | undefined;
  className?: string | undefined;
}

const actionClass =
  'inline-flex min-h-11 items-center self-start font-bold underline-offset-2 hover:underline sm:min-h-0 sm:self-center';

export function NoticeBanner({ variant, children, action, onDismiss, className }: NoticeBannerProps) {
  const v = VARIANT[variant];
  const Icon = v.icon;
  return (
    <div
      className={cn(
        'text-label flex items-start gap-2 rounded-lg px-4 py-3.5 font-semibold',
        v.box,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <Icon aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
          <p className="min-w-0 flex-1">{children}</p>
        </div>
        {action &&
          ('to' in action ? (
            <Link to={action.to} className={actionClass}>
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={actionClass}>
              {action.label}
            </button>
          ))}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-my-2.5 -mr-2 grid size-11 shrink-0 place-items-center rounded-md"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
}
