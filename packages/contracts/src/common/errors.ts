import { z } from 'zod';

export const ErrorCode = z.enum([
  'VALIDATION_FAILED', // 400, fieldErrors set
  'UNAUTHENTICATED', // 401 (missing/expired token)
  'ACCOUNT_SUSPENDED', // 401 at login/refresh/any request
  'FORBIDDEN', // 403 wrong role
  'NOT_FOUND', // 404 (also: exists but not yours)
  'INVALID_TRANSITION', // 409, details.reason = TransitionReason, details.status = current status
  'RULE_VIOLATION', // 422, details.rule = RuleCode
  'CONFLICT', // 409 unique clash (e.g. email taken → details.rule)
  'RATE_LIMITED', // 429
  'PAYLOAD_TOO_LARGE', // 413
  'UNSUPPORTED_MEDIA', // 415
  'INTERNAL', // 500
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

/** Business-rule failures the UI maps to SPEC copy (S5.E8, S12 blocked states / E6, S16, S23, S38 …). */
export const RuleCode = z.enum([
  'invalid_credentials',
  'email_taken',
  'email_unconfirmed',
  'token_invalid',
  'current_password_wrong',
  'password_reused',
  'own_listing',
  'provider_unavailable',
  'provider_paused',
  'mobile_missing',
  'open_with_provider',
  'open_limit_reached',
  'date_out_of_window',
  'town_not_served',
  'service_not_offered',
  'review_not_eligible',
  'review_window_closed',
  'already_reviewed',
  'services_min',
  'services_max',
  'service_name_taken',
  'towns_max',
  'onboarding_incomplete',
  'documents_missing',
  'verification_not_editable',
  'category_in_use',
  'name_taken',
  'cannot_suspend_admin',
  'already_in_state',
]);
export type RuleCode = z.infer<typeof RuleCode>;

export const ErrorEnvelope = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(), // developer-facing; UI copy comes from SPEC
    requestId: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(), // VALIDATION_FAILED: path → SPEC messages
    details: z
      .object({
        rule: RuleCode.optional(),
        reason: z.string().optional(), // TransitionReason
        status: z.string().optional(),
        ref: z.string().optional(), // open_with_provider → existing ref
      })
      .optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelope>;
