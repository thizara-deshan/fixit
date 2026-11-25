import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChangePasswordForm, type Me } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { PasswordInput } from '@/components/password-input';
import { SubmitButton } from '@/components/submit-button';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { notify } from '@/lib/toast';
import { useChangePassword } from '../hooks';

const cardClass = 'border-border bg-surface flex flex-col gap-5 rounded-2xl border p-5 sm:p-7';

export function PasswordCard({ me, onDirtyChange }: { me: Me; onDirtyChange: (dirty: boolean) => void }) {
  if (!me.authMethods.includes('password'))
    return (
      <section aria-labelledby="password-h" className={cardClass}>
        <h2 id="password-h" className="text-title-sm text-text">
          Password
        </h2>
        <p className="text-body-sm text-text-muted">You sign in with Google.</p>
      </section>
    );
  return <PasswordForm onDirtyChange={onDirtyChange} />;
}

function PasswordForm({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const change = useChangePassword();
  const [banner, setBanner] = useState<string | null>(null);
  // No useFormDraft: passwords are never kept (SPEC §6.6).
  const form = useForm({
    resolver: zodResolver(ChangePasswordForm),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const { errors, isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);
    try {
      await change.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      form.reset();
      notify('Password updated.');
    } catch (e) {
      setBanner(
        mapApiErrorToForm(e, form.setError, {
          current_password_wrong: 'currentPassword',
          password_reused: 'newPassword',
        }),
      );
    }
  });

  return (
    <section aria-labelledby="password-h" className={cardClass}>
      <h2 id="password-h" className="text-title-sm text-text">
        Password
      </h2>
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <FormField label="Current password" required error={errors.currentPassword?.message}>
          {(p) => (
            <PasswordInput {...p} autoComplete="current-password" {...form.register('currentPassword')} />
          )}
        </FormField>
        <FormField
          label="New password"
          required
          error={errors.newPassword?.message}
          help={errors.newPassword ? undefined : 'At least 8 characters, with a letter and a number.'}
        >
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...form.register('newPassword')} />}
        </FormField>
        <FormField label="Confirm new password" required error={errors.confirmPassword?.message}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...form.register('confirmPassword')} />}
        </FormField>
        <SubmitButton className="w-full self-end sm:w-auto" pending={change.isPending} pendingLabel="Saving…">
          Update password
        </SubmitButton>
      </form>
    </section>
  );
}
