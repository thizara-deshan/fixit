import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './http';
import { FORM_COPY } from './error-copy';
import { mapApiErrorToForm } from './form-errors';

const err = (status: number, code: ConstructorParameters<typeof ApiError>[1], extra: object = {}) =>
  new ApiError(status, code, code, {
    code: code === 'NETWORK' ? 'INTERNAL' : code,
    message: code,
    requestId: 'r',
    ...extra,
  });

describe('mapApiErrorToForm', () => {
  it('maps fieldErrors onto fields, focusing the first', () => {
    const setError = vi.fn();
    const out = mapApiErrorToForm(
      err(400, 'VALIDATION_FAILED', { fieldErrors: { mobile: ['Bad'], fullName: ['Short'] } }),
      setError,
    );
    expect(out).toBeNull();
    expect(setError.mock.calls).toEqual([
      ['mobile', { type: 'server', message: 'Bad' }, { shouldFocus: true }],
      ['fullName', { type: 'server', message: 'Short' }, { shouldFocus: false }],
    ]);
  });
  it('puts a field rule on its field', () => {
    const setError = vi.fn();
    expect(
      mapApiErrorToForm(err(409, 'CONFLICT', { details: { rule: 'email_taken' } }), setError, {
        email_taken: 'email',
      }),
    ).toBeNull();
    expect(setError).toHaveBeenCalledWith(
      'email',
      { type: 'server', message: 'This email already has an account.' },
      { shouldFocus: true },
    );
  });
  it('banner rules and codes', () => {
    const setError = vi.fn();
    expect(
      mapApiErrorToForm(err(401, 'UNAUTHENTICATED', { details: { rule: 'invalid_credentials' } }), setError),
    ).toBe(FORM_COPY.invalidCredentials);
    expect(mapApiErrorToForm(err(401, 'ACCOUNT_SUSPENDED'), setError)).toBe(
      'Your account is suspended. If you think this is a mistake, email us at hello@fixit.test.',
    );
    expect(mapApiErrorToForm(err(429, 'RATE_LIMITED'), setError)).toBe(FORM_COPY.rateLimited);
    expect(mapApiErrorToForm(err(500, 'INTERNAL'), setError)).toBe(FORM_COPY.saveFailed);
    expect(mapApiErrorToForm(new ApiError(0, 'NETWORK', 'x'), setError)).toBe(FORM_COPY.saveFailed);
    expect(setError).not.toHaveBeenCalled();
  });
});
