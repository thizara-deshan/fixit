import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { EMAIL_TAKEN, SignupForm } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { PasswordInput } from '@/components/password-input';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { safeNext } from '@/lib/next';
import { AuthCardHeader } from '../components/auth-card-header';
import { GoogleButton } from '../components/google-button';
import { OrDivider } from '../components/or-divider';
import { rememberAfterSignup, useSignup } from '../hooks';

const linkClass =
  'text-label text-primary hover:text-primary-hover font-semibold underline-offset-2 hover:underline';

export function SignupPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const next = params.get('next');
  const intent = params.get('intent') === 'provider' ? 'provider' : null;
  const signup = useSignup();
  const [banner, setBanner] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(SignupForm),
    defaultValues: { fullName: '', email: '', password: '' },
  });
  const { errors } = form.formState;
  const keepNext = next ? `?${new URLSearchParams({ next }).toString()}` : '';

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);
    try {
      const session = await signup.mutateAsync({ form: values, intent });
      rememberAfterSignup({ next: safeNext(next), intent });
      // Option 1: S7 (not guest-guarded) sets the session on mount, so /signup never sees a signed-in user.
      await navigate('/signup/check-email', { state: { email: session.user.email, session } });
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError, { email_taken: 'email' }));
    }
  });

  return (
    <>
      {intent === 'provider' ? (
        <AuthCardHeader
          title="Join Fixit as a provider"
          subtitle="Create an account first — next you'll set up your listing."
        />
      ) : (
        <AuthCardHeader title="Create your Fixit account" subtitle="Book trusted local pros in minutes." />
      )}
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <GoogleButton next={next} intent={intent} />
      <OrDivider />
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-5">
        <FormField label="Full name" required error={errors.fullName?.message}>
          {(p) => <Input {...p} autoComplete="name" {...form.register('fullName')} />}
        </FormField>
        <div className="flex flex-col gap-2">
          <FormField label="Email" required error={errors.email?.message}>
            {(p) => <Input {...p} type="email" autoComplete="email" {...form.register('email')} />}
          </FormField>
          {errors.email?.message === EMAIL_TAKEN && (
            <Link to={`/login${keepNext}`} className={`${linkClass} self-start`}>
              Log in instead
            </Link>
          )}
        </div>
        <FormField
          label="Password"
          required
          error={errors.password?.message}
          help={errors.password ? undefined : 'At least 8 characters, with a letter and a number.'}
        >
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...form.register('password')} />}
        </FormField>
        <p className="text-meta text-text-muted">
          By signing up you agree to our{' '}
          <Link to="/privacy" target="_blank" rel="noopener" className="text-primary font-semibold underline">
            Privacy policy
          </Link>
          .
        </p>
        <SubmitButton
          size="lg"
          className="w-full"
          pending={signup.isPending}
          pendingLabel="Creating account…"
        >
          Create account
        </SubmitButton>
      </form>
      <p className="text-label text-text-muted text-center">
        Already have an account?{' '}
        <Link to={`/login${keepNext}`} state={location.state as unknown} className={linkClass}>
          Log in
        </Link>
      </p>
    </>
  );
}
