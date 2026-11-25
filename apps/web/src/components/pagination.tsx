import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/** 1 … around current … last; at most 7 items. */
export function pageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, Math.min(current - 1, total - 4));
  const end = Math.min(total - 1, Math.max(current + 1, 5));
  const items: PageItem[] = [1];
  if (start > 2) items.push('ellipsis-start');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push('ellipsis-end');
  items.push(total);
  return items;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  className?: string;
}

const box =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md px-3 text-label font-semibold sm:min-h-10 sm:min-w-10';

export function Pagination({ page, totalPages, hrefFor, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;
  const edge = (target: number | null, label: string, icon: 'prev' | 'next') => {
    const content = (
      <>
        {icon === 'prev' && <ChevronLeft aria-hidden="true" className="size-4" />}
        {label}
        {icon === 'next' && <ChevronRight aria-hidden="true" className="size-4" />}
      </>
    );
    return target === null ? (
      <span aria-disabled="true" className={cn(box, 'text-text-subtle opacity-60')}>
        {content}
      </span>
    ) : (
      <Link to={hrefFor(target)} className={cn(box, 'text-text-muted hover:bg-page hover:text-text')}>
        {content}
      </Link>
    );
  };
  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-2 sm:justify-center', className)}
    >
      {edge(prev, 'Previous', 'prev')}
      <span className="text-label text-text-muted font-semibold sm:hidden">{`Page ${String(page)} of ${String(totalPages)}`}</span>
      <ul className="hidden items-center gap-1 sm:flex">
        {pageItems(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <Link
                to={hrefFor(item)}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  box,
                  'px-0',
                  item === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-text-muted hover:bg-page hover:text-text',
                )}
              >
                {item}
              </Link>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="text-text-subtle px-1">
              …
            </li>
          ),
        )}
      </ul>
      {edge(next, 'Next', 'next')}
    </nav>
  );
}
