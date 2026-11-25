import { ENDPOINTS as E, type CreateRequestBody, type CustomerRequestView } from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export const createRequest = (body: CreateRequestBody): Promise<CustomerRequestView> =>
  http(pathOf(E.requests_create), { method: 'POST', body, schema: E.requests_create.response });

export const fetchMyRequest = (ref: string): Promise<CustomerRequestView> =>
  http(pathOf(E.requests_get, { ref }), { schema: E.requests_get.response });
