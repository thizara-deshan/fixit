import { describe, expect, it } from 'vitest';
import type { RuleCode } from '@fixit/contracts';
import { requestRuleBanner } from './error-copy';
import { ApiError } from './http';

const ruleErr = (rule: RuleCode) =>
  new ApiError(422, 'RULE_VIOLATION', 'x', {
    code: 'RULE_VIOLATION',
    message: 'x',
    requestId: 'r',
    details: { rule },
  });

describe('requestRuleBanner', () => {
  it('paused / unavailable', () => {
    expect(requestRuleBanner(ruleErr('provider_paused'), 'BrightSpark Electric')).toBe(
      "BrightSpark Electric can't take requests right now. Your request wasn't sent.",
    );
    expect(requestRuleBanner(ruleErr('provider_unavailable'), 'X')).toBe(
      "X can't take requests right now. Your request wasn't sent.",
    );
  });
  it('date', () => {
    expect(requestRuleBanner(ruleErr('date_out_of_window'), 'X')).toBe(
      'That date is no longer available. Choose another date.',
    );
  });
  it('anything else → null', () => {
    expect(requestRuleBanner(new ApiError(500, 'INTERNAL', 'x'), 'X')).toBeNull();
    expect(requestRuleBanner(new Error('x'), 'X')).toBeNull();
  });
});
