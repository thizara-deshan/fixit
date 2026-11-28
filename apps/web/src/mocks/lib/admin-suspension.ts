import { planSuspension } from '@fixit/contracts';
import type { MockDb, MockUser } from '../db/schema';
import { expireDue } from '../db/expire';
import { alreadyInState, recordAudit } from './admin-audit';
import { mockError } from './errors';
import { applyTransition, transitionOr409 } from './requests';

/** A31: cascade (BR-41/42) through the state machine as `system`, then the status, then the audit row. */
export function suspendUser(d: MockDb, u: MockUser, adminId: string, reason: string, now: Date): void {
  if (u.isAdmin)
    throw mockError(422, 'RULE_VIOLATION', 'Admins cannot be suspended', {
      details: { rule: 'cannot_suspend_admin' },
    });
  if (u.status === 'suspended') throw alreadyInState('suspended');
  expireDue(d, now);
  for (const e of planSuspension(Object.values(d.requests), u.id, now)) {
    const r = d.requests[e.requestId];
    if (!r) continue;
    transitionOr409(r, e.to, { kind: 'system' }, now);
    applyTransition(r, e.to, 'system', null, now, e.reason);
  }
  u.status = 'suspended'; // resolveActor + refresh already refuse suspended users → sessions end
  recordAudit(d, { adminId, action: 'user_suspend', targetType: 'user', targetId: u.id, reason }, now);
}

/** A32 / BR-43: sign-in and listing back; closed requests stay closed; verification unchanged. */
export function reactivateUser(d: MockDb, u: MockUser, adminId: string, reason: string, now: Date): void {
  if (u.isAdmin) throw mockError(404, 'NOT_FOUND', 'No such user');
  if (u.status === 'active') throw alreadyInState('active');
  u.status = 'active';
  recordAudit(d, { adminId, action: 'user_reactivate', targetType: 'user', targetId: u.id, reason }, now);
}
