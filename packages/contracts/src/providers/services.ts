import { z } from 'zod';
import { PriceUnit } from '../common/enums';

export const SERVICE_NAME_EMPTY = 'Enter a service name.';
export const SERVICE_NAME_LENGTH = 'Service name must be 2 to 60 characters.';
export const SERVICE_NAME_TAKEN = 'You already have a service with this name.';
export const SERVICE_PRICE_MESSAGE = 'Enter a price in whole rupees, from LKR 100 to LKR 1,000,000.';
export const SERVICE_UNIT_MESSAGE = 'Choose how this price is charged.';
export const SERVICES_MIN_MESSAGE = 'Add at least one service.';
export const SERVICES_MAX = 20;
export const SERVICES_MAX_MESSAGE = 'You can list up to 20 services.';

export const ServiceName = z
  .string()
  .trim()
  .min(1, { error: SERVICE_NAME_EMPTY, abort: true })
  .min(2, SERVICE_NAME_LENGTH)
  .max(60, SERVICE_NAME_LENGTH);
export const ServicePrice = z
  .number({ error: SERVICE_PRICE_MESSAGE })
  .int(SERVICE_PRICE_MESSAGE)
  .min(100, SERVICE_PRICE_MESSAGE)
  .max(1_000_000, SERVICE_PRICE_MESSAGE);
/** Form text → whole LKR. Spaces and thousands commas are ignored ('2,500' → 2500). */
export const ServicePriceText = z.string().transform((raw, ctx): number => {
  const s = raw.replace(/[\s,]/g, '');
  const parsed = ServicePrice.safeParse(/^\d+$/.test(s) ? Number(s) : Number.NaN);
  if (!parsed.success) {
    ctx.addIssue({ code: 'custom', message: SERVICE_PRICE_MESSAGE });
    return z.NEVER;
  }
  return parsed.data;
});
export const ServiceUnit = z.enum(PriceUnit.options, { error: SERVICE_UNIT_MESSAGE });

/** POST/PATCH /me/provider/services (M12) and each row of step 3. */
export const ServiceBody = z.object({ name: ServiceName, price: ServicePrice, unit: ServiceUnit });
export type ServiceBody = z.infer<typeof ServiceBody>;
/** One editor row (S19 step 3, S23 dialog). */
export const ServiceForm = z.object({ name: ServiceName, price: ServicePriceText, unit: ServiceUnit });
export type ServiceFormInput = z.input<typeof ServiceForm>;

/** Case-insensitive duplicate names → issue on every later duplicate's `name`. */
export function addDuplicateNameIssues(rows: readonly { name: string }[], ctx: z.RefinementCtx): void {
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const key = row.name.trim().toLowerCase();
    if (seen.has(key)) ctx.addIssue({ code: 'custom', path: [i, 'name'], message: SERVICE_NAME_TAKEN });
    seen.add(key);
  });
}

const servicesArray = <T extends z.ZodType<{ name: string }>>(row: T) =>
  z
    .array(row)
    .min(1, SERVICES_MIN_MESSAGE)
    .max(SERVICES_MAX, SERVICES_MAX_MESSAGE)
    .superRefine(addDuplicateNameIssues);

/** PUT /me/provider/onboarding/3: replaces the draft's services. */
export const OnboardingStep3Body = z.object({ services: servicesArray(ServiceBody) });
export type OnboardingStep3Body = z.infer<typeof OnboardingStep3Body>;
export const Step3Form = z.object({ services: servicesArray(ServiceForm) });
export type Step3FormInput = z.input<typeof Step3Form>;
/** Shape every form that hosts `ServicesRepeater` / `ServiceRowFields` uses (D-13). */
export type ServicesFormValues = Step3FormInput;
