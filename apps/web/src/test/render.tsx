import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/routes';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

export function createWrapper(client: QueryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  return { queryClient, ...render(ui, { wrapper: createWrapper(queryClient) }) };
}

/** Renders the real route table at `path` (guards, layouts, lazy pages). ARCH §9.4. */
export function renderRoute(path: string) {
  // jsdom's AbortSignal is rejected by Node's Request (React Router builds one per navigation). Undone in setup.ts afterEach.
  const NodeRequest = globalThis.Request;
  vi.stubGlobal(
    'Request',
    class extends NodeRequest {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(input, init?.signal ? { ...init, signal: null } : init);
      }
    },
  );
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = createTestQueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  const location = () => `${router.state.location.pathname}${router.state.location.search}`;
  return { router, queryClient, location, ...utils };
}
