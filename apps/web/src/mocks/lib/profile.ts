import {
  displayNameOf,
  evaluateEligibility,
  OPEN_STATUSES,
  orderAreas,
  reviewsTotalPages,
  reviewsWindow,
  type Eligibility,
  type ProviderPublicProfile,
  type PublicReviewPage,
  type RequestStatus,
} from '@fixit/contracts';
import type { FxProvider } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { isListed, toProviderCard } from './cards';
import { mockError } from './errors';
import { rolesOf } from './identity';

/** Listed provider or 404 (unknown, draft, suspended owner: BR-01, BR-41). */
export function listedProviderOr404(d: MockDb, id: string): FxProvider {
  const p = d.providers[id];
  if (!p || !isListed(d, p)) throw mockError(404, 'NOT_FOUND', 'Provider not found');
  return p;
}

export function toPublicProfile(d: MockDb, p: FxProvider): ProviderPublicProfile {
  const card = toProviderCard(d, p);
  const owner = d.users[p.userId];
  if (!card || !owner) throw mockError(404, 'NOT_FOUND', 'Provider not found');
  const townName = new Map(d.towns.map((t) => [t.id, t.name]));
  const areas = d.areas
    .filter((a) => a.providerId === p.id)
    .map((a) => ({ id: a.townId, name: townName.get(a.townId) ?? a.townId, isBase: a.isBase }));
  return {
    ...card,
    ownerName: owner.fullName,
    services: Object.values(d.services)
      .filter((s) => s.providerId === p.id)
      .map(({ id, name, price, unit }) => ({ id, name, price, unit })),
    areas: orderAreas(areas),
    ratingSummary: { rating: card.rating, reviewCount: card.reviewCount },
  };
}

/** Visible reviews, newest first, windowed per decision 003. */
export function publicReviewsPage(d: MockDb, providerId: string, page: number): PublicReviewPage {
  const visible = Object.values(d.reviews)
    .filter((r) => r.providerId === providerId && r.visibility === 'visible')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  const { offset, limit } = reviewsWindow(page);
  return {
    items: visible.slice(offset, offset + limit).map((r) => ({
      id: r.id,
      authorDisplayName: displayNameOf(d.users[r.authorId]?.fullName ?? 'Fixit customer'),
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
      reply:
        r.replyText !== null && r.replyCreatedAt !== null
          ? {
              text: r.replyText,
              createdAt: r.replyCreatedAt,
              updatedAt: r.replyUpdatedAt ?? r.replyCreatedAt,
            }
          : null,
    })),
    page: Math.max(page, 1),
    pageSize: limit,
    total: visible.length,
    totalPages: reviewsTotalPages(visible.length),
  };
}

const isOpen = (s: RequestStatus) => (OPEN_STATUSES as readonly RequestStatus[]).includes(s);

/** Same inputs the API service will gather, evaluated by contracts. */
export function eligibilityFor(d: MockDb, userId: string, providerId: string): Eligibility {
  const user = d.users[userId];
  const p = d.providers[providerId];
  return evaluateEligibility({
    viewer: {
      userId,
      isAdmin: rolesOf(d, userId).includes('admin'),
      emailConfirmed: user?.emailConfirmedAt != null,
    },
    provider: p ? { id: p.id, userId: p.userId, listed: isListed(d, p), paused: p.paused } : null,
    openRequests: Object.values(d.requests)
      .filter((r) => r.customerId === userId && isOpen(r.status))
      .map((r) => ({ ref: r.ref, providerId: r.providerId })),
  });
}
