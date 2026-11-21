import type { Role } from '../common/enums';

/** D11: roles are derived, never stored. Admin is exclusive; every other account is a customer, plus provider once published. */
export function deriveRoles(input: { isAdmin: boolean; providerPublished: boolean }): Role[] {
  if (input.isAdmin) return ['admin'];
  return input.providerPublished ? ['customer', 'provider'] : ['customer'];
}
