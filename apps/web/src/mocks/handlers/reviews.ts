import { displayNameOf, ENDPOINTS as E, ratingFrom, reviewEligibility } from '@fixit/contracts';
import type { FxReview } from '@fixit/fixtures';
import { expireDue } from '../db/expire';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';

export const reviewsHandlers = [
  mockEndpoint(E.reviews_create, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const r = Object.values(d.requests).find((x) => x.ref === params.ref && x.customerId === actor.userId);
    if (!r) throw mockError(404, 'NOT_FOUND', 'Request not found'); // other owner → 404
    const existing = Object.values(d.reviews).find((v) => v.requestId === r.id) ?? null;
    const check = reviewEligibility(r, existing, actor.userId, now);
    if (!check.ok) throw mockError(422, 'RULE_VIOLATION', check.rule, { details: { rule: check.rule } });
    const author = d.users[actor.userId];
    const provider = d.providers[r.providerId];
    if (!author || !provider) throw mockError(500, 'INTERNAL', 'Review author or provider missing');
    const review: FxReview = {
      id: `v-${r.ref}`,
      requestId: r.id,
      providerId: provider.id,
      authorId: author.id,
      rating: body.rating,
      text: body.text,
      visibility: 'visible',
      createdAt: now.toISOString(),
      replyText: null,
      replyCreatedAt: null,
      replyUpdatedAt: null,
    };
    d.reviews[review.id] = review;
    // BR-27 / F-29: recompute from visible reviews (same "transaction": one handler run, one commit)
    const agg = ratingFrom(
      Object.values(d.reviews)
        .filter((v) => v.providerId === provider.id && v.visibility === 'visible')
        .map((v) => v.rating),
    );
    provider.ratingAvg = agg.rating;
    provider.reviewCount = agg.count;
    return {
      id: review.id,
      authorDisplayName: displayNameOf(author.fullName),
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt,
      reply: null,
      requestRef: r.ref,
      serviceName: r.service.name,
      providerId: provider.id,
      visibility: review.visibility,
    };
  }),
];
