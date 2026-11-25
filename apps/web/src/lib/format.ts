import {
  colomboStartOfDay,
  formatInColombo,
  priceLabel,
  type PriceUnit,
  type TimeSlot,
} from '@fixit/contracts';

const grouping = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** `LKR 2,500` (whole rupees). */
export const formatLkr = (amount: number): string => `LKR ${grouping.format(amount)}`;

/** BR-09: `from LKR 2,500 / hour`, `from LKR 1,500 / visit`, `LKR 4,500 fixed`. */
export function formatServicePrice(amount: number, unit: PriceUnit): string {
  const l = priceLabel({ amount, unit });
  return `${l.lead ? 'from ' : ''}${formatLkr(amount)}${l.suffix}`;
}

/** Short price for cards: big `LKR 2,500` + small suffix, plus the `From` lead (null for fixed). */
export function priceParts(
  amount: number,
  unit: PriceUnit,
): { lead: 'From' | null; amount: string; suffix: string } {
  const l = priceLabel({ amount, unit });
  return { lead: l.lead, amount: formatLkr(amount), suffix: l.suffix };
}

/** 'YYYY-MM-DD' is a Colombo calendar day; anything else is an instant (ISO date-time or Date). */
function toInstant(value: string | Date): Date {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return colomboStartOfDay(value);
  return typeof value === 'string' ? new Date(value) : value;
}

/** `Sat, 21 Nov 2026` */
export const formatDateLong = (value: string | Date): string =>
  formatInColombo(toInstant(value), 'EEE, d MMM yyyy');
/** `Sat, 21 Nov` (tables) */
export const formatDateShort = (value: string | Date): string =>
  formatInColombo(toInstant(value), 'EEE, d MMM');
/** `21 Nov 2026, 3:42 PM` (history) */
/** `12 Sep 2026` (S3.E11 review date) */
export const formatReviewDate = (value: string | Date): string =>
  formatInColombo(toInstant(value), 'd MMM yyyy');

export const formatDateTime = (value: string | Date): string =>
  formatInColombo(toInstant(value), 'd MMM yyyy, h:mm a');

/** E.164 `+94771234567` → `+94 77 123 4567`. Anything else is returned unchanged. */
export function formatPhone(e164: string): string {
  if (!/^\+947\d{8}$/.test(e164)) return e164;
  return `+94 ${e164.slice(3, 5)} ${e164.slice(5, 8)} ${e164.slice(8)}`;
}

/** 1 decimal; no reviews → `New`. */
export function formatRating(rating: number | null, count: number): string {
  return rating === null || count === 0 ? 'New' : rating.toFixed(1);
}

/** SPEC §9 Stars text alternative. */
export function ratingAriaLabel(rating: number | null, count: number): string {
  if (rating === null || count === 0) return 'New, no reviews yet';
  return `Rated ${rating.toFixed(1)} out of 5, ${String(count)} ${count === 1 ? 'review' : 'reviews'}`;
}

/** Avatar initials: first letter of the first and last word. `Olivia Martinez` → `OM`. */
export function initialsOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** `Sat, 21 Nov, 3:42 PM` (S13 reply deadline) */
export const formatDeadline = (value: string | Date): string =>
  formatInColombo(toInstant(value), 'EEE, d MMM, h:mm a');

export const SLOT_LABEL: Record<TimeSlot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};
