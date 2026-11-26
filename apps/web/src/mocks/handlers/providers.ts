import { dashboardStats, ENDPOINTS as E } from '@fixit/contracts';
import { expireDue } from '../db/expire';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
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
];
