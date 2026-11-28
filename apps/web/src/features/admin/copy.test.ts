import { describe, expect, it } from 'vitest';
import { attemptLabel, oldestSub, suspendEffects } from './copy';

const now = new Date('2026-11-24T06:00:00Z');

describe('admin copy', () => {
  it('attemptLabel', () => {
    expect(attemptLabel(1)).toBe('First');
    expect(attemptLabel(3)).toBe('Resubmission 2');
  });
  it('oldestSub', () => {
    expect(oldestSub(null, now)).toBe('all caught up');
    expect(oldestSub('2026-11-21T04:00:00Z', now)).toBe('oldest 3 days');
  });
  it('suspendEffects for a provider', () => {
    expect(suspendEffects({ providerPending: 1, providerAccepted: 1, customerOpen: 0 }, true)).toEqual([
      "They won't be able to sign in.",
      'Their listing will be hidden from search and their profile link will stop working.',
      '1 pending requests will be declined and 1 accepted requests cancelled. Customers are emailed.',
      'Their reviews stay visible unless you hide them.',
    ]);
  });
  it('suspendEffects for a customer', () => {
    const lines = suspendEffects({ providerPending: 0, providerAccepted: 0, customerOpen: 2 }, false);
    expect(lines).toHaveLength(3);
    expect(lines).toContain('2 of their open requests will be cancelled. Providers are emailed.');
  });
});
