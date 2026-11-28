import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

export const COLOMBO_TZ = 'Asia/Colombo';

const pad = (n: number): string => String(n).padStart(2, '0');

function parseIsoDate(iso: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Not an ISO date (YYYY-MM-DD): ${iso}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** The Colombo calendar day containing `now`, as 'YYYY-MM-DD'. */
export function colomboToday(now: Date): string {
  const z = new TZDate(now.getTime(), COLOMBO_TZ);
  return `${String(z.getFullYear())}-${pad(z.getMonth() + 1)}-${pad(z.getDate())}`;
}

/** The instant of 00:00 Asia/Colombo on `isoDate`. */
export function colomboStartOfDay(isoDate: string): Date {
  const [y, m, d] = parseIsoDate(isoDate);
  return new Date(new TZDate(y, m - 1, d, COLOMBO_TZ).getTime());
}

/** Calendar arithmetic on a 'YYYY-MM-DD' day (time-zone free). */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = parseIsoDate(isoDate);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Formats an instant as seen on a wall clock in Asia/Colombo (date-fns pattern, e.g. 'EEE, d MMM yyyy'). Pure: the instant is passed in. */
export function formatInColombo(instant: Date, pattern: string): string {
  return format(new TZDate(instant.getTime(), COLOMBO_TZ), pattern);
}

/** Whole Colombo calendar days from `instant`'s day to `now`'s day (never negative). Colombo has no DST. */
export function colomboDaysSince(instant: Date, now: Date): number {
  const a = colomboStartOfDay(colomboToday(instant)).getTime();
  const b = colomboStartOfDay(colomboToday(now)).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}
