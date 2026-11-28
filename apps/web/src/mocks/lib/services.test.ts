import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FxProvider } from '@fixit/fixtures';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { MockHttpError } from './errors';
import { createService, deleteService, servicesOf, updateService } from './services';

const thrown = (fn: () => unknown): MockHttpError => {
  try {
    fn();
  } catch (e) {
    if (e instanceof MockHttpError) return e;
    throw e;
  }
  throw new Error('did not throw');
};
const marcus = (): FxProvider => {
  const p = db().providers.p01;
  if (!p) throw new Error('fixture p01 missing');
  return p;
};

describe('mock services', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('add a cheaper service → starting price follows (BR-10)', () => {
    const d = db();
    const p = marcus();
    expect([p.startingPrice, p.startingUnit]).toEqual([2500, 'per_hour']);
    createService(d, p, { name: 'Gutter cleaning', price: 1500, unit: 'per_visit' });
    expect([p.startingPrice, p.startingUnit]).toEqual([1500, 'per_visit']);
  });
  it('duplicate name (case-insensitive) → 409 service_name_taken; editing itself is fine', () => {
    const d = db();
    const p = marcus();
    const e = thrown(() => createService(d, p, { name: 'leak REPAIR', price: 900, unit: 'fixed' }));
    expect([e.status, e.extra.details?.rule]).toEqual([409, 'service_name_taken']);
    const leak = servicesOf(d, p.id).find((s) => s.name === 'Leak repair');
    if (!leak) throw new Error('fixture service missing');
    expect(updateService(d, p, leak.id, { name: 'Leak repair', price: 2000, unit: 'per_hour' }).price).toBe(
      2000,
    );
    expect(p.startingPrice).toBe(2000);
  });
  it('another provider’s service → 404', () => {
    const d = db();
    const other = Object.values(d.services).find((s) => s.providerId === 'p02');
    if (!other) throw new Error('fixture service missing');
    expect(
      thrown(() => updateService(d, marcus(), other.id, { name: 'X1', price: 100, unit: 'fixed' })).status,
    ).toBe(404);
    expect(
      thrown(() => {
        deleteService(d, marcus(), other.id);
      }).status,
    ).toBe(404);
  });
  it('limits: 20 max (services_max), 1 min (services_min)', () => {
    const d = db();
    const p = marcus();
    for (let i = servicesOf(d, p.id).length; i < 20; i++)
      createService(d, p, { name: `Extra ${String(i)}`, price: 5000, unit: 'fixed' });
    expect(
      thrown(() => createService(d, p, { name: 'One more', price: 5000, unit: 'fixed' })).extra.details?.rule,
    ).toBe('services_max');
    const ids = servicesOf(d, p.id).map((s) => s.id);
    for (const id of ids.slice(1)) deleteService(d, p, id);
    const last = ids[0] ?? '';
    expect(
      thrown(() => {
        deleteService(d, p, last);
      }).extra.details?.rule,
    ).toBe('services_min');
  });
});
