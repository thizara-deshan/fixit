import { describe, expect, it } from 'vitest';
import { initialTownId } from './town-prefill';

const areas = [{ id: 'kotte' }, { id: 'colombo' }];
describe('initialTownId', () => {
  it.each([
    ['colombo', 'colombo'],
    ['galle', ''],
    [null, ''],
  ] as const)('%s → %s', (loc, out) => {
    expect(initialTownId(areas, loc)).toBe(out);
  });
});
