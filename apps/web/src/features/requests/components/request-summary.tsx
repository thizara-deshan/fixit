import type { ProviderPublicProfile } from '@fixit/contracts';
import { formatServicePrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ProviderMiniRow } from './provider-mini-row';

export const BR11_NOTE = 'Final price is confirmed by the provider after reviewing your request.';

export function WhatHappensNext({ businessName, className }: { businessName: string; className?: string }) {
  return (
    <section aria-labelledby="next-h" className={cn('flex flex-col gap-2', className)}>
      <h3 id="next-h" className="text-label text-text font-bold">
        What happens next
      </h3>
      <ul className="text-body-sm text-text-muted flex list-disc flex-col gap-1.5 pl-5">
        <li>{businessName} has up to 3 days to accept or decline.</li>
        <li>We&apos;ll email you as soon as they reply.</li>
        <li>Their phone number is shown once they accept.</li>
      </ul>
    </section>
  );
}

/** Desktop aside (lg+). `serviceId` = the currently selected service, '' if none. */
export function RequestSummary({
  profile,
  serviceId,
}: {
  profile: ProviderPublicProfile;
  serviceId: string;
}) {
  const service = profile.services.find((s) => s.id === serviceId);
  return (
    <aside className="border-border bg-surface sticky top-24 hidden flex-col gap-5 rounded-2xl border p-6 lg:flex">
      <ProviderMiniRow profile={profile} />
      <div className="border-border flex flex-col gap-1 border-t pt-5">
        <p className="text-meta text-text-subtle">Service</p>
        <p className="text-body text-text font-semibold">{service ? service.name : 'Choose a service'}</p>
        {service && (
          <p className="text-body-sm text-text-muted">{formatServicePrice(service.price, service.unit)}</p>
        )}
        <p className="text-meta text-text-subtle mt-2">{BR11_NOTE}</p>
      </div>
      <WhatHappensNext businessName={profile.businessName} className="border-border border-t pt-5" />
    </aside>
  );
}
