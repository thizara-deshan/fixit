import { EyeOff, RotateCcw } from 'lucide-react';
import { Link } from 'react-router';
import type { ModerationRow } from '@fixit/contracts';
import { Stars } from '@/components/stars';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { formatReviewDate } from '@/lib/format';

/** S37.E1: one review with its reply, hidden metadata and the Hide / Restore action. */
export function ModerationRowItem({
  row,
  onHide,
  onRestore,
}: {
  row: ModerationRow;
  onHide: (row: ModerationRow) => void;
  onRestore: (row: ModerationRow) => void;
}) {
  const business = row.provider.businessName;
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-meta text-text-muted flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link to={`/providers/${row.provider.id}`} className="text-primary font-semibold">
            {business}
          </Link>
          <span className="text-mono font-mono">{row.requestRef}</span>
          <span>{formatReviewDate(row.createdAt)}</span>
        </p>
        <p className="text-body-sm text-text font-bold">{row.authorDisplayName}</p>
        <Stars rating={row.rating} count={1} showValue={false} />
        <p className="text-body-sm text-text whitespace-pre-line break-words">{row.text}</p>
        {row.reply && (
          <div className="border-primary-soft bg-page rounded-lg border-l-[3px] px-3.5 py-3">
            <p className="text-meta text-text font-bold">Response from {business}</p>
            <p className="text-body-sm text-text-muted whitespace-pre-line break-words">{row.reply.text}</p>
          </div>
        )}
        {row.hidden && (
          <p className="text-meta text-text-subtle">
            Hidden {formatReviewDate(row.hidden.at)} by {row.hidden.by}
            {row.hidden.reason ? ` · Reason: ${row.hidden.reason}` : ''}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <StatusPill kind="review" visibility={row.visibility} />
        {row.visibility === 'visible' ? (
          <Button
            variant="danger-outline"
            size="sm"
            className="w-full sm:w-auto"
            aria-label={`Hide review ${row.requestRef}`}
            onClick={() => {
              onHide(row);
            }}
          >
            <EyeOff aria-hidden="true" className="size-4" />
            Hide
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            aria-label={`Restore review ${row.requestRef}`}
            onClick={() => {
              onRestore(row);
            }}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Restore
          </Button>
        )}
      </div>
    </li>
  );
}
