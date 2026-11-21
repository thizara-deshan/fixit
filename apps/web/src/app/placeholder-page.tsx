import { RequestRef } from '@fixit/contracts';
import { useMe } from '@/features/auth/hooks';
import { useAuth } from '@/lib/auth-store';
import { ApiError } from '@/lib/http';

const sampleRef = RequestRef.parse('FX-2061');

export function PlaceholderPage() {
  const auth = useAuth();
  const me = useMe();
  return (
    <main className="max-w-content mx-auto flex min-h-dvh w-full flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-title-xl text-text">Fixit</h1>
      <p className="text-body text-text-muted">
        Foundation placeholder. The app shell replaces this page in M03.
      </p>
      <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body text-text break-words" aria-live="polite">
          {auth.status === 'signed-in' && auth.me
            ? `Signed in as ${auth.me.email}, roles: ${auth.me.roles.join(', ')}`
            : `Guest${auth.signOutReason ? ` (signed out: ${auth.signOutReason})` : ''}`}
        </p>
        {auth.status === 'signed-in' && (
          <button
            type="button"
            onClick={() => void me.refetch()}
            disabled={me.isFetching}
            className="border-border text-label text-text hover:bg-primary-soft focus-visible:ring-ring h-11 rounded-md border px-4 font-semibold focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
          >
            {me.isFetching ? 'Loading…' : 'Reload profile'}
          </button>
        )}
      </div>
      {me.error && (
        <p role="alert" className="text-body-sm text-danger-text">
          {`Profile request failed (${me.error instanceof ApiError ? me.error.code : 'error'})`}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="bg-primary text-label text-primary-foreground hover:bg-primary-hover h-12 rounded-md px-5 font-semibold transition-colors"
        >
          Find a provider
        </button>
        <button
          type="button"
          className="bg-cta text-label text-on-cta hover:bg-cta-hover h-12 rounded-md px-5 font-semibold transition-colors"
        >
          Join as a provider
        </button>
      </div>
      <span className="text-mono text-text-subtle font-mono">{sampleRef}</span>
    </main>
  );
}
