import {
  computeStartingPrice,
  nextOnboardingStep,
  OnboardingStep1Body,
  type AreasBody,
  type OnboardingBody,
  type OwnProvider,
  type RuleCode,
} from '@fixit/contracts';
import type { FxProvider } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';

export const draftOf = (d: MockDb, userId: string): FxProvider | undefined =>
  Object.values(d.providers).find((p) => p.userId === userId);

/** "Has draft or listing" (ARCH §3.3). None → 404. */
export function requireDraft(d: MockDb, userId: string): FxProvider {
  const p = draftOf(d, userId);
  if (!p) throw mockError(404, 'NOT_FOUND', 'No provider profile');
  return p;
}

export const ruleError = (rule: RuleCode) =>
  mockError(422, 'RULE_VIOLATION', `Rule ${rule}`, { details: { rule } });
export const alreadyPublished = () =>
  mockError(409, 'CONFLICT', 'Listing already published', { details: { rule: 'already_in_state' } });

export function toOwnProvider(d: MockDb, p: FxProvider): OwnProvider {
  const user = d.users[p.userId];
  if (!user) throw mockError(500, 'INTERNAL', 'Owner missing');
  const category = d.categories.find((c) => c.id === p.categoryId);
  const townRef = (id: string) => {
    const t = d.towns.find((x) => x.id === id);
    return t ? { id: t.id, name: t.name } : null;
  };
  const areas = d.areas.filter((a) => a.providerId === p.id);
  const base = areas.find((a) => a.isBase);
  const lastRejection = Object.values(d.submissions)
    .filter((s) => s.providerId === p.id && s.status === 'rejected')
    .sort((a, b) => b.attempt - a.attempt)[0];
  const services = Object.values(d.services)
    .filter((s) => s.providerId === p.id)
    .map((s) => ({ id: s.id, name: s.name, price: s.price, unit: s.unit }));
  return {
    id: p.id,
    ownerName: user.fullName,
    businessName: p.businessName,
    bio: p.bio,
    yearsExperience: p.yearsExperience,
    category: category ? { id: category.id, name: category.name, icon: category.icon } : null,
    services,
    baseTown: base ? townRef(base.townId) : null,
    otherTowns: areas
      .filter((a) => !a.isBase)
      .map((a) => townRef(a.townId))
      .filter((t): t is { id: string; name: string } => t !== null)
      .sort((a, b) => a.name.localeCompare(b.name)),
    photoUrl: p.photoKey ? `/api/files/photos/${p.photoKey}` : null,
    onboarding: { complete: p.onboardingComplete, step: p.onboardingStep },
    publishedAt: p.publishedAt,
    verificationStatus: p.verificationStatus,
    verifiedAt: p.verifiedAt,
    reverificationReason: p.reverificationReason,
    rejectionReason: p.verificationStatus === 'rejected' ? (lastRejection?.rejectionReason ?? null) : null,
    paused: p.paused,
    startingPrice:
      p.startingPrice !== null && p.startingUnit !== null
        ? { amount: p.startingPrice, unit: p.startingUnit }
        : null,
  };
}

function newDraft(userId: string, now: Date): FxProvider {
  return {
    id: `p-${crypto.randomUUID().slice(0, 8)}`,
    userId,
    businessName: null,
    bio: null,
    yearsExperience: null,
    categoryId: null,
    baseTownId: null,
    photoKey: null,
    onboardingStep: 1,
    onboardingComplete: false,
    publishedAt: null,
    verificationStatus: 'not_submitted',
    verifiedAt: null,
    reverificationReason: null,
    paused: false,
    ratingAvg: null,
    reviewCount: 0,
    startingPrice: null,
    startingUnit: null,
    createdAt: now.toISOString(),
  };
}

export const fieldError = (field: string, message: string) =>
  mockError(400, 'VALIDATION_FAILED', 'Validation failed', { fieldErrors: { [field]: [message] } });

/** S19 step 4 and S25 (A25): replaces the provider's towns; validates before writing. */
export function replaceAreas(d: MockDb, p: FxProvider, body: AreasBody): void {
  const active = (tid: string) => d.towns.some((t) => t.id === tid && t.active);
  if (!active(body.baseTownId)) throw fieldError('baseTownId', 'Choose your base town.');
  if (!body.otherTownIds.every(active)) throw fieldError('otherTownIds', 'Choose your base town.');
  d.areas = d.areas.filter((a) => a.providerId !== p.id);
  d.areas.push({ providerId: p.id, townId: body.baseTownId, isBase: true });
  for (const townId of body.otherTownIds) d.areas.push({ providerId: p.id, townId, isBase: false });
  p.baseTownId = body.baseTownId;
}

/** A21. Mutates the db; the handler commits. */
export function applyOnboardingStep(d: MockDb, userId: string, input: OnboardingBody, now: Date): FxProvider {
  const user = d.users[userId];
  if (!user) throw mockError(404, 'NOT_FOUND', 'User not found');
  if (user.emailConfirmedAt === null) throw ruleError('email_unconfirmed');
  let p = draftOf(d, userId);
  if (p?.onboardingComplete) throw alreadyPublished();
  if (!p) {
    if (input.step !== 1) throw ruleError('onboarding_incomplete');
    p = newDraft(userId, now);
    d.providers[p.id] = p;
  }
  if (input.step > p.onboardingStep) throw ruleError('onboarding_incomplete');
  const id = p.id;
  switch (input.step) {
    case 1:
      Object.assign(p, input.body);
      break;
    case 2: {
      const category = d.categories.find((c) => c.id === input.body.categoryId && c.active);
      if (!category) throw fieldError('categoryId', 'Choose a category.');
      p.categoryId = category.id;
      break;
    }
    case 3:
      d.services = Object.fromEntries(Object.entries(d.services).filter(([, s]) => s.providerId !== id));
      for (const s of input.body.services) {
        const sid = crypto.randomUUID();
        d.services[sid] = { id: sid, providerId: id, ...s };
      }
      break;
    case 4:
      replaceAreas(d, p, input.body);
      break;
  }
  p.onboardingStep = nextOnboardingStep(p.onboardingStep, input.step);
  return p;
}

/** A22 (BR-01, BR-23). */
export function publishDraft(d: MockDb, userId: string, now: Date): FxProvider {
  const user = d.users[userId];
  const p = requireDraft(d, userId);
  if (p.onboardingComplete) throw alreadyPublished();
  if (!user || user.emailConfirmedAt === null) throw ruleError('email_unconfirmed');
  const services = Object.values(d.services).filter((s) => s.providerId === p.id);
  const starting = computeStartingPrice(services);
  const step1Ok = OnboardingStep1Body.safeParse({
    businessName: p.businessName,
    bio: p.bio,
    yearsExperience: p.yearsExperience,
  }).success;
  const hasBase = d.areas.some((a) => a.providerId === p.id && a.isBase);
  if (p.onboardingStep < 5 || !step1Ok || p.categoryId === null || starting === null || !hasBase)
    throw ruleError('onboarding_incomplete');
  if (user.mobile === null) throw ruleError('mobile_missing');
  p.onboardingComplete = true;
  p.onboardingStep = 5;
  p.publishedAt = now.toISOString();
  p.startingPrice = starting.amount;
  p.startingUnit = starting.unit;
  return p;
}
