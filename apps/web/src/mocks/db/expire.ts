// apps/web/src/mocks/db/expire.ts
import { assertTransition, toMachineRequest } from '@fixit/contracts';
import type { MockDb } from './schema';

/** Mock stand-in for the expiry cron: pending requests at/after expiresAt → expired (actor system). Returns the count. */
export function expireDue(d: MockDb, now: Date): number {
  let count = 0;
  for (const r of Object.values(d.requests)) {
    if (r.status !== 'pending' || new Date(r.expiresAt).getTime() > now.getTime()) continue;
    assertTransition(toMachineRequest(r), 'expired', { kind: 'system' }, now);
    const at = now.toISOString();
    r.status = 'expired';
    r.closedBy = 'system';
    r.updatedAt = at;
    r.events.push({ status: 'expired', at, actor: 'system', actorUserId: null, reason: null });
    count += 1;
  }
  return count;
}
