import { OPEN_LIMIT_TOTAL } from './rules';
import type { Eligibility } from './schemas';

export interface EligibilityInput {
  viewer: { userId: string; isAdmin: boolean; emailConfirmed: boolean };
  /** null = unknown id. `listed` = BR-01 (complete, published, owner active). */
  provider: { id: string; userId: string; listed: boolean; paused: boolean } | null;
  /** The viewer's open (pending|accepted) requests, any provider. */
  openRequests: readonly { ref: string; providerId: string }[];
}

/** Server-side S3.E7 / S12 order (D-3). Pure; used by the mock handler and later the API. */
export function evaluateEligibility({ viewer, provider, openRequests }: EligibilityInput): Eligibility {
  if (viewer.isAdmin) return { state: 'admin' };
  if (provider && provider.userId === viewer.userId) return { state: 'own_listing' };
  if (!provider?.listed) return { state: 'provider_unavailable' };
  if (provider.paused) return { state: 'provider_paused' };
  const withProvider = openRequests.find((r) => r.providerId === provider.id);
  if (withProvider) return { state: 'open_with_provider', ref: withProvider.ref };
  if (openRequests.length >= OPEN_LIMIT_TOTAL) return { state: 'open_limit_reached' };
  if (!viewer.emailConfirmed) return { state: 'email_unconfirmed' };
  return { state: 'ok' };
}
