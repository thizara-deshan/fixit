import { z } from 'zod';
import { Category, StartingPrice, TownRef } from '../catalog/schemas';
import { DocumentType, ReverificationReason, VerificationStatus } from '../common/enums';
import { Id, IsoDateTime } from '../common/primitives';
import {
  OnboardingStep1Body,
  OnboardingStep2Body,
  OnboardingStep4Body,
  type OnboardingStepParam,
} from './onboarding';
import { Service } from './schemas';
import { OnboardingStep3Body } from './services';

/** GET /me/provider: the caller's draft or listing (S19, S23–S26). Draft fields are null until their step is saved. */
export const OwnProvider = z.object({
  id: Id,
  ownerName: z.string(),
  businessName: z.string().nullable(),
  bio: z.string().nullable(),
  yearsExperience: z.number().int().nullable(),
  category: Category.pick({ id: true, name: true, icon: true }).nullable(),
  services: z.array(Service),
  baseTown: TownRef.nullable(),
  otherTowns: z.array(TownRef), // alphabetical
  photoUrl: z.string().nullable(),
  onboarding: z.object({ complete: z.boolean(), step: z.number().int().min(1).max(5) }),
  publishedAt: IsoDateTime.nullable(),
  verificationStatus: VerificationStatus,
  verifiedAt: IsoDateTime.nullable(),
  reverificationReason: ReverificationReason.nullable(),
  rejectionReason: z.string().nullable(),
  paused: z.boolean(),
  startingPrice: StartingPrice.nullable(),
});
export type OwnProvider = z.infer<typeof OwnProvider>;

export const PhotoResult = z.object({ photoUrl: z.string() });
export type PhotoResult = z.infer<typeof PhotoResult>;

export const DocumentMeta = z.object({
  id: Id,
  type: DocumentType,
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  url: z.string(), // /api/files/documents/:id (owner or admin only)
  createdAt: IsoDateTime,
});
export type DocumentMeta = z.infer<typeof DocumentMeta>;

/** GET /me/provider/verification (S26). `documents`: staged while editable, else the latest submission's (D-10). */
export const VerificationState = z.object({
  status: VerificationStatus,
  editable: z.boolean(),
  verifiedAt: IsoDateTime.nullable(),
  rejectionReason: z.string().nullable(),
  documents: z.array(DocumentMeta),
});
export type VerificationState = z.infer<typeof VerificationState>;

/** Text fields of the multipart POST …/verification/documents (the `file` part is checked with `checkUpload`). */
export const DocumentUploadFields = z.object({ type: DocumentType });

export const isVerificationEditable = (s: VerificationStatus): boolean =>
  s === 'not_submitted' || s === 'rejected';

export type OnboardingBody =
  | { step: 1; body: OnboardingStep1Body }
  | { step: 2; body: OnboardingStep2Body }
  | { step: 3; body: OnboardingStep3Body }
  | { step: 4; body: OnboardingStep4Body };
/** D-3: the body schema depends on `:step`. Throws ZodError (→ 400 VALIDATION_FAILED) on a bad body. */
export function parseOnboardingBody(step: OnboardingStepParam, raw: unknown): OnboardingBody {
  switch (step) {
    case 1:
      return { step, body: OnboardingStep1Body.parse(raw) };
    case 2:
      return { step, body: OnboardingStep2Body.parse(raw) };
    case 3:
      return { step, body: OnboardingStep3Body.parse(raw) };
    case 4:
      return { step, body: OnboardingStep4Body.parse(raw) };
  }
}
