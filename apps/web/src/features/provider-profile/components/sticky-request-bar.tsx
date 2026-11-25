import type { ProviderPublicProfile } from '@fixit/contracts';
import { PriceLabel } from '@/components/price-label';
import type { RequestAction } from '../request-action';
import { RequestActionBlock } from './request-action-block';

/** Phone only (S3): fixed bottom bar with the price and the request action. */
export function StickyRequestBar({
  profile,
  action,
}: {
  profile: ProviderPublicProfile;
  action: RequestAction;
}) {
  if (action.kind === 'hidden') return null;
  return (
    <div className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 border-t px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 sm:hidden">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <p className="text-caption text-text-subtle font-medium normal-case">Starting at</p>
          <PriceLabel
            variant="short"
            amount={profile.startingPrice.amount}
            unit={profile.startingPrice.unit}
            amountClassName="text-title-md font-extrabold"
          />
        </div>
        <RequestActionBlock action={action} helperId="request-helper-bar" className="min-w-0 flex-1" />
      </div>
    </div>
  );
}
