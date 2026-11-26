import { displayNameOf } from '../auth/names';
import type { CategoryIcon, RequestStatus, ReviewVisibility } from '../common/enums';
import { reviewDeadline, reviewEligibility } from '../reviews/rules';
import { toMachineRequest, type RequestRecord } from './record';
import { cancelDeadline } from './rules';
import type { CustomerRequestView, ProviderRequestView } from './schemas';
import { canTransition } from './state-machine';

const REVEALED: readonly RequestStatus[] = ['accepted', 'completed'];
/** PRODUCT §6.3: contact details are shown to the other party only while Accepted or Completed. */
export const isContactRevealed = (status: RequestStatus): boolean => REVEALED.includes(status);

export interface CustomerViewContext {
  provider: {
    id: string;
    categoryId: string;
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
      eligible: reviewEligibility(r, ctx.ownReview, r.customerId, now).ok,
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

export interface ProviderViewContext {
  customer: { fullName: string };
  town: { id: string; name: string };
  /** The visible review of this request, if any. */
  review: { id: string; rating: number; authorDisplayName: string } | null;
  /** True when the customer has reviewed, whatever the visibility (D-10). */
  reviewed: boolean;
}

/** PRODUCT §6.3 for the provider: full name, address and mobile only while Accepted or Completed. */
export function toProviderView(r: RequestRecord, ctx: ProviderViewContext, now: Date): ProviderRequestView {
  const displayName = displayNameOf(ctx.customer.fullName);
  const customer: ProviderRequestView['customer'] = isContactRevealed(r.status)
    ? {
        revealed: true,
        displayName,
        fullName: ctx.customer.fullName,
        mobile: r.customerMobile,
        addressLine1: r.addressLine1,
        addressLine2: r.addressLine2,
      }
    : { revealed: false, displayName };
  let deadline: string | null = null;
  if (r.status === 'completed' && r.completedAt !== null && !ctx.reviewed) {
    const d = reviewDeadline(new Date(r.completedAt));
    if (now.getTime() < d.getTime()) deadline = d.toISOString();
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
    customer,
    canComplete: canTransition(
      toMachineRequest(r),
      'completed',
      { kind: 'provider', userId: r.providerUserId },
      now,
    ).ok,
    completeFrom: r.preferredDate,
    review: ctx.review,
    reviewDeadline: deadline,
  };
}
