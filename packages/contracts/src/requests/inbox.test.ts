import { describe, expect, it } from 'vitest';
import { compareInbox, matchesInboxSearch, ProviderRequestListQuery } from './inbox';

describe('ProviderRequestListQuery', () => {
  it('defaults and fallbacks', () => {
    expect(ProviderRequestListQuery.parse({})).toEqual({ status: 'all', q: '', page: 1 });
    expect(ProviderRequestListQuery.parse({ status: 'nope', page: '0', q: '  fx ' })).toEqual({
      status: 'all',
      q: 'fx',
      page: 1,
    });
    expect(ProviderRequestListQuery.parse({ status: 'expired', page: '3' })).toMatchObject({
      status: 'expired',
      page: 3,
    });
  });
});

describe('matchesInboxSearch (D-3)', () => {
  const row = { ref: 'FX-2061', customerFullName: 'Olivia Martinez' };
  it('matches the ref, case-insensitive', () => {
    expect(matchesInboxSearch('fx-2061', { ...row, status: 'pending' })).toBe(true);
  });
  it('pending: visible name only — the surname does not match', () => {
    expect(matchesInboxSearch('olivia m', { ...row, status: 'pending' })).toBe(true);
    expect(matchesInboxSearch('martinez', { ...row, status: 'pending' })).toBe(false);
    expect(matchesInboxSearch('martinez', { ...row, status: 'declined' })).toBe(false);
  });
  it('accepted/completed: full name matches', () => {
    expect(matchesInboxSearch('martinez', { ...row, status: 'accepted' })).toBe(true);
  });
  it('empty query matches everything', () => {
    expect(matchesInboxSearch('  ', { ...row, status: 'pending' })).toBe(true);
  });
});

describe('compareInbox', () => {
  const a = { ref: 'FX-1', createdAt: '2026-11-20T00:00:00.000Z', expiresAt: '2026-11-23T00:00:00.000Z' };
  const b = { ref: 'FX-2', createdAt: '2026-11-21T00:00:00.000Z', expiresAt: '2026-11-22T12:00:00.000Z' };
  it('pending → expiresAt ascending', () => {
    expect([a, b].sort(compareInbox('pending')).map((r) => r.ref)).toEqual(['FX-2', 'FX-1']);
  });
  it('others → newest first', () => {
    expect([a, b].sort(compareInbox('all')).map((r) => r.ref)).toEqual(['FX-2', 'FX-1']);
    expect([b, a].sort(compareInbox('completed')).map((r) => r.ref)).toEqual(['FX-2', 'FX-1']);
  });
});
