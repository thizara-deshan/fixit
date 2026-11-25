import { ArrowLeftRight, BriefcaseBusiness, Inbox, LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { useLogout } from '@/features/auth/hooks';
import { useAuth } from '@/lib/auth-store';
import { providerSidebarItems } from './nav-config';
import { DashboardShell } from './parts/dashboard-shell';

export const footerLink =
  'flex min-h-11 items-center gap-3 rounded-md px-3 text-label font-semibold text-text-muted transition-colors';

export function ProviderLayout() {
  const { me } = useAuth();
  const logout = useLogout();
  if (!me?.provider) return null; // RequireProvider guarantees both
  const p = me.provider;
  return (
    <DashboardShell
      navLabel="Dashboard"
      badge={
        <span className="bg-warning-soft text-mono text-warning-text inline-flex h-[22px] items-center rounded-full px-2 font-bold">
          Pro
        </span>
      }
      items={providerSidebarItems(me)}
      topBarAction={{
        to: '/dashboard/requests',
        label: 'Requests',
        icon: Inbox,
        count: p.pendingRequestCount,
      }}
      footer={(close) => (
        <>
          <div className="border-border flex items-center gap-3 rounded-lg border p-3">
            <span
              aria-hidden="true"
              className="bg-primary-soft text-primary grid size-10 shrink-0 place-items-center rounded-sm"
            >
              <BriefcaseBusiness className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-label text-text truncate font-bold">{p.businessName ?? 'Your business'}</p>
              <p className="text-caption text-text-subtle truncate font-normal">{me.fullName}</p>
            </div>
          </div>
          <Link to="/" onClick={close} className={`${footerLink} hover:text-text`}>
            <ArrowLeftRight aria-hidden="true" className="size-5" />
            Switch to booking
          </Link>
          <button
            type="button"
            onClick={() => {
              close();
              void logout();
            }}
            className={`${footerLink} hover:text-danger-text text-left`}
          >
            <LogOut aria-hidden="true" className="size-5" />
            Log out
          </button>
        </>
      )}
    >
      <Outlet />
    </DashboardShell>
  );
}
