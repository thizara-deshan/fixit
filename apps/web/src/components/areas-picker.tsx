import { useId } from 'react';
import type { CatalogResponse } from '@fixit/contracts';
import { OTHER_TOWNS_MAX, OTHER_TOWNS_MAX_MESSAGE, type AreasFormInput } from '@fixit/contracts';
import { FormField } from '@/components/form-field';
import { cn } from '@/lib/utils';

export const selectClass =
  'border-border-control bg-surface text-body text-text focus-visible:ring-ring h-12 w-full rounded-md border px-3 focus-visible:ring-2 focus-visible:outline-none aria-invalid:border-danger';

export interface AreasPickerProps {
  catalog: Pick<CatalogResponse, 'districts' | 'towns'>;
  value: AreasFormInput;
  onChange: (next: AreasFormInput) => void;
  errors?: { baseTownId?: string | undefined; otherTownIds?: string | undefined };
}

export function AreasPicker({ catalog, value, onChange, errors = {} }: AreasPickerProps) {
  const id = useId();
  const districts = [...catalog.districts].sort((a, b) => a.order - b.order);
  const townsOf = (districtId: string) =>
    catalog.towns.filter((t) => t.districtId === districtId).sort((a, b) => a.name.localeCompare(b.name));
  const count = value.otherTownIds.length;
  const full = count >= OTHER_TOWNS_MAX;
  const setBase = (baseTownId: string) => {
    onChange({ baseTownId, otherTownIds: value.otherTownIds.filter((t) => t !== baseTownId) });
  };
  const toggle = (townId: string, on: boolean) => {
    onChange({
      ...value,
      otherTownIds: on ? [...value.otherTownIds, townId] : value.otherTownIds.filter((t) => t !== townId),
    });
  };
  return (
    <div className="flex flex-col gap-6">
      <FormField label="Base town" required error={errors.baseTownId}>
        {(p) => (
          <select
            {...p}
            className={selectClass}
            value={value.baseTownId}
            onChange={(e) => {
              setBase(e.target.value);
            }}
          >
            <option value="">Choose a town</option>
            {districts.map((d) => (
              <optgroup key={d.id} label={d.name}>
                {townsOf(d.id).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </FormField>
      <fieldset aria-describedby={`${id}-count`} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <legend className="text-label text-text font-semibold">
            Other towns <span className="text-text-subtle ml-1.5 font-medium">Optional</span>
          </legend>
          <p id={`${id}-count`} aria-live="polite" className="text-meta text-text-muted">
            {count} of {OTHER_TOWNS_MAX} selected
          </p>
        </div>
        {full && <p className="text-meta text-text-muted">{OTHER_TOWNS_MAX_MESSAGE}</p>}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {districts.map((d) => {
            const towns = townsOf(d.id).filter((t) => t.id !== value.baseTownId);
            if (towns.length === 0) return null;
            return (
              <div key={d.id} className="flex flex-col gap-1">
                <h3 className="text-label text-text font-bold">{d.name}</h3>
                {towns.map((t) => {
                  const checked = value.otherTownIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={cn(
                        'text-body-sm text-text flex min-h-11 items-center gap-3 sm:min-h-9',
                        !checked && full && 'text-text-subtle',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="accent-primary size-5"
                        checked={checked}
                        disabled={!checked && full}
                        onChange={(e) => {
                          toggle(t.id, e.target.checked);
                        }}
                      />
                      {t.name}
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
        {errors.otherTownIds && <p className="text-meta text-danger-text">{errors.otherTownIds}</p>}
      </fieldset>
    </div>
  );
}
