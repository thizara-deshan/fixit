import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  n: '01' | '02' | '03';
  title: string;
  body: string;
  icon: LucideIcon;
  accent?: boolean;
}

export function StepsGrid({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-3 lg:gap-6">
      {steps.map(({ n, title, body, icon: Icon, accent }) => (
        <li key={n} className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-6 lg:p-8">
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'grid size-14 place-items-center rounded-xl',
                accent ? 'bg-cta text-on-cta' : 'bg-primary text-primary-foreground',
              )}
            >
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <span aria-hidden="true" className="text-title-xl text-border">
              {n}
            </span>
          </div>
          <h3 className="text-title-md text-text">
            <span className="sr-only">{n} </span>
            {title}
          </h3>
          <p className="text-body-sm text-text-muted">{body}</p>
        </li>
      ))}
    </ol>
  );
}
