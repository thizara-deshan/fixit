import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';
import { PlaceholderPage } from '@/app/placeholder-page';
import { AppProviders } from '@/app/providers';
import { bootstrapAuth } from '@/lib/bootstrap-auth';
import { enableMocks } from '@/mocks/enable';

// Dev only: the branch is removed from production builds, so the DevPanel chunk never ships.
const DevPanel = import.meta.env.DEV
  ? lazy(() => import('@/mocks/dev/DevPanel').then((m) => ({ default: m.DevPanel })))
  : null;

async function boot(rootEl: HTMLElement): Promise<void> {
  await enableMocks();
  await bootstrapAuth();
  createRoot(rootEl).render(
    <StrictMode>
      <AppProviders>
        <PlaceholderPage />
        {DevPanel && (
          <Suspense fallback={null}>
            <DevPanel />
          </Suspense>
        )}
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
