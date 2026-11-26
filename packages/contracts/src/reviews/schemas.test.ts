import { describe, expect, it } from 'vitest';
import { CreateReviewBody } from './schemas';

const messages = (input: unknown) => {
  const r = CreateReviewBody.safeParse(input);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
};

describe('CreateReviewBody (S16)', () => {
  it('empty form → both SPEC messages', () => {
    expect(messages({ text: '' })).toEqual({
      rating: 'Choose a star rating.',
      text: 'Write at least 10 characters.',
    });
  });
  it('text is trimmed before the length check', () => {
    expect(messages({ rating: 4, text: '   short   ' })).toEqual({ text: 'Write at least 10 characters.' });
  });
  it('too long', () => {
    expect(messages({ rating: 4, text: 'x'.repeat(1001) })).toEqual({
      text: 'Keep your review under 1,000 characters.',
    });
  });
  it('out of range rating', () => {
    expect(messages({ rating: 6, text: 'Great work, thanks!' })).toEqual({ rating: 'Choose a star rating.' });
  });
  it('valid', () => {
    expect(CreateReviewBody.parse({ rating: 5, text: '  Great work, thanks!  ' })).toEqual({
      rating: 5,
      text: 'Great work, thanks!',
    });
  });
});
