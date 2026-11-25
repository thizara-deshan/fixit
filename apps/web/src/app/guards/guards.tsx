import type { ReactNode } from 'react';
import type { Me } from '@fixit/contracts';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/lib/auth-store';
import { postLoginTarget } from '@/lib/next';
import { ForbiddenPage } from '../errors/forbidden-page';
import { PublicLayout } from '../layouts/public-layout';

/** `/login?next=%2Frequests` — same-site path + query only. */
export function loginUrl(base: '/login' | '/admin/login', pathname: string, search: string): string {
  return `${base}?${new URLSearchParams({ next: pathname + search }).toString()}`;
}

const isAdmin = (me: Me | null) => me?.roles.includes('admin') ?? false;
const isProvider = (me: Me | null) => me?.roles.includes('provider') ?? false;

/** Signed-in → `/` (providers → `/dashboard`; `area="admin"`: admins → `/admin`). */
export function RequireGuest({
  area = 'public',
  children,
}: {
  area?: 'public' | 'admin';
  children?: ReactNode;
}) {
  const { status, me } = useAuth();
  const { search } = useLocation();
  if (status === 'booting') return null;
  if (status === 'signed-in') {
    const to = postLoginTarget(me, search, area);
    return <Navigate to={to} replace />;
  }
  return children ?? <Outlet />;
}

/** Guest → `/login?next=…`. While a logout is navigating away (D-c) render nothing. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { status, signOutReason } = useAuth();
  const { pathname, search } = useLocation();
  if (status === 'booting') return null;
  if (status === 'guest') {
    if (signOutReason === 'logout') return null;
    return <Navigate to={loginUrl('/login', pathname, search)} replace />;
  }
  return children ?? <Outlet />;
}

/** `role="user"` = customer or provider (ARCH endpoint access 'user'). Wrong role → S40 (`forbidden` overrides where it renders). */
export function RequireRole({
  forbidden,
  children,
}: {
  role: 'user';
  forbidden?: ReactNode;
  children?: ReactNode;
}) {
  const { me } = useAuth();
  const ok = me?.roles.includes('customer') ?? false; // the only role today is 'user'
  if (!ok) return forbidden ?? <ForbiddenPage />;
  return children ?? <Outlet />;
}

/** No published listing → `/become-a-provider/{step}` (1 if never started). */
export function RequireProvider({ children }: { children?: ReactNode }) {
  const { me } = useAuth();
  if (!isProvider(me))
    return <Navigate to={`/become-a-provider/${String(me?.provider?.onboarding.step ?? 1)}`} replace />;
  return children ?? <Outlet />;
}

/** Onboarding routes: a published provider goes to `/dashboard`. */
export function RedirectPublishedProvider({ children }: { children?: ReactNode }) {
  const { me } = useAuth();
  if (isProvider(me)) return <Navigate to="/dashboard" replace />;
  return children ?? <Outlet />;
}

/** Guest → `/admin/login?next=…`; non-admin → S40 inside L1 (D-a). */
export function RequireAdmin({ children }: { children?: ReactNode }) {
  const { status, me, signOutReason } = useAuth();
  const { pathname, search } = useLocation();
  if (status === 'booting') return null;
  if (status === 'guest') {
    if (signOutReason === 'logout') return null;
    return <Navigate to={loginUrl('/admin/login', pathname, search)} replace />;
  }
  if (!isAdmin(me)) {
    return (
      <PublicLayout>
        <ForbiddenPage />
      </PublicLayout>
    );
  }
  return children ?? <Outlet />;
}
