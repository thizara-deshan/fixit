import { displayNameOf, OPEN_STATUSES, type Me, type RequestStatus } from '@fixit/contracts';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';
import { rolesOf } from './identity';

const isOpen = (s: RequestStatus): boolean => (OPEN_STATUSES as readonly RequestStatus[]).includes(s);

export function buildMe(d: MockDb, userId: string): Me {
  const user = d.users[userId];
  if (!user) throw mockError(404, 'NOT_FOUND', 'User not found');
  const requests = Object.values(d.requests);
  const provider = Object.values(d.providers).find((p) => p.userId === userId);
  const lastRejection = provider
    ? Object.values(d.submissions)
        .filter((s) => s.providerId === provider.id && s.status === 'rejected')
        .sort((a, b) => b.attempt - a.attempt)[0]
    : undefined;
  return {
    id: user.id,
    fullName: user.fullName,
    displayName: displayNameOf(user.fullName),
    email: user.email,
    emailConfirmed: user.emailConfirmedAt !== null,
    mobile: user.mobile,
    authMethods: user.authMethods,
    roles: rolesOf(d, userId),
    openRequestCount: requests.filter((r) => r.customerId === userId && isOpen(r.status)).length,
    provider: provider
      ? {
          id: provider.id,
          businessName: provider.businessName,
          onboarding: { complete: provider.onboardingComplete, step: provider.onboardingStep },
          verificationStatus: provider.verificationStatus,
          reverificationReason: provider.reverificationReason,
          rejectionReason:
            provider.verificationStatus === 'rejected' ? (lastRejection?.rejectionReason ?? null) : null,
          paused: provider.paused,
          pendingRequestCount: requests.filter((r) => r.providerId === provider.id && r.status === 'pending')
            .length,
        }
      : null,
  };
}
