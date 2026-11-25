import { beforeEach, describe, expect, it } from 'vitest';
import { lastDiscoverLoc, lastDiscoverUrl, rememberDiscover } from './last-discover';

describe('last-discover', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  it('defaults to /discover', () => {
    expect(lastDiscoverUrl()).toBe('/discover');
  });
  it('stores the last search', () => {
    rememberDiscover('?q=plumb');
    expect(lastDiscoverUrl()).toBe('/discover?q=plumb');
  });
  it('ignores a tampered value', () => {
    sessionStorage.setItem('fixit.lastDiscover', 'https://evil.example');
    expect(lastDiscoverUrl()).toBe('/discover');
  });
});

describe('lastDiscoverLoc', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  it('reads loc or null', () => {
    expect(lastDiscoverLoc()).toBeNull();
    rememberDiscover('?q=plumb&loc=colombo');
    expect(lastDiscoverLoc()).toBe('colombo');
    rememberDiscover('?q=plumb');
    expect(lastDiscoverLoc()).toBeNull();
  });
});
