import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/empty-state';

export type Area = 'public' | 'provider' | 'admin';
export type NotFoundVariant = 'generic' | 'provider' | 'request';

const HOME: Record<Area, { label: string; to: string }> = {
  public: { label: 'Go to home', to: '/' },
  provider: { label: 'Go to dashboard', to: '/dashboard' },
  admin: { label: 'Go to overview', to: '/admin' },
};

export function areaOf(pathname: string): Area {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'provider';
  if (pathname === '/admin' || (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login')))
    return 'admin';
  return 'public';
}

export function SystemFrame({ children }: { children: ReactNode }) {
  return <div className="max-w-content py-22 mx-auto w-full px-4">{children}</div>;
}

/** S39. */
export function NotFoundPage({
  area = 'public',
  variant = 'generic',
}: {
  area?: Area;
  variant?: NotFoundVariant;
}) {
  if (variant === 'provider') {
    return (
      <SystemFrame>
        <div className="border-border-strong bg-surface flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
          <h1 className="sr-only">Provider not found</h1>
          <p className="text-body-sm text-text-muted">This provider couldn&apos;t be found.</p>
          <Link
            to="/discover"
            className="text-label text-primary hover:text-primary-hover inline-flex min-h-11 items-center font-bold"
          >
            Browse all providers
          </Link>
        </div>
      </SystemFrame>
    );
  }
  if (variant === 'request') {
    const back =
      area === 'provider'
        ? { label: 'Go to requests', to: '/dashboard/requests' }
        : { label: 'Go to my requests', to: '/requests' };
    return (
      <SystemFrame>
        <EmptyState
          icon={SearchX}
          titleAs="h1"
          title="We can't find that request"
          body="Check the reference, or find it in your list."
          action={back}
        />
      </SystemFrame>
    );
  }
  return (
    <SystemFrame>
      <EmptyState
        icon={SearchX}
        titleAs="h1"
        title="We can't find that page"
        body="The link may be broken, or the page may have been removed."
        action={HOME[area]}
      />
    </SystemFrame>
  );
}
