import { LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/features/auth/hooks';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { isPublicLinkActive, publicNavLinks, viewerRole } from '../nav-config';
import { AccountMenu } from './account-menu';
import { Logo } from './logo';
import { NavSheet } from './nav-sheet';

export function PublicNav({ variant = 'full' }: { variant?: 'full' | 'logo' }) {
  const { me } = useAuth();
  const { pathname } = useLocation();
  const logout = useLogout();
  const role = viewerRole(me);
  return (
    <header className="h-nav border-border bg-surface sticky top-0 z-10 border-b">
      <div className="max-w-content mx-auto flex h-full items-center gap-12 px-4 sm:px-6 lg:px-8">
        <Logo />
        {variant === 'full' && (
          <>
            <nav aria-label="Main" className="hidden h-full items-stretch gap-8 lg:flex">
              {publicNavLinks(role).map((l) => {
                const active = isPublicLinkActive(l.id, pathname);
                return (
                  <Link
                    key={l.id}
                    to={l.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'text-body-sm relative flex items-center font-semibold transition-colors',
                      active
                        ? 'text-primary after:bg-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5'
                        : 'text-text-muted hover:text-text',
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-2.5">
              {role === 'guest' && (
                <>
                  <Button asChild variant="secondary" className="hidden lg:inline-flex">
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button asChild className="hidden lg:inline-flex">
                    <Link to="/signup">Sign up</Link>
                  </Button>
                </>
              )}
              {role === 'provider' && (
                <Button asChild variant="outline" className="hidden lg:inline-flex">
                  <Link to="/dashboard">
                    <LayoutDashboard aria-hidden="true" />
                    Dashboard
                  </Link>
                </Button>
              )}
              {role === 'admin' && (
                <>
                  <Button asChild variant="outline" className="hidden lg:inline-flex">
                    <Link to="/admin">Admin console</Link>
                  </Button>
                  <Button
                    variant="secondary"
                    className="hidden lg:inline-flex"
                    onClick={() => {
                      void logout();
                    }}
                  >
                    Log out
                  </Button>
                </>
              )}
              {me && role !== 'admin' && <AccountMenu me={me} />}
              <NavSheet me={me} />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
