import type { CategoryIcon, RequestStatus, ReviewVisibility } from '../common/enums';
import { reviewDeadline } from '../reviews/rules';
import { toMachineRequest, type RequestRecord } from './record';
import { cancelDeadline } from './rules';
import type { CustomerRequestView } from './schemas';
import { canTransition } from './state-machine';

const REVEALED: readonly RequestStatus[] = ['accepted', 'completed'];

export interface CustomerViewContext {
  provider: {
    id: string;
    businessName: string;
    photoUrl: string | null;
    categoryIcon: CategoryIcon;
    verified: boolean;
    rating: number | null;
    reviewCount: number;
    listed: boolean;
    mobile: string | null;
  };
  town: { id: string; name: string };
  ownReview: {
    id: string;
    rating: number;
    text: string;
    createdAt: string;
    visibility: ReviewVisibility;
  } | null;
}

/** PRODUCT §6.3 for the customer: the provider's mobile only while Accepted or Completed. */
export function toCustomerView(r: RequestRecord, ctx: CustomerViewContext, now: Date): CustomerRequestView {
  let review: CustomerRequestView['review'] = null;
  if (r.status === 'completed' && r.completedAt !== null) {
    const deadline = reviewDeadline(new Date(r.completedAt));
    review = {
      eligible: ctx.ownReview === null && now.getTime() < deadline.getTime(),
      deadline: deadline.toISOString(),
      own: ctx.ownReview,
    };
  }
  return {
    ref: r.ref,
    status: r.status,
    service: r.service,
    preferredDate: r.preferredDate,
    slot: r.slot,
    town: ctx.town,
    description: r.description,
    agreedPrice: r.agreedPrice,
    reason: r.reason,
    closedBy: r.closedBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    expiresAt: r.expiresAt,
    completedAt: r.completedAt,
    history: r.events.map((e) => ({
      status: e.status,
      at: e.at,
      actor: e.actor,
      actorName: null,
      reason: e.reason,
    })),
    provider: { ...ctx.provider, mobile: REVEALED.includes(r.status) ? ctx.provider.mobile : null },
    addressLine1: r.addressLine1,
    addressLine2: r.addressLine2,
    customerMobile: r.customerMobile,
    cancelDeadline: cancelDeadline(r.preferredDate).toISOString(),
    canCancel: canTransition(
      toMachineRequest(r),
      'cancelled',
      { kind: 'customer', userId: r.customerId },
      now,
    ).ok,
    review,
  };
}
