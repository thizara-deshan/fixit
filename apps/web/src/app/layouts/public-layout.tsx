import type { ReactNode } from 'react';
import { Outlet } from 'react-router';
import { BannerSlot } from './parts/banner-slot';
import { Footer } from './parts/footer';
import { OfflineBanner } from './parts/offline-banner';
import { PublicNav } from './parts/public-nav';
import { SkipLink } from './parts/skip-link';

/** L1 (and the L1 frame of L2). `children` is used by guards that render S40 outside the route tree (D-a). */
export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <PublicNav />
      <OfflineBanner />
      <BannerSlot banners={[]} placement="strip" />
      <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  );
}
