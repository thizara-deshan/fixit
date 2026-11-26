import { describe, expect, it } from 'vitest';
import {
  AreasBody,
  makeStep1Form,
  nextOnboardingStep,
  OnboardingStep2Body,
  OnboardingStepParam,
} from './onboarding';

const messages = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path.join('.'), i.message]));

describe('step 1 form', () => {
  const valid = { businessName: 'Martinez Home Fix', bio: 'x'.repeat(30), yearsExperience: '4', mobile: '' };
  it('parses valid input; years become a number; mobile ignored when not needed', () => {
    expect(makeStep1Form(false).parse(valid)).toEqual({ ...valid, yearsExperience: 4, mobile: undefined });
  });
  it('SPEC messages', () => {
    const r = makeStep1Form(false).safeParse({
      businessName: ' ',
      bio: 'short',
      yearsExperience: '',
      mobile: '',
    });
    expect(messages(r)).toEqual({
      businessName: 'Enter your business name.',
      bio: 'Tell customers about your business in at least 30 characters.',
      yearsExperience: 'Enter a number from 0 to 60.',
    });
    expect(messages(makeStep1Form(false).safeParse({ ...valid, businessName: 'A' }))).toEqual({
      businessName: 'Business name must be 2 to 60 characters.',
    });
    expect(messages(makeStep1Form(false).safeParse({ ...valid, bio: 'x'.repeat(601) }))).toEqual({
      bio: 'Keep your bio under 600 characters.',
    });
    for (const y of ['61', '-1', '2.5', 'abc'])
      expect(messages(makeStep1Form(false).safeParse({ ...valid, yearsExperience: y }))).toEqual({
        yearsExperience: 'Enter a number from 0 to 60.',
      });
  });
  it('mobile required and normalised when needed', () => {
    expect(messages(makeStep1Form(true).safeParse(valid))).toEqual({
      mobile: 'Enter a Sri Lankan mobile number, like 077 123 4567.',
    });
    expect(makeStep1Form(true).parse({ ...valid, mobile: '077 123 4567' }).mobile).toBe('+94771234567');
  });
});

describe('step 2 and areas', () => {
  it('category required', () => {
    expect(messages(OnboardingStep2Body.safeParse({ categoryId: '' }))).toEqual({
      categoryId: 'Choose a category.',
    });
    expect(messages(OnboardingStep2Body.safeParse({}))).toEqual({ categoryId: 'Choose a category.' });
  });
  it('base town required; others ≤ 9; base and duplicates removed', () => {
    expect(messages(AreasBody.safeParse({ baseTownId: '', otherTownIds: [] }))).toEqual({
      baseTownId: 'Choose your base town.',
    });
    expect(
      messages(
        AreasBody.safeParse({
          baseTownId: 'a',
          otherTownIds: Array.from({ length: 10 }, (_, i) => `t${String(i)}`),
        }),
      ),
    ).toEqual({ otherTownIds: 'You can add up to 9 other towns.' });
    expect(AreasBody.parse({ baseTownId: 'a', otherTownIds: ['b', 'a', 'b'] })).toEqual({
      baseTownId: 'a',
      otherTownIds: ['b'],
    });
  });
});

describe('step param and next step', () => {
  it('1–4 only', () => {
    expect(OnboardingStepParam.parse('3')).toBe(3);
    for (const bad of ['0', '5', 'x', '1.5']) expect(OnboardingStepParam.safeParse(bad).success).toBe(false);
  });
  it('advances, never goes back, caps at 5', () => {
    expect(nextOnboardingStep(1, 1)).toBe(2);
    expect(nextOnboardingStep(4, 2)).toBe(4);
    expect(nextOnboardingStep(5, 4)).toBe(5);
  });
});
