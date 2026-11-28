import {
  matchesUserSearch,
  OPEN_STATUSES,
  planSuspension,
  suspendImpact,
  type AdminRequestRow,
  type AdminRequestSummary,
  type AdminUserDetail,
  type AdminUserList,
  type AdminUserListQuery,
  type RequestRecord,
  type RequestStatus,
  type Role,
} from '@fixit/contracts';
import type { FxProvider } from '@fixit/fixtures';
import type { MockDb, MockUser } from '../db/schema';
import { auditFor, paginate, toAuditEntry } from './admin-audit';
import { isListed } from './cards';
import { mockError } from './errors';

export const publishedOf = (d: MockDb, userId: string): FxProvider | undefined =>
  Object.values(d.providers).find((p) => p.userId === userId && p.onboardingComplete);

const rolesOf = (d: MockDb, u: MockUser): Role[] =>
  publishedOf(d, u.id) ? ['customer', 'provider'] : ['customer'];

export function userListPage(d: MockDb, q: AdminUserListQuery): AdminUserList {
  const rows = Object.values(d.users)
    .filter((u) => !u.isAdmin)
    .filter((u) => {
      const p = publishedOf(d, u.id);
      if (q.role === 'customer' && p) return false;
      if (q.role === 'provider' && !p) return false;
      if (q.status === 'suspended' && u.status !== 'suspended') return false;
      return matchesUserSearch(q.q, {
        fullName: u.fullName,
        email: u.email,
        mobile: u.mobile,
        businessName: p?.businessName ?? null,
      });
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.fullName.localeCompare(b.fullName));
  const page = paginate(rows, q.page);
  return {
    ...page,
    items: page.items.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      mobile: u.mobile,
      roles: rolesOf(d, u),
      verificationStatus: publishedOf(d, u.id)?.verificationStatus ?? null,
      joinedAt: u.createdAt,
      status: u.status,
    })),
  };
}

/** Unknown id → 404. Admin accounts are not managed in the app (BR-40) → 404 on GET. */
export function userOr404(d: MockDb, id: string): MockUser {
  const u = d.users[id];
  if (!u) throw mockError(404, 'NOT_FOUND', 'No such user');
  return u;
}
export function managedUserOr404(d: MockDb, id: string): MockUser {
  const u = userOr404(d, id);
  if (u.isAdmin) throw mockError(404, 'NOT_FOUND', 'No such user');
  return u;
}

function rowOf(d: MockDb, r: RequestRecord): AdminRequestRow {
  return {
    ref: r.ref,
    status: r.status,
    customerName: d.users[r.customerId]?.fullName ?? '',
    businessName: d.providers[r.providerId]?.businessName ?? '',
    serviceName: r.service.name,
    preferredDate: r.preferredDate,
    slot: r.slot,
    townName: d.towns.find((t) => t.id === r.townId)?.name ?? r.townId,
  };
}

const isOpen = (s: RequestStatus) => (OPEN_STATUSES as readonly RequestStatus[]).includes(s);
function summaryOf(d: MockDb, rows: RequestRecord[]): AdminRequestSummary {
  const sorted = [...rows].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt) || b.ref.localeCompare(a.ref),
  );
  return {
    open: rows.filter((r) => isOpen(r.status)).length,
    total: rows.length,
    recent: sorted.slice(0, 5).map((r) => rowOf(d, r)),
  };
}

export function userDetailOf(d: MockDb, u: MockUser, now: Date): AdminUserDetail {
  const p = publishedOf(d, u.id);
  const all = Object.values(d.requests);
  const category = p ? d.categories.find((c) => c.id === p.categoryId) : undefined;
  const latest = p
    ? Object.values(d.submissions)
        .filter((s) => s.providerId === p.id)
        .sort((a, b) => b.attempt - a.attempt)[0]
    : undefined;
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    mobile: u.mobile,
    joinedAt: u.createdAt,
    roles: rolesOf(d, u),
    status: u.status,
    provider: p
      ? {
          id: p.id,
          businessName: p.businessName ?? '',
          categoryName: category?.name ?? '',
          verificationStatus: p.verificationStatus,
          latestSubmissionId: latest?.id ?? null,
          rating: p.reviewCount > 0 ? p.ratingAvg : null,
          reviewCount: p.reviewCount,
          paused: p.paused,
          listed: isListed(d, p),
        }
      : null,
    asCustomer: summaryOf(
      d,
      all.filter((r) => r.customerId === u.id),
    ),
    asProvider: p
      ? summaryOf(
          d,
          all.filter((r) => r.providerId === p.id),
        )
      : null,
    history: auditFor(d, 'user', u.id).map((a) => toAuditEntry(d, a)),
    impact:
      u.status === 'suspended'
        ? { providerPending: 0, providerAccepted: 0, customerOpen: 0 }
        : suspendImpact(planSuspension(all, u.id, now)),
  };
}
