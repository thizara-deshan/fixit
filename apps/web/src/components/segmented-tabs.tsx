import { useRef, type KeyboardEvent } from 'react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';

export interface SegmentedTabItem {
  value: string;
  label: string;
  count?: number;
  /** Links mode: the URL this tab opens. */
  to?: string;
}

const track = 'flex w-full gap-1 overflow-x-auto rounded-md bg-page p-1 sm:inline-flex sm:w-auto';
const tab =
  'inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3 text-meta font-semibold text-text-muted transition-colors hover:text-text sm:h-[34px] sm:min-h-0';
const active = 'bg-surface text-text shadow-xs';

function Count({ n }: { n: number | undefined }) {
  return n === undefined ? null : <span className="text-caption text-text-subtle font-semibold">{n}</span>;
}

/** Links mode (changes the URL): `<SegmentedTabLinks label="Account sections" items={[{ value, label, to }]} />`. */
export function SegmentedTabLinks({
  label,
  items,
  className,
}: {
  label: string;
  items: SegmentedTabItem[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn(track, className)}>
      {items.map((it) => (
        <NavLink
          key={it.value}
          to={it.to ?? '#'}
          end
          className={({ isActive }) => cn(tab, isActive && active)}
        >
          {it.label}
          <Count n={it.count} />
        </NavLink>
      ))}
    </nav>
  );
}

/** Tabs mode (local state): role=tablist, arrow keys move and select. */
export function SegmentedTabs({
  label,
  items,
  value,
  onValueChange,
  className,
}: {
  label: string;
  items: SegmentedTabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (delta === 0) return;
    e.preventDefault();
    const next = (index + delta + items.length) % items.length;
    const item = items[next];
    if (!item) return;
    onValueChange(item.value);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cn(track, className)}>
      {items.map((it, i) => {
        const selected = it.value === value;
        return (
          <button
            key={it.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              onValueChange(it.value);
            }}
            onKeyDown={(e) => {
              onKeyDown(e, i);
            }}
            className={cn(tab, selected && active)}
          >
            {it.label}
            <Count n={it.count} />
          </button>
        );
      })}
    </div>
  );
}
