import { describe, expect, it } from 'vitest';
import {
  AcceptBody,
  AGREED_PRICE_MESSAGE,
  AgreedPriceBody,
  AgreedPriceForm,
  DeclineBody,
} from './provider-bodies';

const form = (agreedPrice: string) => AgreedPriceForm.safeParse({ agreedPrice });

describe('AgreedPriceForm (S22)', () => {
  it.each([
    ['', undefined],
    ['6500', 6500],
    [' 6,500 ', 6500],
    ['1', 1],
    ['10000000', 10_000_000],
  ])('%j → %j', (text, value) => {
    const r = form(text);
    expect(r.success && r.data.agreedPrice).toBe(value ?? undefined);
  });
  it.each(['6.5', '0', '10000001', 'abc', '-5'])('%j → SPEC message', (text) => {
    const r = form(text);
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe(AGREED_PRICE_MESSAGE);
  });
});

describe('bodies', () => {
  it('accept: price optional, whole rupees only', () => {
    expect(AcceptBody.parse({})).toEqual({});
    expect(AcceptBody.safeParse({ agreedPrice: 6.5 }).success).toBe(false);
  });
  it('agreed price body accepts null (clear)', () => {
    expect(AgreedPriceBody.parse({ agreedPrice: null })).toEqual({ agreedPrice: null });
  });
  it('decline reason: empty → undefined, 501 chars refused', () => {
    expect(DeclineBody.parse({ reason: '' }).reason).toBeUndefined();
    expect(DeclineBody.safeParse({ reason: 'x'.repeat(501) }).error?.issues[0]?.message).toBe(
      'Keep the reason under 500 characters.',
    );
  });
});
