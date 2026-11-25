import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import type { SidebarItem } from '../nav-config';

export function SidebarNav({
  label,
  items,
  dense = true,
  onNavigate,
}: {
  label: string;
  items: SidebarItem[];
  dense?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-1">
        {items.map(({ to, label: text, icon: Icon, end, count, countLabel, dot }) => (
          <li key={to}>
            <NavLink
              to={to}
              {...(end ? { end } : {})}
              {...(onNavigate ? { onClick: onNavigate } : {})}
              className={({ isActive }) =>
                cn(
                  'text-body-sm flex items-center gap-3 rounded-md px-3 font-semibold transition-colors',
                  dense ? 'h-11' : 'h-12',
                  isActive ? 'bg-primary-soft text-primary' : 'text-text-muted hover:bg-page',
                )
              }
            >
              <Icon aria-hidden="true" className="size-[22px] shrink-0" />
              <span className="min-w-0 flex-1 truncate">{text}</span>
              {count !== undefined && (
                <span className="bg-cta text-caption text-on-cta grid h-[22px] min-w-[22px] place-items-center rounded-full px-1.5 font-extrabold">
                  <span aria-hidden="true">{count}</span>
                  <span className="sr-only">{countLabel}</span>
                </span>
              )}
              {dot && (
                <span className="bg-warning size-2 rounded-full">
                  <span className="sr-only">Needs attention</span>
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
