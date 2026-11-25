import { describe, expect, it } from 'vitest';
import { MOBILE_MESSAGE, MobileInput, MobileOrEmpty, RequestRef } from './primitives';

describe('MobileInput', () => {
  it.each(['077 123 4567', '0771234567', '+94 77 123 4567', '077-123-4567'])('%s → +94771234567', (input) => {
    expect(MobileInput.parse(input)).toBe('+94771234567');
  });

  it('rejects a landline with the SPEC message', () => {
    const result = MobileInput.safeParse('0112345678');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Enter a Sri Lankan mobile number, like 077 123 4567.');
  });
});

describe('RequestRef', () => {
  it('accepts FX-2061 and rejects FX-12', () => {
    expect(RequestRef.safeParse('FX-2061').success).toBe(true);
    expect(RequestRef.safeParse('FX-12').success).toBe(false);
  });
});

describe('MobileOrEmpty', () => {
  it.each([
    ['', null],
    ['   ', null],
    ['077 123 4567', '+94771234567'],
    ['+94 77 123 4567', '+94771234567'],
  ])('%j → %j', (input, out) => {
    expect(MobileOrEmpty.parse(input)).toBe(out);
  });
  it('rejects a bad number with the S12 message', () => {
    const r = MobileOrEmpty.safeParse('12345');
    expect(r.success ? [] : r.error.issues.map((i) => i.message)).toEqual([MOBILE_MESSAGE]);
  });
});
