import { lazy, Suspense, useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { authStore } from '@/lib/auth-store';

// Dev only: the branch is removed from production builds, so the DevPanel chunk never ships.
const DevPanel = import.meta.env.DEV
  ? lazy(() => import('@/mocks/dev/DevPanel').then((m) => ({ default: m.DevPanel })))
  : null;

/** Inside the router so the DevPanel can use router hooks (useLogout). */
export function RootLayout() {
  const { key } = useLocation();
  // D-c: runs after the new location has rendered, so the old route's guard never sees a plain guest and redirects to /login.
  useEffect(() => {
    authStore.clearSignOutReason();
  }, [key]);
  return (
    <>
      <Outlet />
      <ScrollRestoration />
      {DevPanel && (
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      )}
    </>
  );
}
