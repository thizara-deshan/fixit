import { dashboardStats, ENDPOINTS as E, OnboardingStepParam, parseOnboardingBody } from '@fixit/contracts';
import { expireDue } from '../db/expire';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
import { applyOnboardingStep, publishDraft, requireDraft, toOwnProvider } from '../lib/own-provider';
import { ownProvider } from '../lib/requests';

export const providersHandlers = [
  mockEndpoint(E.provider_dashboard, ({ db: d, actor, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const p = ownProvider(d, actor.userId);
    const records = Object.values(d.requests).filter((r) => r.providerId === p.id);
    return {
      stats: dashboardStats(records, { rating: p.ratingAvg, count: p.reviewCount }, now),
      services: Object.values(d.services)
        .filter((s) => s.providerId === p.id)
        .map((s) => ({ id: s.id, name: s.name, price: s.price, unit: s.unit })),
      checklist: null, // D-1: M24
    };
  }),
  mockEndpoint(E.provider_me, ({ db: d, actor }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    return toOwnProvider(d, requireDraft(d, actor.userId));
  }),
  mockEndpoint(E.provider_onboarding_save, async ({ db: d, actor, params, request, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const step = OnboardingStepParam.safeParse(params.step);
    if (!step.success) throw mockError(404, 'NOT_FOUND', 'Unknown step');
    const raw: unknown = await request.json().catch(() => undefined);
    // safe: OnboardingStepParam only accepts 1–4
    const input = parseOnboardingBody(step.data as OnboardingStepParam, raw);
    return toOwnProvider(d, applyOnboardingStep(d, actor.userId, input, now));
  }),
  mockEndpoint(E.provider_publish, ({ db: d, actor, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    return toOwnProvider(d, publishDraft(d, actor.userId, now));
  }),
];
