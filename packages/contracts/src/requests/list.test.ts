import { describe, expect, it } from 'vitest';
import { CancelBody, groupOf, RequestListQuery, statusesOf } from './list';

describe('status groups (S14.E2)', () => {
  it('maps groups to statuses', () => {
    expect(statusesOf('open')).toEqual(['pending', 'accepted']);
    expect(statusesOf('closed')).toEqual(['declined', 'cancelled', 'expired']);
    expect(statusesOf('all')).toHaveLength(6);
  });
  it.each([
    ['pending', 'open'],
    ['accepted', 'open'],
    ['completed', 'completed'],
    ['expired', 'closed'],
  ] as const)('%s → %s', (s, g) => {
    expect(groupOf(s)).toBe(g);
  });
});

describe('RequestListQuery', () => {
  it('defaults', () => {
    expect(RequestListQuery.parse({})).toEqual({ status: 'all', page: 1 });
  });
  it('invalid values fall back', () => {
    expect(RequestListQuery.parse({ status: 'nope', page: '-2' })).toEqual({ status: 'all', page: 1 });
  });
  it('parses strings from the URL', () => {
    expect(RequestListQuery.parse({ status: 'closed', page: '3' })).toEqual({ status: 'closed', page: 3 });
  });
});

describe('CancelBody', () => {
  it('empty reason → undefined', () => {
    expect(CancelBody.parse({ reason: '  ' })).toEqual({ reason: undefined });
  });
  it('501 characters → SPEC message', () => {
    const r = CancelBody.safeParse({ reason: 'x'.repeat(501) });
    expect(r.success ? '' : r.error.issues[0]?.message).toBe('Keep the reason under 500 characters.');
  });
});
