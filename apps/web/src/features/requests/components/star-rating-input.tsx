import { useState } from 'react';
import { Star } from 'lucide-react';
import { RATING_LABELS } from '@fixit/contracts';
import { cn } from '@/lib/utils';

interface Props {
  id: string;
  value: number | undefined;
  onChange: (rating: number) => void;
  onBlur: () => void;
  invalid: boolean;
  describedBy?: string | undefined;
}

/** S16 rating: a five-star radio group. Each target is 44×44; the label also shows for the selected value. */
export function StarRatingInput({ id, value, onChange, onBlur, invalid, describedBy }: Props) {
  const [preview, setPreview] = useState<number | null>(null);
  const shown = preview ?? value ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="radiogroup"
        id={id}
        aria-label="Rating"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="flex"
        onMouseLeave={() => {
          setPreview(null);
        }}
      >
        {RATING_LABELS.map((label, i) => {
          const n = i + 1;
          return (
            <label
              key={n}
              className="has-[:focus-visible]:ring-ring relative grid size-11 cursor-pointer place-items-center rounded-md has-[:focus-visible]:ring-2"
              onMouseEnter={() => {
                setPreview(n);
              }}
            >
              <input
                type="radio"
                name={id}
                value={n}
                checked={value === n}
                onChange={() => {
                  onChange(n);
                }}
                onFocus={() => {
                  setPreview(n);
                }}
                onBlur={() => {
                  setPreview(null);
                  onBlur();
                }}
                className="sr-only"
                aria-label={`${String(n)} star${n > 1 ? 's' : ''}, ${label}`}
              />
              <Star
                aria-hidden="true"
                className={cn('size-7', n <= shown ? 'text-star' : 'text-star-empty')}
                fill={n <= shown ? 'currentColor' : 'none'}
              />
            </label>
          );
        })}
      </div>
      <span aria-live="polite" className="text-label text-text-muted min-w-20">
        {shown > 0 ? RATING_LABELS[shown - 1] : ''}
      </span>
    </div>
  );
}
