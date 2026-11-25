import {
  OPEN_STATUSES,
  toCustomerView,
  type CustomerRequestView,
  type RequestRecord,
  type RequestStatus,
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
