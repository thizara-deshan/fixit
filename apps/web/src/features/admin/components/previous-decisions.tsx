import type { PreviousDecision } from '@fixit/contracts';
import { formatReviewDate } from '@/lib/format';
import { SubmissionPill } from './submission-pill';

/** S32.E4: earlier attempts, newest first. Nothing on a first submission. */
export function PreviousDecisions({ items }: { items: PreviousDecision[] }) {
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby="previous"
      className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 sm:p-6"
    >
      <h2 id="previous" className="text-title-sm text-text">
        Previous decisions
      </h2>
      <ul className="divide-border divide-y">
        {items.map((d) => (
          <li key={d.id} className="flex flex-col gap-1 py-3">
            <p className="text-body-sm text-text flex flex-wrap items-center gap-2 font-semibold">
              {formatReviewDate(d.decidedAt ?? d.submittedAt)}
              <SubmissionPill status={d.status} compact />
            </p>
            {d.rejectionReason && <p className="text-body-sm text-text-muted">Reason: {d.rejectionReason}</p>}
            {d.decidedByName && <p className="text-meta text-text-subtle">by {d.decidedByName}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
