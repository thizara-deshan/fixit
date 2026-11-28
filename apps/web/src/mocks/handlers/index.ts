import type { RequestHandler } from 'msw';
import { adminHandlers } from './admin';
import { authHandlers } from './auth';
import { catalogHandlers } from './catalog';
import { providersHandlers } from './providers';
import { requestsHandlers } from './requests';
import { reviewsHandlers } from './reviews';
import { MOCK_DOMAINS, type MockDomain } from '../domains';

export const handlersByDomain: Record<MockDomain, RequestHandler[]> = {
  auth: authHandlers,
  catalog: catalogHandlers,
  providers: providersHandlers,
  requests: requestsHandlers,
  reviews: reviewsHandlers,
  admin: adminHandlers,
};
export const allHandlers: RequestHandler[] = MOCK_DOMAINS.flatMap((d) => handlersByDomain[d]);
