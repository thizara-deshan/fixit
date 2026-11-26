import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { applyOnboardingStep, publishDraft, toOwnProvider } from './own-provider';
import { isListed } from './cards';

const step1 = {
  businessName: 'Martinez Home Fix',
  bio: 'Small repairs and odd jobs around the house, done well.',
  yearsExperience: 4,
};

const thrown = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error('did not throw');
};

describe('own provider (mock)', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('Olivia: step 1 creates the draft, steps advance to 5, publish lists her unverified', () => {
    const d = db();
    const p = applyOnboardingStep(d, 'u-olivia', { step: 1, body: step1 }, FIXED_NOW);
    expect(p.onboardingStep).toBe(2);
    applyOnboardingStep(d, 'u-olivia', { step: 2, body: { categoryId: 'handyman' } }, FIXED_NOW);
    applyOnboardingStep(
      d,
      'u-olivia',
      { step: 3, body: { services: [{ name: 'Shelf fitting', price: 1800, unit: 'per_hour' }] } },
      FIXED_NOW,
    );
    applyOnboardingStep(
      d,
      'u-olivia',
      { step: 4, body: { baseTownId: 'colombo', otherTownIds: ['moratuwa'] } },
      FIXED_NOW,
    );
    expect(p.onboardingStep).toBe(5);
    publishDraft(d, 'u-olivia', FIXED_NOW);
    expect(isListed(d, p)).toBe(true);
    expect(toOwnProvider(d, p)).toMatchObject({
      ownerName: 'Olivia Martinez',
      onboarding: { complete: true, step: 5 },
      verificationStatus: 'not_submitted',
      startingPrice: { amount: 1800, unit: 'per_hour' },
      baseTown: { id: 'colombo' },
      otherTowns: [{ id: 'moratuwa' }],
    });
  });
  it('no skipping, published → 409, unconfirmed → 422', () => {
    const d = db();
    expect(
      thrown(() =>
        applyOnboardingStep(d, 'u-olivia', { step: 2, body: { categoryId: 'plumbing' } }, FIXED_NOW),
      ),
    ).toMatchObject({ status: 422, extra: { details: { rule: 'onboarding_incomplete' } } });
    expect(
      thrown(() =>
        applyOnboardingStep(
          d,
          'u-kasun',
          { step: 4, body: { baseTownId: 'kaduwela', otherTownIds: [] } },
          FIXED_NOW,
        ),
      ),
    ).toMatchObject({ status: 422 });
    expect(
      thrown(() => applyOnboardingStep(d, 'u-marcus', { step: 1, body: step1 }, FIXED_NOW)),
    ).toMatchObject({ status: 409, extra: { details: { rule: 'already_in_state' } } });
    expect(
      thrown(() => applyOnboardingStep(d, 'u-nimal', { step: 1, body: step1 }, FIXED_NOW)),
    ).toMatchObject({ status: 422, extra: { details: { rule: 'email_unconfirmed' } } });
  });
  it('Kasun: draft resumes at step 3 with saved step 1–2 values', () => {
    const d = db();
    const kasun = Object.values(d.providers).find((p) => p.userId === 'u-kasun');
    if (!kasun) throw new Error('kasun');
    expect(toOwnProvider(d, kasun)).toMatchObject({
      businessName: 'Silva Electricals',
      category: { id: 'electrical' },
      services: [],
      baseTown: null,
      onboarding: { complete: false, step: 3 },
    });
  });
  it('publish refuses an incomplete draft', () => {
    expect(thrown(() => publishDraft(db(), 'u-kasun', FIXED_NOW))).toMatchObject({
      status: 422,
      extra: { details: { rule: 'onboarding_incomplete' } },
    });
  });
});
