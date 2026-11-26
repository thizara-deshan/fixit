import type { ProviderRequestView } from '@fixit/contracts';
import { SLOT_LABEL, formatDateLong, formatServicePrice } from '@/lib/format';

const ROW = 'flex flex-col gap-0.5';
const DT = 'text-meta text-text-muted';
const DD = 'text-body-sm text-text';

/** S22.E2. */
export function JobDetailsCard({ view }: { view: ProviderRequestView }) {
  return (
    <section
      aria-labelledby="job-h"
      className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6"
    >
      <h2 id="job-h" className="text-title-md text-text">
        Job details
      </h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className={ROW}>
          <dt className={DT}>Service</dt>
          <dd
            className={DD}
          >{`${view.service.name} · ${formatServicePrice(view.service.price, view.service.unit)}`}</dd>
        </div>
        <div className={ROW}>
          <dt className={DT}>Preferred date</dt>
          <dd className={DD}>{formatDateLong(view.preferredDate)}</dd>
        </div>
        <div className={ROW}>
          <dt className={DT}>Time slot</dt>
          <dd className={DD}>{SLOT_LABEL[view.slot]}</dd>
        </div>
        <div className={ROW}>
          <dt className={DT}>Town</dt>
          <dd className={DD}>{view.town.name}</dd>
        </div>
        <div className={`${ROW} sm:col-span-2`}>
          <dt className={DT}>Description</dt>
          <dd className={`${DD} whitespace-pre-line`}>{view.description}</dd>
        </div>
      </dl>
    </section>
  );
}
