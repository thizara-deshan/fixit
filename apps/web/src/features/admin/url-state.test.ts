import { describe, expect, it } from 'vitest';
import { parseUsersSearch, queueHref, reviewsHref, usersHref, usersTabHref, usersTabOf } from './url-state';

describe('admin url state', () => {
  it('queue defaults are left out', () => {
    expect(queueHref({})).toBe('/admin/verifications');
    expect(queueHref({ status: 'approved', page: 2 })).toBe('/admin/verifications?status=approved&page=2');
  });
  it('users round-trip survives reload', () => {
    const url = usersHref({ q: ' marcus ', role: 'provider', page: 2 });
    expect(url).toBe('/admin/users?q=marcus&role=provider&page=2');
    expect(parseUsersSearch(new URLSearchParams(url.split('?')[1]))).toEqual({
      q: 'marcus',
      role: 'provider',
      status: 'all',
      page: 2,
    });
  });
  it('tab mapping', () => {
    expect(usersTabHref('suspended', 'x')).toBe('/admin/users?q=x&status=suspended');
    expect(usersTabOf(parseUsersSearch(new URLSearchParams('role=customer')))).toBe('customers');
  });
  it('reviews', () => {
    expect(reviewsHref({ visibility: 'hidden' })).toBe('/admin/reviews?visibility=hidden');
  });
});
