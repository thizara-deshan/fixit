import type { DiscoverQuery } from '@fixit/contracts';

/** First segment = mock/API domain, so invalidation can be domain-wide (ARCH §4.2). Milestones add their keys. */
export const qk = {
  me: ['auth', 'me'] as const,
  catalog: ['catalog', 'catalog'] as const,
  featured: ['catalog', 'featured'] as const,
  discover: (q: DiscoverQuery) => ['catalog', 'discover', q] as const,
  provider: (id: string) => ['catalog', 'provider', id] as const,
  providerReviews: (id: string) => ['catalog', 'provider-reviews', id] as const,
  eligibility: (providerId: string) => ['requests', 'eligibility', providerId] as const,
  confirmEmail: (token: string) => ['auth', 'confirm', token] as const,
};
