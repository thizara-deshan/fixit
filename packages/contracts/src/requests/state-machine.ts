import { z } from 'zod';
import { FINAL_STATUSES, type RequestStatus } from '../common/enums';
import { canComplete, cancelDeadline } from './rules';

export type MachineActor =
  | { kind: 'customer'; userId: string }
  | { kind: 'provider'; userId: string }
  | { kind: 'admin'; userId: string }
  | { kind: 'system' };

export interface MachineRequest {
  status: RequestStatus;
  customerId: string;
  providerUserId: string;
  preferredDate: string; // IsoDate (Colombo day)
  expiresAt: Date; // rules.expiresAt(createdAt, preferredDate)
}
export interface TransitionInput {
  reason?: string | undefined;
}

export const TransitionReason = z.enum([
  'final_status',
  'invalid_transition',
  'not_allowed_for_actor',
  'not_owner',
  'expired',
  'not_yet_expired',
  'past_cancel_deadline',
  'before_preferred_date',
  'reason_required',
]);
export type TransitionReason = z.infer<typeof TransitionReason>;
export type TransitionResult = { ok: true } | { ok: false; reason: TransitionReason };

type Target = Exclude<RequestStatus, 'pending'>;
type ActorKind = MachineActor['kind'];

const EDGES: Record<'pending' | 'accepted', Partial<Record<Target, readonly ActorKind[]>>> = {
  pending: {
    accepted: ['provider'],
    declined: ['provider', 'system'],
    cancelled: ['customer', 'admin', 'system'],
    expired: ['system'],
  },
  accepted: { cancelled: ['customer', 'admin', 'system'], completed: ['provider'] },
};

const yes: TransitionResult = { ok: true };
const no = (reason: TransitionReason): TransitionResult => ({ ok: false, reason });

export function canTransition(
  req: MachineRequest,
  to: RequestStatus,
  actor: MachineActor,
  now: Date,
  input: TransitionInput = {},
): TransitionResult {
  if ((FINAL_STATUSES as readonly RequestStatus[]).includes(req.status)) return no('final_status');
  const from = req.status as 'pending' | 'accepted';
  const allowed = to === 'pending' ? undefined : EDGES[from][to];
  if (!allowed) return no('invalid_transition');
  if (!allowed.includes(actor.kind)) return no('not_allowed_for_actor');
  if (actor.kind === 'customer' && actor.userId !== req.customerId) return no('not_owner');
  if (actor.kind === 'provider' && actor.userId !== req.providerUserId) return no('not_owner');

  const expired = now.getTime() >= req.expiresAt.getTime();
  if (from === 'pending') {
    if (to === 'expired') return expired ? yes : no('not_yet_expired');
    if (expired && actor.kind !== 'system') return no('expired');
  }
  if (
    from === 'accepted' &&
    to === 'cancelled' &&
    actor.kind === 'customer' &&
    now.getTime() >= cancelDeadline(req.preferredDate).getTime()
  ) {
    return no('past_cancel_deadline');
  }
  if (to === 'completed' && !canComplete(req.preferredDate, now)) return no('before_preferred_date');
  if (actor.kind === 'admin' && to === 'cancelled') {
    const len = input.reason?.trim().length ?? 0;
    if (len < 10 || len > 500) return no('reason_required');
  }
  return yes;
}

/** Thrown by assertTransition. The API filter and the mocks map it to 409 INVALID_TRANSITION (or 403/404, ARCHITECTURE §7.4). */
export class TransitionError extends Error {
  override readonly name = 'TransitionError';
  constructor(readonly reason: TransitionReason) {
    super(`Transition refused: ${reason}`);
  }
}

export function assertTransition(...args: Parameters<typeof canTransition>): void {
  const result = canTransition(...args);
  if (!result.ok) throw new TransitionError(result.reason);
}
