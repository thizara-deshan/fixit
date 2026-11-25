import { useEffect } from 'react';
import type { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form';
import { authStore } from './auth-store';

const PREFIX = 'fixit.draft.';

/**
 * SPEC §6.6: when the session expires (signOut('expired')), keep this form's values (minus `exclude`) in
 * sessionStorage; on the next mount, restore them once (marked dirty) and forget the draft.
 */
export function useFormDraft<T extends FieldValues, O extends FieldValues = T>(
  key: string,
  form: UseFormReturn<T, unknown, O>,
  exclude: readonly Path<T>[] = [],
): void {
  const excludeKey = exclude.join(',');
  useEffect(() => {
    const storageKey = PREFIX + key;
    const raw = sessionStorage.getItem(storageKey);
    if (raw) {
      sessionStorage.removeItem(storageKey);
      try {
        const draft = JSON.parse(raw) as Record<string, unknown>;
        for (const [name, value] of Object.entries(draft))
          form.setValue(name as Path<T>, value as PathValue<T, Path<T>>, { shouldDirty: true });
      } catch {
        // a corrupt draft is dropped
      }
    }
    const skip = new Set(excludeKey.split(',').filter(Boolean));
    return authStore.subscribe(() => {
      const s = authStore.getState();
      if (s.status !== 'guest' || s.signOutReason !== 'expired') return;
      const values = Object.fromEntries(Object.entries(form.getValues()).filter(([name]) => !skip.has(name)));
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    });
  }, [key, form, excludeKey]);
}
