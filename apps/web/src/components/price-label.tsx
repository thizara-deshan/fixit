import type { PriceUnit } from '@fixit/contracts';
import { formatServicePrice, priceParts } from '@/lib/format';
import { cn } from '@/lib/utils';

interface PriceLabelProps {
  amount: number;
  unit: PriceUnit;
  /** full = `from LKR 2,500 / hour` (BR-09); short = big `LKR 2,500` + small ` / hour`. */
  variant?: 'full' | 'short';
  /** Size class for the short variant's number, e.g. `text-price-lg` (cards) or `text-price-xl` (profile). */
  amountClassName?: string;
  className?: string;
}

export function PriceLabel({
  amount,
  unit,
  variant = 'full',
  amountClassName = 'text-price-lg',
  className,
}: PriceLabelProps) {
  if (variant === 'full') {
    return (
      <span className={cn('text-body-sm text-text', className)}>{formatServicePrice(amount, unit)}</span>
    );
  }
  const p = priceParts(amount, unit);
  return (
    <span className={cn('inline-flex items-baseline whitespace-nowrap', className)}>
      <span className={cn('text-text', amountClassName)}>{p.amount}</span>
      <span className="text-meta text-text-subtle font-medium">{p.suffix}</span>
    </span>
  );
}
