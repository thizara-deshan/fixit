import {
  ENDPOINTS as E,
  type CancelBody,
  type CreateRequestBody,
  type CreateReviewBody,
  type CustomerRequestView,
  type MyRequestList,
  type RequestListQuery,
  type Review,
} from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export const createRequest = (body: CreateRequestBody): Promise<CustomerRequestView> =>
  http(pathOf(E.requests_create), { method: 'POST', body, schema: E.requests_create.response });

export const fetchMyRequest = (ref: string): Promise<CustomerRequestView> =>
  http(pathOf(E.requests_get, { ref }), { schema: E.requests_get.response });

export const fetchMyRequests = (q: RequestListQuery): Promise<MyRequestList> =>
  http(pathOf(E.requests_list), {
    query: { status: q.status, page: q.page },
    schema: E.requests_list.response,
  });

export const cancelMyRequest = (ref: string, body: CancelBody): Promise<CustomerRequestView> =>
  http(pathOf(E.requests_cancel, { ref }), { method: 'POST', body, schema: E.requests_cancel.response });

export const postReview = (ref: string, body: CreateReviewBody): Promise<Review> =>
  http(pathOf(E.reviews_create, { ref }), { method: 'POST', body, schema: E.reviews_create.response });
