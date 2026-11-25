// packages/contracts/src/common/primitives.ts
import { z } from 'zod';

export const Id = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[A-Za-z0-9_-]+$/);
export const RequestRef = z.string().regex(/^FX-\d{4,}$/);
export const Lkr = z.number().int().nonnegative(); // whole rupees
export const IsoDate = z.iso.date(); // 'YYYY-MM-DD' (a Colombo calendar day)
export const IsoDateTime = z.iso.datetime({ offset: true });

export const Email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Enter your email address.')
  .pipe(z.email('Enter a valid email address, like name@example.com.'));

export const Password = z
  .string()
  .min(8, 'Use at least 8 characters with a letter and a number.')
  .max(128)
  .regex(/[A-Za-z]/, 'Use at least 8 characters with a letter and a number.')
  .regex(/\d/, 'Use at least 8 characters with a letter and a number.');

export const FullName = z
  .string()
  .trim()
  .min(1, 'Enter your full name.')
  .min(2, 'Name must be 2 to 80 characters.')
  .max(80, 'Name must be 2 to 80 characters.');

export const MOBILE_MESSAGE = 'Enter a Sri Lankan mobile number, like 077 123 4567.';

/** Input: "077 123 4567", "0771234567", "+94 77 123 4567" → output "+94771234567" (E.164). */
export const MobileInput = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ''))
  .transform((s) => (s.startsWith('+94') ? s.slice(3) : s.startsWith('0') ? s.slice(1) : s))
  .pipe(z.string().regex(/^7\d{8}$/, MOBILE_MESSAGE))
  .transform((d) => `+94${d}`);
/** Output form, as stored and returned. Display formatting (+94 77 123 4567) is web-only. */
export const Mobile = z.string().regex(/^\+947\d{8}$/);

/** S18: an empty field clears the number (→ null); anything else must be a valid Sri Lankan mobile. */
export const MobileOrEmpty = z.string().transform((s, ctx) => {
  if (s.trim() === '') return null;
  const parsed = MobileInput.safeParse(s);
  if (!parsed.success) {
    ctx.addIssue({ code: 'custom', message: MOBILE_MESSAGE });
    return z.NEVER;
  }
  return parsed.data;
});

export const OptionalReason = z
  .string()
  .trim()
  .max(500, 'Keep the reason under 500 characters.')
  .optional()
  .transform((s) => (s === '' ? undefined : s));
export const adminReason = (message: string) => z.string().trim().min(10, message).max(500, message);

export type Id = z.infer<typeof Id>;
export type RequestRef = z.infer<typeof RequestRef>;
export type Lkr = z.infer<typeof Lkr>;
export type IsoDate = z.infer<typeof IsoDate>;
export type IsoDateTime = z.infer<typeof IsoDateTime>;
export type Email = z.infer<typeof Email>;
export type Password = z.infer<typeof Password>;
export type FullName = z.infer<typeof FullName>;
export type MobileInput = z.output<typeof MobileInput>;
export type Mobile = z.infer<typeof Mobile>;
