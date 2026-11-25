import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { MOBILE_MESSAGE } from '../common/primitives';
import { bookingWindowMessage, makeCreateRequestSchema } from './schemas';

const now = new Date('2026-11-22T04:30:00.000Z'); // Sun 22 Nov 2026, 10:00 Colombo
const schema = makeCreateRequestSchema(now);
const valid = {
  providerId: 'p03',
  serviceId: 's-p03-1',
  preferredDate: '2026-11-25',
  slot: 'morning',
  townId: 'colombo',
  addressLine1: '12 Galle Road',
  addressLine2: '',
  description: 'Two sockets in the kitchen stopped working.',
};
const firstByPath = (e: z.ZodError): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const i of e.issues) out[i.path.join('.')] ??= i.message;
  return out;
};

describe('makeCreateRequestSchema', () => {
  it('empty form → the six SPEC messages and no range message', () => {
    const r = schema.safeParse({
      providerId: 'p03',
      serviceId: '',
      preferredDate: '',
      townId: '',
      addressLine1: '',
      addressLine2: '',
      description: '',
    });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(firstByPath(r.error)).toEqual({
      serviceId: 'Choose a service.',
      preferredDate: 'Choose a date.',
      slot: 'Choose a time slot.',
      townId: 'Choose your town.',
      addressLine1: 'Enter your address.',
      description: 'Describe the job in at least 20 characters.',
    });
  });
  it('window message text', () => {
    expect(bookingWindowMessage(now)).toBe('Choose a date from Mon, 23 Nov 2026 to Thu, 21 Jan 2027.');
  });
  it.each(['2026-11-22', '2027-01-22'])('%s is outside the window', (d) => {
    const r = schema.safeParse({ ...valid, preferredDate: d });
    expect(r.success).toBe(false);
    if (!r.success) expect(firstByPath(r.error).preferredDate).toBe(bookingWindowMessage(now));
  });
  it('range message shows even while other fields are still invalid', () => {
    const r = schema.safeParse({
      providerId: 'p03',
      serviceId: '',
      preferredDate: '2026-11-22',
      townId: '',
      addressLine1: '',
      description: '',
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(firstByPath(r.error).preferredDate).toBe(bookingWindowMessage(now));
  });
  it.each(['2026-11-23', '2027-01-21'])('%s is inside the window', (d) => {
    expect(schema.safeParse({ ...valid, preferredDate: d }).success).toBe(true);
  });
  it('short address, empty line 2, mobile normalisation', () => {
    const short = schema.safeParse({ ...valid, addressLine1: 'abc' });
    expect(short.success).toBe(false);
    if (!short.success)
      expect(firstByPath(short.error).addressLine1).toBe(
        'Enter a fuller address so the provider can find you.',
      );
    const ok = schema.parse({ ...valid, mobile: '077 123 4567' });
    expect(ok.addressLine2).toBeUndefined();
    expect(ok.mobile).toBe('+94771234567');
    const bad = schema.safeParse({ ...valid, mobile: '' });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(firstByPath(bad.error).mobile).toBe(MOBILE_MESSAGE);
  });
  it('description over 1,000 characters', () => {
    const r = schema.safeParse({ ...valid, description: 'x'.repeat(1001) });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(firstByPath(r.error).description).toBe('Keep the description under 1,000 characters.');
  });
});
