import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FxProvider } from '@fixit/fixtures';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { updateBusiness } from './business';

const bio = 'Family-run plumbing business serving Colombo for over a decade. Upfront pricing.';
const prov = (id: string): FxProvider => {
  const p = db().providers[id];
  if (!p) throw new Error(`fixture ${id} missing`);
  return p;
};
const card = (p: FxProvider) => ({
  businessName: p.businessName ?? '',
  bio,
  yearsExperience: 10,
  categoryId: p.categoryId ?? '',
});

describe('updateBusiness (BR-21, AC8)', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('bio only on verified Marcus → no reverification, still verified', () => {
    const p = prov('p01');
    expect(updateBusiness(db(), p, card(p), FIXED_NOW)).toBeNull();
    expect(p.verificationStatus).toBe('verified');
    expect(p.bio).toBe(bio);
  });
  it('name change on verified → pending_review, attempt 2 re-queues the approved documents', () => {
    const d = db();
    const p = prov('p01');
    expect(updateBusiness(d, p, { ...card(p), businessName: 'Bell Plumbing Co' }, FIXED_NOW)).toBe(
      'business_name',
    );
    expect(p).toMatchObject({
      verificationStatus: 'pending_review',
      reverificationReason: 'business_name',
      verifiedAt: null,
    });
    expect(d.submissions['s-p01-2']).toMatchObject({
      attempt: 2,
      trigger: 'business_name',
      status: 'pending_review',
    });
    expect(
      Object.values(d.documents)
        .filter((x) => x.submissionId === 's-p01-2')
        .map((x) => x.type)
        .sort(),
    ).toEqual(['nic_back', 'nic_front']);
  });
  it('category change on pending_review (Dana) → saved, no reason, no new attempt (decision 006)', () => {
    const d = db();
    const p = prov('p02');
    expect(updateBusiness(d, p, { ...card(p), categoryId: 'handyman' }, FIXED_NOW)).toBeNull();
    expect(p).toMatchObject({
      verificationStatus: 'pending_review',
      reverificationReason: null,
      categoryId: 'handyman',
    });
    expect(Object.values(d.submissions).filter((s) => s.providerId === 'p02')).toHaveLength(1);
  });
  it('not_submitted (Hank) and rejected (Grace) → no change', () => {
    const d = db();
    const grace = prov('p10');
    expect(updateBusiness(d, grace, { ...card(grace), businessName: 'Renamed Ltd' }, FIXED_NOW)).toBeNull();
    expect(grace.verificationStatus).toBe('rejected');
    const hank = Object.values(d.providers).find((x) => x.userId === 'u-hank');
    if (!hank) throw new Error('fixture hank missing');
    expect(updateBusiness(d, hank, { ...card(hank), categoryId: 'handyman' }, FIXED_NOW)).toBeNull();
    expect(hank).toMatchObject({ verificationStatus: 'not_submitted', reverificationReason: null });
  });
  it('inactive or unknown category → 400 Choose a category.', () => {
    const p = prov('p01');
    expect(() => updateBusiness(db(), p, { ...card(p), categoryId: 'nope' }, FIXED_NOW)).toThrow();
    expect(p.categoryId).toBe('plumbing');
  });
});
