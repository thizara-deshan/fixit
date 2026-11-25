import { Outlet } from 'react-router';
import { Footer } from './parts/footer';
import { OfflineBanner } from './parts/offline-banner';
import { PublicNav } from './parts/public-nav';
import { SkipLink } from './parts/skip-link';

/** L1-auth; `logoOnly` for S29 (nav links and footer columns hidden). */
export function AuthLayout({ logoOnly = false }: { logoOnly?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <PublicNav variant={logoOnly ? 'logo' : 'full'} />
      <OfflineBanner />
      <main id="main" tabIndex={-1} className="bg-page pb-22 flex-1 px-4 pt-14">
        <div className="max-w-auth border-border bg-surface mx-auto flex w-full flex-col gap-4 rounded-2xl border p-6 sm:p-8">
          <Outlet />
        </div>
      </main>
      <Footer variant={logoOnly ? 'minimal' : 'full'} />
    </div>
  );
}
