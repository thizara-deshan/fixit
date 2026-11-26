import { z } from 'zod';
import { PublicReview } from '../catalog/schemas';
import { ReviewVisibility } from '../common/enums';
import { Id, RequestRef } from '../common/primitives';

const RATING_MESSAGE = 'Choose a star rating.';

/** SPEC S16 / BR-26. `rating` is undefined in an untouched form → the SPEC message. */
export const CreateReviewBody = z.object({
  rating: z
    .number({ error: RATING_MESSAGE })
    .int(RATING_MESSAGE)
    .min(1, RATING_MESSAGE)
    .max(5, RATING_MESSAGE),
  text: z
    .string({ error: 'Write at least 10 characters.' })
    .trim()
    .min(10, 'Write at least 10 characters.')
    .max(1000, 'Keep your review under 1,000 characters.'),
});
export type CreateReviewBody = z.infer<typeof CreateReviewBody>;

export const Review = PublicReview.extend({
  requestRef: RequestRef,
  serviceName: z.string(),
  providerId: Id,
  visibility: ReviewVisibility,
});
export type Review = z.infer<typeof Review>;

/** SPEC S16 star labels, index = rating − 1. */
export const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'] as const;
