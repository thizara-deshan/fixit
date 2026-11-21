import { describe, expect, it } from 'vitest';
import { displayNameOf } from './names';

describe('displayNameOf', () => {
  it.each([
    ['Olivia Martinez', 'Olivia M.'],
    ['  Kasun  ', 'Kasun'],
    ['Dana de Silva', 'Dana S.'],
    ['Sarah Karunaratne', 'Sarah K.'],
  ])('%s → %s', (input, out) => {
    expect(displayNameOf(input)).toBe(out);
  });
});
