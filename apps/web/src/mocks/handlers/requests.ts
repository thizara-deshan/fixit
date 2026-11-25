import { ENDPOINTS as E } from '@fixit/contracts';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
import { eligibilityFor } from '../lib/profile';

export const requestsHandlers = [
  mockEndpoint(E.requests_eligibility, ({ db: d, actor, params }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required'); // assertAccess already guarantees this
    return eligibilityFor(d, actor.userId, params.providerId ?? '');
  }),
];
