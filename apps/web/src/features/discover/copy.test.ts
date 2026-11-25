import { describe, expect, it } from 'vitest';
import { DiscoverQuery, type CatalogResponse } from '@fixit/contracts';
import { contextLine, resultsTitle, showCountLabel } from './copy';

const catalog: CatalogResponse = {
  categories: [
    { id: 'plumbing', name: 'Plumbing', blurb: '', icon: 'wrench', order: 1 },
    { id: 'cleaning', name: 'Cleaning', blurb: '', icon: 'spray-can', order: 2 },
  ],
  districts: [{ id: 'colombo', name: 'Colombo', order: 1 }],
  towns: [{ id: 'dehiwala-mount-lavinia', name: 'Dehiwala-Mount Lavinia', districtId: 'colombo' }],
};
const ctx = (raw: Record<string, string>) => contextLine(DiscoverQuery.parse(raw), catalog);

describe('discover copy', () => {
  it('titles', () => {
    expect(resultsTitle(1)).toBe('1 provider found');
    expect(resultsTitle(0)).toBe('0 providers found');
    expect(showCountLabel(4)).toBe('Show 4 providers');
  });
  it('context line variants', () => {
    expect(ctx({ q: 'plumb', loc: 'dehiwala-mount-lavinia' })).toBe(
      'Showing Plumbing in Dehiwala-Mount Lavinia',
    );
    expect(ctx({ cat: 'plumbing,cleaning' })).toBe('Showing 2 categories in all locations');
    expect(ctx({ q: 'leaky tap' })).toBe('Showing “leaky tap” in all locations');
    expect(ctx({})).toBe('Showing all services in all locations');
    expect(ctx({ cat: 'x' })).toBe('Showing all services in all locations');
  });
});
