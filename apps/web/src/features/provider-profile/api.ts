import {
  ENDPOINTS as E,
  type Eligibility,
  type ProviderPublicProfile,
  type PublicReviewPage,
} from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export const fetchProvider = (id: string): Promise<ProviderPublicProfile> =>
  http(pathOf(E.providers_get, { id }), { schema: E.providers_get.response });

export const fetchProviderReviews = (id: string, page: number): Promise<PublicReviewPage> =>
  http(pathOf(E.providers_reviews, { id }), { query: { page }, schema: E.providers_reviews.response });

export const fetchEligibility = (providerId: string): Promise<Eligibility> =>
  http(pathOf(E.requests_eligibility, { providerId }), { schema: E.requests_eligibility.response });
