import { z } from 'zod';
import { ReverificationReason, type VerificationStatus } from '../common/enums';
import { Bio, BusinessName, OnboardingStep2Body, YearsExperience, YearsText } from './onboarding';
import { OwnProvider } from './own';

const CategoryId = OnboardingStep2Body.shape.categoryId; // 'Choose a category.'

/** PATCH /me/provider/business (A23): the whole S24 details card (D-1). The server also checks the category is active. */
export const UpdateBusinessBody = z.object({
  businessName: BusinessName,
  bio: Bio,
  yearsExperience: YearsExperience,
  categoryId: CategoryId,
});
export type UpdateBusinessBody = z.infer<typeof UpdateBusinessBody>;

/** S24 details form: years is text in the input. */
export const UpdateBusinessForm = z.object({
  businessName: BusinessName,
  bio: Bio,
  yearsExperience: YearsText,
  categoryId: CategoryId,
});
export type UpdateBusinessFormInput = z.input<typeof UpdateBusinessForm>;

export const UpdateBusinessResult = z.object({
  provider: OwnProvider,
  reverification: ReverificationReason.nullable(), // applied by this save (D-1)
});
export type UpdateBusinessResult = z.infer<typeof UpdateBusinessResult>;

/** BR-21 applies only to a Verified listing (decision 006). */
export const reverificationApplies = (s: VerificationStatus): boolean => s === 'verified';

/** D-2: which edit triggers re-verification (name wins over category), or null. */
export function reverificationFor(input: {
  status: VerificationStatus;
  before: { businessName: string | null; categoryId: string | null };
  after: { businessName: string; categoryId: string };
}): ReverificationReason | null {
  if (!reverificationApplies(input.status)) return null;
  if ((input.before.businessName ?? '').trim() !== input.after.businessName.trim()) return 'business_name';
  if (input.before.categoryId !== input.after.categoryId) return 'category';
  return null;
}

const FIELD: Record<ReverificationReason, string> = { business_name: 'business name', category: 'category' };
/** S24.E3 inline warning. */
export const reverifyWarning = (r: ReverificationReason): string =>
  `Changing your ${FIELD[r]} removes your Verified badge until Fixit checks your documents again.`;
