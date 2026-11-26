import {
  ENDPOINTS as E,
  type AcceptBody,
  type AgreedPriceBody,
  type CompleteBody,
  type DeclineBody,
  type ProviderDashboard,
  type ProviderRequestList,
  type ProviderRequestListQuery,
  type ProviderRequestView,
} from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export const fetchDashboard = (): Promise<ProviderDashboard> =>
  http(pathOf(E.provider_dashboard), { schema: E.provider_dashboard.response });

export const fetchInbox = (q: ProviderRequestListQuery): Promise<ProviderRequestList> =>
  http(pathOf(E.requests_inbox_list), {
    query: { status: q.status, q: q.q === '' ? undefined : q.q, page: q.page },
    schema: E.requests_inbox_list.response,
  });

export const fetchInboxRequest = (ref: string): Promise<ProviderRequestView> =>
  http(pathOf(E.requests_inbox_get, { ref }), { schema: E.requests_inbox_get.response });

export const acceptRequest = (ref: string, body: AcceptBody): Promise<ProviderRequestView> =>
  http(pathOf(E.requests_accept, { ref }), { method: 'POST', body, schema: E.requests_accept.response });

export const declineRequest = (ref: string, body: DeclineBody): Promise<ProviderRequestView> =>
  http(pathOf(E.requests_decline, { ref }), { method: 'POST', body, schema: E.requests_decline.response });

export const completeRequest = (ref: string, body: CompleteBody): Promise<ProviderRequestView> =>
  http(pathOf(E.requests_complete, { ref }), { method: 'POST', body, schema: E.requests_complete.response });

export const setAgreedPrice = (ref: string, body: AgreedPriceBody): Promise<ProviderRequestView> =>
  http(pathOf(E.requests_agreed_price, { ref }), {
    method: 'PUT',
    body,
    schema: E.requests_agreed_price.response,
  });
