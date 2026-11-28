import { PAGE_SIZE, type AuditEntry, type AuditTargetType } from '@fixit/contracts';
import type { FxAudit } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';

/** Same-"transaction" audit write: call inside the handler that makes the change (ARCH §7.9). */
export function recordAudit(d: MockDb, row: Omit<FxAudit, 'id' | 'at'>, now: Date): FxAudit {
  const entry: FxAudit = { id: `a-${crypto.randomUUID().slice(0, 8)}`, at: now.toISOString(), ...row };
  d.audit.push(entry);
  return entry;
}

export const auditFor = (d: MockDb, targetType: AuditTargetType, targetId: string): FxAudit[] =>
  d.audit
    .filter((a) => a.targetType === targetType && a.targetId === targetId)
    .sort((a, b) => b.at.localeCompare(a.at)); // newest first

export const toAuditEntry = (d: MockDb, a: FxAudit): AuditEntry => ({
  id: a.id,
  action: a.action,
  targetType: a.targetType,
  targetId: a.targetId,
  reason: a.reason,
  at: a.at,
  adminId: a.adminId,
  adminName: d.users[a.adminId]?.fullName ?? 'Fixit admin',
});

/** D-5: the thing was already changed (by another admin or an earlier click). */
export const alreadyInState = (status: string) =>
  mockError(409, 'CONFLICT', `Already ${status}`, { details: { rule: 'already_in_state', status } });

export function paginate<T>(rows: readonly T[], page: number) {
  const pageSize = PAGE_SIZE.admin;
  const start = (page - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    page,
    pageSize,
    total: rows.length,
    totalPages: Math.ceil(rows.length / pageSize),
  };
}
