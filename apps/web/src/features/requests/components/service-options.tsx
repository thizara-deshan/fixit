import type { UseFormRegisterReturn } from 'react-hook-form';
import type { Service } from '@fixit/contracts';
import { formatServicePrice } from '@/lib/format';
import { RequestFieldset } from './request-fieldset';

export function ServiceOptions({
  services,
  field,
  error,
}: {
  services: readonly Service[];
  field: UseFormRegisterReturn;
  error?: string | undefined;
}) {
  return (
    <RequestFieldset legend="Service" error={error}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {services.map((s) => (
          <label
            key={s.id}
            className="border-border bg-surface has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:ring-ring has-focus-visible:ring-2 flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3"
          >
            <input
              type="radio"
              value={s.id}
              aria-invalid={error ? true : undefined}
              className="accent-primary size-4 shrink-0"
              {...field}
            />
            <span className="flex min-w-0 flex-col">
              <span className="text-body text-text font-semibold">{s.name}</span>
              <span className="text-body-sm text-text-muted">{formatServicePrice(s.price, s.unit)}</span>
            </span>
          </label>
        ))}
      </div>
    </RequestFieldset>
  );
}
