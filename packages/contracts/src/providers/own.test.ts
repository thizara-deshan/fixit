import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { isVerificationEditable, parseOnboardingBody, VerificationState } from './own';

describe('own provider contracts', () => {
  it('parseOnboardingBody picks the step schema', () => {
    expect(parseOnboardingBody(2, { categoryId: 'plumbing' })).toEqual({
      step: 2,
      body: { categoryId: 'plumbing' },
    });
    expect(() => parseOnboardingBody(3, { services: [] })).toThrow(ZodError);
    expect(() => parseOnboardingBody(1, { categoryId: 'plumbing' })).toThrow(ZodError);
  });
  it('editable states', () => {
    expect(isVerificationEditable('not_submitted')).toBe(true);
    expect(isVerificationEditable('rejected')).toBe(true);
    expect(isVerificationEditable('pending_review')).toBe(false);
    expect(isVerificationEditable('verified')).toBe(false);
  });
  it('VerificationState shape', () => {
    expect(
      VerificationState.safeParse({
        status: 'not_submitted',
        editable: true,
        verifiedAt: null,
        rejectionReason: null,
        documents: [],
      }).success,
    ).toBe(true);
  });
});
