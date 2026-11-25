import { describe, expect, it } from 'vitest';
import { matchCategory } from './match';

const cats = [
  { id: 'plumbing', name: 'Plumbing', order: 1 },
  { id: 'painting', name: 'Painting & Decorating', order: 5 },
  { id: 'appliance', name: 'Appliance Repair', order: 8 },
];

describe('matchCategory (BR-02)', () => {
  it('exact name, any case', () => {
    expect(matchCategory('plumbing', cats)?.id).toBe('plumbing');
    expect(matchCategory('PAINTING & DECORATING', cats)?.id).toBe('painting');
  });
  it('prefix ≥ 4 chars', () => {
    expect(matchCategory('plumb', cats)?.id).toBe('plumbing');
    expect(matchCategory('Appl', cats)?.id).toBe('appliance');
  });
  it('prefix < 4 chars is free text', () => {
    expect(matchCategory('plu', cats)).toBeNull();
    expect(matchCategory('pa', cats)).toBeNull();
  });
  it('trims whitespace', () => {
    expect(matchCategory('  plumb  ', cats)?.id).toBe('plumbing');
  });
  it('non-prefix text and empty input → null', () => {
    expect(matchCategory('leaky tap', cats)).toBeNull();
    expect(matchCategory('lumbing', cats)).toBeNull();
    expect(matchCategory('', cats)).toBeNull();
    expect(matchCategory(undefined, cats)).toBeNull();
  });
});
