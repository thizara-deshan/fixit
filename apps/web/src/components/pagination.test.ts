import { describe, expect, it } from 'vitest';
import { pageItems } from './pagination';

describe('pageItems', () => {
  it('lists every page up to 7', () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('collapses with ellipses around the current page', () => {
    expect(pageItems(1, 8)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 8]);
    expect(pageItems(5, 10)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 10]);
    expect(pageItems(10, 10)).toEqual([1, 'ellipsis-start', 6, 7, 8, 9, 10]);
  });
});
