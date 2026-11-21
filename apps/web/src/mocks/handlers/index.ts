import type { RequestHandler } from 'msw';
import { MOCK_DOMAINS, type MockDomain } from '../domains';

export const handlersByDomain: Record<MockDomain, RequestHandler[]> = {
  auth: [],
  catalog: [],
  providers: [],
  requests: [],
  reviews: [],
  admin: [],
};
export const allHandlers: RequestHandler[] = MOCK_DOMAINS.flatMap((d) => handlersByDomain[d]);
