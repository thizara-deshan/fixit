import { describe, expect, it } from 'vitest';
import {
  addDays,
  colomboToday,
  computeStartingPrice,
  ratingFrom,
  RequestRecord,
  RequestRef,
} from '@fixit/contracts';
import { buildWorld } from './build';
import { PROTOTYPE_RATINGS } from './prototype-reviews';
import { DEMO_PERSONAS } from './users';

const NOW = new Date('2026-11-22T04:30:00.000Z'); // 10:00 Colombo
const world = buildWorld(NOW);
const today = colomboToday(NOW);
const byRef = (ref: string) => world.requests.find((r) => r.ref === ref);

describe('provider aggregates', () => {
  it.each(Object.entries(PROTOTYPE_RATINGS))('%s = ratingFrom(visible reviews) ≈ prototype', (id, proto) => {
    const p = world.providers.find((x) => x.id === id);
    const agg = ratingFrom(
      world.reviews.filter((r) => r.providerId === id && r.visibility === 'visible').map((r) => r.rating),
    );
    expect(p?.ratingAvg).toBe(agg.rating);
    expect(p?.reviewCount).toBe(agg.count);
    expect(agg.count).toBe(proto.reviewCount);
    expect(Math.abs((agg.rating ?? 0) - proto.rating)).toBeLessThanOrEqual(0.05);
  });
  it('starting price = computeStartingPrice(services); p01 starts at LKR 2,500 / hour', () => {
    for (const p of world.providers) {
      const start = computeStartingPrice(world.services.filter((s) => s.providerId === p.id));
      expect(p.startingPrice).toBe(start?.amount ?? null);
      expect(p.startingUnit).toBe(start?.unit ?? null);
    }
    const p01 = world.providers.find((p) => p.id === 'p01');
    expect([p01?.startingPrice, p01?.startingUnit]).toEqual([2500, 'per_hour']);
  });
  it('M12: Marcus (p01) has an approved attempt with NIC front and back', () => {
    expect(world.submissions.find((s) => s.providerId === 'p01')).toMatchObject({
      status: 'approved',
      attempt: 1,
    });
    expect(
      world.documents
        .filter((d) => d.submissionId === 's-p01-1')
        .map((d) => d.type)
        .sort(),
    ).toEqual(['nic_back', 'nic_front']);
  });
});

describe('reviews and requests', () => {
  it('every review has its own completed request by its author with the same provider', () => {
    const requestIds = world.reviews.map((r) => r.requestId);
    expect(new Set(requestIds).size).toBe(requestIds.length);
    for (const review of world.reviews) {
      const req = world.requests.find((r) => r.id === review.requestId);
      expect(req?.status).toBe('completed');
      expect(req?.customerId).toBe(review.authorId);
      expect(req?.providerId).toBe(review.providerId);
    }
  });
  it('refs and ids are unique and valid; every record matches the contract', () => {
    const refs = world.requests.map((r) => r.ref);
    expect(new Set(refs).size).toBe(refs.length);
    expect(new Set(world.requests.map((r) => r.id)).size).toBe(refs.length);
    for (const r of world.requests) {
      expect(RequestRef.safeParse(r.ref).success).toBe(true);
      expect(() => RequestRecord.parse(r)).not.toThrow();
    }
  });
});

describe('prototype requests', () => {
  it('has the 8 prototype refs', () => {
    for (const ref of [
      'FX-2061',
      'FX-2059',
      'FX-2058',
      'FX-2054',
      'FX-2050',
      'FX-2046',
      'FX-2041',
      'FX-2037',
    ]) {
      expect(byRef(ref)?.providerId).toBe('p01');
    }
  });
  it('has an Accepted request with preferredDate = today', () => {
    expect(world.requests.some((r) => r.status === 'accepted' && r.preferredDate === today)).toBe(true);
  });
  it('has a Completed request of Olivia inside the 30-day window with no review', () => {
    const r = byRef('FX-2046');
    expect(r?.status).toBe('completed');
    expect(r?.customerId).toBe('u-olivia');
    expect(new Date(r?.completedAt ?? 0).getTime()).toBeGreaterThan(NOW.getTime() - 30 * 86_400_000);
    expect(world.reviews.some((v) => v.requestId === r?.id)).toBe(false);
  });
  it('pending requests are 3–6 days out and not expired', () => {
    const pending = world.requests.filter(
      (r) => r.status === 'pending' && r.providerId === 'p01' && r.customerId !== 'u-dilani',
    );
    expect(pending).toHaveLength(3);
    for (const r of pending) {
      expect(r.preferredDate >= addDays(today, 3) && r.preferredDate <= addDays(today, 6)).toBe(true);
      expect(new Date(r.expiresAt).getTime()).toBeGreaterThan(NOW.getTime());
    }
  });
  it('dates move with now', () => {
    const later = buildWorld(new Date(NOW.getTime() + 10 * 86_400_000));
    expect(later.requests.find((r) => r.ref === 'FX-2061')?.preferredDate).toBe(addDays(today, 13));
  });
});

