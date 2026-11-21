import { describe, expect, it } from 'vitest';
import { RequestRecord, toMachineRequest } from './record';

const sample = {
  id: 'r-FX-2061',
  ref: 'FX-2061',
  customerId: 'u-olivia',
  providerId: 'p01',
  providerUserId: 'u-marcus',
  serviceId: 'p01-s1',
  service: { name: 'Leak repair', price: 2500, unit: 'per_hour' },
  preferredDate: '2026-11-25',
  slot: 'morning',
  townId: 'colombo',
  addressLine1: '24 Galle Road',
  addressLine2: null,
  description: 'Water dripping under the kitchen sink cabinet.',
  customerMobile: '+94770001001',
  agreedPrice: null,
  status: 'pending',
  reason: null,
  closedBy: null,
  createdAt: '2026-11-22T02:30:00.000Z',
  updatedAt: '2026-11-22T02:30:00.000Z',
  expiresAt: '2026-11-24T18:30:00.000Z',
  completedAt: null,
  events: [
    {
      status: 'pending',
      at: '2026-11-22T02:30:00.000Z',
      actor: 'customer',
      actorUserId: 'u-olivia',
      reason: null,
    },
  ],
};

describe('RequestRecord', () => {
  it('parses a pending record', () => {
    expect(RequestRecord.parse(sample).ref).toBe('FX-2061');
  });
  it('toMachineRequest turns expiresAt into a Date', () => {
    const m = toMachineRequest(RequestRecord.parse(sample));
    expect(m).toEqual({
      status: 'pending',
      customerId: 'u-olivia',
      providerUserId: 'u-marcus',
      preferredDate: '2026-11-25',
      expiresAt: new Date('2026-11-24T18:30:00.000Z'),
    });
  });
});
