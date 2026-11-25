import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { PRICE_STEPS, RATING_STEPS, type CatalogResponse, type DiscoverQuery } from '@fixit/contracts';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Stars } from '@/components/stars';
import { cn } from '@/lib/utils';
import type { DiscoverPatch } from '../url-state';

export interface FilterGroupsProps {
  catalog: CatalogResponse;
  state: DiscoverQuery;
  ticked: string[];
  counts: Record<string, number> | undefined; // undefined while the first result loads or on error → hide numbers
  onToggleCategory: (id: string) => void;
  onChange: (patch: DiscoverPatch) => void;
}

const selectClass =
  'border-border bg-surface text-body text-text sm:text-body-sm focus-visible:border-primary focus-visible:ring-primary h-12 w-full appearance-none rounded-md border-2 px-3 pr-9 focus-visible:ring-2 focus-visible:outline-none';

const optionClass = (selected: boolean) =>
  cn(
    'focus-visible:ring-primary flex h-11 items-center justify-between rounded-sm border-2 px-3 focus-visible:ring-2 focus-visible:outline-none sm:h-[38px]',
    selected ? 'border-primary bg-primary-soft' : 'border-border bg-surface',
  );

export function FilterGroups({
  catalog,
  state,
  ticked,
  counts,
  onToggleCategory,
  onChange,
}: FilterGroupsProps) {
  const locId = useId();
  const ratingLabelId = useId();
  const priceLabelId = useId();
  const priceSelected = PRICE_STEPS.find((s) => s.value === state.price);

  return (
    <div className="divide-border flex flex-col divide-y">
      <fieldset className="flex flex-col gap-3 py-6 first:pt-0 last:pb-0">
        <legend className="text-label text-text mb-3 font-bold">Service category</legend>
        {catalog.categories.map((c) => {
          const empty = counts?.[c.id] === 0;
          return (
            <label key={c.id} className="flex min-h-11 cursor-pointer items-center gap-3 sm:min-h-9">
              <Checkbox
                checked={ticked.includes(c.id)}
                onCheckedChange={() => {
                  onToggleCategory(c.id);
                }}
              />
              <span className={cn('text-body-sm flex-1', empty ? 'text-text-subtle' : 'text-text')}>
                {c.name}
              </span>
              {counts && <span className="text-meta text-text-subtle tabular-nums">{counts[c.id] ?? 0}</span>}
            </label>
          );
        })}
      </fieldset>

      <div className="flex flex-col gap-3 py-6 first:pt-0 last:pb-0">
        <label htmlFor={locId} className="text-label text-text font-bold">
          Location
        </label>
        <div className="relative">
          <select
            id={locId}
            value={state.loc ?? ''}
            onChange={(e) => {
              onChange({ loc: e.target.value || undefined });
            }}
            className={selectClass}
          >
            <option value="">All locations</option>
            {catalog.districts.map((d) => (
              <optgroup key={d.id} label={d.name}>
                {catalog.towns
                  .filter((t) => t.districtId === d.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="text-text-muted pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 py-6 first:pt-0 last:pb-0">
        <span id={ratingLabelId} className="text-label text-text font-bold">
          Minimum rating
        </span>
        <div role="radiogroup" aria-labelledby={ratingLabelId} className="flex flex-col gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={!state.rating}
            onClick={() => {
              onChange({ rating: undefined });
            }}
            className={optionClass(!state.rating)}
          >
            <span aria-hidden="true">
              <Stars rating={null} count={0} showValue={false} size={13} />
            </span>
            <span className="text-meta text-text font-bold">Any</span>
          </button>
          {RATING_STEPS.map((step) => (
            <button
              key={step.value}
              type="button"
              role="radio"
              aria-checked={state.rating === step.value}
              onClick={() => {
                onChange({ rating: step.value });
              }}
              className={optionClass(state.rating === step.value)}
            >
              <span aria-hidden="true">
                <Stars rating={Math.floor(step.min)} count={1} showValue={false} size={13} />
              </span>
              <span className="text-meta text-text font-bold">{step.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="py-6 first:pt-0 last:pb-0">
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-label text-text font-bold">Verified providers only</span>
            <span className="text-meta text-text-subtle">ID checked by Fixit</span>
          </span>
          <Switch
            checked={state.verified === '1'}
            onCheckedChange={(on) => {
              onChange({ verified: on ? '1' : undefined });
            }}
            aria-label="Verified providers only"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 py-6 first:pt-0 last:pb-0">
        <div className="flex items-center justify-between gap-3">
          <span id={priceLabelId} className="text-label text-text font-bold">
            Starting price
          </span>
          <span className="text-label text-primary font-semibold">{priceSelected?.label ?? 'Any price'}</span>
        </div>
        <div role="radiogroup" aria-labelledby={priceLabelId} className="flex flex-col gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={!state.price}
            onClick={() => {
              onChange({ price: undefined });
            }}
            className={optionClass(!state.price)}
          >
            <span className="text-meta text-text font-bold">Any price</span>
          </button>
          {PRICE_STEPS.map((step) => (
            <button
              key={step.value}
              type="button"
              role="radio"
              aria-checked={state.price === step.value}
              onClick={() => {
                onChange({ price: step.value });
              }}
              className={optionClass(state.price === step.value)}
            >
              <span className="text-meta text-text font-bold">{step.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
