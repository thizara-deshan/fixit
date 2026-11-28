import { toMachineRequest, type RequestRecord } from '../requests/record';
import { canTransition, type MachineActor } from '../requests/state-machine';
import type { SuspendImpact } from './schemas';

export const PROVIDER_UNAVAILABLE = 'Provider unavailable';
export const CUSTOMER_ACCOUNT_CLOSED = 'Customer account closed';

export interface SuspensionEffect {
  requestId: string;
  to: 'declined' | 'cancelled';
  side: 'provider' | 'customer';
  reason: string;
}

const SYSTEM: MachineActor = { kind: 'system' };

/** BR-41/BR-42 (A31): what suspending `userId` does to open requests. Pure — the API runs it under row locks, the mock inside one handler. */
export function planSuspension(
  requests: readonly RequestRecord[],
  userId: string,
  now: Date,
): SuspensionEffect[] {
  const out: SuspensionEffect[] = [];
  for (const r of requests) {
    if (r.status !== 'pending' && r.status !== 'accepted') continue;
    let effect: SuspensionEffect | null = null;
    if (r.providerUserId === userId)
      effect = {
        requestId: r.id,
        to: r.status === 'pending' ? 'declined' : 'cancelled',
        side: 'provider',
        reason: PROVIDER_UNAVAILABLE,
      };
    else if (r.customerId === userId)
      effect = { requestId: r.id, to: 'cancelled', side: 'customer', reason: CUSTOMER_ACCOUNT_CLOSED };
    if (effect && canTransition(toMachineRequest(r), effect.to, SYSTEM, now).ok) out.push(effect);
  }
  return out;
}

export function suspendImpact(effects: readonly SuspensionEffect[]): SuspendImpact {
  return {
    providerPending: effects.filter((e) => e.side === 'provider' && e.to === 'declined').length,
    providerAccepted: effects.filter((e) => e.side === 'provider' && e.to === 'cancelled').length,
    customerOpen: effects.filter((e) => e.side === 'customer').length,
  };
}
