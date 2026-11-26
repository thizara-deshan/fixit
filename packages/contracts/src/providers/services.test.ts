import { describe, expect, it } from 'vitest';
import { OnboardingStep3Body, ServiceForm, Step3Form } from './services';

const paths = (r: { error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  (r.error?.issues ?? []).map((i) => `${i.path.join('.')}: ${i.message}`);

describe('service schemas', () => {
  it('row: text price parsed, SPEC messages', () => {
    expect(ServiceForm.parse({ name: ' Leak repair ', price: '2,500', unit: 'per_hour' })).toEqual({
      name: 'Leak repair',
      price: 2500,
      unit: 'per_hour',
    });
    expect(paths(ServiceForm.safeParse({ name: '', price: '99', unit: 'weekly' }))).toEqual([
      'name: Enter a service name.',
      'price: Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.',
      'unit: Choose how this price is charged.',
    ]);
    expect(paths(ServiceForm.safeParse({ name: 'A', price: '1000001', unit: 'fixed' }))).toEqual([
      'name: Service name must be 2 to 60 characters.',
      'price: Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.',
    ]);
    expect(ServiceForm.safeParse({ name: 'Ok name', price: '2.5', unit: 'fixed' }).success).toBe(false);
  });
  it('list: 1–20, unique names (case-insensitive)', () => {
    expect(paths(Step3Form.safeParse({ services: [] }))).toEqual(['services: Add at least one service.']);
    const row = (name: string) => ({ name, price: 500, unit: 'per_visit' as const });
    expect(
      paths(
        OnboardingStep3Body.safeParse({
          services: Array.from({ length: 21 }, (_, i) => row(`S${String(i)}x`)),
        }),
      ),
    ).toEqual(['services: You can list up to 20 services.']);
    expect(
      paths(OnboardingStep3Body.safeParse({ services: [row('Leak repair'), row('leak REPAIR ')] })),
    ).toEqual(['services.1.name: You already have a service with this name.']);
  });
});
