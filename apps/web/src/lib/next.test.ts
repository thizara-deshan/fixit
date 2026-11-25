import { describe, expect, it } from 'vitest';
import type { Me } from '@fixit/contracts';
import { postLoginTarget, safeNext } from './next';

const me = (roles: Me['roles']) => ({ roles }) as Me;

describe('safeNext', () => {
  it.each([
    ['/requests', '/requests'],
    ['/providers/p01/request?x=1#a', '/providers/p01/request?x=1#a'],
    ['https://evil.test', null],
    ['//evil.test/x', null],
    ['/\\evil.test', null],
    ['requests', null],
    ['', null],
    [null, null],
  ])('%j → %j', (raw, out) => {
    expect(safeNext(raw)).toBe(out);
  });
});

describe('postLoginTarget', () => {
  it('uses a safe next', () => {
    expect(postLoginTarget(me(['customer']), '?next=%2Frequests')).toBe('/requests');
  });
  it('ignores an absolute next (AC10)', () => {
    expect(postLoginTarget(me(['customer']), '?next=https%3A%2F%2Fevil.test')).toBe('/');
  });
  it('role home without next', () => {
    expect(postLoginTarget(me(['customer', 'provider']), '')).toBe('/dashboard');
    expect(postLoginTarget(me(['customer']), '')).toBe('/');
  });
  it('admin area', () => {
    expect(postLoginTarget(me(['admin']), '?next=%2Fadmin%2Fusers', 'admin')).toBe('/admin/users');
    expect(postLoginTarget(me(['admin']), '?next=%2Frequests', 'admin')).toBe('/admin');
  });
});
