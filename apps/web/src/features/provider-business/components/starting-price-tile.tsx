import { Tag } from 'lucide-react';
import { PRICE_UNIT_SUFFIX, type OwnProvider } from '@fixit/contracts';
import { formatLkr } from '@/lib/format';

/** S23 preview: the S20 stat-tile box, one tile. */
export function StartingPriceTile({ price }: { price: OwnProvider['startingPrice'] }) {
  return (
    <section
      aria-labelledby="starting-at"
      className="border-border bg-surface flex flex-col gap-3.5 rounded-xl border p-4 sm:max-w-[320px] sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="starting-at" className="text-label text-text-muted font-semibold">
          Starting at
        </h2>
        <span className="bg-primary-soft text-primary grid size-10 place-items-center rounded-lg">
          <Tag aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="text-title-lg text-text font-extrabold">
        {price ? `${formatLkr(price.amount)}${PRICE_UNIT_SUFFIX[price.unit]}` : '—'}
      </p>
    </section>
  );
}
