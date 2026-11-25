import type { UseFormRegisterReturn } from 'react-hook-form';
import { TimeSlot } from '@fixit/contracts';
import { SLOT_LABEL } from '@/lib/format';
import { RequestFieldset } from './request-fieldset';

export function SlotControl({ field, error }: { field: UseFormRegisterReturn; error?: string | undefined }) {
  return (
    <RequestFieldset legend="Time slot" error={error}>
      <div className="bg-page grid grid-cols-3 gap-1 rounded-lg p-1">
        {TimeSlot.options.map((slot) => (
          <label
            key={slot}
            className="text-body-sm text-text-muted has-checked:bg-surface has-checked:text-text has-checked:shadow-xs has-focus-visible:ring-ring has-focus-visible:ring-2 relative flex h-12 cursor-pointer items-center justify-center rounded-md font-semibold"
          >
            <input
              type="radio"
              value={slot}
              aria-invalid={error ? true : undefined}
              className="sr-only"
              {...field}
            />
            {SLOT_LABEL[slot]}
          </label>
        ))}
      </div>
    </RequestFieldset>
  );
}
