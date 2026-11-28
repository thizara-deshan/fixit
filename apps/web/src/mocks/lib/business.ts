import {
  CATEGORY_MESSAGE,
  reverificationFor,
  type ReverificationReason,
  type UpdateBusinessBody,
} from '@fixit/contracts';
import type { FxProvider } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { fieldError } from './own-provider';
import { requeueForReverification } from './verification';

/** A23. Validates, writes the card, applies BR-21. Returns the applied reason or null. */
export function updateBusiness(
  d: MockDb,
  p: FxProvider,
  body: UpdateBusinessBody,
  now: Date,
): ReverificationReason | null {
  if (!d.categories.some((c) => c.id === body.categoryId && c.active))
    throw fieldError('categoryId', CATEGORY_MESSAGE);
  const reason = reverificationFor({
    status: p.verificationStatus,
    before: { businessName: p.businessName, categoryId: p.categoryId },
    after: body,
  });
  p.businessName = body.businessName;
  p.bio = body.bio;
  p.yearsExperience = body.yearsExperience;
  p.categoryId = body.categoryId;
  if (reason) requeueForReverification(d, p, reason, now);
  return reason;
}
