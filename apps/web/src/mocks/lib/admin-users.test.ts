import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXED_NOW } from '@/test/fixed-now';
import { db } from '../db/store';
import { managedUserOr404, userDetailOf, userListPage } from './admin-users';

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('admin users (mock)', () => {
  it('search "marcus" finds Marcus Bell (and Marcus Lee); admins never listed', () => {
    const names = userListPage(db(), { q: 'marcus', role: 'all', status: 'all', page: 1 }).items.map(
      (u) => u.fullName,
    );
    expect(names).toContain('Marcus Bell');
    expect(userListPage(db(), { q: 'admin@fixit', role: 'all', status: 'all', page: 1 }).total).toBe(0);
  });
  it('role and status filters (D-7)', () => {
    const prov = userListPage(db(), { q: '', role: 'provider', status: 'all', page: 1 }).items;
    expect(prov.every((u) => u.roles.includes('provider'))).toBe(true);
    const cust = userListPage(db(), { q: 'kasun', role: 'customer', status: 'all', page: 1 }).items; // draft = customer
    expect(cust.map((u) => u.id)).toEqual(['u-kasun']);
    const susp = userListPage(db(), { q: '', role: 'all', status: 'suspended', page: 1 }).items;
    expect(susp.map((u) => u.id)).toEqual(['u-ruwan']);
  });
  it('page size 25', () => {
    expect(userListPage(db(), { q: '', role: 'all', status: 'all', page: 1 }).pageSize).toBe(25);
  });
  it('Hank detail: provider listing, impact 1 pending + 1 accepted', () => {
    const v = userDetailOf(db(), managedUserOr404(db(), 'u-hank'), new Date());
    expect(v.provider?.id).toBe('p08');
    expect(v.impact).toEqual({ providerPending: 1, providerAccepted: 1, customerOpen: 0 });
    expect(v.asProvider?.open).toBe(2);
  });
  it('Ruwan history shows the seeded suspension', () => {
    const v = userDetailOf(db(), managedUserOr404(db(), 'u-ruwan'), new Date());
    expect(v.history[0]).toMatchObject({ action: 'user_suspend', adminName: 'Fixit Admin' });
  });
  it('admin account → 404', () => {
    expect(() => managedUserOr404(db(), 'u-admin')).toThrow();
  });
});
