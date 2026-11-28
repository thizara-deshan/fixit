import { ENDPOINTS as E } from '@fixit/contracts';
import {
  approveSubmission,
  nextPendingId,
  queuePage,
  rejectSubmission,
  submissionOr404,
  verificationDetailOf,
} from '../lib/admin-verification';
import { reactivateUser, suspendUser } from '../lib/admin-suspension';
import { managedUserOr404, userDetailOf, userListPage, userOr404 } from '../lib/admin-users';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
import type { MockActor } from '../lib/identity';

/** assertAccess already required role admin; null here is a mock bug. */
export const adminIdOf = (actor: MockActor | null): string => {
  if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
  return actor.userId;
};

export const adminHandlers = [
  mockEndpoint(E.admin_overview, ({ db: d }) => {
    const pending = Object.values(d.submissions)
      .filter((s) => s.status === 'pending_review')
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    return {
      attention: {
        pendingVerifications: pending.length,
        oldestPendingAt: pending[0]?.submittedAt ?? null,
        suspendedUsers: Object.values(d.users).filter((u) => !u.isAdmin && u.status === 'suspended').length,
      },
    };
  }),
  mockEndpoint(E.admin_verifications_list, ({ db: d, query }) => queuePage(d, query)),
  mockEndpoint(E.admin_verification_get, ({ db: d, params }) =>
    verificationDetailOf(d, submissionOr404(d, params.id ?? '')),
  ),
  mockEndpoint(E.admin_verification_approve, ({ db: d, params, actor, now }) => {
    const s = submissionOr404(d, params.id ?? '');
    approveSubmission(d, s, adminIdOf(actor), now);
    return { detail: verificationDetailOf(d, s), nextId: nextPendingId(d, s.id) };
  }),
  mockEndpoint(E.admin_verification_reject, ({ db: d, params, actor, body, now }) => {
    const s = submissionOr404(d, params.id ?? '');
    rejectSubmission(d, s, adminIdOf(actor), body.reason, now);
    return { detail: verificationDetailOf(d, s), nextId: nextPendingId(d, s.id) };
  }),
  mockEndpoint(E.admin_users_list, ({ db: d, query }) => userListPage(d, query)),
  mockEndpoint(E.admin_user_get, ({ db: d, params, now }) =>
    userDetailOf(d, managedUserOr404(d, params.id ?? ''), now),
  ),
  mockEndpoint(E.admin_user_suspend, ({ db: d, params, actor, body, now }) => {
    const u = userOr404(d, params.id ?? ''); // admin target → 422 cannot_suspend_admin inside suspendUser (AC10)
    suspendUser(d, u, adminIdOf(actor), body.reason, now);
    return userDetailOf(d, u, now);
  }),
  mockEndpoint(E.admin_user_reactivate, ({ db: d, params, actor, body, now }) => {
    const u = managedUserOr404(d, params.id ?? '');
    reactivateUser(d, u, adminIdOf(actor), body.reason, now);
    return userDetailOf(d, u, now);
  }),
];
