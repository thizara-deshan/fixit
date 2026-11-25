import { describe, expect, it } from 'vitest';
import { homeSearchUrl } from './search-url';

describe('homeSearchUrl', () => {
  it('q + loc', () => {
    expect(homeSearchUrl({ q: ' plumb ', loc: 'dehiwala-mount-lavinia' })).toBe(
      '/discover?q=plumb&loc=dehiwala-mount-lavinia',
    );
  });
  it('omits empty fields', () => {
    expect(homeSearchUrl({ q: '   ', loc: '' })).toBe('/discover');
    expect(homeSearchUrl({ q: '', loc: 'panadura' })).toBe('/discover?loc=panadura');
  });
  it('encodes text', () => {
    expect(homeSearchUrl({ q: 'tap & sink', loc: '' })).toBe('/discover?q=tap+%26+sink');
  });
});
