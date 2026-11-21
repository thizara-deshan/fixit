import { expect, it } from 'vitest';
import { features } from './features';

it('exports every Should/Could flag, all off', () => {
  expect(Object.keys(features).sort()).toEqual([
    'adminCatalog',
    'adminRequests',
    'checklist',
    'metrics',
    'pause',
    'providerReviews',
    'replies',
    'savedProviders',
  ]);
  expect(Object.values(features).every((v) => !v)).toBe(true);
});
