import { z } from 'zod';
import { Id, MobileInput } from '../common/primitives';

/* ---------- SPEC S19 copy (written once) ---------- */
export const BUSINESS_NAME_EMPTY = 'Enter your business name.';
export const BUSINESS_NAME_LENGTH = 'Business name must be 2 to 60 characters.';
export const BIO_SHORT = 'Tell customers about your business in at least 30 characters.';
export const BIO_LONG = 'Keep your bio under 600 characters.';
export const YEARS_MESSAGE = 'Enter a number from 0 to 60.';
export const CATEGORY_MESSAGE = 'Choose a category.';
export const BASE_TOWN_MESSAGE = 'Choose your base town.';
export const OTHER_TOWNS_MAX = 9;
export const OTHER_TOWNS_MAX_MESSAGE = 'You can add up to 9 other towns.';
export const BIO_MAX = 600;
export const ONBOARDING_STEPS = 5;

export const BusinessName = z
  .string()
  .trim()
  .min(1, { error: BUSINESS_NAME_EMPTY, abort: true })
  .min(2, BUSINESS_NAME_LENGTH)
  .max(60, BUSINESS_NAME_LENGTH);
export const Bio = z.string().trim().min(30, BIO_SHORT).max(BIO_MAX, BIO_LONG);
export const YearsExperience = z
  .number({ error: YEARS_MESSAGE })
  .int(YEARS_MESSAGE)
  .min(0, YEARS_MESSAGE)
  .max(60, YEARS_MESSAGE);
/** Form text → integer 0–60. '', '3.5', '-1', 'abc' fail with the SPEC message. */
export const YearsText = z.string().transform((raw, ctx): number => {
  const s = raw.trim();
  const parsed = YearsExperience.safeParse(/^\d+$/.test(s) ? Number(s) : Number.NaN);
  if (!parsed.success) {
    ctx.addIssue({ code: 'custom', message: YEARS_MESSAGE });
    return z.NEVER;
  }
  return parsed.data;
});

/** PUT /me/provider/onboarding/1 (A21). The mobile goes through PATCH /me (D-4). */
export const OnboardingStep1Body = z.object({
  businessName: BusinessName,
  bio: Bio,
  yearsExperience: YearsExperience,
});
export type OnboardingStep1Body = z.infer<typeof OnboardingStep1Body>;

/** S19 step 1 form. `mobile` is validated only when the account has none (BR-23). */
export function makeStep1Form(needsMobile: boolean) {
  const mobile: z.ZodType<string | undefined, string> = needsMobile
    ? MobileInput
    : z.string().transform((): string | undefined => undefined);
  return z.object({ businessName: BusinessName, bio: Bio, yearsExperience: YearsText, mobile });
}
export type Step1FormInput = z.input<ReturnType<typeof makeStep1Form>>;
export type Step1FormOutput = z.output<ReturnType<typeof makeStep1Form>>;

/** PUT /me/provider/onboarding/2 (BR-13). The server also checks the category is active. */
export const OnboardingStep2Body = z.object({
  categoryId: z.string({ error: CATEGORY_MESSAGE }).min(1, CATEGORY_MESSAGE).pipe(Id),
});
export type OnboardingStep2Body = z.infer<typeof OnboardingStep2Body>;

/** S19 step 4 and S25 (BR-14). Duplicates and the base town are removed from `otherTownIds`. */
export const AreasBody = z
  .object({
    baseTownId: z.string({ error: BASE_TOWN_MESSAGE }).min(1, BASE_TOWN_MESSAGE).pipe(Id),
    otherTownIds: z.array(Id).max(OTHER_TOWNS_MAX, OTHER_TOWNS_MAX_MESSAGE),
  })
  .transform((v) => ({
    baseTownId: v.baseTownId,
    otherTownIds: [...new Set(v.otherTownIds)].filter((id) => id !== v.baseTownId),
  }));
export type AreasBody = z.output<typeof AreasBody>;
export type AreasFormInput = z.input<typeof AreasBody>;
export const OnboardingStep4Body = AreasBody;
export type OnboardingStep4Body = AreasBody;

/** `:step` of PUT /me/provider/onboarding/:step. Anything else → 404 (D-3). */
export const OnboardingStepParam = z.coerce.number().int().min(1).max(4);
export type OnboardingStepParam = 1 | 2 | 3 | 4;

/** D-1: the step to show after saving `saved`, capped at 5. */
export const nextOnboardingStep = (current: number, saved: number): number =>
  Math.min(ONBOARDING_STEPS, Math.max(current, saved + 1));
