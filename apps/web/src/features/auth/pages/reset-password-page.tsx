import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TriangleAlert } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ResetPasswordForm } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { PasswordInput } from '@/components/password-input';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { AuthCardHeader } from '../components/auth-card-header';
import { useResetPassword } from '../hooks';

export function ResetPasswordPage() {
  const token = useSearchParams()[0].get('token');
  const reset = useResetPassword();
  const navigate = useNavigate();
  const [expired, setExpired] = useState(!token);
  const [banner, setBanner] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(ResetPasswordForm),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);
    try {
      await reset.mutateAsync({ token: token ?? '', password: values.password });
      notify('Password updated. Log in with your new password.');
      await navigate('/login', { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.rule === 'token_invalid') setExpired(true);
      else setBanner(mapApiErrorToForm(e, form.setError));
    }
  });

  if (expired)
    return (
      <>
        <AuthCardHeader
          icon={TriangleAlert}
          tone="warning"
          title="This reset link has expired"
          subtitle="Reset links work for 1 hour. Request a new one."
        />
        <Button asChild size="lg" className="w-full">
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </>
    );

  return (
    <>
      <AuthCardHeader title="Choose a new password" />
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <FormField
          label="New password"
          required
          error={errors.password?.message}
          help={errors.password ? undefined : 'At least 8 characters, with a letter and a number.'}
        >
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...form.register('password')} />}
        </FormField>
        <FormField label="Confirm new password" required error={errors.confirmPassword?.message}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...form.register('confirmPassword')} />}
        </FormField>
        <SubmitButton size="lg" className="w-full" pending={reset.isPending} pendingLabel="Saving…">
          Save new password
        </SubmitButton>
      </form>
    </>
  );
}
