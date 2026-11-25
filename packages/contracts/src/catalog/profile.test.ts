import { describe, expect, it } from 'vitest';
import { orderAreas, reviewsTotalPages, reviewsWindow } from './profile';

describe('orderAreas', () => {
  it('puts the base first, then alphabetical', () => {
    const out = orderAreas([
      { name: 'Moratuwa', isBase: false },
      { name: 'colombo 7', isBase: false },
      { name: 'Maharagama', isBase: true },
      { name: 'Dehiwala', isBase: false },
    ]);
    expect(out.map((a) => a.name)).toEqual(['Maharagama', 'colombo 7', 'Dehiwala', 'Moratuwa']);
  });
});
describe('reviewsWindow', () => {
  it.each([
    [1, 0, 5],
    [2, 5, 10],
    [3, 15, 10],
    [0, 0, 5],
  ])('page %i → offset %i limit %i', (page, offset, limit) => {
    expect(reviewsWindow(page)).toEqual({ offset, limit });
  });
  it.each([
    [0, 0],
    [3, 1],
    [5, 1],
    [6, 2],
    [15, 2],
    [16, 3],
    [212, 22],
  ])('total %i → %i pages', (total, pages) => {
    expect(reviewsTotalPages(total)).toBe(pages);
  });
});
