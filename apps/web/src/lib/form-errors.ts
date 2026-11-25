import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { RuleCode } from '@fixit/contracts';
import { FORM_COPY, RULE_BANNER_COPY, RULE_FIELD_COPY } from './error-copy';
import { ApiError } from './http';

export type RuleFields<T extends FieldValues> = Partial<Record<RuleCode, Path<T>>>;

/**
 * ARCH §4.1. Puts server errors on fields (focus on the first) and returns the banner copy,
 * or null when every error landed on a field. Server field paths equal the form field names (shared contracts).
 */
export function mapApiErrorToForm<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  ruleFields: RuleFields<T> = {},
): string | null {
  if (!(err instanceof ApiError)) return FORM_COPY.saveFailed;
  if (err.code === 'VALIDATION_FAILED' && err.fieldErrors) {
    const entries = Object.entries(err.fieldErrors).filter(([field]) => field !== '_form');
    entries.forEach(([field, messages], i) => {
      const message = messages[0];
      if (message) setError(field as Path<T>, { type: 'server', message }, { shouldFocus: i === 0 });
    });
    if (entries.length > 0) return null;
  }
  if (err.code === 'ACCOUNT_SUSPENDED') return FORM_COPY.suspended;
  if (err.code === 'RATE_LIMITED') return FORM_COPY.rateLimited;
  const rule = err.rule;
  if (rule) {
    const field = ruleFields[rule];
    const fieldCopy = RULE_FIELD_COPY[rule];
    if (field && fieldCopy) {
      setError(field, { type: 'server', message: fieldCopy }, { shouldFocus: true });
      return null;
    }
    const banner = RULE_BANNER_COPY[rule];
    if (banner) return banner;
  }
  return FORM_COPY.saveFailed;
}
