import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { MQ, useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { LoadingRegion } from './loading-region';
import { SkeletonPhoneCards, SkeletonTableRows } from './skeletons';

export interface DataListColumn<T> {
  id: string;
  /** Table header; dropped on phone cards. */
  header: string;
  cell: (row: T) => ReactNode;
  /** Where the value goes on the phone card (SPEC §6.9). Exactly one column should be 'title'. */
  card: 'title' | 'status' | 'meta' | 'actions' | 'hidden';
  /** Extra classes for th/td (e.g. widths). */
  className?: string;
}

interface DataListProps<T> {
  rows: readonly T[];
  columns: readonly DataListColumn<T>[];
  getRowKey: (row: T) => string;
  /** Table caption / list label (visually hidden). */
  caption: string;
  /** Makes the whole row/card a link (stretched over the row; actions stay clickable). */
  rowHref?: (row: T) => string;
  /** Accessible name of the row link, e.g. "FX-2061, Olivia Martinez". */
  rowLabel?: (row: T) => string;
  loading?: boolean;
  /** Rendered instead of the list when there are no rows. */
  empty?: ReactNode;
}

const stretched = "before:absolute before:inset-0 before:content-['']";

export function DataList<T>({
  rows,
  columns,
  getRowKey,
  caption,
  rowHref,
  rowLabel,
  loading = false,
  empty,
}: DataListProps<T>) {
  const isTable = useMediaQuery(MQ.sm);

  const titleCell = (row: T, col: DataListColumn<T>) =>
    rowHref ? (
      <Link to={rowHref(row)} aria-label={rowLabel?.(row)} className={cn('block', stretched)}>
        {col.cell(row)}
      </Link>
    ) : (
      col.cell(row)
    );

  return (
    <LoadingRegion
      loading={loading}
      skeleton={isTable ? <SkeletonTableRows columns={columns.length} /> : <SkeletonPhoneCards />}
    >
      {rows.length === 0 ? (
        empty
      ) : isTable ? (
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-page">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={cn(
                    'text-caption text-text-subtle px-6 py-2.5 uppercase tracking-[0.05em]',
                    c.className,
                  )}
                >
                  {c.card === 'actions' ? <span className="sr-only">{c.header}</span> : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className={cn('border-border border-t', rowHref && 'hover:bg-page relative')}
              >
                {columns.map((c) => (
                  <td
                    key={c.id}
                    className={cn(
                      'text-body-sm text-text px-6 py-4 align-middle',
                      c.card === 'actions' && 'relative z-10',
                      c.className,
                    )}
                  >
                    {c.card === 'title' ? titleCell(row, c) : c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul aria-label={caption} className="flex flex-col gap-3">
          {rows.map((row) => {
            const title = columns.find((c) => c.card === 'title');
            const statuses = columns.filter((c) => c.card === 'status');
            const metas = columns.filter((c) => c.card === 'meta');
            // An actions column whose cell renders nothing for this row adds no (empty) action row.
            const actionCells = columns
              .filter((c) => c.card === 'actions')
              .map((c) => ({ id: c.id, node: c.cell(row) }))
              .filter(({ node }) => node !== null && node !== undefined && node !== false);
            return (
              <li
                key={getRowKey(row)}
                className="border-border bg-surface relative flex flex-col gap-2 rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-body-sm text-text min-w-0 flex-1 font-semibold">
                    {title && titleCell(row, title)}
                  </div>
                  {statuses.map((c) => (
                    <div key={c.id} className="shrink-0">
                      {c.cell(row)}
                    </div>
                  ))}
                </div>
                {metas.map((c) => (
                  <div key={c.id} className="text-meta text-text-muted">
                    {c.cell(row)}
                  </div>
                ))}
                {actionCells.length > 0 && (
                  <div className="relative z-10 mt-1 flex gap-2 [&_a]:min-h-11 [&_a]:flex-1 [&_button]:min-h-11 [&_button]:flex-1">
                    {actionCells.map(({ id, node }) => (
                      <div key={id} className="flex flex-1 gap-2">
                        {node}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </LoadingRegion>
  );
}
