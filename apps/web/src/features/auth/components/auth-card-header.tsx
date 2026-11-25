import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONE = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning-text',
} as const;

export function AuthCardHeader({
  icon: Icon,
  tone = 'primary',
  title,
  subtitle,
}: {
  icon?: LucideIcon;
  tone?: keyof typeof TONE;
  title: string;
  subtitle?: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-3">
      {Icon && (
        <span aria-hidden="true" className={cn('grid size-14 place-items-center rounded-xl', TONE[tone])}>
          <Icon className="size-7" />
        </span>
      )}
      <h1 className="text-title-md text-text">{title}</h1>
      {subtitle && <p className="text-body-sm text-text-muted">{subtitle}</p>}
    </div>
  );
}
