import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPhone } from '@/lib/format';
import { notify, notifyError } from '@/lib/toast';

/** S15.E4. Only rendered while the view carries the mobile (Accepted/Completed). */
export function ContactBlock({ businessName, mobile }: { businessName: string; mobile: string }) {
  const copy = () => {
    void navigator.clipboard.writeText(formatPhone(mobile)).then(
      () => {
        notify('Number copied.');
      },
      () => {
        notifyError("Couldn't copy. Try again.");
      },
    );
  };
  return (
    <div className="bg-page flex flex-col gap-3 rounded-xl p-4">
      <div className="flex flex-col gap-0.5">
        <p className="text-meta text-text-muted">{`${businessName}'s mobile`}</p>
        <p className="text-lead text-text font-bold">{formatPhone(mobile)}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="primary" size="md" className="w-full sm:w-auto">
          <a href={`tel:${mobile}`}>
            <Phone aria-hidden="true" className="size-4" />
            Call
          </a>
        </Button>
        <Button variant="secondary" size="md" className="w-full sm:w-auto" onClick={copy}>
          Copy
        </Button>
      </div>
    </div>
  );
}
