import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { ForgotPasswordBody } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { AuthCardHeader } from '../components/auth-card-header';
import { useForgotPassword } from '../hooks';

export function ForgotPasswordPage() {
  const location = useLocation();
  const form = useForm({
    resolver: zodResolver(ForgotPasswordBody),
    defaultValues: { email: (location.state as { email?: string } | null)?.email ?? '' },
  });
  const forgot = useForgotPassword();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);
    try {
      await forgot.mutateAsync(values);
      setSentTo(values.email);
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError));
    }
  });

  if (sentTo !== null)
    return (
      <>
        <AuthCardHeader icon={Mail} title="Check your email" />
        <p className="text-body-sm text-text-muted">
          If an account exists for <span className="text-text font-semibold">{sentTo}</span>, you'll get a
          reset link in a few minutes. It works for 1 hour.
        </p>
        <Button asChild variant="secondary" size="lg" className="w-full">
          <Link to="/login">Back to log in</Link>
        </Button>
      </>
    );

  return (
    <>
      <AuthCardHeader
        title="Reset your password"
        subtitle="Enter your account email and we'll send you a reset link."
      />
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <FormField label="Email" required error={errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...form.register('email')} />}
        </FormField>
        <SubmitButton size="lg" className="w-full" pending={forgot.isPending} pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      </form>
    </>
  );
}
