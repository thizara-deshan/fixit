import type {
  AccountStatus,
  AuditAction,
  AuditTargetType,
  AuthMethod,
  CategoryIcon,
  DocumentType,
  PriceUnit,
  RequestRecord,
  ReverificationReason,
  ReviewVisibility,
  SubmissionStatus,
  SubmissionTrigger,
  VerificationStatus,
} from '@fixit/contracts';

// Plain, JSON-safe rows (dates are ISO strings). Field names follow ARCHITECTURE §8.1.
export interface FxCategory {
  id: string;
  name: string;
  blurb: string;
  icon: CategoryIcon;
  order: number;
  active: boolean;
}
export interface FxDistrict {
  id: string;
  name: string;
  order: number;
}
export interface FxTown {
  id: string;
  name: string;
  districtId: string;
  order: number;
  active: boolean;
}
export interface FxUser {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  status: AccountStatus;
  emailConfirmedAt: string | null;
  mobile: string | null;
  authMethods: AuthMethod[];
  createdAt: string;
}
export interface FxProvider {
  id: string;
  userId: string;
  businessName: string | null;
  bio: string | null;
  yearsExperience: number | null;
  categoryId: string | null;
  baseTownId: string | null;
  photoKey: string | null;
  onboardingStep: number;
  onboardingComplete: boolean;
  publishedAt: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  reverificationReason: ReverificationReason | null;
  paused: boolean;
  ratingAvg: number | null;
  reviewCount: number;
  startingPrice: number | null;
  startingUnit: PriceUnit | null;
  createdAt: string;
}
export interface FxService {
  id: string;
  providerId: string;
  name: string;
  price: number;
  unit: PriceUnit;
}
export interface FxArea {
  providerId: string;
  townId: string;
  isBase: boolean;
}
export interface FxReview {
  id: string;
  requestId: string;
  providerId: string;
  authorId: string;
  rating: number;
  text: string;
  visibility: ReviewVisibility;
  createdAt: string;
  replyText: string | null;
  replyCreatedAt: string | null;
  replyUpdatedAt: string | null;
}
export interface FxSubmission {
  id: string;
  providerId: string;
  attempt: number;
  trigger: SubmissionTrigger;
  status: SubmissionStatus;
  submittedAt: string;
  decidedAt: string | null;
  decidedById: string | null;
  rejectionReason: string | null;
}
export interface FxAudit {
  id: string;
  adminId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  reason: string | null;
  at: string;
}
export interface FxDocument {
  id: string;
  providerId: string;
  submissionId: string | null;
  type: DocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}
export interface World {
  categories: FxCategory[];
  districts: FxDistrict[];
  towns: FxTown[];
  users: FxUser[];
  providers: FxProvider[];
  services: FxService[];
  areas: FxArea[];
  requests: RequestRecord[];
  reviews: FxReview[];
  submissions: FxSubmission[];
  documents: FxDocument[];
  audit: FxAudit[];
}
