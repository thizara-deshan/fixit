import { describe, expect, it } from 'vitest';
import { resolveStep } from './step-route';

describe('resolveStep (D-2)', () => {
  it('from outside the wizard always the saved step', () => {
    expect(resolveStep('1', 4, false)).toBe(4);
    expect(resolveStep('9', 1, false)).toBe(1);
    expect(resolveStep('1', 1, false)).toBe(1);
  });
  it('inside the wizard: ≤ saved allowed, higher or invalid → saved', () => {
    expect(resolveStep('3', 4, true)).toBe(3);
    expect(resolveStep('5', 4, true)).toBe(4);
    expect(resolveStep('x', 2, true)).toBe(2);
  });
});
