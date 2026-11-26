import { describe, expect, it } from 'vitest';
import { actorLabel } from './history';

describe('actorLabel (S15.E7)', () => {
  it.each([
    ['customer', 'by you'],
    ['provider', 'by Bell & Sons'],
    ['admin', 'by Fixit'],
    ['system', 'automatically'],
  ] as const)('%s', (actor, label) => {
    expect(actorLabel(actor, 'Bell & Sons')).toBe(label);
  });
});
