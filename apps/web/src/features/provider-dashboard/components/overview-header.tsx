import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateLong } from '@/lib/format';
import { greeting, greetingSub } from '../copy';

/** S20.E1–E3, E5. Desktop: text left, button bottom-right. Phone: stacked, full-width 44 button. */
export function OverviewHeader({
  firstName,
  pending,
  providerId,
  now,
}: {
  firstName: string;
  pending: number;
  providerId: string;
  now: Date;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-label text-text-subtle font-semibold">{formatDateLong(now)}</p>
        <h1 className="text-title-xl text-text">{greeting(now, firstName)}</h1>
        <p className="text-body text-text-muted">{greetingSub(pending)}</p>
      </div>
      <Button asChild variant="outline" size="md" className="w-full sm:w-auto">
        <a href={`/providers/${providerId}`} target="_blank" rel="noopener noreferrer">
          <Eye aria-hidden="true" className="size-5" />
          View public profile
        </a>
      </Button>
    </header>
  );
}
