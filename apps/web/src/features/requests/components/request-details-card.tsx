import type { CustomerRequestView } from '@fixit/contracts';
import { formatDateLong, formatPhone, formatServicePrice, SLOT_LABEL } from '@/lib/format';

const dt = 'text-label text-text-muted';
const dd = 'text-body text-text break-words';

/** S15.E5. */
export function RequestDetailsCard({ view }: { view: CustomerRequestView }) {
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6">
      <h2 className="text-title-md text-text">Request details</h2>
      <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-x-4">
        <dt className={dt}>Service</dt>
        <dd
          className={dd}
        >{`${view.service.name} · ${formatServicePrice(view.service.price, view.service.unit)}`}</dd>
        <dt className={dt}>Preferred date</dt>
        <dd className={dd}>{formatDateLong(view.preferredDate)}</dd>
        <dt className={dt}>Time slot</dt>
        <dd className={dd}>{SLOT_LABEL[view.slot]}</dd>
        <dt className={dt}>Town</dt>
        <dd className={dd}>{view.town.name}</dd>
        <dt className={dt}>Address</dt>
        <dd className={dd}>
          {view.addressLine1}
          {view.addressLine2 && (
            <>
              <br />
              {view.addressLine2}
            </>
          )}
        </dd>
        <dt className={dt}>Description</dt>
        <dd className={`${dd} whitespace-pre-line`}>{view.description}</dd>
        <dt className={dt}>Your mobile</dt>
        <dd className={dd}>{formatPhone(view.customerMobile)}</dd>
      </dl>
    </section>
  );
}
