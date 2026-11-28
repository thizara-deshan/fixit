import type {
  AdminUserListQuery,
  DiscoverQuery,
  ModerationQuery,
  ProviderRequestListQuery,
  RequestListQuery,
  VerificationQueueQuery,
} from '@fixit/contracts';

/** First segment = mock/API domain, so invalidation can be domain-wide (ARCH §4.2). Milestones add their keys. */
export const qk = {
  me: ['auth', 'me'] as const,
  ownProvider: ['providers', 'own'] as const,
  verification: ['providers', 'verification'] as const,
  catalog: ['catalog', 'catalog'] as const,
  featured: ['catalog', 'featured'] as const,
  discover: (q: DiscoverQuery) => ['catalog', 'discover', q] as const,
  provider: (id: string) => ['catalog', 'provider', id] as const,
  providerReviews: (id: string) => ['catalog', 'provider-reviews', id] as const,
  eligibility: (providerId: string) => ['requests', 'eligibility', providerId] as const,
  myRequests: {
    all: ['requests', 'mine'] as const,
    detail: (ref: string) => ['requests', 'mine', ref] as const,
    list: (q: RequestListQuery) => ['requests', 'mine', 'list', q] as const,
  },
  inbox: {
    all: ['requests', 'inbox'] as const,
    list: (q: ProviderRequestListQuery) => ['requests', 'inbox', 'list', q] as const,
    detail: (ref: string) => ['requests', 'inbox', ref] as const,
  },
  dashboard: ['providers', 'dashboard'] as const,
  admin: {
    all: ['admin'] as const,
    overview: ['admin', 'overview'] as const,
    queue: (q: VerificationQueueQuery) => ['admin', 'queue', q] as const,
    verification: (id: string) => ['admin', 'verification', id] as const,
    users: (q: AdminUserListQuery) => ['admin', 'users', q] as const,
    user: (id: string) => ['admin', 'user', id] as const,
    reviews: (q: ModerationQuery) => ['admin', 'reviews', q] as const,
    document: (id: string) => ['admin', 'document', id] as const,
  },
  confirmEmail: (token: string) => ['auth', 'confirm', token] as const,
};
