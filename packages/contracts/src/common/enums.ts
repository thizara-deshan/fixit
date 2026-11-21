// packages/contracts/src/common/enums.ts
import { z } from 'zod';

export const Role = z.enum(['customer', 'provider', 'admin']);
export type Role = z.infer<typeof Role>;

export const AccountStatus = z.enum(['active', 'suspended']);
export type AccountStatus = z.infer<typeof AccountStatus>;

export const AuthMethod = z.enum(['password', 'google']);
export type AuthMethod = z.infer<typeof AuthMethod>;

export const PriceUnit = z.enum(['per_hour', 'per_visit', 'fixed']);
export type PriceUnit = z.infer<typeof PriceUnit>;

export const TimeSlot = z.enum(['morning', 'afternoon', 'evening']);
export type TimeSlot = z.infer<typeof TimeSlot>;

export const RequestStatus = z.enum(['pending', 'accepted', 'declined', 'cancelled', 'expired', 'completed']);
export type RequestStatus = z.infer<typeof RequestStatus>;
export const OPEN_STATUSES = ['pending', 'accepted'] as const satisfies readonly RequestStatus[];
export const FINAL_STATUSES = [
  'declined',
  'cancelled',
  'expired',
  'completed',
] as const satisfies readonly RequestStatus[];

export const RequestActor = z.enum(['customer', 'provider', 'admin', 'system']);
export type RequestActor = z.infer<typeof RequestActor>;

export const VerificationStatus = z.enum(['not_submitted', 'pending_review', 'verified', 'rejected']);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const SubmissionStatus = z.enum(['pending_review', 'approved', 'rejected']);
export type SubmissionStatus = z.infer<typeof SubmissionStatus>;

export const SubmissionTrigger = z.enum(['provider', 'business_name', 'category']); // BR-21 re-queue
export type SubmissionTrigger = z.infer<typeof SubmissionTrigger>;

export const DocumentType = z.enum(['nic_front', 'nic_back', 'trade_certificate', 'business_registration']);
export type DocumentType = z.infer<typeof DocumentType>;

export const ReviewVisibility = z.enum(['visible', 'hidden']);
export type ReviewVisibility = z.infer<typeof ReviewVisibility>;

export const CategoryIcon = z.enum([
  'wrench',
  'zap',
  'spray-can',
  'sprout',
  'paint-roller',
  'hammer',
  'drill',
  'washing-machine',
]);
export type CategoryIcon = z.infer<typeof CategoryIcon>;

export const SortKey = z.enum(['rating', 'reviews', 'town']);
export type SortKey = z.infer<typeof SortKey>;

export const ReverificationReason = z.enum(['business_name', 'category']);
export type ReverificationReason = z.infer<typeof ReverificationReason>;
