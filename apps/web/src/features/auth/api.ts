import {
  ENDPOINTS as E,
  type AuthSession,
  type ConfirmEmailBody,
  type ConfirmEmailResult,
  type ForgotPasswordBody,
  type LoginBody,
  type Me,
  type RegisterBody,
  type ResetPasswordBody,
} from '@fixit/contracts';
import { authStore } from '@/lib/auth-store';
import { apiUrl, http, pathOf } from '@/lib/http';

export const login = (body: LoginBody): Promise<AuthSession> =>
  http(pathOf(E.auth_login), { method: E.auth_login.method, body, schema: E.auth_login.response });

export const fetchMe = (): Promise<Me> => http(pathOf(E.auth_me), { schema: E.auth_me.response });

/** Login and store the session (used by the DevPanel now, S5 in M04). */
export async function signIn(body: LoginBody): Promise<AuthSession> {
  const session = await login(body);
  authStore.setSession(session);
  return session;
}

/** A4: revoke the refresh session first, then forget the local one even if the call fails. */
export async function logout(): Promise<void> {
  try {
    await http(pathOf(E.auth_logout), { method: E.auth_logout.method, schema: undefined });
  } finally {
    authStore.signOut('logout');
  }
}

export const register = (body: RegisterBody): Promise<void> =>
  http(pathOf(E.auth_register), { method: E.auth_register.method, body, schema: undefined });

export const adminLogin = (body: LoginBody): Promise<AuthSession> =>
  http(pathOf(E.auth_admin_login), {
    method: E.auth_admin_login.method,
    body,
    schema: E.auth_admin_login.response,
  });

export const confirmEmail = (body: ConfirmEmailBody): Promise<ConfirmEmailResult> =>
  http(pathOf(E.auth_confirm_email), {
    method: E.auth_confirm_email.method,
    body,
    schema: E.auth_confirm_email.response,
  });

export const resendConfirmation = (): Promise<void> =>
  http(pathOf(E.auth_resend_confirmation), { method: E.auth_resend_confirmation.method, schema: undefined });

export const forgotPassword = (body: ForgotPasswordBody): Promise<void> =>
  http(pathOf(E.auth_forgot_password), { method: E.auth_forgot_password.method, body, schema: undefined });

export const resetPassword = (body: ResetPasswordBody): Promise<void> =>
  http(pathOf(E.auth_reset_password), { method: E.auth_reset_password.method, body, schema: undefined });

/** MSW-only route (ARCH §6.1); only called when isMocked('auth'). */
export const googleMockSignIn = (): Promise<void> =>
  http('/auth/google/mock', { method: 'POST', schema: undefined });

/** Real Google start: a full-page navigation to the API (ARCH §3.1 GET /auth/google). */
export const googleStartUrl = (query: {
  next?: string | undefined;
  intent?: 'provider' | undefined;
}): string => apiUrl(pathOf(E.auth_google), query);
