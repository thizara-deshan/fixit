import { describe, expect, it } from 'vitest';
import type { Category } from '@fixit/contracts';
import { appliedFilterCount, next, readDiscover, tickedCategories, writeDiscover } from './url-state';

const cats: Category[] = [
  { id: 'plumbing', name: 'Plumbing', blurb: '', icon: 'wrench', order: 1 },
  { id: 'electrical', name: 'Electrical', blurb: '', icon: 'zap', order: 2 },
];
const read = (s: string) => readDiscover(new URLSearchParams(s));

describe('url-state', () => {
  it('round trip is canonical', () => {
    const s =
      'q=leak&loc=colombo&cat=plumbing%2Celectrical&rating=4&verified=1&price=5000&sort=reviews&page=2';
    expect(writeDiscover(read(s)).toString()).toBe(s);
    expect(writeDiscover(read('sort=rating&page=1')).toString()).toBe('');
  });
  it('junk renders defaults', () => {
    expect(read('rating=9&page=-1&cat=,,x')).toEqual({ cat: ['x'], sort: 'rating', page: 1 });
  });
  it('new search: q, loc, derived cat; drops rating/verified/price/page; keeps sort (D-1)', () => {
    const state = read('q=leak&cat=electrical&rating=4&verified=1&price=2000&sort=reviews&page=3');
    expect(next.newSearch(state, ' plumb ', 'colombo', cats).toString()).toBe(
      'q=plumb&loc=colombo&cat=plumbing&sort=reviews',
    );
    expect(next.newSearch(state, 'tap', undefined, cats).toString()).toBe('q=tap&sort=reviews');
  });
  it('filter change resets page; sort change resets page', () => {
    const state = read('loc=colombo&page=4');
    expect(next.setFilter(state, { rating: '4.5' }, cats).toString()).toBe('loc=colombo&rating=4.5');
    expect(next.setFilter(state, { sort: 'town' }, cats).toString()).toBe('loc=colombo&sort=town');
  });
  it('ticking a category clears q when q was a category match', () => {
    const state = read('q=plumb');
    expect(tickedCategories(state, cats)).toEqual(['plumbing']);
    expect(next.setFilter(state, { cat: ['plumbing', 'electrical'] }, cats).toString()).toBe(
      'cat=plumbing%2Celectrical',
    );
    expect(next.setFilter(read('q=tap'), { cat: ['electrical'] }, cats).toString()).toBe(
      'q=tap&cat=electrical',
    );
  });
  it('page change keeps filters', () => {
    expect(next.setPage(read('cat=plumbing'), 2).toString()).toBe('cat=plumbing&page=2');
  });
  it('badge count', () => {
    expect(
      appliedFilterCount(read('q=plumb&cat=electrical&loc=colombo&rating=4&verified=1&price=2000'), cats),
    ).toBe(6);
    expect(appliedFilterCount(read('q=tap&sort=reviews'), cats)).toBe(0);
  });
});
