import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { vi } from 'vitest';
import { createTestQueryClient } from '@/test/render';
import { AdminOverviewPage } from './pages/overview-page';
import { UserDetailPage } from './pages/user-detail-page';
import { UsersPage } from './pages/users-page';
import { VerificationReviewPage } from './pages/verification-review-page';
import { VerificationQueuePage } from './pages/verification-queue-page';

/** Test-only: the admin pages on a local router (no guards or layout), so page tests don't depend on app wiring (M13-T40). */
const ADMIN_TEST_ROUTES: RouteObject[] = [
  { path: '/admin', element: <AdminOverviewPage /> },
  { path: '/admin/verifications', element: <VerificationQueuePage /> },
  { path: '/admin/users', element: <UsersPage /> },
  { path: '/admin/users/:id', element: <UserDetailPage /> },
  { path: '/admin/verifications/:id', element: <VerificationReviewPage /> },
];

export function renderAdminRoute(path: string) {
  // Same jsdom AbortSignal workaround as renderRoute (undone in setup.ts afterEach).
  const NodeRequest = globalThis.Request;
  vi.stubGlobal(
    'Request',
    class extends NodeRequest {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(input, init?.signal ? { ...init, signal: null } : init);
      }
    },
  );
  const router = createMemoryRouter(ADMIN_TEST_ROUTES, { initialEntries: [path] });
  const queryClient = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  const location = () => `${router.state.location.pathname}${router.state.location.search}`;
  return { router, queryClient, location, ...utils };
}
