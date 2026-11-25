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
import { ENDPOINTS } from '@fixit/contracts';
import { db, resetDemoData } from '../db/store';
import { activeMockDomains, isMocked } from '../enable';
import {
  ANY_ENDPOINT,
  armForcedError,
  clearForcedErrors,
  FORCED_KINDS,
  getControls,
  LATENCIES,
  setLatency,
  type ForcedKind,
  type Latency,
} from '../lib/controls';

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

const LATENCY_LABEL: Record<Latency, string> = {
  zero: '0',
  normal: 'normal (300–800 ms)',
  slow: 'slow (2 s)',
};
const FORCED_LABEL: Record<ForcedKind, string> = {
  '500': '500 Internal error',
  '409': '409 INVALID_TRANSITION',
  '401': '401 Unauthenticated',
  network: 'Network failure',
};
const selectClass =
  'border-border-control bg-surface text-body text-text focus-visible:ring-ring h-11 w-full rounded-md border px-3 focus-visible:ring-2 focus-visible:outline-none';

function MockControlsSections() {
  const [controls, setControls] = useState(getControls);
  const [target, setTarget] = useState<string>(ANY_ENDPOINT);
  const [kind, setKind] = useState<ForcedKind>('500');
  const refresh = () => {
    setControls(getControls());
  };
  const domains = activeMockDomains();
  const armed = Object.entries(controls.forced);

  return (
    <>
      <DevSection title="Mocked domains">
        <p className="text-body-sm text-text-muted">
          {domains.length > 0 ? domains.join(', ') : 'none (all real)'}
        </p>
      </DevSection>
      <DevSection title="Reset demo data">
        <Button
          variant="outline"
          className="h-11"
          disabled={domains.length === 0}
          onClick={() => {
            resetDemoData();
            window.location.reload();
          }}
        >
          Reset demo data
        </Button>
      </DevSection>
      <DevSection title="Latency">
        <div className="grid grid-cols-3 gap-2">
          {LATENCIES.map((l) => (
            <Button
              key={l}
              variant={controls.latency === l ? 'primary' : 'outline'}
              className="h-auto min-h-11 whitespace-normal"
              aria-pressed={controls.latency === l}
              onClick={() => {
                setLatency(l);
                refresh();
              }}
            >
              {LATENCY_LABEL[l]}
            </Button>
          ))}
        </div>
      </DevSection>
      <DevSection title="Force next error">
        <label className="text-body-sm text-text-muted flex flex-col gap-1">
          Endpoint
          <select
            className={selectClass}
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
            }}
          >
            <option value={ANY_ENDPOINT}>Any request</option>
            {Object.keys(ENDPOINTS).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <label className="text-body-sm text-text-muted flex flex-col gap-1">
          Error
          <select
            className={selectClass}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as ForcedKind);
            }}
          >
            {FORCED_KINDS.map((k) => (
              <option key={k} value={k}>
                {FORCED_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button
            className="h-11 flex-1"
            onClick={() => {
              armForcedError(target, kind);
              refresh();
            }}
          >
            Arm
          </Button>
          <Button
            variant="outline"
            className="h-11 flex-1"
            disabled={armed.length === 0}
            onClick={() => {
              clearForcedErrors();
              refresh();
            }}
          >
            Clear
          </Button>
        </div>
        <ul className="text-body-sm text-text-muted">
          {armed.length === 0 ? (
            <li>Nothing armed</li>
          ) : (
            armed.map(([t, k]) => (
              <li key={t}>
                {t === ANY_ENDPOINT ? 'Any request' : t} → {FORCED_LABEL[k]}
              </li>
            ))
          )}
        </ul>
        <p className="text-caption text-text-subtle">
          Each armed error fires once. Reopen the panel to see what is left.
        </p>
      </DevSection>
      <DevSection title="Last email link">
        <p className="text-body-sm text-text-muted break-all">
          {isMocked('auth') ? (db().lastEmailLink ?? 'None yet') : 'Only available when auth is mocked'}
        </p>
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
          <MockControlsSections />
        </div>
      </SheetContent>
    </Sheet>
  );
}
