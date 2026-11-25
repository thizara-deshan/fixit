import { PlaceholderScreen } from '../placeholder-screen';

export { LoginPage } from '@/features/auth/pages/login-page';

export { SignupPage } from '@/features/auth/pages/signup-page';

export { CheckEmailPage } from '@/features/auth/pages/check-email-page';

export function ConfirmEmailPage() {
  return <PlaceholderScreen frame="card" title="Confirm email" />;
}

export function GoogleDonePage() {
  return <PlaceholderScreen frame="card" title="Signing you in" />;
}

export function ForgotPasswordPage() {
  return <PlaceholderScreen frame="card" title="Forgot password" />;
}

export function ResetPasswordPage() {
  return <PlaceholderScreen frame="card" title="Reset password" />;
}

export function AdminLoginPage() {
  return <PlaceholderScreen frame="card" title="Admin sign-in" />;
}
