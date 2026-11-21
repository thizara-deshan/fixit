import { ENDPOINTS as E, type AuthSession, type LoginBody, type Me } from '@fixit/contracts';
import { authStore } from '@/lib/auth-store';
import { http, pathOf } from '@/lib/http';

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
