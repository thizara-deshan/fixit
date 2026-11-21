import { useState, type ReactNode } from 'react';
import { Bug } from 'lucide-react';
import { DEMO_PASSWORD, DEMO_PERSONAS, type PersonaKey } from '@fixit/fixtures';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { logout, signIn } from '@/features/auth/api';
import { useAuth } from '@/lib/auth-store';
import { ApiError } from '@/lib/http';

export function DevSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-border flex flex-col gap-2 border-t pt-4">
      <h3 className="text-label text-text font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function SessionSection() {
  const auth = useAuth();
  const [busy, setBusy] = useState<PersonaKey | 'logout' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: PersonaKey | 'logout', action: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? `Failed: ${e.code}${e.rule ? ` (${e.rule})` : ''}`
          : 'Failed: unexpected error',
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <DevSection title="Session">
        <p className="text-body-sm text-text-muted break-words">
          {auth.status === 'signed-in' && auth.me
            ? `Signed in as ${auth.me.email}, roles: ${auth.me.roles.join(', ')}`
            : 'Guest'}
        </p>
        <Button
          variant="outline"
          className="h-11"
          disabled={auth.status !== 'signed-in' || busy !== null}
          onClick={() => void run('logout', logout)}
        >
          {busy === 'logout' ? 'Logging out…' : 'Log out'}
        </Button>
      </DevSection>
      <DevSection title="Sign in as">
        {DEMO_PERSONAS.map((p) => (
          <Button
            key={p.key}
            variant="outline"
            className="h-auto min-h-11 justify-start whitespace-normal text-left"
            aria-label={`Sign in as ${p.label}`}
            disabled={busy !== null}
            onClick={() => void run(p.key, () => signIn({ email: p.email, password: DEMO_PASSWORD }))}
          >
            {busy === p.key ? 'Signing in…' : p.label}
          </Button>
        ))}
        {error && (
          <p role="alert" className="text-body-sm text-danger-text">
            {error}
          </p>
        )}
      </DevSection>
    </>
  );
}

/** Dev only (ARCH §4.5). Rendered from main.tsx behind import.meta.env.DEV. */
export function DevPanel() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open dev panel"
          className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-ring shadow-float fixed bottom-4 left-4 z-50 flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Bug className="size-5" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Dev panel</SheetTitle>
          <SheetDescription>Development only. Not in production builds.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <SessionSection />
        </div>
      </SheetContent>
    </Sheet>
  );
}
