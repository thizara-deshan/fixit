import { describe, expect, it } from 'vitest';
import { MOCK_DOMAINS, parseMockDomains } from './domains';

describe('parseMockDomains', () => {
  it('all → every domain', () => {
    expect(parseMockDomains('all')).toEqual([...MOCK_DOMAINS]);
    expect(parseMockDomains(' ALL ')).toEqual([...MOCK_DOMAINS]);
  });
  it.each([['none'], [''], ['  '], [undefined]])('%j → []', (raw) => {
    expect(parseMockDomains(raw)).toEqual([]);
  });
  it('a list keeps order', () => {
    expect(parseMockDomains('auth,catalog')).toEqual(['auth', 'catalog']);
    expect(parseMockDomains(' requests , reviews ')).toEqual(['requests', 'reviews']);
  });
  it('drops duplicates', () => {
    expect(parseMockDomains('auth,auth,catalog')).toEqual(['auth', 'catalog']);
  });
  it('unknown → throws with the names', () => {
    expect(() => parseMockDomains('bogus')).toThrow('VITE_MOCK_DOMAINS: unknown domain(s): bogus');
    expect(() => parseMockDomains('auth,foo,bar')).toThrow('unknown domain(s): foo, bar');
  });
});
