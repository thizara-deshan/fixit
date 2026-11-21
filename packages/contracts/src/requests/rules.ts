import { addDays, colomboStartOfDay, colomboToday } from '../common/dates';

export const EXPIRY_HOURS = 72;
export const BOOKING_WINDOW_DAYS = 60;
export const OPEN_LIMIT_TOTAL = 5;
export const OPEN_LIMIT_PER_PROVIDER = 1;

const HOUR_MS = 3_600_000;

/** BR-31: min(createdAt + 72 h, 00:00 Colombo on preferredDate). */
export function expiresAt(createdAt: Date, preferredDate: string): Date {
  const byHours = createdAt.getTime() + EXPIRY_HOURS * HOUR_MS;
  const byDay = colomboStartOfDay(preferredDate).getTime();
  return new Date(Math.min(byHours, byDay));
}

/** BR-30: customer may cancel an Accepted request while now < this instant (00:00 Colombo on preferredDate). */
export function cancelDeadline(preferredDate: string): Date {
  return colomboStartOfDay(preferredDate);
}

/** BR-32: completion allowed on or after the preferred Colombo day. */
export function canComplete(preferredDate: string, now: Date): boolean {
  return colomboToday(now) >= preferredDate;
}

/** BR-34: tomorrow … today + 60 (Colombo days, inclusive). */
export function bookingWindow(now: Date): { min: string; max: string } {
  const today = colomboToday(now);
  return { min: addDays(today, 1), max: addDays(today, BOOKING_WINDOW_DAYS) };
}
