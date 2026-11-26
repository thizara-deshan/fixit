import { Lock } from 'lucide-react';
import type { ProviderRequestView } from '@fixit/contracts';
import { ContactBlock } from '@/components/contact-block';
import { initialsOf } from '@/lib/format';
import { closedPrivacyNote, PENDING_PRIVACY_NOTE } from '../copy';

/** S22.E1. Privacy is decided by the server view (`customer.revealed`), never by the UI. */
export function CustomerCard({ view }: { view: ProviderRequestView }) {
  const c = view.customer;
  const name = c.revealed ? c.fullName : c.displayName;
  const note = c.revealed ? null : (closedPrivacyNote(view.status) ?? PENDING_PRIVACY_NOTE);
  return (
    <section
      aria-labelledby="customer-h"
      className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6"
    >
      <h2 id="customer-h" className="text-title-md text-text">
        Customer
      </h2>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-primary-soft text-primary text-label grid size-11 shrink-0 place-items-center rounded-full font-extrabold"
        >
          {initialsOf(name)}
        </span>
        <div className="min-w-0">
          <p className="text-body-sm text-text truncate font-bold">{name}</p>
          <p className="text-meta text-text-muted">{view.town.name}</p>
        </div>
      </div>
      {c.revealed ? (
        <>
          <div className="flex flex-col gap-0.5">
            <p className="text-meta text-text-muted">Address</p>
            <p className="text-body-sm text-text">{c.addressLine1}</p>
            {c.addressLine2 && <p className="text-body-sm text-text">{c.addressLine2}</p>}
          </div>
          <ContactBlock label="Mobile" mobile={c.mobile} />
        </>
      ) : (
        <p className="text-meta text-text-muted flex items-start gap-2">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {note}
        </p>
      )}
    </section>
  );
}
