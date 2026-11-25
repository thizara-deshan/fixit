import {
  CURRENT_PASSWORD_WRONG,
  EMAIL_TAKEN,
  PASSWORD_REUSED,
  PROVIDER_MOBILE_REQUIRED,
  type RuleCode,
} from '@fixit/contracts';
import { CONTACT_EMAIL } from './env';

/** Form-level banner copy (SPEC S5.E8, S29.E4, §6.3, §6.6). Written once. */
export const FORM_COPY = {
  saveFailed: "We couldn't save your changes. Check your connection and try again.",
  invalidCredentials: "That email and password don't match. Try again or reset your password.",
  adminInvalidCredentials: "That email and password don't match.",
  suspended: `Your account is suspended. If you think this is a mistake, email us at ${CONTACT_EMAIL}.`,
  rateLimited: 'Too many attempts. Wait a few minutes and try again.',
  googleCancelled: 'Google sign-in was cancelled. Try again or use your email.',
  sessionExpired: 'Your session expired. Log in again to continue.',
  resendFailed: "Couldn't send the email. Try again.", // D-9
} as const;

/** Rules that belong to one field (D-4). */
export const RULE_FIELD_COPY: Partial<Record<RuleCode, string>> = {
  email_taken: EMAIL_TAKEN,
  current_password_wrong: CURRENT_PASSWORD_WRONG,
  password_reused: PASSWORD_REUSED,
  mobile_missing: PROVIDER_MOBILE_REQUIRED,
};

/** Rules shown as the form banner. Later milestones add theirs here. */
export const RULE_BANNER_COPY: Partial<Record<RuleCode, string>> = {
  invalid_credentials: FORM_COPY.invalidCredentials,
};
