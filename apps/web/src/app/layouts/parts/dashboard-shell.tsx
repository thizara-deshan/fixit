import { useState, type ReactNode } from 'react';
import { Menu, X, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { SidebarItem } from '../nav-config';
import { BannerSlot } from './banner-slot';
import { Logo } from './logo';
import { OfflineBanner } from './offline-banner';
import { SidebarNav } from './sidebar-nav';
import { SkipLink } from './skip-link';
import { useAccountBanners } from './use-account-banners';

export interface TopBarAction {
  to: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface DashboardShellProps {
  navLabel: 'Dashboard' | 'Admin';
  badge: ReactNode;
  items: SidebarItem[];
  /** Business/admin card, Switch to booking, Log out. Receives a close callback for the drawer. */
  footer: (close: () => void) => ReactNode;
  topBarAction: TopBarAction;
  children: ReactNode;
}

/** ARCH §5.2 ResponsiveSidebar: sidebar ≥1024, top bar + left drawer below (CSS-switched; the drawer mounts only when open). */
export function DashboardShell({
  navLabel,
  badge,
  items,
  footer,
  topBarAction,
  children,
}: DashboardShellProps) {
  const [open, setOpen] = useState(false);
  const banners = useAccountBanners('dashboard'); // [] for admins
  const close = () => {
    setOpen(false);
  };
  const ActionIcon = topBarAction.icon;
  const brand = (
    <div className="flex items-center gap-2">
      <Logo />
      {badge}
    </div>
  );
  return (
    <div className="bg-page min-h-dvh lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <SkipLink />
      <aside className="border-border bg-surface sticky top-0 hidden h-dvh flex-col gap-7 overflow-y-auto border-r px-4 py-6 lg:flex">
        {brand}
        <SidebarNav label={navLabel} items={items} />
        <div className="mt-auto flex flex-col gap-3">{footer(() => undefined)}</div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="h-topbar border-border bg-surface sticky top-0 z-10 flex items-center gap-1 border-b px-2 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="text-text">
                <Menu aria-hidden="true" className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              showCloseButton={false}
              aria-describedby={undefined}
              className="w-[85vw] max-w-80 gap-0 overflow-y-auto p-0 sm:max-w-80"
            >
              <div className="h-topbar border-border flex items-center justify-between border-b pl-4 pr-2">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                {brand}
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Close menu">
                    <X aria-hidden="true" className="size-6" />
                  </Button>
                </SheetClose>
              </div>
              <div className="flex flex-1 flex-col gap-7 px-4 py-6">
                <SidebarNav label={navLabel} items={items} dense={false} onNavigate={close} />
                <div className="mt-auto flex flex-col gap-3">{footer(close)}</div>
              </div>
            </SheetContent>
          </Sheet>
          {brand}
          <div className="flex-1" />
          <Link
            to={topBarAction.to}
            aria-label={
              topBarAction.count
                ? `${topBarAction.label}, ${String(topBarAction.count)} new`
                : topBarAction.label
            }
            className="text-text-muted hover:bg-page relative grid size-11 place-items-center rounded-md"
          >
            <ActionIcon aria-hidden="true" className="size-6" />
            {topBarAction.count !== undefined && topBarAction.count > 0 && (
              <span
                aria-hidden="true"
                className="bg-cta text-mono text-on-cta absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 font-extrabold"
              >
                {topBarAction.count}
              </span>
            )}
          </Link>
        </header>
        <OfflineBanner />
        <main
          id="main"
          tabIndex={-1}
          className="max-w-content mx-auto flex w-full min-w-0 flex-col gap-5 px-4 pb-14 pt-5 sm:px-6 sm:pb-16 sm:pt-6 lg:gap-7 lg:px-10 lg:pt-8"
        >
          <BannerSlot banners={banners} placement="main" />
          {children}
        </main>
      </div>
    </div>
  );
}
