import { describe, expect, it } from 'vitest';
import { listHref, parseListSearch } from './list-search';

describe('list-search', () => {
  it('parses with defaults', () => {
    expect(parseListSearch(new URLSearchParams('status=bogus'))).toEqual({ status: 'all', page: 1 });
  });
  it('round-trips', () => {
    expect(parseListSearch(new URLSearchParams(listHref('closed', 2).split('?')[1]))).toEqual({
      status: 'closed',
      page: 2,
    });
  });
  it('omits defaults (a tab link resets the page)', () => {
    expect(listHref('all')).toBe('/requests');
    expect(listHref('open')).toBe('/requests?status=open');
  });
});
