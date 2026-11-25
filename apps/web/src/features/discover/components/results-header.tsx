import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { SortKey } from '@fixit/contracts';
import { cn } from '@/lib/utils';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'rating', label: 'Top rated' },
  { value: 'reviews', label: 'Most reviews' },
  { value: 'town', label: 'Based in your town first' },
];

export const ResultsHeading = forwardRef<HTMLHeadingElement, { title: string; context: string; id?: string }>(
  function ResultsHeading({ title, context, id }, ref) {
    return (
      <div className="flex flex-col gap-1">
        <h1
          ref={ref}
          id={id}
          tabIndex={-1}
          className="text-title-lg text-text scroll-mt-32 focus:outline-none lg:scroll-mt-24"
        >
          {title}
        </h1>
        <p className="text-body-sm text-text-muted">{context}</p>
      </div>
    );
  },
);

export function SortSelect({
  value,
  onChange,
  className,
}: {
  value: SortKey;
  onChange: (s: SortKey) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor={id} className="text-label text-text-muted hidden lg:inline">
        Sort by
      </label>
      <div className="relative min-w-0 flex-1">
        <select
          id={id}
          aria-label="Sort by"
          value={value}
          onChange={(e) => {
            onChange(SortKey.parse(e.target.value));
          }}
          className="border-border bg-surface text-body text-text sm:text-body-sm focus-visible:border-primary focus-visible:ring-primary h-11 w-full appearance-none rounded-md border-2 px-3 pr-9 focus-visible:outline-none focus-visible:ring-2 lg:h-10"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="text-text-muted pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
        />
      </div>
    </div>
  );
}
