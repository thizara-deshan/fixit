import type { RequestHandler } from 'msw';
import { authHandlers } from './auth';
import { catalogHandlers } from './catalog';
import { MOCK_DOMAINS, type MockDomain } from '../domains';

export const handlersByDomain: Record<MockDomain, RequestHandler[]> = {
  auth: authHandlers,
  catalog: catalogHandlers,
  providers: [],
  requests: [],
  reviews: [],
  admin: [],
};
export const allHandlers: RequestHandler[] = MOCK_DOMAINS.flatMap((d) => handlersByDomain[d]);
