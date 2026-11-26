import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerRequestView, type InboxStatus } from '@fixit/contracts';
import { db } from '../db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { customerViewOf, inboxList, myRequestList, openRequestsOf } from './requests';

const byRef = (ref: string) => {
  const r = Object.values(db().requests).find((x) => x.ref === ref);
  if (!r) throw new Error(ref);
  return r;
};

describe('mock request helpers', () => {
  it('Olivia has FX-2061 open', () => {
    expect(openRequestsOf(db(), 'u-olivia').map((r) => r.ref)).toContain('FX-2061');
  });
  it('pending view hides the provider mobile', () => {
    const v = CustomerRequestView.parse(customerViewOf(db(), byRef('FX-2061'), FIXED_NOW));
    expect(v.provider.businessName).toBe('Bell & Sons Plumbing');
    expect(v.provider.mobile).toBeNull();
  });
  it('completed view shows it and has a review block', () => {
    const v = customerViewOf(db(), byRef('FX-2046'), FIXED_NOW);
    expect(v.provider.mobile).not.toBeNull();
    expect(v.review).not.toBeNull();
  });
});

describe('myRequestList', () => {
  it("Olivia's list: newest update first, counts per group", () => {
    const d = db();
    const list = myRequestList(d, 'u-olivia', { status: 'all', page: 1 }, FIXED_NOW);
    expect(list.counts).toEqual({ all: 11, open: 4, completed: 3, closed: 4 });
    const times = list.items.map((r) => r.updatedAt);
    expect([...times].sort().reverse()).toEqual(times);
    expect(list.items.every((r) => r.ref !== 'FX-2037')).toBe(true); // Marcus's, not Olivia's
  });
  it('filters by group', () => {
    const d = db();
    const closed = myRequestList(d, 'u-olivia', { status: 'closed', page: 1 }, FIXED_NOW);
    expect(closed.items.map((r) => r.status).sort()).toEqual([
      'cancelled',
      'declined',
      'declined',
      'expired',
    ]);
    expect(closed.totalPages).toBe(1);
  });
  it('a customer with no requests → empty, 0 pages', () => {
    const d = db();
    expect(myRequestList(d, 'u-nimal', { status: 'all', page: 1 }, FIXED_NOW)).toMatchObject({
      items: [],
      total: 0,
      totalPages: 0,
      counts: { all: 0, open: 0, completed: 0, closed: 0 },
    });
  });
});

describe('inboxList (p01)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  const q = (o: Partial<{ status: InboxStatus; q: string; page: number }> = {}) =>
    inboxList(db(), 'p01', { status: 'all', q: '', page: 1, ...o }, FIXED_NOW);
  it('counts every status; pending tab is most urgent first', () => {
    const all = q();
    expect(all.counts).toMatchObject({ pending: 3, accepted: 2, declined: 1, cancelled: 2, expired: 1 });
    expect(q({ status: 'pending' }).items.map((r) => r.ref)).toEqual(['FX-2058', 'FX-2059', 'FX-2061']);
  });
  it('all tab: newest first, 20 per page', () => {
    const all = q();
    expect(all.items[0]?.ref).toBe('FX-2061');
    expect(all.items).toHaveLength(20);
    expect(all.totalPages).toBe(Math.ceil(all.total / 20));
  });
  it('search uses the visible name (D-3) and counts follow it (D-4)', () => {
    const r = q({ q: 'martinez' });
    expect(r.items.map((x) => x.ref)).toEqual(['FX-2046']);
    expect(r.counts.all).toBe(1);
    expect(q({ q: 'olivia m' }).items.map((x) => x.ref)).toContain('FX-2061');
  });
  it('pending views carry no contact keys', () => {
    const v = q({ status: 'pending' }).items[0];
    expect(Object.keys(v?.customer ?? {}).sort()).toEqual(['displayName', 'revealed']);
  });
});
