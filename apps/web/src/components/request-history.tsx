import type { RequestActor, StatusEvent } from '@fixit/contracts';
import { REQUEST_DOT, REQUEST_LABEL } from '@/components/status-pill';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

/** S15.E7 / S22.E7, oldest first. */
export function RequestHistory({
  history,
  actorLabel,
}: {
  history: readonly StatusEvent[];
  actorLabel: (actor: RequestActor) => string;
}) {
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
      <h2 className="text-title-md text-text">History</h2>
      <ol className="before:bg-border relative flex flex-col gap-4 pl-5 before:absolute before:bottom-2 before:left-[3px] before:top-2 before:w-px">
        {history.map((e) => (
          <li key={`${e.status}-${e.at}`} className="relative">
            <span
              aria-hidden="true"
              className={cn('absolute -left-5 top-1.5 size-2 rounded-full', REQUEST_DOT[e.status])}
            />
            <p className="text-label text-text font-semibold">{REQUEST_LABEL[e.status]}</p>
            <p className="text-meta text-text-subtle">
              {formatDateTime(e.at)} · {actorLabel(e.actor)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
