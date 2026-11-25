import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AccountDetailsForm, type Me } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { PhoneInput } from '@/components/phone-input';
import { StatusPill } from '@/components/status-pill';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { useResendConfirmation } from '@/features/auth/hooks';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { notify } from '@/lib/toast';
import { useFormDraft } from '@/lib/use-form-draft';
import { useUpdateMe } from '../hooks';

/** "+94771234567" → "77 123 4567" (what PhoneInput shows after its fixed +94). */
const nationalOf = (e164: string | null): string =>
  e164 ? `${e164.slice(3, 5)} ${e164.slice(5, 8)} ${e164.slice(8)}` : '';

export function DetailsCard({ me, onDirtyChange }: { me: Me; onDirtyChange: (dirty: boolean) => void }) {
  const update = useUpdateMe();
  const resend = useResendConfirmation();
  const [banner, setBanner] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(AccountDetailsForm),
    defaultValues: { fullName: me.fullName, mobile: nationalOf(me.mobile) },
  });
  useFormDraft('account.details', form);
  const { errors, isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const isProvider = me.roles.includes('provider');

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);
    try {
      const saved = await update.mutateAsync(values);
      form.reset({ fullName: saved.fullName, mobile: nationalOf(saved.mobile) });
      notify('Changes saved.');
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError, { mobile_missing: 'mobile' }));
    }
  });

  return (
    <section
      aria-labelledby="details-h"
      className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-5 sm:p-7"
    >
      <h2 id="details-h" className="text-title-sm text-text">
        Your details
      </h2>
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <FormField label="Full name" required error={errors.fullName?.message}>
          {(p) => <Input {...p} autoComplete="name" {...form.register('fullName')} />}
        </FormField>
        <FormField
          label="Mobile number"
          required={isProvider}
          optional={!isProvider}
          error={errors.mobile?.message}
        >
          {(p) => <PhoneInput {...p} {...form.register('mobile')} />}
        </FormField>
        <div className="flex flex-col gap-1.5">
          <span className="text-label text-text font-semibold">Email</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-body text-text break-all">{me.email}</span>
            <StatusPill kind="email" confirmed={me.emailConfirmed} />
            {!me.emailConfirmed && (
              <button
                type="button"
                className="text-label text-primary inline-flex min-h-11 items-center font-semibold underline-offset-2 hover:underline sm:min-h-0"
                onClick={() => {
                  if (!resend.isPending) resend.mutate();
                }}
              >
                Resend email
              </button>
            )}
          </div>
          <p className="text-meta text-text-muted">Your email is never shown to providers.</p>
        </div>
        <SubmitButton className="w-full self-end sm:w-auto" pending={update.isPending} pendingLabel="Saving…">
          Save
        </SubmitButton>
      </form>
    </section>
  );
}
