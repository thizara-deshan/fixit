import { PlaceholderScreen } from '../placeholder-screen';

export { LoginPage } from '@/features/auth/pages/login-page';

export { SignupPage } from '@/features/auth/pages/signup-page';

export { CheckEmailPage } from '@/features/auth/pages/check-email-page';

export { ConfirmEmailPage } from '@/features/auth/pages/confirm-email-page';

export function GoogleDonePage() {
  return <PlaceholderScreen frame="card" title="Signing you in" />;
}

export { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page';

export { ResetPasswordPage } from '@/features/auth/pages/reset-password-page';

export { AdminLoginPage } from '@/features/auth/pages/admin-login-page';
