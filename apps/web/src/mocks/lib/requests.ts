import {
  assertTransition,
  compareInbox,
  displayNameOf,
  groupOf,
  matchesInboxSearch,
  OPEN_STATUSES,
  PAGE_SIZE,
  statusesOf,
  toCustomerView,
  toProviderView,
  toMachineRequest,
  TransitionError,
  type CustomerRequestView,
  type InboxCounts,
  type MachineActor,
  type MyRequestList,
  type ProviderRequestList,
  type ProviderRequestListQuery,
  type ProviderRequestView,
  type RequestActor,
  type RequestListQuery,
  type RequestRecord,
  type RequestStatus,
  type TransitionInput,
} from '@fixit/contracts';
import type { FxProvider } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { isListed } from './cards';
import { mockError } from './errors';

const isOpen = (s: RequestStatus): boolean => (OPEN_STATUSES as readonly RequestStatus[]).includes(s);

export function openRequestsOf(d: MockDb, customerId: string): RequestRecord[] {
  return Object.values(d.requests).filter((r) => r.customerId === customerId && isOpen(r.status));
}

/** Gathers what the API mapper will gather, then projects with contracts (D18: privacy exists once). */
export function customerViewOf(d: MockDb, r: RequestRecord, now: Date): CustomerRequestView {
  const p = d.providers[r.providerId];
  const owner = p ? d.users[p.userId] : undefined;
  const category = d.categories.find((c) => c.id === p?.categoryId);
  if (!p || !owner || !category)
    throw mockError(500, 'INTERNAL', `Request ${r.ref} references a missing provider`);
  const town = d.towns.find((t) => t.id === r.townId);
  const review = Object.values(d.reviews).find((x) => x.requestId === r.id && x.authorId === r.customerId);
  return toCustomerView(
    r,
    {
      provider: {
        id: p.id,
        categoryId: category.id,
        businessName: p.businessName ?? '',
        photoUrl: p.photoKey ? `/api/files/photos/${p.photoKey}` : null,
        categoryIcon: category.icon,
        verified: p.verificationStatus === 'verified',
        rating: p.reviewCount > 0 ? p.ratingAvg : null,
        reviewCount: p.reviewCount,
        listed: isListed(d, p),
        mobile: owner.mobile,
      },
      town: { id: r.townId, name: town?.name ?? r.townId },
      ownReview: review
        ? {
            id: review.id,
            rating: review.rating,
            text: review.text,
            createdAt: review.createdAt,
            visibility: review.visibility,
          }
        : null,
    },
    now,
  );
}

/** D-5: refused transition → 409 INVALID_TRANSITION with details.reason and details.status (ARCH error table). */
export function transitionOr409(
  r: RequestRecord,
  to: RequestStatus,
  actor: MachineActor,
  now: Date,
  input: TransitionInput = {},
): void {
  try {
    assertTransition(toMachineRequest(r), to, actor, now, input);
  } catch (e) {
    if (e instanceof TransitionError)
      throw mockError(409, 'INVALID_TRANSITION', e.message, {
        details: { reason: e.reason, status: r.status },
      });
    throw e;
  }
}

/** GET /me/requests: own requests only, newest update first, counts per group, 20 per page. */
export function myRequestList(d: MockDb, customerId: string, q: RequestListQuery, now: Date): MyRequestList {
  const mine = Object.values(d.requests)
    .filter((r) => r.customerId === customerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.ref.localeCompare(a.ref));
  const counts = { all: mine.length, open: 0, completed: 0, closed: 0 };
  for (const r of mine) counts[groupOf(r.status)] += 1;
  const wanted = statusesOf(q.status);
  const filtered = mine.filter((r) => wanted.includes(r.status));
  const pageSize = PAGE_SIZE.myRequests;
  const start = (q.page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize).map((r) => customerViewOf(d, r, now)),
    page: q.page,
    pageSize,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize),
    counts,
  };
}

/** The caller's published listing. assertAccess already required role provider, so a miss is a server bug. */
export function ownProvider(d: MockDb, userId: string): FxProvider {
  const p = Object.values(d.providers).find((x) => x.userId === userId && x.onboardingComplete);
  if (!p) throw mockError(403, 'FORBIDDEN', 'No published listing');
  return p;
}

/** Another provider's or an unknown ref → 404, never 403 (ARCH §3). */
export function ownInboxRequest(d: MockDb, providerId: string, ref: string): RequestRecord {
  const r = Object.values(d.requests).find((x) => x.ref === ref && x.providerId === providerId);
  if (!r) throw mockError(404, 'NOT_FOUND', 'Request not found');
  return r;
}

export function providerViewOf(d: MockDb, r: RequestRecord, now: Date): ProviderRequestView {
  const customer = d.users[r.customerId];
  if (!customer) throw mockError(500, 'INTERNAL', `Request ${r.ref} references a missing customer`);
  const town = d.towns.find((t) => t.id === r.townId);
  const reviews = Object.values(d.reviews).filter((x) => x.requestId === r.id);
  const visible = reviews.find((x) => x.visibility === 'visible');
  return toProviderView(
    r,
    {
      customer: { fullName: customer.fullName },
      town: { id: r.townId, name: town?.name ?? r.townId },
      review: visible
        ? {
            id: visible.id,
            rating: visible.rating,
            authorDisplayName: displayNameOf(d.users[visible.authorId]?.fullName ?? ''),
          }
        : null,
      reviewed: reviews.length > 0,
    },
    now,
  );
}

/** GET /me/provider/requests: own rows, search (D-3), counts after search (D-4), S21 order, 20 per page. */
export function inboxList(
  d: MockDb,
  providerId: string,
  q: ProviderRequestListQuery,
  now: Date,
): ProviderRequestList {
  const nameOf = (r: RequestRecord) => d.users[r.customerId]?.fullName ?? '';
  const mine = Object.values(d.requests).filter(
    (r) =>
      r.providerId === providerId &&
      matchesInboxSearch(q.q, { ref: r.ref, status: r.status, customerFullName: nameOf(r) }),
  );
  const counts: InboxCounts = {
    all: mine.length,
    pending: 0,
    accepted: 0,
    completed: 0,
    declined: 0,
    cancelled: 0,
    expired: 0,
  };
  for (const r of mine) counts[r.status] += 1;
  const filtered = (q.status === 'all' ? mine : mine.filter((r) => r.status === q.status)).sort(
    compareInbox(q.status),
  );
  const pageSize = PAGE_SIZE.providerRequests;
  const start = (q.page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize).map((r) => providerViewOf(d, r, now)),
    page: q.page,
    pageSize,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize),
    counts,
  };
}

/** Applies an already-checked transition: status, closedBy, reason, timestamps, history event. */
export function applyTransition(
  r: RequestRecord,
  to: Exclude<RequestStatus, 'pending'>,
  actor: RequestActor,
  actorUserId: string | null,
  now: Date,
  reason: string | null = null,
): void {
  const at = now.toISOString();
  r.status = to;
  if (to !== 'accepted') r.closedBy = actor;
  if (to === 'declined' || to === 'cancelled') r.reason = reason;
  if (to === 'completed') r.completedAt = at;
  r.updatedAt = at;
  r.events.push({ status: to, at, actor, actorUserId, reason });
}
