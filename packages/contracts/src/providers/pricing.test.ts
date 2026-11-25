import { describe, expect, it } from 'vitest';
import { computeStartingPrice, priceLabel } from './pricing';

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

describe('priceLabel', () => {
  it.each([
    ['per_hour', 'From', ' / hour'],
    ['per_visit', 'From', ' / visit'],
    ['fixed', null, ' fixed'],
  ] as const)('%s → lead %s, suffix %s', (unit, lead, suffix) => {
    expect(priceLabel({ amount: 2500, unit })).toEqual({ lead, amount: 2500, suffix });
  });
});
