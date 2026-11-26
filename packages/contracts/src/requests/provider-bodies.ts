import { z } from 'zod';
import { OptionalReason } from '../common/primitives';

export const AGREED_PRICE_MESSAGE = 'Enter a whole amount in rupees, like 6500.';
export const AGREED_PRICE_MAX = 10_000_000;

/** S22 / BR-12: whole LKR, 1–10,000,000. */
export const AgreedPrice = z
  .number({ error: AGREED_PRICE_MESSAGE })
  .int(AGREED_PRICE_MESSAGE)
  .min(1, AGREED_PRICE_MESSAGE)
  .max(AGREED_PRICE_MAX, AGREED_PRICE_MESSAGE);

/** Form text → number. '' → undefined. Spaces and thousands commas are ignored ('6,500' → 6500); '6.5' fails. */
export const AgreedPriceText = z.string().transform((raw, ctx): number | undefined => {
  const s = raw.replace(/[\s,]/g, '');
  if (s === '') return undefined;
  const parsed = AgreedPrice.safeParse(/^\d+$/.test(s) ? Number(s) : Number.NaN);
  if (!parsed.success) {
    ctx.addIssue({ code: 'custom', message: AGREED_PRICE_MESSAGE });
    return z.NEVER;
  }
  return parsed.data;
});

export const AcceptBody = z.object({ agreedPrice: AgreedPrice.optional() });
export type AcceptBody = z.infer<typeof AcceptBody>;

export const DeclineBody = z.object({ reason: OptionalReason });
export type DeclineBody = z.infer<typeof DeclineBody>;

export const CompleteBody = z.object({ agreedPrice: AgreedPrice.optional() });
export type CompleteBody = z.infer<typeof CompleteBody>;

/** PUT …/agreed-price: null clears it. */
export const AgreedPriceBody = z.object({ agreedPrice: AgreedPrice.nullable() });
export type AgreedPriceBody = z.infer<typeof AgreedPriceBody>;

/** Accept dialog, complete dialog and the S22 inline editor (one text field). */
export const AgreedPriceForm = z.object({ agreedPrice: AgreedPriceText });
export type AgreedPriceFormInput = z.input<typeof AgreedPriceForm>;
