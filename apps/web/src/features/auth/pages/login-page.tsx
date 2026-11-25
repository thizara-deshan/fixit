import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useSearchParams } from 'react-router';
import { LoginBody } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { PasswordInput } from '@/components/password-input';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-store';
import { FORM_COPY } from '@/lib/error-copy';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { AuthCardHeader } from '../components/auth-card-header';
import { GoogleButton } from '../components/google-button';
import { OrDivider } from '../components/or-divider';
import { useLogin } from '../hooks';

const linkClass =
  'text-label text-primary hover:text-primary-hover font-semibold underline-offset-2 hover:underline';

export function LoginPage() {
  const [params] = useSearchParams();
  const { signOutReason } = useAuth();
  const location = useLocation();
  const next = params.get('next');
  const error = params.get('error');
  const login = useLogin();
  const [banner, setBanner] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(LoginBody), defaultValues: { email: '', password: '' } });
  const { errors } = form.formState;

  const info = signOutReason === 'expired' ? FORM_COPY.sessionExpired : null;
  const initialError =
    signOutReason === 'suspended' || error === 'suspended'
      ? FORM_COPY.suspended
      : error === 'google_cancelled'
        ? FORM_COPY.googleCancelled
        : null;
  const shown = banner ?? initialError;
  const keepNext = next ? `?${new URLSearchParams({ next }).toString()}` : '';

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);
    try {
      await login.mutateAsync(values); // RequireGuest redirects (D-2)
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError));
    }
  });

  return (
    <>
      <AuthCardHeader title="Log in to Fixit" subtitle="Welcome back." />
      {info && !shown && <FormErrorBanner variant="info">{info}</FormErrorBanner>}
      {shown && <FormErrorBanner>{shown}</FormErrorBanner>}
      <GoogleButton next={next} intent={null} />
      <OrDivider />
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <FormField label="Email" required error={errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...form.register('email')} />}
        </FormField>
        <FormField
          label="Password"
          required
          error={errors.password?.message}
          labelAside={
            <Link to="/forgot-password" state={{ email: form.getValues('email') }} className={linkClass}>
              Forgot password?
            </Link>
          }
        >
          {(p) => <PasswordInput {...p} autoComplete="current-password" {...form.register('password')} />}
        </FormField>
        <SubmitButton size="lg" className="w-full" pending={login.isPending} pendingLabel="Logging in…">
          Log in
        </SubmitButton>
      </form>
      <p className="text-label text-text-muted text-center">
        New to Fixit?{' '}
        <Link to={`/signup${keepNext}`} state={location.state as unknown} className={linkClass}>
          Sign up
        </Link>
      </p>
    </>
  );
}
