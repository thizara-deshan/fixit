import { useId, type ReactNode } from 'react';
import { CircleCheck, MapPin } from 'lucide-react';
import type { ProfileArea, Service } from '@fixit/contracts';
import { priceParts } from '@/lib/format';
import { cn } from '@/lib/utils';

export function SectionCard({
  title,
  id,
  aside,
  children,
  className,
}: {
  title: string;
  id?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
}) {
  const titleId = useId();
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn('border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-7', className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={titleId} className="text-title-md text-text">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function AboutSection({ bio, className }: { bio: string; className?: string }) {
  return (
    <SectionCard title="About" className={className}>
      <p className="text-body text-text-muted whitespace-pre-line">{bio}</p>
    </SectionCard>
  );
}

export function ServicesSection({
  services,
  className,
}: {
  services: readonly Service[];
  className?: string;
}) {
  return (
    <SectionCard title="Services offered" className={className}>
      <ul className="flex flex-col">
        {services.map((s) => {
          const parts = priceParts(s.price, s.unit);
          return (
            <li
              key={s.id}
              className="border-divider-subtle flex items-start gap-3 border-b py-3 last:border-b-0"
            >
              <CircleCheck aria-hidden="true" className="text-success mt-0.5 size-5 shrink-0" />
              <span className="text-body-sm text-text min-w-0 flex-1 break-words font-semibold">
                {s.name}
              </span>
              <span className="ml-auto shrink-0 text-right">
                {parts.lead && <span className="text-meta text-text-subtle mr-2">from</span>}
                <span className="text-body-sm text-text font-bold">
                  {parts.amount}
                  {parts.suffix}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-meta text-text-subtle">
        Final price is confirmed by the provider after reviewing your request.
      </p>
    </SectionCard>
  );
}

export function ServiceAreaSection({
  areas,
  className,
}: {
  areas: readonly ProfileArea[];
  className?: string;
}) {
  return (
    <SectionCard title="Service area" className={className}>
      <ul className="flex flex-col">
        {areas.map((a) => (
          <li
            key={a.id}
            className="border-border flex min-h-11 items-center gap-3 border-b py-2.5 last:border-b-0"
          >
            <MapPin aria-hidden="true" className="text-primary size-5" />
            <span className="text-body-sm text-text font-semibold">{a.name}</span>
            {a.isBase && <span className="text-meta text-text-subtle ml-auto">Based here</span>}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
