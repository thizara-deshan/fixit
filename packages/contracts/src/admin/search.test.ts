import { describe, expect, it } from 'vitest';
import { matchesReviewSearch, matchesUserSearch } from './search';

const marcus = {
  fullName: 'Marcus Bell',
  email: 'marcus@fixit.test',
  mobile: '+94770001101',
  businessName: 'Bell & Sons Plumbing',
};
describe('matchesUserSearch', () => {
  it.each([
    ['marcus'],
    ['MARCUS'],
    ['bell &'],
    ['fixit.test'],
    ['0770001101'],
    ['077 000 1101'],
    ['+9477000'],
  ])('%s matches', (q) => {
    expect(matchesUserSearch(q, marcus)).toBe(true);
  });
  it('empty query matches everyone', () => {
    expect(matchesUserSearch('  ', marcus)).toBe(true);
  });
  it('two digits do not search mobiles', () => {
    expect(matchesUserSearch('11', { ...marcus, fullName: 'X', email: 'x@y.z', businessName: null })).toBe(
      false,
    );
  });
  it('no match', () => {
    expect(matchesUserSearch('olivia', marcus)).toBe(false);
  });
});
describe('matchesReviewSearch', () => {
  it('matches business, author or text', () => {
    const r = { businessName: 'Bell & Sons', authorName: 'Sarah Kim', text: 'Fixed the leak fast.' };
    expect(matchesReviewSearch('bell', r)).toBe(true);
    expect(matchesReviewSearch('sarah', r)).toBe(true);
    expect(matchesReviewSearch('LEAK', r)).toBe(true);
    expect(matchesReviewSearch('paint', r)).toBe(false);
  });
});
