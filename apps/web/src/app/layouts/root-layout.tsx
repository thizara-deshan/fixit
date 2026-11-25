import { lazy, Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';

// Dev only: the branch is removed from production builds, so the DevPanel chunk never ships.
const DevPanel = import.meta.env.DEV
  ? lazy(() => import('@/mocks/dev/DevPanel').then((m) => ({ default: m.DevPanel })))
  : null;

/** Inside the router so the DevPanel can use router hooks (useLogout). */
export function RootLayout() {
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
