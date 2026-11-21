import { describe, expect, it } from 'vitest';
import { deriveRoles } from './roles';

describe('deriveRoles', () => {
  it.each([
    [{ isAdmin: true, providerPublished: false }, ['admin']],
    [{ isAdmin: true, providerPublished: true }, ['admin']],
    [{ isAdmin: false, providerPublished: false }, ['customer']],
    [{ isAdmin: false, providerPublished: true }, ['customer', 'provider']],
  ])('%j → %j', (input, roles) => {
    expect(deriveRoles(input)).toEqual(roles);
  });
});
