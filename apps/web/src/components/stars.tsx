import { Star } from 'lucide-react';
import { formatRating, ratingAriaLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

interface StarsProps {
  rating: number | null;
  count: number;
  /** Icon size in px (prototype 13–16). */
  size?: number;
  /** Show `4.9 (212)` / `New` after the stars. */
  showValue?: boolean;
  className?: string;
}

export function Stars({ rating, count, size = 14, showValue = true, className }: StarsProps) {
  const filled = rating === null || count === 0 ? 0 : Math.round(rating);
  return (
    <span
      role="img"
      aria-label={ratingAriaLabel(rating, count)}
      className={cn('inline-flex items-center gap-1.5', className)}
    >
      <span aria-hidden="true" className="inline-flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={cn('fill-current', i < filled ? 'text-star' : 'text-star-empty')}
            strokeWidth={0}
          />
        ))}
      </span>
      {showValue && (
        <span aria-hidden="true" className="inline-flex items-baseline gap-1">
          <span className="text-label text-text font-bold">{formatRating(rating, count)}</span>
          {count > 0 && <span className="text-meta text-text-subtle">({count})</span>}
        </span>
      )}
    </span>
  );
}
