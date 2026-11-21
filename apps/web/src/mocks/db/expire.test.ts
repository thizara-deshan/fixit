import { describe, expect, it } from 'vitest';
import { FIXED_NOW } from '@/test/fixed-now';
import { db } from './store';
import { expireDue } from './expire';

describe('expireDue', () => {
  it('nothing is due at seed time', () => {
    expect(expireDue(db(), FIXED_NOW)).toBe(0);
  });
  it('expires a lapsed pending request and records a system event; others untouched', () => {
    const d = db();
    const lapsed = d.requests['r-FX-2061'];
    if (!lapsed) throw new Error('fixture missing');
    lapsed.expiresAt = new Date(FIXED_NOW.getTime() - 1000).toISOString();
    expect(expireDue(d, FIXED_NOW)).toBe(1);
    expect(lapsed.status).toBe('expired');
    expect(lapsed.closedBy).toBe('system');
    expect(lapsed.events.at(-1)).toMatchObject({ status: 'expired', actor: 'system' });
    expect(d.requests['r-FX-2059']?.status).toBe('pending');
  });
  it('exactly at expiresAt counts as due', () => {
    const d = db();
    const r = d.requests['r-FX-2058'];
    if (!r) throw new Error('fixture missing');
    r.expiresAt = FIXED_NOW.toISOString();
    expect(expireDue(d, FIXED_NOW)).toBe(1);
  });
});
