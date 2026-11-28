import { describe, expect, it } from 'vitest';
import { reverificationFor, reverifyWarning, UpdateBusinessBody, UpdateBusinessForm } from './business';

const before = { businessName: 'Bell & Sons Plumbing', categoryId: 'plumbing' };
const bio = 'Family-run plumbing business serving Colombo for over a decade.';

describe('reverificationFor (BR-21)', () => {
  it('verified: name change → business_name, category change → category', () => {
    const status = 'verified' as const;
    expect(reverificationFor({ status, before, after: { ...before, businessName: 'Bell Plumbing' } })).toBe(
      'business_name',
    );
    expect(reverificationFor({ status, before, after: { ...before, categoryId: 'handyman' } })).toBe(
      'category',
    );
  });
  it('both changed → business_name; whitespace-only change → null', () => {
    expect(
      reverificationFor({
        status: 'verified',
        before,
        after: { businessName: 'X Y', categoryId: 'handyman' },
      }),
    ).toBe('business_name');
    expect(
      reverificationFor({
        status: 'verified',
        before,
        after: { ...before, businessName: ' Bell & Sons Plumbing ' },
      }),
    ).toBeNull();
  });
  it('pending_review / not_submitted / rejected → null (decision 006)', () => {
    for (const status of ['pending_review', 'not_submitted', 'rejected'] as const)
      expect(
        reverificationFor({ status, before, after: { businessName: 'New', categoryId: 'handyman' } }),
      ).toBeNull();
  });
  it('warning copy', () => {
    expect(reverifyWarning('category')).toBe(
      'Changing your category removes your Verified badge until Fixit checks your documents again.',
    );
  });
});

describe('UpdateBusinessBody / Form', () => {
  it('SPEC messages', () => {
    const r = UpdateBusinessBody.safeParse({
      businessName: '',
      bio: 'short',
      yearsExperience: 61,
      categoryId: '',
    });
    expect(r.success).toBe(false);
    const msgs = r.error?.issues.map((i) => i.message) ?? [];
    expect(msgs).toEqual(
      expect.arrayContaining([
        'Enter your business name.',
        'Tell customers about your business in at least 30 characters.',
        'Enter a number from 0 to 60.',
        'Choose a category.',
      ]),
    );
  });
  it('form turns years text into a number', () => {
    expect(
      UpdateBusinessForm.parse({ businessName: 'Bell', bio, yearsExperience: '14', categoryId: 'plumbing' })
        .yearsExperience,
    ).toBe(14);
  });
});
