// packages/fixtures/src/build.ts
import { computeStartingPrice, ratingFrom } from '@fixit/contracts';
import { CATEGORIES, DISTRICTS, TOWNS } from './catalog';
import { buildProviders } from './providers';
import {
  buildCustomerJourneyRequests,
  buildInboxClosedRequests,
  buildLimitRequests,
  buildPrototypeRequests,
} from './requests';
import { buildReviews } from './reviews';
import type { World } from './types';
import { buildUsers } from './users';

/** Fresh, deterministic demo world; every date is relative to `now` (D1). */
export function buildWorld(now: Date): World {
  const users = buildUsers(now);
  const { providers, services, areas, submissions, documents } = buildProviders(now);
  const prototypeRequests = buildPrototypeRequests(now, { users, providers, services });
  const inboxClosed = buildInboxClosedRequests(now, { users, providers, services });
  const limitRequests = buildLimitRequests(now, { users, providers, services });
  const { reviews, requests: reviewedRequests } = buildReviews(now, { users, providers, services });

  const journey = buildCustomerJourneyRequests(now, { users, providers, services });
  const allReviews = [...reviews, ...journey.reviews];

  for (const p of providers) {
    const agg = ratingFrom(
      allReviews.filter((r) => r.providerId === p.id && r.visibility === 'visible').map((r) => r.rating),
    );
    p.ratingAvg = agg.rating;
    p.reviewCount = agg.count;
    const start = computeStartingPrice(services.filter((s) => s.providerId === p.id));
    p.startingPrice = start?.amount ?? null;
    p.startingUnit = start?.unit ?? null;
  }

  return {
    categories: CATEGORIES.map((c) => ({ ...c })),
    districts: DISTRICTS.map((d) => ({ ...d })),
    towns: TOWNS.map((t) => ({ ...t })),
    users,
    providers,
    services,
    areas,
    requests: [
      ...prototypeRequests,
      ...limitRequests,
      ...reviewedRequests,
      ...journey.requests,
      ...inboxClosed,
    ],
    reviews: allReviews,
    submissions,
    documents,
  };
}
