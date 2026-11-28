import {
  CURRENT_PASSWORD_WRONG,
  EMAIL_TAKEN,
  OTHER_TOWNS_MAX_MESSAGE,
  PASSWORD_REUSED,
  PROVIDER_MOBILE_REQUIRED,
  SERVICE_NAME_TAKEN,
  SERVICES_LAST_MESSAGE,
  SERVICES_MAX_MESSAGE,
  type RuleCode,
} from '@fixit/contracts';
import { CONTACT_EMAIL } from './env';
import { ApiError } from './http';

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
  service_name_taken: SERVICE_NAME_TAKEN,
};

/** Rules shown as the form banner. Later milestones add theirs here. */
export const RULE_BANNER_COPY: Partial<Record<RuleCode, string>> = {
  invalid_credentials: FORM_COPY.invalidCredentials,
  services_min: SERVICES_LAST_MESSAGE,
  services_max: SERVICES_MAX_MESSAGE,
  towns_max: OTHER_TOWNS_MAX_MESSAGE,
};

/** S12.E6. Returns the banner for a create-request rule, or null (caller falls back to mapApiErrorToForm → §6.3). */
export function requestRuleBanner(err: unknown, business: string): string | null {
  if (!(err instanceof ApiError)) return null;
  switch (err.rule) {
    case 'provider_paused':
    case 'provider_unavailable':
      return `${business} can't take requests right now. Your request wasn't sent.`;
    case 'open_with_provider':
      return `You already have an open request with ${business}. You can send another once this one is finished.`;
    case 'open_limit_reached':
      return 'You have 5 open requests. You can have up to 5 open requests at a time. Cancel one or wait for one to finish.';
    case 'date_out_of_window':
      return 'That date is no longer available. Choose another date.';
    default:
      return null;
  }
}
