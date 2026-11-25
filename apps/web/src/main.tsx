import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import '@/styles/globals.css';
import { AppProviders } from '@/app/providers';
import { router } from '@/app/router';
import { bootstrapAuth } from '@/lib/bootstrap-auth';
import { enableMocks } from '@/mocks/enable';

async function boot(rootEl: HTMLElement): Promise<void> {
  await enableMocks();
  await bootstrapAuth();
  createRoot(rootEl).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root is missing from index.html');
boot(rootEl).catch((e: unknown) => {
  console.error(e);
  rootEl.textContent = e instanceof Error ? e.message : String(e);
});
