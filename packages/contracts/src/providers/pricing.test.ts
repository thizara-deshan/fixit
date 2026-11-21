import { describe, expect, it } from 'vitest';
import { computeStartingPrice } from './pricing';

describe('computeStartingPrice', () => {
  it('no services → null', () => {
    expect(computeStartingPrice([])).toBeNull();
  });
  it('picks the lowest price with its unit', () => {
    expect(
      computeStartingPrice([
        { price: 13500, unit: 'fixed' },
        { price: 2500, unit: 'per_hour' },
        { price: 4500, unit: 'per_visit' },
      ]),
    ).toEqual({ amount: 2500, unit: 'per_hour' });
  });
  it('breaks ties per_hour < per_visit < fixed', () => {
    expect(
      computeStartingPrice([
        { price: 1500, unit: 'fixed' },
        { price: 1500, unit: 'per_visit' },
      ]),
    ).toEqual({ amount: 1500, unit: 'per_visit' });
    expect(
      computeStartingPrice([
        { price: 1500, unit: 'per_visit' },
        { price: 1500, unit: 'per_hour' },
      ]),
    ).toEqual({ amount: 1500, unit: 'per_hour' });
  });
});
