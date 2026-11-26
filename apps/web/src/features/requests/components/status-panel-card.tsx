import { Link } from 'react-router';
import type { CustomerRequestView } from '@fixit/contracts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PANEL_BORDER, statusPanel } from '../status-panel';
import { ContactBlock } from '@/components/contact-block';
import { ReviewBlock } from './review-block';

/** S15.E2. */
export function StatusPanelCard({ view, onCancel }: { view: CustomerRequestView; onCancel: () => void }) {
  const p = statusPanel(view);
  return (
    <section
      aria-labelledby="status-title"
      className={cn(
        'border-border bg-surface flex flex-col gap-4 rounded-2xl border border-t-4 p-5 sm:p-6',
        PANEL_BORDER[view.status],
      )}
    >
      <h2 id="status-title" className="text-title-md text-text">
        {p.title}
      </h2>
      {p.showContact && view.provider.mobile && (
        <ContactBlock label={`${view.provider.businessName}'s mobile`} mobile={view.provider.mobile} />
      )}
      {p.agreedPrice && (
        <p className="flex flex-col">
          <span className="text-body-sm text-text font-semibold">{p.agreedPrice}</span>
          <span className="text-meta text-text-subtle">
            For your records — you pay the provider directly.
          </span>
        </p>
      )}
      {p.lines.map((l) => (
        <p key={l} className="text-body-sm text-text-muted">
          {l}
        </p>
      ))}
      {(p.showCancel || p.findAnotherHref) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {p.showCancel && (
            <Button variant="danger-outline" size="md" className="w-full sm:w-auto" onClick={onCancel}>
              Cancel request
            </Button>
          )}
          {p.findAnotherHref && (
            <Button asChild size="md" className="w-full sm:w-auto">
              <Link to={p.findAnotherHref}>Find another provider</Link>
            </Button>
          )}
        </div>
      )}
      {p.showReview && view.review && <ReviewBlock view={view} />}
    </section>
  );
}
