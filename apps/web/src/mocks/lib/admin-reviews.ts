import {
  displayNameOf,
  matchesReviewSearch,
  ratingFrom,
  type ModerationList,
  type ModerationQuery,
  type ModerationRow,
} from '@fixit/contracts';
import type { FxReview } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { alreadyInState, auditFor, paginate, recordAudit } from './admin-audit';
import { mockError } from './errors';

export function reviewOr404(d: MockDb, id: string): FxReview {
  const v = d.reviews[id];
  if (!v) throw mockError(404, 'NOT_FOUND', 'No such review');
  return v;
}

/** BR-27 / F-29: same write as the visibility change. */
export function recomputeRating(d: MockDb, providerId: string): void {
  const p = d.providers[providerId];
  if (!p) return;
  const agg = ratingFrom(
    Object.values(d.reviews)
      .filter((v) => v.providerId === providerId && v.visibility === 'visible')
      .map((v) => v.rating),
  );
  p.ratingAvg = agg.rating;
  p.reviewCount = agg.count;
}

export function moderationRowOf(d: MockDb, v: FxReview): ModerationRow {
  const req = d.requests[v.requestId];
  const hide =
    v.visibility === 'hidden'
      ? auditFor(d, 'review', v.id).find((a) => a.action === 'review_hide')
      : undefined;
  return {
    id: v.id,
    requestRef: req?.ref ?? 'FX-0000',
    provider: { id: v.providerId, businessName: d.providers[v.providerId]?.businessName ?? '' },
    authorDisplayName: displayNameOf(d.users[v.authorId]?.fullName ?? ''),
    rating: v.rating,
    text: v.text,
    createdAt: v.createdAt,
    reply: v.replyText && v.replyCreatedAt ? { text: v.replyText, createdAt: v.replyCreatedAt } : null,
    visibility: v.visibility,
    hidden: hide
      ? { at: hide.at, by: d.users[hide.adminId]?.fullName ?? 'Fixit admin', reason: hide.reason }
      : null,
  };
}

export function moderationPage(d: MockDb, q: ModerationQuery): ModerationList {
  const rows = Object.values(d.reviews)
    .filter((v) => q.visibility === 'all' || v.visibility === q.visibility)
    .filter((v) =>
      matchesReviewSearch(q.q, {
        businessName: d.providers[v.providerId]?.businessName ?? '',
        authorName: d.users[v.authorId]?.fullName ?? '',
        text: v.text,
      }),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  const page = paginate(rows, q.page);
  return { ...page, items: page.items.map((v) => moderationRowOf(d, v)) };
}

export function hideReview(d: MockDb, v: FxReview, adminId: string, reason: string, now: Date): void {
  if (v.visibility === 'hidden') throw alreadyInState('hidden');
  v.visibility = 'hidden';
  recomputeRating(d, v.providerId);
  recordAudit(d, { adminId, action: 'review_hide', targetType: 'review', targetId: v.id, reason }, now);
}

export function restoreReview(d: MockDb, v: FxReview, adminId: string, now: Date): void {
  if (v.visibility === 'visible') throw alreadyInState('visible');
  v.visibility = 'visible';
  recomputeRating(d, v.providerId);
  recordAudit(
    d,
    { adminId, action: 'review_restore', targetType: 'review', targetId: v.id, reason: null },
    now,
  );
}
