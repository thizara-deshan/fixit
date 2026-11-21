import { TZDate } from '@date-fns/tz';

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
