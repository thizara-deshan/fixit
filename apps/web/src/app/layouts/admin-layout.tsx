import { LogOut, ShieldCheck } from 'lucide-react';
import { Outlet } from 'react-router';
import { useAdminOverview } from '@/features/admin/hooks';
import { useLogout } from '@/features/auth/hooks';
import { useAuth } from '@/lib/auth-store';
import { features } from '@/lib/features';
import { initialsOf } from '@/lib/format';
import { adminSidebarItems } from './nav-config';
import { DashboardShell } from './parts/dashboard-shell';
import { footerLink } from './provider-layout';

export function AdminLayout() {
  const { me } = useAuth();
  const logout = useLogout();
  const overview = useAdminOverview();
  const pending = overview.data?.attention.pendingVerifications ?? 0;
  if (!me) return null; // RequireAdmin guarantees it
  return (
    <DashboardShell
      navLabel="Admin"
      badge={
        <span className="bg-footer-bg text-mono text-primary-foreground inline-flex h-[22px] items-center rounded-full px-2 font-bold">
          Admin
        </span>
      }
      items={adminSidebarItems(features, pending)}
      topBarAction={{ to: '/admin/verifications', label: 'Verification', icon: ShieldCheck, count: pending }}
      footer={(close) => (
        <>
          <div className="border-border flex items-center gap-3 rounded-lg border p-3">
            <span
              aria-hidden="true"
              className="bg-primary-soft text-label text-primary grid size-10 shrink-0 place-items-center rounded-full font-extrabold"
            >
              {initialsOf(me.fullName)}
            </span>
            <div className="min-w-0">
              <p className="text-label text-text truncate font-bold">{me.fullName}</p>
              <p className="text-caption text-text-subtle font-normal">Super admin</p>
            </div>
          </div>
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
