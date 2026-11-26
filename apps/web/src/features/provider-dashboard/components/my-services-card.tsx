import { Pencil } from 'lucide-react';
import { Link } from 'react-router';
import type { Service } from '@fixit/contracts';
import { Button } from '@/components/ui/button';
import { formatServicePrice } from '@/lib/format';

/** S20.E16. */
export function MyServicesCard({ services }: { services: readonly Service[] }) {
  return (
    <section
      aria-labelledby="my-services"
      className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 sm:p-[22px]"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="my-services" className="text-title-md text-text">
          My Services
        </h2>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/services">
            <Pencil aria-hidden="true" className="size-4" />
            Edit
          </Link>
        </Button>
      </div>
      <ul className="flex flex-col">
        {services.map((s) => (
          <li
            key={s.id}
            className="border-divider-subtle text-label flex flex-wrap items-center gap-x-2.5 border-b py-[11px]"
          >
            <span className="text-text flex-1 font-semibold">{s.name}</span>
            <span className="text-text-muted font-semibold">{formatServicePrice(s.price, s.unit)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