describe('users and providers', () => {
  it('personas exist with the expected state', () => {
    const user = (id: string) => world.users.find((u) => u.id === id);
    for (const p of DEMO_PERSONAS) expect(user(p.userId)?.email).toBe(p.email);
    expect(user('u-olivia')?.emailConfirmedAt).not.toBeNull();
    expect(user('u-nimal')?.emailConfirmedAt).toBeNull();
    expect(user('u-admin')?.isAdmin).toBe(true);
    const emails = world.users.map((u) => u.email);
    expect(new Set(emails).size).toBe(emails.length);
  });
  it('has a Google-only user and a suspended user (M04)', () => {
    const byId = (id: string) => world.users.find((u) => u.id === id);
    expect(byId('u-sanduni')?.authMethods).toEqual(['google']);
    expect(byId('u-ruwan')?.status).toBe('suspended');
  });
  it('Kasun is a draft on step 3; p02 is pending review with a pending submission; Hank not submitted', () => {
    const kasun = world.providers.find((p) => p.userId === 'u-kasun');
    expect([kasun?.onboardingStep, kasun?.onboardingComplete]).toEqual([3, false]);
    expect(world.providers.find((p) => p.id === 'p02')?.verificationStatus).toBe('pending_review');
    expect(world.submissions.find((s) => s.providerId === 'p02')?.status).toBe('pending_review');
    expect(world.providers.find((p) => p.id === 'p08')?.verificationStatus).toBe('not_submitted');
  });
  it('each published provider has a base town plus 2–5 other towns', () => {
    for (const p of world.providers.filter((x) => x.onboardingComplete)) {
      const areas = world.areas.filter((a) => a.providerId === p.id);
      expect(areas.filter((a) => a.isBase).map((a) => a.townId)).toEqual([p.baseTownId]);
      const others = areas.filter((a) => !a.isBase).length;
      expect(others >= 2 && others <= 5).toBe(true);
    }
  });
});

describe('M07 fixtures', () => {
  const prov = (id: string) => world.providers.find((p) => p.id === id);
  it('p12 is listed with no reviews; p13 is paused; p14 belongs to suspended Ruwan', () => {
    expect(world.reviews.filter((r) => r.providerId === 'p12')).toHaveLength(0);
    expect([prov('p12')?.reviewCount, prov('p12')?.ratingAvg]).toEqual([0, null]);
    expect(prov('p13')?.paused).toBe(true);
    expect(prov('p14')?.userId).toBe('u-ruwan');
    expect(world.users.find((u) => u.id === 'u-ruwan')?.status).toBe('suspended');
  });
  it('Dilani has exactly 5 open requests, none with p01', () => {
    const open = world.requests.filter(
      (r) => r.customerId === 'u-dilani' && ['pending', 'accepted'].includes(r.status),
    );
    expect(open).toHaveLength(5);
    expect(open.some((r) => r.providerId === 'p01')).toBe(false);
  });
  it("Olivia's journey requests cover every S15 state (M09)", () => {
    const s = (ref: string) => {
      const r = byRef(ref);
      return [r?.customerId, r?.status, r?.closedBy];
    };
    expect(s('FX-2030')).toEqual(['u-olivia', 'accepted', null]);
    expect(byRef('FX-2031')?.preferredDate).toBe(today);
    expect(s('FX-2032')).toEqual(['u-olivia', 'pending', null]);
    expect(new Date(byRef('FX-2032')?.expiresAt ?? 0).getTime() - NOW.getTime()).toBe(6 * 60_000);
    expect(s('FX-2033')).toEqual(['u-olivia', 'declined', 'provider']);
    expect(s('FX-2034')).toEqual(['u-olivia', 'declined', 'system']);
    expect(s('FX-2035')).toEqual(['u-olivia', 'cancelled', 'admin']);
    expect(byRef('FX-2035')?.events.at(-1)?.actorUserId).toBe('u-admin');
    expect(s('FX-2036')).toEqual(['u-olivia', 'expired', 'system']);
    expect(s('FX-2029')).toEqual(['u-olivia', 'completed', 'provider']);
    const hidden = world.reviews.find((v) => v.requestId === byRef('FX-2028')?.id);
    expect(hidden?.visibility).toBe('hidden');
  });
  it('Olivia has 4 open requests (under the limit of 5)', () => {
    const open = world.requests.filter(
      (r) => r.customerId === 'u-olivia' && (r.status === 'pending' || r.status === 'accepted'),
    );
    expect(open.map((r) => r.ref).sort()).toEqual(['FX-2030', 'FX-2031', 'FX-2032', 'FX-2061']);
  });
});

describe('M10 inbox fixtures (D-13)', () => {
  it('p01 has every status, incl. cancelled by the customer and by Fixit, and expired', () => {
    const p01 = world.requests.filter((r) => r.providerId === 'p01');
    for (const s of ['pending', 'accepted', 'completed', 'declined', 'cancelled', 'expired'])
      expect(p01.some((r) => r.status === s)).toBe(true);
    expect(byRef('FX-2038')).toMatchObject({
      status: 'cancelled',
      closedBy: 'customer',
      reason: 'Found someone closer to home.',
    });
    expect(byRef('FX-2038')?.events.at(-1)).toMatchObject({ actor: 'customer', actorUserId: 'u-daniel-kim' });
    expect(byRef('FX-2039')).toMatchObject({ status: 'cancelled', closedBy: 'admin' });
    expect(byRef('FX-2040')).toMatchObject({ status: 'expired', closedBy: 'system' });
  });
  it('Chathura (p12) is a listed provider with no requests', () => {
    expect(world.providers.find((p) => p.id === 'p12')?.userId).toBe('u-chathura');
    expect(world.requests.some((r) => r.providerId === 'p12')).toBe(false);
  });
  it('M11: p10 is rejected with a reason and staged copies', () => {
    expect(world.providers.find((p) => p.id === 'p10')?.verificationStatus).toBe('rejected');
    const sub = world.submissions.find((s) => s.providerId === 'p10');
    expect(sub).toMatchObject({ status: 'rejected', attempt: 1 });
    expect(sub?.rejectionReason?.length).toBeGreaterThanOrEqual(10);
    const docs = world.documents.filter((d) => d.providerId === 'p10');
    expect(
      docs
        .filter((d) => d.submissionId === null)
        .map((d) => d.type)
        .sort(),
    ).toEqual(['nic_back', 'nic_front']);
  });
});
