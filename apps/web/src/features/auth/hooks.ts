import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { LoginBody, SignupForm, SignupIntent } from '@fixit/contracts';
import { authStore, useAuth } from '@/lib/auth-store';
import { FORM_COPY } from '@/lib/error-copy';
import { ApiError } from '@/lib/http';
import { safeNext } from '@/lib/next';
import { qk } from '@/lib/query-keys';
import { notify, notifyError } from '@/lib/toast';
import {
  adminLogin,
  confirmEmail,
  fetchMe,
  forgotPassword,
  login,
  logout,
  register,
  resendConfirmation,
  resetPassword,
  signIn,
} from './api';

/** GET /auth/me while signed in; keeps authStore.me fresh. */
export function useMe() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      const me = await fetchMe();
      authStore.setMe(me);
      return me;
    },
    enabled: status === 'signed-in',
  });
}

/** A4: POST /auth/logout → clear cache → `/` (admins → `/admin/login`). D-c: guards render nothing while reason = 'logout'; RootLayout clears it once the new location has rendered. */
export function useLogout(): () => Promise<void> {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return useCallback(async () => {
    const wasAdmin = authStore.getState().me?.roles.includes('admin') ?? false;
    await logout();
    qc.clear();
    await navigate(wasAdmin ? '/admin/login' : '/', { replace: true });
  }, [navigate, qc]);
}

const AFTER_KEY = 'fixit.signup.after';
interface AfterSignup {
  next: string | null;
  intent: SignupIntent | null;
}

/** D-3: remembered at sign-up, used by S8 Continue. */
export function rememberAfterSignup(v: AfterSignup): void {
  sessionStorage.setItem(AFTER_KEY, JSON.stringify(v));
}
/** S8 Continue: provider intent → onboarding; else stored next; else home. Clears the entry. */
export function takeAfterSignupTarget(): string {
  const raw = sessionStorage.getItem(AFTER_KEY);
  sessionStorage.removeItem(AFTER_KEY);
  try {
    const v = raw ? (JSON.parse(raw) as Partial<AfterSignup>) : {};
    if (v.intent === 'provider') return '/become-a-provider/1';
    return safeNext(v.next ?? null) ?? '/';
  } catch {
    return '/';
  }
}

/** S5: login and store the session; RequireGuest then redirects (D-2). */
export function useLogin() {
  return useMutation({ mutationFn: (body: LoginBody) => signIn(body) });
}

/** S29: admin login; RequireGuest area="admin" then redirects to /admin. */
export function useAdminLogin() {
  return useMutation({
    mutationFn: async (body: LoginBody) => {
      const s = await adminLogin(body);
      authStore.setSession(s);
      return s;
    },
  });
}

/** S6 (D-1): register, then log in with the same credentials. The caller navigates to S7 before setSession. */
export function useSignup() {
  return useMutation({
    mutationFn: async (v: { form: SignupForm; intent: SignupIntent | null }) => {
      await register({ ...v.form, ...(v.intent ? { intent: v.intent } : {}) });
      return login({ email: v.form.email, password: v.form.password });
    },
  });
}

/** A5: toast on success; 429 → rate-limit copy; else D-9. */
export function useResendConfirmation() {
  return useMutation({
    mutationFn: resendConfirmation,
    onSuccess: () => {
      notify('Email sent again.');
    },
    onError: (e) => {
      notifyError(
        e instanceof ApiError && e.code === 'RATE_LIMITED' ? FORM_COPY.rateLimited : FORM_COPY.resendFailed,
      );
    },
  });
}

/** S8: confirm once per token (a query, so StrictMode's double effect doesn't confirm twice), then refresh `me` if signed in. */
export function useConfirmEmail(token: string | null) {
  return useQuery({
    queryKey: qk.confirmEmail(token ?? ''),
    enabled: token !== null && token !== '',
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async () => {
      const result = await confirmEmail({ token: token ?? '' });
      if (authStore.getState().status === 'signed-in') authStore.setMe(await fetchMe());
      return result;
    },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword });
}
