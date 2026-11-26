import {
  assertTransition,
  groupOf,
  OPEN_STATUSES,
  PAGE_SIZE,
  statusesOf,
  toCustomerView,
  toMachineRequest,
  TransitionError,
  type CustomerRequestView,
  type MachineActor,
  type MyRequestList,
  type RequestListQuery,
  type RequestRecord,
  type RequestStatus,
  type TransitionInput,
} from '@fixit/contracts';
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
