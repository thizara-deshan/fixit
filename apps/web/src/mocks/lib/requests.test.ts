import { describe, expect, it } from 'vitest';
import { CustomerRequestView } from '@fixit/contracts';
import { db } from '../db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { customerViewOf, openRequestsOf } from './requests';

const byRef = (ref: string) => {
  const r = Object.values(db().requests).find((x) => x.ref === ref);
  if (!r) throw new Error(ref);
  return r;
};

describe('mock request helpers', () => {
  it('Olivia has FX-2061 open', () => {
    expect(openRequestsOf(db(), 'u-olivia').map((r) => r.ref)).toContain('FX-2061');
  });
  it('pending view hides the provider mobile', () => {
    const v = CustomerRequestView.parse(customerViewOf(db(), byRef('FX-2061'), FIXED_NOW));
    expect(v.provider.businessName).toBe('Bell & Sons Plumbing');
    expect(v.provider.mobile).toBeNull();
  });
  it('completed view shows it and has a review block', () => {
    const v = customerViewOf(db(), byRef('FX-2046'), FIXED_NOW);
    expect(v.provider.mobile).not.toBeNull();
    expect(v.review).not.toBeNull();
  });
});
