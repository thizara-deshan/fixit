import { useState } from 'react';
import type { Me } from '@fixit/contracts';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLogout } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';
import { accountMenuItems, isPublicLinkActive, publicNavLinks, viewerRole } from '../nav-config';

const row =
  'flex min-h-14 items-center gap-3 rounded-md px-4 text-body font-semibold text-text hover:bg-page';

export function NavSheet({ me }: { me: Me | null }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const logout = useLogout();
  const role = viewerRole(me);
  const close = () => {
    setOpen(false);
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="text-text lg:hidden">
          <Menu aria-hidden="true" className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        className="w-full max-w-[360px] gap-0 p-0 sm:max-w-[360px]"
      >
        <div className="h-nav flex items-center justify-between pl-4 pr-2">
          <SheetTitle className="text-title-md text-text">Menu</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close menu">
              <X aria-hidden="true" className="size-6" />
            </Button>
          </SheetClose>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 overflow-y-auto px-2 pb-6">
          {publicNavLinks(role).map((l) => {
            const active = isPublicLinkActive(l.id, pathname);
            return (
              <Link
                key={l.id}
                to={l.to}
                onClick={close}
                aria-current={active ? 'page' : undefined}
                className={cn(row, active && 'bg-primary-soft text-primary hover:bg-primary-soft')}
              >
                {l.label}
              </Link>
            );
          })}
          {role === 'guest' && (
            <div className="mt-4 flex flex-col gap-3 px-2">
              <Button asChild variant="secondary" size="lg">
                <Link to="/login" onClick={close}>
                  Log in
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/signup" onClick={close}>
                  Sign up
                </Link>
              </Button>
            </div>
          )}
          {me && role !== 'admin' && (
            <div className="border-border mt-2 flex flex-col gap-1 border-t pt-2">
              {accountMenuItems(me).map(({ label, to, icon: Icon }) => (
                <Link key={to} to={to} onClick={close} className={row}>
                  <Icon aria-hidden="true" className="text-text-muted size-5" />
                  {label}
                </Link>
              ))}
            </div>
          )}
          {role === 'admin' && (
            <div className="border-border mt-2 flex flex-col gap-1 border-t pt-2">
              <Link to="/admin" onClick={close} className={row}>
                <LayoutDashboard aria-hidden="true" className="text-text-muted size-5" />
                Admin console
              </Link>
            </div>
          )}
          {me && (
            <button
              type="button"
              onClick={() => {
                close();
                void logout();
              }}
              className={cn(row, 'hover:text-danger-text text-left')}
            >
              <LogOut aria-hidden="true" className="size-5" />
              Log out
            </button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
