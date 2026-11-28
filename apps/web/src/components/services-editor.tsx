import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import {
  PriceUnit,
  SERVICES_MAX,
  SERVICES_MAX_MESSAGE,
  ServicePriceText,
  type ServicesFormValues,
} from '@fixit/contracts';
import { FormField } from '@/components/form-field';
import { LkrInput } from '@/components/lkr-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatServicePrice } from '@/lib/format';

export const UNIT_LABEL: Record<PriceUnit, string> = {
  per_hour: 'per hour',
  per_visit: 'per visit',
  fixed: 'fixed',
};
export const EMPTY_SERVICE = { name: '', price: '', unit: 'per_hour' } as const;

/** One service's fields (name, price, unit, Shows as). Hosted by any form whose values are `{ services: [...] }` (S19 step 3, M12 S23 dialog with one row). */
export function ServiceRowFields({
  index,
  onRemove,
}: {
  index: number;
  onRemove?: (() => void) | undefined;
}) {
  const { register, control, formState } = useFormContext<ServicesFormValues>();
  // RHF path literals need the numeric index in the template type.
  /* eslint-disable @typescript-eslint/restrict-template-expressions */
  const path = <K extends 'name' | 'price' | 'unit'>(key: K) => `services.${index}.${key}` as const;
  const row = useWatch({ control, name: `services.${index}` });
  /* eslint-enable @typescript-eslint/restrict-template-expressions */
  const err = formState.errors.services?.[index];
  const price = ServicePriceText.safeParse(row.price);
  const unit = PriceUnit.safeParse(row.unit); // the S23 add dialog starts without a unit (M12 D-6)
  const preview = price.success && unit.success ? formatServicePrice(price.data, unit.data) : '—';
  return (
    <fieldset className="border-border flex flex-col gap-4 border-b pb-5 last:border-b-0 last:pb-0">
      <legend className="sr-only">Service {String(index + 1)}</legend>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
        <FormField label="Service name" required error={err?.name?.message}>
          {(p) => <Input {...p} autoComplete="off" {...register(path('name'))} />}
        </FormField>
        <FormField label="Price" required error={err?.price?.message}>
          {(p) => <LkrInput {...p} {...register(path('price'))} />}
        </FormField>
      </div>
      <fieldset aria-invalid={err?.unit ? true : undefined}>
        <legend className="text-label text-text mb-1.5 font-semibold">Unit</legend>
        <div className="bg-page grid grid-cols-3 gap-1 rounded-lg p-1">
          {PriceUnit.options.map((unit) => (
            <label
              key={unit}
              className="text-body-sm text-text-muted has-checked:bg-surface has-checked:text-text has-checked:shadow-xs has-focus-visible:ring-ring has-focus-visible:ring-2 relative flex h-11 cursor-pointer items-center justify-center rounded-md font-semibold"
            >
              <input type="radio" value={unit} className="sr-only" {...register(path('unit'))} />
              {UNIT_LABEL[unit]}
            </label>
          ))}
        </div>
        {err?.unit?.message && <p className="text-meta text-danger-text mt-1.5">{err.unit.message}</p>}
      </fieldset>
      <div className="flex items-center justify-between gap-3">
        <p className="text-meta text-text-muted">
          Shows as: <span className="text-text font-semibold">{preview}</span>
        </p>
        {onRemove && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRemove}
            className="min-h-11 sm:min-h-0"
          >
            <Trash2 aria-hidden="true" />
            Remove<span className="sr-only"> service {String(index + 1)}</span>
          </Button>
        )}
      </div>
    </fieldset>
  );
}

/** S19 step 3: inline rows, 0–20 while editing (the schema requires ≥ 1 on submit). */
export function ServicesRepeater() {
  const { control, formState } = useFormContext<ServicesFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'services' });
  const listError = formState.errors.services?.message ?? formState.errors.services?.root?.message;
  const full = fields.length >= SERVICES_MAX;
  return (
    <div className="flex flex-col gap-5">
      {fields.map((f, i) => (
        <ServiceRowFields
          key={f.id}
          index={i}
          onRemove={() => {
            remove(i);
          }}
        />
      ))}
      {listError && (
        <p role="alert" className="text-meta text-danger-text">
          {listError}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="outline"
          disabled={full}
          onClick={() => {
            append({ ...EMPTY_SERVICE });
          }}
          className="w-full sm:w-auto sm:self-start"
        >
          <Plus aria-hidden="true" />
          Add service
        </Button>
        {full && <p className="text-meta text-text-muted">{SERVICES_MAX_MESSAGE}</p>}
      </div>
    </div>
  );
}
