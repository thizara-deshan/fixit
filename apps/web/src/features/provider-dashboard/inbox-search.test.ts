import { describe, expect, it } from 'vitest';
import { inboxHref, parseInboxSearch } from './inbox-search';

describe('inbox URL state', () => {
  it('round-trips', () => {
    const href = inboxHref({ status: 'pending', q: ' olivia ', page: 2 });
    expect(href).toBe('/dashboard/requests?status=pending&q=olivia&page=2');
    expect(parseInboxSearch(new URLSearchParams(href.split('?')[1]))).toEqual({
      status: 'pending',
      q: 'olivia',
      page: 2,
    });
  });
  it('defaults are omitted; junk falls back', () => {
    expect(inboxHref({})).toBe('/dashboard/requests');
    expect(parseInboxSearch(new URLSearchParams('status=bogus&page=-1'))).toEqual({
      status: 'all',
      q: '',
      page: 1,
    });
  });
});
