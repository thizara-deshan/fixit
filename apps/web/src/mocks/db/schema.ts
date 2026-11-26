import type { RequestRecord } from '@fixit/contracts';
import type {
  FxArea,
  FxCategory,
  FxDistrict,
  FxDocument,
  FxProvider,
  FxReview,
  FxService,
  FxSubmission,
  FxTown,
  FxUser,
} from '@fixit/fixtures';

/** Bump when the MockDb shape changes (CLAUDE.md mock rules). */
export const MOCK_DB_VERSION = 4;
export const MOCK_DB_KEY = `fixit.mockdb.v${String(MOCK_DB_VERSION)}`;

export interface MockUser extends FxUser {
  password: string | null; // plain text: mock only
}
export interface MockAuthToken {
  id: string;
  userId: string;
  type: 'confirm_email' | 'reset_password';
  token: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}
export interface MockSaved {
  userId: string;
  providerId: string;
  createdAt: string;
}
export interface MockAudit {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  at: string;
}

export interface MockDb {
  version: typeof MOCK_DB_VERSION;
  seededAt: string;
  categories: FxCategory[];
  districts: FxDistrict[];
  towns: FxTown[];
  users: Record<string, MockUser>;
  providers: Record<string, FxProvider>;
  services: Record<string, FxService>;
  areas: FxArea[];
  requests: Record<string, RequestRecord>; // keyed by id; status events embedded (D-d)
  reviews: Record<string, FxReview>;
  submissions: Record<string, FxSubmission>;
  documents: Record<string, FxDocument>;
  saved: MockSaved[];
  audit: MockAudit[];
  refSeq: number; // next FX number
  authTokens: MockAuthToken[]; // filled from M04
  lastEmailLink: string | null; // DevPanel "Last email link": a same-site path like /auth/confirm?token=…
}
