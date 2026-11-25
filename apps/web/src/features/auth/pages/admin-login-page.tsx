import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
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
import { useAdminLogin } from '../hooks';

const linkClass =
  'text-label text-primary hover:text-primary-hover font-semibold underline-offset-2 hover:underline';

export function AdminLoginPage() {
  const { signOutReason } = useAuth();
  const adminLogin = useAdminLogin();
  const [banner, setBanner] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(LoginBody), defaultValues: { email: '', password: '' } });
  const { errors } = form.formState;
  const info = signOutReason === 'expired' ? FORM_COPY.sessionExpired : null;

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);
    try {
      await adminLogin.mutateAsync(values); // RequireGuest area="admin" redirects (D-2)
    } catch (e) {
      const msg = mapApiErrorToForm(e, form.setError);
      setBanner(
        msg === FORM_COPY.invalidCredentials || msg === FORM_COPY.suspended
          ? FORM_COPY.adminInvalidCredentials
          : msg,
      );
    }
  });

  return (
    <>
      <AuthCardHeader title="Fixit admin" subtitle="Sign in with your admin account." />
      {info && !banner && <FormErrorBanner variant="info">{info}</FormErrorBanner>}
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <FormField label="Email" required error={errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...form.register('email')} />}
        </FormField>
        <FormField
          label="Password"
          required
          error={errors.password?.message}
          labelAside={
            <Link to="/forgot-password" className={linkClass}>
              Forgot password?
            </Link>
          }
        >
          {(p) => <PasswordInput {...p} autoComplete="current-password" {...form.register('password')} />}
        </FormField>
        <SubmitButton size="lg" className="w-full" pending={adminLogin.isPending} pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
    </>
  );
}
