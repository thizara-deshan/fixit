import { describe, expect, it } from 'vitest';
import {
  closedCopy,
  closedPrivacyNote,
  firstNameOf,
  greeting,
  greetingSub,
  providerActorLabel,
} from './copy';

const at = (iso: string) => new Date(iso);
describe('greeting (Colombo = UTC+5:30)', () => {
  it.each([
    ['2026-11-21T23:29:00.000Z', 'evening'], // 04:59
    ['2026-11-21T23:30:00.000Z', 'morning'], // 05:00
    ['2026-11-22T06:29:00.000Z', 'morning'], // 11:59
    ['2026-11-22T06:30:00.000Z', 'afternoon'], // 12:00
    ['2026-11-22T11:29:00.000Z', 'afternoon'], // 16:59
    ['2026-11-22T11:30:00.000Z', 'evening'], // 17:00
  ])('%s → %s', (iso, part) => {
    expect(greeting(at(iso), 'Marcus')).toBe(`Good ${part}, Marcus`);
  });
});

describe('copy', () => {
  it('greetingSub', () => {
    expect(greetingSub(0)).toBe("You're all caught up.");
    expect(greetingSub(1)).toBe('You have 1 new request waiting for a reply.');
    expect(greetingSub(3)).toBe('You have 3 new requests waiting for a reply.');
  });
  it('names and actors', () => {
    expect(firstNameOf('Olivia M.')).toBe('Olivia');
    expect(providerActorLabel('customer')).toBe('by the customer');
  });
  it('closed copy per status and actor', () => {
    const base = {
      reason: 'Busy.',
      expiresAt: '2026-11-04T08:30:00.000Z',
      customer: { revealed: false as const, displayName: 'Daniel K.' },
    };
    expect(closedCopy({ ...base, status: 'cancelled', closedBy: 'customer' })).toEqual({
      line: 'Daniel cancelled this request.',
      reason: 'Busy.',
    });
    expect(closedCopy({ ...base, status: 'cancelled', closedBy: 'admin' })?.line).toBe(
      'Fixit cancelled this request.',
    );
    expect(closedCopy({ ...base, status: 'declined', closedBy: 'provider' })?.line).toBe(
      'You declined this request.',
    );
    expect(closedCopy({ ...base, status: 'declined', closedBy: 'system' })).toEqual({
      line: 'Declined automatically — your account was suspended.',
      reason: null,
    });
    expect(closedCopy({ ...base, status: 'expired', closedBy: 'system' })?.line).toBe(
      "This request expired on Wed, 4 Nov 2026 because it wasn't answered in time.",
    );
    expect(closedCopy({ ...base, status: 'accepted', closedBy: null })).toBeNull();
    expect(closedPrivacyNote('expired')).toBe('Contact details are hidden because this request is expired.');
    expect(closedPrivacyNote('pending')).toBeNull();
  });
});
