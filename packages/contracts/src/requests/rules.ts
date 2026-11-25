import { addDays, colomboStartOfDay, colomboToday } from '../common/dates';
import type { RuleCode } from '../common/errors';
import type { CreateRequestBody } from './schemas';

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

export interface CreateRequestContext {
  now: Date;
  customer: { id: string; emailConfirmed: boolean; hasMobile: boolean };
  provider: {
    userId: string;
    listed: boolean;
    paused: boolean;
    serviceIds: readonly string[];
    townIds: readonly string[];
  };
  openTotal: number;
  openWithProviderRef: string | null;
  body: CreateRequestBody;
}
export type CreateRequestCheck = { ok: true } | { ok: false; rule: RuleCode; ref?: string };

const fail = (rule: RuleCode): CreateRequestCheck => ({ ok: false, rule });

/** Pure pre-check for A11. Callers gather the inputs (API under row lock, mocks from db). Order = SPEC S12 blocked states, then field rules. */
export function checkCreateRequest(c: CreateRequestContext): CreateRequestCheck {
  if (c.provider.userId === c.customer.id) return fail('own_listing');
  if (!c.provider.listed) return fail('provider_unavailable');
  if (c.provider.paused) return fail('provider_paused');
  if (!c.customer.emailConfirmed) return fail('email_unconfirmed');
  if (c.openWithProviderRef !== null)
    return { ok: false, rule: 'open_with_provider', ref: c.openWithProviderRef };
  if (c.openTotal >= OPEN_LIMIT_TOTAL) return fail('open_limit_reached');
  if (!c.customer.hasMobile && c.body.mobile === undefined) return fail('mobile_missing');
  if (!c.provider.serviceIds.includes(c.body.serviceId)) return fail('service_not_offered');
  if (!c.provider.townIds.includes(c.body.townId)) return fail('town_not_served');
  const { min, max } = bookingWindow(c.now);
  if (c.body.preferredDate < min || c.body.preferredDate > max) return fail('date_out_of_window');
  return { ok: true };
}
