import { colomboToday, type RequestRecord, type TimeSlot } from '@fixit/contracts';
import { mulberry32, shuffle } from './prng';
import { PROTOTYPE_PROVIDER_IDS, PROTOTYPE_RATINGS, WRITTEN_REVIEWS } from './prototype-reviews';
import { makeRequest } from './requests';
import type { FxProvider, FxReview, FxService, FxUser } from './types';
import { FILLER_CUSTOMER_COUNT, fillerCustomerId, writtenAuthorId } from './users';

const DAY = 86_400_000;
const SLOTS: readonly TimeSlot[] = ['morning', 'afternoon', 'evening'];
const FILLER_TEXTS = [
  'On time, tidy and fairly priced.',
  'Did a good job and explained the work.',
  'Friendly and professional, would book again.',
  'Solid work, a little slow to reply.',
  'Fixed the problem on the first visit.',
  'Good value for the price.',
  'Arrived late but the work was fine.',
  'Careful work, cleaned up afterwards.',
  'Not perfect, but they came back to sort it.',
  'Very happy with the result.',
] as const;

/** Integer ratings for the filler so that sum(all) = round(target × total). Throws if impossible. */
export function fillerRatings(target: number, total: number, written: readonly number[]): number[] {
  const n = total - written.length;
  const remaining = Math.round(target * total) - written.reduce((a, b) => a + b, 0);
  const base = Math.floor(remaining / n);
  const extra = remaining - base * n;
  if (n <= 0 || base < 1 || base > 5 || (base === 5 && extra > 0)) {
    throw new Error(`fillerRatings: cannot reach ${String(target)} over ${String(total)} reviews`);
  }
  return Array.from({ length: n }, (_, i) => (i < extra ? base + 1 : base));
}

export function buildReviews(
  now: Date,
  ctx: { users: readonly FxUser[]; providers: readonly FxProvider[]; services: readonly FxService[] },
): { reviews: FxReview[]; requests: RequestRecord[] } {
  const userById = new Map(ctx.users.map((u) => [u.id, u]));
  const reviews: FxReview[] = [];
  const requests: RequestRecord[] = [];
  let seq = 0;

  PROTOTYPE_PROVIDER_IDS.forEach((providerId, pIndex) => {
    const provider = ctx.providers.find((p) => p.id === providerId);
    const services = ctx.services.filter((s) => s.providerId === providerId);
    if (!provider?.baseTownId || services.length === 0)
      throw new Error(`fixtures: provider ${providerId} incomplete`);
    const proto = PROTOTYPE_RATINGS[providerId];
    const written = WRITTEN_REVIEWS[providerId];
    const rand = mulberry32(pIndex + 1);
    const filler = shuffle(
      fillerRatings(
        proto.rating,
        proto.reviewCount,
        written.map((w) => w.rating),
      ),
      rand,
    );
    const entries = [
      ...written.map((w, i) => ({
        authorId: writtenAuthorId(providerId, i),
        rating: w.rating,
        text: w.text,
        daysAgo: 8 + 20 * i,
      })),
      ...filler.map((rating, k) => ({
        authorId: fillerCustomerId((k + pIndex * 7) % FILLER_CUSTOMER_COUNT),
        rating,
        text: FILLER_TEXTS[Math.floor(rand() * FILLER_TEXTS.length)] ?? FILLER_TEXTS[0],
        daysAgo: 70 + 2 * k,
      })),
    ];
    for (const e of entries) {
      seq += 1;
      const ref = `FX-${String(seq).padStart(4, '0')}`;
      const author = userById.get(e.authorId);
      const service = services[seq % services.length];
      if (!author || !service) throw new Error(`fixtures: bad review entry ${ref}`);
      const reviewedAt = new Date(now.getTime() - e.daysAgo * DAY);
      const completedAt = new Date(reviewedAt.getTime() - DAY);
      const createdAt = new Date(completedAt.getTime() - 5 * DAY);
      const request = makeRequest({
        ref,
        customer: author,
        provider,
        service,
        townId: provider.baseTownId,
        preferredDate: colomboToday(completedAt),
        slot: SLOTS[seq % SLOTS.length] ?? 'morning',
        addressLine1: `No. ${String(seq)}, Temple Road`,
        description: `Booked ${service.name.toLowerCase()} through Fixit.`,
        createdAt,
        steps: [
          { status: 'accepted', at: new Date(createdAt.getTime() + 4 * 3_600_000) },
          { status: 'completed', at: completedAt },
        ],
      });
      requests.push(request);
      reviews.push({
        id: `v-${ref}`,
        requestId: request.id,
        providerId,
        authorId: author.id,
        rating: e.rating,
        text: e.text,
        visibility: 'visible',
        createdAt: reviewedAt.toISOString(),
        replyText: null,
        replyCreatedAt: null,
        replyUpdatedAt: null,
      });
    }
  });
  return { reviews, requests };
}
