import type { PriceUnit } from '../common/enums';

const UNIT_ORDER: Record<PriceUnit, number> = { per_hour: 0, per_visit: 1, fixed: 2 };

/** BR-10: lowest service price with that service's unit; ties → per_hour < per_visit < fixed. No services → null. */
export function computeStartingPrice(
  services: readonly { price: number; unit: PriceUnit }[],
): { amount: number; unit: PriceUnit } | null {
  let best: { amount: number; unit: PriceUnit } | null = null;
  for (const s of services) {
    if (
      best === null ||
      s.price < best.amount ||
      (s.price === best.amount && UNIT_ORDER[s.unit] < UNIT_ORDER[best.unit])
    ) {
      best = { amount: s.price, unit: s.unit };
    }
  }
  return best;
}

export const PRICE_UNIT_SUFFIX: Record<PriceUnit, ' / hour' | ' / visit' | ' fixed'> = {
  per_hour: ' / hour',
  per_visit: ' / visit',
  fixed: ' fixed',
};

/** BR-09 label parts. Cards show `lead` (small, own line) over `LKR {amount}{suffix}`; fixed prices have no lead (D-4). */
export function priceLabel(p: { amount: number; unit: PriceUnit }): {
  lead: 'From' | null;
  amount: number;
  suffix: ' / hour' | ' / visit' | ' fixed';
} {
  return { lead: p.unit === 'fixed' ? null : 'From', amount: p.amount, suffix: PRICE_UNIT_SUFFIX[p.unit] };
}
