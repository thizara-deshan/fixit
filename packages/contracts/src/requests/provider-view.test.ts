import { describe, expect, it } from 'vitest';
import { CustomerContact } from './schemas';

describe('CustomerContact', () => {
  it('unrevealed parse drops any contact field that slipped in', () => {
    const c = CustomerContact.parse({
      revealed: false,
      displayName: 'Olivia M.',
      fullName: 'Olivia Martinez',
      mobile: '+94770001001',
    });
    expect(c).toEqual({ revealed: false, displayName: 'Olivia M.' });
    expect('mobile' in c).toBe(false);
  });
  it('revealed requires the full contact', () => {
    expect(CustomerContact.safeParse({ revealed: true, displayName: 'Olivia M.' }).success).toBe(false);
  });
});
