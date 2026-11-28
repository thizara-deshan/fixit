import { describe, expect, it } from 'vitest';
import { addDays, colomboDaysSince, colomboStartOfDay, colomboToday, formatInColombo } from './dates';

describe('colomboToday', () => {
  it('is still the 10th at 23:59:59 Colombo (18:29:59 UTC)', () => {
    expect(colomboToday(new Date('2026-03-10T18:29:59.000Z'))).toBe('2026-03-10');
  });
  it('is the 11th at 00:00 Colombo (18:30 UTC the day before)', () => {
    expect(colomboToday(new Date('2026-03-10T18:30:00.000Z'))).toBe('2026-03-11');
  });
});

describe('colomboStartOfDay', () => {
  it('is 18:30 UTC on the previous day', () => {
    expect(colomboStartOfDay('2026-03-11').toISOString()).toBe('2026-03-10T18:30:00.000Z');
  });
  it('rejects a non-ISO date', () => {
    expect(() => colomboStartOfDay('11/03/2026')).toThrow();
  });
});

describe('addDays', () => {
  it('crosses month, year and adds 60', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-10', 60)).toBe('2026-05-09');
  });
});

describe('formatInColombo', () => {
  it('uses Colombo wall-clock time (UTC+5:30)', () => {
    expect(formatInColombo(new Date('2026-11-21T10:12:00.000Z'), 'd MMM yyyy, h:mm a')).toBe(
      '21 Nov 2026, 3:42 PM',
    );
  });
  it('rolls over to the next Colombo day', () => {
    expect(formatInColombo(new Date('2026-11-21T20:00:00.000Z'), 'EEE, d MMM yyyy')).toBe('Sun, 22 Nov 2026');
  });
});

describe('colomboDaysSince', () => {
  const now = new Date('2026-11-24T06:00:00Z'); // 11:30 Colombo, 24 Nov
  it('same Colombo day → 0', () => {
    expect(colomboDaysSince(new Date('2026-11-23T19:00:00Z'), now)).toBe(0); // 00:30 Colombo 24 Nov
  });
  it('23:59 Colombo the day before → 1', () => {
    expect(colomboDaysSince(new Date('2026-11-23T18:29:00Z'), now)).toBe(1);
  });
  it('three days back → 3', () => {
    expect(colomboDaysSince(new Date('2026-11-21T04:00:00Z'), now)).toBe(3);
  });
  it('future instant → 0', () => {
    expect(colomboDaysSince(new Date('2026-11-30T00:00:00Z'), now)).toBe(0);
  });
});
