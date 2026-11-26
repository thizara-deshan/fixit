import { describe, expect, it } from 'vitest';
import { CustomerRequestView } from '@fixit/contracts';
import { db } from '../db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { customerViewOf, myRequestList, openRequestsOf } from './requests';

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
