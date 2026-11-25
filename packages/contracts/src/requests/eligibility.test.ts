import { describe, expect, it } from 'vitest';
import { evaluateEligibility, type EligibilityInput } from './eligibility';

const prov = { id: 'p1', userId: 'u9', listed: true, paused: false };
const base: EligibilityInput = {
  viewer: { userId: 'u1', isAdmin: false, emailConfirmed: true },
  provider: prov,
  openRequests: [],
};
const open = (n: number, providerId = 'px') =>
  Array.from({ length: n }, (_, i) => ({ ref: `FX-${String(3000 + i)}`, providerId }));

describe('evaluateEligibility (SPEC S3.E7 order)', () => {
  it('ok', () => {
    expect(evaluateEligibility(base)).toEqual({ state: 'ok' });
  });
  it('admin beats everything', () => {
    expect(evaluateEligibility({ ...base, viewer: { ...base.viewer, isAdmin: true } }).state).toBe('admin');
  });
  it('own listing beats paused', () => {
    expect(evaluateEligibility({ ...base, provider: { ...prov, userId: 'u1', paused: true } }).state).toBe(
      'own_listing',
    );
  });
  it('unknown or unlisted provider', () => {
    expect(evaluateEligibility({ ...base, provider: null }).state).toBe('provider_unavailable');
    expect(evaluateEligibility({ ...base, provider: { ...prov, listed: false } }).state).toBe(
      'provider_unavailable',
    );
  });
  it('paused beats open requests', () => {
    expect(
      evaluateEligibility({
        ...base,
        provider: { ...prov, paused: true },
        openRequests: open(5, 'p1'),
      }).state,
    ).toBe('provider_paused');
  });
  it('open with provider (with ref) beats the limit', () => {
    expect(
      evaluateEligibility({
        ...base,
        openRequests: [...open(4), { ref: 'FX-2061', providerId: 'p1' }],
      }),
    ).toEqual({ state: 'open_with_provider', ref: 'FX-2061' });
  });
  it('5 open → limit; 4 open → ok', () => {
    expect(evaluateEligibility({ ...base, openRequests: open(5) }).state).toBe('open_limit_reached');
    expect(evaluateEligibility({ ...base, openRequests: open(4) }).state).toBe('ok');
  });
  it('unconfirmed email comes after the limits', () => {
    const v = { ...base.viewer, emailConfirmed: false };
    expect(evaluateEligibility({ ...base, viewer: v }).state).toBe('email_unconfirmed');
    expect(evaluateEligibility({ ...base, viewer: v, openRequests: open(5) }).state).toBe(
      'open_limit_reached',
    );
  });
});
