import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorEnvelope, ratingFrom, Review } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const post = (ref: string, body: unknown, persona?: PersonaKey) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (persona) headers.Authorization = `Bearer ${signInAs(persona).accessToken}`;
  return fetch(new URL(`/api/me/requests/${ref}/review`, window.location.origin), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
};
const ok = { rating: 1, text: 'It did not go well at all.' };

describe('POST /me/requests/:ref/review', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('posts, then the provider rating/count are recomputed with ratingFrom', async () => {
    const beforeCount = db().providers.p01?.reviewCount ?? 0; // read the number: the provider object is mutated in place
    const res = await post('FX-2046', ok, 'customer');
    expect(res.status).toBe(200);
    const review = Review.parse(await res.json());
    expect(review).toMatchObject({
      authorDisplayName: 'Olivia M.',
      requestRef: 'FX-2046',
      visibility: 'visible',
    });
    const ratings = Object.values(db().reviews)
      .filter((v) => v.providerId === 'p01' && v.visibility === 'visible')
      .map((v) => v.rating);
    expect(db().providers.p01?.reviewCount).toBe(beforeCount + 1);
    expect(db().providers.p01?.ratingAvg).toBe(ratingFrom(ratings).rating);
  });
  it('second post → 422 already_reviewed', async () => {
    await post('FX-2046', ok, 'customer');
    const err = ErrorEnvelope.parse(await (await post('FX-2046', ok, 'customer')).json()).error;
    expect(err.details?.rule).toBe('already_reviewed');
  });
  it.each([
    ['FX-2029', 'review_window_closed'],
    ['FX-2030', 'review_not_eligible'],
  ] as const)('%s → 422 %s', async (ref, rule) => {
    const res = await post(ref, ok, 'customer');
    expect(res.status).toBe(422);
    expect(ErrorEnvelope.parse(await res.json()).error.details?.rule).toBe(rule);
  });
  it("other customer's ref → 404; admin → 403; empty body → 400 with SPEC messages", async () => {
    expect((await post('FX-2041', ok, 'customer')).status).toBe(404);
    expect((await post('FX-2046', ok, 'admin')).status).toBe(403);
    const res = await post('FX-2046', { text: '' }, 'customer');
    expect(ErrorEnvelope.parse(await res.json()).error.fieldErrors).toEqual({
      rating: ['Choose a star rating.'],
      text: ['Write at least 10 characters.'],
    });
  });
});
